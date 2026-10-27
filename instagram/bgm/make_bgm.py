"""リール用BGMを自作で作る（自分で生成した音源なので著作権の心配なし）

  python make_bgm.py <曲番号> <動画.mp4> <出力.wav>

リールで伸びやすい作りにしている:
  - 0秒目からキックとフック（イントロで待たせない）
  - 120BPM（1小節2秒）で、工程が切り替わる2秒刻みの映像とノリが合う
  - 動画の場面転換を自動で拾い、その瞬間にシュッ＋アクセントを入れる
  - 歌なし（テロップを読む邪魔をしない）、最後の「次回」で盛り上げて止める
"""
import re, subprocess, sys, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
PROG = {  # コード進行（MIDIノート番号）
    1: [[53, 57, 60, 64], [55, 59, 62, 65], [57, 60, 64, 67], [55, 60, 64, 67]],  # F G Am C（前向き）
    2: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 60, 64, 67], [55, 59, 62, 65]],  # Am F C G
}
HOOK = [0, None, 2, 3, None, 2, 1, None]  # 1小節のフック（コード音の番号、8分音符）


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def env(n, a, d):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / a)) * np.exp(-t * d)


def pluck(m, dur, bright=6):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * bright * k) / k for k in range(1, 7))
    return s * env(n, 0.002, 3)


def kick():
    t = np.arange(int(SR * 0.3)) / SR
    return np.sin(2 * np.pi * (45 * t + 110 / 25 * (1 - np.exp(-t * 25)))) * np.exp(-t * 10)


def noise(rng, dur, decay):
    n = int(SR * dur)
    return rng.standard_normal(n) * env(n, 0.001, decay)


def band(x, lo, hi):
    """FFTでかんたんに帯域をしぼる（耳に痛い高音を落とす）"""
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(f, len(x))


def whoosh(rng, dur=0.5):
    n = int(SR * dur)
    w = band(rng.standard_normal(n), 400, 5000)
    return w * np.linspace(0, 1, n) ** 3


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
    hits, secs = scene_times(video)
    end = hits[-1] if hits and hits[-1] > secs - 6 else secs - 3   # 最後の場面（次回予告）
    mix = np.zeros(int(SR * (secs + 2)))
    duck = np.ones_like(mix)

    def add(sig, at, gain, buf=mix):
        i = int(at * SR)
        if i >= len(buf):
            return
        j = min(len(buf), i + len(sig))
        buf[i:j] += sig[:j - i] * gain

    prog = PROG[song]
    nbeats = int(secs / BEAT)
    for b in range(nbeats):
        t0 = b * BEAT
        bar, q = divmod(b, 4)
        ch = prog[bar % len(prog)]
        outro = t0 >= end + 2 * BEAT
        add(kick(), t0, 0.9 if not outro else 0.4)                  # 4つ打ち
        k = int(t0 * SR)
        duck[k:k + int(SR * 0.18)] = np.minimum(duck[k:k + int(SR * 0.18)], np.linspace(0.35, 1, int(SR * 0.18)))
        if q in (1, 3):
            add(band(noise(rng, 0.2, 18), 300, 3500), t0, 0.5)                    # クラップ
        for h in (0.25, 0.5, 0.75):
            add(band(noise(rng, 0.05, 80), 6000, 12000), t0 + h * BEAT, 0.08 if h == 0.5 else 0.03)
        for n_ in ch:                                               # 裏拍のコード
            add(pluck(n_, BEAT * 0.45, 9), t0 + BEAT / 2, 0.09)
        add(pluck(ch[0] - 24, BEAT * 0.45, 4), t0 + BEAT / 2, 0.45)  # 裏拍ベース
        if not outro:
            for e in range(2):                                      # フック（毎小節くり返す）
                idx = HOOK[q * 2 + e]
                if idx is not None:
                    add(pluck(ch[idx] + 12, BEAT * 0.6, 5), t0 + e * BEAT / 2, 0.16)

    for h in hits:                                                  # 場面転換にシュッ＋アクセント
        add(whoosh(rng, 0.45), h - 0.45, 0.25)
        add(band(noise(rng, 0.8, 4), 2000, 9000), h, 0.1)   # シンバル風
    add(whoosh(rng, 2 * BAR), end - 2 * BAR, 0.35)                # 次回予告に向けて盛り上げ

    mix *= duck                                                     # キックに合わせて音を沈める（ノリが出る）
    mix = mix[:int(SR * secs)]
    fade = int(SR * 1.2)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) * 0.9            # 軽く音圧を上げる
    pcm = (np.stack([mix, mix], 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('場面転換', [round(h, 1) for h in hits], '盛り上げ→', round(end, 1))


if __name__ == '__main__':
    main(int(sys.argv[1]), sys.argv[2], sys.argv[3])
