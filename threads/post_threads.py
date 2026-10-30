"""Threads 自動投稿スクリプト（GitHub Actions から1日5回＋保険で呼ばれる）

queue.csv の「予定時刻を過ぎていて、まだ投稿していない行」を1件だけ投稿し、
posted_at と post_id を書き込む。標準ライブラリだけで動く。
- image が .mp4 なら動画（インスタのリールをそのまま使う）、画像ならIMAGE、空ならTEXT
- topic 列があればトピックタグを付ける（1投稿1つ）
- reply 列があれば、公開直後に自分の投稿へ返信する（noteのリンクはここに置く）
- 毎回、直近の投稿の数字を stats.csv / stats_latest.md に記録する
- 毎回、自分の投稿についた返信を見て、キーワードに合うものにだけnoteの案内を返す（answered.csv に記録）

必要な環境変数:
  THREADS_TOKEN   Threads の長期アクセストークン（GitHub の Secrets に入れる）
  IMAGE_BASE_URL  画像を置いた公開URLの先頭（例 https://raw.githubusercontent.com/<ユーザー>/<リポジトリ>/main/）
"""
import csv, json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

API = 'https://graph.threads.net/v1.0'
JST = timezone(timedelta(hours=9))
QUEUE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'queue.csv')


class ApiError(Exception):
    pass


def call(method, path, soft=False, **params):
    params['access_token'] = os.environ['THREADS_TOKEN']
    data = urllib.parse.urlencode(params).encode()
    url = f'{API}/{path}'
    if method == 'GET':
        req = urllib.request.Request(url + '?' + data.decode())
    else:
        req = urllib.request.Request(url, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        msg = f'Threads API エラー {e.code}: {e.read().decode()}'
        if soft:
            raise ApiError(msg)
        sys.exit(msg)


def create(uid, **params):
    # トピックタグが使えない種類の投稿だった時は、タグなしでやり直す
    if params.get('topic_tag'):
        try:
            return call('POST', f'{uid}/threads', soft=True, **params)
        except ApiError as e:
            print('トピックなしでやり直し:', e)
            params.pop('topic_tag')
    return call('POST', f'{uid}/threads', **params)


def wait_ready(cid, video):
    # 画像は30秒待てばよい。動画は処理が終わるまで状態を見に行く
    time.sleep(30)
    if not video:
        return
    for _ in range(30):
        st = call('GET', cid, fields='status,error_message')
        if st.get('status') == 'FINISHED':
            return
        if st.get('status') == 'ERROR':
            sys.exit(f'動画の処理に失敗: {st}')
        time.sleep(10)
    sys.exit('動画の処理が5分で終わりませんでした')


STATS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stats.csv')
LATEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stats_latest.md')
METRICS = ['views', 'likes', 'replies', 'reposts', 'quotes', 'shares']


def stats(rows):
    # 直近14日の投稿の数字。権限がない等で取れなくても投稿は止めない
    today = datetime.now(JST).date().isoformat()
    got = []
    for r in rows:
        if not r.get('post_id') or not r.get('posted_at'):
            continue
        if datetime.fromisoformat(r['posted_at']) < datetime.now(JST) - timedelta(days=14):
            continue
        try:
            d = call('GET', f"{r['post_id']}/insights", soft=True, metric=','.join(METRICS))
        except ApiError as e:
            print('数字の取得をスキップ:', e)
            return
        v = {m['name']: (m.get('values') or [{}])[0].get('value', m.get('total_value', {}).get('value', 0)) for m in d.get('data', [])}
        got.append([today, r['post_id'], r['posted_at'], r['image']] + [v.get(m, 0) for m in METRICS])
    if not got:
        return
    try:
        fol = call('GET', 'me/threads_insights', soft=True, metric='followers_count')
        followers = fol['data'][0].get('total_value', {}).get('value', '')
    except (ApiError, KeyError, IndexError):
        followers = ''
    if followers != '':
        fp = os.path.join(os.path.dirname(STATS), 'followers.csv')
        hist = list(csv.reader(open(fp, encoding='utf-8'))) if os.path.exists(fp) else [['date', 'followers']]
        hist = [hist[0]] + [x for x in hist[1:] if x[0] != today] + [[today, followers]]
        with open(fp, 'w', encoding='utf-8', newline='') as f:
            csv.writer(f).writerows(hist)
    old = list(csv.reader(open(STATS, encoding='utf-8'))) if os.path.exists(STATS) else [['date', 'post_id', 'posted_at', 'media'] + METRICS]
    keep = [old[0]] + [x for x in old[1:] if x[0] != today]
    with open(STATS, 'w', encoding='utf-8', newline='') as f:
        csv.writer(f).writerows(keep + got)
    got.sort(key=lambda x: -int(x[4] or 0))
    lines = [f'# Threads の数字（{today} 時点）', '', f'**フォロワー {followers} 人**', '',
             '| 投稿 | 投稿日時 | 閲覧 | いいね | 返信 | 再投稿 | 引用 | シェア |', '|---|---|---|---|---|---|---|---|']
    lines += [f'| {x[3]} | {x[2]} | ' + ' | '.join(str(y) for y in x[4:]) + ' |' for x in got]
    open(LATEST, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))

