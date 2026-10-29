import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, M, roofH, W} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D, Truck3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {EAVE, rafT, RoofFrame3D} from './Ep08';

// 屋根：足場・ルーフィング・唐草・ガルバリウム立平・ケラバ/棟の板金・軒天
export type RoofState = {scaf?: number; felt?: number; drip?: number; metal?: number; edge?: number; soffit?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const X0 = -0.3;
const X1 = W + 0.3;
const Y0 = -EAVE; // high side (south)
const Y1 = D + EAVE; // low side (north)
const S = (y: number) => rafT(y) + 0.057; // top of the roof boards
const steel = {color: '#3b4046', metal: 0.55, rough: 0.45};

// scaffold posts around the house, 0.9m out, every 1.8m
const SCAF: [number, number][] = [];
for (let x = -0.9; x <= W + 0.95; x += 1.82) {
  SCAF.push([x, -0.9]);
  SCAF.push([x, D + 0.9]);
}
for (let y = 0.92; y < D + 0.9 - 0.3; y += 1.82) {
  SCAF.push([-0.9, y]);
  SCAF.push([W + 0.9, y]);
}
const scafTop = (y: number) => roofH(Math.max(0, Math.min(D, y))) + 0.9;
const FELT_ROWS = 8;
const RIB_X: number[] = [];
for (let x = X0; x <= X1 + 0.01; x += 0.455) RIB_X.push(x);

export const Roof3D: React.FC<{s: RoofState}> = ({s}) => {
  const scaf = s.scaf ?? 0;
  const felt = s.felt ?? 0;
  const metal = s.metal ?? 0;
  const edge = s.edge ?? 0;
  const soffit = s.soffit ?? 0;
  const len = Y1 - Y0;
  return (
    <group>
      {/* scaffold */}
      {scaf > 0
        ? SCAF.map(([x, y], i) => {
            const k = clamp(scaf * SCAF.length * 0.5 - i * 0.5 + 0.5);
            if (k <= 0) return null;
            const top = scafTop(y) * k;
            return (
              <group key={'s' + i}>
                <Line3D a={[x, y, 0]} b={[x, y, top]} w={0.05} color="#9aa0a6" />
              </group>
            );
          })
        : null}
      {scaf >= 1
        ? [1.8, 3.6, 5.4].map((h) => (
            <group key={'rail' + h}>
              <PBox x0={-1.1} x1={W + 1.1} y0={-1.1} y1={-0.7} h0={h - 0.04} h1={h} m={{color: '#7d8a96', metal: 0.4, rough: 0.5}} cast={false} />
              <PBox x0={-1.1} x1={W + 1.1} y0={D + 0.7} y1={D + 1.1} h0={h - 0.04} h1={h} m={{color: '#7d8a96', metal: 0.4, rough: 0.5}} cast={false} />
              <PBox x0={-1.1} x1={-0.7} y0={-0.7} y1={D + 0.7} h0={h - 0.04} h1={h} m={{color: '#7d8a96', metal: 0.4, rough: 0.5}} cast={false} />
              <PBox x0={W + 0.7} x1={W + 1.1} y0={-0.7} y1={D + 0.7} h0={h - 0.04} h1={h} m={{color: '#7d8a96', metal: 0.4, rough: 0.5}} cast={false} />
              <Line3D a={[-0.9, -0.9, h + 0.9]} b={[W + 0.9, -0.9, h + 0.9]} w={0.04} color="#9aa0a6" />
              <Line3D a={[-0.9, D + 0.9, h + 0.9]} b={[W + 0.9, D + 0.9, h + 0.9]} w={0.04} color="#9aa0a6" />
              <Line3D a={[-0.9, -0.9, h + 0.9]} b={[-0.9, D + 0.9, h + 0.9]} w={0.04} color="#9aa0a6" />
              <Line3D a={[W + 0.9, -0.9, h + 0.9]} b={[W + 0.9, D + 0.9, h + 0.9]} w={0.04} color="#9aa0a6" />
            </group>
          ))
        : null}
      {/* underlayment, laid from the low eave up so each row laps over the one below */}
      {Array.from({length: FELT_ROWS}).map((_, j) => {
        const k = clamp(felt * FELT_ROWS - j);
        if (k <= 0) return null;
        const yl = Y1 - (len / FELT_ROWS) * j;
        const yh = yl - (len / FELT_ROWS) * k - 0.08;
        return <Prism key={'f' + j} a={[W / 2, Math.max(Y0, yh)]} b={[W / 2, yl]} t={X1 - X0} hb={[S(Math.max(Y0, yh)), S(yl)]} ht={[S(Math.max(Y0, yh)) + 0.004 + j * 0.0002, S(yl) + 0.004 + j * 0.0002]} m={{color: '#2b2e33', rough: 0.95}} cast={false} />;
      })}
      {/* drip edge along the low eave */}
      {(s.drip ?? 0) > 0 ? <Prism a={[X0, Y1]} b={[X0 + (X1 - X0) * (s.drip ?? 0), Y1]} t={0.05} hb={S(Y1) - 0.06} ht={S(Y1) + 0.01} m={steel} /> : null}
      {/* standing-seam steel, sheets run down the slope, laid west → east */}
      {RIB_X.slice(0, -1).map((x, i) => {
        const k = clamp(metal * (RIB_X.length - 1) - i);
        if (k <= 0) return null;
        const dz = (1 - k) * 0.8;
        return (
          <group key={'m' + i}>
            <Prism a={[x + 0.2275, Y0]} b={[x + 0.2275, Y1]} t={0.451} hb={[S(Y0) + 0.006 + dz, S(Y1) + 0.006 + dz]} ht={[S(Y0) + 0.012 + dz, S(Y1) + 0.012 + dz]} m={steel} />
            <Prism a={[x + 0.455, Y0]} b={[x + 0.455, Y1]} t={0.018} hb={[S(Y0) + 0.012 + dz, S(Y1) + 0.012 + dz]} ht={[S(Y0) + 0.04 + dz, S(Y1) + 0.04 + dz]} m={steel} />
          </group>
        );
      })}
      {/* verge and ridge flashing */}
      {edge > 0 ? (
        <group>
          <Prism a={[X0, Y0]} b={[X0, Y0 + len * Math.min(1, edge * 1.5)]} t={0.06} hb={[S(Y0) - 0.18, S(Y0 + len * Math.min(1, edge * 1.5)) - 0.18]} ht={[S(Y0) + 0.05, S(Y0 + len * Math.min(1, edge * 1.5)) + 0.05]} m={steel} />
          <Prism a={[X1, Y0]} b={[X1, Y0 + len * Math.min(1, edge * 1.5)]} t={0.06} hb={[S(Y0) - 0.18, S(Y0 + len * Math.min(1, edge * 1.5)) - 0.18]} ht={[S(Y0) + 0.05, S(Y0 + len * Math.min(1, edge * 1.5)) + 0.05]} m={steel} />
          {edge > 0.6 ? <Prism a={[X0, Y0]} b={[X0 + (X1 - X0) * clamp((edge - 0.6) / 0.4), Y0]} t={0.08} hb={S(Y0) - 0.2} ht={S(Y0) + 0.06} m={steel} /> : null}
        </group>
      ) : null}
      {/* soffit boards under the eaves */}
      {soffit > 0 ? (
        <group>
          <PBox x0={X0} x1={X0 + (X1 - X0) * soffit} y0={Y0} y1={0} h0={roofH(-0.3) - 0.03} h1={roofH(-0.3) - 0.01} m={{color: '#e9e4da', rough: 0.8}} />
          <PBox x0={X0} x1={X0 + (X1 - X0) * soffit} y0={D} y1={Y1} h0={roofH(D + 0.3) - 0.03} h1={roofH(D + 0.3) - 0.01} m={{color: '#e9e4da', rough: 0.8}} />
        </group>
      ) : null}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [45, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [58, [W + 12.0, -12.0, 9.0], [4.5, 2.0, 4.0], 50],
  [106, [W + 11.5, -11.5, 9.0], [4.5, 2.5, 4.0], 50],
  [118, [4.5, D + 10.0, 15.0], [4.5, 3.0, 6.3], 50],
  [170, [4.0, D + 9.5, 15.0], [4.5, 3.0, 6.3], 50],
  [182, [W + 6.0, D + 9.0, 10.0], [5.5, D + 0.5, 6.0], 50],
  [236, [W + 5.5, D + 8.5, 10.0], [4.5, D + 0.5, 6.0], 50],
  [248, [4.5, D + 9.5, 16.0], [4.5, 3.0, 6.5], 50],
  [296, [5.0, D + 9.0, 16.0], [4.5, 3.0, 6.5], 50],
  [308, [W + 6.5, 3.0, 10.5], [W, 3.0, 6.8], 50],
  [356, [W + 6.0, 4.0, 10.5], [W, 3.0, 6.8], 50],
  [368, [W + 3.5, D + 3.2, 3.8], [W - 1.5, D + 0.3, 5.9], 50],
  [426, [W + 3.0, D + 3.4, 3.8], [W - 3.0, D + 0.3, 5.9], 50],
  [438, [-3.0, D + 4.0, 10.5], [1.5, 4.5, 6.8], 50],
  [496, [-2.6, D + 3.6, 10.3], [1.5, 4.5, 6.8], 50],
  [512, [W + 9, D + 12, 16], [4.5, 3.0, 4.0], 50],
  [600, [W + 9.5, D + 12.5, 16.5], [4.5, 3.0, 4.0], 50],
]);

const STEPS: Step[] = [
  [45, 112, '鳶さん：足場を組む', '屋根の上で安全に作業するため', false],
  [112, 178, '板金屋さん：ルーフィング', '屋根の本当の防水シート', true],
  [178, 242, '板金屋さん：唐草（水切り）', '軒先から雨水を落とす板金', true],
  [242, 302, '板金屋さん：屋根材を張る', 'ガルバリウムの立平葺き', true],
  [302, 362, '板金屋さん：ケラバ・棟', '屋根のふちを板金でふさぐ', true],
  [362, 432, '大工さん：軒天', '軒の裏に板を張る', false],
  [432, 500, '現場監督：雨仕舞の確認', '継ぎ目とふちを見て回る', true],
  [500, 600, '次は構造金物・中間検査', '見えなくなる前の検査', false],
];

export const Ep09: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const scaf = ramp(f, 48, 106);
  const felt = ramp(f, 118, 174);
  const drip = ramp(f, 182, 238);
  const metal = ramp(f, 248, 296);
  const edge = ramp(f, 308, 356);
  const soffit = ramp(f, 370, 428);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const tx = W + 2.5 + 8 * (1 - ramp(f, 46, 90));

  const onRoof = (x: number, y: number) => ({x, y, h: S(y) + 0.04});
  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: -0.9, y: 1.0 + 4 * scaf, h: 1.8, yaw: 90, act: 'press'};
  let b: Pp | null = {x: W + 0.9, y: D - 1.0 - 4 * scaf, h: 3.6, yaw: 270, act: 'hammer'};
  if (f >= 112 && f < 178) {
    const y = Y1 - (Y1 - Y0) * felt;
    a = {...onRoof(2.0 + 5 * felt, Math.max(0.5, y)), yaw: 0, act: 'press'};
    b = {...onRoof(6.5, Math.max(0.5, y + 0.6)), yaw: 180, act: 'hammer'};
  } else if (f >= 178 && f < 242) {
    a = {x: X0 + (X1 - X0) * drip, y: D + 0.9, h: 5.4 + 0.9, yaw: 0, act: 'hammer'};
    b = null;
  } else if (f >= 242 && f < 302) {
    const x = X0 + 0.3 + (X1 - X0 - 0.6) * metal;
    a = {...onRoof(x, 2.0), yaw: 90, act: 'hammer'};
    b = {...onRoof(x, 4.8), yaw: 90, act: 'press'};
  } else if (f >= 302 && f < 362) {
    a = {...onRoof(W - 0.3, 0.5 + 5 * edge), yaw: 0, act: 'hammer'};
    b = {...onRoof(0.3, 0.5 + 5 * edge), yaw: 180, act: 'hammer'};
  } else if (f >= 362 && f < 432) {
    a = {x: X0 + (X1 - X0) * soffit, y: D + 0.9, h: 3.6 + 0.9, yaw: 0, act: 'hammer'};
    b = null;
  } else if (f >= 432 && f < 500) {
    kan = {...onRoof(1.2, 4.2), yaw: 160, act: 'point'};
    a = {...onRoof(2.4, 3.0), yaw: 200, act: 'idle'};
    b = null;
  } else if (f >= 500) {
    kan = {x: 3.8, y: D + 2.6, yaw: 90, act: f > 512 ? 'wave' : 'idle'};
    a = {x: 5.4, y: D + 2.6, yaw: 90, act: f > 516 ? 'wave' : 'idle'};
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
        <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
        <Roof3D s={{scaf, felt, drip, metal, edge, soffit}} />
        {f < 112 ? (
          <group>
            <Truck3D x={tx} y={-3.2} />
            <PBox x0={tx - 4.0} x1={tx - 0.3} y0={-3.9} y1={-2.5} h0={0.8} h1={1.1} m={{color: '#7d8a96', metal: 0.4, rough: 0.5}} />
          </group>
        ) : null}
        {f >= 150 && f < 178 ? <Ring3D p={[4.5, D - 0.4, S(D - 0.4) + 0.05]} o={ramp(f, 150, 156)} f={f} r={0.5} /> : null}
        {f >= 440 && f < 500 ? <Ring3D p={[X0, 2.0, S(2.0) + 0.05]} o={ramp(f, 440, 446)} f={f} r={0.45} /> : null}
        {f >= 470 && f < 500 ? <Check3D p={[2.0, 3.5, S(3.5) + 1.0]} o={ramp(f, 476, 482)} size={0.5} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={9}
        hook={['屋根の中身', '知ってますか？']}
        title="屋根"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [120, 176, '雨を止めるのは、このシートなんや'],
          [440, 496, '水は低い方へ流れる。重ねる向きが大事や'],
        ]}
      />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>屋根ができた</span>
      </div>
    </AbsoluteFill>
  );
};
