import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {CH, FL1, W} from './House';
import {PBox} from './Geo';
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
import {Skin3D} from './Ep12';
import {Ins3D} from './Ep13';
import {Board3D} from './Ep15';
import {Carp3D} from './Ep16';
import {Cloth3D} from './Ep18';

// 設備その1：キッチン（配管の確認 → キャビネット → 天板 → レンジフード・吊戸棚 → 水栓 → 水漏れ確認）
export type KitchenState = {pipe?: number; cab?: number; top?: number; hood?: number; tap?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const KX0 = 1.1;
const UNIT = 0.675;
const KY0 = 3.9;
const KY1 = 4.55;
const SINK = {x0: 1.35, x1: 2.15};
const COOK = {x0: 2.95, x1: 3.55};
const cabM = {color: '#ebe6dc', rough: 0.6, emissive: '#1a1a1a', emissiveIntensity: 0.2};
const topM = {color: '#cfd0cc', rough: 0.4, emissive: '#1a1a1a', emissiveIntensity: 0.2};

export const Kitchen3D: React.FC<{s: KitchenState}> = ({s}) => {
  const out: React.ReactNode[] = [];
  const pipe = s.pipe ?? 0;
  const cab = s.cab ?? 0;
  const top = s.top ?? 0;
  const hood = s.hood ?? 0;
  const tap = s.tap ?? 0;
  // kitchen panel behind the counter
  out.push(<PBox key="panel" x0={KX0 - 0.1} x1={KX0 + 4 * UNIT + 0.1} y0={KY1} y1={KY1 + 0.04} h0={FL1} h1={FL1 + CH} m={{color: '#f3f1ec', rough: 0.7}} cast={false} />);
  // water (blue), hot water (red) and drain (grey) coming up through the floor
  if (pipe > 0 && cab < 1) {
    const ph = 0.35 * pipe;
    out.push(<PBox key="pw" x0={1.6} x1={1.64} y0={4.38} y1={4.42} h0={FL1} h1={FL1 + ph} m={{color: '#2f6fd0', rough: 0.5}} cast={false} />);
    out.push(<PBox key="ph" x0={1.72} x1={1.76} y0={4.38} y1={4.42} h0={FL1} h1={FL1 + ph} m={{color: '#d0412f', rough: 0.5}} cast={false} />);
    out.push(<PBox key="pd" x0={1.84} x1={1.94} y0={4.33} y1={4.43} h0={FL1} h1={FL1 + ph * 0.6} m={{color: '#9a9c9e', rough: 0.6}} cast={false} />);
  }
  // base cabinets, unit by unit
  for (let i = 0; i < 4; i++) {
    const k = clamp(cab * 4 - i);
    if (k <= 0) continue;
    const x0 = KX0 + i * UNIT;
    const lift = (1 - k) * 0.3;
    out.push(
      <group key={'cab' + i}>
        <PBox x0={x0 + 0.005} x1={x0 + UNIT - 0.005} y0={KY0} y1={KY1 - 0.01} h0={FL1 + 0.1 + lift} h1={FL1 + 0.8 + lift} m={cabM} />
        <PBox x0={x0 + 0.03} x1={x0 + UNIT - 0.03} y0={KY0 - 0.012} y1={KY0} h0={FL1 + 0.5 + lift} h1={FL1 + 0.52 + lift} m={{color: '#9a958b', rough: 0.5}} cast={false} />
        <PBox x0={x0 + 0.02} x1={x0 + UNIT - 0.02} y0={KY0 + 0.03} y1={KY1 - 0.04} h0={FL1 + lift} h1={FL1 + 0.1 + lift} m={{color: '#5c574f', rough: 0.8}} cast={false} />
      </group>,
    );
  }
  // worktop with the sink and the cooktop
  if (top > 0) {
    const x1 = KX0 + 4 * UNIT * top;
    out.push(<PBox key="top" x0={KX0 - 0.02} x1={x1 + 0.02} y0={KY0 - 0.03} y1={KY1} h0={FL1 + 0.8} h1={FL1 + 0.84} m={topM} />);
    if (x1 > SINK.x1) out.push(<PBox key="sink" x0={SINK.x0} x1={SINK.x1} y0={KY0 + 0.08} y1={KY1 - 0.12} h0={FL1 + 0.835} h1={FL1 + 0.842} m={{color: '#5e6266', rough: 0.3, metal: 0.7}} cast={false} />);
    if (x1 > COOK.x1) out.push(<PBox key="cook" x0={COOK.x0} x1={COOK.x1} y0={KY0 + 0.06} y1={KY1 - 0.08} h0={FL1 + 0.84} h1={FL1 + 0.85} m={{color: '#141518', rough: 0.15}} cast={false} />);
  }
  // range hood and one wall cabinet
  if (hood > 0) {
    const d = (1 - hood) * 0.3;
    out.push(<PBox key="hood" x0={COOK.x0 - 0.1} x1={COOK.x1 + 0.1} y0={KY0 + 0.05} y1={KY1} h0={FL1 + 1.95 + d} h1={FL1 + 2.4 + d} m={{color: '#e2e3e3', rough: 0.35, metal: 0.4}} />);
    out.push(<PBox key="wall" x0={KX0} x1={COOK.x0 - 0.2} y0={KY0 + 0.2} y1={KY1} h0={FL1 + 1.65 + d} h1={FL1 + 2.4 + d} m={cabM} />);
  }
  // faucet
  if (tap > 0) {
    const h = FL1 + 0.84;
    out.push(<Line3D key="tap1" a={[1.75, 4.4, h]} b={[1.75, 4.4, h + 0.32 * tap]} w={0.03} color="#c8cacc" />);
    if (tap > 0.6) out.push(<Line3D key="tap2" a={[1.75, 4.4, h + 0.32]} b={[1.75, 4.24, h + 0.3]} w={0.025} color="#c8cacc" />);
  }
  return <group>{out}</group>;
};

const cam = camTrack([
  [0, [4.6, 1.6, FL1 + 1.7], [2.4, 4.3, FL1 + 0.6], 52],
  [42, [4.5, 1.65, FL1 + 1.7], [2.4, 4.3, FL1 + 0.6], 55],
  [56, [3.3, 2.0, FL1 + 1.9], [1.75, 4.4, FL1 + 0.2], 50],
  [118, [3.2, 2.1, FL1 + 1.9], [1.75, 4.4, FL1 + 0.2], 50],
  [130, [4.6, 1.6, FL1 + 1.7], [2.4, 4.3, FL1 + 0.6], 55],
  [198, [4.4, 1.7, FL1 + 1.7], [2.4, 4.3, FL1 + 0.6], 55],
  [210, [4.6, 1.6, FL1 + 1.9], [2.4, 4.3, FL1 + 0.8], 55],
  [296, [4.4, 1.7, FL1 + 1.9], [2.4, 4.3, FL1 + 0.8], 55],
  [308, [4.2, 1.8, FL1 + 1.5], [2.4, 4.4, FL1 + 1.7], 58],
  [366, [4.0, 1.9, FL1 + 1.5], [2.4, 4.4, FL1 + 1.7], 58],
  [378, [3.2, 2.2, FL1 + 1.7], [1.75, 4.3, FL1 + 0.8], 50],
  [436, [3.1, 2.3, FL1 + 1.7], [1.75, 4.3, FL1 + 0.8], 50],
  [448, [3.4, 2.0, FL1 + 1.7], [1.9, 4.2, FL1 + 0.5], 52],
  [496, [3.3, 2.1, FL1 + 1.7], [1.9, 4.2, FL1 + 0.5], 52],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '設備屋さん：配管の位置', '水・お湯・排水が図面どおりか', false],
  [125, 205, 'キッチン屋さん：キャビネット', '下の収納を1台ずつ据える', false],
  [205, 300, 'キッチン屋さん：天板', 'シンクとコンロの付いた天板をのせる', false],
  [300, 370, 'キッチン屋さん：レンジフード', '吊戸棚も、下地のある壁に', false],
  [370, 440, '設備屋さん：水栓', '水とお湯の管をつなぐ', false],
  [440, 500, '現場監督：水を流して確認', 'シンクの下が濡れていないか', false],
  [500, 600, '次はトイレ・洗面', '水まわりの取り付け', false],
];

const VOICE = 'キッチンは、こうやって付けるんや';
const VOICE_END = 6 + 70;
const FITTER = '#4d5f3c';

export const Ep19: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const pipe = f < 42 ? 1 : ramp(f, 46, 80);
  const cab = f < 42 ? 0.5 + 0.5 * ramp(f, 0, 40) : ramp(f, 132, 196);
  const top = ramp(f, 214, 290);
  const hood = ramp(f, 312, 360);
  const tap = ramp(f, 382, 420);
  const water = f >= 452 && f < 500;
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (f < 42) {
    a = {x: KX0 + 0.3 + 4 * UNIT * cab, y: 3.4, h: FL1, yaw: 90, act: 'press'};
  } else if (f >= 42 && f < 125) {
    kan = {x: 0.7, y: 3.7, h: FL1, yaw: 30, act: f > 70 ? 'point' : 'idle'};
    a = {x: 2.9, y: 3.9, h: FL1, yaw: 160, act: 'measure'};
  } else if (f >= 125 && f < 205) {
    a = {x: KX0 + 0.3 + 4 * UNIT * cab, y: 3.4, h: FL1, yaw: 90, act: 'press'};
  } else if (f >= 205 && f < 300) {
    a = {x: KX0 + 0.3 + 4 * UNIT * top, y: 3.4, h: FL1, yaw: 90, act: 'press'};
  } else if (f >= 300 && f < 370) {
    a = {x: 3.3, y: 3.4, h: FL1, yaw: 90, act: 'press'};
  } else if (f >= 370 && f < 440) {
    a = {x: 1.0, y: 3.6, h: FL1, yaw: 60, act: 'hammer'};
  } else if (f >= 440 && f < 500) {
    kan = {x: 1.0, y: 3.55, h: FL1, yaw: 60, act: 'measure'};
    a = {x: 3.9, y: 3.6, h: FL1, yaw: 150, act: 'idle'};
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
        <Board3D s={{ceil: 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: 0}} />
        <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
        <Cloth3D s={{putty: 0, ceil: 1, wall1: 1, accent: 1, wall2: 1}} />
        <Kitchen3D s={{pipe, cab, top, hood, tap}} />
        {water ? <Line3D a={[1.75, 4.25, FL1 + 1.13]} b={[1.75, 4.25, FL1 + 0.85]} w={0.015} color="#8fc4ff" /> : null}
        {f >= 72 && f < 120 ? <Ring3D p={[1.75, 4.4, FL1 + 0.02]} o={ramp(f, 72, 78)} f={f} r={0.3} /> : null}
        {f >= 104 && f < 125 ? <Check3D p={[1.75, 4.3, FL1 + 0.7]} o={ramp(f, 106, 112)} size={0.25} /> : null}
        {f >= 480 && f < 500 ? <Check3D p={[1.75, 3.85, FL1 + 0.6]} o={ramp(f, 482, 488)} size={0.3} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit={FITTER} vest={FITTER} /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={19}
        hook={['キッチンを付けるところ', '見たことありますか？']}
        title="キッチン"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [88, 124, '配管の位置、図面どおりか見るんや'],
          [444, 498, 'シンクの下、水漏れないか見とき'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep19.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>キッチンがついた</span>
      </div>
    </AbsoluteFill>
  );
};
