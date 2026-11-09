import React from 'react';
import {AbsoluteFill, Audio, Loop, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PostCut} from './M2';
import DUR from '../../public/voice/M2b/durations.json';
import LINES from '../../../narration/M2b.json';

// もしも物理 M2（作り直し・約60秒・ナレーション入り）
// 風速20 → 30 → 38（目安）→ 46：屋根の板が飛ぶ → 柱ごと引っこ抜ける → 根元は約50cm → 土間コンを打ったら見えない
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.4, '02': 0.5, '03': 0.6, '04': 0.4, '05': 0.4, '06': 1.2, '07': 0.3, '08': 1.8, '09': 0.5, '10': 0.8, '11': 1.0};
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
export const M2B_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;

const POSTS = [PARK.x0 + 0.2, (PARK.x0 + PARK.x1) / 2, PARK.x1 - 0.2];
const alu = <meshStandardMaterial color="#c9ccd0" metalness={0.6} roughness={0.35} />;
// carport: tilt = wind shake, panels = how many roof panels have flown, lift = whole carport pulled out (0..1)
const Carport: React.FC<{f: number; tilt: number; panelsGone: number; lift: number}> = ({f, tilt, panelsGone, lift}) => {
  const zb = -(PARK.y1 - 0.15);
  const depth = PARK.y1 - PARK.y0 - 0.2;
  const cx = (PARK.x0 + PARK.x1) / 2;
  const wdt = PARK.x1 - PARK.x0 + 0.1;
  const N = 4;
  const up = lift * lift * 4.5;
  return (
    <group position={[lift * 3.5, up, lift * 2.5]} rotation={[-lift * 1.2, lift * 0.4, lift * 0.5]}>
      {POSTS.map((px) => (
        <group key={px}>
          <mesh position={[px, 1.2, zb]} castShadow>
            <boxGeometry args={[0.1, 2.4, 0.1]} />
            {alu}
          </mesh>
          {/* the shallow concrete foot that comes out with the post */}
          {lift > 0 ? (
            <mesh position={[px, -0.12, zb]} castShadow>
              <cylinderGeometry args={[0.16, 0.18, 0.24, 16]} />
              <meshStandardMaterial color="#b9b4aa" roughness={0.95} />
            </mesh>
          ) : null}
        </group>
      ))}
      <group position={[cx, 2.42, zb]} rotation={[tilt, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[PARK.x1 - PARK.x0 - 0.2, 0.14, 0.12]} />
          {alu}
        </mesh>
        {/* side frames */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * (wdt - 0.1)) / 2, 0.04, depth / 2 - 0.05]} castShadow>
            <boxGeometry args={[0.08, 0.12, depth]} />
            {alu}
          </mesh>
        ))}
        {Array.from({length: N}).map((_, i) => {
          const gone = panelsGone * N - i; // 0..1 for the panel that is leaving
          const k = Math.max(0, Math.min(1, gone));
          if (k >= 1) return null;
          const z0 = (depth / N) * i;
          const fly = k * k;
          return (
            <mesh key={i} position={[fly * 6 * (i % 2 ? 1 : -0.6), 0.08 + fly * 5, z0 + depth / N / 2 - 0.05 + fly * 4]} rotation={[fly * 3, fly * 2, fly * 1.5]} castShadow receiveShadow>
              <boxGeometry args={[wdt - 0.12, 0.03, depth / N - 0.02]} />
              <meshStandardMaterial color="#5f7584" metalness={0.2} roughness={0.3} transparent opacity={0.92} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

export const Rain: React.FC<{f: number; k: number; slant: number}> = ({f, k, slant}) => {
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(rgba(20,30,45,${0.35 + 0.3 * k}), rgba(20,30,45,${0.1 + 0.15 * k}) 60%, rgba(20,30,45,${0.2 + 0.2 * k}))`}} />
      {Array.from({length: Math.round(40 + 80 * k)}).map((_, i) => {
        const sx = (i * 197) % 1400;
        const sp = 46 + (i % 7) * 6 + 30 * k;
        const y = ((f * sp + i * 131) % 2200) - 200;
        const x = sx - ((y * slant) % 1600) + 300;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 70 + (i % 4) * 20, background: 'rgba(220,230,245,0.5)', transform: `rotate(${Math.atan(slant) * 57}deg)`, borderRadius: 2}} />;
      })}
      {Array.from({length: Math.round(3 + 8 * k)}).map((_, i) => {
        const y = 260 + i * 140;
        const x = ((f * (30 + 40 * k) + i * 420) % 2000) - 700;
        return <div key={'w' + i} style={{position: 'absolute', left: x, top: y, width: 420, height: 6, borderRadius: 6, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.65), rgba(255,255,255,0))'}} />;
      })}
      {/* flying leaves and bits */}
      {Array.from({length: Math.round(10 * k)}).map((_, i) => {
        const x = ((f * (40 + 10 * (i % 5)) + i * 300) % 1500) - 200;
        const y = 300 + ((i * 233) % 1100) + Math.sin(f / 5 + i) * 40;
        return <div key={'l' + i} style={{position: 'absolute', left: x, top: y, width: 22, height: 12, borderRadius: 6, background: i % 2 ? '#6f8a3c' : '#8a6a3c', transform: `rotate(${f * 20 + i * 40}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

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
      <div style={{margin: '14px auto 0', width: 760, height: 26, borderRadius: 13, background: 'rgba(16,22,30,0.7)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(1, v / 50) * 100}%`, background: danger ? '#ff5a3c' : '#ffd34d'}} />
        <div style={{position: 'absolute', left: `${(38 / 50) * 100}%`, top: 0, bottom: 0, width: 4, background: '#fff'}} />
      </div>
      <div style={{width: 760, margin: '4px auto 0', position: 'relative', height: 40}}>
        <span style={{position: 'absolute', left: `${(38 / 50) * 100}%`, transform: 'translateX(-50%)', fontSize: 28, fontWeight: 800, color: '#fff', textShadow: outline(3)}}>よくある目安 38</span>
      </div>
    </div>
  );
};

export const M2b: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  // wind speed
  const v = f < at('02') ? 25 : f < at('03') ? 20 : f < at('04') ? 20 + 10 * ramp(f, at('03'), at('03') + 20) : f < at('05') ? 30 + 8 * ramp(f, at('04'), at('04') + 30) : 38 + 8 * ramp(f, at('05') + 20, at('05') + 50);
  const storm = Math.min(1, (v - 12) / 30);
  const diagram = f >= at('09') && f < at('11');
  const panelsGone = ramp(f, at("06") - 10, at("07") + 10);
  const pullAt = at('08') + 45;
  const lift = ramp(f, pullAt, pullAt + 90);
  const tilt = -(0.01 + 0.05 * storm) * (0.5 + 0.5 * Math.sin(f * (0.4 + 0.5 * storm))) * (lift > 0 ? 0 : 1);
  const shakeAmp = 0.01 * storm + (lift > 0 && lift < 1 ? 0.05 : 0);
  const sh = (k: number) => Math.sin(f * 2.3 + k) * shakeAmp;
  const cam = camTrack([
    [0, [6.4, -12.6, 2.0], [6.2, -1.5, 1.9], 58],
    [at('02'), [6.0, -12.2, 2.0], [6.2, -1.5, 1.9], 58],
    [at('04'), [5.6, -11.4, 2.2], [6.2, -1.5, 2.1], 56],
    [at('06') - 12, [9.5, -11.5, 4.8], [6.2, -2.0, 2.0], 58],
    [at('07'), [9.2, -11.2, 4.6], [6.2, -2.0, 2.0], 58],
    [at('08'), [10.5, -14.5, 3.4], [6.5, -1.5, 2.4], 60],
    [end('08') + 50, [11.0, -15.5, 4.2], [7.5, -0.5, 3.4], 62],
    [at('09') - 1, [11.0, -15.5, 4.2], [7.5, -0.5, 3.4], 62],
    [at('11'), [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
    [M2B_FRAMES, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
  ]);
  const c0 = cam(f);
  const c = {...c0, pos: [c0.pos[0] + sh(0), c0.pos[1] + sh(1.1), c0.pos[2] + sh(2.2)] as [number, number, number]};
  const calm = f >= at('11');
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const meter = f >= at('02') && f < at('07') ? 1 : 0;
  const stamp = f >= at('04') + 20 && f < end('04') + 6 ? ramp(f, at('04') + 20, at('04') + 28) : 0;
  const flash = lift > 0 && lift < 0.2 ? 1 - lift * 5 : 0;
  const endCard = ramp(f, at('11') + 6, at('11') + 20);
  // diagram parts
  const dShow = ramp(f, at('09'), at('09') + 10) * (1 - ramp(f, at('11') - 8, at('11')));
  const slab = ramp(f, at('10') + 10, at('10') + 40);
  const q = ramp(f, at('10') + 50, at('10') + 62);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={calm ? 1.0 : 0.95 - 0.35 * storm} sun={calm ? 2.4 : 2.2 - 1.8 * storm}>
        <House3D />
        <Gaiko3D noCarport cars />
        {lift < 1 ? <Carport f={f} tilt={tilt} panelsGone={panelsGone} lift={lift} /> : null}
        {/* holes left where the posts came out */}
        {lift > 0
          ? POSTS.map((px) => (
              <mesh key={px} position={[px, 0.035, -(PARK.y1 - 0.15)]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 20]} />
                <meshStandardMaterial color="#4a3b2a" roughness={1} />
              </mesh>
            ))
          : null}
        <Person3D x={10.2} y={-1.2} yaw={250} act={f >= at('11') ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      {!calm && !diagram ? <Rain f={f} k={storm} slant={0.25 + 0.6 * storm} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash * 0.8})`}} /> : null}
      <Meter v={v} o={meter} />
      {stamp > 0 ? (
        <div style={{position: 'absolute', top: 620, width: '100%', textAlign: 'center', opacity: stamp}}>
          <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 52, padding: '12px 30px', borderRadius: 16}}>多くのカーポートの強さの目安</span>
        </div>
      ) : null}
      {/* diagram: post foot cut-away, then the slab covers it */}
      {dShow > 0 ? (
        <AbsoluteFill style={{opacity: dShow}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 36.5%, #8a6a46 36.5%, #7a5b3b)'}} />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            <g transform="translate(40 140)">
              <PostCut cx={460} depth={0.5} lift={0} label={f < at('10') ? '柱の根元' : ''} ok arrow={1 - ramp(f, at('10') + 34, at('10') + 46)} slab={slab} q={q} />
            </g>
          </svg>
          {f >= at('10') ? (
            <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
              <span style={{fontSize: 46, fontWeight: 900, padding: '10px 26px', borderRadius: 14, background: '#e8622c', color: '#fff'}}>土間コンクリートを打つと…</span>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>台風で</div>
          <div style={{fontSize: 108, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>カーポートは飛ぶ？</div>
        </div>
      ) : null}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1180, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 56, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text.replace('風速20メートル', '風速20m').replace('風速30メートル', '風速30m').replace('風速38メートル', '風速38m').replace('風速46メートル', '風速46m').replace('約50センチ', '約50cm')}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です（商品・地域で変わります）</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>柱の根元は、土間コンの前だけ見られる</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>カーポート・外構の相談はDMで</div>
          </div>
        </div>
      ) : null}
      {/* audio */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M2b/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at('09')}>
        <Loop durationInFrames={120}>
          <Audio src={staticFile('sfx/wind.wav')} volume={(fr) => 0.25 + 0.5 * Math.min(1, fr / 600)} />
        </Loop>
      </Sequence>
      {[0, 1, 2].map((k) => (
        <Sequence key={'r' + k} from={at('03') + 10 + k * 34} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.6} /></Sequence>
      ))}
      <Sequence from={at('05') + 30} durationInFrames={30}><Audio src={staticFile('sfx/rattle.wav')} volume={0.9} /></Sequence>
      <Sequence from={at('06') + 2} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('06') + 24} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.7} /></Sequence>
      <Sequence from={pullAt - 2} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={1} /></Sequence>
      <Sequence from={pullAt + 4} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('10') + 38} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.7} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
