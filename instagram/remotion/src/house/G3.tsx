import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets, useHdr} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';

// 外構シリーズ #3：この玄関まわり、どこがダメ？（答え＝夜、足元の照明がない）20秒
const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const cam = camTrack([
  [0, [11.4, -8.2, 2.6], [10.0, -0.8, 0.5], 54],
  [60, [11.3, -8.0, 2.6], [10.0, -0.8, 0.5], 54],
  [72, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [196, [16.0, -13.0, 4.8], [5.5, 0.5, 1.6], 50],
  [208, [13.8, -9.4, 2.0], [9.6, -1.2, 1.0], 50],
  [330, [13.5, -9.0, 2.0], [9.6, -1.2, 1.0], 50],
  [342, [11.4, -8.2, 2.6], [10.0, -0.8, 0.5], 54],
  [516, [11.3, -7.8, 2.6], [10.0, -0.8, 0.5], 54],
  [528, [17.5, -14.5, 5.5], [5.5, 0.5, 1.6], 50],
  [600, [18.0, -15.0, 5.8], [5.5, 0.5, 1.6], 50],
]);
type St = [number, number, string, string];
const STEPS: St[] = [
  [64, 200, '外構屋さん：アプローチと門柱', '昼に見ると、問題なさそう'],
  [200, 330, '冬は夕方5時で、もう暗い', '帰ってくるのは、たいてい夜'],
  [330, 446, '夜、玄関まで歩くと…', ''],
  [446, 528, '答え：足元を照らす明かりがない', '照明の線は、コンクリートの前に通す'],
];

export const G3: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const dusk = useHdr('hdr/venice_sunset_1k.hdr');
  const c = cam(f);
  const hook = 1 - ramp(f, 56, 64);
  const cur = STEPS.find(([s, e]) => f >= s && f < e);
  const end = ramp(f, 534, 548);
  // 0..1 darkness: night in the hook, day 64-200, dusk 200-330, night after
  const day = f >= 64 && f < 200;
  const dk = f < 64 ? 1 : day ? 0 : f < 330 ? 0.25 + 0.75 * ramp(f, 210, 320) : 1;
  const lit = f >= 470;
  const pop = f >= 470 && f < 480 ? 1 - ramp(f, 470, 480) : 0;
  if (!a || !dusk) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} hdr={day ? undefined : dusk} exposure={day ? 1.0 : lit ? 0.2 : 0.9 - 0.83 * dk} sun={day ? 2.4 : 1.2 * (1 - dk) + 0.05} sunColor={day ? '#fff4e4' : '#ffb070'}>
        <House3D />
        <Gaiko3D cars night={lit} />
        <Person3D x={8.7} y={-3.6} yaw={30} act={f >= 446 && f < 528 ? 'point' : f >= 528 ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      {/* night grade: unlit = almost black path; lit = dark around, the path and pillar glow */}
      {!lit && dk > 0.3 ? <AbsoluteFill style={{background: `rgba(3,6,16,${0.75 * dk})`}} /> : null}
      {lit && f < 528 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 520px 620px at 520px 1060px, rgba(3,6,16,0) 0%, rgba(3,6,16,0.15) 55%, rgba(3,6,16,0.5) 100%)'}} /> : null}
      {lit && f >= 528 ? <AbsoluteFill style={{background: 'rgba(3,6,16,0.3)'}} /> : null}
      {pop > 0 ? <AbsoluteFill style={{background: `rgba(255,230,180,${pop * 0.35})`}} /> : null}
      {f >= 380 && f < 446 ? (
        <div style={{position: 'absolute', top: 1040, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: ramp(f, 380, 390)}}>
          <span style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>段差、どこ？</span>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 38, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>外構の見落とし #3</div>
          <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: outline(6), marginTop: 16}}>この玄関まわり、どこがダメ？</div>
          <div style={{fontSize: 70, fontWeight: 900, color: '#ffd34d', textShadow: outline(5), marginTop: 8}}>答えは最後に</div>
        </div>
      ) : null}
      {cur && f < 528 ? (
        <div style={{position: 'absolute', top: 210, left: 50, right: 50, textAlign: 'center', fontFamily: FONT, opacity: ramp(f, cur[0], cur[0] + 6)}}>
          <div style={{display: 'inline-block', background: cur[0] === 446 ? '#c0392b' : '#e8622c', color: '#fff', fontSize: 54, fontWeight: 900, padding: '10px 28px', borderRadius: 16}}>{cur[2]}</div>
          {cur[3] ? (
            <div style={{marginTop: 12}}>
              <span style={{background: 'rgba(16,22,30,0.85)', color: '#fff', fontSize: 40, fontWeight: 800, padding: '6px 18px', borderRadius: 10}}>{cur[3]}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= 90 && f < 196 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 90, 98)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>外構の図面は、夜の姿も想像してな</div>
        </div>
      ) : null}
      {f >= 340 && f < 436 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 340, 348)}}>
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
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>照明の場所は、コンクリートの前に決める</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>玄関まわり・外構の相談は<br />DMでどうぞ</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 14}}>「チェック」とコメントで見学リストも送るで</div>
          </div>
        </div>
      ) : null}
      <Sequence from={470} durationInFrames={20}><Audio src={staticFile('sfx/tick.wav')} volume={0.9} /></Sequence>
    </AbsoluteFill>
  );
};
