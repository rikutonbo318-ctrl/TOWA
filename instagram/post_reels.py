"""Instagram リール・カルーセル自動投稿スクリプト（GitHub Actions から毎日 20:30 に呼ばれる）

queue.csv の「予定時刻を過ぎていて、まだ投稿していない行」を1件だけリールとして投稿し、
posted_at と media_id を書き込む。標準ライブラリだけで動く。

必要な環境変数:
  IG_APP_SECRET   Instagram アプリシークレット（GitHub の Secrets）。token.enc の鍵にもなる
  IG_TOKEN        （任意）直接トークンを渡す場合。なければ token.enc から読む
  VIDEO_BASE_URL  動画を置いた公開URLの先頭（アップロードに失敗した時の予備）
  FB_APP_SECRET   （任意）Facebookログイン版のトークン（fb_token.enc）があれば、リールに流行りの曲を付ける
"""
import csv, json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

API = 'https://graph.instagram.com/v21.0'
RUPLOAD = 'https://rupload.facebook.com/ig-api-upload/v21.0'
JST = timezone(timedelta(hours=9))
HERE = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(HERE, 'queue.csv')


def request(req):
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Instagram API エラー {e.code}: {e.read().decode()}')


def token():
    if not os.environ.get('IG_TOKEN'):
        import ig_token  # 同じフォルダの ig_token.py
        os.environ['IG_TOKEN'] = ig_token.load()['token']
    return os.environ['IG_TOKEN']


def call(method, path, **params):
    params['access_token'] = token()
    data = urllib.parse.urlencode(params)
    url = f'{API}/{path}'
    if method == 'GET':
        return request(urllib.request.Request(url + '?' + data))
    return request(urllib.request.Request(url, data=data.encode(), method='POST'))


def create_container(uid, row, caption):
    """まず動画ファイルを直接アップロードし、だめなら公開URLから取り込ませる"""
    path = os.path.join(HERE, row['video'])
    try:
        c = call('POST', f'{uid}/media', media_type='REELS', upload_type='resumable',
                 caption=caption, share_to_feed='true')
        body = open(path, 'rb').read()
        req = urllib.request.Request(f"{RUPLOAD}/{c['id']}", data=body, method='POST', headers={
            'Authorization': f"OAuth {token()}",
            'offset': '0', 'file_size': str(len(body))})
        print('アップロード:', request(req))
        return c['id']
    except RuntimeError as e:
        print('直接アップロードに失敗、URL取り込みに切り替え:', e)
    url = urllib.parse.urljoin(os.environ.get('VIDEO_BASE_URL', ''), row['video'])
    return call('POST', f'{uid}/media', media_type='REELS', video_url=url,
                caption=caption, share_to_feed='true')['id']


AUDIO_LOG = os.path.join(HERE, 'audio_used.csv')
MUSIC_VOLUME = 70   # 流行りの曲の音量（1〜100）
VIDEO_VOLUME = 35   # 動画に入っている自作BGM・効果音の音量（1〜100）


def pick_music(uid):
    """いま流行っている曲（他社アプリで使ってよい曲）から、最近使っていないものを選ぶ"""
    used = [r['audio_id'] for r in csv.DictReader(open(AUDIO_LOG, encoding='utf-8'))][-20:] if os.path.exists(AUDIO_LOG) else []
    items = call('GET', 'ig_audio', audio_type='music', user_id=uid).get('data', [])
    print('流行りの曲:', [(a.get('id'), a.get('title'), a.get('artist_name') or a.get('display_artist')) for a in items[:10]])
    for a in items:
        if a.get('id') and a['id'] not in used:
            return a
    return items[0] if items else None


def create_with_music(fb, row, caption):
    """Facebookログイン版のAPIで、流行りの曲を付けたリールの下書きを作る"""
    global API
    API = 'https://graph.facebook.com/v21.0'
    os.environ['IG_TOKEN'] = fb['token']
    uid = fb['ig_user_id']
    a = pick_music(uid)
    if not a:
        raise RuntimeError('使える曲が見つかりません')
    url = urllib.parse.urljoin(os.environ.get('VIDEO_BASE_URL', ''), row['video'])
    cid = call('POST', f'{uid}/media', media_type='REELS', video_url=url, caption=caption, share_to_feed='true',
               audio_configuration=json.dumps({'audio_id': a['id'], 'audio_volume': MUSIC_VOLUME, 'video_volume': VIDEO_VOLUME}))['id']
    new = not os.path.exists(AUDIO_LOG)
    with open(AUDIO_LOG, 'a', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['date', 'video', 'audio_id', 'title', 'artist'])
        if new:
            w.writeheader()
        w.writerow({'date': datetime.now(JST).strftime('%Y-%m-%d'), 'video': row['video'], 'audio_id': a['id'],
                    'title': a.get('title', ''), 'artist': a.get('artist_name') or a.get('display_artist') or ''})
    print('曲を付けました:', a.get('title'), a.get('id'))
    return uid, cid


