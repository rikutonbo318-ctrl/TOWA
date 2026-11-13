import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M17/durations.json';
import LINES from '../../../narration/M17.json';

// もしも M17（7:30 外構枠・ナレーション版）：下地なしで敷いた人工芝、10年でどうなる？
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
export const M17_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// turf area: west of the deck, and in front of the deck
const RECTS = [
  {x0: -3.4, x1: 0.15, y0: -4.3, y1: -0.15},
  {x0: 0.15, x1: 3.1, y0: -4.3, y1: -1.85},
];
const SEAMS: {a: [number, number]; b: [number, number]}[] = [
  {a: [-1.4, -4.3], b: [-1.4, -0.15]},
  {a: [0.15, -4.3], b: [0.15, -1.85]},
  {a: [0.15, -3.1], b: [3.1, -3.1]},
];
// the walked path: deck step → south, and along the house
const PATH = [
  ...Array.from({length: 7}, (_, i) => ({x: 1.6 + Math.sin(i) * 0.15, y: -2.1 - i * 0.33})),
  ...Array.from({length: 7}, (_, i) => ({x: -0.2 - i * 0.45, y: -1.0 + Math.sin(i * 1.3) * 0.15})),
].map((p, i) => ({...p, r: 0.22 + rnd(i * 7) * 0.12, k: rnd(i * 13)}));
const WEEDS = [
  ...SEAMS.flatMap((s, si) => Array.from({length: 12}, (_, i) => {
    const t = rnd(si * 31 + i * 3);
    return {x: s.a[0] + (s.b[0] - s.a[0]) * t + (rnd(i * 5 + si) - 0.5) * 0.05, y: s.a[1] + (s.b[1] - s.a[1]) * t + (rnd(i * 9 + si) - 0.5) * 0.05, s: 0.5 + rnd(i * 11 + si) * 0.8, at: rnd(i * 17 + si * 3)};
  })),
  ...Array.from({length: 22}, (_, i) => ({x: -3.35 + rnd(i * 19) * 6.4, y: -4.25, s: 0.5 + rnd(i * 23) * 0.8, at: rnd(i * 29)})).filter((w) => w.x < 3.05),
];
const PUDDLES = PATH.filter((_, i) => i % 2 === 0);

