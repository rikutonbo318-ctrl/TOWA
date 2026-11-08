import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M8/durations.json';
import LINES from '../../../narration/M8.json';

// もしも M8（7:30 外構枠・ナレーション版）：防草シートなしで砂利だけ敷いたら、1年でどうなる？
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.6, '05': 0.6, '06': 1.4, '07': 0.5, '08': 0.5, '09': 0.5, '10': 0.6, '11': 1.0};
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
export const M8_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// gravel garden in front of the deck (plan coords)
const AREAS: [number, number, number, number][] = [
  [-3.35, 3.1, -4.25, -1.9],
  [-3.35, 0.1, -1.9, -0.2],
];
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const WEEDS = (() => {
  const out: {x: number; y: number; s: number; at: number; yaw: number}[] = [];
  for (let i = 0; i < 260; i++) {
    const a = AREAS[rnd(i * 3) < 0.72 ? 0 : 1];
    out.push({x: a[0] + 0.1 + rnd(i * 3 + 1) * (a[1] - a[0] - 0.2), y: a[2] + 0.1 + rnd(i * 3 + 2) * (a[3] - a[2] - 0.2), s: 0.6 + rnd(i * 7) * 0.8, at: rnd(i * 11), yaw: rnd(i * 13) * 6.28});
  }
  return out;
})();