def use_instagram_login():
    global API
    API = 'https://graph.instagram.com/v21.0'
    os.environ.pop('IG_TOKEN', None)


def create_carousel(uid, row, caption):
    """画像を | 区切りで並べた行はカルーセル（JPEG・公開URLから取り込み）"""
    base = os.environ.get('VIDEO_BASE_URL', '')
    children = [call('POST', f'{uid}/media', image_url=urllib.parse.urljoin(base, img),
                     is_carousel_item='true')['id'] for img in row['video'].split('|')]
    return call('POST', f'{uid}/media', media_type='CAROUSEL', children=','.join(children),
                caption=caption)['id']


def wait_ready(cid, soft=False):
    """soft=True のときは失敗を RuntimeError で返す（曲なしでやり直すため）"""
    def fail(msg):
        if soft:
            raise RuntimeError(msg)
        sys.exit(msg)

    for _ in range(40):  # 最大10分
        s = call('GET', cid, fields='status_code,status')
        print('処理状況:', s.get('status_code'), s.get('status', ''))
        if s.get('status_code') == 'FINISHED':
            return
        if s.get('status_code') in ('ERROR', 'EXPIRED'):
            return fail(f'動画の処理に失敗: {s}')
        time.sleep(15)
    return fail('動画の処理が10分で終わりませんでした')


def check():
    """公開せずに、次の動画をアップロードして処理が通るかだけ確かめる"""
    row = next(r for r in csv.DictReader(open(QUEUE, encoding='utf-8')) if not r['posted_at'])
    uid = call('GET', 'me', fields='user_id')['user_id']
    try:
        if row['video'].endswith('.jpg'):
            cid = create_carousel(uid, row, 'test')
        else:
            cid = create_container(uid, row, 'test')
    except RuntimeError as e:
        sys.exit(str(e))
    wait_ready(cid)
    print('確認 OK（公開はしていません）:', row['video'])


def main(dry=False):
    rows = list(csv.DictReader(open(QUEUE, encoding='utf-8')))
    now = datetime.now(JST)
    due = [r for r in rows if not r['posted_at']
           and datetime.fromisoformat(r['scheduled_jst']).replace(tzinfo=JST) <= now + timedelta(minutes=20)]
    if not due:
        # 投稿がない日もトークンが生きているか確かめる
        if not dry:
            print('トークン確認 OK:', call('GET', 'me', fields='username')['username'])
        print('投稿予定なし')
        return
    row = due[0]
    caption = open(os.path.join(HERE, row['caption']), encoding='utf-8').read().strip()
    print('投稿:', row['scheduled_jst'], row['video'])
    if dry:
        print(caption)
        return
    import fb_token
    fb = fb_token.load() if not row['video'].endswith('.jpg') else None
    cid = None
    if fb:
        try:
            uid, cid = create_with_music(fb, row, caption)
            wait_ready(cid, soft=True)
        except RuntimeError as e:
            print('流行りの曲つきは失敗、自作BGMだけで投稿します:', e)
            cid = None
            use_instagram_login()
    if not cid:
        uid = call('GET', 'me', fields='user_id')['user_id']
        try:
            if row['video'].endswith('.jpg'):
                cid = create_carousel(uid, row, caption)
            else:
                cid = create_container(uid, row, caption)
        except RuntimeError as e:
            sys.exit(str(e))
        wait_ready(cid)
    p = call('POST', f'{uid}/media_publish', creation_id=cid)
    row['posted_at'] = now.isoformat(timespec='minutes')
    row['media_id'] = p['id']
    with open(QUEUE, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
    print('完了 media_id =', p['id'])
    if row['comment']:
        try:
            call('POST', f"{p['id']}/comments", message=row['comment'])
            print('コメント追加（固定はアプリで手動）')
        except RuntimeError as e:
            print('コメントは追加できませんでした:', e)


if __name__ == '__main__':
    if '--check' in sys.argv:
        check()
    else:
        main(dry='--dry-run' in sys.argv)
