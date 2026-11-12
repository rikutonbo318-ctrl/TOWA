import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M15/durations.json';
import LINES from '../../../narration/M15.json';

// もしも M15（7:30 外構枠・ナレーション版）：砂利を敷いただけの駐車場、10年でどうなる？
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.6, '05': 0.6, '06': 1.0, '07': 0.8, '08': 0.5, '09': 0.5, '10': 0.6, '11': 1.0};
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
export const M15_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const TYRES = [4.15, 5.6, 6.95, 8.35];
const PUDDLES = TYRES.flatMap((x, i) => [-3.6, -2.4, -1.3].map((y, k) => ({x: x + (rnd(i * 9 + k) - 0.5) * 0.1, y: y + (rnd(i * 5 + k) - 0.5) * 0.4, w: 0.25 + rnd(i * 3 + k) * 0.2, l: 0.5 + rnd(i * 7 + k) * 0.5, at: rnd(i * 11 + k)})));
const WEEDS = Array.from({length: 90}, (_, i) => ({x: PARK.x0 + 0.1 + rnd(i * 3) * (PARK.x1 - PARK.x0 - 0.2), y: PARK.y0 + 0.1 + rnd(i * 3 + 1) * (PARK.y1 - PARK.y0 - 0.2), s: 0.5 + rnd(i * 7) * 0.7})).filter((w) => TYRES.every((x) => Math.abs(w.x - x) > 0.25));
const SPILL = Array.from({length: 140}, (_, i) => ({x: PARK.x0 + rnd(i * 13) * (PARK.x1 - PARK.x0), y: PARK.y0 - 0.2 - rnd(i * 17) * rnd(i * 19) * 1.6, s: 0.03 + rnd(i * 23) * 0.03}));

