import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M11/durations.json';
import LINES from '../../../narration/M11.json';

// もしも M11（7:30 外構枠・ナレーション版）：塗装もしない木のウッドデッキ、10年でどうなる？
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.6, '05': 0.6, '06': 1.2, '07': 0.8, '08': 0.5, '09': 0.5, '10': 0.6, '11': 1.0};
const T: Record<string, [number, number]> = {};
{
  let t = 0.1;
  for (const l of lines) {
    const d = dur[l.id] ?? 3;
    T[l.id] = [Math.round(t * FPS), Math.round((t + d) * FPS)];
    t += d + (PAUSE[l.id] ?? 0.3);
  }
}
const at = (id: string) => T[id][0];
const end = (id: string) => T[id][1];
const LAST = lines[lines.length - 1].id;
export const M11_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const mix = (a: [number, number, number], b: [number, number, number], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;

// deck (plan coords): boards run along x, laid across y
const DK = {x0: 0.2, x1: 3.0, y0: -1.8, y1: -0.08, top: 0.36};
const N = 14;
const BW = (DK.y1 - DK.y0) / N;
const BROKEN = 4;

const Deck: React.FC<{yr: number; brk: number; tilt: number}> = ({yr, brk, tilt}) => {
  const grey = Math.min(1, yr / 3);
  const rot = Math.max(0, (yr - 3) / 7);
  const cx = (DK.x0 + DK.x1) / 2;
  const L = DK.x1 - DK.x0;
  return (
    // the whole deck tilts toward the garden around its house-side edge
    <group position={[0, DK.top, -DK.y1]} rotation={[-tilt, 0, 0]}>
      <group position={[0, -DK.top, DK.y1]}>
        {/* frame and posts (束) */}
        <PBox x0={DK.x0 + 0.05} x1={DK.x1 - 0.05} y0={DK.y0 + 0.05} y1={DK.y1 - 0.05} h0={0.22} h1={0.3} m={{color: mix([93, 70, 54], [52, 44, 38], rot), rough: 0.9}} />
        {[DK.x0 + 0.15, cx, DK.x1 - 0.15].flatMap((x) =>
          [DK.y0 + 0.15, DK.y1 - 0.2].map((y) => (
            <PBox key={x + ',' + y} x0={x - 0.045} x1={x + 0.045} y0={y - 0.045} y1={y + 0.045} h0={0} h1={0.22} m={{color: mix([110, 84, 62], [40, 34, 30], y < -1 ? rot : rot * 0.4), rough: 0.95}} />
          )),
        )}
        {Array.from({length: N}).map((_, i) => {
          const y0 = DK.y0 + i * BW + 0.004;
          const y1 = y0 + BW - 0.008;
          const yc = (y0 + y1) / 2;
          const k = rnd(i * 5);
          const col = mix([170, 118, 76], [143, 138, 128], grey * (0.85 + 0.15 * k));
          const darker = mix([170, 118, 76], [96, 92, 84], Math.min(1, grey * 0.6 + rot * 0.6));
          const cup = rot * (i % 2 ? 0.07 : -0.05) * (0.6 + k);
          if (i === BROKEN && brk > 0) {
            const dip = brk * 0.25;
            return (
              <group key={i}>
                {[0, 1].map((h) => {
                  const xa = h ? cx + 0.03 : DK.x0;
                  const xb = h ? DK.x1 : cx - 0.03;
                  const len = xb - xa;
                  return (
                    <group key={h} position={[h ? xb : xa, DK.top - 0.012, -yc]} rotation={[0, 0, (h ? 1 : -1) * Math.atan(dip / (L / 2))]}>
                      <mesh position={[(h ? -1 : 1) * (len / 2), 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[len, 0.024, y1 - y0]} />
                        <meshStandardMaterial color={darker} roughness={0.95} />
                      </mesh>
                    </group>
                  );
                })}
              </group>
            );
          }
          return (
            <group key={i} position={[cx, DK.top - 0.012, -yc]} rotation={[cup, 0, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[L, 0.024, y1 - y0]} />
                <meshStandardMaterial color={i < 3 ? darker : col} roughness={0.9} />
              </mesh>
            </group>
          );
        })}
        {/* moss and mould along the joints and the garden-side edge */}
        {yr > 2
          ? Array.from({length: 26}).map((_, i) => {
              const k = Math.min(1, (yr - 2) / 4);
              const y = DK.y0 + (Math.floor(rnd(i * 3) * N) + (rnd(i * 7) < 0.5 ? 0 : 1)) * BW;
              const x = DK.x0 + 0.1 + rnd(i * 11) * (DK.x1 - DK.x0 - 0.4);
              const w = (0.15 + rnd(i * 13) * 0.35) * k;
              const near = y < -1.2 || rnd(i) < 0.4;
              if (!near) return null;
              return <PBox key={i} x0={x} x1={x + w} y0={y - 0.02} y1={y + 0.02} h0={DK.top - 0.004} h1={DK.top + 0.003} m={{color: i % 3 ? '#4d6b32' : '#2f3a2a', opacity: 0.85}} cast={false} />;
            })
          : null}
      </group>
    </group>
  );
};

export const M11: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const yr = f < at('02') ? 10 : f < at('03') ? ramp(f, at('02'), at('02') + 50) : f < at('05') ? 1 + 2 * ramp(f, at('03'), at('03') + 50) : f < at('08') ? 3 + 7 * ramp(f, at('05'), at('06')) : 10;
  const calm = f >= at('08');
  const label = f < at('02') || calm ? '' : f < at('03') ? '1年' : f < at('05') ? '3年' : '10年';
  const brkAt = at('06') + Math.round(0.55 * (end('06') - at('06')));
  const brk = !calm && f >= brkAt ? ramp(f, brkAt, brkAt + 6) : f < at('02') ? 1 : 0;
  const tilt = !calm && f >= at('07') ? 0.06 * ramp(f, at('07'), at('07') + 40) : f < at('02') ? 0.06 : 0;
  const cam = camTrack([
    [0, [4.0, -4.6, 2.6], [1.6, -0.9, 0.3], 50],
    [at('02'), [4.0, -4.5, 2.6], [1.6, -0.9, 0.3], 50],
    [at('02') + 14, [2.6, -2.9, 1.2], [1.6, -1.0, 0.35], 48],
    [at('04'), [2.6, -3.0, 1.2], [1.6, -1.0, 0.35], 48],
    [at('04') + 14, [1.6, -3.3, 0.55], [1.6, -1.2, 0.2], 52],
    [at('05'), [1.7, -3.3, 0.55], [1.6, -1.2, 0.2], 52],
    [at('05') + 14, [3.0, -3.4, 1.6], [1.6, -1.0, 0.3], 48],
    [at('07'), [3.0, -3.4, 1.6], [1.6, -1.0, 0.3], 48],
    [at('07') + 14, [3.6, -3.7, 1.1], [1.6, -1.0, 0.2], 50],
    [at('08') - 1, [3.7, -3.8, 1.1], [1.6, -1.0, 0.2], 50],
    [at(LAST), [4.0, -4.6, 2.6], [1.6, -0.9, 0.3], 50],
    [M11_FRAMES, [4.1, -4.8, 2.7], [1.6, -0.9, 0.3], 50],
  ]);
  const c = cam(f);
  const shake = f >= brkAt && f < brkAt + 12 ? Math.sin((f - brkAt) * 3) * 0.02 * (1 - (f - brkAt) / 12) : 0;
  const cc = {...c, pos: [c.pos[0], c.pos[1], c.pos[2] + shake] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const damp = ramp(f, at('09'), at('09') + 20);
  const cover = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const wet = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 12) : 0;
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={cc} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D cars noDeck />
        <Deck yr={calm ? 0 : yr} brk={brk} tilt={tilt} />
        {calm ? <Person3D x={3.4} y={-2.6} yaw={160} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>塗装なしの木のデッキ</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '10年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr / 10) * 100}%`, height: '100%', background: label === '10年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {wet > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: wet}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(47,127,209,0.92)', padding: '10px 28px', borderRadius: 14}}>板の端と、下の地面から</span>
        </div>
      ) : null}
      {f >= brkAt && f < at('07') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, transform: `scale(${1 + 0.3 * (1 - ramp(f, brkAt, brkAt + 8))})`}}>
          <span style={{fontSize: 120, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>ベキッ！</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 55%, #8a6a46 55%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: cover > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{cover > 0 ? '完成したら、下は見えない' : damp > 0 ? 'デッキの下に湿気をためない' : '長持ちさせるには'}</span>
          </div>
          {damp <= 0 ? (
            <div style={{position: 'absolute', top: 420, left: 70, right: 70, fontFamily: FONT}}>
              {[
                ['腐りにくい木', 'を選ぶ'],
                ['樹脂のデッキ', 'を選ぶ'],
                ['数年ごとに', '塗り直す'],
              ].map(([b, t], i) => {
                const o = ramp(f, at('08') + 10 + i * 18, at('08') + 22 + i * 18);
                return (
                  <div key={i} style={{opacity: o, transform: `translateY(${(1 - o) * 20}px)`, background: 'rgba(255,255,255,0.96)', borderRadius: 22, padding: '26px 30px', margin: '0 0 26px', fontSize: 58, fontWeight: 900, color: ink, textAlign: 'center'}}>
                    <span style={{color: '#2e9d5b'}}>{b}</span>
                    {t}
                  </div>
                );
              })}
            </div>
          ) : (
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
              {/* deck section */}
              <rect x={100} y={760} width={880} height={30} fill="#a7764c" />
              {[150, 540, 930].map((x) => (
                <rect key={x} x={x - 18} y={790} width={36} height={266} fill="#6e5440" />
              ))}
              <g opacity={1 - cover}>
                {[260, 420, 660, 820].map((x, i) => (
                  <path key={x} d={`M ${x} 1040 q 18 -40 0 -80 q -18 -40 0 -80`} stroke="#4aa3e0" strokeWidth={8} fill="none" opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 10 + i))} />
                ))}
                <text x={540} y={1130} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" fontFamily={FONT}>湿った地面 → 下から腐る</text>
              </g>
              {cover > 0 ? (
                <g opacity={cover}>
                  <rect x={100} y={790} width={880} height={266} fill="#4a3d32" />
                  <text x={540} y={940} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>？</text>
                </g>
              ) : null}
            </svg>
          )}
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>塗装もしない<br />木のウッドデッキ</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>10年後どうなる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　傷み方は木の種類や場所で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：デッキを作る前に見ること</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>デッキ・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M11/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={brkAt} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('07') + 10} durationInFrames={30}><Audio src={staticFile('sfx/creak.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
