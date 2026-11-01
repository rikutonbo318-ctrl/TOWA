"""「チェック」とコメントした人に、そのコメントへの返信DM（private reply）でnoteを送る

直近7日の自分の投稿のコメントを見て、キーワードを含む未対応のコメントに1回だけ送る。
送った記録は dm_sent.csv。DMの許可（instagram_business_manage_messages）が無い時は、何もせずに知らせるだけ。
"""
import csv, json, os, sys
from datetime import datetime, timedelta, timezone
import post_reels as pr

JST = timezone(timedelta(hours=9))
HERE = os.path.dirname(os.path.abspath(__file__))
SENT = os.path.join(HERE, 'dm_sent.csv')
KEYWORDS = ('チェック', 'ちぇっく', 'check', 'CHECK')
TEXT = ('コメントありがとうございます！\n'
        '全22工程の現場見学チェックリストはこちらです（11/8まで500円）\n'
        'https://note.com/uzumaki_kensetu/n/n56a3485e69c9\n'
        '無料版のコンセントの回はプロフィールのnoteから読めます。')


def main():
    rows = list(csv.DictReader(open(pr.QUEUE, encoding='utf-8')))
    me = pr.call('GET', 'me', fields='user_id,username')
    done = {x[0] for x in csv.reader(open(SENT, encoding='utf-8'))} if os.path.exists(SENT) else set()
    new = []
    stop = False
    for r in rows:
        if stop:
            break
        if not r.get('media_id') or not r.get('posted_at'):
            continue
        if datetime.fromisoformat(r['posted_at']) < datetime.now(JST) - timedelta(days=7):
            continue
        try:
            cs = pr.call('GET', f"{r['media_id']}/comments", fields='id,text,username').get('data', [])
        except RuntimeError as e:
            print('コメントの取得をスキップ:', e)
            continue
        for c in cs:
            if c['id'] in done or c.get('username') == me.get('username'):
                continue
            if not any(k in (c.get('text') or '') for k in KEYWORDS):
                continue
            try:
                pr.call('POST', f"{me['user_id']}/messages",
                        recipient=json.dumps({'comment_id': c['id']}), message=json.dumps({'text': TEXT}, ensure_ascii=False))
                status = 'sent'
            except RuntimeError as e:
                print('DMを送れませんでした（許可が無い可能性）:', e)
                status = 'failed'
            if status == 'failed':
                stop = True  # 記録しない＝許可を直したあとに送り直す
                break
            new.append([c['id'], r['media_id'], c.get('username', ''), datetime.now(JST).isoformat(timespec='minutes'), status])
            done.add(c['id'])
    if new:
        with open(SENT, 'a', encoding='utf-8', newline='') as f:
            csv.writer(f).writerows(new)
    print('DMチェック:', len(new), '件')


if __name__ == '__main__':
    main()