const Weed: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => {
  if (h <= 0.005) return null;
  return (
    <group position={[x, 0.045, -y]}>
      {[-0.4, 0, 0.4].map((t, i) => (
        <mesh key={i} position={[Math.sin(t) * h * 0.25, h / 2, 0]} rotation={[0, 0, -t]} castShadow>
          <coneGeometry args={[0.015 + h * 0.05, h, 5]} />
          <meshStandardMaterial color={i ? '#5f8f34' : '#456f2a'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const M15: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const yr = f < at('02') ? 10 : f < at('03') ? ramp(f, at('02'), at('02') + 50) : f < at('05') ? 1 + 2 * ramp(f, at('03'), at('03') + 50) : f < at('08') ? 3 + 7 * ramp(f, at('05'), at('06') + 20) : 10;
  const calm = f >= at('08');
  const label = f < at('02') || calm ? '' : f < at('03') ? '1年' : f < at('05') ? '3年' : '10年';
  const rut = Math.min(1, yr / 10);
  const wet = !calm && yr > 1.5 ? Math.min(1, (yr - 1.5) / 2) : 0;
  const late = !calm && yr > 4 ? Math.min(1, (yr - 4) / 5) : 0;
  const mud = !calm && f >= at('07') ? ramp(f, at('07'), at('07') + 20) : 0;
  const cam = camTrack([
    [0, [6.2, -9.6, 7.6], [6.2, -2.6, 0.0], 50],
    [at('02'), [6.0, -9.4, 7.4], [6.2, -2.6, 0.0], 50],
    [at('02') + 14, [5.4, -6.4, 2.2], [5.6, -2.6, 0.0], 50],
    [at('03'), [5.4, -6.5, 2.2], [5.6, -2.6, 0.0], 50],
    [at('04'), [5.6, -7.0, 3.0], [5.8, -2.6, 0.0], 50],
    [at('05') + 14, [6.2, -9.6, 7.6], [6.2, -2.8, 0.0], 50],
    [at('06') + 30, [6.4, -10.4, 5.0], [6.2, -4.0, 0.0], 50],
    [at('08') - 1, [6.4, -10.6, 5.1], [6.2, -4.0, 0.0], 50],
    [at(LAST), [6.2, -9.6, 7.6], [6.2, -2.6, 0.0], 50],
    [M15_FRAMES, [6.4, -9.9, 7.8], [6.2, -2.6, 0.0], 50],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const soft = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) * (1 - ramp(f, at('05') - 8, at('05'))) : 0;
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const strips = ramp(f, at('09'), at('09') + 20);
  const cover = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const g = Math.round(150 - 40 * mud);
  const gravelCol = `rgb(${g},${Math.round(g * 0.96)},${Math.round(g * 0.9)})`;
  const weeds = useMemo(() => WEEDS, []);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D noCarport />
        <PBox x0={PARK.x0} x1={PARK.x1} y0={PARK.y0} y1={PARK.y1} h0={0} h1={0.045} m={{color: gravelCol, tex: 'gravel', rough: 1}} />
        {calm ? (
          // the good version: tyre strips in concrete, gravel in between
          [4.85, 7.5].flatMap((cx) =>
            [-0.45, 0.45].map((d) => <PBox key={cx + d} x0={cx + d - 0.25} x1={cx + d + 0.25} y0={PARK.y0 + 0.1} y1={PARK.y1 - 0.2} h0={0} h1={0.05} m={{color: '#d7d4cd', tex: 'conc', rough: 0.9}} />),
          )
        ) : (
          <>
            {TYRES.map((x) => (
              <PBox key={x} x0={x - 0.08 - 0.1 * rut} x1={x + 0.08 + 0.1 * rut} y0={PARK.y0 + 0.15} y1={PARK.y1 - 0.25} h0={0} h1={0.046} m={{color: `rgb(${Math.round(120 - 50 * rut)},${Math.round(106 - 46 * rut)},${Math.round(88 - 40 * rut)})`, rough: 1}} cast={false} />
            ))}
            {wet > 0
              ? PUDDLES.filter((p) => p.at < wet).map((p, i) => (
                  <mesh key={i} position={[p.x, 0.047, -p.y]} rotation={[-Math.PI / 2, 0, 0]} scale={[p.w * (0.5 + rut * 0.5), p.l * (0.45 + rut * 0.5), 1]}>
                    <circleGeometry args={[0.5, 24]} />
                    <meshStandardMaterial color={mud > 0 ? '#5e4c36' : '#56656f'} metalness={0.4} roughness={0.06} transparent opacity={0.85} />
                  </mesh>
                ))
              : null}
            {weeds.map((w, i) => (
              <Weed key={i} x={w.x} y={w.y} h={0.25 * w.s * late} />
            ))}
            {late > 0
              ? SPILL.filter((_, i) => i / SPILL.length < late).map((s, i) => (
                  <PBox key={i} x0={s.x} x1={s.x + s.s} y0={s.y} y1={s.y + s.s} h0={0} h1={0.025} m={{color: i % 3 ? '#9a958c' : '#7f7a71', rough: 1}} cast={false} />
                ))
              : null}
          </>
        )}
        {calm ? <Person3D x={9.8} y={-2.2} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>砂利を敷いただけの駐車場</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '10年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr / 10) * 100}%`, height: '100%', background: label === '10年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {soft > 0 ? (
        <div style={{position: 'absolute', top: 600, left: 80, right: 80, opacity: soft, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '24px 28px', textAlign: 'center'}}>
            <div style={{fontSize: 44, fontWeight: 900, color: ink}}>雨 ＋ 車の重さ</div>
            <div style={{fontSize: 60, fontWeight: 900, color: '#c0392b', marginTop: 4}}>下の土がやわらかく</div>
          </div>
        </div>
      ) : null}
      {mud > 0 && f < at('08') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: mud}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(110,90,64,0.95)', padding: '10px 28px', borderRadius: 14}}>雨の日は泥だらけ</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 50%, #8a6a46 50%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: cover > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{cover > 0 ? '敷いたら、下は見えない' : strips > 0 ? 'タイヤの所だけコンクリート' : '砕石を「締め固める」'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {strips <= 0 ? (
              <g>
                {/* gravel on top, crushed stone below, being compacted */}
                <rect x={60} y={900} width={960} height={50} fill="#9a958c" />
                <rect x={60} y={950} width={960} height={110} fill="#7f7466" />
                {Array.from({length: 40}).map((_, i) => (
                  <circle key={i} cx={80 + ((i * 97) % 920)} cy={980 + ((i * 37) % 70)} r={8 + (i % 3) * 3} fill="#6a6155" />
                ))}
                <text x={540} y={935} textAnchor="middle" fontSize={34} fontWeight={900} fill={ink} fontFamily={FONT}>砂利</text>
                <text x={540} y={1110} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" fontFamily={FONT}>砕石（さいせき）</text>
                {(() => {
                  const x = 160 + ((f - at('08')) * 8) % 760;
                  return (
                    <g>
                      <rect x={x - 70} y={780} width={140} height={90} rx={12} fill="#f0b429" />
                      <circle cx={x} cy={880} r={40} fill="#555" />
                      <path d={`M ${x} 900 l 0 30 m -14 -14 l 14 14 l 14 -14`} stroke="#c0392b" strokeWidth={8} fill="none" />
                    </g>
                  );
                })()}
                <text x={540} y={740} textAnchor="middle" fontSize={44} fontWeight={900} fill={ink} fontFamily={FONT}>機械で何度も締め固める</text>
              </g>
            ) : (
              <g opacity={strips}>
                <rect x={160} y={420} width={760} height={740} fill="#9a958c" />
                {[300, 420, 660, 780].map((x) => (
                  <rect key={x} x={x - 40} y={440} width={80} height={700} fill="#d7d4cd" stroke="#8a867f" strokeWidth={3} />
                ))}
                <text x={540} y={1220} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" fontFamily={FONT}>あいだは砂利のまま</text>
              </g>
            )}
            {cover > 0 ? (
              <g opacity={cover}>
                <rect x={60} y={950} width={960} height={110} fill="#9a958c" />
                <text x={540} y={1020} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>？</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>砂利を敷いただけの<br />駐車場</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>10年後どうなる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　傷み方は土や使い方で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>家や外構を計画中の人は</div>
            <div style={{fontSize: 60, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>プロフのリンクへ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>駐車場の決め方もまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M15/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('06') + 5} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('08') + 10} durationInFrames={40}><Audio src={staticFile('sfx/rattle.wav')} volume={0.4} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
