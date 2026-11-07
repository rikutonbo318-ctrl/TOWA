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
        '動画の続き（耐震等級・水の流れ・カーポートなど、打ち合わせで決まる6つ）と、全22工程の現場見学チェックリストはこちらです\n'
        'https://note.com/uzumaki_kensetu/n/n56a3485e69c9\n'
        '無料版のコンセントの回はプロフィールのnoteから読めます。')

REPLY = ('コメントありがとうございます！📋 全22工程の現場見学チェックリストは、'
         'プロフィールのリンク（note）から見られます。動画の続き（打ち合わせで決まる6つ）も入っています。')


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
                print('DMを送れませんでした（許可が無い）→ コメントで返信:', e)
                try:
                    pr.call('POST', f"{c['id']}/replies", message=REPLY)
                    status = 'replied'
                except RuntimeError as e2:
                    print('コメント返信も失敗:', e2)
                    stop = True  # 記録しない＝次回に送り直す
                    break
            new.append([c['id'], r['media_id'], c.get('username', ''), datetime.now(JST).isoformat(timespec='minutes'), status])
            done.add(c['id'])
    if new:
        with open(SENT, 'a', encoding='utf-8', newline='') as f:
            csv.writer(f).writerows(new)
    print('DMチェック:', len(new), '件')
    try:  # DMの許可があるかの確認（読むだけ）
        pr.call('GET', 'me/conversations', platform='instagram', limit=1)
        print('DMの許可: OK')
    except RuntimeError as e:
        print('DMの許可: なし', e)


if __name__ == '__main__':
    main()
