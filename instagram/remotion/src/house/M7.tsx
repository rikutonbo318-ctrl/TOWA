import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M7/durations.json';
import LINES from '../../../narration/M7.json';

// もしも物理 M7：地震でブロック塀は倒れる？
// 1m（5強で平気）→ 1.6m（目隠しで高く）→ 法律：2.2mまで・1.2m超は3.4mごとに控え壁 → 控え壁なし・鉄筋不足に6強 → 道路へ倒れる → 1mあたり300kg近く → 鉄筋と根元は積んだら見えない → 低い塀＋軽いフェンス → 積む前に確認
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.7, '05': 0.6, '06': 1.6, '07': 0.6, '08': 0.6, '09': 0.6, '10': 1.0};
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
export const M7_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

// wall along the road edge of the garden
const WX0 = -3.4;
const WX1 = 2.9;
const WY0 = -4.78;
const WY1 = -4.63;
const BlockWall: React.FC<{h: number; tilt: number}> = ({h, tilt}) => {
  const rows = Math.round(h / 0.2);
  const cols = Math.round((WX1 - WX0) / 0.4);
  return (
    <group position={[0, 0, -WY0]} rotation={[tilt, 0, 0]}>
      <group position={[0, 0, WY0]}>
        <PBox x0={WX0} x1={WX1} y0={WY0} y1={WY1} h0={0} h1={h} m={{color: '#bdbab2', tex: 'plaster', rough: 0.95}} />
        <PBox x0={WX0 - 0.02} x1={WX1 + 0.02} y0={WY0 - 0.02} y1={WY1 + 0.02} h0={h} h1={h + 0.05} m={{color: '#a9a69e', rough: 0.9}} />
        {Array.from({length: rows - 1}).map((_, i) => (
          <PBox key={'r' + i} x0={WX0} x1={WX1} y0={WY0 - 0.004} y1={WY0} h0={0.2 * (i + 1) - 0.006} h1={0.2 * (i + 1) + 0.006} m={{color: '#8f8c85'}} cast={false} />
        ))}
        {Array.from({length: rows}).map((_, r) =>
          Array.from({length: cols}).map((__, c) => {
            const x = WX0 + 0.4 * c + (r % 2 ? 0.2 : 0);
            if (x <= WX0 + 0.05 || x >= WX1 - 0.05) return null;
            return <PBox key={r + '-' + c} x0={x - 0.006} x1={x + 0.006} y0={WY0 - 0.004} y1={WY0} h0={0.2 * r} h1={0.2 * (r + 1)} m={{color: '#8f8c85'}} cast={false} />;
          }),
        )}
      </group>
    </group>
  );
};

