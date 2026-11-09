import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import {Rain} from './M2b';
import DUR from '../../public/voice/M10/durations.json';
import LINES from '../../../narration/M10.json';

// もしも M10（15:30 災害枠・ナレーション版）：台風で、物置は飛ぶのか（風速20 → 30 → 40、倒れて車へ → アンカーで固定）
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.4, '02': 0.5, '03': 0.6, '04': 0.4, '05': 0.4, '06': 1.3, '07': 0.3, '08': 1.6, '09': 0.5, '10': 0.8, '11': 1.0};
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
export const M10_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// shed footprint (plan coords)
const SH = {x0: 0.1, x1: 1.7, y0: -3.85, y1: -3.0, h: 1.8};
const SW = SH.x1 - SH.x0;
const SD = SH.y1 - SH.y0;
const YC = (SH.y0 + SH.y1) / 2;
const BLK = 0.1;

// the shed pivots around its east bottom edge: px = pivot x, ph = pivot height, th = tip angle (rad), jx/jy = jitter
const Shed: React.FC<{px: number; ph: number; th: number; jx: number; rz: number; anchors?: boolean}> = ({px, ph, th, jx, rz, anchors}) => (
  <group position={[px + jx, ph, -YC]} rotation={[0, 0, -th + rz]}>
    <group position={[-SW / 2, SH.h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[SW, SH.h, SD]} />
        <meshStandardMaterial color="#d8d1c0" roughness={0.55} metalness={0.2} />
      </mesh>
      {/* roof with overhang */}
      <mesh position={[0, SH.h / 2 + 0.04, 0]} rotation={[0.06, 0, 0]} castShadow>
        <boxGeometry args={[SW + 0.12, 0.06, SD + 0.14]} />
        <meshStandardMaterial color="#6f7b80" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* sliding doors on the north face (toward the house) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * SW) / 4, -0.05, -SD / 2 - 0.006]}>
          <boxGeometry args={[SW / 2 - 0.04, SH.h - 0.3, 0.01]} />
          <meshStandardMaterial color="#c9c1ae" roughness={0.5} metalness={0.25} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'h' + s} position={[s * 0.08, 0, -SD / 2 - 0.02]}>
          <boxGeometry args={[0.03, 0.22, 0.02]} />
          <meshStandardMaterial color="#3a3c3f" />
        </mesh>
      ))}
      {/* base frame */}
      <mesh position={[0, -SH.h / 2 + 0.04, 0]}>
        <boxGeometry args={[SW + 0.02, 0.08, SD + 0.02]} />
        <meshStandardMaterial color="#5d6468" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
    {anchors
      ? [-SW + 0.08, -0.08].map((x) => (
          <mesh key={x} position={[x, -BLK / 2, SD / 2 - 0.05]}>
            <boxGeometry args={[0.1, BLK + 0.06, 0.04]} />
            <meshStandardMaterial color="#e8622c" roughness={0.4} metalness={0.5} />
          </mesh>
        ))
      : null}
  </group>
);

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

