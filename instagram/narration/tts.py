"""VOICEVOX でナレーションを作る（GitHub Actions で VOICEVOX エンジンを立てて実行）
入力: narration/<ID>.json  [{"id": "01", "text": "..."}, ...]   出力: remotion/public/voice/<ID>/<id>.wav と durations.json
"""
import json, os, sys, urllib.parse, urllib.request, wave

ENGINE = os.environ.get('VOICEVOX_URL', 'http://localhost:50021')
SPEAKER = int(os.environ.get('VOICEVOX_SPEAKER', '13'))  # 13 = 青山龍星（ノーマル）
SPEED = float(os.environ.get('VOICEVOX_SPEED', '1.12'))

def post(path, data=None, **q):
    url = f'{ENGINE}/{path}?' + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    return urllib.request.urlopen(req, timeout=120).read()

def main(nid):
    here = os.path.dirname(os.path.abspath(__file__))
    lines = json.load(open(os.path.join(here, f'{nid}.json'), encoding='utf-8'))
    out = os.path.join(here, '..', 'remotion', 'public', 'voice', nid)
    os.makedirs(out, exist_ok=True)
    durs = {}
    for ln in lines:
        q = json.loads(post('audio_query', text=ln['text'], speaker=SPEAKER))
        q['speedScale'] = ln.get('speed', SPEED)
        q['prePhonemeLength'] = 0.05
        q['postPhonemeLength'] = 0.1
        wav = post('synthesis', data=json.dumps(q).encode(), speaker=SPEAKER)
        p = os.path.join(out, f"{ln['id']}.wav")
        open(p, 'wb').write(wav)
        with wave.open(p) as w:
            durs[ln['id']] = round(w.getnframes() / w.getframerate(), 3)
        print(ln['id'], durs[ln['id']], ln['text'])
    json.dump(durs, open(os.path.join(out, 'durations.json'), 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main(sys.argv[1])
