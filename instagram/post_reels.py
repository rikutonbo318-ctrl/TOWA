"""Instagram リール自動投稿スクリプト（GitHub Actions から毎日 20:30 に呼ばれる）

queue.csv の「予定時刻を過ぎていて、まだ投稿していない行」を1件だけリールとして投稿し、
posted_at と media_id を書き込む。標準ライブラリだけで動く。

必要な環境変数:
  IG_APP_SECRET   Instagram アプリシークレット（GitHub の Secrets）。token.enc の鍵にもなる
  IG_TOKEN        （任意）直接トークンを渡す場合。なければ token.enc から読む
  VIDEO_BASE_URL  動画を置いた公開URLの先頭（アップロードに失敗した時の予備）
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


def wait_ready(cid):
    for _ in range(40):  # 最大10分
        s = call('GET', cid, fields='status_code,status')
        print('処理状況:', s.get('status_code'), s.get('status', ''))
        if s.get('status_code') == 'FINISHED':
            return
        if s.get('status_code') in ('ERROR', 'EXPIRED'):
            sys.exit(f'動画の処理に失敗: {s}')
        time.sleep(15)
    sys.exit('動画の処理が10分で終わりませんでした')


def check():
    """公開せずに、次の動画をアップロードして処理が通るかだけ確かめる"""
    row = next(r for r in csv.DictReader(open(QUEUE, encoding='utf-8')) if not r['posted_at'])
    uid = call('GET', 'me', fields='user_id')['user_id']
    try:
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
    uid = call('GET', 'me', fields='user_id')['user_id']
    try:
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
