import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Line3D} from './Kit3D';
import {PBox} from './Geo';
import {M as MOD, FL1} from './House';
import {Rain} from './M2b';
import DUR from '../../public/voice/M14/durations.json';
import LINES from '../../../narration/M14.json';

// もしも M14（15:30 災害枠・ナレーション版）：台風で、窓ガラスは割れるのか（風速20 → 30 → 40、飛来物で割れる → 家の中から屋根を押す → シャッター）
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.4, '02': 0.5, '03': 0.6, '04': 0.5, '05': 0.4, '06': 1.3, '07': 0.3, '08': 1.0, '09': 0.6, '10': 0.8, '11': 1.0};
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
export const M14_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// the big south sweep window of the LDK (plan coords)
const WX0 = 3 * MOD + 0.02;
const WX1 = 6 * MOD - 0.02;
const WZ0 = FL1 + 0.02;
const WZ1 = FL1 + 2.18;
const WY = -0.06;
const HIT: [number, number] = [WX0 + 0.95, FL1 + 1.15];
const CRACKS = Array.from({length: 14}, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + 0.2;
  const L = 0.5 + ((i * 37) % 10) / 12;
  return [Math.cos(a) * L, Math.sin(a) * L * 0.9] as [number, number];
});

const Meter: React.FC<{v: number; o: number}> = ({v, o}) => {
  if (o <= 0) return null;
  const danger = v >= 38;
  return (
    <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: o}}>
      <div style={{fontSize: 48, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>風速</div>
      <div style={{fontSize: 150, fontWeight: 900, color: danger ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1}}>
        {Math.round(v)}
        <span style={{fontSize: 70}}>m/s</span>
      </div>
      <div style={{margin: '14px auto 0', width: 760, height: 26, borderRadius: 13, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
        <div style={{width: `${Math.min(1, v / 50) * 100}%`, height: '100%', background: danger ? '#ff5a3c' : '#ffd34d'}} />
      </div>
    </div>
  );
};

export const M14: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const v = f < at('02') ? 30 : f < at('03') ? 20 : f < at('05') ? 20 + 10 * ramp(f, at('03'), at('03') + 20) : 30 + 10 * ramp(f, at('05'), at('05') + 30);
  const calm = f >= at(LAST);
  const storm = calm ? 0 : Math.min(1, (v - 12) / 28);
  const t6 = at('06');
  const hitAt = t6 + 34;
  const fly = ramp(f, t6, hitAt);
  const broken = !calm && f >= hitAt;
  const crackK = broken ? ramp(f, hitAt, hitAt + 6) : f < at('02') ? 1 : 0;
  const flex = f >= at('03') && f < t6 ? Math.sin(f * 1.1) * 0.012 * ramp(f, at('03'), at('03') + 20) : 0;
  const shutter = f >= at('09') ? ramp(f, at('09') + 10, at('09') + 60) : 0;
  const diag = f >= at('08') && f < at('09') ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at('09') - 8, at('09'))) : 0;
  const card = f >= at('10') && f < at(LAST) ? ramp(f, at('10'), at('10') + 12) : 0;
  // flying flower pot: from the west, curving into the window
  const p0: [number, number, number] = [-3.5, -5.5, 2.6];
  const p1: [number, number, number] = [HIT[0], WY - 0.12, HIT[1]];
  const pot: [number, number, number] = [p0[0] + (p1[0] - p0[0]) * fly, p0[1] + (p1[1] - p0[1]) * fly, p0[2] + (p1[2] - p0[2]) * fly + Math.sin(fly * Math.PI) * 0.8];
  const fall = broken ? ramp(f, hitAt, hitAt + 18) : 0;
  const cam = camTrack([
    [0, [4.4, -7.2, 2.2], [4.0, 0, 1.7], 54],
    [at('02'), [4.4, -7.0, 2.2], [4.0, 0, 1.7], 54],
    [at('03'), [4.2, -5.6, 1.9], [4.0, 0, 1.6], 52],
    [at('05'), [4.2, -5.2, 1.8], [4.0, 0, 1.6], 52],
    [t6, [6.8, -6.8, 2.6], [3.6, 0, 1.6], 56],
    [hitAt + 10, [6.4, -6.2, 2.4], [3.6, 0, 1.5], 54],
    [at('07'), [4.6, -4.6, 1.7], [3.6, 0, 1.6], 50],
    [at('09'), [4.4, -6.8, 2.2], [4.0, 0, 1.7], 54],
    [M14_FRAMES, [4.5, -7.2, 2.3], [4.0, 0, 1.7], 54],
  ]);
  const c0 = cam(f);
  const shk = 0.012 * storm + (f >= hitAt && f < hitAt + 10 ? 0.05 : 0);
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 2.3) * shk, c0.pos[1] + Math.sin(f * 2.3 + 1.1) * shk, c0.pos[2] + Math.sin(f * 2.3 + 2.2) * shk] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('07') ? 1 : 0;
  const note = f >= at('04') && f < at('05') ? ramp(f, at('04') + 10, at('04') + 22) : 0;
  const flash = f >= hitAt && f < hitAt + 8 ? 1 - (f - hitAt) / 8 : 0;
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.95 - 0.35 * storm} sun={calm ? 2.4 : 2.2 - 1.8 * storm}>
        <House3D />
        <Gaiko3D noCarport />
        {/* glass pane in front of the sweep window (flexes in the wind, cracks when hit) */}
        <group position={[0, 0, flex]}>
          <PBox x0={WX0} x1={WX1} y0={WY - 0.01} y1={WY} h0={WZ0} h1={WZ1} m={{color: '#bcd4e6', opacity: broken ? 0.18 : 0.28, metal: 0.4, rough: 0.05}} cast={false} />
          {crackK > 0
            ? CRACKS.map(([dx, dz], i) => (
                <Line3D key={i} a={[HIT[0], WY - 0.015, HIT[1]]} b={[HIT[0] + dx * crackK, WY - 0.015, Math.max(WZ0, Math.min(WZ1, HIT[1] + dz * crackK))]} w={0.012} color="#f4f8fb" emissive />
              ))
            : null}
          {broken ? <PBox x0={HIT[0] - 0.35} x1={HIT[0] + 0.35} y0={WY - 0.012} y1={WY - 0.011} h0={HIT[1] - 0.3} h1={HIT[1] + 0.3} m={{color: '#1a1f26', opacity: 0.85}} cast={false} /> : null}
        </group>
        {/* the flower pot */}
        {f >= t6 && f < at('08') ? (
          broken ? (
            [0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[HIT[0] + (k - 1.5) * 0.25 * fall, Math.max(0.05, HIT[1] - fall * HIT[1]) , -(WY - 0.25 - k * 0.12 * fall)]} rotation={[k + fall * 4, k, fall * 3]} castShadow>
                <boxGeometry args={[0.14, 0.1, 0.06]} />
                <meshStandardMaterial color="#b4623a" roughness={0.9} />
              </mesh>
            ))
          ) : (
            <group position={[pot[0], pot[2], -pot[1]]} rotation={[f * 0.4, f * 0.3, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.16, 0.11, 0.26, 14]} />
                <meshStandardMaterial color="#b4623a" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.14, 8, 6]} />
                <meshStandardMaterial color="#4f7a3f" />
              </mesh>
            </group>
          )
        ) : null}
        {/* shutter rolling down */}
        {shutter > 0 || calm ? (
          <>
            <PBox x0={WX0 - 0.05} x1={WX1 + 0.05} y0={WY - 0.24} y1={WY - 0.02} h0={WZ1} h1={WZ1 + 0.22} m={{color: '#8c9196', metal: 0.4, rough: 0.4}} />
            <PBox x0={WX0} x1={WX1} y0={WY - 0.1} y1={WY - 0.07} h0={WZ1 - (WZ1 - WZ0) * (calm ? 0.55 : shutter)} h1={WZ1} m={{color: '#a9aeb3', metal: 0.4, rough: 0.45}} />
          </>
        ) : null}
      </RealScene>
      {!calm && diag <= 0.5 ? <Rain f={f} k={storm} slant={0.25 + 0.6 * storm} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.85})`}} /> : null}
      <Meter v={v} o={meter} />
      {note > 0 ? (
        <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: note}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(16,22,30,0.88)', padding: '10px 28px', borderRadius: 14}}>こわいのは「飛んでくる物」</span>
        </div>
      ) : null}
      {f >= hitAt && f < at('07') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, transform: `scale(${1 + 0.3 * (1 - ramp(f, hitAt, hitAt + 8))})`}}>
          <span style={{fontSize: 120, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>ガシャーン！</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 62%, #8a6a46 62%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: '#c0392b', color: '#fff'}}>家の中から、屋根を押し上げる</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {(() => {
              const up = 18 * ramp(f, at('08') + 30, at('08') + 60) * (0.6 + 0.4 * Math.abs(Math.sin(f / 5)));
              return (
                <g>
                  <rect x={200} y={700} width={680} height={490} fill="#f2eee6" stroke="#6d6a64" strokeWidth={6} />
                  <path d={`M 170 ${700 - up} L 540 ${520 - up} L 910 ${700 - up}`} fill="#5d646b" stroke="#3b3d40" strokeWidth={8} />
                  {/* broken window on the left wall */}
                  <rect x={194} y={930} width={14} height={160} fill="#1a1f26" />
                  {[0, 1, 2].map((i) => {
                    const x = 60 + ((f * 9 + i * 90) % 260);
                    return <path key={i} d={`M ${x} ${980 + i * 40} l 60 0 l -16 -14 m 16 14 l -16 14`} stroke="#4aa3e0" strokeWidth={8} fill="none" />;
                  })}
                  {[380, 540, 700].map((x, i) => (
                    <path key={x} d={`M ${x} ${960 - ((f * 4 + i * 40) % 160)} l 0 -90 l -18 22 m 18 -22 l 18 22`} stroke="#c0392b" strokeWidth={10} fill="none" />
                  ))}
                </g>
              );
            })()}
          </svg>
        </AbsoluteFill>
      ) : null}
      {shutter > 0 && f < at('10') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: shutter}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(46,157,91,0.95)', padding: '10px 28px', borderRadius: 14}}>シャッター・雨戸・防災ガラス</span>
        </div>
      ) : null}
      {card > 0 ? (
        <div style={{position: 'absolute', top: 600, left: 80, right: 80, opacity: card, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: '28px 30px', textAlign: 'center'}}>
            <div style={{fontSize: 46, fontWeight: 900, color: ink}}>どの窓に付けるか</div>
            <div style={{fontSize: 62, fontWeight: 900, color: '#c0392b', marginTop: 6}}>家の打ち合わせで決まる</div>
            <div style={{fontSize: 36, fontWeight: 800, color: ink, marginTop: 10}}>あとから付けるのは大変</div>
          </div>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 92, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>台風で、窓ガラスは</div>
          <div style={{fontSize: 130, fontWeight: 900, color: '#ffd34d', textShadow: outline(7), marginTop: 6}}>割れる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　風速は目安で、窓の種類や立地で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>家や外構を計画中の人は</div>
            <div style={{fontSize: 60, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>プロフのリンクへ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>打ち合わせで聞くことをまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M14/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('03')} durationInFrames={60}><Audio src={staticFile('sfx/creak.wav')} volume={0.5} /></Sequence>
      <Sequence from={t6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={hitAt} durationInFrames={30}><Audio src={staticFile('sfx/crack.wav')} volume={0.9} /></Sequence>
      <Sequence from={at('09') + 10} durationInFrames={40}><Audio src={staticFile('sfx/rattle.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