export const M10: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const v = f < at('02') ? 30 : f < at('03') ? 20 : f < at('05') ? 20 + 10 * ramp(f, at('03'), at('03') + 20) : 30 + 10 * ramp(f, at('05'), at('05') + 30);
  const calm = f >= at(LAST);
  const diagram = f >= at('09') && f < at(LAST);
  const storm = calm ? 0 : Math.min(1, (v - 12) / 28);
  // rattle from line 03 until it slides
  const rattle = f >= at('03') && f < at('06') ? ramp(f, at('03'), at('03') + 20) * (f >= at('05') ? 1.6 : 1) : f < at('02') ? 1 : 0;
  const t6 = at('06');
  const slide = ramp(f, t6, t6 + 22);
  const tip = ramp(f, t6 + 18, t6 + 42);
  const hitAt = at('08') + 40;
  const roll = ramp(f, hitAt - 25, hitAt);
  const fallen = !calm && f >= t6;
  const px = SH.x1 + (fallen ? 0.5 * slide * slide + 0.13 * roll : 0);
  const ph = fallen ? BLK * (1 - slide) : BLK;
  const th = fallen ? (Math.PI / 2) * tip * tip + 0.12 * Math.sin(roll * Math.PI) : 0;
  const hop = Math.abs(Math.sin(f * 1.9)) * 0.03 * rattle;
  const jx = Math.sin(f * 2.7) * 0.012 * rattle;
  const rz = Math.sin(f * 1.3) * 0.02 * rattle;
  const flash = f >= hitAt && f < hitAt + 8 ? 1 - (f - hitAt) / 8 : 0;
  const carShake = f >= hitAt && f < hitAt + 20 ? Math.sin((f - hitAt) * 2.5) * 0.04 * (1 - (f - hitAt) / 20) : 0;
  const cam = camTrack([
    [0, [-2.0, -0.4, 5.2], [2.4, -3.5, 0.4], 58],
    [at('02'), [-1.9, -0.5, 5.1], [2.3, -3.5, 0.4], 58],
    [at('04'), [-0.9, -1.2, 3.0], [1.0, -3.4, 0.6], 56],
    [at('05'), [-0.9, -1.2, 3.0], [1.0, -3.4, 0.6], 56],
    [at('05') + 12, [-2.0, -0.4, 5.2], [2.4, -3.5, 0.4], 58],
    [at('07'), [-2.0, -0.4, 5.2], [2.4, -3.5, 0.4], 58],
    [at('08'), [0.2, -0.4, 3.6], [3.6, -3.4, 0.6], 54],
    [at('09') - 1, [0.4, -0.5, 3.6], [3.8, -3.4, 0.6], 54],
    [at(LAST), [-2.0, -0.4, 5.2], [2.2, -3.5, 0.4], 58],
    [M10_FRAMES, [-2.1, -0.3, 5.3], [2.2, -3.5, 0.4], 58],
  ]);
  const c0 = cam(f);
  const shk = 0.012 * storm + Math.abs(carShake);
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 2.3) * shk, c0.pos[1] + Math.sin(f * 2.3 + 1.1) * shk, c0.pos[2] + Math.sin(f * 2.3 + 2.2) * shk] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('07') ? 1 : 0;
  const blocks = f >= at('04') && f < at('05') ? ramp(f, at('04') + 10, at('04') + 20) : 0;
  const dShow = ramp(f, at('09'), at('09') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST)));
  const hide = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.95 - 0.35 * storm} sun={calm ? 2.4 : 2.2 - 1.8 * storm}>
        <House3D />
        <group position={[carShake, 0, 0]}>
          <Gaiko3D cars />
        </group>
        {/* concrete blocks the shed sits on */}
        {[SH.x0 + 0.12, SH.x1 - 0.12].flatMap((x) =>
          [SH.y0 + 0.1, SH.y1 - 0.1].map((y) => <PBox key={x + ',' + y} x0={x - 0.1} x1={x + 0.1} y0={y - 0.07} y1={y + 0.07} h0={0} h1={BLK} m={{color: '#a9a69f', tex: 'conc', rough: 0.95}} />),
        )}
        <Shed px={px} ph={ph + (fallen ? 0 : hop)} th={th} jx={fallen ? 0 : jx} rz={fallen ? 0 : rz} anchors={calm} />
        {calm ? <Person3D x={-1.0} y={-2.4} yaw={300} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {!calm && !diagram ? <Rain f={f} k={storm} slant={0.25 + 0.6 * storm} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.8})`}} /> : null}
      <Meter v={v} o={meter} />
      {blocks > 0 ? (
        <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: blocks}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(192,57,43,0.92)', padding: '10px 28px', borderRadius: 14}}>ブロックに置いてあるだけ</span>
        </div>
      ) : null}
      {f >= hitAt && f < at('09') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, transform: `scale(${1 + 0.3 * (1 - ramp(f, hitAt, hitAt + 8))})`}}>
          <span style={{fontSize: 120, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>ドンッ！</span>
        </div>
      ) : null}
      {dShow > 0 ? (
        <AbsoluteFill style={{opacity: dShow}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 58%, #8a6a46 58%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: hide > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{hide > 0 ? '置いたら、裏側は見えない' : '「アンカー」で地面に固定'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* shed side view */}
            <rect x={240} y={560} width={600} height={500} fill="#d8d1c0" stroke="#6d6a64" strokeWidth={5} />
            <rect x={220} y={540} width={640} height={26} fill="#6f7b80" />
            <rect x={240} y={1040} width={600} height={20} fill="#5d6468" />
            {[270, 750].map((x) => (
              <rect key={x} x={x} y={1060} width={60} height={54} fill="#a9a69f" stroke="#6d6a64" strokeWidth={3} />
            ))}
            {/* anchors: bracket bolted to the frame, rod into the ground */}
            {[200, 880].map((x, i) => (
              <g key={x}>
                <path d={`M ${i ? x - 40 : x + 40} 1040 L ${x} 1040 L ${x} 1114`} stroke="#e8622c" strokeWidth={14} fill="none" />
                <rect x={x - 9} y={1114} width={18} height={150} fill="#e8622c" />
                <path d={`M ${x - 24} 1264 l 24 30 l 24 -30 z`} fill="#e8622c" />
              </g>
            ))}
            <text x={540} y={1200} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" fontFamily={FONT}>金具で物置と地面をつなぐ</text>
            {hide > 0 ? (
              <g opacity={hide}>
                <rect x={240} y={560} width={600} height={500} fill="#cfc8b6" stroke="#6d6a64" strokeWidth={5} />
                {[200, 880].map((x) => (
                  <circle key={x} cx={x} cy={1090} r={70} stroke="#c0392b" strokeWidth={10} fill="none" />
                ))}
                <text x={540} y={820} textAnchor="middle" fontSize={64} fontWeight={900} fill="#c0392b" fontFamily={FONT}>付いてる？</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 92, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>台風で、物置は</div>
          <div style={{fontSize: 130, fontWeight: 900, color: '#ffd34d', textShadow: outline(7), marginTop: 6}}>飛ぶのか？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　風速は目安、物置の大きさや中身で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：物置を置く日に見ること</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>物置・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M10/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={t6 + 40} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.7} /></Sequence>
      <Sequence from={hitAt} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
