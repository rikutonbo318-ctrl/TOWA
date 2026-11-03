import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {FL1, M, W} from './House';
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
import {Cloth3D} from './Ep18';
import {Kitchen3D} from './Ep19';

// 設備その2：トイレ・洗面（NG探し：冒頭で「どこがダメ？」→ 最後に答え＝便器の根元から水もれ）
export type WcState = {drain?: number; cf?: number; toilet?: number; vanity?: number};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const WC = {x0: 4 * M, x1: 5 * M, y0: 5 * M, y1: 7 * M};
const WASH = {x0: 0.08, x1: 2 * M, y0: 5 * M, y1: 7 * M - 0.08};
const TX = (WC.x0 + WC.x1) / 2;
const white = {color: '#f4f4f1', rough: 0.3, emissive: '#202020', emissiveIntensity: 0.2};
const cfM = {color: '#c9c5bd', rough: 0.7, emissive: '#151515', emissiveIntensity: 0.2};

export const Wc3D: React.FC<{s: WcState}> = ({s}) => {
  const out: React.ReactNode[] = [];
  const cf = s.cf ?? 0;
  const t = s.toilet ?? 0;
  const v = s.vanity ?? 0;
  if ((s.drain ?? 0) > 0 && t < 0.3) out.push(<PBox key="drain" x0={TX - 0.06} x1={TX + 0.06} y0={5.7} y1={5.82} h0={FL1} h1={FL1 + 0.08 * (s.drain ?? 0)} m={{color: '#8e9295', rough: 0.6}} cast={false} />);
  // cushion flooring in the toilet and the washroom
  if (cf > 0) {
    out.push(<PBox key="cf1" x0={WC.x0 + 0.02} x1={WC.x1 - 0.02} y0={WC.y0} y1={WC.y0 + (WC.y1 - 0.08 - WC.y0) * cf} h0={FL1 + 0.013} h1={FL1 + 0.017} m={cfM} cast={false} />);
    out.push(<PBox key="cf2" x0={WASH.x0} x1={WASH.x1} y0={WASH.y0} y1={WASH.y0 + (WASH.y1 - WASH.y0) * cf} h0={FL1 + 0.013} h1={FL1 + 0.017} m={cfM} cast={false} />);
  }
  // toilet: bowl, tank, seat
  if (t > 0) {
    const d = (1 - clamp(t * 1.5)) * 0.4;
    out.push(<PBox key="base" x0={TX - 0.12} x1={TX + 0.12} y0={5.55} y1={5.95} h0={FL1 + 0.017 + d} h1={FL1 + 0.3 + d} m={white} />);
    out.push(<PBox key="bowl" x0={TX - 0.19} x1={TX + 0.19} y0={5.42} y1={5.98} h0={FL1 + 0.28 + d} h1={FL1 + 0.4 + d} m={white} />);
    out.push(<PBox key="seat" x0={TX - 0.2} x1={TX + 0.2} y0={5.4} y1={5.96} h0={FL1 + 0.4 + d} h1={FL1 + 0.43 + d} m={{...white, color: '#fbfbf9'}} />);
    out.push(<PBox key="hole" x0={TX - 0.12} x1={TX + 0.12} y0={5.5} y1={5.84} h0={FL1 + 0.43 + d} h1={FL1 + 0.433 + d} m={{color: '#8a959c', rough: 0.2}} cast={false} />);
    if (t > 0.6) out.push(<PBox key="tank" x0={TX - 0.22} x1={TX + 0.22} y0={5.96} y1={6.18} h0={FL1 + 0.43} h1={FL1 + 0.85} m={white} />);
  }
  // vanity: cabinet, counter with basin, mirror
  if (v > 0) {
    const d = (1 - clamp(v * 1.5)) * 0.4;
    out.push(<PBox key="vcab" x0={0.1} x1={0.65} y0={5.0} y1={5.75} h0={FL1 + 0.017 + d} h1={FL1 + 0.78 + d} m={{color: '#e8e2d6', rough: 0.6, emissive: '#1a1a1a', emissiveIntensity: 0.2}} />);
    out.push(<PBox key="vtop" x0={0.1} x1={0.68} y0={4.98} y1={5.77} h0={FL1 + 0.78 + d} h1={FL1 + 0.85 + d} m={white} />);
    out.push(<PBox key="basin" x0={0.22} x1={0.55} y0={5.15} y1={5.6} h0={FL1 + 0.846 + d} h1={FL1 + 0.852 + d} m={{color: '#cfd6da', rough: 0.2}} cast={false} />);
    if (v > 0.6) out.push(<PBox key="mirror" x0={0.095} x1={0.11} y0={5.05} y1={5.7} h0={FL1 + 1.05} h1={FL1 + 1.85} m={{color: '#b9c7cf', rough: 0.1, metal: 0.6}} cast={false} />);
  }
  return <group>{out}</group>;
};

