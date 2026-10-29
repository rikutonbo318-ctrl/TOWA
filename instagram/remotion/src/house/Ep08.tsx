import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FL2, M, roofH, W} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, Truck3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D, lumber} from './Ep06';
import {Frame3D, POSTS} from './Ep07';

// 上棟その2：2階の柱・桁・小屋組・垂木・野地板
export type RoofFrameState = {post?: number; plate?: number; purlin?: number; rafter?: number; sheath?: number};
const P = 0.105 / 2;
const PLATE = 0.24; // 桁の背
const EAVE = 0.6; // 軒の出
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => 1 - (1 - k) * (1 - k);
const drop = (i: number, n: number, p: number) => {
  const k = clamp(p * n - i);
  return {k, dz: (1 - ease(k)) * 1.5};
};
const ext = (x: number, y: number) => x < 0.05 || x > W - 0.05 || y < 0.05 || y > D - 0.05;
const POSTS2 = POSTS.filter(([x, y]) => ext(x, y));
// top plates on the outer walls, south (high) first
const PLATES: [number, number, number, number][] = [
  [0, 0, W, 0],
  [W, 0, W, D],
  [W, D, 0, D],
  [0, D, 0, 0],
];
const PURLIN_Y = [2, 4, 6].map((i) => i * M);
const STRUTS: [number, number][] = [];
PURLIN_Y.forEach((y) => {
  for (let x = 2 * M; x < W - 0.05; x += 2 * M) STRUTS.push([x, y]);
});
const RAFTER_X: number[] = [];
for (let x = -0.3; x <= W + 0.31; x += 0.455) RAFTER_X.push(x);
const SHEET_X: number[] = [];
for (let x = -0.3; x < W + 0.3 - 0.01; x += M) SHEET_X.push(x);
const rafT = (y: number) => roofH(y) + 0.045;

