import React from 'react';
import {AbsoluteFill, Audio, Loop, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D, Ring3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M5/durations.json';
import LINES from '../../../narration/M5.json';

// もしも物理 M5：1時間に100ミリの雨が降ったら（約58秒・ナレーション入り）
// 20 → 40（道路が川）→ 70（雨どいがあふれる）→ 100 → 駐車場の水は道路へ → 傾きが逆なら家の足もとへ → 1〜2%は目で見えない → 打ったら直せない
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.6, '05': 0.6, '06': 0.4, '07': 0.8, '08': 1.4, '09': 0.5, '10': 0.8, '11': 1.0};
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
export const M5_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const water = (o: number) => ({color: '#7f9fb8', rough: 0.05, opacity: o, emissive: '#3d5f7a', emissiveIntensity: 0.2});

const Rain: React.FC<{f: number; k: number}> = ({f, k}) => {
  if (k <= 0) return null;
  const slant = 0.12 + 0.2 * k;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(rgba(20,30,45,${0.3 + 0.35 * k}), rgba(20,30,45,${0.1 + 0.2 * k}) 60%, rgba(20,30,45,${0.2 + 0.25 * k}))`}} />
      {Array.from({length: Math.round(50 + 150 * k)}).map((_, i) => {
        const sx = (i * 197) % 1400;
        const sp = 55 + (i % 7) * 7 + 35 * k;
        const y = ((f * sp + i * 131) % 2200) - 200;
        const x = sx - ((y * slant) % 1600) + 200;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 60 + (i % 4) * 25 + 40 * k, background: `rgba(220,230,245,${0.35 + 0.25 * k})`, transform: `rotate(${Math.atan(slant) * 57}deg)`, borderRadius: 2}} />;
      })}
    </AbsoluteFill>
  );
};

const LABEL: [number, string][] = [
  [20, 'どしゃ降り'],
  [40, 'バケツをひっくり返したよう'],
  [70, '滝のよう'],
  [100, '猛烈な雨'],
];
const Meter: React.FC<{v: number; o: number}> = ({v, o}) => {
  if (o <= 0) return null;
  const danger = v >= 70;
  const lab = [...LABEL].reverse().find(([m]) => v >= m - 0.5)?.[1] ?? '';
  return (
    <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: o}}>
      <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>1時間に</div>
      <div style={{fontSize: 150, fontWeight: 900, color: danger ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1}}>
        {Math.round(v)}
        <span style={{fontSize: 70}}>mm</span>
      </div>
      <div style={{marginTop: 12}}>
        <span style={{background: danger ? '#c0392b' : '#e8622c', color: '#fff', fontSize: 46, fontWeight: 900, padding: '8px 26px', borderRadius: 14}}>{lab}</span>
      </div>
    </div>
  );
};

// cross-section of the parking slab with the fall towards the road
const SlopeDiagram: React.FC<{f: number; o: number; pour: number}> = ({f, o, pour}) => {
  if (o <= 0) return null;
  const tilt = ramp(f, at('09') + 10, at('09') + 40);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 52%, #8a6a46 52%, #7a5b3b)'}} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
        {/* house wall on the left */}
        <rect x={40} y={560} width={120} height={440} fill="#ecebe6" stroke="#8a857c" strokeWidth={4} />
        <text x={100} y={540} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>家</text>
        <text x={960} y={960} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>道路</text>
        {/* slab: from house side (higher) down to road side */}
        <polygon points={`160,${990 - 90 * tilt} 1040,990 1040,1040 160,1040`} fill={pour > 0 ? '#bdb9b0' : '#d7d4cd'} stroke="#a9a59c" strokeWidth={4} />
        <line x1={160} y1={980 - 90 * tilt} x2={1040} y2={980} stroke="#2f80c0" strokeWidth={6} strokeDasharray="18 12" strokeDashoffset={-f * 3} opacity={tilt} />
        <text x={600} y={900} textAnchor="middle" fontSize={64} fontWeight={900} fill="#2f80c0" stroke="#fff" strokeWidth={8} paintOrder="stroke" fontFamily={FONT} opacity={tilt}>→ 1〜2%</text>
        <text x={600} y={1130} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" stroke={ink} strokeWidth={8} paintOrder="stroke" fontFamily={FONT} opacity={tilt}>1mで1〜2cm（図は大げさに描いています）</text>
        {pour > 0 ? (
          <g opacity={pour}>
            <rect x={160} y={1180} width={880} height={110} rx={18} fill="#c0392b" />
            <text x={600} y={1255} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fff" fontFamily={FONT}>打ったら、ほとんど直せない</text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export const M5: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const v = f < at('02') ? 60 : f < at('03') ? 20 : f < at('04') ? 20 + 20 * ramp(f, at('03'), at('03') + 30) : f < at('05') ? 40 + 30 * ramp(f, at('04'), at('04') + 30) : 70 + 30 * ramp(f, at('05'), at('05') + 30);
  const calm = f >= at('09');
  const k = calm ? 0 : Math.min(1, v / 100);
  const river = f >= at('03') && !calm ? ramp(f, at('03') + 20, at('03') + 70) : 0;
  const gutter = f >= at('04') + 30 && !calm ? ramp(f, at('04') + 30, at('04') + 50) : 0;
  const toRoad = f >= at('06') && f < at('07') ? ramp(f, at('06'), at('06') + 12) : 0;
  const toHouse = f >= at('07') && f < at('09') ? ramp(f, at('07') + 10, at('07') + 22) : 0;
  const pool = f >= at('07') + 30 && f < at('09') ? ramp(f, at('07') + 30, at('08') + 90) : 0;
  const midX = (PARK.x0 + PARK.x1) / 2;
  const cam = camTrack([
    [0, [6.4, -12.6, 2.4], [6.2, -1.5, 2.2], 58],
    [at('02'), [6.0, -12.2, 2.4], [6.2, -1.5, 2.2], 58],
    [at('03') + 10, [12.0, -14.5, 3.4], [6.0, -5.0, 1.0], 58],
    [at('04'), [11.5, -14.0, 3.4], [6.0, -5.0, 1.0], 58],
    [at('04') + 12, [9.5, -11.5, 4.8], [5.0, -0.5, 3.0], 58],
    [at('06'), [9.2, -11.2, 4.6], [5.0, -0.5, 3.0], 58],
    [at('06') + 12, [6.2, -10.5, 7.0], [6.2, -2.2, 0.0], 50],
    [at('08'), [6.2, -10.2, 6.8], [6.2, -2.2, 0.0], 50],
    [at('08') + 14, [7.4, -5.6, 1.3], [5.6, -0.4, 0.3], 54],
    [at('09') - 1, [7.2, -5.2, 1.3], [5.6, -0.4, 0.3], 54],
    [at('11'), [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
    [M5_FRAMES, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('06') ? 1 : 0;
  const diag = f >= at('09') && f < at('11') ? ramp(f, at('09'), at('09') + 10) * (1 - ramp(f, at('11') - 8, at('11'))) : 0;
  const pour = ramp(f, at('10') + 20, at('10') + 34);
  const endCard = ramp(f, at('11') + 6, at('11') + 20);
  if (!a) return null;
  // dir 1 = towards the road, -1 = towards the house. Head is a stepped triangle at the leading end.
  const arrows = (dir: 1 | -1, o: number, color: string, emissive: string) =>
    [PARK.x0 + 1.0, midX, PARK.x1 - 1.0].map((x, i) => {
      const flow = ((f + i * 10) % 40) / 40;
      const lead = dir === 1 ? -1.5 - flow * 2.2 : -3.7 + flow * 2.2;
      const back = lead + dir * 1.1;
      const m = {color, emissive, emissiveIntensity: 0.8, opacity: o};
      const step = (w: number, k: number) => {
        const ya = lead + dir * 0.14 * k;
        const yb = lead + dir * 0.14 * (k + 1);
        return <PBox key={k} x0={x - w} x1={x + w} y0={Math.min(ya, yb)} y1={Math.max(ya, yb)} h0={0.035} h1={0.055} m={m} cast={false} />;
      };
      return (
        <group key={i}>
          <PBox x0={x - 0.08} x1={x + 0.08} y0={Math.min(lead + dir * 0.4, back)} y1={Math.max(lead + dir * 0.4, back)} h0={0.035} h1={0.055} m={m} cast={false} />
          {step(0.07, 0)}
          {step(0.18, 1)}
          {step(0.3, 2)}
        </group>
      );
    });
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.95 - 0.3 * k} sun={calm ? 2.4 : 2.0 - 1.7 * k}>
        <House3D />
        <Gaiko3D noCarport />
        {/* road turning into a river */}
        {river > 0 ? <PBox x0={-30} x1={40} y0={-11} y1={PARK.y0 - 0.2} h0={0.0} h1={0.02 + 0.05 * river} m={water(0.55 * river)} cast={false} /> : null}
        {/* gutters overflowing at the front corners */}
        {gutter > 0
          ? [0.25, 4.5, 8.85].map((x, i) => (
              <mesh key={i} position={[x + Math.sin(f * 0.9 + i) * 0.02, 2.9, 0.45]}>
                <boxGeometry args={[0.12 + 0.04 * Math.sin(f * 1.3 + i), 5.8, 0.06]} />
                <meshStandardMaterial color="#cfe0f0" transparent opacity={0.5 * gutter} emissive="#6f8fa8" emissiveIntensity={0.3} />
              </mesh>
            ))
          : null}
        {toRoad > 0 ? arrows(1, toRoad, '#4aa3e0', '#1f6fb0') : null}
        {toHouse > 0 ? arrows(-1, toHouse * (1 - pool * 0.6), '#ff5a3c', '#c0301a') : null}
        {/* water gathering at the foot of the house */}
        {pool > 0 ? <PBox x0={PARK.x0} x1={PARK.x1 + 1.6} y0={-0.35 - 3.2 * pool} y1={-0.05} h0={0.03} h1={0.035 + 0.1 * pool} m={water(0.65)} cast={false} /> : null}
        {f >= at('08') + 20 && f < at('09') ? <Ring3D p={[5.6, -0.15, 0.35]} o={ramp(f, at('08') + 20, at('08') + 28)} f={f} r={0.35} vertical /> : null}
        {f >= at('11') ? <Person3D x={10.2} y={-1.6} yaw={250} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {!calm ? <Rain f={f} k={k} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <Meter v={v} o={meter} />
      <SlopeDiagram f={f} o={diag} pour={pour} />
      {toHouse > 0 && f < at('08') ? (
        <div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: toHouse}}>
          <span style={{fontSize: 64, fontWeight: 900, color: '#fff', background: '#c0392b', padding: '10px 30px', borderRadius: 16}}>傾きが、家のほうへ</span>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>1時間に100ミリの雨</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>家のまわりは？</div>
        </div>
      ) : null}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>水の流れる向きは、打つ前の日に確認</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>駐車場・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {/* audio */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M5/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at('09')}>
        <Loop durationInFrames={120}>
          <Audio src={staticFile('sfx/wind.wav')} volume={(fr) => 0.2 + 0.35 * Math.min(1, fr / 600)} />
        </Loop>
      </Sequence>
      {Array.from({length: Math.floor((at('09') - at('03')) / 30)}).map((_, i) => (
        <Sequence key={'r' + i} from={at('03') + i * 30} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.25 + 0.04 * Math.min(10, i)} /></Sequence>
      ))}
      <Sequence from={at('05') + 4} durationInFrames={60}><Audio src={staticFile('sfx/boom.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('07') + 8} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.7} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('10') + 20} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.7} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
