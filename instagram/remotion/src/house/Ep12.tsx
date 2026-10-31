import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_TOP, FL2, roofH, W, Wall, WALLS} from './House';
import {PBox, Prism} from './Geo';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Person3D} from './Kit3D';
import {Site3D} from './Site3D';
import {Fdn3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {EAVE, rafT, RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';
import {Hardware3D} from './Ep10';
import {Sash3D} from './Ep11';

// 外まわりその2：透湿防水シート・胴縁・外壁・雨どい・足場解体
export type SkinState = {sheet?: number; batten?: number; side1?: number; side2?: number; gutter?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));

// one exterior wall split into solid pieces around its openings (plan points + bottom/top heights at each end)
export type Piece = {a: [number, number]; b: [number, number]; hb: number; ht: [number, number]};
export const EXT = [...WALLS.filter((w) => w.ext && w.floor === 1), ...WALLS.filter((w) => w.ext && w.floor === 2)];
export const pieces = (w: Wall): Piece[] => {
  const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
  const ux = (w.x1 - w.x0) / L;
  const uy = (w.y1 - w.y0) / L;
  const base = w.floor === 1 ? FDN_TOP : FL2;
  const fl = w.floor === 1 ? 0.6 : FL2;
  const at = (s: number): [number, number] => [w.x0 + ux * s, w.y0 + uy * s];
  const top = (s: number) => (w.floor === 1 ? FL2 : roofH(at(s)[1]));
  const ext = 0.11; // run past the corner so the layers meet
  const out: Piece[] = [];
  const ops = [...(w.open ?? [])].sort((p, q) => p.s - q.s);
  let s0 = -ext;
  ops.forEach((o) => {
    if (o.s > s0) out.push({a: at(s0), b: at(o.s), hb: base, ht: [top(s0), top(o.s)]});
    if (o.h0 > 0) out.push({a: at(o.s), b: at(o.e), hb: base, ht: [fl + o.h0, fl + o.h0]});
    out.push({a: at(o.s), b: at(o.e), hb: fl + o.h1, ht: [top(o.s), top(o.e)]});
    s0 = o.e;
  });
  out.push({a: at(s0), b: at(L + ext), hb: base, ht: [top(s0), top(L + ext)]});
  return out;
};
const PIECES = EXT.map(pieces);
const ORDER = EXT.map((_, i) => i);

// battens: vertical strips every 455mm, skipped inside openings
const battens = (w: Wall) => {
  const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
  const ux = (w.x1 - w.x0) / L;
  const uy = (w.y1 - w.y0) / L;
  const base = w.floor === 1 ? FDN_TOP : FL2;
  const out: {a: [number, number]; b: [number, number]; hb: number; ht: number}[] = [];
  for (let s = 0.02; s < L; s += 0.455) {
    if ((w.open ?? []).some((o) => s > o.s - 0.03 && s < o.e + 0.03)) continue;
    const a: [number, number] = [w.x0 + ux * s, w.y0 + uy * s];
    const b: [number, number] = [w.x0 + ux * (s + 0.045), w.y0 + uy * (s + 0.045)];
    out.push({a, b, hb: base, ht: w.floor === 1 ? FL2 : roofH(a[1]) - 0.05});
  }
  return out;
};
const BATTENS = EXT.map(battens);

const sheetM = {color: '#eef1f3', rough: 0.95};
const battenM = {color: '#c9a77a', tex: 'lumber' as const, rough: 0.8};
const sideM = {color: '#6f7377', rough: 0.6};
const gutterM = {color: '#e4e4e0', rough: 0.4, metal: 0.1};
const drainM = {color: '#3a3d40', rough: 0.4, metal: 0.4};

export const Skin3D: React.FC<{s: SkinState}> = ({s}) => {
  const sheet = s.sheet ?? 0;
  const batten = s.batten ?? 0;
  const gut = s.gutter ?? 0;
  const n = EXT.length;
  const side = (w: Wall) => (w.floor === 1 ? s.side1 ?? 0 : s.side2 ?? 0);
  const yG = D + EAVE;
  const hG = rafT(yG) - 0.12;
  return (
    <group>
      {ORDER.map((i) => {
        const w = EXT[i];
        const kS = clamp(sheet * n - i);
        const kB = clamp(batten * n - i);
        const kV = side(w);
        const base = w.floor === 1 ? FDN_TOP : FL2;
        const maxTop = w.floor === 1 ? FL2 : roofH(0);
        const cut = base + (maxTop - base) * kV;
        return (
          <group key={'w' + i}>
            {kS > 0 && kV < 1
              ? PIECES[i].map((p, j) => (
                  <Prism key={'s' + j} a={p.a} b={p.b} t={0.004} off={0.06} hb={p.hb} ht={[p.hb + (p.ht[0] - p.hb) * kS, p.hb + (p.ht[1] - p.hb) * kS]} m={sheetM} cast={false} />
                ))
              : null}
            {kB > 0 && kV < 1
              ? BATTENS[i].slice(0, Math.ceil(BATTENS[i].length * kB)).map((p, j) => <Prism key={'b' + j} a={p.a} b={p.b} t={0.018} off={0.071} hb={p.hb} ht={p.ht} m={battenM} />)
              : null}
            {kV > 0
              ? PIECES[i].map((p, j) => {
                  if (p.hb >= cut) return null;
                  return <Prism key={'v' + j} a={p.a} b={p.b} t={0.016} off={0.089} hb={p.hb} ht={[Math.min(p.ht[0], cut), Math.min(p.ht[1], cut)]} m={sideM} />;
                })
              : null}
            {kV > 0 && w.floor === 1 ? <Prism a={[w.x0, w.y0]} b={[w.x1, w.y1]} t={0.03} off={0.1} hb={FDN_TOP - 0.03} ht={FDN_TOP + 0.01} m={drainM} cast={false} /> : null}
          </group>
        );
      })}
      {/* gutter along the low (north) eave and two downpipes */}
      {gut > 0 ? (
        <group>
          <PBox x0={-EAVE + 0.1} x1={-EAVE + 0.1 + (W + 2 * EAVE - 0.2) * clamp(gut * 1.6)} y0={yG - 0.02} y1={yG + 0.11} h0={hG} h1={hG + 0.1} m={gutterM} />
          {gut > 0.65 ? (
            <group>
              {[0.35, W - 0.35].map((x) => (
                <group key={x}>
                  <PBox x0={x - 0.04} x1={x + 0.04} y0={yG - 0.01} y1={D + 0.2} h0={hG - 0.05} h1={hG + 0.02} m={gutterM} />
                  <PBox x0={x - 0.04} x1={x + 0.04} y0={D + 0.12} y1={D + 0.2} h0={0.1 + (hG - 0.1) * (1 - clamp((gut - 0.65) / 0.35))} h1={hG} m={gutterM} />
                </group>
              ))}
            </group>
          ) : null}
        </group>
      ) : null}
    </group>
  );
};

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [45, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [58, [W + 7.5, -10.5, 6.5], [4.2, 0, 3.4], 50],
  [120, [W + 6.5, -10.5, 6.0], [4.2, 0, 3.4], 50],
  [132, [3.0, -5.6, 2.6], [3.0, 0, 2.2], 50],
  [200, [4.0, -5.6, 2.6], [4.0, 0, 2.2], 50],
  [212, [W + 6.0, -7.5, 2.6], [5.0, 0, 1.8], 50],
  [296, [W + 5.0, -7.5, 2.6], [5.0, 0, 1.8], 50],
  [308, [W + 6.0, -8.0, 6.8], [4.5, 0, 5.0], 50],
  [366, [W + 5.0, -8.0, 6.8], [4.5, 0, 5.0], 50],
  [378, [W + 5.5, D + 7.5, 6.3], [W / 2 + 0.5, D + 0.6, 5.4], 50],
  [436, [W + 4.5, D + 7.5, 6.3], [W / 2, D + 0.6, 5.4], 50],
  [450, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [45, 125, '大工さん：透湿防水シート', '雨は通さず、湿気は外へ逃がす', false],
  [125, 205, '大工さん：胴縁', '外壁の裏に空気の通り道をつくる', false],
  [205, 300, '外壁屋さん：1階の外壁', '水切りから上へ順番に張る', true],
  [300, 370, '外壁屋さん：2階の外壁', '継ぎ目はシーリングでふさぐ', true],
  [370, 440, '板金屋さん：雨どい', '屋根の低い側の軒先に付ける', true],
  [440, 500, '現場監督：足場を外す前の確認', '外壁のキズと雨どいの向きを見る', false],
  [500, 600, '次は家の中', '先行配線・断熱材・防湿シート', false],
];

const VOICE = '外壁の下、何が貼ってあるか知ってる？';
const VOICE_END = 6 + 78; // 0.2s start, 2.5s long

export const Ep12: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const sheet = ramp(f, 56, 120);
  const batten = ramp(f, 132, 198);
  const side1 = ramp(f, 212, 294);
  const side2 = ramp(f, 308, 364);
  const gutter = ramp(f, 380, 432);
  const scaf = 1 - ramp(f, 452, 494);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  let b: Pp | null = null;
  if (f >= 45 && f < 125) {
    a = {x: 1.0 + 6 * sheet, y: -0.55, yaw: 90, act: 'press'};
  } else if (f >= 125 && f < 205) {
    a = {x: 5.6 + 1.5 * batten, y: -0.55, yaw: 90, act: 'hammer'};
  } else if (f >= 205 && f < 300) {
    a = {x: 2.5 + 5 * side1, y: -0.6, yaw: 90, act: 'press'};
    b = {x: W + 0.6, y: 1.0 + 3 * side1, yaw: 0, act: 'hammer'};
  } else if (f >= 300 && f < 370) {
    a = {x: 1.5 + 4 * side2, y: -0.6, h: FL2, yaw: 90, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 0.8 + 3 * gutter, y: D + 0.9, h: 4.4, yaw: 180, act: 'press'};
  } else if (f >= 440 && f < 500) {
    kan = {x: 4.0, y: -2.6, yaw: 90, act: 'point'};
    a = {x: W + 1.6, y: -1.6, yaw: 135, act: 'idle'};
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
        <Roof3D s={{scaf, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
        <Hardware3D s={{brace: f < 308 ? 1 : 0, plate: 1, hd: 1, bolt: 1}} />
        <Sash3D s={{sash1: 1, sash2: 1, tape: 1, mat: 1, top: 1, water: 0}} />
        <Skin3D s={{sheet, batten, side1, side2, gutter}} />
        {f >= 470 && f < 500 ? <Check3D p={[2.0, -0.6, 5.2]} o={ramp(f, 476, 482)} size={0.5} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit="#3a5a3f" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={12}
        hook={['外壁の下にあるもの', '見たことありますか？']}
        title="外壁・雨どい"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [134, 198, '胴縁のすき間が、壁の中の湿気を逃がすんや'],
          [444, 498, '足場があるうちに、全部見とくんやで'],
        ]}
      />
      {/* 渦さんの声（冒頭）と同じ文の字幕 */}
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep12.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>外まわり完成</span>
      </div>
    </AbsoluteFill>
  );
};
