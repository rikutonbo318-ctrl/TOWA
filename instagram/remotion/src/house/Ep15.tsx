import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {CH, D, FL1, FL2, W} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Person3D, Ring3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';
import {Hardware3D} from './Ep10';
import {Sash3D} from './Ep11';
import {EXT, pieces, Skin3D} from './Ep12';
import {Ins3D} from './Ep13';

// 内部その3：天井ボード・棚の下地・壁ボード・フローリング・床の養生
export type BoardState = {ceil?: number; base?: number; wall1?: number; wall2?: number; floor?: number; cover?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const PIECES = EXT.map(pieces);
const boardM = {color: '#ecebe6', rough: 0.9};
// plywood backing for a shelf on the west wall of the LDK
const BASE = {y0: 3.3, y1: 4.4, h0: FL1 + 0.9, h1: FL1 + 1.8};

export const Board3D: React.FC<{s: BoardState}> = ({s}) => {
  const ceil = s.ceil ?? 0;
  const fl = s.floor ?? 0;
  const cov = s.cover ?? 0;
  return (
    <group>
      {/* 1F ceiling boards, sheet by sheet from the west */}
      {ceil > 0 ? <PBox x0={0} x1={W * ceil} y0={0} y1={D} h0={FL1 + CH} h1={FL1 + CH + 0.0125} m={{...boardM, emissive: '#9a9893', emissiveIntensity: 0.55}} cast={false} /> : null}
      {(s.base ?? 0) > 0 ? <PBox x0={0.06} x1={0.072} y0={BASE.y0} y1={BASE.y0 + (BASE.y1 - BASE.y0) * (s.base ?? 0)} h0={BASE.h0} h1={BASE.h1} m={{color: '#c99f6a', tex: 'lumber', rough: 0.8}} cast={false} /> : null}
      {EXT.map((w, i) => {
        const k = w.floor === 1 ? s.wall1 ?? 0 : s.wall2 ?? 0;
        if (k <= 0) return null;
        const base = w.floor === 1 ? FL1 : FL2;
        const cut = base + (w.floor === 1 ? CH : CH + 0.2) * k;
        return PIECES[i].map((p, j) => {
          const hb = Math.max(p.hb, base);
          if (hb >= cut) return null;
          return <Prism key={'b' + i + '_' + j} a={p.a} b={p.b} t={0.0125} off={-0.078} hb={hb} ht={[Math.min(p.ht[0], cut), Math.min(p.ht[1], cut)]} m={boardM} />;
        });
      })}
      {/* oak flooring rows from the south, then a protective sheet over it */}
      {fl > 0 ? <PBox x0={0.08} x1={W - 0.08} y0={0.08} y1={0.08 + (D - 0.16) * fl} h0={FL1 + 0.001} h1={FL1 + 0.012} m={{color: '#b98a5a', tex: 'oak', rough: 0.55}} cast={false} /> : null}
      {cov > 0 ? <PBox x0={0.1} x1={W - 0.1} y0={0.1} y1={0.1 + (D - 0.2) * cov} h0={FL1 + 0.013} h1={FL1 + 0.016} m={{color: '#d2bf95', rough: 0.95}} cast={false} /> : null}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [5.6, 4.0, FL1 + 1.7], [2.0, 2.0, FL1 + 2.0], 58],
  [118, [5.3, 3.9, FL1 + 1.7], [2.0, 2.0, FL1 + 2.0], 58],
  [130, [2.6, 2.4, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [198, [2.4, 2.5, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [210, [4.6, 3.6, 1.9], [0, 1.9, 1.5], 55],
  [296, [4.3, 3.5, 1.9], [0, 1.9, 1.5], 55],
  [308, [3.6, 3.5, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [366, [3.4, 3.4, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [378, [5.2, 4.4, FL1 + 2.0], [2.6, 1.6, FL1], 55],
  [436, [5.0, 4.3, FL1 + 2.0], [2.6, 1.6, FL1], 55],
  [448, [5.2, 4.4, FL1 + 2.0], [2.6, 1.6, FL1], 55],
  [496, [5.0, 4.3, FL1 + 2.0], [2.6, 1.6, FL1], 55],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '大工さん：天井のボード', '天井から先に張っていく', false],
  [125, 205, '大工さん：棚の下地', '棚をつける場所に板を入れておく', false],
  [205, 300, '大工さん：1階の壁ボード', '石こうボードで火に強い壁に', false],
  [300, 370, '大工さん：2階の壁ボード', '2階も同じように張る', false],
  [370, 440, '大工さん：フローリング', '南から順番に張っていく', false],
  [440, 500, '大工さん：床の養生', '傷がつかないよう、すぐ覆う', false],
  [500, 600, '次は階段と枠', '大工さんの腕の見せどころ', false],
];

const VOICE = '棚つけたい壁、下地入ってるか聞いとき';
const VOICE_END = 6 + 76;

export const Ep15: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const ceil = ramp(f, 58, 118);
  const base = ramp(f, 134, 170);
  const wall1 = ramp(f, 212, 294);
  const wall2 = ramp(f, 310, 364);
  const floor = ramp(f, 380, 434);
  const cover = ramp(f, 450, 494);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (f >= 42 && f < 125) {
    a = {x: 3.2 + 1.2 * ceil, y: 2.4, h: FL1, yaw: 0, act: 'press'};
  } else if (f >= 125 && f < 205) {
    a = {x: 0.7, y: 3.0, h: FL1, yaw: 180, act: 'hammer'};
    kan = {x: 1.3, y: 0.9, h: FL1, yaw: 150, act: f > 172 ? 'point' : 'idle'};
  } else if (f >= 205 && f < 300) {
    a = {x: 0.7, y: 0.5 + 1.0 * wall1, h: FL1, yaw: 180, act: 'press'};
    kan = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  } else if (f >= 300 && f < 370) {
    a = {x: 0.7, y: 0.5 + 1.0 * wall2, h: FL2, yaw: 180, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 3.0, y: 0.3 + (D - 0.6) * floor, h: FL1, yaw: 90, act: 'hammer'};
  } else if (f >= 440 && f < 500) {
    a = {x: 3.6, y: 0.3 + (D - 0.6) * cover, h: FL1, yaw: 90, act: 'press'};
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
        <Ins3D s={{wire: 1, ins1: 1, ins2: 1, vb: 1, tape: 1}} />
        <Board3D s={{ceil, base, wall1, wall2, floor, cover}} />
        {f >= 176 && f < 205 ? <Ring3D p={[0.12, (BASE.y0 + BASE.y1) / 2, (BASE.h0 + BASE.h1) / 2]} o={ramp(f, 176, 182)} f={f} r={0.6} vertical /> : null}
        {f >= 474 && f < 500 ? <Check3D p={[3.0, 2.5, FL1 + 0.8]} o={ramp(f, 478, 484)} size={0.35} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={15}
        hook={['棚をつける壁の中', '見たことありますか？']}
        title="ボード・フローリング"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [140, 204, 'ここに棚つけるって、先に言うといてや'],
          [446, 498, '床はすぐ守る。これが大事なんや'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep15.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 44, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>壁と床ができた</span>
      </div>
    </AbsoluteFill>
  );
};
