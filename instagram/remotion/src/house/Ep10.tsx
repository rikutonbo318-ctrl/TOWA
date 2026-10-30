import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FL1, FL2, M, roofH, W} from './House';
import {PBox} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D, lumber} from './Ep06';
import {BEAM_B, Frame3D, POSTS} from './Ep07';
import {RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';

// 構造金物・中間検査：本筋交い・筋交い金物・ホールダウン・羽子板ボルト・検査
export type HardwareState = {brace?: number; plate?: number; hd?: number; bolt?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const metalM = {color: '#3a3d40', metal: 0.6, rough: 0.4};
const PLATE_H = 0.24;
// braced bays on the outer walls: [x0, y0, x1, y1, floor]
const BAYS: [number, number, number, number, 1 | 2][] = [];
([1, 2] as const).forEach((fl) => {
  BAYS.push([0, 0, 2 * M, 0, fl], [W - 2 * M, 0, W, 0, fl], [0, D, 2 * M, D, fl], [W - 2 * M, D, W, D, fl]);
  BAYS.push([0, 0, 0, 2 * M, fl], [W, 0, W, 2 * M, fl], [0, D - 2 * M, 0, D, fl], [W, D - 2 * M, W, D, fl]);
});
const bayH = ([x0, y0, x1, y1, fl]: (typeof BAYS)[number]): [number, number] => {
  if (fl === 1) return [FL1 + 0.05, BEAM_B - 0.02];
  return [FL2 + 0.02, roofH((y0 + y1) / 2) - PLATE_H - 0.02];
};
const CORNERS: [number, number][] = [
  [0, 0],
  [W, 0],
  [W, D],
  [0, D],
];
const BOLTS = POSTS.filter(([x, y]) => x < 0.05 || x > W - 0.05 || y < 0.05 || y > D - 0.05);

export const Hardware3D: React.FC<{s: HardwareState}> = ({s}) => {
  const nB = Math.round(BAYS.length * (s.brace ?? 0));
  const nP = Math.round(BAYS.length * (s.plate ?? 0));
  const nH = Math.round(CORNERS.length * 2 * (s.hd ?? 0));
  const nK = Math.round(BOLTS.length * (s.bolt ?? 0));
  return (
    <group>
      {BAYS.slice(0, nB).map((b, i) => {
        const [x0, y0, x1, y1] = b;
        const [h0, h1] = bayH(b);
        return (
          <group key={'b' + i}>
            <Line3D a={[x0, y0, h0]} b={[x1, y1, h1]} w={0.09} color="#d9b77e" />
            <Line3D a={[x1, y1, h0]} b={[x0, y0, h1]} w={0.09} color="#d9b77e" />
          </group>
        );
      })}
      {BAYS.slice(0, nP).map((b, i) => {
        const [x0, y0, x1, y1] = b;
        const [h0, h1] = bayH(b);
        return (
          <group key={'p' + i}>
            {(
              [
                [x0, y0, h0],
                [x1, y1, h0],
                [x0, y0, h1],
                [x1, y1, h1],
              ] as const
            ).map(([x, y, h], k) => (
              <PBox key={k} x0={x - 0.07} x1={x + 0.07} y0={y - 0.07} y1={y + 0.07} h0={h - 0.08} h1={h + 0.08} m={metalM} />
            ))}
          </group>
        );
      })}
      {CORNERS.flatMap(([x, y]) => [
        [x, y, FL1],
        [x, y, FL2],
      ])
        .slice(0, nH)
        .map(([x, y, h], i) => (
          <PBox key={'h' + i} x0={x - 0.075} x1={x + 0.075} y0={y - 0.075} y1={y + 0.075} h0={h - 0.15} h1={h + 0.45} m={{...metalM, color: '#55595e'}} />
        ))}
      {BOLTS.slice(0, nK).map(([x, y], i) => (
        <PBox key={'k' + i} x0={x - 0.065} x1={x + 0.065} y0={y - 0.065} y1={y + 0.065} h0={BEAM_B - 0.14} h1={BEAM_B + 0.02} m={metalM} />
      ))}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [45, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [58, [6.5, 3.5, 2.1], [0.5, 1.0, 1.9], 50],
  [106, [6.0, 3.0, 2.1], [0.5, 0.6, 1.9], 50],
  [118, [1.8, 2.4, 1.4], [0.0, 0.0, 1.1], 50],
  [170, [1.7, 2.2, 1.4], [0.0, 0.0, 1.1], 50],
  [182, [1.5, 2.0, 1.1], [0.0, 0.0, 0.8], 50],
  [236, [1.4, 1.8, 1.1], [0.0, 0.0, 0.8], 50],
  [248, [3.0, 2.0, 2.6], [0.5, 0.5, 3.1], 50],
  [296, [2.6, 1.8, 2.6], [0.3, 0.3, 3.1], 50],
  [308, [6.0, 3.5, 2.2], [1.5, 1.0, 1.8], 50],
  [356, [5.5, 3.0, 2.2], [1.0, 0.8, 1.8], 50],
  [368, [5.5, 4.5, 2.0], [2.0, 1.5, 1.5], 50],
  [426, [5.0, 4.2, 2.0], [1.5, 1.2, 1.5], 50],
  [438, [3.0, 2.4, 1.8], [0.4, 0.5, 1.4], 50],
  [496, [2.8, 2.2, 1.8], [0.3, 0.4, 1.4], 50],
  [512, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [45, 112, '大工さん：本筋交いを入れる', '地震の横揺れに耐える壁にする', false],
  [112, 178, '大工さん：筋交い金物', '筋交いの両端を金物で留める', false],
  [178, 242, '大工さん：ホールダウン金物', '柱が基礎から抜けないように', false],
  [242, 302, '大工さん：羽子板ボルト', '梁と柱をボルトで引きつける', false],
  [302, 362, '現場監督：自主検査', '金物の数と向きを全部見る', true],
  [362, 432, '検査員さん：中間検査', '第三者が図面どおりか確かめる', true],
  [432, 500, '現場監督：記録写真', '壁でふさぐ前に写真で残す', true],
  [500, 600, '次は外まわり', 'サッシとバルコニーの防水', false],
];

export const Ep10: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const brace = ramp(f, 48, 106);
  const plate = ramp(f, 118, 174);
  const hd = ramp(f, 182, 238);
  const bolt = ramp(f, 248, 296);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const flash = f >= 440 && f < 500 && (f - 440) % 20 < 3;

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: 6.5, y: 1.0, h: FL1, yaw: 220, act: 'idle'};
  let a: Pp | null = {x: 1.0 + 6 * brace, y: 0.5, h: FL1, yaw: 270, act: 'hammer'};
  let b: Pp | null = null;
  let insp: Pp | null = null;
  if (f >= 112 && f < 178) {
    a = {x: 1.6, y: 0.35, h: FL1, yaw: 270, act: 'hammer'};
  } else if (f >= 178 && f < 242) {
    a = {x: 1.6, y: 0.35, h: FL1, yaw: 270, act: 'press'};
  } else if (f >= 242 && f < 302) {
    a = {x: 0.7, y: 0.6, h: FL2, yaw: 225, act: 'hammer'};
    kan = {x: 6.5, y: 1.0, h: FL1, yaw: 220, act: 'idle'};
  } else if (f >= 302 && f < 362) {
    kan = {x: 1.0, y: 0.9, h: FL1, yaw: 225, act: 'point'};
    a = {x: 2.2, y: 1.2, h: FL1, yaw: 200, act: 'idle'};
  } else if (f >= 362 && f < 432) {
    insp = {x: 1.1, y: 0.8, h: FL1, yaw: 225, act: 'measure'};
    kan = {x: 2.2, y: 1.4, h: FL1, yaw: 210, act: 'idle'};
    a = null;
  } else if (f >= 432 && f < 500) {
    kan = {x: 0.6, y: 1.7, h: FL1, yaw: 300, act: 'point'};
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
        <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 1 - brace, ply: 1}} />
        <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
        <Roof3D s={{scaf: 1, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
        <Hardware3D s={{brace, plate, hd, bolt}} />
        {f < 112 ? <PBox x0={4.0} x1={6.0} y0={2.0} y1={2.3} h0={FL1} h1={FL1 + 0.2} m={lumber} /> : null}
        {f >= 150 && f < 178 ? <Ring3D p={[0, 0.05, FL1 + 0.05]} o={ramp(f, 150, 156)} f={f} r={0.2} vertical /> : null}
        {f >= 210 && f < 242 ? <Ring3D p={[0, 0.05, FL1 + 0.15]} o={ramp(f, 210, 216)} f={f} r={0.3} vertical /> : null}
        {f >= 270 && f < 302 ? <Ring3D p={[POSTS[0][0], POSTS[0][1] + 0.05, BEAM_B - 0.06]} o={ramp(f, 270, 276)} f={f} r={0.22} vertical /> : null}
        {f >= 330 && f < 362 ? <Check3D p={[0.4, 0.4, FL1 + 1.6]} o={ramp(f, 336, 342)} size={0.35} /> : null}
        {f >= 400 && f < 432 ? <Check3D p={[0.6, 0.6, FL1 + 1.9]} o={ramp(f, 406, 412)} size={0.4} /> : null}
        {flash ? <pointLight position={[1.0, FL1 + 1.6, -1.0]} intensity={6} distance={4} color="#ffffff" /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
        {insp ? <Person3D x={insp.x} y={insp.y} h={insp.h ?? 0} yaw={insp.yaw} act={insp.act} f={f} phase={4} suit="#2d3a4a" vest="#2d3a4a" helmet="#ffffff" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={10}
        hook={['柱の金物', '数えたことありますか？']}
        title="構造金物・中間検査"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '筋交いの向き、図面どおりか見とくんや'],
          [440, 496, '壁でふさいだら、もう見られへんからな'],
        ]}
      />
      {flash ? <div style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.35)'}} /> : null}
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>中間検査 合格</span>
      </div>
    </AbsoluteFill>
  );
};
