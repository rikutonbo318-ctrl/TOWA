import React from 'react';
import {AbsoluteFill, Audio, Loop, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M6/durations.json';
import LINES from '../../../narration/M6.json';

// もしも物理 M6（カーポート第2弾）：雪が何センチ積もったらカーポートはつぶれる？
// 5cm → 20cm（よくある目安）→ 2台用で1トン近く → 30cm → 雨で重くなる → たわむ → 車の上につぶれる → 強いものもある → 選ぶ日に聞く
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.5, '02': 0.5, '03': 0.5, '04': 0.7, '05': 0.5, '06': 0.5, '07': 0.9, '08': 1.8, '09': 0.5, '10': 0.6, '11': 1.0};
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
export const M6_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

const POSTS = [PARK.x0 + 0.2, (PARK.x0 + PARK.x1) / 2, PARK.x1 - 0.2];
// carport: posts on the house side, roof cantilevered towards the road. droop = roof rotation (rad), sink = how far the post tops come down
const Carport: React.FC<{snow: number; wet: number; droop: number; sink: number; f: number}> = ({snow, wet, droop, sink, f}) => {
  const zb = -(PARK.y1 - 0.15);
  const depth = PARK.y1 - PARK.y0 - 0.2;
  const cx = (PARK.x0 + PARK.x1) / 2;
  const wdt = PARK.x1 - PARK.x0 + 0.1;
  const top = 2.45 - sink;
  const lean = sink * 0.35;
  const snowCol = wet > 0 ? `rgb(${Math.round(235 - 40 * wet)},${Math.round(240 - 35 * wet)},${Math.round(245 - 25 * wet)})` : '#f2f5f8';
  const st = Math.max(0.005, snow * 1.2); // snow depth on the roof (slightly exaggerated so it reads)
  return (
    <group>
      {POSTS.map((px) => (
        <mesh key={px} position={[px, top / 2, zb + lean * 0.5]} rotation={[lean * 0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.1, top, 0.1]} />
          <meshStandardMaterial color="#3b3d40" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <group position={[cx, top, zb + lean]} rotation={[droop, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[wdt - 0.2, 0.14, 0.12]} />
          <meshStandardMaterial color="#3b3d40" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.06, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[wdt, 0.1, depth]} />
          <meshPhysicalMaterial color="#2f3134" metalness={0.5} roughness={0.35} clearcoat={0.4} />
        </mesh>
        {snow > 0 ? (
          <mesh position={[0, 0.11 + st / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[wdt - 0.04, st, depth - 0.04]} />
            <meshStandardMaterial color={snowCol} roughness={0.95} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

const Snowfall: React.FC<{f: number; k: number; rain: number}> = ({f, k, rain}) => {
  if (k <= 0 && rain <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(200,210,225,${0.08 + 0.12 * k})`}} />
      {k > 0
        ? Array.from({length: Math.round(60 + 140 * k)}).map((_, i) => {
            const sp = 4 + (i % 5) * 1.6;
            const y = ((f * sp + i * 157) % 2100) - 100;
            const x = ((i * 211) % 1180) - 50 + Math.sin(f / 18 + i) * 30;
            const r = 6 + (i % 4) * 4;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', opacity: k}} />;
          })
        : null}
      {rain > 0
        ? Array.from({length: 90}).map((_, i) => {
            const y = ((f * (60 + (i % 6) * 6) + i * 131) % 2200) - 200;
            const x = ((i * 197) % 1300) - y * 0.12;
            return <div key={'r' + i} style={{position: 'absolute', left: x, top: y, width: 3, height: 70, background: 'rgba(220,230,245,0.5)', transform: 'rotate(7deg)', opacity: rain}} />;
          })
        : null}
    </AbsoluteFill>
  );
};

const Meter: React.FC<{v: number; o: number}> = ({v, o}) => {
  if (o <= 0) return null;
  const danger = v > 20.5;
  return (
    <div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: o}}>
      <div style={{fontSize: 48, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>積雪</div>
      <div style={{fontSize: 150, fontWeight: 900, color: danger ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1}}>
        {Math.round(v)}
        <span style={{fontSize: 70}}>cm</span>
      </div>
      <div style={{margin: '14px auto 0', width: 760, height: 26, borderRadius: 13, background: 'rgba(16,22,30,0.7)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(1, v / 40) * 100}%`, background: danger ? '#ff5a3c' : '#ffd34d'}} />
        <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, background: '#fff'}} />
      </div>
      <div style={{width: 760, margin: '4px auto 0', position: 'relative', height: 40}}>
        <span style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 800, color: '#fff', textShadow: outline(3)}}>よくある目安 20</span>
      </div>
    </div>
  );
};

export const M6: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const cm = f < at('02') ? 12 : f < at('03') ? 5 * ramp(f, at('02') - 20, at('02') + 30) : f < at('05') ? 5 + 15 * ramp(f, at('03'), at('03') + 60) : 20 + 10 * ramp(f, at('05'), at('05') + 40);
  const calm = f >= at('09');
  const snowK = calm ? 0 : f < at('06') ? Math.min(1, 0.4 + cm / 30) : 0.3;
  const rain = f >= at('06') && !calm ? ramp(f, at('06'), at('06') + 20) : 0;
  const wet = f >= at('06') ? ramp(f, at('06') + 10, at('07')) : 0;
  const snowM = calm ? 0 : cm / 100;
  const sag = f >= at('07') ? 0.06 * ramp(f, at('07'), end('07') + 20) : 0;
  const fallAt = at('08') + 18;
  const fall = ramp(f, fallAt, fallAt + 14);
  const fallE = fall * fall;
  const droop = calm ? 0 : sag + 0.24 * fallE;
  const sink = calm ? 0 : 0.45 * fallE;
  const shake = f >= fallAt + 10 && f < fallAt + 40 ? 1 - ramp(f, fallAt + 10, fallAt + 40) : 0;
  const ground = calm ? 0 : Math.min(0.3, cm / 100);
  const cam = camTrack([
    [0, [6.4, -12.8, 2.6], [6.2, -1.5, 2.0], 58],
    [at('02'), [6.2, -12.4, 2.6], [6.2, -1.5, 2.0], 58],
    [at('03') + 10, [9.5, -11.5, 4.8], [6.2, -2.0, 2.0], 56],
    [at('05'), [9.2, -11.2, 4.6], [6.2, -2.0, 2.0], 56],
    [at("05") + 12, [11.8, -10.8, 3.6], [6.2, -2.2, 1.4], 54],
    [at("08"), [11.6, -11.0, 3.6], [6.2, -2.2, 1.4], 54],
    [fallAt + 30, [11.5, -10.5, 3.6], [6.2, -2.2, 1.2], 56],
    [at('09') - 1, [11.8, -10.8, 3.7], [6.2, -2.2, 1.2], 56],
    [at('11'), [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
    [M6_FRAMES, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
  ]);
  const c0 = cam(f);
  const sh = (k: number) => Math.sin(f * 2.3 + k) * 0.06 * shake;
  const c = {...c0, pos: [c0.pos[0] + sh(0), c0.pos[1] + sh(1.1), c0.pos[2] + sh(2.2)] as [number, number, number]};
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('07') ? 1 : 0;
  const ton = f >= at('04') + 15 && f < at('05') ? ramp(f, at('04') + 15, at('04') + 25) : 0;
  const flash = shake > 0.6 ? (shake - 0.6) * 2 : 0;
  const cmp = f >= at('09') && f < at('11') ? ramp(f, at('09'), at('09') + 10) * (1 - ramp(f, at('11') - 8, at('11'))) : 0;
  const endCard = ramp(f, at('11') + 6, at('11') + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.85} sun={calm ? 2.4 : 0.9}>
        <House3D />
        <Gaiko3D noCarport cars />
        {/* snow on the ground (site and road) */}
        {ground > 0 ? <PBox x0={-30} x1={40} y0={-11} y1={9} h0={0.0} h1={0.01 + ground * 0.25} m={{color: wet > 0 ? '#d9dee4' : '#f4f7fa', rough: 0.95}} cast={false} /> : null}
        <Carport snow={snowM} wet={wet} droop={droop} sink={sink} f={f} />
        {f >= at('11') ? <Person3D x={10.2} y={-1.6} yaw={250} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      {!calm ? <Snowfall f={f} k={snowK} rain={rain} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.8})`}} /> : null}
      <Meter v={cm} o={meter} />
      {ton > 0 ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: ton, transform: `scale(${0.9 + 0.1 * ton})`}}>
          <div style={{display: 'inline-block', background: 'rgba(16,22,30,0.88)', borderRadius: 22, padding: '18px 36px'}}>
            <div style={{fontSize: 48, fontWeight: 800, color: '#fff'}}>2台用の屋根の雪</div>
            <div style={{fontSize: 110, fontWeight: 900, color: '#ffd34d', lineHeight: 1.1}}>1トン近く</div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#fff'}}>（雪の重さは、降り方で変わります）</div>
          </div>
        </div>
      ) : null}
      {cmp > 0 ? (
        <AbsoluteFill style={{opacity: cmp}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(16,22,30,0.82)'}} />
          <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>カーポートの「雪の強さ」</div>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 60, marginTop: 60, height: 560}}>
              {[
                ['よくあるもの', 20, '#e8622c'],
                ['強いもの', 50, '#2e9d5b'],
                ['もっと強いもの', 100, '#2f80c0'],
              ].map(([t, v, col], i) => {
                const k = ramp(f, at('09') + 10 + i * 18, at('09') + 30 + i * 18);
                return (
                  <div key={i} style={{width: 240, textAlign: 'center'}}>
                    <div style={{fontSize: 52, fontWeight: 900, color: col as string}}>{v as number}cm</div>
                    <div style={{height: ((v as number) / 100) * 420 * k, background: col as string, borderRadius: 14, marginTop: 10}} />
                    <div style={{fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 14}}>{t as string}</div>
                  </div>
                );
              })}
            </div>
            {f >= at('10') ? (
              <div style={{marginTop: 70}}>
                <span style={{fontSize: 50, fontWeight: 900, padding: '10px 26px', borderRadius: 14, background: '#e8622c', color: '#fff'}}>選ぶ打ち合わせで、ほぼ決まる</span>
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>雪が何cm積もったら</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>カーポートはつぶれる？</div>
          <div style={{display: 'inline-block', marginTop: 18, background: '#e8622c', color: '#fff', fontSize: 40, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>カーポート第2弾</div>
        </div>
      ) : null}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です（商品で変わります）</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：柱の根元の深さと、見に行く日</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>カーポート・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {/* audio */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M6/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at('09')}>
        <Loop durationInFrames={120}>
          <Audio src={staticFile('sfx/wind.wav')} volume={0.18} />
        </Loop>
      </Sequence>
      {[0, 1, 2].map((i) => (
        <Sequence key={'c' + i} from={at('07') + i * 25} durationInFrames={40}><Audio src={staticFile('sfx/creak.wav')} volume={0.6 + 0.15 * i} /></Sequence>
      ))}
      <Sequence from={fallAt - 2} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={1} /></Sequence>
      <Sequence from={fallAt + 10} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