export const RoofFrame3D: React.FC<{s: RoofFrameState}> = ({s}) => (
  <group>
    {POSTS2.map(([x, y], i) => {
      const {k, dz} = drop(i, POSTS2.length, s.post ?? 0);
      if (k <= 0) return null;
      return <PBox key={'c' + i} x0={x - P} x1={x + P} y0={y - P} y1={y + P} h0={FL2 + dz} h1={roofH(y) - PLATE + dz} m={lumber} />;
    })}
    {PLATES.map(([x0, y0, x1, y1], i) => {
      const {k, dz} = drop(i, PLATES.length, s.plate ?? 0);
      if (k <= 0) return null;
      const h0 = roofH(y0);
      const h1 = roofH(y1);
      return <Prism key={'p' + i} a={[x0, y0]} b={[x1, y1]} t={0.12} hb={[h0 - PLATE + dz, h1 - PLATE + dz]} ht={[h0 + dz, h1 + dz]} m={lumber} />;
    })}
    {STRUTS.map(([x, y], i) => {
      const k = clamp((s.purlin ?? 0) * (STRUTS.length + 3) - i);
      if (k <= 0) return null;
      return <PBox key={'t' + i} x0={x - 0.045} x1={x + 0.045} y0={y - 0.045} y1={y + 0.045} h0={FL2} h1={FL2 + (roofH(y) - 0.105 - FL2) * ease(k)} m={lumber} />;
    })}
    {PURLIN_Y.map((y, i) => {
      const k = clamp((s.purlin ?? 0) * (STRUTS.length + 3) - STRUTS.length - i);
      if (k <= 0) return null;
      return <PBox key={'m' + i} x0={-0.3} x1={W + 0.3} y0={y - 0.05} y1={y + 0.05} h0={roofH(y) - 0.105 + (1 - ease(k)) * 1.2} h1={roofH(y) + (1 - ease(k)) * 1.2} m={lumber} />;
    })}
    {RAFTER_X.map((x, i) => {
      const k = clamp((s.rafter ?? 0) * RAFTER_X.length - i);
      if (k <= 0) return null;
      const y0 = -EAVE;
      const y1 = -EAVE + (D + 2 * EAVE) * k;
      return <Prism key={'r' + i} a={[x, y0]} b={[x, y1]} t={0.045} hb={[roofH(y0), roofH(y1)]} ht={[rafT(y0) + 0.045, rafT(y1) + 0.045]} m={lumber} />;
    })}
    {SHEET_X.slice(0, Math.round(SHEET_X.length * (s.sheath ?? 0))).map((x, i) => {
      const y0 = -EAVE;
      const y1 = D + EAVE;
      return <Prism key={'n' + i} a={[x + M / 2, y0]} b={[x + M / 2, y1]} t={M - 0.004} hb={[rafT(y0) + 0.045, rafT(y1) + 0.045]} ht={[rafT(y0) + 0.057, rafT(y1) + 0.057]} m={{color: '#c9a978', tex: 'lumber', rough: 0.85}} />;
    })}
  </group>
);

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [45, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [58, [W + 12.0, -12.0, 10.0], [6.0, 1.0, 4.6], 50],
  [106, [W + 11.0, -11.0, 10.0], [5.5, 1.5, 4.6], 50],
  [118, [-5.5, -7.5, 9.0], [3.0, 1.5, 6.0], 50],
  [170, [-5.0, -7.0, 9.0], [4.0, 2.0, 6.0], 50],
  [182, [4.5, -10.5, 13.5], [4.5, 3.0, 5.4], 50],
  [236, [4.5, -10.0, 13.0], [4.5, 3.2, 5.4], 50],
  [248, [-4.5, D + 6.5, 10.5], [4.5, 3.0, 6.0], 50],
  [296, [-4.0, D + 6.0, 10.5], [4.5, 3.0, 6.0], 50],
  [308, [4.5, -9.5, 15.5], [4.5, 3.0, 6.2], 50],
  [356, [4.5, -9.5, 15.5], [4.5, 3.0, 6.2], 50],
  [368, [W + 5.5, -5.5, 8.5], [W - 1.0, 1.0, 6.0], 50],
  [426, [W + 5.0, -5.0, 8.5], [W - 1.5, 1.5, 6.0], 50],
  [438, [-3.5, -4.0, 6.4], [0.4, 0.6, 6.0], 50],
  [496, [-3.2, -3.8, 6.4], [0.4, 0.8, 6.0], 50],
  [512, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [600, [W + 10.5, -15.5, 17.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [45, 112, '大工さん：2階の柱', 'クレーンで吊って2階に立てる', false],
  [112, 178, '大工さん：桁をかける', '屋根の傾きはここで決まる', false],
  [178, 242, '大工さん：小屋束・母屋', '屋根を下から支える骨組み', false],
  [242, 302, '大工さん：垂木を流す', '45cmおきに屋根の骨を並べる', false],
  [302, 362, '大工さん：野地板', '屋根の下地の板を張る', false],
  [362, 432, '大工さん：金物で留める', '柱と梁を金物でがっちり', false],
  [432, 500, '現場監督：金物の確認', '1か所ずつ締め付けを見る', true],
  [500, 600, '次は屋根', '雨から家を守る仕事', false],
];

export const Ep08: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const post = ramp(f, 48, 106);
  const plate = ramp(f, 118, 174);
  const purlin = ramp(f, 182, 238);
  const rafter = ramp(f, 248, 296);
  const sheath = ramp(f, 308, 356);
  const bolts = ramp(f, 368, 426);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const tx = W + 2.5;

  // crane boom follows the piece being lifted, folds away once the roof boards go on
  const BASE: [number, number, number] = [tx + 1.0, -3.2, 2.2];
  let tip: [number, number] = [W / 2, D / 2];
  let hookZ = FL2 + 3.0;
  if (f < 112) {
    const [x, y] = POSTS2[Math.min(POSTS2.length - 1, Math.floor(post * POSTS2.length))];
    tip = [x, y];
    hookZ = roofH(y) + 0.3;
  } else if (f < 178) {
    const [x0, y0, x1, y1] = PLATES[Math.min(PLATES.length - 1, Math.floor(plate * PLATES.length))];
    tip = [(x0 + x1) / 2, (y0 + y1) / 2];
    hookZ = roofH(tip[1]) + 0.4;
  } else if (f < 242) {
    tip = [W / 2, PURLIN_Y[Math.min(2, Math.floor(purlin * 3))]];
    hookZ = roofH(tip[1]) + 0.6;
  }
  const boomOut = 1 - ramp(f, 296, 312);
  const stow: [number, number, number] = [BASE[0] - 4.5, BASE[1], BASE[2] + 0.6];
  const tipZ = roofH(tip[1]) + 3.0;
  const tipP: [number, number, number] = [stow[0] + (tip[0] - stow[0]) * boomOut, stow[1] + (tip[1] - stow[1]) * boomOut, stow[2] + (tipZ - stow[2]) * boomOut];

  // joints that get a metal strap, in the order they are fixed
  const JOINTS = POSTS2.slice(0, 12);
  const nBolt = Math.round(JOINTS.length * bolts);

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: 2.0, y: 1.0, h: FL2, yaw: 0, act: 'press'};
  let b: Pp | null = {x: W - 1.5, y: D - 1.2, h: FL2, yaw: 180, act: 'point'};
  if (f >= 112 && f < 178) {
    a = {x: 0.6, y: 0.5, h: FL2, yaw: 0, act: 'hammer'};
    b = {x: W - 0.6, y: D - 0.5, h: FL2, yaw: 180, act: 'hammer'};
  } else if (f >= 178 && f < 242) {
    a = {x: 0.6 + (W - 1.2) * purlin, y: 2.6, h: FL2, yaw: 0, act: 'hammer'};
    b = {x: 0.6 + (W - 1.2) * purlin, y: 4.8, h: FL2, yaw: 0, act: 'press'};
  } else if (f >= 242 && f < 362) {
    const k = f < 302 ? rafter : sheath;
    const x = -0.1 + (W + 0.2) * k;
    a = {x, y: 1.4, h: rafT(1.4) + 0.06, yaw: 0, act: 'hammer'};
    b = {x, y: 4.6, h: rafT(4.6) + 0.06, yaw: 0, act: 'hammer'};
  } else if (f >= 362 && f < 432) {
    const [x, y] = JOINTS[Math.min(JOINTS.length - 1, nBolt)];
    a = {x: x + 0.4, y: y + 0.4, h: FL2, yaw: 225, act: 'hammer'};
    b = null;
  } else if (f >= 432 && f < 500) {
    kan = {x: 0.6, y: 0.7, h: FL2, yaw: 225, act: 'point'};
    a = {x: 1.8, y: 1.2, h: FL2, yaw: 200, act: 'idle'};
    b = null;
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
        <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab: 1, innerForm: 1, wallConc: 1, strip: 1}} />
        <Floor3D s={{sill: 1, obiki: 1, pipe: 1, ins: 1, ply: 1}} />
        <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 1, ply: 1}} />
        <RoofFrame3D s={{post, plate, purlin, rafter, sheath}} />
        <group>
          <Truck3D x={tx} y={-3.2} />
          <PBox x0={tx + 0.6} x1={tx + 1.4} y0={-3.6} y1={-2.8} h0={1.3} h1={2.2} m={{color: '#f2c230', rough: 0.5}} />
          <Line3D a={BASE} b={tipP} w={0.22} color="#f2c230" />
          {boomOut > 0.5 && f < 242 ? <Line3D a={tipP} b={[tipP[0], tipP[1], hookZ]} w={0.02} color="#333333" /> : null}
        </group>
        {/* metal straps on the post heads */}
        {JOINTS.slice(0, nBolt).map(([x, y], i) => (
          <PBox key={'k' + i} x0={x - 0.06} x1={x + 0.06} y0={y - 0.06} y1={y + 0.06} h0={roofH(y) - PLATE - 0.12} h1={roofH(y) - PLATE + 0.02} m={{color: '#3a3d40', metal: 0.6, rough: 0.4}} />
        ))}
        {f >= 150 && f < 178 ? <Ring3D p={[0, 0, roofH(0) - 0.1]} o={ramp(f, 150, 156)} f={f} r={0.35} vertical /> : null}
        {f >= 440 && f < 500 ? <Ring3D p={[JOINTS[0][0], JOINTS[0][1], roofH(JOINTS[0][1]) - PLATE - 0.05]} o={ramp(f, 440, 446)} f={f} r={0.3} vertical /> : null}
        {f >= 470 && f < 500 ? <Check3D p={[0.8, 0.4, roofH(0) + 0.5]} o={ramp(f, 476, 482)} size={0.5} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={8}
        hook={['屋根の骨組み', '見たことありますか？']}
        title="上棟・小屋組"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '桁の高さで、屋根の傾きが決まるんや'],
          [440, 496, '金物が1本でも抜けとったらアカン'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>上棟しました</span>
      </div>
    </AbsoluteFill>
  );
};
