import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {FL1, FL2, M, W, Wall} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';
import {Hardware3D} from './Ep10';
import {Sash3D} from './Ep11';
import {EXT, Skin3D} from './Ep12';
import {Ins3D} from './Ep13';
import {Board3D} from './Ep15';

// 内部その4：造作（階段・手すり・窓枠・巾木）
export type CarpState = {run1?: number; run2?: number; rail?: number; casing?: number; skirting?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const RISE = (FL2 - FL1) / 14;
const TREAD = 0.26;
const X0 = 5 * M; // 4.55
const X1 = 7 * M; // 6.37
const Y_N = [5.5 * M, 7 * M]; // flight 1 (north half), going west
const Y_S = [5 * M, 5.5 * M + 0.0]; // flight 2 (south half), going east
const oakM = {color: '#c49a68', tex: 'oak' as const, rough: 0.55};
const riserM = {color: '#efe9de', rough: 0.8};
const trimM = {color: '#d8b98c', tex: 'oak' as const, rough: 0.6};

const Stair: React.FC<{s: CarpState}> = ({s}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const k = clamp((s.run1 ?? 0) * 7 - i);
    if (k <= 0) continue;
    const x1 = X1 - i * TREAD;
    const h = FL1 + (i + 1) * RISE;
    out.push(
      <group key={'a' + i}>
        <PBox x0={x1 - TREAD - 0.02} x1={x1} y0={Y_N[0]} y1={Y_N[1] - 0.05} h0={h - 0.03 + (1 - k) * 0.4} h1={h + (1 - k) * 0.4} m={oakM} />
        <PBox x0={x1 - 0.015} x1={x1} y0={Y_N[0]} y1={Y_N[1] - 0.05} h0={h - RISE} h1={h - 0.03} m={riserM} cast={false} />
      </group>,
    );
  }
  for (let i = 0; i < 7; i++) {
    const k = clamp((s.run2 ?? 0) * 7 - i);
    if (k <= 0) continue;
    const x0 = X0 + i * TREAD;
    const h = FL1 + (i + 8) * RISE;
    out.push(
      <group key={'b' + i}>
        <PBox x0={x0} x1={x0 + TREAD + 0.02} y0={Y_S[0] + 0.05} y1={Y_S[1]} h0={h - 0.03 + (1 - k) * 0.4} h1={h + (1 - k) * 0.4} m={oakM} />
        <PBox x0={x0} x1={x0 + 0.015} y0={Y_S[0] + 0.05} y1={Y_S[1]} h0={h - RISE} h1={h - 0.03} m={riserM} cast={false} />
      </group>,
    );
  }
  // landing at the west end
  if ((s.run2 ?? 0) > 0) out.push(<PBox key="land" x0={X0 - 0.3} x1={X0 + 0.02} y0={Y_S[0] + 0.05} y1={Y_N[1] - 0.05} h0={FL1 + 7 * RISE - 0.03} h1={FL1 + 7 * RISE} m={oakM} />);
  // handrail along the outer wall of flight 1
  const r = s.rail ?? 0;
  if (r > 0) {
    const a: [number, number, number] = [X1, Y_N[1] - 0.12, FL1 + RISE + 0.8];
    const b: [number, number, number] = [X1 - (X1 - X0) * r, Y_N[1] - 0.12, FL1 + RISE + 0.8 + 6 * RISE * r];
    out.push(<Line3D key="rail" a={a} b={b} w={0.04} color="#8a6440" />);
  }
  return <group>{out}</group>;
};

// window casing on the inside of the 1F exterior walls
const casingOf = (w: Wall) => {
  const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
  const ux = (w.x1 - w.x0) / L;
  const uy = (w.y1 - w.y0) / L;
  return (w.open ?? [])
    .filter((o) => o.kind !== 'entry')
    .map((o) => ({a: [w.x0 + ux * o.s, w.y0 + uy * o.s] as [number, number], b: [w.x0 + ux * o.e, w.y0 + uy * o.e] as [number, number], h0: FL1 + o.h0, h1: FL1 + o.h1, sweep: o.h0 === 0}));
};
const CASINGS = EXT.filter((w) => w.floor === 1).flatMap(casingOf);
const SKIRT = EXT.filter((w) => w.floor === 1).sort((p, q) => (p.x0 === 0 && p.x1 === 0 ? -1 : 0) - (q.x0 === 0 && q.x1 === 0 ? -1 : 0));