// growth 0..1 over the year, per weed (later weeds start later)
const Weed: React.FC<{x: number; y: number; h: number; yaw: number; dark: boolean}> = ({x, y, h, yaw, dark}) => {
  if (h <= 0.005) return null;
  const col = dark ? '#3f6b2c' : '#6a9a3c';
  return (
    <group position={[x, 0.04, -y]} rotation={[0, yaw, 0]}>
      {[-0.35, 0, 0.35].map((t, i) => (
        <mesh key={i} position={[Math.sin(t) * h * 0.25, h / 2, 0]} rotation={[0, 0, -t]} castShadow>
          <coneGeometry args={[0.02 + h * 0.05, h, 5]} />
          <meshStandardMaterial color={col} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const M8: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  // year progress 0..1: 1 month ≈ 0.08, 3 months 0.25, half 0.5, a year 1
  const yr = f < at('02') ? 0.9 : f < at('03') ? 0.08 * ramp(f, at('02'), at('02') + 40) : f < at('04') ? 0.08 + 0.17 * ramp(f, at('03'), at('03') + 50) : f < at('05') ? 0.25 + 0.25 * ramp(f, at('04'), at('04') + 50) : f < at('08') ? 0.5 + 0.5 * ramp(f, at('05'), at('06') + 30) : 1;
  const label = f < at('02') || f >= at('08') ? '' : f < at('03') ? '1か月' : f < at('04') ? '3か月' : f < at('05') ? '半年' : '1年';
  const sheetMode = f >= at('08');
  const calm = f >= at(LAST);
  const sink = f >= at('06') && !sheetMode ? ramp(f, at('06'), at('06') + 60) : f < at('02') ? 0.6 : 0;
  const grow = (w: (typeof WEEDS)[number]) => {
    if (sheetMode) return 0;
    const start = w.at * 0.55; // weeds keep appearing until mid-year
    const g = Math.max(0, (yr - start) / (1 - start));
    const hMax = 0.75 * w.s;
    return yr < 0.1 ? Math.min(0.04, g * 0.4) * w.s : Math.min(hMax, 0.03 + g * hMax * 1.1);
  };
  const regravel = f >= at('07') && f < at('08') ? ramp(f, at('07'), at('07') + 25) : 0;
  const cam = camTrack([
    [0, [1.8, -7.6, 6.2], [-0.4, -2.6, 0.0], 54],
    [at('02'), [1.6, -7.4, 6.0], [-0.4, -2.6, 0.0], 54],
    [at('02') + 12, [2.2, -3.9, 1.0], [0.6, -2.9, 0.05], 50],
    [at('03'), [2.2, -3.8, 1.0], [0.6, -2.9, 0.05], 50],
    [at('03') + 12, [1.6, -6.4, 5.2], [-0.6, -2.6, 0.1], 54],
    [at('05'), [1.8, -6.6, 5.3], [-0.6, -2.6, 0.1], 54],
    [at('05') + 12, [1.8, -7.6, 6.2], [-0.4, -2.6, 0.0], 54],
    [at('08') - 1, [2.0, -7.8, 6.3], [-0.4, -2.6, 0.0], 54],
    [at(LAST), [1.8, -7.6, 6.2], [-0.4, -2.6, 0.0], 54],
    [M8_FRAMES, [2.0, -7.8, 6.3], [-0.4, -2.6, 0.0], 54],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const overlap = ramp(f, at('09'), at('09') + 30);
  const cover = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const gravelCol = (() => {
    const k = sink * 0.7 - regravel * 0.5;
    const m = Math.max(0, Math.min(1, k));
    const r = Math.round(150 - 40 * m);
    const g = Math.round(146 - 50 * m);
    const b = Math.round(138 - 60 * m);
    return `rgb(${r},${g},${b})`;
  })();
  const weeds = useMemo(() => WEEDS, []);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D cars />
        {AREAS.map(([x0, x1, y0, y1], i) => (
          <PBox key={i} x0={x0} x1={x1} y0={y0} y1={y1} h0={0.02} h1={0.045} m={{color: gravelCol, tex: 'gravel', rough: 1}} />
        ))}
        {weeds.map((w, i) => (
          <Weed key={i} x={w.x} y={w.y} h={grow(w)} yaw={w.yaw} dark={i % 3 === 0} />
        ))}
        {calm ? <Person3D x={1.2} y={-3.4} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>砂利だけ（シートなし）</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '1年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr) * 100}%`, height: '100%', background: label === '1年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {regravel > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: regravel}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(16,22,30,0.85)', padding: '10px 28px', borderRadius: 14}}>砂利を足しても…</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 50%, #8a6a46 50%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: cover > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{cover > 0 ? '砂利を敷いたら、見えない' : '砂利の下に「防草シート」'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* two sheets overlapping */}
            <rect x={60} y={948} width={560 + 60 * (1 - overlap)} height={14} fill="#1d1f22" />
            <rect x={540 + 60 * (1 - overlap)} y={938} width={480} height={14} fill="#2b2d31" />
            {overlap > 0.5 ? (
              <g opacity={(overlap - 0.5) * 2}>
                <line x1={540} y1={900} x2={540} y2={930} stroke="#ffd34d" strokeWidth={5} />
                <line x1={620} y1={900} x2={620} y2={930} stroke="#ffd34d" strokeWidth={5} />
                <text x={580} y={880} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>重ねる</text>
                {[90, 990].map((x) => (
                  <g key={x}>
                    <line x1={x} y1={920} x2={x} y2={1010} stroke="#8c96a0" strokeWidth={8} />
                    <rect x={x - 18} y={912} width={36} height={10} fill="#8c96a0" />
                  </g>
                ))}
                <text x={90} y={1070} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" fontFamily={FONT}>端は押さえる</text>
              </g>
            ) : null}
            {/* weeds blocked under the sheet */}
            {[200, 380, 760, 900].map((x) => (
              <path key={x} d={`M ${x} 1040 q 8 -40 0 -76`} stroke="#4f7a3f" strokeWidth={8} fill="none" />
            ))}
            {cover > 0 ? (
              <g opacity={cover}>
                {Array.from({length: 80}).map((_, i) => (
                  <circle key={i} cx={70 + ((i * 97) % 940)} cy={930 - 10 - ((i * 37) % 40) - 60 * (1 - cover)} r={14 + (i % 4) * 3} fill={i % 3 ? '#9a958c' : '#7f7a71'} />
                ))}
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>防草シートなしで砂利だけ</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>1年後どうなる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　草の伸び方は場所と季節で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：シートを見に行く日と、聞くこと</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>庭・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M8/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('06') + 10} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('10') + 20} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.6} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
