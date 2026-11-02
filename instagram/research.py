"""他のアカウントの最近の投稿を見る（Business Discovery）：RESEARCH_USER=xxx python research.py"""
import json, os, sys, urllib.parse, urllib.request
import fb_token

fb = fb_token.load()
if not fb:
    sys.exit('Facebookログインのトークンがありません')
user = os.environ['RESEARCH_USER'].strip().lstrip('@')
fields = (f"business_discovery.username({user})"
          "{username,followers_count,media_count,biography,"
          "media.limit(30){timestamp,media_type,media_product_type,like_count,comments_count,caption,permalink}}")
url = f"https://graph.facebook.com/v22.0/{fb['ig_user_id']}?" + urllib.parse.urlencode({'fields': fields, 'access_token': fb['token']})
try:
    d = json.load(urllib.request.urlopen(url, timeout=60))['business_discovery']
except urllib.error.HTTPError as e:
    sys.exit(e.read().decode())
print('ACCOUNT', d.get('username'), 'followers', d.get('followers_count'), 'posts', d.get('media_count'))
print('BIO', (d.get('biography') or '').replace('\n', ' / '))
for m in d.get('media', {}).get('data', []):
    cap = (m.get('caption') or '').replace('\n', ' / ')[:400]
    print('---', m['timestamp'][:10], m.get('media_product_type'), 'like', m.get('like_count'), 'com', m.get('comments_count'), m.get('permalink'))
    print('   ', cap)
