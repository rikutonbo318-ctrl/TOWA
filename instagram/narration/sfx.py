"""効果音をコードで作る（著作権フリー）: python3 narration/sfx.py"""
import os, wave
import numpy as np
R = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'remotion', 'public', 'sfx')
rng = np.random.default_rng(7)

def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    with wave.open(os.path.join(OUT, name + '.wav'), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def t(d): return np.arange(int(R * d)) / R
def lp(x, a):  # one-pole low-pass
    y = np.zeros_like(x); acc = 0.0
    a = np.broadcast_to(np.asarray(a, dtype=float), x.shape)
    for i, v in enumerate(x):
        acc += a[i] * (v - acc); y[i] = acc
    return y

# thud: landing on a wooden floor
tt = t(0.45); thud = np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 11) + lp(rng.normal(size=tt.size), 0.08) * np.exp(-tt * 25) * 0.6
save('thud', thud)
# whoosh: camera move / number change
tt = t(0.6); env = np.sin(np.pi * tt / 0.6) ** 2
save('whoosh', lp(rng.normal(size=tt.size), 0.05 + 0.25 * tt / 0.6) * env)
# creak: wooden floor under load
tt = t(1.6); f = 140 + 60 * np.sin(2 * np.pi * 0.9 * tt) + 30 * tt
ph = 2 * np.pi * np.cumsum(f) / R
saw = (ph / (2 * np.pi)) % 1.0 - 0.5
pulse = (np.sin(2 * np.pi * 9 * tt) > 0.2).astype(float)
save('creak', lp(saw * pulse, 0.18) * np.sin(np.pi * tt / 1.6))
# crack: timber splitting
tt = t(0.5); crack = rng.normal(size=tt.size) * np.exp(-tt * 18)
for k in range(6):
    s = int(R * (0.02 + 0.05 * k)); crack[s:s + 400] += rng.normal(size=400) * 1.5 * np.exp(-np.arange(400) / 80)
save('crack', crack)
# boom: collapse
tt = t(2.2); boom = np.sin(2 * np.pi * (55 - 20 * tt) * tt) * np.exp(-tt * 2.2) + lp(rng.normal(size=tt.size), 0.03) * np.exp(-tt * 1.6) * 2
save('boom', boom)
# tick: counter
tt = t(0.06); save('tick', np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90))
# hit: stamp / answer
tt = t(0.5); save('hit', np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 8) + np.sin(2 * np.pi * 660 * tt) * np.exp(-tt * 14) * 0.4)
print('ok')
