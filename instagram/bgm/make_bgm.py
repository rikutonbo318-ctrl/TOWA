"""リール用BGMを自作で作る（自分で生成した音源なので著作権の心配なし）

  python make_bgm.py <曲番号> <動画.mp4> <出力.wav>

v2（2026-10-28）: 「スマホのスピーカーで鳴って気持ちいい」ことを優先して作り直した。
  - 0秒目からサビ（ドロップ）で始める。イントロで待たせない
  - ステレオ：コードはデチューンした分厚いシンセ、ハイハットは左右に振る
  - キック＋スネア＋16分ハイハットのはっきりしたビート、ベースはキックで沈める（ポンプ感）
  - 覚えやすいリードのメロディ（2小節の問いと答え）、軽いリバーブ
  - 120BPM（1小節2秒）で工程の切り替わりとノリを合わせ、場面転換にシュッ＋インパクト
  - 最後の「次回」の前で盛り上げて、ブレイク→締め
  曲1 = 明るいポップ（マリンバ風リード）、曲2 = ファンキー（シンセブラス風リード）
"""
import re, subprocess, sys, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
S16 = BEAT / 4
SONGS = {
    1: {  # F G Em Am → 明るく前向き
        'prog': [[53, 57, 60, 64], [55, 59, 62, 67], [52, 55, 59, 64], [57, 60, 64, 69]],
        # リード（16分の位置, MIDI, 長さ16分）2小節で1フレーズ
        'lead': [(0, 72, 2), (2, 74, 2), (4, 76, 3), (8, 79, 2), (10, 76, 2), (12, 74, 4),
                 (16, 72, 2), (18, 74, 2), (20, 76, 2), (22, 74, 2), (24, 72, 3), (28, 69, 4)],
        'tone': 'marimba',
    },
    2: {  # Am F C G → ノリよく
        'prog': [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]],
        'lead': [(0, 69, 1), (2, 72, 1), (3, 74, 2), (6, 72, 1), (8, 76, 3), (12, 74, 2), (14, 72, 2),
                 (16, 69, 1), (18, 72, 1), (19, 74, 2), (22, 76, 1), (24, 79, 3), (28, 76, 4)],
        'tone': 'brass',
    },
}


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def adsr(n, a=0.005, d=0.1, s=0.6, r=0.05):
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    rn = int(r * SR)
    if 0 < rn < n:
        e[-rn:] *= np.linspace(1, 0, rn)
    return e


def band(x, lo, hi):
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(f, len(x))


def saw(f, t, det=0.0):
    ph = (f * (1 + det) * t) % 1.0
    return 2 * ph - 1


