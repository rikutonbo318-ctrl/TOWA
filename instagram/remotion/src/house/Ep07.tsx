import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_LINES, FL1, FL2, M, W} from './House';
import {PBox} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, Truck3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D, lumber} from './Ep06';

// 上棟その1：柱・梁・2階の床
export type FrameState = {post?: number; beam?: number; joist?: number; brace?: number; ply?: number};
const P = 0.105 / 2; // 105角
const PLY_B = FL2 - 0.028;
const BEAM_B = PLY_B - 0.24;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => 1 - (1 - k) * (1 - k);

// posts: the ends of each line and every 2 grid units along it
const POSTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (!out.some(([a, b]) => Math.abs(a - x) < 0.05 && Math.abs(b - y) < 0.05)) out.push([x, y]);
  };
  FDN_LINES.forEach(([x0, y0, x1, y1]) => {
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / M);
    for (let i = 0; i <= n; i++) if (i === 0 || i === n || i % 2 === 0) add(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
  });
  // south → north, west → east: the order they are stood
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
})();
// 2F floor joists across the short span, every grid unit
const JOISTS = [1, 2, 4, 6].map((i) => i * M);
// temporary braces on the outer walls
const BRACES: [number, number, number, number][] = [
  [0, 0, 2 * M, 0],
  [W, 0, W - 2 * M, 0],
  [0, D, 2 * M, D],
  [W, D, W - 2 * M, D],
  [0, 0, 0, 2 * M],
  [W, 0, W, 2 * M],
  [0, D, 0, D - 2 * M],
  [W, D, W, D - 2 * M],
];
const PANELS: [number, number, number, number][] = [];
for (let y = 0; y < D - 0.01; y += M) for (let x = 0; x < W - 0.01; x += 2 * M) PANELS.push([x, Math.min(W, x + 2 * M), y, Math.min(D, y + M)]);

const beamDrop = (i: number, n: number, p: number) => {
  const k = clamp(p * n - i);
  return {k, dz: (1 - ease(k)) * 1.5};
};

export const Frame3D: React.FC<{s: FrameState}> = ({s}) => {
  const t = 0.06;
  return (
    <group>
      {POSTS.map(([x, y], i) => {
        const {k, dz} = beamDrop(i, POSTS.length, s.post ?? 0);
        if (k <= 0) return null;
        return <PBox key={'c' + i} x0={x - P} x1={x + P} y0={y - P} y1={y + P} h0={FL1 + dz} h1={BEAM_B + dz} m={lumber} />;
      })}
      {FDN_LINES.map(([x0, y0, x1, y1], i) => {
        const {k, dz} = beamDrop(i, FDN_LINES.length, s.beam ?? 0);
        if (k <= 0) return null;
        return <PBox key={'b' + i} x0={Math.min(x0, x1) - t} x1={Math.max(x0, x1) + t} y0={Math.min(y0, y1) - t} y1={Math.max(y0, y1) + t} h0={BEAM_B + dz} h1={PLY_B + dz} m={lumber} />;
      })}
      {JOISTS.map((y, i) => {
        const k = clamp((s.joist ?? 0) * JOISTS.length - i);
        if (k <= 0) return null;
        return <PBox key={'j' + i} x0={0.06} x1={0.06 + (W - 0.12) * k} y0={y - 0.06} y1={y + 0.06} h0={PLY_B - 0.18} h1={PLY_B} m={lumber} />;
      })}
      {BRACES.map(([x0, y0, x1, y1], i) => {
        const k = clamp((s.brace ?? 0) * BRACES.length - i);
        if (k <= 0) return null;
        return <Line3D key={'r' + i} a={[x0, y0, FL1 + 0.1]} b={[x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, FL1 + 0.1 + (BEAM_B - FL1 - 0.2) * k]} w={0.05} color="#c9a46a" />;
      })}
      {PANELS.slice(0, Math.round(PANELS.length * (s.ply ?? 0))).map(([x0, x1, y0, y1], i) => (
        <PBox key={'f' + i} x0={x0 + 0.002} x1={x1 - 0.002} y0={y0 + 0.002} y1={y1 - 0.002} h0={PLY_B} h1={FL2} m={{color: '#cfae78', tex: 'lumber', rough: 0.85}} />
      ))}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 9, -13, 13], [4.5, 3.0, 1.2], 50],
  [45, [W + 9, -13, 13], [4.5, 3.0, 1.2], 50],
  [58, [W + 12.0, -12.0, 7.0], [W + 0.5, -1.5, 2.2], 50],
  [106, [W + 11.0, -11.0, 7.0], [W, -1.0, 2.2], 50],
  [118, [-4.5, -6.0, 4.5], [3.5, 2.5, 1.6], 50],
  [170, [-4.0, -5.5, 4.2], [4.5, 2.8, 1.6], 50],
  [182, [4.5, -10.0, 9.5], [4.5, 3.0, 2.4], 50],
  [236, [4.5, -9.5, 9.0], [4.5, 3.2, 2.4], 50],
  [248, [-3.5, -3.5, 7.0], [4.0, 3.0, 3.2], 50],
  [296, [-3.0, -3.0, 6.8], [4.5, 3.5, 3.2], 50],
  [308, [W + 6.5, D + 6.5, 6.0], [4.5, 3.0, 1.8], 50],
  [356, [W + 6.0, D + 6.0, 6.0], [4.5, 3.0, 1.8], 50],
  [368, [4.5, -6.5, 15.5], [4.5, 3.1, 2.8], 50],
  [426, [4.5, -6.5, 15.5], [4.5, 3.1, 2.8], 50],
  [438, [-4.6, -5.4, 3.0], [1.0, 1.0, 1.9], 50],
  [496, [-4.2, -5.0, 3.0], [1.0, 1.0, 2.0], 50],
  [512, [W + 9, -13, 13], [4.5, 3.0, 1.2], 50],
  [600, [W + 9.5, -13.5, 13.5], [4.5, 3.0, 1.2], 50],
]);

