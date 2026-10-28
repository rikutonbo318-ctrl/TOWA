import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_TOP, W} from './House';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Excavator3D, Site3D} from './Site3D';
import {Fdn3D, SUTE_TOP, Truck3D} from './Fdn3D';
import {ANCHORS, Rebar3D, SLAB_TOP} from './Rebar3D';

const cam = camTrack([
  [0, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [45, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [58, [-4.0, -6.5, 4.2], [3.0, 1.2, 0], 50],
  [106, [-4.0, -5.5, 4.2], [3.5, 2.0, 0], 50],
  [118, [W + 4.5, -5.0, 3.6], [5.5, 2.0, -0.2], 50],
  [170, [W + 4.0, -4.5, 3.6], [5.0, 2.5, -0.2], 50],
  [182, [4.5, -7.5, 8.5], [4.5, 3.0, -0.3], 50],
  [236, [4.5, -7.0, 8.0], [4.5, 3.2, -0.3], 50],
  [248, [-3.0, -4.5, 3.0], [3.0, 2.0, 0], 50],
  [316, [-2.0, -4.0, 3.0], [4.0, 2.5, 0], 50],
  [328, [W + 3.5, D + 2.5, 2.8], [6.0, 4.0, 0.2], 50],
  [376, [W + 3.0, D + 2.0, 2.8], [5.0, 3.5, 0.2], 50],
  [388, [2.2, -2.4, 2.0], [1.0, 0.6, -0.1], 52],
  [436, [2.6, -2.4, 2.0], [1.4, 0.6, -0.1], 52],
  [448, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [496, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [512, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [600, [W + 8.5, -12.5, 12.5], [4.5, 3.0, -0.3], 50],
]);

const STEPS: Step[] = [
  [45, 112, '型枠屋さん：外周の型枠', 'コンクリートを流す「枠」を立てる', false],
  [112, 178, '鉄筋屋さん：スペーサー', '鉄筋を地面から浮かせる台を置く', false],
  [178, 242, '鉄筋屋さん：底の鉄筋', '20cmごとに縦横に組んで結束する', false],
  [242, 322, '鉄筋屋さん：立ち上がり', '壁になる部分の鉄筋を立てる', false],
  [322, 382, '基礎屋さん：アンカーボルト', '土台と基礎をつなぐボルトをセット', false],
  [382, 442, '現場監督：かぶり厚さ', '鉄筋のまわりのコンクリートの厚みを確認', true],
  [442, 500, '現場監督：アンカーの位置', '図面どおりの位置と高さかを確かめる', true],
  [500, 600, '次は配筋検査', '第三者の検査員がチェックする', false],
];

export const Ep03: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const form = ramp(f, 50, 106);
  const spacer = ramp(f, 118, 170);
  const base = 0.5 * ramp(f, 140, 176) + 0.5 * ramp(f, 182, 238);
  const wall = ramp(f, 250, 316);
  const anchor = ramp(f, 330, 376);
  const cover = ramp(f, 392, 410);
  const stamp = ramp(f, 506, 516) * (1 - ramp(f, 522, 530));

  type P = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: P = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: P | null = {x: -1.2, y: -1.5 + 2 * ramp(f, 0, 44), yaw: 90, act: 'walk'};
  let b: P | null = null;
  if (f >= 45 && f < 112) {
    // walk along the south side as the panels go up
    a = {x: -0.5 + (W + 1) * form, y: -0.55, yaw: 0, act: 'hammer'};
    b = {x: -0.55, y: 0.5 + D * ramp(f, 70, 110), yaw: 90, act: 'hammer'};
  } else if (f >= 112 && f < 242) {
    const k = f < 178 ? spacer : ramp(f, 182, 238);
    a = {x: 0.6 + (W - 1.2) * k, y: 1.6, h: SUTE_TOP, yaw: 0, act: 'press'};
    b = {x: 0.6 + (W - 1.2) * k, y: 4.4, h: SUTE_TOP, yaw: 0, act: 'press'};
  } else if (f >= 242 && f < 322) {
    a = {x: 0.4 + (W - 0.8) * wall, y: 0.3, h: SUTE_TOP, yaw: 0, act: 'hammer'};
    b = {x: W - 0.3, y: 0.4 + (D - 0.8) * wall, h: SUTE_TOP, yaw: 90, act: 'hammer'};
  } else if (f >= 322 && f < 382) {
    const i = Math.min(ANCHORS.length - 1, Math.floor(anchor * ANCHORS.length));
    const [ax, ay] = ANCHORS[i];
    a = {x: ax + (ax > W - 0.1 ? 0.5 : ax < 0.1 ? -0.5 : 0), y: ay + (ay > D - 0.1 ? 0.5 : ay < 0.1 ? -0.5 : 0), yaw: 90, act: 'press'};
    b = null;
  } else if (f >= 382 && f < 442) {
    kan = {x: 1.1, y: -0.55, yaw: 90, act: 'measure'};
    a = {x: 3.0, y: -0.6, yaw: 180, act: 'idle'};
  } else if (f >= 442 && f < 500) {
    kan = {x: W + 0.6, y: 1.8 + 2.5 * ramp(f, 448, 496), yaw: 90, act: f < 470 ? 'measure' : 'point'};
    a = {x: -1.0, y: 2.0, yaw: 0, act: 'idle'};
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
        <Rebar3D s={{form, spacer, base, wall, anchor}} />
        <Excavator3D x={W + 2.8} y={D / 2} yaw={Math.PI} boom={0.9} arm={-1.9} bucket={-1.2} />
        {/* cover check: tape from the form face to the bar */}
        {f >= 382 && f < 442 ? (
          <group>
            <Line3D a={[1.2, -0.08, SLAB_TOP + 0.02]} b={[1.2, -0.08 + 0.06 * cover, SLAB_TOP + 0.02]} w={0.02} color="#f6d21f" emissive />
            <Ring3D p={[1.2, -0.02, SUTE_TOP + 0.05]} o={ramp(f, 398, 404)} f={f} r={0.2} />
            <Check3D p={[1.2, 0, FDN_TOP + 0.4]} o={ramp(f, 414, 420)} size={0.45} />
          </group>
        ) : null}
        {f >= 442 && f < 500
          ? ANCHORS.filter(([x]) => x > W - 0.1).map(([x, y], i) => (
              <group key={'ac' + i}>
                <Ring3D p={[x, y, FDN_TOP + 0.02]} o={ramp(f, 452 + i * 8, 456 + i * 8)} f={f} r={0.16} />
                <Check3D p={[x, y, FDN_TOP + 0.45]} o={ramp(f, 458 + i * 8, 462 + i * 8)} size={0.4} />
              </group>
            ))
          : null}
        <Truck3D x={W + 2.5} y={-7.0} />
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={3}
        hook={['基礎の中は', '鉄のカゴです']}
        title="配筋・型枠・アンカー"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [118, 176, '鉄筋は、地面から浮かせるんや'],
          [386, 440, 'この厚みが、鉄をサビから守るんや'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>鉄筋が組み上がった</span>
      </div>
    </AbsoluteFill>
  );
};