ANSWERED = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'answered.csv')
NOTE_AI = 'https://note.com/uzumaki_kensetu/n/n8eb11ba8c893'
NOTE_PERTH = 'https://note.com/uzumaki_kensetu/n/n6f8296a2097c'
NOTE_CHECK = 'https://note.com/uzumaki_kensetu/n/n56a3485e69c9'
# 返信の中にこの言葉があれば、対応するnoteを案内する。合わない返信には自動で返さない（機械っぽい返事は逆効果）
KEYWORDS = [
    (('AI', 'ＡＩ', '指示文', 'テンプレ', 'プロンプト', 'GPT', 'Claude'),
     'ありがとうございます！AI社員7人の指示文と作り方はここにまとめています。\n' + NOTE_AI),
    (('パース', '作り方', 'ソフト', 'CG'),
     'ありがとうございます！パースの作り方はここにまとめています。\n' + NOTE_PERTH
     + '\nご自宅の外構パースをご希望なら、DMで「パース」と送ってください。'),
    (('見学', 'チェック', '工程', '建てる', '新築'),
     'ありがとうございます！工程ごとの「現場で見るところ・聞くこと」はここにまとめています。\n' + NOTE_CHECK),
]


def answer_replies(rows):
    # 直近3日の自分の投稿についた返信に、キーワードが合うものだけ1回ずつ答える
    try:
        me = call('GET', 'me', soft=True, fields='id,username')
    except ApiError as e:
        print('返信チェックをスキップ:', e)
        return
    done = {x[0] for x in csv.reader(open(ANSWERED, encoding='utf-8'))} if os.path.exists(ANSWERED) else set()
    new = []
    for r in rows:
        if not r.get('post_id') or not r.get('posted_at'):
            continue
        if datetime.fromisoformat(r['posted_at']) < datetime.now(JST) - timedelta(days=3):
            continue
        try:
            reps = call('GET', f"{r['post_id']}/replies", soft=True, fields='id,text,username').get('data', [])
        except ApiError as e:
            print('返信の取得をスキップ:', e)
            return
        for rep in reps:
            if rep['id'] in done or rep.get('username') == me['username']:
                continue
            text = rep.get('text') or ''
            ans = next((a for kws, a in KEYWORDS if any(k in text for k in kws)), None)
            if ans:
                try:
                    c = call('POST', f"{me['id']}/threads", soft=True, media_type='TEXT', text=ans.replace('\\n', '\n'), reply_to_id=rep['id'])
                    time.sleep(10)
                    call('POST', f"{me['id']}/threads_publish", soft=True, creation_id=c['id'])
                except ApiError as e:
                    print('自動返信に失敗:', e)
                    continue
            new.append([rep['id'], r['post_id'], rep.get('username', ''), datetime.now(JST).isoformat(timespec='minutes'),
                        'answered' if ans else 'seen', text.replace('\n', ' ')[:200]])
            done.add(rep['id'])
    if new:
        with open(ANSWERED, 'a', encoding='utf-8', newline='') as f:
            csv.writer(f).writerows(new)
        print('返信チェック:', len(new), '件')


def main(dry=False):
    rows = list(csv.DictReader(open(QUEUE, encoding='utf-8')))
    now = datetime.now(JST)
    due = [r for r in rows if not r['posted_at']
           and datetime.fromisoformat(r['scheduled_jst']).replace(tzinfo=JST) <= now + timedelta(minutes=20)]
    if not due:
        # 投稿がない回もトークンが生きているか確かめる
        if os.environ.get('THREADS_TOKEN') and not dry:
            print('トークン確認 OK:', call('GET', 'me', fields='username')['username'])
            stats(rows)
            answer_replies(rows)
        print('投稿予定なし')
        return
    row = due[0]
    text = row['text'].replace('\\n', '\n')
    image = urllib.parse.urljoin(os.environ.get('IMAGE_BASE_URL', ''), row['image'])
    print('投稿:', row['scheduled_jst'], image)
    if dry:
        print(text)
        return
    uid = call('GET', 'me', fields='id')['id']
    topic = {'topic_tag': row['topic']} if row.get('topic') else {}
    video = row['image'].endswith('.mp4')
    if video:
        c = create(uid, media_type='VIDEO', video_url=image, text=text, **topic)
    elif row['image']:
        c = create(uid, media_type='IMAGE', image_url=image, text=text, **topic)
    else:
        c = create(uid, media_type='TEXT', text=text, **topic)
    wait_ready(c['id'], video)  # 公式推奨：コンテナ作成から公開まで約30秒待つ
    p = call('POST', f'{uid}/threads_publish', creation_id=c['id'])
    row['posted_at'] = now.isoformat(timespec='minutes')
    row['post_id'] = p['id']
    if row.get('reply'):
        # 自分の投稿へすぐ返信：会話が続く投稿として扱われやすく、リンクも本文の外に置ける
        try:
            rc = call('POST', f'{uid}/threads', soft=True, media_type='TEXT', text=row['reply'].replace('\\n', '\n'), reply_to_id=p['id'])
            time.sleep(10)
            call('POST', f'{uid}/threads_publish', soft=True, creation_id=rc['id'])
        except ApiError as e:
            print('返信は失敗（投稿は済み）:', e)
    with open(QUEUE, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
    print('完了 post_id =', p['id'])
    stats(rows)
    answer_replies(rows)


if __name__ == '__main__':
    if '--refresh-token' in sys.argv:
        # 長期トークン（60日）の延長。50日ごとに実行して Secrets を更新する
        print(call('GET', 'refresh_access_token', grant_type='th_refresh_token'))
    else:
        main(dry='--dry-run' in sys.argv)
