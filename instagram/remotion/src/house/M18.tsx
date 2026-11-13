import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Car, Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M18/durations.json';
import LINES from '../../../narration/M18.json';

// もしも M18（15:30 災害枠・ナレーション版）：ゲリラ豪雨で、家の前の水はどこへ行く？（水勾配）
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
export const M18_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};


const DROPS = Array.from({length: 40}, (_, i) => ({x: PARK.x0 + 0.2 + rnd(i * 3) * (PARK.x1 - PARK.x0 - 0.4), y: -0.3 - rnd(i * 7) * 3.8, ph: rnd(i * 11)}));

const RainFx: React.FC<{f: number; k: number}> = ({f, k}) => {
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(30,40,55,${0.12 + 0.25 * k})`}} />
      {Array.from({length: Math.round(60 + 160 * k)}).map((_, i) => {
        const sx = (i * 197) % 1180 - 50;
        const sp = 70 + (i % 7) * 8 + 40 * k;
        const y = ((f * sp + i * 131) % 2300) - 250;
        return <div key={i} style={{position: 'absolute', left: sx + y * 0.08, top: y, width: 2 + (i % 3), height: 80 + (i % 4) * 30, background: 'rgba(220,230,245,0.45)', transform: 'rotate(-4.5deg)', borderRadius: 2}} />;
      })}
    </AbsoluteFill>
  );
};

export const M18: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const calm = f >= at('09');
  const mm = calm ? 0 : f < at('02') ? 80 : f < at('03') ? 20 : f < at('05') ? 20 + 30 * ramp(f, at('03'), at('03') + 20) : f < at('07') ? 50 + 30 * ramp(f, at('05') + 10, at('05') + 30) : 80;
  const rk = mm / 80;
  // pool length from the house side towards the road (m), and whether it reaches the wall
  const pool = calm ? 0 : f < at('02') ? 4.0 : f < at('03') ? 0 : f < at('05') ? 2.0 * ramp(f, at('03') + 20, at('04')) : f < at('06') ? 2.0 + 1.0 * ramp(f, at('05') + 10, at('06')) : 3.0 + 1.1 * ramp(f, at('06'), at('06') + 60);
  const toWall = calm ? 0 : f < at('02') ? 1 : f < at('06') ? 0 : ramp(f, at('06') + 10, at('06') + 50);
  const runoff = !calm && f >= at('02') && f < at('03') ? 1 : 0;
  const depth = 0.012 + 0.04 * Math.min(1, pool / 4);
  const cam = camTrack([
    [0, [12.6, -11.6, 6.2], [5.6, -1.9, 0.0], 50],
    [at('02'), [12.4, -11.4, 6.1], [5.6, -1.9, 0.0], 50],
    [at('04'), [12.0, -11.0, 5.8], [5.6, -1.9, 0.0], 50],
    [at('05'), [12.2, -11.2, 5.9], [5.6, -1.9, 0.0], 50],
    [at('06') + 10, [3.6, -3.4, 0.9], [5.0, -0.1, 0.15], 50],
    [at('08') - 1, [3.7, -3.3, 0.88], [5.0, -0.1, 0.15], 50],
    [at('08') + 10, [4.1, -2.2, 0.55], [5.0, 0.0, 0.15], 48],
    [at('09') - 1, [4.1, -2.1, 0.55], [5.0, 0.0, 0.15], 48],
    [at('09'), [12.6, -11.6, 6.2], [5.6, -2.0, 0.0], 50],
    [M18_FRAMES, [12.9, -11.9, 6.4], [5.6, -2.0, 0.0], 50],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const slope = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) * (1 - ramp(f, at('05') - 6, at('05'))) : 0;
  const scary = f >= at('08') && f < at('09') ? ramp(f, at('08'), at('08') + 10) : 0;
  const diag = f >= at('09') && f < at(LAST) ? ramp(f, at('09') + 40, at('09') + 50) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const lock = ramp(f, at('10'), at('10') + 20);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  const mmCol = mm >= 80 ? '#ff3b2f' : mm >= 50 ? '#ff9a3c' : '#ffd34d';
  if (!a) return null;
  const y1 = -0.35;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.75 - 0.15 * rk} sun={calm ? 2.4 : 1.0 - 0.4 * rk}>
        <House3D />
        <Gaiko3D noCarport />
        <Car x={7.6} y={-2.4} color="#2c3a4f" />
        {/* standing water: from the house side towards the road */}
        {pool > 0.02 ? (
          <PBox x0={PARK.x0 + 0.05} x1={PARK.x1 - 0.05} y0={y1 - pool} y1={y1} h0={0.03} h1={0.03 + depth} m={{color: '#6f8696', opacity: 0.78, metal: 0.4, rough: 0.05}} cast={false} />
        ) : null}
        {toWall > 0 ? (
          <PBox x0={PARK.x0 + 0.05 - 0.4 * toWall} x1={PARK.x1 - 0.05} y0={y1 - 0.01} y1={y1 + 0.34 * toWall} h0={0.01} h1={0.03 + depth} m={{color: '#6f8696', opacity: 0.8, metal: 0.4, rough: 0.05}} cast={false} />
        ) : null}
        {/* runoff to the road while the rain is light */}
        {runoff ? (
          <PBox x0={PARK.x0 + 0.6} x1={PARK.x1 - 0.6} y0={-4.5} y1={-3.6} h0={0.03} h1={0.036} m={{color: '#7d97ab', opacity: 0.5, metal: 0.3, rough: 0.1}} cast={false} />
        ) : null}
        {/* rain rings on the water */}
        {pool > 0.3
          ? DROPS.filter((d) => d.y > y1 - pool).map((d, i) => {
              const t = ((f / 18 + d.ph) % 1);
              return (
                <mesh key={i} position={[d.x, 0.03 + depth + 0.002, -d.y]} rotation={[-Math.PI / 2, 0, 0]} scale={0.04 + t * 0.14}>
                  <torusGeometry args={[1, 0.08, 4, 20]} />
                  <meshBasicMaterial color="#dfe8f0" transparent opacity={(1 - t) * 0.7 * rk} />
                </mesh>
              );
            })
          : null}
        {/* the good version: drain channel with grating at the road edge + a catch basin */}
        {calm ? (
          <>
            <PBox x0={PARK.x0} x1={PARK.x1} y0={-4.48} y1={-4.2} h0={0.0} h1={0.034} m={{color: '#3b3d40', rough: 0.5, metal: 0.6}} />
            {Array.from({length: 28}).map((_, i) => (
              <PBox key={i} x0={PARK.x0 + 0.1 + i * 0.2} x1={PARK.x0 + 0.13 + i * 0.2} y0={-4.46} y1={-4.22} h0={0.034} h1={0.04} m={{color: '#1f2124', rough: 0.5, metal: 0.6}} cast={false} />
            ))}
            <PBox x0={PARK.x1 + 0.05} x1={PARK.x1 + 0.5} y0={-4.5} y1={-4.05} h0={0.05} h1={0.12} m={{color: '#8f8b84', tex: 'conc', rough: 0.9}} />
            <Person3D x={4.2} y={-3.4} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu />
          </>
        ) : null}
      </RealScene>
      <RainFx f={f} k={calm ? 0 : rk} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'}} />
      {!calm && f >= at('02') && f < at('09') ? (
        <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>1時間の雨の量</div>
          <div style={{fontSize: 150, fontWeight: 900, color: mmCol, textShadow: outline(7), lineHeight: 1.05}}>
            {Math.round(mm)}
            <span style={{fontSize: 70}}>ミリ</span>
          </div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${(mm / 80) * 100}%`, height: '100%', background: mmCol}} />
          </div>
        </div>
      ) : null}
      {slope > 0 ? (
        <div style={{position: 'absolute', top: 560, left: 60, right: 60, opacity: slope, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '20px 24px', textAlign: 'center'}}>
            <div style={{fontSize: 46, fontWeight: 900, color: ink}}>水勾配が足りない</div>
            <svg width={900} height={300} viewBox="0 0 900 300">
              <rect x={20} y={40} width={200} height={200} fill="#e4e1da" stroke="#8f8c85" strokeWidth={4} />
              <text x={120} y={150} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>家</text>
              <line x1={220} y1={240} x2={880} y2={228} stroke="#8f8c85" strokeWidth={14} />
              <text x={830} y={280} textAnchor="middle" fontSize={32} fontWeight={900} fill={ink} fontFamily={FONT}>道路</text>
              <path d="M 640 190 L 300 196" stroke="#2f6fb0" strokeWidth={12} fill="none" />
              <path d="M 300 196 l 26 -18 m -26 18 l 26 18" stroke="#2f6fb0" strokeWidth={12} fill="none" />
              <text x={470} y={170} textAnchor="middle" fontSize={34} fontWeight={900} fill="#2f6fb0" fontFamily={FONT}>水が家のほうへ</text>
            </svg>
          </div>
        </div>
      ) : null}
      {scary > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: scary}}>
          <span style={{fontSize: 54, fontWeight: 900, color: '#fff', background: 'rgba(192,57,43,0.95)', padding: '10px 28px', borderRadius: 14}}>床下の湿気・カビの原因に</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: lock > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{lock > 0 ? '打ったら、直せない' : '家から外へ、水勾配'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            <rect x={40} y={520} width={260} height={440} fill="#e4e1da" stroke="#8f8c85" strokeWidth={4} />
            <text x={170} y={760} textAnchor="middle" fontSize={56} fontWeight={900} fill={ink} fontFamily={FONT}>家</text>
            <polygon points="300,950 960,1010 960,1060 300,1060" fill="#cfccc5" stroke="#8f8c85" strokeWidth={4} />
            <rect x={960} y={1000} width={80} height={90} fill="#3b3d40" opacity={ramp(f, at('09') + 70, at('09') + 80)} />
            <text x={1000} y={1130} textAnchor="middle" fontSize={30} fontWeight={900} fill={ink} fontFamily={FONT} opacity={ramp(f, at('09') + 70, at('09') + 80)}>排水溝</text>
            <path d="M 360 920 L 880 968" stroke="#2f6fb0" strokeWidth={14} fill="none" opacity={ramp(f, at('09') + 55, at('09') + 65)} />
            <path d="M 880 968 l -30 -24 m 30 24 l -34 14" stroke="#2f6fb0" strokeWidth={14} fill="none" opacity={ramp(f, at('09') + 55, at('09') + 65)} />
            <text x={620} y={900} textAnchor="middle" fontSize={40} fontWeight={900} fill="#2f6fb0" fontFamily={FONT} opacity={ramp(f, at('09') + 55, at('09') + 65)}>ほんの少し外へ傾ける</text>
            {lock > 0 ? (
              <g opacity={lock}>
                <polygon points="300,950 960,1010 960,1060 300,1060" fill="#a9a69e" />
                <text x={630} y={1170} textAnchor="middle" fontSize={50} fontWeight={900} fill="#c0392b" fontFamily={FONT}>コンクリートを打つ前に確認</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>ゲリラ豪雨で<br />家の前の水は</div>
          <div style={{fontSize: 110, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>どこへ行く？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　水の流れ方は土地や工事で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>家や外構を計画中の人は</div>
            <div style={{fontSize: 60, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>プロフのリンクへ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>工事の前に見ることもまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M18/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at('09')}><Audio src={staticFile('sfx/wind.wav')} volume={(fr) => 0.12 + 0.25 * ((fr < at('02') ? 80 : fr < at('03') ? 20 : fr < at('05') ? 50 : 80) / 80)} loop /></Sequence>
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('07')} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
