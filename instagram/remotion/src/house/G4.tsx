import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {camTrack, Line3D, Person3D, Ring3D} from './Kit3D';
import {PBox} from './Geo';

// 外構シリーズ #4：この庭、どこがダメ？（答え＝外の水道が駐車場から遠い：洗車のホースが届かない）20秒
const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const cam = camTrack([
  [0, [3.4, -10.5, 7.6], [2.6, -1.4, 0.0], 54],
  [60, [3.4, -10.2, 7.4], [2.6, -1.4, 0.0], 54],
  [72, [-0.6, -3.4, 2.2], [-2.9, -0.7, 0.5], 50],
  [196, [-0.7, -3.6, 2.3], [-2.9, -0.7, 0.5], 50],
  [208, [3.4, -10.5, 7.6], [2.6, -1.4, 0.0], 54],
  [330, [3.4, -10.2, 7.4], [2.6, -1.4, 0.0], 54],
  [342, [2.2, -8.8, 6.6], [1.7, -1.9, 0.0], 54],
  [516, [2.3, -8.6, 6.5], [1.7, -1.9, 0.0], 54],
  [528, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [600, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
]);
type St = [number, number, string, string];
const STEPS: St[] = [
  [64, 200, '外構屋さん：外の水道（立水栓）', '場所は図面で決める'],
  [200, 330, '使うのは、洗車・掃除・水まき', 'ホースは長いほど重くて出しにくい'],
  [330, 446, '洗車しようとすると…', ''],
  [446, 528, '答え：水道が駐車場から遠い', '駐車場のそばに、もう1か所'],
];
const TAP = {x: -3.0, y: -0.7};
// hose path on the ground from the tap towards the white car
const PATH: [number, number][] = [
  [TAP.x, TAP.y],
  [-2.6, -1.4],
  [-0.8, -2.0],
  [1.0, -2.3],
  [2.7, -2.5],
];
const segLen = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const TOTAL = segLen.reduce((s, v) => s + v, 0);
const pointAt = (d: number): [number, number] => {
  let r = d;
  for (let i = 0; i < segLen.length; i++) {
    if (r <= segLen[i]) {
      const k = r / segLen[i];
      return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k];
    }
    r -= segLen[i];
  }
  return PATH[PATH.length - 1];
};

export const G4: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const c = cam(f);
  const hook = 1 - ramp(f, 56, 64);
  const cur = STEPS.find(([s, e]) => f >= s && f < e);
  const end = ramp(f, 534, 548);
  const reach = f < 350 ? 0 : TOTAL * Math.min(1, ramp(f, 350, 440));
  const tug = f >= 440 && f < 470 ? Math.sin((f - 440) * 0.8) * 0.04 * (1 - ramp(f, 440, 470)) : 0;
  const tip = pointAt(reach);
  const pts: [number, number][] = [];
  if (reach > 0) {
    let acc = 0;
    pts.push(PATH[0]);
    for (let i = 0; i < segLen.length && acc + segLen[i] < reach; i++) {
      acc += segLen[i];
      pts.push(PATH[i + 1]);
    }
    pts.push([tip[0] + tug, tip[1]]);
  }
  const gap = f >= 452 && f < 528 ? ramp(f, 452, 462) : 0;
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: ink}}>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        <Gaiko3D cars />
        {/* the outdoor tap (立水栓) in the far corner of the garden */}
        <PBox x0={TAP.x - 0.07} x1={TAP.x + 0.07} y0={TAP.y - 0.07} y1={TAP.y + 0.07} h0={0} h1={0.85} m={{color: '#b9b4aa', tex: 'plaster', rough: 0.9}} />
        <PBox x0={TAP.x - 0.03} x1={TAP.x + 0.03} y0={TAP.y - 0.16} y1={TAP.y - 0.07} h0={0.62} h1={0.68} m={{color: '#c3c7cb', rough: 0.25, metal: 0.9}} />
        <PBox x0={TAP.x - 0.25} x1={TAP.x + 0.25} y0={TAP.y - 0.35} y1={TAP.y - 0.1} h0={0} h1={0.08} m={{color: '#8a857c', rough: 0.9}} />
        {/* hose */}
        {pts.length > 1
          ? pts.slice(1).map((p, i) => <Line3D key={i} a={[pts[i][0], pts[i][1], i === 0 ? 0.62 : 0.03]} b={[p[0], p[1], 0.03]} w={0.035} color="#3f8f4a" />)
          : null}
        {reach > 0 ? <PBox x0={tip[0] + tug - 0.05} x1={tip[0] + tug + 0.05} y0={tip[1] - 0.05} y1={tip[1] + 0.05} h0={0.0} h1={0.08} m={{color: '#e8b13c', rough: 0.5}} cast={false} /> : null}
        {gap > 0 ? <Ring3D p={[3.4, -2.5, 0.02]} o={gap} f={f} r={0.55} /> : null}
        {reach > 0 ? <Person3D x={tip[0] + tug - 0.1} y={tip[1] + 0.25} yaw={0} act={f < 440 ? 'walk' : 'idle'} f={f} phase={2} suit="#c9a96e" casual helmet="#1f2a3a" /> : null}
        <Person3D x={9.9} y={-2.8} yaw={200} act={f >= 446 && f < 528 ? 'point' : f >= 528 ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      {gap > 0 ? (
        <div style={{position: 'absolute', top: 900, width: '100%', textAlign: 'center', fontFamily: FONT, opacity: gap}}>
          <span style={{fontSize: 96, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>届かない！</span>
        </div>
      ) : null}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 38, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>外構の見落とし #4</div>
          <div style={{fontSize: 90, fontWeight: 900, color: '#fff', textShadow: outline(6), marginTop: 16}}>この庭、どこがダメ？</div>
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
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>水道で何するか、決めてから場所を選んでな</div>
        </div>
      ) : null}
      {f >= 220 && f < 330 ? (
        <div style={{position: 'absolute', left: 40, bottom: 520, display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, 220, 228)}}>
          <UzuFace size={110} />
          <div style={{fontFamily: FONT, background: '#fff', color: ink, fontSize: 40, fontWeight: 800, padding: '14px 22px', borderRadius: 20, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>さて、最初の庭、どこがダメやった？</div>
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
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>続き：外の水道とコンセント、置く場所の決め方</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>コメントで「チェック」って<br />送ってな</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 14}}>外構の相談はDMでどうぞ</div>
          </div>
        </div>
      ) : null}
      <Sequence from={446} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.8} /></Sequence>
    </AbsoluteFill>
  );
};
