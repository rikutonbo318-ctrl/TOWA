"""「みんなで建てる家」の投票を数える（GitHub Actions の毎時の回から、日本時間16時台に1日1回だけ動く）

queue.csv で投稿済みの最新の videos/minnade*.mp4 のコメントを読み、
1人1票（その人の最初の A / B）で数えて minnade_votes.md に1行追記する。
"""
import csv, os, re, sys, unicodedata
from datetime import datetime
import post_reels as pr

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'minnade_votes.md')


def vote(text):
    t = unicodedata.normalize('NFKC', text or '').upper()
    m = re.search(r'(?<![A-Z])([AB])(?![A-Z])', t)
    return m.group(1) if m else None


def main(force=False):
    now = datetime.now(pr.JST)
    if not force and now.hour != 16:
        return
    rows = [r for r in csv.DictReader(open(pr.QUEUE, encoding='utf-8'))
            if os.path.basename(r['video']).startswith('minnade') and r['media_id']]
    if not rows:
        print('みんなで建てる家：まだ投稿なし')
        return
    r = rows[-1]
    ep = re.search(r'minnade(\d+)', r['video']).group(1)
    tag = f"#{ep} "
    if os.path.exists(OUT) and any(l.startswith(tag) for l in open(OUT, encoding='utf-8')):
        print('集計済み:', tag)
        return
    me = pr.call('GET', 'me', fields='username')['username']
    seen, n = set(), {'A': 0, 'B': 0}
    page = pr.call('GET', f"{r['media_id']}/comments", fields='text,username,timestamp', limit='50')
    comments = []
    while True:
        comments += page.get('data', [])
        nxt = page.get('paging', {}).get('cursors', {}).get('after')
        if not nxt or not page.get('paging', {}).get('next'):
            break
        page = pr.call('GET', f"{r['media_id']}/comments", fields='text,username,timestamp', limit='50', after=nxt)
    for c in sorted(comments, key=lambda c: c.get('timestamp', '')):
        u = c.get('username')
        if u == me or u in seen:
            continue
        v = vote(c.get('text'))
        if v:
            seen.add(u)
            n[v] += 1
    line = f"{tag}A {n['A']} / B {n['B']}（{now.strftime('%m/%d %H:%M')} 集計・コメント{len(comments)}件）"
    with open(OUT, 'a', encoding='utf-8') as f:
        f.write(line + '\n')
    print('集計:', line)


if __name__ == '__main__':
    main(force='--force' in sys.argv)
