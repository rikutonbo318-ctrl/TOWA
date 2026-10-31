import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {FL1, FL2, roofH, W, Wall} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
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

// 内部その1：先行配線（電気屋さん）・間柱・断熱材・防湿シート
export type InsState = {wire?: number; ins1?: number; ins2?: number; vb?: number; tape?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const PIECES = EXT.map(pieces);
// fill order: the west walls (seen from inside) first
const west = (w: Wall) => w.x0 === 0 && w.x1 === 0;
const RANK = EXT.map((w, i) => {
  const same = EXT.filter((v) => v.floor === w.floor);
  const sorted = [...same].sort((p, q) => (west(p) ? -1 : 0) - (west(q) ? -1 : 0));
  return sorted.indexOf(w) + (w.floor === 2 ? 100 : 0) + i * 0;
});

// studs every 455mm inside the exterior walls, skipped at openings
const studs = (w: Wall) => {
  const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
  const ux = (w.x1 - w.x0) / L;
  const uy = (w.y1 - w.y0) / L;
  const out: {a: [number, number]; b: [number, number]; hb: number; ht: number}[] = [];
  for (let s = 0.455; s < L - 0.1; s += 0.455) {
    if ((w.open ?? []).some((o) => s > o.s - 0.04 && s < o.e + 0.04)) continue;
    const a: [number, number] = [w.x0 + ux * (s - 0.015), w.y0 + uy * (s - 0.015)];
    const b: [number, number] = [w.x0 + ux * (s + 0.015), w.y0 + uy * (s + 0.015)];
    out.push({a, b, hb: w.floor === 1 ? FL1 : FL2, ht: w.floor === 1 ? FL2 - 0.24 : roofH(a[1]) - 0.12});
  }
  return out;
};
const STUDS = EXT.map(studs);

// outlets and switches on the west wall of the LDK and the bedroom (plan x = 0)
type Box = {y: number; h: number; sw?: boolean};
const BOX1: Box[] = [
  {y: 0.9, h: FL1 + 0.25},
  {y: 2.3, h: FL1 + 0.25},
  {y: 2.9, h: FL1 + 0.25},
  {y: 3.15, h: FL1 + 1.2, sw: true},
];
const BOX2: Box[] = [
  {y: 2.5, h: FL2 + 0.25},
  {y: 3.3, h: FL2 + 0.25},
  {y: 3.5, h: FL2 + 1.2, sw: true},
];
const cableM = '#e6e6e2';
const boxM = {color: '#2f6fb3', rough: 0.5};

const Wire: React.FC<{boxes: Box[]; top: number; k: number}> = ({boxes, top, k}) => (
  <group>
    {boxes.map((b, i) => {
      const kk = clamp(k * boxes.length - i);
      if (kk <= 0) return null;
      return (
        <group key={i}>
          <PBox x0={0.06} x1={0.11} y0={b.y - 0.035} y1={b.y + 0.035} h0={b.h - 0.05} h1={b.h + 0.05} m={b.sw ? {color: '#f3f3f0', rough: 0.5} : boxM} cast={false} />
          <Line3D a={[0.085, b.y, b.h + 0.05]} b={[0.085, b.y, b.h + 0.05 + (top - b.h - 0.05) * kk]} w={0.014} color={cableM} />
        </group>
      );
    })}
    {k > 0.3 ? <Line3D a={[0.085, boxes[0].y, top]} b={[0.085, boxes[0].y + (boxes[boxes.length - 1].y - boxes[0].y) * clamp((k - 0.3) / 0.7), top]} w={0.014} color={cableM} /> : null}
  </group>
);

export const Ins3D: React.FC<{s: InsState}> = ({s}) => {
  const n1 = EXT.filter((w) => w.floor === 1).length;
  const n2 = EXT.length - n1;
  const vb = s.vb ?? 0;
  return (
    <group>
      {EXT.map((w, i) => (
        <group key={'st' + i}>
          {STUDS[i].map((p, j) => (
            <Prism key={j} a={p.a} b={p.b} t={0.105} hb={p.hb} ht={p.ht} m={{color: '#d9b98c', tex: 'lumber', rough: 0.8}} />
          ))}
        </group>
      ))}
      {EXT.map((w, i) => {
        const k = w.floor === 1 ? clamp((s.ins1 ?? 0) * n1 - RANK[i]) : clamp((s.ins2 ?? 0) * n2 - (RANK[i] - 100));
        if (k <= 0) return null;
        return PIECES[i].map((p, j) => (
          <Prism key={'i' + i + j} a={p.a} b={p.b} t={0.09} hb={p.hb} ht={[p.hb + (p.ht[0] - p.hb) * k, p.hb + (p.ht[1] - p.hb) * k]} m={{color: '#f0cf5a', rough: 1}} cast={false} />
        ));
      })}
      {vb > 0
        ? EXT.map((w, i) => {
            const k = clamp(vb * EXT.length - (RANK[i] % 100) - (w.floor === 2 ? n1 : 0));
            if (k <= 0) return null;
            return PIECES[i].map((p, j) => (
              <Prism key={'v' + i + j} a={p.a} b={p.b} t={0.003} off={-0.058} hb={p.hb} ht={[p.hb + (p.ht[0] - p.hb) * k, p.hb + (p.ht[1] - p.hb) * k]} m={{color: '#d6e6ef', opacity: 0.5, rough: 0.2}} cast={false} />
            ));
          })
        : null}
      <Wire boxes={BOX1} top={FL2 - 0.3} k={s.wire ?? 0} />
      <Wire boxes={BOX2} top={roofH(3.0) - 0.4} k={s.wire ?? 0} />
      {/* airtight tape around each box once the vapour barrier is on */}
      {(s.tape ?? 0) > 0
        ? [...BOX1, ...BOX2].map((b, i) =>
            clamp((s.tape ?? 0) * 7 - i) > 0 ? <PBox key={'t' + i} x0={0.059} x1={0.064} y0={b.y - 0.07} y1={b.y + 0.07} h0={b.h - 0.09} h1={b.h + 0.09} m={{color: '#222222', rough: 0.6}} cast={false} /> : null,
          )
        : null}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [4.6, 3.6, 1.8], [0, 1.9, 1.3], 55],
  [118, [4.3, 3.5, 1.8], [0, 1.9, 1.3], 55],
  [130, [2.6, 3.9, 1.5], [0, 2.6, 1.0], 50],
  [198, [2.4, 3.8, 1.5], [0, 2.6, 1.0], 50],
  [210, [4.6, 3.6, 1.9], [0, 1.9, 1.5], 55],
  [296, [4.3, 3.5, 1.9], [0, 1.9, 1.5], 55],
  [308, [3.6, 3.5, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [366, [3.4, 3.4, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [378, [4.6, 3.6, 1.9], [0, 1.9, 1.5], 55],
  [436, [4.3, 3.5, 1.9], [0, 1.9, 1.5], 55],
  [448, [1.6, 3.4, 1.3], [0, 2.4, 0.9], 50],
  [496, [1.4, 3.3, 1.3], [0, 2.4, 0.9], 50],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '電気屋さん：先行配線', '壁をふさぐ前に、線とボックスを通す', true],
  [125, 205, '現場監督：コンセントの位置確認', '施主さんと一緒に、高さと数を見る', false],
  [205, 300, '断熱屋さん：1階の断熱材', '柱と間柱の間に、すき間なく詰める', true],
  [300, 370, '断熱屋さん：2階の断熱材', '2階も同じように詰めていく', true],
  [370, 440, '大工さん：防湿シート', '部屋の湿気を壁に入れない', false],
  [440, 500, '大工さん：ボックスまわりの気密', 'コンセントの穴もテープでふさぐ', false],
  [500, 600, '次は断熱検査', '検査員がすき間を見に来る', false],
];

const VOICE = 'コンセントの位置、直せるのは今日までやで';
const VOICE_END = 6 + 76;

export const Ep13: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const wire = ramp(f, 58, 118);
  const ins1 = ramp(f, 212, 294);
  const ins2 = ramp(f, 310, 364);
  const vb = ramp(f, 380, 434);
  const tape = ramp(f, 452, 494);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  let b: Pp | null = null;
  if (f >= 42 && f < 125) {
    a = {x: 0.7, y: 0.4 + 1.2 * wire, yaw: 180, act: 'press'};
    kan = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  } else if (f >= 125 && f < 205) {
    kan = {x: 0.9, y: 2.0, yaw: 160, act: 'point'};
    a = null;
    b = {x: 1.5, y: 1.2, yaw: 150, act: 'idle'};
  } else if (f >= 205 && f < 300) {
    a = {x: 0.65, y: 0.4 + 1.0 * ins1, yaw: 180, act: 'press'};
  } else if (f >= 300 && f < 370) {
    a = {x: 0.65, y: 0.5 + 1.0 * ins2, h: FL2, yaw: 180, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 0.65, y: 0.4 + 1.0 * vb, yaw: 180, act: 'hammer'};
  } else if (f >= 440 && f < 500) {
    a = {x: 0.7, y: 1.4, yaw: 180, act: 'press'};
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
        <Ins3D s={{wire, ins1, ins2, vb, tape}} />
        {f >= 150 && f < 205 ? <Ring3D p={[0.12, 2.9, FL1 + 0.25]} o={ramp(f, 150, 156)} f={f} r={0.22} vertical /> : null}
        {f >= 474 && f < 500 ? <Check3D p={[0.2, 2.3, FL1 + 0.7]} o={ramp(f, 478, 484)} size={0.3} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#4a5a7a" vest="#4a5a7a" helmet="#4a5a7a" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={13}
        hook={['コンセントの位置', '決めたのいつですか？']}
        title="配線・断熱材"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [132, 198, '家具を置く場所、思い出しながら見てや'],
          [444, 498, 'コンセントの穴も、すき間のうちなんや'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep13.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 44, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>断熱材 完了</span>
      </div>
    </AbsoluteFill>
  );
};
