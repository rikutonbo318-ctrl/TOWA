import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Car, Gaiko3D} from './Gaiko3D';
import {camTrack, Line3D, Person3D, Ring3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M16/durations.json';
import LINES from '../../../narration/M16.json';

// もしも M16（15:30 災害メーター枠・ナレーション版）：地震で給湯器のタンクは倒れる？
// 5強（立っている）→ 6強（大きく揺れる）→ 満タン300kg以上 → 7（ボルトが外れて倒れる）→ 配管ちぎれ・壁や車を傷つける → 基礎＋足元4か所ボルト → 置くと見えない → プロフCTA
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.6, '03': 0.4, '04': 0.6, '05': 0.4, '06': 1.4, '07': 0.5, '08': 0.6, '09': 0.6, '10': 0.6, '11': 1.0};
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
export const M16_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// hot-water storage tank beside the house's south wall, next to the parking
const TX0 = 7.0;
const TX1 = 7.6;
const TY0 = -0.72; // front (south) edge = pivot when it falls
const TY1 = -0.12;
const PAD = 0.1;
const TH = 1.8;
const BOLTS: [number, number][] = [
  [TX0 + 0.06, TY0 + 0.06],
  [TX1 - 0.06, TY0 + 0.06],
  [TX0 + 0.06, TY1 - 0.06],
  [TX1 - 0.06, TY1 - 0.06],
];
const FALL_MAX = 0.98; // comes to rest on the car bonnet

const Tank: React.FC<{tilt: number; sway: number}> = ({tilt, sway}) => (
  <group position={[0, PAD, -TY0]} rotation={[tilt + sway, 0, 0]}>
    <group position={[0, -PAD, TY0]}>
      <PBox x0={TX0} x1={TX1} y0={TY0} y1={TY1} h0={PAD + 0.06} h1={PAD + TH} m={{color: '#e8e7e2', rough: 0.45, metal: 0.2}} />
      <PBox x0={TX0 - 0.005} x1={TX1 + 0.005} y0={TY0 - 0.005} y1={TY0 + 0.1} h0={PAD + TH - 0.12} h1={PAD + TH} m={{color: '#6d7278', rough: 0.4, metal: 0.5}} />
      <PBox x0={TX0 + 0.12} x1={TX1 - 0.12} y0={TY0 - 0.006} y1={TY0} h0={PAD + 1.1} h1={PAD + 1.32} m={{color: '#2f6fb0', rough: 0.5}} cast={false} />
      {BOLTS.map(([x, y], i) => (
        <PBox key={i} x0={x - 0.05} x1={x + 0.05} y0={y - 0.05} y1={y + 0.05} h0={PAD} h1={PAD + 0.06} m={{color: '#8a8f95', rough: 0.4, metal: 0.7}} />
      ))}
    </group>
  </group>
);

