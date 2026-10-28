"""Facebookログイン版のトークン管理（流行りの曲をリールに付けるため）

Instagramの「音源API」は Facebookログイン版の API でしか使えないので、こちらは別に持つ。
トークンは fb_token.enc に暗号化して置く（鍵は Secrets の FB_APP_SECRET）。
  python fb_token.py exchange <code>   … 許可ボタンを押した後の code から60日トークンを作って保存
  python fb_token.py url               … 許可ボタンのURLを表示
"""
import json, os, subprocess, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENC = os.path.join(HERE, 'fb_token.enc')
APP_ID = '938289049135387'
CONFIG_ID = '1108129025539715'  # ビジネス向けFacebookログインの設定「reels-music-publish」
REDIRECT = 'https://github.com/rikutonbo318-ctrl/TOWA/'
GRAPH = 'https://graph.facebook.com/v21.0'


def http(url, data=None):
    body = urllib.parse.urlencode(data).encode() if data else None
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=body), timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Facebook API エラー {e.code}: {e.read().decode()}')


def openssl(args, data):
    os.environ['FB_APP_SECRET_KEY'] = os.environ['FB_APP_SECRET'].strip()
    return subprocess.run(['openssl', 'enc', '-aes-256-cbc', '-pbkdf2', '-pass', 'env:FB_APP_SECRET', *args],
                          input=data, capture_output=True, check=True).stdout


def save(d):
    d['saved'] = int(time.time())
    open(ENC, 'wb').write(openssl(['-salt'], json.dumps(d).encode()))


def load():
    """使えない時は None（その場合は今まで通り自作BGMだけで投稿する）"""
    if not (os.path.exists(ENC) and os.environ.get('FB_APP_SECRET')):
        return None
    try:
        d = json.loads(openssl(['-d'], open(ENC, 'rb').read()))
    except subprocess.CalledProcessError:
        return None
    if time.time() - d['saved'] > 58 * 86400:
        print('Facebookログインのトークンが切れています（60日）。許可ボタンをもう一度押してもらう')
        return None
    return d


def url():
    return 'https://www.facebook.com/v21.0/dialog/oauth?' + urllib.parse.urlencode({
        'client_id': APP_ID, 'redirect_uri': REDIRECT, 'config_id': CONFIG_ID, 'response_type': 'code', 'state': 'fb'})


def exchange(code):
    code = code.split('code=')[-1].split('#')[0].split('&')[0]
    secret = os.environ['FB_APP_SECRET'].strip()
    if len(secret) != 32 or any(ch not in '0123456789abcdef' for ch in secret):
        sys.exit(f'FB_APP_SECRET の形がちがいます（{len(secret)}文字）。Metaの app secret は英数字32文字です')
    try:
        http(f'{GRAPH}/oauth/access_token?' + urllib.parse.urlencode({
            'client_id': APP_ID, 'client_secret': secret, 'grant_type': 'client_credentials'}))
    except RuntimeError:
        sys.exit('FB_APP_SECRET が uzumaki-threads-poster（%s）の app secret と一致しません' % APP_ID)
    short = http(f'{GRAPH}/oauth/access_token?' + urllib.parse.urlencode({
        'client_id': APP_ID, 'client_secret': secret, 'redirect_uri': REDIRECT, 'code': code}))['access_token']
    long = http(f'{GRAPH}/oauth/access_token?' + urllib.parse.urlencode({
        'grant_type': 'fb_exchange_token', 'client_id': APP_ID, 'client_secret': secret, 'fb_exchange_token': short}))
    tok = long['access_token']
    pages = http(f'{GRAPH}/me/accounts?' + urllib.parse.urlencode({
        'fields': 'name,instagram_business_account{username}', 'access_token': tok})).get('data', [])
    ig = next((p['instagram_business_account'] for p in pages if p.get('instagram_business_account')), None)
    if not ig:
        # ビジネス向けログインでページを選ばなかった時は、許可されたインスタのIDをトークン情報から取る
        info = http(f'{GRAPH}/debug_token?' + urllib.parse.urlencode({
            'input_token': tok, 'access_token': f'{APP_ID}|{secret}'})).get('data', {})
        print('許可:', [g.get('scope') for g in info.get('granular_scopes', [])])
        ids = [t for g in info.get('granular_scopes', []) if g.get('scope', '').startswith('instagram_')
               for t in g.get('target_ids', [])]
        if not ids and os.environ.get('IG_APP_SECRET'):
            # 「すべてのアカウントにオプトイン」だとIDが入らないので、インスタログイン側のトークンからIDを取る
            import ig_token
            me = http('https://graph.instagram.com/v21.0/me?' + urllib.parse.urlencode({
                'fields': 'user_id,username', 'access_token': ig_token.load()['token']}))
            ids = [me['user_id']]
        if ids:
            ig = http(f'{GRAPH}/{ids[0]}?' + urllib.parse.urlencode({'fields': 'id,username', 'access_token': tok}))
    if not ig:
        sys.exit('インスタとつながったFacebookページが見つかりません（ページ: %s）' % [p.get('name') for p in pages])
    save({'token': tok, 'ig_user_id': ig['id'], 'username': ig.get('username', '')})
    print('保存しました:', ig.get('username'), '（有効期限 秒）:', long.get('expires_in'))


if __name__ == '__main__':
    if sys.argv[1] == 'exchange':
        exchange(sys.argv[2])
    else:
        print(url())