const Weed: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => {
  if (h <= 0.005) return null;
  return (
    <group position={[x, 0.06, -y]}>
      {[-0.45, 0, 0.45].map((t, i) => (
        <mesh key={i} position={[Math.sin(t) * h * 0.25, h / 2, 0]} rotation={[0, i * 1.1, -t]} castShadow>
          <coneGeometry args={[0.015 + h * 0.05, h, 5]} />
          <meshStandardMaterial color={i ? '#6f9a33' : '#4d7326'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const Ellipse: React.FC<{x: number; y: number; h: number; rx: number; ry: number; color: string; opacity?: number; metal?: number; rough?: number}> = ({x, y, h, rx, ry, color, opacity = 1, metal = 0, rough = 1}) => (
  <mesh position={[x, h, -y]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx, ry, 1]}>
    <circleGeometry args={[1, 24]} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} metalness={metal} roughness={rough} />
  </mesh>
);

export const M17: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const yr = f < at('02') ? 10 : f < at('03') ? ramp(f, at('02'), at('02') + 50) : f < at('05') ? 1 + 2 * ramp(f, at('03'), at('03') + 50) : f < at('08') ? 3 + 7 * ramp(f, at('05'), at('06') + 20) : 10;
  const calm = f >= at('08');
  const label = f < at('02') || calm ? '' : f < at('03') ? '1年' : f < at('05') ? '3年' : '10年';
  const dent = calm ? 0 : Math.min(1, yr / 4);
  const weed = calm || yr < 1.8 ? 0 : Math.min(1, (yr - 1.8) / 6);
  const wet = !calm && f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 20) : 0;
  const fade = calm ? 0 : Math.max(0, (yr - 3) / 7);
  const curl = calm ? 0 : Math.max(0, (yr - 5) / 5);
  const cam = camTrack([
    [0, [3.2, -9.0, 5.2], [-0.3, -2.4, 0.0], 50],
    [at('02'), [3.0, -8.8, 5.0], [-0.3, -2.4, 0.0], 50],
    [at('02') + 14, [2.6, -5.6, 1.9], [1.2, -2.6, 0.0], 50],
    [at('03') - 1, [2.5, -5.5, 1.9], [1.2, -2.6, 0.0], 50],
    [at('03') + 14, [2.4, -5.6, 1.7], [0.3, -3.2, 0.0], 50],
    [at('05'), [2.5, -5.5, 1.7], [0.3, -3.2, 0.0], 50],
    [at('05') + 14, [3.2, -9.0, 5.2], [-0.3, -2.4, 0.0], 50],
    [at('06') + 30, [1.0, -7.6, 3.0], [-0.6, -2.8, 0.0], 50],
    [at('08') - 1, [0.9, -7.4, 2.9], [-0.6, -2.8, 0.0], 50],
    [at(LAST), [3.2, -9.0, 5.2], [-0.3, -2.4, 0.0], 50],
    [M17_FRAMES, [3.4, -9.3, 5.4], [-0.3, -2.4, 0.0], 50],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const soft = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) * (1 - ramp(f, at('05') - 8, at('05'))) : 0;
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const drain = ramp(f, at('09'), at('09') + 20);
  const cover = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const tex = useMemo(() => {
    if (!a) return null;
    const t = a.grass.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, [a]);
  const tint = new THREE.Color('#9fe07f').lerp(new THREE.Color('#e3d7a0'), fade).getStyle();
  if (!a || !tex) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D noFence />
        {RECTS.map((r, i) => (
          <mesh key={i} position={[(r.x0 + r.x1) / 2, 0.035, -(r.y0 + r.y1) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[r.x1 - r.x0, r.y1 - r.y0]} />
            <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={2} color={tint} roughness={calm ? 0.7 : 0.7 + 0.3 * fade} />
          </mesh>
        ))}
        {/* seams */}
        {SEAMS.map((s, i) => (
          <PBox key={'sm' + i} x0={Math.min(s.a[0], s.b[0]) - 0.008 - 0.02 * fade} x1={Math.max(s.a[0], s.b[0]) + 0.008 + 0.02 * fade} y0={Math.min(s.a[1], s.b[1]) - 0.008 - 0.02 * fade} y1={Math.max(s.a[1], s.b[1]) + 0.008 + 0.02 * fade} h0={0.03} h1={0.037} m={{color: calm ? '#5d8e45' : '#6a5a44', rough: 1}} cast={false} />
        ))}
        {/* dents along the walked path */}
        {dent > 0 ? PATH.map((p, i) => <Ellipse key={'d' + i} x={p.x} y={p.y} h={0.038} rx={p.r * (0.6 + 0.6 * dent)} ry={p.r * (0.8 + 0.5 * dent)} color={new THREE.Color('#4f7a3a').lerp(new THREE.Color('#7e7a5a'), fade).getStyle()} opacity={0.35 + 0.5 * dent} />) : null}
        {wet > 0 ? PUDDLES.map((p, i) => <Ellipse key={'p' + i} x={p.x} y={p.y} h={0.04} rx={p.r * 0.9} ry={p.r * 1.1} color="#5b6a72" opacity={0.85 * wet} metal={0.4} rough={0.06} />) : null}
        {WEEDS.map((w, i) => (
          <Weed key={i} x={w.x} y={w.y} h={w.at < weed * 1.2 ? 0.28 * w.s * Math.min(1, weed * 1.3) : 0} />
        ))}
        {/* lifting edges at 10 years */}
        {curl > 0 ? (
          <>
            <group position={[-1.4, 0.04, 4.3]} rotation={[0, 0, 0.25 * curl]}>
              <mesh position={[0.35, 0, -0.9]}>
                <boxGeometry args={[0.7, 0.012, 1.8]} />
                <meshStandardMaterial map={tex} color={tint} roughness={1} />
              </mesh>
            </group>
            <group position={[-3.4, 0.04, 4.3]} rotation={[-0.3 * curl, 0, 0.2 * curl]}>
              <mesh position={[0.35, 0, -0.35]}>
                <boxGeometry args={[0.7, 0.012, 0.7]} />
                <meshStandardMaterial map={tex} color={tint} roughness={1} />
              </mesh>
            </group>
          </>
        ) : null}
        {calm ? <Person3D x={1.0} y={-3.0} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>下地なしで敷いた人工芝</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '10年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr / 10) * 100}%`, height: '100%', background: label === '10年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {soft > 0 ? (
        <div style={{position: 'absolute', top: 600, left: 80, right: 80, opacity: soft, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '24px 28px', textAlign: 'center'}}>
            <div style={{fontSize: 44, fontWeight: 900, color: ink}}>下の土が締まっていない</div>
            <div style={{fontSize: 60, fontWeight: 900, color: '#2f6fb0', marginTop: 4}}>雨のあと、ぶかぶか</div>
          </div>
        </div>
      ) : null}
      {f >= at('07') && f < at('08') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: ramp(f, at('07'), at('07') + 12)}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(192,57,43,0.95)', padding: '10px 28px', borderRadius: 14}}>手入れいらず → 草むしり</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: cover > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{cover > 0 ? '敷いたら、下は見えない' : drain > 0 ? '水がたまる庭は、水はけも' : '平らに締め固めて、シート'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* layers: turf / weed sheet / (drain layer) / compacted soil */}
            <rect x={60} y={560} width={960} height={60} fill="#79c95e" />
            {Array.from({length: 60}).map((_, i) => (
              <rect key={i} x={64 + i * 16} y={540 + (i % 3) * 4} width={6} height={24} fill="#5fae48" />
            ))}
            <rect x={60} y={620} width={960} height={16} fill="#2d2f33" opacity={ramp(f, at('08') + 30, at('08') + 40)} />
            <rect x={60} y={636} width={960} height={drain > 0 ? 120 * drain : 0} fill="#b9ad97" />
            {drain > 0
              ? Array.from({length: 36}).map((_, i) => <circle key={i} cx={80 + ((i * 97) % 920)} cy={656 + ((i * 37) % 90) * drain} r={7 + (i % 3) * 3} fill="#8f8577" opacity={drain} />)
              : null}
            <rect x={60} y={636 + 120 * drain} width={960} height={380} fill="#7a5b3b" />
            <text x={1000} y={600} textAnchor="end" fontSize={34} fontWeight={900} fill={ink} fontFamily={FONT}>人工芝</text>
            <text x={1000} y={672} textAnchor="end" fontSize={30} fontWeight={900} fill="#fff" fontFamily={FONT} opacity={ramp(f, at('08') + 30, at('08') + 40) * (drain > 0 ? 0 : 1)}>防草シート</text>
            {drain > 0 ? <text x={1000} y={720} textAnchor="end" fontSize={34} fontWeight={900} fill={ink} fontFamily={FONT} opacity={drain}>砕石・砂（水はけ）</text> : null}
            <text x={540} y={880 + 120 * drain} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" fontFamily={FONT}>平らにして、締め固めた土</text>
            {cover > 0 ? (
              <g opacity={cover}>
                <rect x={60} y={620} width={960} height={500} fill="#5b4530" />
                <text x={540} y={880} textAnchor="middle" fontSize={120} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>？</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>下地なしで敷いた<br />人工芝</div>
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
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>庭の決め方もまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M17/${l.id}.wav`)} />
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
