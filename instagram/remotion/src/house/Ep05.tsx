import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_TOP, W} from './House';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, SUTE_TOP, Truck3D} from './Fdn3D';
import {Rebar3D, SLAB_TOP} from './Rebar3D';

const cam = camTrack([
  [0, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [45, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [58, [W + 11.0, -11.0, 5.5], [W + 1.0, -2.5, 0.8], 50],
  [106, [W + 10.0, -10.0, 5.5], [W, -2.0, 0.8], 50],
  [118, [-3.5, -5.5, 4.5], [3.5, 2.0, -0.2], 50],
  [170, [-2.5, -5.0, 4.2], [4.5, 2.5, -0.2], 50],
  [182, [1.5, -4.2, 3.8], [3.0, 2.0, -0.1], 52],
  [236, [2.2, -4.2, 3.8], [3.6, 2.0, -0.1], 52],
  [248, [4.5, -7.5, 8.5], [4.5, 3.0, -0.3], 50],
  [296, [4.5, -7.0, 8.0], [4.5, 3.2, -0.3], 50],
  [308, [-3.0, D + 3.0, 3.8], [4.0, 2.5, 0.1], 50],
  [356, [-2.5, D + 2.5, 3.6], [4.5, 2.5, 0.1], 50],
  [368, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [426, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [438, [-3.0, -4.5, 3.4], [3.5, 2.5, 0], 50],
  [496, [-2.5, -4.0, 3.2], [4.0, 2.8, 0], 50],
  [512, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [600, [W + 8.5, -12.5, 12.5], [4.5, 3.0, -0.3], 50],
]);

const STEPS: Step[] = [
  [45, 112, '生コン屋さん：生コン到着', '工場で練ったコンクリートを運んでくる', false],
  [112, 178, '基礎屋さん：ベース打設', '底の部分に一気に流し込む', false],
  [178, 242, '基礎屋さん：バイブレーター', '振動で空気を抜いて、すき間なく', false],
  [242, 302, '基礎屋さん：立ち上がりの型枠', '壁になる部分の枠を組む', false],
  [302, 362, '基礎屋さん：立ち上がり打設', '壁の部分にもコンクリートを流す', false],
  [362, 432, '現場監督：養生', 'シートをかけて、ゆっくり固める', true],
  [432, 500, '基礎屋さん：脱型', '固まったら型枠を外して完成', false],
  [500, 600, '次は土台敷き', 'いよいよ大工さんの出番', false],
];

// mixer truck: flatbed truck with a turning drum (cab faces +x)
const Mixer3D: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <group>
    <Truck3D x={x} y={y} />
    <group position={[x - 2.1, 1.75, -y]} rotation={[0, 0, 0.18]}>
      <group rotation={[f * 0.12, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.55, 0.85, 3.4, 20]} />
          <meshStandardMaterial color="#e8e6e0" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.2, 0, 0]}>
          <torusGeometry args={[0.8, 0.04, 6, 20]} />
          <meshStandardMaterial color="#e8622c" roughness={0.5} />
        </mesh>
      </group>
    </group>
  </group>
);

export const Ep05: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const truckIn = ramp(f, 46, 100);
  const slab = ramp(f, 120, 236);
  const inner = ramp(f, 248, 296);
  const wallConc = ramp(f, 308, 360);
  const cure = ramp(f, 372, 420);
  const strip = ramp(f, 446, 494);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const mx = W + 2.5 + 8 * (1 - truckIn);

  type P = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: P = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: P | null = {x: W + 1.5, y: -2.6, yaw: 0, act: f > 90 ? 'wave' : 'idle'};
  let b: P | null = null;
  // hose end follows the pour
  let hose: [number, number, number] | null = null;
  if (f >= 112 && f < 242) {
    const k = f < 178 ? ramp(f, 118, 176) : ramp(f, 182, 238);
    const hx = 0.8 + (W - 1.6) * k;
    hose = [hx, 3.2, SUTE_TOP + 1.0];
    a = {x: hx, y: 2.6, h: SUTE_TOP, yaw: 90, act: 'press'};
    b = {x: hx - 1.2, y: 1.6, h: SUTE_TOP, yaw: 60, act: f >= 178 ? 'press' : 'shovel'};
    kan = {x: -0.9, y: -0.9, yaw: 45, act: 'idle'};
  } else if (f >= 242 && f < 302) {
    a = {x: 0.5 + (W - 1) * inner, y: 3.2, h: SLAB_TOP, yaw: 0, act: 'hammer'};
    b = {x: W - 0.6, y: 0.5 + (D - 1) * inner, h: SLAB_TOP, yaw: 90, act: 'hammer'};
  } else if (f >= 302 && f < 362) {
    const hx = 0.2 + (W - 0.4) * wallConc;
    hose = [hx, 0, FDN_TOP + 1.0];
    a = {x: hx, y: -0.6, yaw: 90, act: 'press'};
    kan = {x: W + 0.9, y: 4.0, yaw: 180, act: 'point'};
  } else if (f >= 362 && f < 432) {
    kan = {x: -0.8, y: 1.5 + 2 * ramp(f, 372, 420), yaw: 90, act: 'measure'};
    a = {x: (W + 0.6) * cure - 0.3, y: -0.7, yaw: 0, act: 'walk'};
  } else if (f >= 432 && f < 500) {
    a = {x: 0.5 + (W - 1) * strip, y: -0.6, yaw: 0, act: 'hammer'};
    b = {x: -0.6, y: 0.5 + (D - 1) * strip, yaw: 90, act: 'hammer'};
    kan = {x: W + 0.9, y: -1.0, yaw: 135, act: f > 480 ? 'point' : 'idle'};
  } else if (f >= 500) {
    kan = {x: 3.8, y: -2.0, yaw: 270, act: f > 512 ? 'wave' : 'idle'};
    a = {x: 5.4, y: -2.0, yaw: 270, act: f > 516 ? 'wave' : 'idle'};
    b = null;
  }

  return (
    <AbsoluteFill>
      <Scene3D cam={c} noSite>
        <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
        <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
        <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab, innerForm: inner, wallConc, cure: cure * (1 - ramp(f, 434, 446)), strip}} />
        <Mixer3D x={mx} y={-3.2} f={f} />
        {hose ? <Line3D a={[W + 0.6, -2.6, 2.4]} b={hose} w={0.07} color="#2a2a2a" /> : null}
        {hose ? <Line3D a={hose} b={[hose[0], hose[1], hose[2] - 0.9]} w={0.07} color="#2a2a2a" /> : null}
        {/* vibrator check */}
        {f >= 182 && f < 242 ? (
          <group>
            <Ring3D p={[3.0, 1.6, SLAB_TOP + 0.01]} o={ramp(f, 196, 202)} f={f} r={0.35} />
            <Check3D p={[3.0, 1.6, SLAB_TOP + 0.6]} o={ramp(f, 222, 228)} size={0.45} />
          </group>
        ) : null}
        {f >= 470 && f < 500 ? <Check3D p={[4.5, 0, FDN_TOP + 0.5]} o={ramp(f, 476, 482)} size={0.5} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={5}
        hook={['家の土台、', '1日で流し込む']}
        title="基礎のコンクリート"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '生コンは、時間との勝負や'],
          [380, 430, '急いで乾かすと、ひびが入るんや'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>基礎ができた</span>
      </div>
    </AbsoluteFill>
  );
};