const WC_CAM: [number, number, number] = [5.5, 3.4, FL1 + 1.9];
const WC_AT: [number, number, number] = [TX, 5.6, FL1 + 0.3];
const cam = camTrack([
  [0, WC_CAM, WC_AT, 44],
  [42, [5.45, 3.45, FL1 + 1.9], WC_AT, 46],
  [56, WC_CAM, WC_AT, 50],
  [118, [5.4, 3.5, FL1 + 1.9], WC_AT, 50],
  [130, [5.4, 3.6, FL1 + 1.9], [TX - 0.6, 5.6, FL1], 56],
  [198, [5.3, 3.7, FL1 + 1.9], [TX - 0.6, 5.6, FL1], 56],
  [210, WC_CAM, WC_AT, 50],
  [296, [5.4, 3.5, FL1 + 1.9], WC_AT, 50],
  [308, [0.95, 3.3, FL1 + 1.7], [0.4, 5.4, FL1 + 0.9], 55],
  [366, [1.0, 3.4, FL1 + 1.7], [0.4, 5.4, FL1 + 0.9], 55],
  [378, WC_CAM, WC_AT, 50],
  [436, [5.4, 3.5, FL1 + 1.9], WC_AT, 50],
  [448, [5.0, 4.4, FL1 + 1.3], [TX, 5.6, FL1], 48],
  [496, [4.95, 4.45, FL1 + 1.3], [TX, 5.6, FL1], 48],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '設備屋さん：排水管の位置', 'トイレの真ん中に来ているか', false],
  [125, 205, '内装屋さん：床', '水に強いクッションフロア', false],
  [205, 300, '設備屋さん：便器', '排水管にまっすぐ差し込む', false],
  [300, 370, '設備屋さん：洗面台', '水・お湯・排水をつなぐ', false],
  [370, 440, '設備屋さん：水を流す', '何回か流して確かめる', false],
  [440, 500, '答え：便器の根元から水もれ', '床が濡れていたら、つけ直し', false],
  [500, 600, '次は照明とスイッチ', '電気の器具つけ', false],
];

const VOICE = 'トイレ付けたら、水漏れチェックや';
const V_AT = 446;
const PLUMBER = '#2f4f6f';

export const Ep20: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const hookF = f < 42;
  const drain = hookF ? 1 : ramp(f, 46, 80);
  const cf = hookF ? 1 : ramp(f, 132, 196);
  const toilet = hookF ? 1 : ramp(f, 214, 290);
  const vanity = hookF ? 1 : ramp(f, 312, 360);
  // the NG: water at the foot of the toilet (shown in the hook, answered at the end)
  const leak = hookF ? 1 : f >= 400 && f < 500 ? ramp(f, 400, 430) * (1 - ramp(f, 486, 496)) : 0;
  const answer = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, V_AT, V_AT + 4) * (1 - ramp(f, V_AT + 70, V_AT + 76));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  if (hookF) {
    a = null;
  } else if (f < 125) {
    a = {x: 3.45, y: 5.5, h: FL1, yaw: 0, act: 'measure'};
  } else if (f < 205) {
    a = {x: WC.x1 + 0.3, y: 5.0, h: FL1, yaw: 150, act: 'press'};
  } else if (f < 300) {
    a = {x: 3.45, y: 5.6, h: FL1, yaw: 0, act: 'press'};
  } else if (f < 370) {
    a = {x: 1.15, y: 5.45, h: FL1, yaw: 180, act: 'press'};
  } else if (f < 440) {
    a = {x: 3.45, y: 5.5, h: FL1, yaw: 0, act: 'idle'};
  } else if (f < 500) {
    kan = {x: 4.95, y: 4.9, h: FL1, yaw: 130, act: 'point'};
    a = {x: 3.45, y: 5.6, h: FL1, yaw: 0, act: f > 470 ? 'hammer' : 'idle'};
  } else {
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
        <Kitchen3D s={{pipe: 0, cab: 1, top: 1, hood: 1, tap: 1}} />
        <Wc3D s={{drain, cf, toilet, vanity}} />
        {leak > 0 ? <group>
            <PBox x0={TX - 0.22} x1={TX + 0.12} y0={5.24} y1={5.46} h0={FL1 + 0.0175} h1={FL1 + 0.019} m={{color: '#a9cde9', rough: 0.02, opacity: 0.35 + 0.2 * leak, emissive: '#5d8fb8', emissiveIntensity: 0.2}} cast={false} />
            <PBox x0={TX - 0.3} x1={TX - 0.12} y0={5.36} y1={5.62} h0={FL1 + 0.0175} h1={FL1 + 0.019} m={{color: '#a9cde9', rough: 0.02, opacity: 0.35 + 0.2 * leak, emissive: '#5d8fb8', emissiveIntensity: 0.2}} cast={false} />
          </group> : null}
        {f >= 72 && f < 120 ? <Ring3D p={[TX, 5.76, FL1 + 0.03]} o={ramp(f, 72, 78)} f={f} r={0.25} /> : null}
        {f >= 104 && f < 125 ? <Check3D p={[TX, 5.76, FL1 + 0.5]} o={ramp(f, 106, 112)} size={0.25} /> : null}
        {f >= 452 && f < 486 ? <Ring3D p={[TX - 0.1, 5.4, FL1 + 0.03]} o={ramp(f, 452, 458)} f={f} r={0.42} /> : null}
        {f >= 490 && f < 500 ? <Check3D p={[TX - 0.1, 5.4, FL1 + 0.6]} o={ramp(f, 490, 494)} size={0.3} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit={PLUMBER} vest={PLUMBER} /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={20}
        hook={['このトイレ、どこがダメ？', '答えは最後に']}
        title="トイレ・洗面"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [88, 124, '排水管、便器の真ん中に来てるか見るんや'],
          [380, 436, 'さて、最初のトイレ、どこがダメやった？'],
        ]}
      />
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center', opacity: answer}}>
        <div style={{display: 'inline-block', fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 900, fontSize: 56, padding: '14px 36px', borderRadius: 18, lineHeight: 1.35}}>
          <span style={{color: '#ffd34d'}}>答え</span>　便器の根元から水もれ
          <div style={{fontSize: 36, fontWeight: 800}}>引き渡し前に、床が濡れていないか見る</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
