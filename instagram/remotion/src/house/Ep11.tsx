import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FL1, FL2, M, W, WALLS} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, Truck3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';
import {Hardware3D} from './Ep10';

// 外まわりその1：サッシ・玄関ドア・防水テープ・バルコニーFRP防水・水張り試験
export type SashState = {sash1?: number; sash2?: number; tape?: number; mat?: number; top?: number; water?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
type Hole = {a: [number, number]; b: [number, number]; h0: number; h1: number; door: boolean};
const holes = (floor: 1 | 2): Hole[] => {
  const base = floor === 1 ? FL1 : FL2;
  const out: Hole[] = [];
  WALLS.filter((w) => w.ext && w.floor === floor).forEach((w) => {
    const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
    const ux = (w.x1 - w.x0) / L;
    const uy = (w.y1 - w.y0) / L;
    (w.open ?? []).forEach((o) => {
      out.push({a: [w.x0 + ux * o.s, w.y0 + uy * o.s], b: [w.x0 + ux * o.e, w.y0 + uy * o.e], h0: base + o.h0, h1: base + o.h1, door: o.kind === 'entry'});
    });
  });
  return out;
};
const H1 = holes(1);
const H2 = holes(2);
const frameM = {color: '#2f3236', metal: 0.5, rough: 0.4};
const glassM = {color: '#a9c7dc', opacity: 0.45, rough: 0.1, metal: 0.2};
const BAL = {x0: 7 * M, x1: W, y0: 0, y1: 3 * M};

// black flashing tape around the frame (a border, not a sheet)
const Tape: React.FC<{h: Hole}> = ({h}) => {
  const L = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]);
  const ux = (h.b[0] - h.a[0]) / L;
  const uy = (h.b[1] - h.a[1]) / L;
  const tm = {color: '#161616', rough: 0.9};
  const e = 0.08;
  const a0: [number, number] = [h.a[0] - ux * e, h.a[1] - uy * e];
  const b0: [number, number] = [h.b[0] + ux * e, h.b[1] + uy * e];
  return (
    <group>
      <Prism a={a0} b={b0} t={0.09} hb={h.h1} ht={h.h1 + e} m={tm} cast={false} />
      {h.door ? null : <Prism a={a0} b={b0} t={0.09} hb={h.h0 - e} ht={h.h0} m={tm} cast={false} />}
      <Prism a={a0} b={h.a} t={0.09} hb={h.h0 - e} ht={h.h1 + e} m={tm} cast={false} />
      <Prism a={h.b} b={b0} t={0.09} hb={h.h0 - e} ht={h.h1 + e} m={tm} cast={false} />
    </group>
  );
};

const Sash: React.FC<{h: Hole; k: number; tape: boolean}> = ({h, k, tape}) => {
  if (k <= 0) return null;
  const dz = (1 - k) * 0.6;
  return (
    <group>
      {tape ? <Tape h={h} /> : null}
      {h.door ? (
        <Prism a={h.a} b={h.b} t={0.06} hb={h.h0 + dz} ht={h.h1 + dz} m={{color: '#5b4330', tex: 'lumber', rough: 0.7}} />
      ) : (
        <group>
          <Prism a={h.a} b={h.b} t={0.07} hb={h.h0 + dz} ht={h.h0 + 0.05 + dz} m={frameM} />
          <Prism a={h.a} b={h.b} t={0.07} hb={h.h1 - 0.05 + dz} ht={h.h1 + dz} m={frameM} />
          <Prism a={h.a} b={h.b} t={0.012} hb={h.h0 + 0.05 + dz} ht={h.h1 - 0.05 + dz} m={glassM} cast={false} />
        </group>
      )}
    </group>
  );
};