export const M16: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const q1 = f >= at('02') && f < end('02') + 6 ? ramp(f, at('02'), at('02') + 8) * (1 - ramp(f, end('02') - 6, end('02') + 6)) : 0;
  const q2 = f >= at('03') && f < at('05') ? ramp(f, at('03'), at('03') + 8) * (1 - ramp(f, at('05') - 10, at('05'))) : 0;
  const q3s = at('05') + Math.round(dur['05'] * FPS * 0.6);
  const fallAt = at('06') + Math.round(dur['06'] * FPS * 0.35);
  const q3 = f >= q3s && f < at('07') ? (f < fallAt + 40 ? 1 : 1 - ramp(f, fallAt + 40, fallAt + 80)) : 0;
  const shake = Math.max(0.3 * q1, 0.65 * q2, q3);
  const calm = f >= at('09');
  const fall = calm ? 0 : ramp(f, fallAt, fallAt + 20);
  const tilt = fall * fall * FALL_MAX;
  const sway = calm || fall > 0 ? 0 : Math.sin(f * 1.6) * (0.012 * q1 + 0.07 * q2 + 0.12 * q3);
  const hit = fallAt + 20;
  const bounce = f >= hit && f < hit + 14 ? Math.sin(((f - hit) / 14) * Math.PI) * 0.06 * (1 - (f - hit) / 14) : 0;
  const broken = !calm && f >= hit;
  const leak = broken ? ramp(f, hit + 6, at('08') + 40) : 0;
  const cam = camTrack([
    [0, [4.2, -4.6, 1.8], [7.3, -0.5, 1.0], 52],
    [at('02'), [4.3, -4.5, 1.8], [7.3, -0.5, 1.0], 52],
    [at('03'), [4.9, -3.6, 1.6], [7.3, -0.5, 1.1], 50],
    [at('05'), [5.0, -3.5, 1.6], [7.3, -0.5, 1.1], 50],
    [at('05') + 12, [3.2, -2.4, 1.5], [7.5, -1.3, 0.8], 52],
    [at('07'), [3.1, -2.4, 1.5], [7.5, -1.3, 0.8], 52],
    [at('07') + 14, [4.8, -2.8, 1.3], [7.3, -0.5, 0.5], 50],
    [at('09') - 1, [4.9, -2.7, 1.3], [7.3, -0.5, 0.5], 50],
    [at('09'), [5.0, -3.0, 1.7], [7.3, -0.45, 0.3], 46],
    [at(LAST) - 1, [5.2, -2.8, 1.65], [7.3, -0.45, 0.3], 46],
    [at(LAST), [3.6, -8.6, 3.2], [7.0, -1.2, 1.0], 50],
    [M16_FRAMES, [3.4, -8.9, 3.3], [7.0, -1.2, 1.0], 50],
  ]);
  const c0 = cam(f);
  const cs = 0.05 * shake + (f >= hit && f < hit + 16 ? 0.08 * (1 - ramp(f, hit, hit + 16)) : 0);
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 1.9) * cs, c0.pos[1] + Math.sin(f * 2.4 + 1) * cs, c0.pos[2] + Math.sin(f * 3.1 + 2) * cs] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const level = f >= at('02') && f < at('03') ? '震度5強' : f >= at('03') && f < at('05') ? '震度6強' : f >= q3s && f < at('07') ? '震度7' : '';
  const levelK = level === '震度7' ? 1 : level === '震度6強' ? 0.72 : 0.45;
  const weight = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) * (1 - ramp(f, at('05') - 6, at('05'))) : 0;
  const flash = f >= hit && f < hit + 10 ? 1 - ramp(f, hit, hit + 10) : 0;
  const diag = f >= at('09') && f < at(LAST) ? ramp(f, at('09') + 40, at('09') + 50) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const hide = ramp(f, at('10') + 20, at('10') + 50);
  const ring = calm && f < at('09') + 40 ? ramp(f, at('09') + 6, at('09') + 14) : 0;
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  const pipeH = PAD + 0.45;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D noCarport />
        {/* concrete base (foundation) under the tank, and the heat-pump unit */}
        <PBox x0={TX0 - 0.1} x1={TX1 + 0.1} y0={TY0 - 0.08} y1={TY1 + 0.08} h0={0} h1={PAD} m={{color: '#cfccc5', tex: 'conc', rough: 0.9}} />
        <PBox x0={5.6} x1={6.45} y0={-0.42} y1={-0.1} h0={0.08} h1={0.74} m={{color: '#e4e3de', rough: 0.5, metal: 0.2}} />
        <PBox x0={5.7} x1={6.2} y0={-0.425} y1={-0.415} h0={0.2} h1={0.62} m={{color: '#555a60', rough: 0.6}} cast={false} />
        <Tank tilt={tilt} sway={sway} />
        {!broken ? (
          <>
            <Line3D a={[6.45, -0.3, pipeH]} b={[TX0, -0.3, pipeH]} w={0.04} color="#c9c6bf" />
            <Line3D a={[6.45, -0.22, pipeH - 0.12]} b={[TX0, -0.22, pipeH - 0.12]} w={0.04} color="#c9c6bf" />
            <Line3D a={[7.3, TY1, pipeH + 0.1]} b={[7.3, 0.02, pipeH + 0.1]} w={0.04} color="#c9c6bf" />
          </>
        ) : (
          <>
            <Line3D a={[6.45, -0.3, pipeH]} b={[6.62, -0.33, pipeH - 0.05]} w={0.04} color="#c9c6bf" />
            <Line3D a={[7.3, 0.02, pipeH + 0.1]} b={[7.3, -0.1, pipeH + 0.06]} w={0.04} color="#c9c6bf" />
            {/* water spurting from the torn pipe + steam */}
            {Array.from({length: 18}).map((_, i) => {
              const t = ((f * 0.06 + i / 18) % 1);
              const x = 7.3 + Math.sin(i * 2.1) * 0.05;
              const y = -0.1 - t * 0.9;
              const h = pipeH + 0.06 + t * 0.35 - t * t * 0.9;
              return h > 0 && leak > 0 ? (
                <mesh key={i} position={[x, h, -y]}>
                  <sphereGeometry args={[0.035 + t * 0.02, 8, 8]} />
                  <meshStandardMaterial color="#9cc8e8" transparent opacity={0.75 * leak} roughness={0.1} />
                </mesh>
              ) : null;
            })}
            {Array.from({length: 10}).map((_, i) => {
              const t = ((f * 0.02 + i / 10) % 1);
              return leak > 0 ? (
                <mesh key={'s' + i} position={[7.2 + Math.sin(i * 3.3) * 0.25, 0.3 + t * 1.6, 0.4 + Math.cos(i * 1.7) * 0.2]}>
                  <sphereGeometry args={[0.06 + t * 0.14, 10, 10]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.2 * (1 - t) * leak} />
                </mesh>
              ) : null;
            })}
            <PBox x0={6.5 - leak * 0.6} x1={8.1 + leak * 0.6} y0={-0.04 - 0.5 - leak * 1.2} y1={-0.04} h0={0.005} h1={0.012} m={{color: '#7d97ab', opacity: 0.7 * leak, metal: 0.3, rough: 0.1}} cast={false} />
          </>
        )}
        <group position={[0, bounce, 0]}>
          <Car x={7.9} y={-2.95} color="#2c3a4f" />
        </group>
        {BOLTS.map(([x, y], i) => (
          ring > 0 ? (
            <mesh key={i} position={[x, PAD + 0.09, -y]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + Math.sin(f * 0.4) * 0.08}>
              <torusGeometry args={[0.1, 0.014, 8, 32]} />
              <meshBasicMaterial color="#ffd34d" transparent opacity={ring} depthTest={false} />
            </mesh>
          ) : null
        ))}
        {broken && f < at('08') ? <Ring3D p={[TX0 + 0.3, TY0 - 0.05, PAD]} o={ramp(f, hit + 30, hit + 40)} f={f} r={0.45} /> : null}
        {f >= at(LAST) ? <Person3D x={5.4} y={-1.5} yaw={195} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.6})`}} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'}} />
      {level ? (
        <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>給湯器のタンク</div>
          <div style={{fontSize: 140, fontWeight: 900, color: level === '震度7' ? '#ff3b2f' : level === '震度6強' ? '#ff9a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05, transform: `translateX(${Math.sin(f * 2.3) * 10 * shake}px)`}}>{level}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${levelK * 100}%`, height: '100%', background: level === '震度7' ? '#ff3b2f' : level === '震度6強' ? '#ff9a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {weight > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: weight}}>
          <div style={{display: 'inline-block', background: 'rgba(16,22,30,0.88)', borderRadius: 22, padding: '18px 36px'}}>
            <div style={{fontSize: 46, fontWeight: 800, color: '#fff'}}>お湯が満タンだと</div>
            <div style={{fontSize: 110, fontWeight: 900, color: '#ffd34d', lineHeight: 1.1}}>300kg以上</div>
          </div>
        </div>
      ) : null}
      {broken && f >= at('07') && f < at('09') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: ramp(f, at('08'), at('08') + 10)}}>
          <span style={{fontSize: 54, fontWeight: 900, color: '#fff', background: 'rgba(192,57,43,0.95)', padding: '10px 28px', borderRadius: 14}}>配管がちぎれてお湯が漏れる</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 62%, #8a6a46 62%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: hide > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{hide > 0 ? '置いたら、気づきにくい' : 'しっかりした基礎＋4か所ボルト'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* foundation */}
            <rect x={220} y={1110} width={640} height={110} fill="#cfccc5" stroke="#8f8c85" strokeWidth={4} />
            <rect x={220} y={1220} width={640} height={60} fill="#9a958c" />
            <text x={540} y={1200} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily={FONT}>基礎（コンクリート）</text>
            {/* tank (drops onto the bolts when hidden) */}
            <g transform={`translate(0 ${(1 - hide) * -60 * 0})`}>
              <rect x={360} y={560} width={360} height={530} rx={20} fill="#e8e7e2" stroke="#8a8f95" strokeWidth={4} opacity={0.35 + 0.65 * hide} />
              <rect x={360} y={560} width={360} height={50} rx={14} fill="#6d7278" opacity={0.35 + 0.65 * hide} />
            </g>
            {[330, 750].map((x, i) => {
              const k = ramp(f, at('09') + 55 + i * 10, at('09') + 63 + i * 10);
              return (
                <g key={x} opacity={k}>
                  <rect x={x - 40} y={1080} width={80} height={30} fill="#8a8f95" />
                  <rect x={x - 7} y={1050} width={14} height={90} fill="#5b6066" />
                  <rect x={x - 22} y={1062} width={44} height={18} rx={4} fill="#3d4146" />
                  <circle cx={x} cy={1080} r={50} fill="none" stroke="#ffd34d" strokeWidth={8} opacity={1 - hide} />
                </g>
              );
            })}
            <text x={540} y={520} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffd34d" fontFamily={FONT} opacity={ramp(f, at('09') + 80, at('09') + 90) * (1 - hide)}>手前2か所＋奥2か所＝4か所</text>
            <text x={540} y={1520} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff" fontFamily={FONT} opacity={1 - hide}>足元の4か所を固定</text>
            {hide > 0 ? (
              <text x={540} y={1520} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffd34d" fontFamily={FONT} opacity={hide}>ボルト、ちゃんと付いてる？</text>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>地震で<br />給湯器のタンクは</div>
          <div style={{fontSize: 120, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>倒れる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　実際の揺れ方は機種や設置で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>家や外構を計画中の人は</div>
            <div style={{fontSize: 60, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>プロフのリンクへ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>工事の日に見ることもまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M16/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('02')} durationInFrames={Math.max(1, end('02') - at('02'))}><Audio src={staticFile('sfx/rattle.wav')} volume={0.25} /></Sequence>
      <Sequence from={at('03')} durationInFrames={Math.max(1, at('05') - at('03'))}><Audio src={staticFile('sfx/rattle.wav')} volume={0.45} loop /></Sequence>
      <Sequence from={q3s} durationInFrames={Math.max(1, fallAt + 40 - q3s)}><Audio src={staticFile('sfx/rattle.wav')} volume={0.65} loop /></Sequence>
      <Sequence from={hit} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