const STEPS: Step[] = [
  [45, 112, 'クレーン到着', '柱と梁を現場へ', false],
  [112, 178, '大工さん：柱を立てる', '番付どおりに1本ずつ', false],
  [178, 242, '大工さん：梁をかける', 'クレーンで吊って組む', false],
  [242, 302, '大工さん：2階の床梁', '2階の床を支える骨組み', false],
  [302, 362, '大工さん：仮筋交い', '倒れないように仮で留める', false],
  [362, 432, '大工さん：2階の床合板', '2階にも厚い板を張る', false],
  [432, 500, '現場監督：柱の垂直', 'まっすぐ立ってるか確かめる', true],
  [500, 600, '次は小屋組・上棟', '屋根の骨組みまで一気に', false],
];

export const Ep07: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const truckIn = ramp(f, 46, 100);
  const post = ramp(f, 118, 174);
  const beam = ramp(f, 182, 238);
  const joist = ramp(f, 248, 296);
  const brace = ramp(f, 308, 356);
  const ply = ramp(f, 370, 428);
  const plumb = ramp(f, 440, 452) * (1 - ramp(f, 494, 500));
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const tx = W + 2.5 + 8 * (1 - truckIn);

  // crane boom: swings out once parked, follows the piece being lifted
  const BASE: [number, number, number] = [tx + 1.0, -3.2, 2.2];
  let tip: [number, number] = [W - 1.0, 1.0];
  if (f >= 112 && f < 178) {
    const [x, y] = POSTS[Math.min(POSTS.length - 1, Math.floor(post * POSTS.length))];
    tip = [x, y];
  } else if (f >= 178 && f < 242) {
    const [x0, y0, x1, y1] = FDN_LINES[Math.min(FDN_LINES.length - 1, Math.floor(beam * FDN_LINES.length))];
    tip = [(x0 + x1) / 2, (y0 + y1) / 2];
  } else if (f >= 242) tip = [W / 2, D / 2];
  const boomOut = ramp(f, 100, 116) * (1 - ramp(f, 296, 310));
  const stow: [number, number, number] = [BASE[0] - 4.5, BASE[1], BASE[2] + 0.6];
  const tipP: [number, number, number] = [stow[0] + (tip[0] - stow[0]) * boomOut, stow[1] + (tip[1] - stow[1]) * boomOut, stow[2] + (FL2 + 3.2 - stow[2]) * boomOut];
  const hookZ = f >= 112 && f < 242 ? FL2 + 0.4 : FL2 + 2.2;

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 90 ? 'wave' : 'idle'};
  let b: Pp | null = null;
  if (f >= 112 && f < 178) {
    a = {x: tip[0] + 0.5, y: tip[1] - 0.4, h: FL1, yaw: 120, act: 'press'};
    b = {x: 4.0, y: 2.6, h: FL1, yaw: 270, act: 'point'};
  } else if (f >= 178 && f < 242) {
    a = {x: 0.4, y: 0.3, h: FL2 - 0.2, yaw: 0, act: 'hammer'};
    b = {x: W - 0.4, y: D - 0.3, h: FL2 - 0.2, yaw: 180, act: 'hammer'};
  } else if (f >= 242 && f < 302) {
    a = {x: 0.4 + (W - 0.8) * joist, y: 1.4, h: FL2 - 0.2, yaw: 0, act: 'hammer'};
    b = {x: 0.4 + (W - 0.8) * joist, y: 5.0, h: FL2 - 0.2, yaw: 0, act: 'hammer'};
  } else if (f >= 302 && f < 362) {
    a = {x: W - 1.0, y: D + 0.5, yaw: 180, act: 'hammer'};
    b = {x: W + 0.5, y: D - 1.2, yaw: 90, act: 'hammer'};
    kan = {x: W + 1.4, y: D + 1.2, yaw: 225, act: 'point'};
  } else if (f >= 362 && f < 432) {
    a = {x: 0.4 + (W - 0.8) * ply, y: 1.6, h: FL2, yaw: 0, act: 'hammer'};
    b = {x: 0.4 + (W - 0.8) * ply, y: 4.6, h: FL2, yaw: 0, act: 'hammer'};
  } else if (f >= 432 && f < 500) {
    kan = {x: 0.7, y: 0.9, h: FL1, yaw: 225, act: 'measure'};
    a = {x: 2.4, y: 1.6, h: FL1, yaw: 200, act: 'point'};
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
        <Frame3D s={{post, beam, joist, brace, ply}} />
        <group>
          <Truck3D x={tx} y={-3.2} />
          <PBox x0={tx + 0.6} x1={tx + 1.4} y0={-3.6} y1={-2.8} h0={1.3} h1={2.2} m={{color: '#f2c230', rough: 0.5}} />
          <Line3D a={BASE} b={tipP} w={0.22} color="#f2c230" />
          {boomOut > 0.5 ? <Line3D a={tipP} b={[tipP[0], tipP[1], hookZ]} w={0.02} color="#333333" /> : null}
          {f < 112 ? <PBox x0={tx - 4.0} x1={tx - 0.3} y0={-3.9} y1={-2.5} h0={0.8} h1={1.4} m={lumber} /> : null}
        </group>
        {/* 番付 check on the first post */}
        {f >= 150 && f < 178 ? <Ring3D p={[POSTS[0][0], POSTS[0][1], 1.6]} o={ramp(f, 150, 156)} f={f} r={0.3} vertical /> : null}
        {f >= 330 && f < 362 ? <Check3D p={[W / 2, -0.4, FL2 + 0.8]} o={ramp(f, 336, 342)} size={0.5} /> : null}
        {/* plumb line on the corner post */}
        {plumb > 0 ? (
          <group>
            <Line3D a={[0.16, 0.16, BEAM_B - 0.05]} b={[0.16, 0.16, FL1 + 0.15 + (BEAM_B - FL1 - 0.2) * (1 - plumb)]} w={0.008} color="#ff3030" emissive />
            <Line3D a={[1.2, 0.16, FL1 + 1.2]} b={[0.06, 0.16, FL1 + 1.2]} w={0.012} color="#ff3030" emissive />
            <Check3D p={[0.5, 0.0, BEAM_B + 0.6]} o={ramp(f, 476, 482)} size={0.5} />
          </group>
        ) : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={7}
        hook={['柱と梁が', '1日で立ち上がる']}
        title="上棟・柱と梁"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '柱は1本ずつ、番付どおりに立てるんや'],
          [440, 496, '柱が傾いとったら、ここで直すんや'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>骨組みが立った</span>
      </div>
    </AbsoluteFill>
  );
};
