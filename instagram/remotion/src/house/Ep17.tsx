import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {FL1, FL2, M, W} from './House';
import {PBox} from './Geo';
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
import {Skin3D} from './Ep12';
import {Ins3D} from './Ep13';
import {Board3D} from './Ep15';
import {Carp3D} from './Ep16';

// 内部その5：木完検査（大工工事の完了検査。床の傷・窓枠・階段・手すり・巾木 → 手直し）
const RISE = (FL2 - FL1) / 14;
const X0 = 5 * M;
const X1 = 7 * M;

const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [4.6, 0.2, FL1 + 2.1], [1.3, 2.6, FL1 + 0.1], 50],
  [118, [4.5, 0.3, FL1 + 2.1], [1.3, 2.6, FL1 + 0.1], 50],
  [130, [4.6, 3.6, FL1 + 1.3], [0, 1.9, FL1 + 1.0], 55],
  [198, [4.3, 3.5, FL1 + 1.3], [0, 1.9, FL1 + 1.0], 55],
  [210, [4.0, 3.7, FL1 + 1.8], [5.6, 5.9, FL1 + 1.5], 52],
  [296, [4.1, 3.8, FL1 + 1.8], [5.6, 5.9, FL1 + 1.5], 52],
  [308, [4.0, 3.7, FL1 + 2.0], [5.4, 5.6, FL1 + 1.8], 55],
  [366, [4.1, 3.8, FL1 + 2.0], [5.4, 5.6, FL1 + 1.8], 55],
  [378, [2.5, 2.0, FL1 + 1.2], [0, 3.5, FL1 + 0.2], 55],
  [436, [2.4, 2.1, FL1 + 1.2], [0, 3.5, FL1 + 0.2], 55],
  [448, [4.6, 0.2, FL1 + 2.1], [1.3, 2.6, FL1 + 0.1], 50],
  [496, [4.5, 0.3, FL1 + 2.1], [1.3, 2.6, FL1 + 0.1], 50],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '現場監督：床の傷', '養生をはがして、傷に印をつける', false],
  [125, 205, '現場監督：窓枠', '水平器で傾きを見る', false],
  [205, 300, '現場監督：階段', '上り下りして、きしみがないか', false],
  [300, 370, '現場監督：手すり', '体重をかけて、ぐらつかないか', false],
  [370, 440, '現場監督：巾木', '床とのすき間がないか', false],
  [440, 500, '大工さん：手直し', '印のところを直して、テープをはがす', false],
  [500, 600, '次はクロス貼り', '壁と天井の仕上げ', false],
];

const VOICE = '大工さんの最後の検査、見に行こか';
const VOICE_END = 6 + 76;
// blue masking-tape marks on the scratches the site manager finds
const TAPES: [number, number, number][] = [
  [1.6, 2.2, 70],
  [1.1, 2.9, 96],
];
const tapeM = {color: '#3f7fd8', rough: 0.7};

export const Ep17: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));
  const level = ramp(f, 140, 150) * (1 - ramp(f, 196, 204));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (f >= 42 && f < 125) {
    kan = {x: 0.9, y: 1.4 + 0.6 * ramp(f, 50, 90), h: FL1, yaw: 30, act: f < 60 ? 'walk' : 'point'};
    a = null;
  } else if (f >= 125 && f < 205) {
    kan = {x: 0.7, y: 1.2, h: FL1, yaw: 180, act: 'measure'};
    a = null;
  } else if (f >= 205 && f < 300) {
    const k = ramp(f, 212, 292);
    kan = {x: X1 - 0.2 - (X1 - X0 - 0.4) * k, y: 5.85, h: FL1 + RISE * (1 + 6 * k), yaw: 180, act: 'walk'};
    a = null;
  } else if (f >= 300 && f < 370) {
    kan = {x: 5.9, y: 5.85, h: FL1 + RISE * 3, yaw: 90, act: 'press'};
    a = null;
  } else if (f >= 370 && f < 440) {
    kan = {x: 0.6, y: 4.4, h: FL1, yaw: 180, act: 'measure'};
    a = null;
  } else if (f >= 440 && f < 500) {
    a = {x: 1.2, y: 1.7, h: FL1, yaw: 40, act: f < 486 ? 'hammer' : 'idle'};
    kan = {x: 2.4, y: 3.4, h: FL1, yaw: 230, act: f > 486 ? 'point' : 'idle'};
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
        <Board3D s={{ceil: 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: f < 46 ? 1 : 0}} />
        <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
        {/* tape marks: stuck on while checking, peeled off after the carpenter's fix */}
        {f >= 42
          ? TAPES.map(([x, y, at], i) => {
              const on = ramp(f, at, at + 6) * (1 - ramp(f, 470 + i * 10, 476 + i * 10));
              return on > 0 ? <PBox key={i} x0={x - 0.15} x1={x + 0.15} y0={y - 0.035} y1={y + 0.035} h0={FL1 + 0.02} h1={FL1 + 0.026 + 0.002 * on} m={tapeM} cast={false} /> : null;
            })
          : null}
        {f >= 64 && f < 120 ? <Ring3D p={[1.6, 2.2, FL1 + 0.02]} o={ramp(f, 64, 70)} f={f} r={0.35} /> : null}
        {/* a spirit level held on the window sill */}
        {level > 0 ? <PBox x0={0.11} x1={0.16} y0={0.75} y1={1.35} h0={FL1 + 0.9} h1={FL1 + 0.95} m={{color: '#e7c23a', rough: 0.5}} /> : null}
        {f >= 176 && f < 205 ? <Check3D p={[0.3, 1.05, FL1 + 1.4]} o={ramp(f, 178, 184)} size={0.3} /> : null}
        {f >= 272 && f < 300 ? <Check3D p={[5.0, 5.4, FL1 + 2.4]} o={ramp(f, 274, 280)} size={0.35} /> : null}
        {f >= 340 && f < 370 ? <Check3D p={[5.6, 5.85, FL1 + 2.2]} o={ramp(f, 342, 348)} size={0.3} /> : null}
        {f >= 412 && f < 440 ? <Check3D p={[0.3, 3.4, FL1 + 0.5]} o={ramp(f, 414, 420)} size={0.25} /> : null}
        {f >= 488 && f < 500 ? <Check3D p={[1.4, 2.5, FL1 + 0.6]} o={ramp(f, 488, 494)} size={0.3} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={17}
        hook={['大工さんの最後の検査', '見たことありますか？']}
        title="木完検査"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [88, 124, '傷は、テープで印つけとくんや'],
          [444, 498, 'クロス貼る前に直すのが大事なんや'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep17.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>木完検査 合格</span>
      </div>
    </AbsoluteFill>
  );
};