export const Carp3D: React.FC<{s: CarpState}> = ({s}) => {
  const cas = s.casing ?? 0;
  const sk = s.skirting ?? 0;
  const e = 0.05;
  return (
    <group>
      <Stair s={s} />
      {CASINGS.map((c, i) => {
        if (clamp(cas * CASINGS.length - i) <= 0) return null;
        return (
          <group key={'c' + i}>
            <Prism a={c.a} b={c.b} t={0.02} off={-0.095} hb={c.h1} ht={c.h1 + e} m={trimM} cast={false} />
            {c.sweep ? null : <Prism a={c.a} b={c.b} t={0.03} off={-0.1} hb={c.h0 - e} ht={c.h0} m={trimM} cast={false} />}
          </group>
        );
      })}
      {SKIRT.map((w, i) => {
        const k = clamp(sk * SKIRT.length - i);
        if (k <= 0) return null;
        const b: [number, number] = [w.x0 + (w.x1 - w.x0) * k, w.y0 + (w.y1 - w.y0) * k];
        return <Prism key={'s' + i} a={[w.x0, w.y0]} b={b} t={0.012} off={-0.091} hb={FL1 + 0.012} ht={FL1 + 0.07} m={{color: '#6b4a2e', rough: 0.6}} cast={false} />;
      })}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [3.0, 3.9, FL1 + 1.7], [5.6, 5.6, FL1 + 0.9], 55],
  [118, [3.1, 4.0, FL1 + 1.7], [5.6, 5.6, FL1 + 1.0], 55],
  [130, [3.0, 3.9, FL1 + 2.0], [5.4, 5.2, FL1 + 1.7], 55],
  [198, [3.1, 4.0, FL1 + 2.0], [5.4, 5.2, FL1 + 1.8], 55],
  [210, [3.0, 3.9, FL1 + 1.8], [5.6, 5.9, FL1 + 1.5], 52],
  [296, [3.1, 4.0, FL1 + 1.8], [5.6, 5.9, FL1 + 1.5], 52],
  [308, [4.6, 3.6, FL1 + 1.3], [0, 1.9, FL1 + 1.0], 55],
  [366, [4.3, 3.5, FL1 + 1.3], [0, 1.9, FL1 + 1.0], 55],
  [378, [3.0, 0.6, FL1 + 0.8], [0, 2.0, FL1 + 0.2], 55],
  [436, [2.8, 0.7, FL1 + 0.8], [0, 2.0, FL1 + 0.2], 55],
  [448, [3.0, 3.9, FL1 + 1.9], [5.6, 5.6, FL1 + 1.5], 55],
  [496, [3.1, 4.0, FL1 + 2.0], [5.4, 5.6, FL1 + 1.8], 55],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '大工さん：階段（下の段）', '1段ずつ高さをそろえて組む', false],
  [125, 205, '大工さん：階段（上の段）', '踊り場で向きを変えて2階へ', false],
  [205, 300, '大工さん：手すり', '下地のある壁に、しっかり留める', false],
  [300, 370, '大工さん：窓枠', '窓のまわりを木の枠で仕上げる', false],
  [370, 440, '大工さん：巾木', '壁と床の境目を守る', false],
  [440, 500, '現場監督：段の高さと手すりの確認', 'つまずかないか、実際に上ってみる', false],
  [500, 600, '次は木完検査', '大工さんの仕事の最終チェック', false],
];

const VOICE = '階段は、大工さんの腕の見せどころや';
const VOICE_END = 6 + 76;

export const Ep16: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const run1 = ramp(f, 58, 118);
  const run2 = ramp(f, 132, 198);
  const rail = ramp(f, 214, 292);
  const casing = ramp(f, 310, 364);
  const skirting = ramp(f, 380, 434);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (f >= 42 && f < 125) {
    a = {x: 6.7, y: 4.9, h: FL1, yaw: 180, act: 'hammer'};
  } else if (f >= 125 && f < 205) {
    a = {x: 6.7, y: 4.9, h: FL1, yaw: 180, act: 'hammer'};
  } else if (f >= 205 && f < 300) {
    a = {x: 6.0 - 1.0 * rail, y: 5.85, h: FL1 + RISE * (1 + 5 * rail), yaw: 90, act: 'press'};
  } else if (f >= 300 && f < 370) {
    a = {x: 0.7, y: 0.6 + 0.8 * casing, h: FL1, yaw: 180, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 0.6, y: 4.2, h: FL1, yaw: 180, act: 'hammer'};
  } else if (f >= 440 && f < 500) {
    const k = ramp(f, 444, 494);
    kan = {x: X1 - 0.2 - (X1 - X0 - 0.4) * k, y: 5.85, h: FL1 + RISE * (1 + 6 * k), yaw: 180, act: 'walk'};
    a = {x: 4.9, y: 4.25, h: FL1, yaw: 90, act: 'idle'};
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
        <Roof3D s={{scaf: 0, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
        <Hardware3D s={{brace: 0, plate: 1, hd: 1, bolt: 1}} />
        <Sash3D s={{sash1: 1, sash2: 1, tape: 1, mat: 1, top: 1, water: 0}} />
        <Skin3D s={{sheet: 1, batten: 1, side1: 1, side2: 1, gutter: 1}} />
        <Ins3D s={{wire: 0, ins1: 1, ins2: 1, vb: 1, tape: 0}} />
        <Board3D s={{ceil: 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: 1}} />
        <Carp3D s={{run1, run2, rail, casing, skirting}} />
        {f >= 476 && f < 500 ? <Check3D p={[5.0, 5.4, FL1 + 2.4]} o={ramp(f, 478, 484)} size={0.35} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={16}
        hook={['階段ができるところ', '見たことありますか？']}
        title="階段・造作"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [214, 292, '手すりは、下地のあるところに留めるんや'],
          [446, 498, '自分の足で上って、段の高さを確かめるんや'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep16.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>階段と枠ができた</span>
      </div>
    </AbsoluteFill>
  );
};