export const Sash3D: React.FC<{s: SashState}> = ({s}) => {
  const tape = (s.tape ?? 0) > 0;
  const nT = (list: Hole[], off: number) => (i: number) => (s.tape ?? 0) * (H1.length + H2.length) > i + off;
  const t1 = nT(H1, 0);
  const t2 = nT(H2, H1.length);
  const mat = s.mat ?? 0;
  const top = s.top ?? 0;
  const water = s.water ?? 0;
  return (
    <group>
      {H1.map((h, i) => (
        <Sash key={'a' + i} h={h} k={clamp((s.sash1 ?? 0) * H1.length - i)} tape={tape && t1(i)} />
      ))}
      {H2.map((h, i) => (
        <Sash key={'b' + i} h={h} k={clamp((s.sash2 ?? 0) * H2.length - i)} tape={tape && t2(i)} />
      ))}
      {/* balcony: glass mat (pale) then grey top coat, with an upstand on the house side */}
      {mat > 0 ? <PBox x0={BAL.x0} x1={BAL.x0 + (BAL.x1 - BAL.x0) * mat} y0={BAL.y0} y1={BAL.y1} h0={FL2} h1={FL2 + 0.01} m={{color: '#cfd8c8', rough: 0.5}} cast={false} /> : null}
      {mat > 0.5 ? (
        <group>
          <PBox x0={BAL.x0 - 0.02} x1={BAL.x0} y0={BAL.y0} y1={BAL.y1} h0={FL2} h1={FL2 + 0.25} m={{color: '#cfd8c8', rough: 0.5}} cast={false} />
          <PBox x0={BAL.x0} x1={BAL.x1} y0={BAL.y1} y1={BAL.y1 + 0.02} h0={FL2} h1={FL2 + 0.25} m={{color: '#cfd8c8', rough: 0.5}} cast={false} />
        </group>
      ) : null}
      {top > 0 ? <PBox x0={BAL.x0} x1={BAL.x0 + (BAL.x1 - BAL.x0) * top} y0={BAL.y0} y1={BAL.y1} h0={FL2 + 0.01} h1={FL2 + 0.016} m={{color: '#8e959b', rough: 0.35}} cast={false} /> : null}
      {water > 0 ? <PBox x0={BAL.x0 + 0.02} x1={BAL.x1 - 0.02} y0={BAL.y0 + 0.02} y1={BAL.y1 - 0.02} h0={FL2 + 0.016} h1={FL2 + 0.016 + 0.05 * water} m={{color: '#5aa7d8', opacity: 0.55, rough: 0.05, metal: 0.1}} cast={false} /> : null}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [45, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [58, [W + 12.0, -12.0, 7.0], [W + 1.0, -2.0, 1.5], 50],
  [106, [W + 11.0, -11.0, 7.0], [W, -1.5, 1.5], 50],
  [118, [3.0, 4.0, 1.7], [3.0, 0, 1.5], 50],
  [170, [4.2, 4.0, 1.7], [4.0, 0, 1.5], 50],
  [182, [2.0, 2.4, FL2 + 1.6], [2.0, 0, FL2 + 1.3], 50],
  [236, [3.6, 2.4, FL2 + 1.6], [3.8, 0, FL2 + 1.3], 50],
  [248, [1.6, 1.9, FL2 + 1.5], [1.8, 0, FL2 + 1.4], 50],
  [296, [2.2, 1.9, FL2 + 1.5], [2.0, 0, FL2 + 1.4], 50],
  [308, [W - 0.5, 4.8, FL2 + 2.6], [W - 1.6, 1.2, FL2], 50],
  [356, [W - 0.7, 4.8, FL2 + 2.6], [W - 1.6, 1.2, FL2], 50],
  [368, [W - 0.5, 4.8, FL2 + 2.6], [W - 1.6, 1.2, FL2], 50],
  [426, [W - 0.7, 4.8, FL2 + 2.6], [W - 1.6, 1.2, FL2], 50],
  [438, [W - 0.5, 4.6, FL2 + 2.3], [W - 1.6, 1.2, FL2 + 0.2], 50],
  [496, [W - 0.7, 4.6, FL2 + 2.3], [W - 1.6, 1.2, FL2 + 0.2], 50],
  [512, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [45, 112, 'サッシ屋さん：サッシの搬入', '窓と玄関ドアが届く', false],
  [112, 178, '大工さん：1階のサッシ', '水平と垂直を見て取り付け', false],
  [178, 242, '大工さん：2階のサッシ', '玄関ドアもここで付く', false],
  [242, 302, '大工さん：防水テープ', 'サッシのまわりを先にふさぐ', false],
  [302, 362, '防水屋さん：FRP防水', 'ガラスマットを樹脂で固める', true],
  [362, 432, '防水屋さん：トップコート', '紫外線から防水層を守る', true],
  [432, 500, '現場監督：水張り試験', '水をためて漏れないか見る', true],
  [500, 600, '次は外壁', '防水シート・胴縁・外壁・雨どい', false],
];

export const Ep11: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const truckIn = ramp(f, 46, 96);
  const sash1 = ramp(f, 118, 174);
  const sash2 = ramp(f, 182, 238);
  const tape = ramp(f, 248, 296);
  const mat = ramp(f, 308, 356);
  const top = ramp(f, 370, 426);
  const water = ramp(f, 440, 456);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const tx = W + 2.5 + 8 * (1 - truckIn);

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 90 ? 'wave' : 'idle'};
  let b: Pp | null = null;
  if (f >= 112 && f < 178) {
    a = {x: 1.0 + 5 * sash1, y: -0.5, yaw: 90, act: 'press'};
    b = null;
  } else if (f >= 178 && f < 242) {
    a = {x: 1.0 + 4 * sash2, y: -0.9, h: 3.6, yaw: 90, act: 'press'};
    b = null;
  } else if (f >= 242 && f < 302) {
    a = {x: 1.0 + 1.8 * tape, y: -0.9, h: 3.6, yaw: 90, act: 'press'};
    b = null;
  } else if (f >= 302 && f < 432) {
    const k = f < 362 ? mat : top;
    a = {x: BAL.x0 + 0.4 + (BAL.x1 - BAL.x0 - 0.8) * k, y: 1.4, h: FL2 + 0.02, yaw: 0, act: 'press'};
    b = null;
  } else if (f >= 432 && f < 500) {
    kan = {x: BAL.x0 + 0.6, y: 0.8, h: FL2 + 0.02, yaw: 45, act: 'point'};
    a = null;
  } else if (f >= 500) {
    kan = {x: 3.8, y: -2.0, yaw: 270, act: f > 512 ? 'wave' : 'idle'};
    a = {x: 5.4, y: -2.0, yaw: 270, act: f > 516 ? 'wave' : 'idle'};
  }

  return (
    <AbsoluteFill>
      <Scene3D cam={c} noSite>
        <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
        <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
        <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab: 1, innerForm: 1, wallConc: 1, strip: 1}} />
        <Floor3D s={{sill: 1, obiki: 1, pipe: 1, ins: 1, ply: 1}} />
        <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 0, ply: 1}} />
        <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
        <Roof3D s={{scaf: 1, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
        <Hardware3D s={{brace: 1, plate: 1, hd: 1, bolt: 1}} />
        <Sash3D s={{sash1, sash2, tape, mat, top, water}} />
        {f < 112 ? (
          <group>
            <Truck3D x={tx} y={-3.2} />
            <PBox x0={tx - 4.0} x1={tx - 0.4} y0={-3.9} y1={-2.5} h0={0.8} h1={1.6} m={{color: '#c9b48e', rough: 0.9}} />
          </group>
        ) : null}
        {f >= 150 && f < 178 ? <Ring3D p={[H1[0].a[0] + 0.9, -0.05, FL1 + 1.1]} o={ramp(f, 150, 156)} f={f} r={0.5} vertical /> : null}
        {f >= 270 && f < 302 ? <Check3D p={[1.8, -0.4, FL2 + 1.9]} o={ramp(f, 276, 282)} size={0.4} /> : null}
        {f >= 470 && f < 500 ? <Check3D p={[BAL.x0 + 1.3, 1.4, FL2 + 1.0]} o={ramp(f, 476, 482)} size={0.5} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={11}
        hook={['ベランダの防水', '見たことありますか？']}
        title="サッシ・バルコニー防水"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, 'サッシは水平と垂直を見てから留めるんや'],
          [440, 496, '水をためて、漏れへんか確かめるんや'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>窓とベランダ完了</span>
      </div>
    </AbsoluteFill>
  );
};