export const M7: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const h = f < at('03') ? 1.0 : 1.0 + 0.6 * ramp(f, at('03'), at('03') + 40);
  const q1 = f >= at('02') + 10 && f < end('02') + 10 ? 1 - ramp(f, end('02') - 10, end('02') + 10) : 0;
  const q2s = at('05') + Math.round(dur['05'] * FPS * 0.7);
  const q2 = f >= q2s && f < at('07') ? (f < at('06') + 20 ? 1 : 1 - ramp(f, at('06') + 20, at('06') + 60)) : 0;
  const shake = Math.max(0.35 * q1, q2);
  const fallAt = at('06') + 8;
  const fall = ramp(f, fallAt, fallAt + 22);
  const calm = f >= at('09');
  const tilt = calm ? 0 : fall * fall * (Math.PI / 2 - 0.02) + (fall === 0 ? Math.sin(f * 1.7) * 0.015 * shake : 0);
  const cam = camTrack([
    [0, [5.0, -10.0, 1.9], [-0.5, -4.6, 0.9], 54],
    [at('02'), [4.8, -9.8, 1.9], [-0.5, -4.6, 0.9], 54],
    [at('03') + 10, [3.8, -9.0, 1.7], [-0.5, -4.6, 1.1], 52],
    [at('05'), [3.6, -8.8, 1.7], [-0.5, -4.6, 1.1], 52],
    [at('05') + 15, [6.5, -11.5, 3.2], [-0.4, -5.4, 0.4], 54],
    [at('08'), [6.8, -11.8, 3.3], [-0.4, -5.4, 0.4], 54],
    [at('08') + 1, [5.0, -10.0, 1.9], [-0.5, -4.6, 0.9], 54],
    [at(LAST) - 1, [4.6, -9.6, 1.9], [-0.5, -4.6, 0.9], 54],
    [at(LAST), [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
    [M7_FRAMES, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
  ]);
  const c0 = cam(f);
  const cs = 0.06 * shake + (f >= fallAt + 20 && f < fallAt + 40 ? 0.08 * (1 - ramp(f, fallAt + 20, fallAt + 40)) : 0);
  const c = {...c0, pos: [c0.pos[0] + Math.sin(f * 1.9) * cs, c0.pos[1] + Math.sin(f * 2.4 + 1) * cs, c0.pos[2] + Math.sin(f * 3.1 + 2) * cs] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('04') ? 1 : 0;
  const law = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 10) : 0;
  const quakeTag = f >= at('05') && f < at('07') ? 1 : 0;
  const flash = f >= fallAt + 20 && f < fallAt + 30 ? 1 - ramp(f, fallAt + 20, fallAt + 30) : 0;
  const dust = f >= fallAt + 18 && f < at('08') ? ramp(f, fallAt + 18, fallAt + 30) : 0;
  const weight = f >= at('07') && f < at('08') ? ramp(f, at('07'), at('07') + 10) : 0;
  const cut = f >= at('08') && f < at('09') ? ramp(f, at('08'), at('08') + 10) : 0;
  const hide = ramp(f, at('08') + 50, at('08') + 75);
  const alt = f >= at('09') && f < at(LAST) ? ramp(f, at('09'), at('09') + 10) : 0;
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D cars />
        <BlockWall h={calm ? 0.6 : h} tilt={tilt} />
        {/* calm ending: low wall + light slatted fence on top */}
        {calm
          ? Array.from({length: 8}).map((_, i) => <PBox key={'fz' + i} x0={WX0} x1={WX1} y0={WY0 + 0.04} y1={WY0 + 0.06} h0={0.75 + i * 0.12} h1={0.84 + i * 0.12} m={{color: '#6e5440', rough: 0.55}} />)
          : null}
        {f >= at(LAST) ? <Person3D x={4.0} y={-5.6} yaw={160} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {dust > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {Array.from({length: 22}).map((_, i) => {
            const t = (f - fallAt - 18) / 40;
            const x = 60 + ((i * 173) % 900) + Math.sin(i + t * 2) * 30 * t;
            const y = 1180 - t * (40 + (i % 5) * 25) - (i % 3) * 30;
            const r = 70 + (i % 4) * 40 + t * 60;
            return <div key={i} style={{position: 'absolute', left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: '50%', background: 'rgba(200,190,170,0.4)', filter: 'blur(12px)', opacity: dust * Math.max(0.2, 1 - t * 0.2)}} />;
          })}
        </AbsoluteFill>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.6})`}} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'}} />
      {meter > 0 ? (
        <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 48, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>塀の高さ</div>
          <div style={{fontSize: 150, fontWeight: 900, color: h > 1.25 ? '#ff9a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1}}>
            {h.toFixed(1)}
            <span style={{fontSize: 70}}>m</span>
          </div>
          {q1 > 0 ? (
            <div style={{marginTop: 10}}>
              <span style={{background: '#e8622c', color: '#fff', fontSize: 48, fontWeight: 900, padding: '8px 26px', borderRadius: 14}}>震度5強</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {quakeTag > 0 ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{display: 'inline-block', background: 'rgba(16,22,30,0.85)', color: '#fff', fontSize: 44, fontWeight: 800, padding: '8px 24px', borderRadius: 14}}>控え壁なし・鉄筋不足</div>
          {f >= q2s ? <div style={{fontSize: 130, fontWeight: 900, color: '#ff5a3c', textShadow: outline(7), marginTop: 10}}>震度6強</div> : null}
        </div>
      ) : null}
      {law > 0 ? (
        <AbsoluteFill style={{opacity: law}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(16,22,30,0.82)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, color: '#fff', background: '#e8622c', padding: '10px 28px', borderRadius: 14}}>ブロック塀のきまり</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            <rect x={90} y={620} width={900} height={330} fill="#bdbab2" stroke="#8f8c85" strokeWidth={4} />
            {[0, 1, 2].map((i) => {
              const k = ramp(f, at('04') + 60 + i * 12, at('04') + 70 + i * 12);
              return <rect key={i} x={150 + i * 380} y={620} width={60} height={330} fill="#e8622c" opacity={k} />;
            })}
            <line x1={60} y1={620} x2={60} y2={950} stroke="#fff" strokeWidth={5} />
            <text x={50} y={600} fontSize={40} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>2.2mまで</text>
            <line x1={40} y1={770} x2={1010} y2={770} stroke="#ffd34d" strokeWidth={4} strokeDasharray="14 10" opacity={ramp(f, at('04') + 40, at('04') + 50)} />
            <text x={560} y={1040} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" fontFamily={FONT} opacity={ramp(f, at('04') + 40, at('04') + 50)}>1.2mを超えたら</text>
            <text x={560} y={1110} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ff9a3c" fontFamily={FONT} opacity={ramp(f, at('04') + 60, at('04') + 70)}>3.4mごとに控え壁</text>
          </svg>
        </AbsoluteFill>
      ) : null}
      {weight > 0 ? (
        <div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: weight}}>
          <div style={{display: 'inline-block', background: 'rgba(16,22,30,0.88)', borderRadius: 22, padding: '18px 36px'}}>
            <div style={{fontSize: 46, fontWeight: 800, color: '#fff'}}>高さ1.6mの塀、1mあたり</div>
            <div style={{fontSize: 110, fontWeight: 900, color: '#ffd34d', lineHeight: 1.1}}>300kg近く</div>
          </div>
        </div>
      ) : null}
      {cut > 0 ? (
        <AbsoluteFill style={{opacity: cut}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 60%, #8a6a46 60%, #7a5b3b)'}} />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            <rect x={440} y={520} width={200} height={632} fill="#bdbab2" stroke="#8f8c85" strokeWidth={4} />
            <rect x={380} y={1152} width={320} height={140} fill="#a9a59c" stroke="#8f8c85" strokeWidth={4} />
            {[480, 540, 600].map((x) => (
              <line key={x} x1={x} y1={540} x2={x} y2={1270} stroke="#c0392b" strokeWidth={8} opacity={1 - hide} />
            ))}
            {[640, 760, 880, 1000, 1120].map((y) => (
              <line key={y} x1={455} y1={y} x2={625} y2={y} stroke="#c0392b" strokeWidth={6} opacity={1 - hide} />
            ))}
            <rect x={440} y={520} width={200} height={632} fill="#bdbab2" opacity={hide} />
            <rect x={380} y={1152} width={320} height={140} fill="#7a5b3b" opacity={hide} />
            <text x={760} y={800} fontSize={44} fontWeight={900} fill={ink} fontFamily={FONT} opacity={1 - hide}>中の鉄筋</text>
            <text x={760} y={1240} fontSize={44} fontWeight={900} fill="#fff" fontFamily={FONT} opacity={1 - hide}>根元の深さ</text>
          </svg>
          {hide > 0 ? (
            <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: hide}}>
              <span style={{fontSize: 60, fontWeight: 900, color: '#fff', background: '#c0392b', padding: '10px 30px', borderRadius: 16}}>積んだら、見えない</span>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {alt > 0 ? (
        <div style={{position: 'absolute', top: 220, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: alt}}>
          <span style={{fontSize: 54, fontWeight: 900, color: '#fff', background: '#2e9d5b', padding: '10px 28px', borderRadius: 16}}>低い塀 ＋ 軽いフェンス</span>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 92, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>地震が来たら</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>ブロック塀は倒れる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 52, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
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
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：塀を積む前に見ること</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>塀・フェンス・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {/* audio */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M7/${l.id}.wav`)} />
        </Sequence>
      ))}
      {[0, 1, 2].map((i) => (
        <Sequence key={'a' + i} from={at('02') + 10 + i * 30} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={q2s} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={0.8} /></Sequence>
      {Array.from({length: Math.max(0, Math.floor((fallAt - q2s) / 26))}).map((_, i) => (
        <Sequence key={'b' + i} from={q2s + i * 26} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={1} /></Sequence>
      ))}
      <Sequence from={fallAt} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={1} /></Sequence>
      <Sequence from={fallAt + 20} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      <Sequence from={at('08') + 60} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.6} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
