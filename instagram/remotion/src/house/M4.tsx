import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {W} from './House';
import DUR from '../../public/voice/M4/durations.json';
import LINES from '../../../narration/M4.json';

// もしも物理 M4：震度7が2回来たら（約65秒・ナレーション入り）
// 5強 → 6強（筋かいが支える）→ 等級1の目標 → 7の1回目：耐えるが中は傷む → 2回目：傾く → 等級3はほぼ無事 → 違いは壁の中、張ったら見えない
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.5, '05': 0.4, '06': 0.8, '07': 1.4, '08': 1.6, '09': 0.6, '10': 0.8, '11': 1.0};
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
export const M4_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// wall frame seen from the side: posts, plates, studs, braces, metal plates; skew = racking, dmg = loosened nails / cracked brace
const WallFrame: React.FC<{x: number; y: number; w: number; h: number; x2?: boolean; plates?: boolean; skew?: number; dmg?: number; board?: number; label?: string; color?: string}> = ({x, y, w, h, x2, plates, skew = 0, dmg = 0, board = 0, label, color = '#c99a62'}) => {
  const studs = 4;
  const k = Math.tan((skew * Math.PI) / 180);
  const P = (px: number, py: number) => `${x + px + k * (h - py)},${y + py}`; // py=0 top, py=h bottom
  const Line = (a: [number, number], b: [number, number], c: string, sw: number, key: string) => {
    const A = P(a[0], a[1]).split(',');
    const B = P(b[0], b[1]).split(',');
    return <line key={key} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={c} strokeWidth={sw} strokeLinecap="round" />;
  };
  const els: React.ReactNode[] = [];
  els.push(Line([0, 0], [w, 0], color, 22, 'tp'));
  els.push(Line([0, h], [w, h], color, 22, 'bp'));
  for (let i = 0; i <= studs; i++) els.push(Line([(w / studs) * i, 0], [(w / studs) * i, h], color, i === 0 || i === studs ? 26 : 12, 's' + i));
  const half = w / 2;
  const braceC = dmg > 0.5 ? '#d9573a' : '#e2b46e';
  els.push(Line([0, h], [half, 0], braceC, 14, 'b1'));
  els.push(Line([w, h], [half, 0], braceC, 14, 'b2'));
  if (x2) {
    els.push(Line([0, 0], [half, h], '#e2b46e', 14, 'b3'));
    els.push(Line([w, 0], [half, h], '#e2b46e', 14, 'b4'));
  }
  const corners: [number, number][] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
    [half, 0],
    [half, h],
  ];
  if (plates)
    corners.forEach(([cx, cy], i) => {
      const [px, py] = P(cx, cy).split(',').map(Number);
      els.push(<rect key={'pl' + i} x={px - 20} y={py - 20} width={40} height={40} rx={4} fill="#8c96a0" stroke="#3b3d40" strokeWidth={3} />);
    });
  if (dmg > 0)
    corners.slice(0, 4).forEach(([cx, cy], i) => {
      const [px, py] = P(cx, cy).split(',').map(Number);
      els.push(<circle key={'dm' + i} cx={px} cy={py} r={16 + 6 * Math.min(1, dmg)} fill="none" stroke="#ff4a2c" strokeWidth={6} opacity={Math.min(1, dmg * 2)} />);
    });
  if (dmg > 0.5) {
    const [cx, cy] = P(half * 0.5, h * 0.5).split(',').map(Number);
    els.push(<path key="crk" d={`M ${cx - 24} ${cy - 30} l 18 22 l -14 10 l 22 30`} stroke="#ff4a2c" strokeWidth={6} fill="none" />);
  }
  return (
    <g>
      {els}
      {board > 0 ? <rect x={x - 20} y={y - 20 + (1 - board) * -(h + 300)} width={w + 40} height={h + 40} fill="#ecebe6" stroke="#bdb9b0" strokeWidth={4} opacity={Math.min(1, board * 1.5)} /> : null}
      {label ? (
        <text x={x + w / 2} y={y + h + 90} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fff" stroke={ink} strokeWidth={8} paintOrder="stroke" fontFamily={FONT}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

const Meter: React.FC<{v: string; o: number; danger: boolean; sub?: string}> = ({v, o, danger, sub}) =>
  o <= 0 ? null : (
    <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: o}}>
      <div style={{fontSize: 52, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>震度</div>
      <div style={{fontSize: 170, fontWeight: 900, color: danger ? '#ff5a3c' : '#ffd34d', textShadow: outline(8), lineHeight: 1}}>{v}</div>
      {sub ? (
        <div style={{marginTop: 14}}>
          <span style={{background: danger ? '#c0392b' : '#e8622c', color: '#fff', fontSize: 52, fontWeight: 900, padding: '8px 28px', borderRadius: 14}}>{sub}</span>
        </div>
      ) : null}
    </div>
  );

export const M4: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  // shaking intensity 0..1 over time
  const q1s = at('05') + 30;
  const q1e = at('06') + 40;
  const q2s = at('07') + 10;
  const q2e = end('08') + 20;
  const shake =
    f < end('01') ? 0.25 * ramp(f, 0, 10) :
    f < at('02') ? 0 :
    f < at('03') ? 0.3 * ramp(f, at('02'), at('02') + 10) :
    f < at('04') ? 0.6 :
    f < at('04') + 40 ? 0.6 * (1 - ramp(f, at('04'), at('04') + 40)) :
    f >= q1s && f < q1e ? ramp(f, q1s, q1s + 8) * (1 - ramp(f, q1e - 25, q1e)) :
    f >= q2s && f < q2e ? ramp(f, q2s, q2s + 6) * (1 - ramp(f, q2e - 30, q2e)) :
    0;
  const tilt = f >= at('08') && f < at('09') ? 0.13 * Math.pow(ramp(f, at('08') + 10, at('08') + 70), 0.7) : 0;
  const amp = 0.06 * shake;
  const jx = Math.sin(f * 2.1) * amp + Math.sin(f * 3.7 + 1) * amp * 0.5;
  const jy = Math.sin(f * 2.7 + 2) * amp * 0.4;
  // shear the house about its base: x' = x + k * height
  const k = tilt + Math.sin(f * 2.1) * 0.006 * shake;
  // a new matrix every frame: R3F only copies the matrix prop when the object changes
  const shear = new THREE.Matrix4().set(1, k, 0, jx, 0, 1, 0, Math.abs(jy) * 0.3, 0, 0, 1, jy, 0, 0, 0, 1);

  const cam = camTrack([
    [0, [5.0, -16.5, 3.4], [5.0, 1.0, 3.0], 52],
    [end('01'), [5.0, -16.0, 3.4], [5.0, 1.0, 3.0], 52],
    [at('02') + 10, [10.5, -14.5, 2.6], [5.0, 1.0, 2.6], 52],
    [end('02'), [10.0, -14.0, 2.6], [5.0, 1.0, 2.6], 52],
    [at('03') + 10, [16.5, -13.5, 5.0], [5.5, 0.5, 2.2], 50],
    [at('05'), [16.0, -13.0, 4.8], [5.5, 0.5, 2.2], 50],
    [at('05') + 20, [5.0, -16.5, 3.4], [5.0, 1.0, 3.0], 52],
    [at('09') - 1, [5.0, -17.5, 3.8], [5.0, 1.0, 3.0], 52],
    [at('11'), [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
    [M4_FRAMES, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
  ]);
  const c0 = cam(f);
  const cs = 0.05 * shake;
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 1.9) * cs, c0.pos[1] + Math.sin(f * 2.4 + 1) * cs, c0.pos[2] + Math.sin(f * 3.1 + 2) * cs] as [number, number, number]};

  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meterV = f < at('03') ? '5強' : f < at('05') ? '6強' : '7';
  const meterSub = f >= at('05') && f < at('07') ? '1回目' : f >= at('07') && f < at('09') ? '2回目' : undefined;
  const meter = f >= at('02') && f < at('09') && !(f >= at('04') && f < at('05')) ? 1 : 0;
  const grade1 = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 8) : 0;
  const inset = (f >= at('03') + 15 && f < at('04')) || (f >= at('06') && f < at('07')) ? 1 : 0;
  const dmg = f >= at('06') ? ramp(f, at('06') + 30, at('06') + 70) : 0;
  const flash = f >= at('08') + 12 && f < at('08') + 24 ? 1 - ramp(f, at('08') + 12, at('08') + 24) : 0;
  const dust = f >= at('08') + 10 && f < at('09') ? ramp(f, at('08') + 10, at('08') + 30) : 0;
  const cmp = f >= at('09') && f < at('10') ? ramp(f, at('09'), at('09') + 10) : 0;
  const diag = f >= at('10') && f < at('11') ? ramp(f, at('10'), at('10') + 10) : 0;
  const board = ramp(f, at('10') + 95, at('10') + 130);
  const endCard = ramp(f, at('11') + 6, at('11') + 20);
  const dark = f >= at('05') && f < at('09');
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={dark ? 0.8 : 1.0} sun={dark ? 1.4 : 2.4}>
        <group matrix={shear} matrixAutoUpdate={false}>
          <House3D />
        </group>
        <Gaiko3D cars />
        {f >= at('11') ? <Person3D x={10.2} y={-1.6} yaw={250} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      {dust > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {Array.from({length: 26}).map((_, i) => {
            const t = (f - at('08') - 10) / 40;
            const x = 80 + ((i * 173) % 920) + Math.sin(i + t * 2) * 40 * t;
            const y = 1150 - t * (60 + (i % 5) * 30) - (i % 3) * 30;
            const r = 80 + (i % 4) * 40 + t * 60;
            return <div key={i} style={{position: 'absolute', left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: '50%', background: 'rgba(190,175,150,0.35)', filter: 'blur(14px)', opacity: dust * (1 - Math.min(0.7, t * 0.15))}} />;
          })}
        </AbsoluteFill>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.75})`}} /> : null}
      <Meter v={meterV} o={meter} danger={meterV === '7'} sub={meterSub} />
      {grade1 > 0 ? (
        <div style={{position: 'absolute', top: 220, left: 50, right: 50, textAlign: 'center', fontFamily: FONT, opacity: grade1}}>
          <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 64, fontWeight: 900, padding: '12px 34px', borderRadius: 18}}>耐震等級1＝法律ぎりぎり</div>
          <div style={{marginTop: 18}}>
            <span style={{background: 'rgba(16,22,30,0.88)', color: '#fff', fontSize: 50, fontWeight: 800, padding: '10px 24px', borderRadius: 14}}>目標：震度6強〜7で倒れない</span>
          </div>
        </div>
      ) : null}
      {f >= at('07') && f < at('08') ? (
        <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', fontFamily: FONT, transform: `scale(${1.3 - 0.3 * ramp(f, at('07'), at('07') + 8)})`}}>
          <span style={{fontSize: 150, fontWeight: 900, color: '#ff5a3c', textShadow: outline(8)}}>2回目</span>
        </div>
      ) : null}
      {inset > 0 ? (
        <div style={{position: 'absolute', left: 140, right: 140, top: 640, background: 'rgba(16,22,30,0.82)', borderRadius: 26, padding: '18px 0 0', textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>{f < at('04') ? '壁の中の「筋かい」' : 'くぎが緩み、筋かいが傷む'}</div>
          <svg width={800} height={460} viewBox="0 0 800 460">
            <WallFrame x={170} y={40} w={460} h={340} skew={Math.sin(f * 1.3) * 6 * shake} dmg={dmg} />
          </svg>
        </div>
      ) : null}
      {cmp > 0 ? (
        <AbsoluteFill style={{opacity: cmp}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(16,22,30,0.78)'}} />
          <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <div style={{fontSize: 52, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>震度7が2回来た地震で</div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginTop: 60}}>
              {[
                ['耐震等級1', '倒れた・大きく傷んだ家も', '#c0392b'],
                ['耐震等級3', 'ほとんどが大きな被害なし', '#2e9d5b'],
              ].map(([t, s, col], i) => (
                <div key={i} style={{width: 440, background: '#fff', borderRadius: 26, padding: '34px 20px', opacity: ramp(f, at('09') + 10 + i * 30, at('09') + 20 + i * 30), transform: `translateY(${(1 - ramp(f, at('09') + 10 + i * 30, at('09') + 20 + i * 30)) * 30}px)`}}>
                  <div style={{fontSize: 60, fontWeight: 900, color: col}}>{t}</div>
                  <svg width={300} height={260} viewBox="0 0 300 260" style={{marginTop: 10}}>
                    <g transform={i === 0 ? 'translate(150 240) skewX(-12) translate(-150 -240)' : ''}>
                      <polygon points="40,110 150,30 260,110" fill={i === 0 ? '#9a6b5a' : '#4d6070'} />
                      <rect x={60} y={110} width={180} height={130} fill="#ecebe6" stroke="#8a857c" strokeWidth={4} />
                      <rect x={135} y={170} width={36} height={70} fill="#8a6a50" />
                    </g>
                    <line x1={10} y1={242} x2={290} y2={242} stroke="#555" strokeWidth={6} />
                  </svg>
                  <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 10, lineHeight: 1.3}}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#24303d, #10161e)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: board > 0 ? '#c0392b' : '#e8622c', color: '#fff'}}>{board > 0 ? '壁を張ると、見えない' : '違いは、壁の中'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            <WallFrame x={80} y={560} w={400} h={420} label="等級1" board={board} />
            <WallFrame x={600} y={560} w={400} h={420} x2 plates={f >= at('10') + 40} label="等級3" board={board} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 92, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>震度7が2回来たら</div>
          <div style={{fontSize: 112, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>家はどうなる？</div>
        </div>
      ) : null}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　揺れ方は家ごと・地盤ごとに変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>耐震等級は、図面のうちに決まる</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />打ち合わせで聞くことリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>家づくりの相談はDMで</div>
          </div>
        </div>
      ) : null}
      {/* audio */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M4/${l.id}.wav`)} />
        </Sequence>
      ))}
      {[0, 1].map((i) => (
        <Sequence key={'h' + i} from={2 + i * 30} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.4} /></Sequence>
      ))}
      {Array.from({length: 4}).map((_, i) => (
        <Sequence key={'a' + i} from={at('02') + i * 30} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.5} /></Sequence>
      ))}
      {Array.from({length: 5}).map((_, i) => (
        <Sequence key={'b' + i} from={at('03') + i * 28} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.8} /></Sequence>
      ))}
      <Sequence from={at('03') + 40} durationInFrames={40}><Audio src={staticFile('sfx/creak.wav')} volume={0.7} /></Sequence>
      <Sequence from={q1s} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={0.9} /></Sequence>
      {Array.from({length: Math.max(0, Math.floor((q1e - q1s) / 26))}).map((_, i) => (
        <Sequence key={'c' + i} from={q1s + i * 26} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={1} /></Sequence>
      ))}
      <Sequence from={at('06') + 34} durationInFrames={40}><Audio src={staticFile('sfx/creak.wav')} volume={0.9} /></Sequence>
      <Sequence from={q2s} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      {Array.from({length: Math.max(0, Math.floor((q2e - q2s) / 24))}).map((_, i) => (
        <Sequence key={'d' + i} from={q2s + i * 24} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={1} /></Sequence>
      ))}
      <Sequence from={at('08') + 10} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={1} /></Sequence>
      <Sequence from={at('08') + 14} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('10') + 40} durationInFrames={20}><Audio src={staticFile('sfx/tick.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('10') + 125} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.7} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