def supersaw(m, dur, rng):
    """デチューンした7本のノコギリ波（左右で別々に）"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    L = np.zeros(n)
    R = np.zeros(n)
    for k, d in enumerate([-0.012, -0.007, -0.003, 0, 0.003, 0.007, 0.012]):
        ph = rng.random()
        s = 2 * ((f * (1 + d) * t + ph) % 1.0) - 1
        pan = (k - 3) / 3
        L += s * (1 - pan) / 2
        R += s * (1 + pan) / 2
    e = adsr(n, 0.01, 0.25, 0.55, 0.06)
    return band(L * e, 120, 5500) / 4, band(R * e, 120, 5500) / 4


def marimba(m, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.5 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) \
        + 0.25 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 60)
    return s * adsr(n, 0.002, 0.2, 0.3, 0.03)


def brass(m, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1)
    s = sum(saw(f * vib, t, d) for d in (-0.004, 0.004)) / 2
    s = band(s, 200, 2600 + 2400 * min(1, dur * 2))
    return s * adsr(n, 0.02, 0.15, 0.7, 0.04)


def kick():
    t = np.arange(int(SR * 0.35)) / SR
    body = np.sin(2 * np.pi * (48 * t + 140 / 30 * (1 - np.exp(-t * 30)))) * np.exp(-t * 8)
    click = np.exp(-t * 400) * 0.6
    return np.tanh((body + click) * 1.6)


def snare(rng):
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    nz = band(rng.standard_normal(n), 1200, 9000) * np.exp(-t * 18)
    return tone * 0.6 + nz * 0.8


def hat(rng, open_=False):
    n = int(SR * (0.25 if open_ else 0.05))
    t = np.arange(n) / SR
    return band(rng.standard_normal(n), 7000, 15000) * np.exp(-t * (14 if open_ else 90))


def bass(m, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * band(saw(f, t), 40, 900)
    return s * adsr(n, 0.004, 0.12, 0.8, 0.03)


def whoosh(rng, dur=0.5):
    n = int(SR * dur)
    w = band(rng.standard_normal(n), 400, 6000)
    return w * np.linspace(0, 1, n) ** 3


def impact(rng):
    n = int(SR * 1.0)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 * t + 60 / 6 * (1 - np.exp(-t * 6)))) * np.exp(-t * 4)
    return boom * 0.8 + band(rng.standard_normal(n), 2000, 10000) * np.exp(-t * 5) * 0.3


def reverb(x, rng, secs=1.2, wet=0.18):
    n = int(SR * secs)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 4.5)
    ir = band(ir, 300, 8000)
    m = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)]
    return x + y / np.max(np.abs(y) + 1e-9) * np.max(np.abs(x) + 1e-9) * wet


def declick(x, ms=3):
    """音の頭と尻尾を数ミリ秒でフェード（プチッというノイズを防ぐ）"""
    n = min(len(x) // 2, int(SR * ms / 1000))
    if n > 0:
        x = x.copy()
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


def scene_times(video):
    log = subprocess.run(['ffmpeg', '-i', video, '-vf', "select='gt(scene,0.08)',showinfo", '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    ts, last = [], -9
    for v in map(float, re.findall(r'pts_time:([0-9.]+)', log)):
        if v - last > 1:
            ts.append(v)
        last = v
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video],
                               capture_output=True, text=True).stdout)
    return ts, dur


def main(song, video, out):
    rng = np.random.default_rng(song)
    cfg = SONGS[song]
    hits, secs = scene_times(video)
    end = hits[-1] if hits and hits[-1] > secs - 6 else secs - 3   # 最後の場面（次回予告）
    N = int(SR * (secs + 2))
    drums = np.zeros((N, 2))
    music = np.zeros((N, 2))
    lead = np.zeros(N)
    fx = np.zeros((N, 2))

    def put(buf, sig, at, gain, pan=0.0):
        sig = declick(sig)
        i = int(at * SR)
        if i >= len(buf) or i < 0:
            return
        j = min(len(buf), i + len(sig))
        if buf.ndim == 1:
            buf[i:j] += sig[:j - i] * gain
        else:
            buf[i:j, 0] += sig[:j - i] * gain * (1 - pan) / 2 * 2 ** 0.5
            buf[i:j, 1] += sig[:j - i] * gain * (1 + pan) / 2 * 2 ** 0.5

    prog = cfg['prog']
    nbars = int(np.ceil(secs / BAR))
    brk = end - BAR  # 次回予告の1小節前はブレイク（キックを抜く）
    duck = np.ones(N)
    for bar in range(nbars):
        t0 = bar * BAR
        ch = prog[bar % len(prog)]
        in_break = brk <= t0 < end
        # コード：裏拍で刻む分厚いシンセ
        for q in range(4):
            for n_ in ch:
                L, R = supersaw(n_, BEAT * 0.42, rng)
                L, R = declick(L), declick(R)
                i = int((t0 + q * BEAT + BEAT / 2) * SR)
                j = min(N, i + len(L))
                if i < N:
                    music[i:j, 0] += L[:j - i] * 0.22
                    music[i:j, 1] += R[:j - i] * 0.22
        # ベース：8分で転がす
        for e in range(8):
            put(music, bass(ch[0] - 24 + (12 if e % 4 == 3 else 0), S16 * 1.8), t0 + e * S16 * 2, 0.5)
        # ドラム
        for q in range(4):
            tb = t0 + q * BEAT
            if not in_break:
                put(drums, kick(), tb, 0.95)
                k = int(tb * SR)
                L = int(SR * 0.22)
                duck[k:k + L] = np.minimum(duck[k:k + L], np.linspace(0.25, 1, len(duck[k:k + L])))
            if q in (1, 3):
                put(drums, snare(rng), tb, 0.55 if not in_break else 0.35)
            for s in range(4):
                put(drums, hat(rng, open_=(s == 2 and q % 2 == 1)), tb + s * S16, 0.14 if s % 2 else 0.08, pan=-0.5 if s % 2 else 0.5)
        # リード（2小節フレーズ）
        if not in_break and t0 < end + BAR:
            half = (bar % 2) * 16
            for pos, m, ln in cfg['lead']:
                if half <= pos < half + 16:
                    at = t0 + (pos - half) * S16
                    sig = marimba(m, ln * S16 + 0.3) if cfg['tone'] == 'marimba' else brass(m, ln * S16)
                    put(lead, sig, at, 0.32 if cfg['tone'] == 'marimba' else 0.22)
    # 最後の締め：次回予告の頭でインパクト＋コード1発
    put(fx, impact(rng), end, 0.6)
    for n_ in prog[0]:
        L, R = supersaw(n_ + 12, 1.6, rng)
        L, R = declick(L), declick(R)
        i = int(end * SR)
        j = min(N, i + len(L))
        music[i:j, 0] += L[:j - i] * 0.18
        music[i:j, 1] += R[:j - i] * 0.18
    # 場面転換にシュッ＋軽いインパクト
    for h in hits:
        if abs(h - end) < 0.5:
            continue
        put(fx, whoosh(rng, 0.4), h - 0.4, 0.22, pan=-0.3)
        put(fx, band(rng.standard_normal(int(SR * 0.6)), 3000, 11000) * np.exp(-np.arange(int(SR * 0.6)) / SR * 6), h, 0.08, pan=0.3)
    put(fx, whoosh(rng, BAR), brk, 0.4)   # ブレイクで盛り上げ

    music[:, 0] *= duck
    music[:, 1] *= duck
    lead = reverb(lead, rng)
    lead2 = np.stack([lead, np.roll(lead, int(SR * 0.012))], 1)  # 少しずらして広げる
    mix = drums + music + lead2 * 1.0 + fx
    mix = mix[:int(SR * secs)]
    fade = int(SR * 1.0)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.8) * 0.92
    pcm = (mix * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('場面転換', [round(h, 1) for h in hits], 'ブレイク→', round(brk, 1), '締め→', round(end, 1))


if __name__ == '__main__':
    main(int(sys.argv[1]), sys.argv[2], sys.argv[3])
