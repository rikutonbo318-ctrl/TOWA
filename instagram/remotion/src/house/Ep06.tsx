import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_LINES, FDN_TOP, M, SILL, W} from './House';
import {PBox} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, linesUpTo, Truck3D} from './Fdn3D';
import {Rebar3D, SLAB_TOP} from './Rebar3D';

// 土台・大引・鋼製束・床下配管・床断熱・床合板
type FloorState = {sill?: number; obiki?: number; pipe?: number; ins?: number; ply?: number};
const PACK = 0.02; // 基礎パッキン
const SILL_B = FDN_TOP + PACK;
const SILL_T = SILL_B + SILL;
const lumber = {color: '#d9b77e', tex: 'lumber' as const, rough: 0.8};
const OBIKI_Y = [1, 2, 3, 4, 6].map((i) => i * M);
const PIPES: [number, number, number, number][] = [
  [1.2, 4.2, 1.2, -0.4],
  [3.2, 4.0, 3.2, -0.4],
  [7.6, 3.5, W + 0.4, 3.5],
  [5.4, 5.6, W + 0.4, 5.6],
];

const Floor3D: React.FC<{s: FloorState}> = ({s}) => {
  const sl = linesUpTo(s.sill ?? 0);
  const ob = s.obiki ?? 0;
  const pipe = s.pipe ?? 0;
  const ins = s.ins ?? 0;
  const ply = s.ply ?? 0;
  const t = SILL / 2;
  // floor panels on the 910 grid, laid south → north, west → east
  const panels: [number, number, number, number][] = [];
  for (let y = 0; y < D - 0.01; y += M) for (let x = 0; x < W - 0.01; x += 2 * M) panels.push([x, Math.min(W, x + 2 * M), y, Math.min(D, y + M)]);
  const nPly = Math.round(panels.length * ply);
  return (
    <group>
      {/* pipes on the slab, out through the foundation */}
      {PIPES.map(([x0, y0, x1, y1], i) => {
        const k = Math.max(0, Math.min(1, pipe * PIPES.length - i));
        if (k <= 0) return null;
        return <Line3D key={'p' + i} a={[x0, y0, SLAB_TOP + 0.06]} b={[x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, SLAB_TOP + 0.06]} w={0.05} color="#9aa3a8" />;
      })}
      {/* sills with packing */}
      {FDN_LINES.map(([x0, y0, x1, y1], i) => {
        const k = sl[i];
        if (k <= 0) return null;
        const ex = x0 + (x1 - x0) * k;
        const ey = y0 + (y1 - y0) * k;
        const bx0 = Math.min(x0, ex) - t;
        const bx1 = Math.max(x0, ex) + t;
        const by0 = Math.min(y0, ey) - t;
        const by1 = Math.max(y0, ey) + t;
        return (
          <group key={'s' + i}>
            <PBox x0={bx0} x1={bx1} y0={by0} y1={by1} h0={FDN_TOP} h1={SILL_B} m={{color: '#222222', rough: 0.9}} />
            <PBox x0={bx0} x1={bx1} y0={by0} y1={by1} h0={SILL_B} h1={SILL_T} m={lumber} />
          </group>
        );
      })}
      {/* girders on steel posts, 910 apart */}
      {OBIKI_Y.map((y, i) => {
        const k = Math.max(0, Math.min(1, ob * OBIKI_Y.length - i));
        if (k <= 0) return null;
        return (
          <group key={'o' + i}>
            <PBox x0={0.05} x1={0.05 + (W - 0.1) * k} y0={y - 0.045} y1={y + 0.045} h0={SILL_T - 0.09} h1={SILL_T} m={lumber} />
            {Array.from({length: 9}).map((_, j) => {
              const x = (j + 1) * M;
              if (x > 0.05 + (W - 0.1) * k) return null;
              return <PBox key={j} x0={x - 0.02} x1={x + 0.02} y0={y - 0.02} y1={y + 0.02} h0={SLAB_TOP} h1={SILL_T - 0.09} m={{color: '#c3c7ca', rough: 0.4}} />;
            })}
          </group>
        );
      })}
      {/* insulation boards between the girders */}
      {ins > 0 ? <PBox x0={0.06} x1={0.06 + (W - 0.12) * ins} y0={0.06} y1={D - 0.06} h0={SILL_T - 0.07} h1={SILL_T - 0.002} m={{color: '#7fb4d8', rough: 0.9}} cast={false} /> : null}
      {/* 24mm floor plywood */}
      {panels.slice(0, nPly).map(([x0, x1, y0, y1], i) => (
        <PBox key={'f' + i} x0={x0 + 0.002} x1={x1 - 0.002} y0={y0 + 0.002} y1={y1 - 0.002} h0={SILL_T} h1={SILL_T + 0.024} m={{color: '#cfae78', tex: 'lumber', rough: 0.85}} />
      ))}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [45, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [58, [W + 11.0, -11.0, 5.5], [W + 1.0, -2.5, 0.8], 50],
  [106, [W + 10.0, -10.0, 5.5], [W, -2.0, 0.8], 50],
  [118, [-3.0, -4.5, 3.6], [3.5, 2.0, 0], 50],
  [170, [-2.5, -4.0, 3.4], [4.5, 2.5, 0], 50],
  [182, [4.5, -7.0, 8.0], [4.5, 3.0, -0.3], 50],
  [236, [4.5, -6.5, 7.5], [4.5, 3.2, -0.3], 50],
  [248, [-2.5, 1.0, 2.6], [3.0, 3.5, 0], 50],
  [296, [-2.0, 1.5, 2.6], [4.0, 4.0, 0], 50],
  [308, [W + 3.5, D + 3.0, 4.0], [5.0, 3.0, 0], 50],
  [356, [W + 3.0, D + 2.5, 4.0], [4.5, 3.0, 0], 50],
  [368, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [426, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [438, [-3.0, -4.5, 3.4], [3.5, 2.5, 0.5], 50],
  [496, [-2.5, -4.0, 3.2], [4.0, 2.8, 0.5], 50],
  [512, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [600, [W + 8.5, -12.5, 12.5], [4.5, 3.0, -0.3], 50],
]);

const STEPS: Step[] = [
  [45, 112, '大工さん：材料の搬入', '工場で刻んだ木材が届く', false],
  [112, 178, '大工さん：土台敷き', 'パッキンをはさんで、ボルトで締める', false],
  [178, 242, '大工さん：大引・鋼製束', '床を下から支える骨組み', false],
  [242, 302, '設備屋さん：床下の配管', 'ふさぐ前に水道・排水の管を通す', true],
  [302, 362, '大工さん：床の断熱材', '大引のあいだに断熱材をはめる', false],
  [362, 432, '大工さん：床合板', '24mmの厚い板を全面に張る', false],
  [432, 500, '現場監督：床の水平', 'レーザーで床の高さを確かめる', true],
  [500, 600, '次は上棟', '柱と梁が一気に立ち上がる', false],
];

export const Ep06: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const truckIn = ramp(f, 46, 100);
  const sill = ramp(f, 118, 174);
  const obiki = ramp(f, 182, 238);
  const pipe = ramp(f, 248, 296);
  const ins = ramp(f, 308, 356);
  const ply = ramp(f, 370, 428);
  const laser = ramp(f, 440, 452) * (1 - ramp(f, 494, 500));
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const tx = W + 2.5 + 8 * (1 - truckIn);
  const top = SILL_T + 0.024;

  type P = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: P = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: P | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 90 ? 'wave' : 'idle'};
  let b: P | null = null;
  if (f >= 112 && f < 178) {
    a = {x: 0.3 + (W - 0.6) * sill, y: -0.5, yaw: 0, act: 'hammer'};
    b = {x: -0.5, y: 0.3 + (D - 0.6) * sill, yaw: 90, act: 'hammer'};
  } else if (f >= 178 && f < 242) {
    a = {x: 0.4 + (W - 0.8) * obiki, y: 2.2, h: SLAB_TOP, yaw: 0, act: 'press'};
    b = {x: 0.4 + (W - 0.8) * obiki, y: 4.8, h: SLAB_TOP, yaw: 0, act: 'hammer'};
  } else if (f >= 242 && f < 302) {
    a = {x: 3.6, y: 4.6, h: SLAB_TOP, yaw: 0, act: 'press'};
    b = null;
    kan = {x: -0.8, y: 5.6, yaw: 330, act: 'point'};
  } else if (f >= 302 && f < 432) {
    const k = f < 362 ? ins : ply;
    a = {x: 0.4 + (W - 0.8) * k, y: 1.6, h: top, yaw: 0, act: f < 362 ? 'press' : 'hammer'};
    b = {x: 0.4 + (W - 0.8) * k, y: 4.6, h: top, yaw: 0, act: 'hammer'};
  } else if (f >= 432 && f < 500) {
    kan = {x: 2.0, y: 2.0, h: top, yaw: 30, act: 'measure'};
    a = {x: 6.5, y: 3.6, h: top, yaw: 200, act: 'point'};
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
        <Floor3D s={{sill, obiki, pipe, ins, ply}} />
        <group>
          <Truck3D x={tx} y={-3.2} />
          {f < 112 ? <PBox x0={tx - 4.0} x1={tx - 0.3} y0={-3.9} y1={-2.5} h0={0.8} h1={1.3} m={lumber} /> : null}
        </group>
        {/* sill bolt check */}
        {f >= 150 && f < 178 ? <Ring3D p={[1.6, 0, SILL_T + 0.01]} o={ramp(f, 150, 156)} f={f} r={0.18} /> : null}
        {f >= 270 && f < 302 ? <Check3D p={[3.2, 2.0, SILL_T + 0.5]} o={ramp(f, 276, 282)} size={0.45} /> : null}
        {/* laser level */}
        {laser > 0 ? (
          <group>
            {[[0.4, 0.4], [W - 0.4, 0.4], [W - 0.4, D - 0.4], [0.4, D - 0.4]].map(([x, y], i) => (
              <Line3D key={i} a={[2.0, 2.0, top + 1.0]} b={[x, y, top + 1.0]} w={0.012} color="#ff3030" emissive />
            ))}
            <Check3D p={[4.5, 3.2, top + 1.6]} o={ramp(f, 476, 482)} size={0.5} />
          </group>
        ) : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={6}
        hook={['ここから先は', '大工さんの出番']}
        title="土台敷き・床"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '土台は、基礎にボルトで締めるんや'],
          [440, 496, '床が平らやないと、家ぜんぶ狂うで'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>床ができた</span>
      </div>
    </AbsoluteFill>
  );
};
