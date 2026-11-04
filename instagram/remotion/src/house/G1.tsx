import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';
import {PBox} from './Geo';

// 外構シリーズ #1：この駐車場、どこがダメ？（答え＝水たまり：水勾配が足りない）20秒
const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const cam = camTrack([
  [0, [5.6, -7.6, 1.9], [6.1, -1.4, 0], 56],
  [60, [5.5, -7.4, 1.9], [6.1, -1.4, 0], 56],
  [72, [6.2, -10.5, 1.6], [6.2, -1.5, 1.0], 52],
  [196, [6.4, -10.8, 1.7], [6.2, -1.5, 1.0], 52],
  [208, [5.6, -7.6, 1.9], [6.1, -1.6, 0], 56],
  [440, [5.5, -7.2, 1.9], [6.1, -1.6, 0], 56],
  [452, [6.0, -5.6, 1.6], [6.0, -1.2, 0], 54],
  [516, [6.0, -5.4, 1.6], [6.0, -1.2, 0], 54],
  [528, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [600, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
]);
type St = [number, number, string, string];
const STEPS: St[] = [
  [64, 200, '外構屋さん：土間コンを打つ前', '水が流れる向きを決める'],
  [200, 330, '水勾配は 1〜2% が目安', '1mで1〜2cm、目では見えない傾き'],
  [330, 446, '雨の日、水は道路へ流れる', '勾配が足りないと、たまる'],
  [446, 528, '答え：家の前の水たまり', '直せるのは、打つ前の日まで'],
];

export const G1: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const c = cam(f);
  const hookF = f < 64;
  const arrows = f >= 200 && f < 446 ? ramp(f, 206, 220) : 0;
  const rain = f >= 330 && f < 446 ? ramp(f, 330, 340) * (1 - ramp(f, 436, 446)) : 0;
  const puddle = hookF ? 1 : f >= 446 && f < 528 ? ramp(f, 446, 460) : 0;
  const hook = 1 - ramp(f, 56, 64);
  const cur = STEPS.find(([s, e]) => f >= s && f < e);
  const end = ramp(f, 534, 548);
  if (!a) return null;
  const midX = (PARK.x0 + PARK.x1) / 2;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={rain > 0 ? 0.75 : 1.0} sun={rain > 0 ? 1.0 : 2.4}>
        <House3D />
        <Gaiko3D cars={f >= 64 && f < 200} />
        {/* puddle near the house side of the parking */}
        {puddle > 0 ? (
          <group>
            <PBox x0={midX - 1.6} x1={midX + 1.1} y0={-1.6} y1={-0.5} h0={0.031} h1={0.034} m={{color: '#8fb4cf', rough: 0.02, opacity: 0.6 * puddle, emissive: '#4d7ea3', emissiveIntensity: 0.25}} cast={false} />
            <PBox x0={midX - 2.2} x1={midX - 1.2} y0={-2.1} y1={-1.2} h0={0.031} h1={0.034} m={{color: '#8fb4cf', rough: 0.02, opacity: 0.55 * puddle, emissive: '#4d7ea3', emissiveIntensity: 0.25}} cast={false} />
          </group>
        ) : null}
        {/* fall arrows towards the road */}
        {arrows > 0
          ? [PARK.x0 + 1.0, midX, PARK.x1 - 1.0].map((x, i) => {
              const flow = ((f - 206 + i * 10) % 40) / 40;
              const y = -0.8 - flow * 2.6;
              return (
                <group key={i}>
                  <PBox x0={x - 0.05} x1={x + 0.05} y0={y - 0.9} y1={y} h0={0.035} h1={0.045} m={{color: '#ff9a3c', emissive: '#ff7a1a', emissiveIntensity: 0.8, opacity: arrows}} cast={false} />
                  <PBox x0={x - 0.2} x1={x + 0.2} y0={y - 1.1} y1={y - 0.9} h0={0.035} h1={0.045} m={{color: '#ff9a3c', emissive: '#ff7a1a', emissiveIntensity: 0.8, opacity: arrows}} cast={false} />
                </group>
              );
            })
          : null}
        <Person3D x={9.9} y={-2.8} yaw={200} act={f >= 446 && f < 528 ? 'point' : f >= 528 ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      {rain > 0 ? (
        <AbsoluteFill style={{opacity: rain}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(20,30,45,0.3)'}} />
          {Array.from({length: 70}).map((_, i) => {
            const y = ((f * (50 + (i % 6) * 6) + i * 131) % 2200) - 200;
            const x = ((i * 197) % 1300) - y * 0.15;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 70, background: 'rgba(220,230,245,0.5)', transform: 'rotate(8deg)'}} />;
          })}
        </AbsoluteFill>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 38, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>外構の見落とし</div>
          <div style={{fontSize: 90, fontWeight: 900, color: '#fff', textShadow: outline(6), marginTop: 16}}>この駐車場、どこがダメ？</div>
          <div style={{fontSize: 70, fontWeight: 900, color: '#ffd34d', textShadow: outline(5), marginTop: 8}}>答えは最後に</div>
        </div>
      ) : null}
      {cur && f < 528 ? (
        <div style={{position: 'absolute', top: 210, left: 50, right: 50, textAlign: 'center', fontFamily: FONT, opacity: ramp(f, cur[0], cur[0] + 6)}}>
          <div style={{display: 'inline-block', background: cur[0] === 446 ? '#c0392b' : '#e8622c', color: '#fff', fontSize: 56, fontWeight: 900, padding: '10px 28px', borderRadius: 16}}>{cur[2]}</div>
          <div style={{marginTop: 12}}>
            <span style={{background: 'rgba(16,22,30,0.85)', color: '#fff', fontSize: 40, fontWeight: 800, padding: '6px 18px', borderRadius: 10}}>{cur[3]}</span>
          </div>
        </div>
      ) : null}
      {f >= 220 && f < 330 ? (
        <div style={{position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ramp(f, 220, 232)}}>
          <svg width={760} height={200} viewBox="0 0 760 200">
            <polygon points="20,150 740,170 740,190 20,190" fill="#d7d4cd" stroke="#a9a59c" strokeWidth={3} />
            <line x1={20} y1={140} x2={740} y2={140} stroke="#fff" strokeDasharray="10 8" strokeWidth={3} />
            <text x={30} y={120} fontSize={36} fontWeight={900} fill="#fff" stroke={ink} strokeWidth={5} paintOrder="stroke" fontFamily={FONT}>家側</text>
            <text x={630} y={120} fontSize={36} fontWeight={900} fill="#fff" stroke={ink} strokeWidth={5} paintOrder="stroke" fontFamily={FONT}>道路側</text>
            <text x={300} y={120} fontSize={40} fontWeight={900} fill="#ff9a3c" stroke={ink} strokeWidth={5} paintOrder="stroke" fontFamily={FONT}>→ 1〜2%</text>
          </svg>
        </div>
      ) : null}
      {f >= 90 && f < 196 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 90, 98)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>水の逃げ道、図面で見せてもらい</div>
        </div>
      ) : null}
      {f >= 350 && f < 436 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 350, 358)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>さて、最初の駐車場、どこがダメやった？</div>
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
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>水勾配は、土間コンを打つ前に確認</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>駐車場・外構の相談は<br />DMでどうぞ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 14}}>「チェック」とコメントで見学リストも送るで</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
