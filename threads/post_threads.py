"""Threads 自動投稿スクリプト（GitHub Actions から1日2回呼ばれる）

queue.csv の「予定時刻を過ぎていて、まだ投稿していない行」を1件だけ投稿し、
posted_at と post_id を書き込む。標準ライブラリだけで動く。

必要な環境変数:
  THREADS_TOKEN   Threads の長期アクセストークン（GitHub の Secrets に入れる）
  IMAGE_BASE_URL  画像を置いた公開URLの先頭（例 https://raw.githubusercontent.com/<ユーザー>/<リポジトリ>/main/）
"""
import csv, json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

API = 'https://graph.threads.net/v1.0'
JST = timezone(timedelta(hours=9))
QUEUE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'queue.csv')


def call(method, path, **params):
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
        sys.exit(f'Threads API エラー {e.code}: {e.read().decode()}')


def main(dry=False):
    rows = list(csv.DictReader(open(QUEUE, encoding='utf-8')))
    now = datetime.now(JST)
    due = [r for r in rows if not r['posted_at']
           and datetime.fromisoformat(r['scheduled_jst']).replace(tzinfo=JST) <= now + timedelta(minutes=20)]
    if not due:
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
    if row['image']:
        c = call('POST', f'{uid}/threads', media_type='IMAGE', image_url=image, text=text)
    else:
        c = call('POST', f'{uid}/threads', media_type='TEXT', text=text)
    time.sleep(30)  # 公式推奨：コンテナ作成から公開まで約30秒待つ
    p = call('POST', f'{uid}/threads_publish', creation_id=c['id'])
    row['posted_at'] = now.isoformat(timespec='minutes')
    row['post_id'] = p['id']
    with open(QUEUE, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
    print('完了 post_id =', p['id'])


if __name__ == '__main__':
    if '--refresh-token' in sys.argv:
        # 長期トークン（60日）の延長。50日ごとに実行して Secrets を更新する
        print(call('GET', 'refresh_access_token', grant_type='th_refresh_token'))
    else:
        main(dry='--dry-run' in sys.argv)
