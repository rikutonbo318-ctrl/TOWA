"""Instagram のアクセストークン管理（GitHub Actions から呼ばれる）

トークンは token.enc に暗号化して置く（鍵は Secrets の IG_APP_SECRET）。
  python ig_token.py exchange <code>   … ログイン後の code から60日トークンを作って保存
  python ig_token.py refresh           … 20日以上たっていれば延長して保存（毎回の投稿前に呼ぶ）
"""
import json, os, subprocess, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENC = os.path.join(HERE, 'token.enc')
APP_ID = '1594284109062860'
REDIRECT = 'https://github.com/rikutonbo318-ctrl/TOWA/'


def http(url, data=None):
    body = urllib.parse.urlencode(data).encode() if data else None
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=body), timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'Instagram API エラー {e.code}: {e.read().decode()}')


def openssl(args, data):
    return subprocess.run(['openssl', 'enc', '-aes-256-cbc', '-pbkdf2', '-pass', 'env:IG_APP_SECRET', *args],
                          input=data, capture_output=True, check=True).stdout


def save(token):
    blob = json.dumps({'token': token, 'saved': int(time.time())}).encode()
    open(ENC, 'wb').write(openssl(['-salt'], blob))


def load():
    return json.loads(openssl(['-d'], open(ENC, 'rb').read()))


def exchange(code):
    code = code.split('code=')[-1].split('#')[0].split('&')[0]
    secret = os.environ['IG_APP_SECRET']
    short = http('https://api.instagram.com/oauth/access_token', {
        'client_id': APP_ID, 'client_secret': secret, 'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT, 'code': code})['access_token']
    long = http('https://graph.instagram.com/access_token?' + urllib.parse.urlencode({
        'grant_type': 'ig_exchange_token', 'client_secret': secret, 'access_token': short}))
    save(long['access_token'])
    print('60日トークンを保存しました（有効期限 秒）:', long.get('expires_in'))


def refresh():
    t = load()
    if time.time() - t['saved'] < 20 * 86400:
        print('トークン延長は不要')
        return
    r = http('https://graph.instagram.com/refresh_access_token?' + urllib.parse.urlencode({
        'grant_type': 'ig_refresh_token', 'access_token': t['token']}))
    save(r['access_token'])
    print('トークンを延長しました')


if __name__ == '__main__':
    if sys.argv[1] == 'exchange':
        exchange(sys.argv[2])
    elif sys.argv[1] == 'refresh':
        refresh()
