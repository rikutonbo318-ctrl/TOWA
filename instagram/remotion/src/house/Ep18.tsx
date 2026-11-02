import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {CH, D, FL1, FL2, M, W, Wall} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Person3D} from './Kit3D';
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
import {Board3D} from './Ep15';
import {Carp3D} from './Ep16';

// 内部その6：クロス貼り（パテ → 天井 → 1階の壁 → アクセントの壁 → 2階 → 横から光で確認）
export type ClothState = {putty?: number; ceil?: number; wall1?: number; accent?: number; wall2?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const PIECES = EXT.map(pieces);
const isWest = (w: Wall) => w.floor === 1 && w.x0 === 0 && w.x1 === 0;
const clothM = {color: '#f7f5ef', rough: 0.95};
const accentM = {color: '#8f9e8b', rough: 0.95};
const OFF = -0.0855;

// the part of a wall piece from the wall's start up to `cut` metres along it
const clip = (w: Wall, p: {a: [number, number]; b: [number, number]; hb: number; ht: [number, number]}, cut: number) => {
  const d = (q: [number, number]) => Math.hypot(q[0] - w.x0, q[1] - w.y0);
  const s0 = d(p.a);
  const s1 = d(p.b);
  if (s0 >= cut) return null;
  if (s1 <= cut) return p;
  const k = (cut - s0) / (s1 - s0);
  return {a: p.a, b: [p.a[0] + (p.b[0] - p.a[0]) * k, p.a[1] + (p.b[1] - p.a[1]) * k] as [number, number], hb: p.hb, ht: [p.ht[0], p.ht[0] + (p.ht[1] - p.ht[0]) * k] as [number, number]};
};

export const Cloth3D: React.FC<{s: ClothState}> = ({s}) => {
  const out: React.ReactNode[] = [];
  EXT.forEach((w, i) => {
    const west = isWest(w);
    const k = w.floor === 2 ? s.wall2 ?? 0 : west ? s.accent ?? 0 : s.wall1 ?? 0;
    const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
    const base = w.floor === 1 ? FL1 : FL2;
    const top = base + (w.floor === 1 ? CH : CH + 0.2);
    // putty on the board joints of the west wall, covered as the paper goes on
    if (west && (s.putty ?? 0) > 0) {
      const ux = (w.x1 - w.x0) / L;
      const uy = (w.y1 - w.y0) / L;
      for (let n = 1; n * M < L; n++) {
        const at = n * M;
        if (clamp((s.putty ?? 0) * 7 - n + 1) <= 0 || at < k * L) continue;
        if ((w.open ?? []).some((o) => at > o.s - 0.05 && at < o.e + 0.05)) continue;
        const a: [number, number] = [w.x0 + ux * (at - 0.05), w.y0 + uy * (at - 0.05)];
        const b: [number, number] = [w.x0 + ux * (at + 0.05), w.y0 + uy * (at + 0.05)];
        out.push(<Prism key={'p' + n} a={a} b={b} t={0.001} off={OFF + 0.0007} hb={base + 0.08} ht={top - 0.02} m={{color: '#c9c3b4', rough: 1}} cast={false} />);
      }
    }
    if (k <= 0) return;
    PIECES[i].forEach((p, j) => {
      const q = clip(w, p, L * k);
      if (!q) return;
      const hb = Math.max(q.hb, base);
      if (hb >= top) return;
      out.push(<Prism key={'c' + i + '_' + j} a={q.a} b={q.b} t={0.002} off={OFF} hb={hb} ht={[Math.min(q.ht[0], top), Math.min(q.ht[1], top)]} m={west ? accentM : clothM} cast={false} />);
    });
  });
  const ce = s.ceil ?? 0;
  if (ce > 0) out.push(<PBox key="ceil" x0={0} x1={W * ce} y0={0} y1={D} h0={FL1 + CH - 0.003} h1={FL1 + CH - 0.001} m={{...clothM, emissive: '#a19f99', emissiveIntensity: 0.55}} cast={false} />);
  return <group>{out}</group>;
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [2.6, 2.4, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [118, [2.4, 2.5, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [130, [5.6, 4.0, FL1 + 1.7], [2.0, 2.0, FL1 + 2.0], 58],
  [198, [5.3, 3.9, FL1 + 1.7], [2.0, 2.0, FL1 + 2.0], 58],
  [210, [2.0, 3.2, FL1 + 1.4], [4.6, 0, FL1 + 1.2], 58],
  [296, [2.2, 3.3, FL1 + 1.4], [4.6, 0, FL1 + 1.2], 58],
  [308, [3.6, 2.0, FL1 + 1.4], [0, 3.2, FL1 + 1.2], 60],
  [366, [3.4, 2.0, FL1 + 1.4], [0, 3.2, FL1 + 1.2], 60],
  [378, [3.6, 3.5, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [436, [3.4, 3.4, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [448, [2.6, 2.4, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [496, [2.4, 2.5, FL1 + 1.5], [0, 3.85, FL1 + 1.3], 50],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, 'クロス屋さん：パテ', 'ボードの継ぎ目とビスの穴を平らに', false],
  [125, 205, 'クロス屋さん：天井', '天井から先に貼る', false],
  [205, 300, 'クロス屋さん：1階の壁', '継ぎ目が目立たないように', false],
  [300, 370, 'クロス屋さん：アクセントの壁', '色を変える壁もここで', false],
  [370, 440, 'クロス屋さん：2階', '2階の部屋も同じように', false],
  [440, 500, '現場監督：横から光', 'ライトを当てて、継ぎ目や浮きを見る', false],
  [500, 600, '次はキッチン', '設備の取り付け', false],
];

const VOICE = 'クロスの継ぎ目、横から光当ててみ';
const VOICE_END = 6 + 76;
const WORKER = '#3c5a78';

export const Ep18: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const putty = ramp(f, 58, 116);
  const ceil = ramp(f, 132, 196);
  const wall1 = ramp(f, 212, 294);
  const accent = ramp(f, 310, 364);
  const wall2 = ramp(f, 380, 434);
  const lamp = f >= 446 && f < 500;
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (f >= 42 && f < 125) {
    a = {x: 0.7, y: 2.6 + 1.6 * putty, h: FL1, yaw: 180, act: 'press'};
  } else if (f >= 125 && f < 205) {
    a = {x: 3.2 + 1.2 * ceil, y: 2.4, h: FL1, yaw: 0, act: 'press'};
  } else if (f >= 205 && f < 300) {
    a = {x: 2.4 + 1.6 * wall1, y: 0.7, h: FL1, yaw: 270, act: 'press'};
  } else if (f >= 300 && f < 370) {
    a = {x: 0.7, y: 1.4 + 2.6 * accent, h: FL1, yaw: 180, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 0.8, y: 0.8 + 1.4 * wall2, h: FL2, yaw: 180, act: 'press'};
  } else if (f >= 440 && f < 500) {
    kan = {x: 0.8, y: 3.0, h: FL1, yaw: 160, act: 'measure'};
    a = {x: 2.2, y: 4.9, h: FL1, yaw: 200, act: 'idle'};
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
        <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
        <Cloth3D s={{putty, ceil, wall1, accent, wall2}} />
        {/* the work light held low against the wall, raking along it */}
        {lamp ? (
          <group>
            <PBox x0={0.3} x1={0.42} y0={3.3} y1={3.42} h0={FL1 + 1.0} h1={FL1 + 1.12} m={{color: '#f2c230', rough: 0.4}} />
            <pointLight position={[0.2, 3.36, FL1 + 1.06]} intensity={5} distance={3.5} color="#fff4dc" />
          </group>
        ) : null}
        {f >= 100 && f < 125 ? <Check3D p={[0.3, 3.2, FL1 + 2.0]} o={ramp(f, 102, 108)} size={0.3} /> : null}
        {f >= 476 && f < 500 ? <Check3D p={[0.3, 3.9, FL1 + 1.9]} o={ramp(f, 478, 484)} size={0.35} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit={WORKER} vest={WORKER} /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={18}
        hook={['クロスを貼るところ', '見たことありますか？']}
        title="クロス貼り"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [88, 124, 'パテが雑やと、クロスに出るんや'],
          [444, 498, '横から光当てたら、浮きがよう見えるで'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep18.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>壁と天井が仕上がった</span>
      </div>
    </AbsoluteFill>
  );
};
