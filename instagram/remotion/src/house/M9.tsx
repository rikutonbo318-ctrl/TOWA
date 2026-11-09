import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Line3D, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M9/durations.json';
import LINES from '../../../narration/M9.json';

// もしも M9（7:30 外構枠・ナレーション版）：メッシュも目地もなしで駐車場のコンクリートを打ったら、10年でどうなる？
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.6, '05': 0.6, '06': 1.2, '07': 0.6, '08': 0.5, '09': 0.6, '10': 0.6, '11': 1.0};
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
export const M9_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

type Crack = {pts: [number, number][]; start: number; grow: number; w: number};
// meandering polyline from a to b
const wiggle = (seed: number, a: [number, number], b: [number, number], n: number, amp: number): [number, number][] => {
  const out: [number, number][] = [];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = i === 0 || i === n ? 0 : (rnd(seed * 31 + i) - 0.5) * 2 * amp;
    out.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
  }
  return out;
};
const X0 = PARK.x0 + 0.05;
const X1 = PARK.x1 - 0.05;
const Y0 = PARK.y0 + 0.05;
const Y1 = PARK.y1 - 0.05;
const CRACKS: Crack[] = [
  // year 1: hairlines
  {pts: wiggle(1, [4.6, -3.6], [5.2, -3.0], 5, 0.05), start: 0.2, grow: 0.8, w: 0.6},
  {pts: wiggle(2, [6.0, -2.2], [6.4, -1.5], 4, 0.05), start: 0.4, grow: 0.6, w: 0.6},
  {pts: wiggle(3, [7.6, -3.9], [8.1, -3.4], 4, 0.05), start: 0.5, grow: 0.5, w: 0.6},
  {pts: wiggle(4, [X0, -1.2], [3.9, -1.0], 3, 0.04), start: 0.6, grow: 0.4, w: 0.6},
  // year 3: along the tyre lines
  {pts: wiggle(5, [4.25, Y0], [4.1, -1.1], 14, 0.12), start: 1.2, grow: 1.8, w: 1},
  {pts: wiggle(6, [5.6, -4.0], [5.5, -0.9], 12, 0.12), start: 1.5, grow: 1.5, w: 0.9},
  {pts: wiggle(7, [7.0, Y0], [6.9, -0.8], 14, 0.12), start: 1.3, grow: 1.7, w: 1},
  {pts: wiggle(8, [8.3, -4.1], [8.4, -1.4], 11, 0.12), start: 1.8, grow: 1.2, w: 0.9},
  // year 10: across the whole parking
  {pts: wiggle(9, [X0, -2.9], [X1, -2.7], 22, 0.15), start: 3.5, grow: 6, w: 1.3},
  {pts: wiggle(10, [X0, -1.6], [X1, -1.8], 22, 0.15), start: 4.5, grow: 5, w: 1.2},
  {pts: wiggle(11, [5.0, Y0], [6.2, -2.9], 8, 0.1), start: 5, grow: 4, w: 1},
  {pts: wiggle(12, [7.8, -1.7], [8.6, Y1], 7, 0.1), start: 6, grow: 3.5, w: 1},
  {pts: wiggle(13, [3.9, -2.85], [4.6, -4.2], 6, 0.08), start: 6.5, grow: 3, w: 0.9},
];
const segLen = (p: [number, number][]) => {
  const l: number[] = [0];
  for (let i = 1; i < p.length; i++) l.push(l[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  return l;
};
const CR = CRACKS.map((c) => ({...c, cum: segLen(c.pts)}));
// little weeds along the long cracks (year 10)
const WEEDS = (() => {
  const out: {x: number; y: number; s: number}[] = [];
  [8, 9, 4, 6].forEach((ci, k) => {
    const p = CRACKS[ci].pts;
    for (let i = 1; i < p.length - 1; i += 2) out.push({x: p[i][0], y: p[i][1], s: 0.5 + rnd(k * 50 + i) * 0.6});
  });
  return out;
})();

const CrackLines: React.FC<{yr: number}> = ({yr}) => (
  <>
    {CR.map((c, ci) => {
      const k = Math.max(0, Math.min(1, (yr - c.start) / c.grow));
      if (k <= 0) return null;
      const total = c.cum[c.cum.length - 1] * k;
      const w = (0.008 + 0.03 * Math.min(1, yr / 10)) * c.w;
      const segs: React.ReactNode[] = [];
      for (let i = 1; i < c.pts.length; i++) {
        if (c.cum[i - 1] >= total) break;
        const a = c.pts[i - 1];
        let b = c.pts[i];
        if (c.cum[i] > total) {
          const t = (total - c.cum[i - 1]) / (c.cum[i] - c.cum[i - 1]);
          b = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }
        segs.push(<Line3D key={i} a={[a[0], a[1], 0.036]} b={[b[0], b[1], 0.036]} w={w} color="#2f2c27" />);
      }
      return <group key={ci}>{segs}</group>;
    })}
  </>
);

const Weed: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => {
  if (h <= 0.005) return null;
  return (
    <group position={[x, 0.035, -y]}>
      {[-0.4, 0, 0.4].map((t, i) => (
        <mesh key={i} position={[Math.sin(t) * h * 0.25, h / 2, 0]} rotation={[0, 0, -t]} castShadow>
          <coneGeometry args={[0.015 + h * 0.05, h, 5]} />
          <meshStandardMaterial color={i ? '#5f8f34' : '#456f2a'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const M9: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  // years 0..10
  const yr = f < at('02') ? 10 : f < at('03') ? 1 * ramp(f, at('02'), at('02') + 50) : f < at('05') ? 1 + 2 * ramp(f, at('03'), at('03') + 60) : f < at('08') ? 3 + 7 * ramp(f, at('05'), at('06') + 20) : 10;
  const label = f < at('02') || f >= at('08') ? '' : f < at('03') ? '1年' : f < at('05') ? '3年' : '10年';
  const calm = f >= at(LAST);
  const weedH = f >= at('06') && f < at('08') ? ramp(f, at('06') + 10, at('06') + 50) : f < at('02') ? 1 : 0;
  const patch = f >= at('07') && f < at('08') ? ramp(f, at('07') + 10, at('07') + 25) : 0;
  const tyre = f >= at('03') && f < at('05') ? ramp(f, at('03'), at('03') + 15) * (1 - ramp(f, at('04') + 20, at('04') + 35)) : 0;
  const cam = camTrack([
    [0, [6.2, -9.6, 7.6], [6.2, -2.6, 0.0], 50],
    [at('02'), [6.0, -9.4, 7.4], [6.2, -2.6, 0.0], 50],
    [at('02') + 14, [5.6, -5.6, 1.7], [5.4, -3.0, 0.0], 50],
    [at('03'), [5.7, -5.7, 1.8], [5.4, -3.0, 0.0], 50],
    [at('03') + 14, [6.2, -9.8, 5.4], [6.2, -2.4, 0.0], 52],
    [at('05'), [6.3, -10.2, 5.6], [6.2, -2.4, 0.0], 52],
    [at('05') + 14, [6.2, -9.6, 7.6], [6.2, -2.6, 0.0], 50],
    [at('07'), [6.0, -9.4, 7.4], [6.2, -2.6, 0.0], 50],
    [at('07') + 14, [5.9, -6.6, 3.2], [5.7, -2.8, 0.0], 50],
    [at('08') - 1, [5.9, -6.8, 3.3], [5.7, -2.8, 0.0], 50],
    [at(LAST), [6.2, -9.6, 7.6], [6.2, -2.6, 0.0], 50],
    [M9_FRAMES, [6.4, -9.9, 7.8], [6.2, -2.6, 0.0], 50],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const thermo = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) * (1 - ramp(f, at('05') - 8, at('05'))) : 0;
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const joints = ramp(f, at('09'), at('09') + 25);
  const pour = ramp(f, at('10'), at('10') + 40);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const darken = Math.min(1, yr / 10);
  const slabCol = `rgb(${Math.round(215 - 30 * darken)},${Math.round(212 - 32 * darken)},${Math.round(205 - 36 * darken)})`;
  const weeds = useMemo(() => WEEDS, []);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D noCarport />
        {!calm ? (
          <>
            {/* one big slab, no joints, no mesh */}
            <PBox x0={PARK.x0} x1={PARK.x1} y0={PARK.y0} y1={PARK.y1} h0={0} h1={0.035} m={{color: slabCol, tex: 'conc', rough: 0.9}} />
            <CrackLines yr={yr} />
            {weeds.map((w, i) => (
              <Weed key={i} x={w.x} y={w.y} h={patch > 0 && w.x > 4.6 && w.x < 6.7 && w.y > -3.5 && w.y < -2.1 ? 0 : 0.22 * w.s * weedH} />
            ))}
            {patch > 0 ? <PBox x0={4.7} x1={6.6} y0={-3.4} y1={-2.2} h0={0} h1={0.04 + 0.03 * patch} m={{color: '#eeede8', tex: 'conc', rough: 0.8}} /> : null}
            {tyre > 0
              ? [4.15, 5.6, 6.95, 8.35].map((x) => <PBox key={x} x0={x - 0.1} x1={x + 0.1} y0={PARK.y0 + 0.2} y1={PARK.y1 - 0.3} h0={0} h1={0.04} m={{color: '#e8622c', opacity: 0.35 * tyre}} cast={false} />)
              : null}
          </>
        ) : null}
        {calm ? <Person3D x={9.8} y={-2.2} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>メッシュ・目地なし</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '10年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr / 10) * 100}%`, height: '100%', background: label === '10年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {tyre > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: tyre}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(232,98,44,0.92)', padding: '10px 28px', borderRadius: 14}}>タイヤが乗る場所</span>
        </div>
      ) : null}
      {patch > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: patch}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(16,22,30,0.85)', padding: '10px 28px', borderRadius: 14}}>直しても、つぎはぎ</span>
        </div>
      ) : null}
      {thermo > 0 ? (
        <div style={{position: 'absolute', top: 600, left: 70, right: 70, opacity: thermo, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '26px 30px'}}>
            {[
              ['夏', '伸びる', '#e8622c', 1],
              ['冬', '縮む', '#2f7fd1', -1],
            ].map(([s, t, col, d], i) => {
              const k = 0.5 + 0.5 * Math.sin((f - at('04')) / 9 + (i ? Math.PI : 0));
              const w = 400 + (d as number) * 50 * k;
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', margin: '12px 0'}}>
                  <div style={{width: 120, flexShrink: 0, fontSize: 52, fontWeight: 900, color: col as string}}>{s}</div>
                  <div style={{width: 520, flexShrink: 0, display: 'flex', justifyContent: 'center'}}>
                    <div style={{width: w, height: 60, background: '#bdb9b0', borderRadius: 6, border: `4px solid ${col}`}} />
                  </div>
                  <div style={{fontSize: 44, fontWeight: 900, color: ink, whiteSpace: 'nowrap'}}>{t}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 52%, #8a6a46 52%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: pour > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{pour > 0 ? '流したら、見えない' : joints > 0 ? '割れる場所を決める「目地」' : 'コンクリートの中に「メッシュ」'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* gravel base */}
            <rect x={60} y={1000} width={960} height={40} fill="#9a958c" />
            {/* slab outline (dashed until poured) */}
            <rect x={60} y={880} width={960} height={120} fill="#c9c6bf" opacity={0.25 + 0.75 * pour} stroke="#6d6a64" strokeWidth={4} strokeDasharray={pour > 0 ? '0' : '14 10'} />
            {/* wire mesh */}
            <g opacity={1 - pour * 0.92}>
              <line x1={70} y1={945} x2={1010} y2={945} stroke="#5a6470" strokeWidth={6} />
              {Array.from({length: 20}).map((_, i) => (
                <circle key={i} cx={90 + i * 47} cy={945} r={8} fill="#5a6470" />
              ))}
              {[90, 400, 700, 990].map((x) => (
                <rect key={x} x={x - 14} y={958} width={28} height={42} fill="#8c8a84" />
              ))}
              <text x={540} y={925} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>ワイヤーメッシュ</text>
              <text x={540} y={1090} textAnchor="middle" fontSize={32} fontWeight={800} fill="#fff" fontFamily={FONT}>台にのせて、コンクリートの中ほどに</text>
            </g>
            {joints > 0 ? (
              <g opacity={joints}>
                {[380, 700].map((x) => (
                  <g key={x}>
                    <rect x={x - 8} y={872} width={16} height={128} fill="#2b2d31" />
                    <path d={`M ${x} 880 l -6 30 l 10 25 l -8 30`} stroke="#c0392b" strokeWidth={5} fill="none" opacity={1 - pour} />
                  </g>
                ))}
                <text x={540} y={850} textAnchor="middle" fontSize={40} fontWeight={900} fill="#c0392b" fontFamily={FONT}>ひびは目地に集まる</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 76, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>メッシュも目地もなしで<br />駐車場のコンクリート</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>10年後どうなる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　ひびの出方は地盤や施工で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：コンクリートを打つ前に見ること</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>駐車場・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M9/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('06') + 5} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('10') + 30} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.6} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
