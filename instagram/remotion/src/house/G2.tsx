import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D, Ring3D} from './Kit3D';
import {PBox} from './Geo';

// 外構シリーズ #2：このカーポート、どこがダメ？（答え＝柱が運転席のドアに当たる）20秒
const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const cam = camTrack([
  [0, [5.6, -7.8, 1.9], [6.3, -1.8, 0.9], 56],
  [60, [5.5, -7.6, 1.9], [6.3, -1.8, 0.9], 56],
  [72, [3.2, -8.6, 2.6], [6.2, -2.6, 0.8], 52],
  [196, [3.0, -8.9, 2.7], [6.2, -2.6, 0.8], 52],
  [208, [5.6, -7.8, 1.9], [6.3, -1.8, 0.9], 56],
  [330, [5.5, -7.5, 1.9], [6.3, -1.8, 0.9], 56],
  [342, [6.0, -7.0, 3.1], [6.4, -2.9, 0.6], 50],
  [516, [6.0, -6.8, 3.1], [6.4, -2.9, 0.6], 50],
  [528, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [600, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
]);
type St = [number, number, string, string];
const STEPS: St[] = [
  [64, 200, '外構屋さん：カーポートを立てる前', '柱の位置は図面で決める'],
  [200, 330, '車のドアは、開くと約1m', '乗り降りには幅がいる'],
  [330, 446, '運転席のドアを開けると…', ''],
  [446, 528, '答え：柱がドアに当たる', '動かせるのは、柱を立てる前まで'],
];
// the misplaced post between the two cars, and the dark car's driver door hinge (plan coords)
const POST = {x: 6.2, y: -2.75};
const HINGE = {x: 6.65, y: -3.4};

export const G2: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const c = cam(f);
  const hook = 1 - ramp(f, 56, 64);
  const cur = STEPS.find(([s, e]) => f >= s && f < e);
  const end = ramp(f, 534, 548);
  // door: opens slowly from 360, stops on the post at ~29 degrees (446)
  const doorDeg = f < 360 ? 0 : f < 446 ? 29 * Math.pow(ramp(f, 360, 446), 1.6) : f < 528 ? 29 - Math.max(0, Math.sin((f - 446) * 0.9)) * 2 * (1 - ramp(f, 446, 470)) : 0;
  const hit = f >= 446 && f < 470 ? 1 - ramp(f, 446, 470) : 0;
  const ring = f >= 452 && f < 528 ? ramp(f, 452, 460) : 0;
  const widthBar = f >= 220 && f < 330 ? ramp(f, 220, 232) : 0;
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D cars />
        {/* misplaced post up to the carport roof */}
        <PBox x0={POST.x - 0.05} x1={POST.x + 0.05} y0={POST.y - 0.05} y1={POST.y + 0.05} h0={0} h1={2.45} m={{color: '#3b3d40', rough: 0.4, metal: 0.6}} />
        <PBox x0={POST.x - 0.12} x1={POST.x + 0.12} y0={POST.y - 0.12} y1={POST.y + 0.12} h0={0.03} h1={0.05} m={{color: '#3b3d40', rough: 0.4, metal: 0.6}} />
        {/* driver door of the dark car, hinged at the front */}
        <group position={[HINGE.x, 0, -HINGE.y]} rotation={[0, (doorDeg * Math.PI) / 180, 0]}>
          <mesh position={[-0.03, 0.78, -0.5]} castShadow>
            <boxGeometry args={[0.05, 0.72, 1.0]} />
            <meshPhysicalMaterial color="#2c3a4f" roughness={0.25} metalness={0.6} clearcoat={1} />
          </mesh>
          <mesh position={[-0.03, 1.28, -0.55]}>
            <boxGeometry args={[0.04, 0.32, 0.8]} />
            <meshPhysicalMaterial color="#141a1f" roughness={0.03} metalness={0.3} />
          </mesh>
        </group>
        {ring > 0 ? <Ring3D p={[POST.x, POST.y, 0.9]} o={ring} f={f} r={0.32} vertical /> : null}
        <Person3D x={9.9} y={-2.8} yaw={200} act={f >= 446 && f < 528 ? 'point' : f >= 528 ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      {hit > 0 ? <AbsoluteFill style={{background: `rgba(255,60,40,${hit * 0.35})`}} /> : null}
      {hit > 0.3 ? (
        <div style={{position: 'absolute', top: 900, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${1 + hit * 0.2})`}}>
          <span style={{fontSize: 120, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>ガツン</span>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 38, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>外構の見落とし #2</div>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(6), marginTop: 16}}>このカーポート、どこがダメ？</div>
          <div style={{fontSize: 70, fontWeight: 900, color: '#ffd34d', textShadow: outline(5), marginTop: 8}}>答えは最後に</div>
        </div>
      ) : null}
      {cur && f < 528 ? (
        <div style={{position: 'absolute', top: 210, left: 50, right: 50, textAlign: 'center', fontFamily: FONT, opacity: ramp(f, cur[0], cur[0] + 6)}}>
          <div style={{display: 'inline-block', background: cur[0] === 446 ? '#c0392b' : '#e8622c', color: '#fff', fontSize: 56, fontWeight: 900, padding: '10px 28px', borderRadius: 16}}>{cur[2]}</div>
          {cur[3] ? (
            <div style={{marginTop: 12}}>
              <span style={{background: 'rgba(16,22,30,0.85)', color: '#fff', fontSize: 40, fontWeight: 800, padding: '6px 18px', borderRadius: 10}}>{cur[3]}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {widthBar > 0 ? (
        <div style={{position: 'absolute', top: 1100, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: widthBar}}>
          <svg width={760} height={240} viewBox="0 0 760 240">
            <rect x={60} y={40} width={260} height={160} rx={30} fill="#2c3a4f" stroke="#fff" strokeWidth={4} />
            <text x={190} y={132} fontSize={36} fontWeight={900} fill="#fff" textAnchor="middle" fontFamily={FONT}>車</text>
            <line x1={320} y1={70} x2={320 + 300 * Math.sin(ramp(f, 232, 262) * 1.1)} y2={70 + 300 * Math.cos(ramp(f, 232, 262) * 1.1) - 300 + 300} stroke="#ff9a3c" strokeWidth={10} strokeLinecap="round" />
            <text x={560} y={120} fontSize={44} fontWeight={900} fill="#ffd34d" stroke={ink} strokeWidth={6} paintOrder="stroke" fontFamily={FONT}>ドア 約1m</text>
          </svg>
        </div>
      ) : null}
      {f >= 90 && f < 196 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 90, 98)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>柱の場所、車を描いた図面で見てな</div>
        </div>
      ) : null}
      {f >= 350 && f < 436 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 350, 358)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>さて、どこがダメやった？</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　渦巻建設の施工実績ではありません</span>
      </div>
      {end > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: end, transform: `translateY(${(1 - end) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '32px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
              <UzuFace size={140} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>柱の位置は、ドアを全部開けて確認</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>カーポート・外構の相談は<br />DMでどうぞ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 14}}>「チェック」とコメントで見学リストも送るで</div>
          </div>
        </div>
      ) : null}
      <Sequence from={446} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.9} /></Sequence>
      <Sequence from={448} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={0.8} /></Sequence>
    </AbsoluteFill>
  );
};
