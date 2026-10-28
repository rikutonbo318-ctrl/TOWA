import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, W} from './House';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {BOUNDS, Excavator3D, HOLE, SITE, Site3D, YK_RECT} from './Site3D';

const cam = camTrack([
  [0, [4.6, -21, 21], [4.6, 2.5, 0], 46],
  [45, [4.6, -19, 19], [4.6, 2.5, 0], 46],
  [60, [2.0, -9.8, 2.6], [-2.6, -4.2, 0.3], 50],
  [100, [3.0, -9.8, 2.6], [-1.6, -4.2, 0.3], 50],
  [116, [4.6, -9.5, 7.0], [4.6, 3.0, 0], 50],
  [166, [4.6, -9.5, 7.0], [4.6, 3.0, 0], 50],
  [180, [10.5, -6.5, 3.2], [3.6, -2.2, 0.3], 50],
  [226, [10.5, -5.5, 3.2], [3.6, -2.0, 0.3], 50],
  [240, [-4.5, -7.5, 3.6], [2.5, 1.5, 0.4], 52],
  [296, [-4.0, -6.5, 3.6], [3.0, 2.0, 0.4], 52],
  [310, [15.5, -8.0, 4.6], [8.0, 1.5, 0.4], 50],
  [356, [15.5, -7.0, 4.6], [8.0, 2.5, 0.4], 50],
  [370, [4.6, -8.5, 11.5], [4.6, 3.0, 0], 52],
  [416, [4.6, -8.0, 11.5], [4.6, 3.0, 0], 52],
  [430, [17.5, -9.5, 7.5], [6.5, 3.4, -0.2], 50],
  [496, [17.0, -8.0, 7.0], [6.0, 3.4, -0.2], 50],
  [512, [4.6, -18, 14], [4.6, 3.0, -0.2], 52],
  [600, [4.6, -18.5, 14.5], [4.6, 3.0, -0.2], 52],
]);

const STEPS: Step[] = [
  [45, 105, '現場監督：敷地の確認', '境界の杭と、まわりの状況を確かめる', true],
  [105, 170, '基礎屋さん：地縄張り', '建物の外形に縄を張って、位置を出す', false],
  [170, 230, '配置確認', '図面どおりか、境界からの距離を測る', true],
  [230, 300, '基礎屋さん：遣り方の杭', '建物のまわりに杭を打つ', false],
  [300, 360, '基礎屋さん：水貫', 'レーザーで高さをそろえて板を付ける', false],
  [360, 420, '基礎屋さん：水糸', '柱と壁の通り芯に、糸を張る', false],
  [420, 500, '重機オペさん：根切り', '基礎の深さまで土を掘る', true],
  [500, 600, '次は砕石・捨てコン', '掘った底を固めて、基礎の下地をつくる', false],
];

const KANTOKU = UZU; // 現場監督 = 渦さん

