import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Car, Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {SITE} from './Site3D';
import {Rain} from './M2b';
import DUR from '../../public/voice/M12/durations.json';
import LINES from '../../../narration/M12.json';

// もしも M12（15:30 災害枠・ナレーション版）：台風で、目隠しフェンスは倒れるのか（風速20 → 30 → 40、道路へ倒れる → 基礎と柱の間隔）
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.4, '02': 0.5, '03': 0.6, '04': 0.5, '05': 0.4, '06': 1.3, '07': 0.3, '08': 1.6, '09': 0.5, '10': 0.8, '11': 1.0};
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
export const M12_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

const FY = SITE.y0 + 0.15;
const FX0 = SITE.x0;
const FX1 = PARK.x0 - 0.3;
const POSTS = [FX0 + 0.05, (FX0 + FX1) / 2, FX1 - 0.05];
const slat = <meshStandardMaterial color="#6e5440" roughness={0.55} metalness={0.15} />;
const alu = <meshStandardMaterial color="#3b3d40" roughness={0.4} metalness={0.6} />;

// fence: two bays between three posts; th = lean toward the road (rad), wob = per-bay flex
const Fence: React.FC<{th: number; wob: [number, number]; footings: boolean}> = ({th, wob, footings}) => (
  <group position={[0, 0, -FY]} rotation={[th, 0, 0]}>
    {[0, 1].map((b) => {
      const xa = POSTS[b];
      const xb = POSTS[b + 1];
      return (
        <group key={b} position={[(xa + xb) / 2, 0, 0]} rotation={[wob[b], 0, 0]}>
          {Array.from({length: 13}).map((_, i) => (
            <mesh key={i} position={[0, 0.25 + i * 0.12, 0]} castShadow receiveShadow>
              <boxGeometry args={[xb - xa - 0.06, 0.09, 0.02]} />
              {slat}
            </mesh>
          ))}
        </group>
      );
    })}
    {POSTS.map((px) => (
      <group key={px}>
        <mesh position={[px, 0.95, 0]} castShadow>
          <boxGeometry args={[0.07, 1.9, 0.07]} />
          {alu}
        </mesh>
        {footings ? (
          <mesh position={[px, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.13, 0.24, 14]} />
            <meshStandardMaterial color="#b9b4aa" roughness={0.95} />
          </mesh>
        ) : null}
      </group>
    ))}
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

export const M12: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const v = f < at('02') ? 30 : f < at('03') ? 20 : f < at('05') ? 20 + 10 * ramp(f, at('03'), at('03') + 20) : 30 + 10 * ramp(f, at('05'), at('05') + 30);
  const calm = f >= at(LAST);
  const diagram = f >= at('09') && f < at(LAST);
  const storm = calm ? 0 : Math.min(1, (v - 12) / 28);
  const flex = f >= at('03') && f < at('06') ? ramp(f, at('03'), at('03') + 25) * (f >= at('05') ? 1.7 : 1) : f < at('02') ? 1 : f < at('03') ? 0.15 : 0;
  const t6 = at('06');
  const fall = !calm && f >= t6 ? ramp(f, t6 + 8, t6 + 38) : f < at('02') ? 0 : 0;
  const th = calm ? 0 : 1.42 * fall * fall + 0.05 * flex;
  const wob: [number, number] = [Math.sin(f * 0.9) * 0.11 * flex, Math.sin(f * 0.9 + 1.7) * 0.13 * flex];
  const carT = at('08') + 10;
  const carK = ramp(f, carT, carT + 45);
  const carX = -18 + (18 - 5.9) * (1 - (1 - carK) * (1 - carK));
  const hitAt = carT + 45;
  const flash = f >= hitAt && f < hitAt + 8 ? 1 - (f - hitAt) / 8 : 0;
  const cam = camTrack([
    [0, [-0.3, -10.8, 2.8], [-0.3, -4.4, 1.0], 56],
    [at('02'), [-0.3, -10.6, 2.8], [-0.3, -4.4, 1.0], 56],
    [at('03'), [-0.3, -10.2, 2.6], [-0.3, -4.4, 1.0], 56],
    [at('04'), [-0.5, -9.0, 2.4], [-0.3, -4.4, 1.0], 56],
    [at('05') + 12, [-0.3, -11.2, 3.0], [-0.3, -4.6, 0.9], 58],
    [at('06') + 20, [-0.3, -11.4, 3.4], [-0.3, -4.8, 0.7], 58],
    [at('06') + 50, [-0.3, -11.6, 5.2], [-0.3, -5.2, 0.0], 58],
    [at('07'), [-0.3, -11.6, 5.2], [-0.3, -5.2, 0.0], 58],
    [at('08'), [3.5, -11.0, 4.6], [-3.0, -5.5, 0.0], 56],
    [at('09') - 1, [3.7, -11.2, 4.7], [-3.0, -5.5, 0.0], 56],
    [at(LAST), [-0.3, -10.8, 2.8], [-0.3, -4.4, 1.0], 56],
    [M12_FRAMES, [-0.3, -11.0, 2.9], [-0.3, -4.4, 1.0], 56],
  ]);
  const c0 = cam(f);
  const shk = 0.012 * storm + flash * 0.05;
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 2.3) * shk, c0.pos[1] + Math.sin(f * 2.3 + 1.1) * shk, c0.pos[2] + Math.sin(f * 2.3 + 2.2) * shk] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('07') ? 1 : 0;
  const force = f >= at('04') && f < at('05') ? ramp(f, at('04') + 10, at('04') + 22) : 0;
  const dShow = ramp(f, at('09'), at('09') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST)));
  const hide = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.95 - 0.35 * storm} sun={calm ? 2.4 : 2.2 - 1.8 * storm}>
        <House3D />
        <Gaiko3D cars noFence />
        <Fence th={th} wob={wob} footings={fall > 0.3} />
        {f >= carT && f < at('09') ? (
          <group position={[carX, 0, 6.3]} rotation={[0, Math.PI / 2, 0]}>
            <Car x={0} y={0} color="#7a2a2a" />
          </group>
        ) : null}
        {calm ? <Person3D x={-1.0} y={-3.0} yaw={270} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {!calm && !diagram ? <Rain f={f} k={storm} slant={0.25 + 0.6 * storm} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.8})`}} /> : null}
      <Meter v={v} o={meter} />
      {force > 0 ? (
        <div style={{position: 'absolute', top: 680, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: force}}>
          <div style={{display: 'inline-block', background: 'rgba(255,255,255,0.95)', borderRadius: 22, padding: '20px 34px'}}>
            <div style={{fontSize: 40, fontWeight: 800, color: ink}}>高さ1.8m × 長さ10m</div>
            <div style={{fontSize: 64, fontWeight: 900, color: '#c0392b'}}>車1台分くらいの力</div>
          </div>
        </div>
      ) : null}
      {f >= hitAt && f < at('09') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, transform: `scale(${1 + 0.3 * (1 - ramp(f, hitAt, hitAt + 8))})`}}>
          <span style={{fontSize: 120, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>キキーッ！</span>
        </div>
      ) : null}
      {dShow > 0 ? (
        <AbsoluteFill style={{opacity: dShow}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 52%, #8a6a46 52%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: hide > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{hide > 0 ? '完成したら、見えない' : '決め手は「基礎」と「柱の間隔」'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* fence elevation */}
            {Array.from({length: 9}).map((_, i) => (
              <rect key={i} x={110} y={560 + i * 42} width={860} height={30} fill="#6e5440" />
            ))}
            {[120, 540, 960].map((x) => (
              <g key={x}>
                <rect x={x - 12} y={540} width={24} height={460} fill="#3b3d40" />
                <rect x={x - 46} y={998} width={92} height={150} fill="#b9b4aa" stroke="#6d6a64" strokeWidth={3} />
              </g>
            ))}
            <g opacity={1 - hide}>
              <line x1={1000} y1={1000} x2={1000} y2={1148} stroke="#ffd34d" strokeWidth={6} />
              <text x={1000} y={1190} textAnchor="end" fontSize={36} fontWeight={900} fill="#fff" fontFamily={FONT}>大きさ・深さ</text>
              <line x1={120} y1={520} x2={540} y2={520} stroke="#ffd34d" strokeWidth={6} />
              <text x={330} y={500} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>柱の間隔</text>
            </g>
            {hide > 0 ? (
              <g opacity={hide}>
                <rect x={40} y={998} width={1000} height={200} fill="#7a5b3b" />
                <text x={540} y={1110} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>？</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 88, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>台風で、目隠しフェンスは</div>
          <div style={{fontSize: 130, fontWeight: 900, color: '#ffd34d', textShadow: outline(7), marginTop: 6}}>倒れる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　風速・力は目安で、商品や立地で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：柱を立てる日に見ること</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>フェンス・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M12/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('03')} durationInFrames={60}><Audio src={staticFile('sfx/creak.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={t6 + 36} durationInFrames={20}><Audio src={staticFile('sfx/boom.wav')} volume={0.7} /></Sequence>
      <Sequence from={hitAt - 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
