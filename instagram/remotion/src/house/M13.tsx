import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Line3D, Person3D} from './Kit3D';
import {PBox} from './Geo';
import DUR from '../../public/voice/M13/durations.json';
import LINES from '../../../narration/M13.json';

// もしも M13（7:30 外構枠・ナレーション版）：シンボルツリーを壁から50cmに植えたら、10年でどうなる？
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
export const M13_FRAMES = end(LAST) + Math.round((PAUSE[LAST] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const TX = 8.5;
const TY = -0.55;
const SY = 4.5; // approach tile pitch start (SITE.y0 + 0.05)

const BigTree: React.FC<{s: number}> = ({s}) => {
  const blobs = useMemo(
    () =>
      Array.from({length: 320}, (_, i) => {
        const a = i * 2.39996;
        const k = ((i * 7919) % 1000) / 1000;
        const r = Math.sqrt(k) * 0.95;
        const h = 1.7 + ((i * 131) % 100) / 55 - r * 0.4;
        return {p: [Math.cos(a) * r, h, Math.sin(a) * r] as [number, number, number], r: 0.08 + ((i * 17) % 7) / 80, c: i % 3 ? '#4f7a3f' : '#6a8f4a'};
      }),
    [],
  );
  return (
    <group position={[TX, 0, -TY]} scale={[s, s, s]}>
      {[-0.4, 0.1, 0.5].map((tilt, i) => (
        <mesh key={i} position={[Math.sin(tilt) * 0.5, 1.2, Math.cos(i * 2) * 0.12]} rotation={[0, 0, -tilt * 0.35]} castShadow>
          <cylinderGeometry args={[0.03, 0.06, 2.4, 8]} />
          <meshStandardMaterial color="#7d7468" roughness={0.9} />
        </mesh>
      ))}
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <sphereGeometry args={[b.r, 7, 5]} />
          <meshStandardMaterial color={b.c} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
};

// root lines radiating on the ground (x-ray view)
const ROOTS = Array.from({length: 11}, (_, i) => {
  const a = (i / 11) * Math.PI * 2 + 0.3;
  const pts: [number, number][] = [[TX, TY]];
  let x = TX;
  let y = TY;
  for (let k = 1; k <= 6; k++) {
    const aa = a + Math.sin(i * 3 + k) * 0.35;
    x += Math.cos(aa) * 0.42;
    y += Math.sin(aa) * 0.42;
    pts.push([x, y]);
  }
  return pts;
});

export const M13: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const yr = f < at('02') ? 10 : f < at('03') ? ramp(f, at('02'), at('02') + 40) : f < at('05') ? 1 + 2 * ramp(f, at('03'), at('03') + 50) : f < at('08') ? 3 + 7 * ramp(f, at('05'), at('06')) : 10;
  const calm = f >= at('08');
  const label = f < at('02') || calm ? '' : f < at('03') ? '1年' : f < at('05') ? '3年' : '10年';
  const s = calm ? 0.55 : 0.55 + (yr <= 3 ? (yr / 3) * 0.45 : 0.45 + ((yr - 3) / 7) * 0.9);
  const rootK = f >= at('04') && f < at('05') ? ramp(f, at('04'), at('04') + 40) : f >= at('07') && f < at('08') ? 1 : 0;
  const rootLen = f >= at('07') && !calm ? 1 : rootK;
  const lift = !calm && f >= at('07') ? ramp(f, at('07') + 10, at('07') + 40) : f < at('02') ? 1 : 0;
  const leaves = !calm && f >= at('06') && f < at('08');
  const cam = camTrack([
    [0, [14.0, -8.6, 5.4], [8.6, -0.4, 3.2], 52],
    [at('02'), [13.6, -8.2, 5.0], [8.6, -0.4, 3.0], 52],
    [at('02') + 14, [12.2, -5.6, 2.6], [8.6, -0.4, 1.6], 50],
    [at('03'), [12.2, -5.6, 2.6], [8.6, -0.4, 1.6], 50],
    [at('04'), [12.6, -6.2, 3.2], [8.6, -0.5, 1.6], 52],
    [at('04') + 14, [11.8, -5.0, 4.2], [9.0, -0.8, 0.0], 52],
    [at('05'), [11.8, -5.0, 4.2], [9.0, -0.8, 0.0], 52],
    [at('05') + 14, [14.2, -9.0, 5.6], [8.6, -0.4, 3.4], 54],
    [at('07'), [14.2, -9.0, 5.6], [8.6, -0.4, 3.4], 54],
    [at('07') + 14, [10.6, -3.0, 2.3], [10.0, -0.5, 0.0], 50],
    [at('08') - 1, [10.65, -3.1, 2.3], [10.0, -0.5, 0.0], 50],
    [at(LAST), [14.0, -8.6, 5.4], [8.6, -0.4, 2.6], 52],
    [M13_FRAMES, [14.2, -8.8, 5.5], [8.6, -0.4, 2.6], 52],
  ]);
  const c = cam(f);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const diag = f >= at('08') && f < at(LAST) ? ramp(f, at('08'), at('08') + 10) * (1 - ramp(f, at(LAST) - 8, at(LAST))) : 0;
  const pipe = ramp(f, at('09'), at('09') + 20);
  const cover = ramp(f, at('10'), at('10') + 30);
  const endCard = ramp(f, at(LAST) + 6, at(LAST) + 20);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D noCarport cars />
        <BigTree s={s} />
        {rootLen > 0
          ? ROOTS.map((pts, i) => {
              const n = Math.max(1, Math.round(rootLen * (pts.length - 1)));
              return (
                <group key={i}>
                  {pts.slice(0, n).map((p, k) => (
                    <Line3D key={k} a={[p[0], p[1], 0.06]} b={[pts[k + 1][0], pts[k + 1][1], 0.06]} w={0.05 - k * 0.006} color="#c47a3a" emissive opacity={0.9} />
                  ))}
                </group>
              );
            })
          : null}
        {/* approach tiles pushed up by the roots */}
        {lift > 0
          ? [4, 5].map((i) => {
              const y0 = -SY + 0.05 + i * 0.86;
              return (
                <group key={i} position={[10.05, 0.04 + 0.05 * lift, -(y0 + 0.4)]} rotation={[(i === 4 ? 0.08 : -0.06) * lift, 0, (i === 4 ? 0.05 : -0.04) * lift]}>
                  <PBox x0={-0.72} x1={0.72} y0={-0.42} y1={0.42} h0={0} h1={0.045} m={{color: '#cfc9bd', tex: 'tile', rough: 0.7}} />
                </group>
              );
            })
          : null}
        {calm ? <Person3D x={10.0} y={-2.2} yaw={200} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </RealScene>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {leaves
        ? Array.from({length: 26}).map((_, i) => {
            const t = (f - at('06')) * (2 + (i % 5)) + i * 70;
            const x = 200 + ((i * 263) % 700) + Math.sin(t / 30 + i) * 40;
            const y = (t % 1400) + 200;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: 26, height: 14, borderRadius: 8, background: i % 2 ? '#8a6a3c' : '#a08040', transform: `rotate(${t * 3}deg)`}} />;
          })
        : null}
      {label ? (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', textShadow: outline(4)}}>壁から50cmに植えた木</div>
          <div style={{fontSize: 150, fontWeight: 900, color: label === '10年' ? '#ff5a3c' : '#ffd34d', textShadow: outline(7), lineHeight: 1.05}}>{label}</div>
          <div style={{margin: '10px auto 0', width: 760, height: 22, borderRadius: 11, background: 'rgba(16,22,30,0.7)', overflow: 'hidden'}}>
            <div style={{width: `${Math.min(1, yr / 10) * 100}%`, height: '100%', background: label === '10年' ? '#ff5a3c' : '#ffd34d'}} />
          </div>
        </div>
      ) : null}
      {rootK > 0 && f < at('05') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: rootK}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(196,122,58,0.95)', padding: '10px 28px', borderRadius: 14}}>根も横に広がる（イメージ）</span>
        </div>
      ) : null}
      {leaves && f < at('07') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT}}>
          <span style={{fontSize: 52, fontWeight: 900, color: '#fff', background: 'rgba(16,22,30,0.85)', padding: '10px 28px', borderRadius: 14}}>落ち葉で雨どいが詰まる</span>
        </div>
      ) : null}
      {lift > 0 && f >= at('07') && f < at('08') ? (
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: lift}}>
          <span style={{fontSize: 56, fontWeight: 900, color: '#fff', background: 'rgba(192,57,43,0.92)', padding: '10px 28px', borderRadius: 14}}>タイルが持ち上がる</span>
        </div>
      ) : null}
      {diag > 0 ? (
        <AbsoluteFill style={{opacity: diag}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 60%, #8a6a46 60%, #7a5b3b)'}} />
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
            <span style={{fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 14, background: cover > 0 ? '#c0392b' : '#2e9d5b', color: '#fff'}}>{cover > 0 ? '植えたら、根は見えない' : pipe > 0 ? '根の向きと配管の位置' : '大きくなりにくい木を、壁から離して'}</span>
          </div>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
            {/* wall */}
            <rect x={80} y={420} width={60} height={732} fill="#e6e1d6" stroke="#9a948a" strokeWidth={3} />
            {/* tree */}
            <rect x={520} y={850} width={26} height={302} fill="#7d7468" />
            <circle cx={533} cy={780} r={170} fill="#5f8a45" />
            {/* distance */}
            <line x1={140} y1={1110} x2={520} y2={1110} stroke="#ffd34d" strokeWidth={8} />
            <text x={330} y={1090} textAnchor="middle" fontSize={48} fontWeight={900} fill={ink} fontFamily={FONT}>1m以上が目安</text>
            {/* roots */}
            <g opacity={1 - cover}>
              {[-1, -0.5, 0, 0.5, 1].map((k, i) => (
                <path key={i} d={`M 533 1152 q ${k * 120} 60 ${k * 300} ${90 + Math.abs(k) * 30}`} stroke="#c47a3a" strokeWidth={10 - Math.abs(k) * 3} fill="none" />
              ))}
              {pipe > 0 ? (
                <g opacity={pipe}>
                  <rect x={160} y={1290} width={860} height={34} rx={17} fill="#8fa5b8" />
                  <text x={590} y={1380} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" fontFamily={FONT}>水道・排水の配管</text>
                </g>
              ) : null}
            </g>
            {cover > 0 ? (
              <g opacity={cover}>
                <rect x={0} y={1152} width={1080} height={300} fill="#7a5b3b" />
                <text x={540} y={1320} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffd34d" fontFamily={FONT}>？</text>
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>壁から50cmに<br />シンボルツリー</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>10年後どうなる？</div>
        </div>
      ) : null}
      {cur && f < at(LAST) && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1260, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　育ち方は木の種類や場所で変わります</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>家や外構を計画中の人は</div>
            <div style={{fontSize: 60, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>プロフのリンクへ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>植える場所の決め方もまとめています</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M13/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={at('05')} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('07') + 10} durationInFrames={30}><Audio src={staticFile('sfx/crack.wav')} volume={0.7} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at(LAST) + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