export const Ep01: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const rope = ramp(f, 108, 112) * (1 - ramp(f, 470, 490));
  const ropeDraw = ramp(f, 112, 164);
  const posts = ramp(f, 236, 294);
  const laser = ramp(f, 304, 312) * (1 - ramp(f, 420, 426));
  const nuki = ramp(f, 314, 354);
  const strings = ramp(f, 364, 412);
  const digP = ramp(f, 432, 496);
  const dig = (i: number) => ramp(digP * 12, 11 - i, 12 - i);
  const pile = digP;

  // excavator cycle: dig → swing to the pile → dump → back
  const cyc = f >= 430 && f < 500 ? ((f - 430) % 35) / 35 : 0;
  const toPile = cyc < 0.3 ? 0 : cyc < 0.45 ? (cyc - 0.3) / 0.15 : cyc < 0.7 ? 1 : cyc < 0.85 ? 1 - (cyc - 0.7) / 0.15 : 0;
  const yaw = Math.PI + (1.754 - Math.PI) * toPile;
  const digging = cyc < 0.3;
  const boom = digging ? 0.35 + Math.sin(cyc * 10) * 0.05 : 0.75;
  const arm = digging ? -1.5 : toPile > 0.9 ? -0.6 : -1.0;
  const bucket = toPile > 0.9 && cyc > 0.5 && cyc < 0.7 ? 0.6 : -0.6;

  type P = {x: number; y: number; yaw: number; act: Act3};
  let kan: P = {x: -2.2 + 2.0 * ramp(f, 0, 44), y: -3.6, yaw: 20, act: f < 44 ? 'walk' : 'idle'};
  let kiso: P | null = null;
  let kiso2: P | null = null;
  if (f >= 45 && f < 105) kan = {x: -1.6, y: -3.0, yaw: 225, act: 'point'};
  else if (f >= 105 && f < 170) {
    // walk along the rope as it is laid
    const d = ropeDraw * 2 * (W + D);
    const pos = d < W ? [d, -0.35] : d < W + D ? [W + 0.35, d - W] : d < 2 * W + D ? [W - (d - W - D), D + 0.35] : [-0.35, D - (d - 2 * W - D)];
    kiso = {x: pos[0], y: pos[1], yaw: d < W ? 0 : d < W + D ? 90 : d < 2 * W + D ? 180 : 270, act: 'walk'};
    kan = {x: -2.0, y: -2.6, yaw: 45, act: 'idle'};
  } else if (f >= 170 && f < 230) {
    kan = {x: 3.0, y: -4.1, yaw: 90, act: 'measure'};
    kiso = {x: 3.0, y: -0.35, yaw: 270, act: 'measure'};
  } else if (f >= 230 && f < 300) {
    const i = Math.floor(posts * 18);
    kiso = {x: YK_RECT.x0 + 0.4 + Math.min(i, 9) * 1.15, y: YK_RECT.y0 - 0.45, yaw: 90, act: 'hammer'};
    kiso2 = {x: YK_RECT.x0 - 0.45, y: YK_RECT.y0 + 0.6 + Math.max(0, i - 9) * 0.8, yaw: 0, act: 'hammer'};
    kan = {x: 11.5, y: -3.0, yaw: 135, act: 'idle'};
  } else if (f >= 300 && f < 360) {
    kiso = {x: YK_RECT.x1 + 0.45, y: -0.2 + nuki * 6, yaw: 180, act: 'hammer'};
    kiso2 = {x: W + 0.6, y: D + 2.0, yaw: 0, act: 'idle'};
  } else if (f >= 360 && f < 420) {
    kiso = {x: YK_RECT.x0 - 0.4, y: 2.0, yaw: 0, act: 'press'};
    kiso2 = {x: YK_RECT.x1 + 0.4, y: 2.6, yaw: 180, act: 'press'};
    kan = {x: 4.0, y: YK_RECT.y0 - 1.0, yaw: 90, act: 'idle'};
  } else if (f >= 420 && f < 500) {
    kiso = {x: -1.2, y: -1.4, yaw: 45, act: 'shovel'};
    kan = {x: 3.5, y: -2.6, yaw: 90, act: 'idle'};
  } else if (f >= 500) {
    kan = {x: 3.6, y: -2.2, yaw: 270, act: f > 512 ? 'wave' : 'idle'};
    kiso = {x: 5.4, y: -2.2, yaw: 270, act: f > 516 ? 'wave' : 'idle'};
  }

  const bndO = BOUNDS.map((_, i) => ramp(f, 52 + i * 9, 58 + i * 9) * (f < 105 ? 1 : 0));
  const tape = ramp(f, 178, 196) * (1 - ramp(f, 224, 230));
  const placeChecks = [ramp(f, 200, 206), ramp(f, 212, 218)];
  const stamp = ramp(f, 506, 516);

  return (
    <AbsoluteFill>
      <Scene3D cam={c} noSite>
        <Site3D f={f} s={{dig, rope, ropeDraw, posts, nuki, strings, laser, pile}} />
        <Excavator3D x={W + 2.8} y={D / 2} yaw={f >= 420 ? yaw : Math.PI} boom={f >= 420 ? boom : 0.9} arm={f >= 420 ? arm : -1.9} bucket={f >= 420 ? bucket : -1.2} />
        {/* boundary marker rings */}
        {BOUNDS.map(([x, y], i) => (
          <group key={'br' + i}>
            <Ring3D p={[x, y, 0.13]} o={bndO[i]} f={f} r={0.35} />
            <Check3D p={[x, y, 0.75]} o={bndO[i]} size={0.55} />
          </group>
        ))}
        {/* tape measure from the south boundary to the building line */}
        {tape > 0 ? (
          <group>
            <Line3D a={[3.0, SITE.y0, 0.06]} b={[3.0, SITE.y0 + (0 - SITE.y0) * tape, 0.06]} w={0.03} color="#f6d21f" emissive />
            <Line3D a={[6.2, SITE.y0, 0.06]} b={[6.2, SITE.y0 + (0 - SITE.y0) * tape, 0.06]} w={0.03} color="#f6d21f" emissive />
            <Check3D p={[3.0, -2.2, 0.7]} o={placeChecks[0]} size={0.55} />
            <Check3D p={[6.2, -2.2, 0.7]} o={placeChecks[1]} size={0.55} />
          </group>
        ) : null}
        <Person3D x={kan.x} y={kan.y} yaw={kan.yaw} act={kan.act} f={f} suit={KANTOKU.suit} vest={KANTOKU.vest} uzu phase={9} />
        {kiso ? <Person3D x={kiso.x} y={kiso.y} yaw={kiso.yaw} act={kiso.act} f={f} phase={2} /> : null}
        {kiso2 ? <Person3D x={kiso2.x} y={kiso2.y} yaw={kiso2.yaw} act={kiso2.act} f={f} phase={5} suit="#3a5a3f" /> : null}
        {/* hole outline guide while digging */}
        {f >= 420 && f < 500 ? <Ring3D p={[HOLE.x0 + 1.0, HOLE.y0 + 1.0, -0.3]} o={0} f={f} /> : null}
      </Scene3D>
      <OverlayV2 f={f} no={1} hook={['家づくりの最初の一手', '実は「糸」です']} title="地縄・遣り方・根切り" steps={STEPS} total={7} ctaAt={528} uzu={[[60, 165, 'まずは境界の杭を見る。ここからや'], [425, 500, 'この深さで、家の足元が決まるで']]} />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp * (1 - ramp(f, 522, 530))}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>位置と高さが決まった</span>
      </div>
    </AbsoluteFill>
  );
};
