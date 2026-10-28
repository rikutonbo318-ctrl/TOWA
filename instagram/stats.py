"""投稿した Instagram の数字を集める（GitHub Actions から毎日呼ばれる）

queue.csv で投稿済み（media_id あり）の投稿について、いいね・コメントと、
権限があれば再生数・リーチ・保存・シェア・平均視聴時間を取って stats.csv に1日1行ずつ足す。
最新の数字は stats_latest.md にまとめ、次の動画づくりの材料にする。
"""
import csv, os, sys
from datetime import datetime, timedelta, timezone

from post_reels import HERE, QUEUE, call

JST = timezone(timedelta(hours=9))
STATS = os.path.join(HERE, 'stats.csv')
LATEST = os.path.join(HERE, 'stats_latest.md')
FIELDS = ['date', 'media_id', 'video', 'posted_at', 'likes', 'comments', 'views', 'reach', 'saved', 'shares', 'interactions', 'avg_watch_ms']
REEL_METRICS = 'views,reach,saved,shares,total_interactions,ig_reels_avg_watch_time'
POST_METRICS = 'views,reach,saved,shares,total_interactions'


def insights(media_id, metrics):
    try:
        data = call('GET', f'{media_id}/insights', metric=metrics)['data']
    except RuntimeError as e:
        print('インサイトなし（権限がまだの可能性）:', str(e)[:160])
        return {}
    return {d['name']: d['values'][0]['value'] for d in data}


def main():
    today = datetime.now(JST).strftime('%Y-%m-%d')
    rows = [r for r in csv.DictReader(open(QUEUE, encoding='utf-8')) if r.get('media_id')]
    old = list(csv.DictReader(open(STATS, encoding='utf-8'))) if os.path.exists(STATS) else []
    old = [r for r in old if r['date'] != today]  # 同じ日に2回動いたら上書き
    new = []
    for r in rows:
        m = call('GET', r['media_id'], fields='like_count,comments_count,media_type')
        reel = r['video'].endswith('.mp4')
        ins = insights(r['media_id'], REEL_METRICS if reel else POST_METRICS)
        new.append({'date': today, 'media_id': r['media_id'], 'video': r['video'].split('|')[0], 'posted_at': r['posted_at'],
                    'likes': m.get('like_count', ''), 'comments': m.get('comments_count', ''),
                    'views': ins.get('views', ''), 'reach': ins.get('reach', ''), 'saved': ins.get('saved', ''),
                    'shares': ins.get('shares', ''), 'interactions': ins.get('total_interactions', ''),
                    'avg_watch_ms': ins.get('ig_reels_avg_watch_time', '')})
    with open(STATS, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(old + new)

    def num(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    lines = [f'# Instagram の数字（{today} 時点）', '',
             '| 投稿 | 投稿日時 | 再生 | リーチ | 保存 | シェア | いいね | コメント | 平均視聴(秒) | 保存率 |',
             '|---|---|---|---|---|---|---|---|---|---|']
    for r in sorted(new, key=lambda r: -num(r['views'] or r['likes'])):
        rate = f"{num(r['saved']) / num(r['reach']) * 100:.1f}%" if num(r['reach']) else '-'
        watch = f"{num(r['avg_watch_ms']) / 1000:.1f}" if r['avg_watch_ms'] != '' else '-'
        lines.append(f"| {r['video']} | {r['posted_at']} | {r['views'] or '-'} | {r['reach'] or '-'} | {r['saved'] or '-'} | {r['shares'] or '-'} | {r['likes']} | {r['comments']} | {watch} | {rate} |")
    open(LATEST, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))


if __name__ == '__main__':
    sys.path.insert(0, HERE)
    main()
