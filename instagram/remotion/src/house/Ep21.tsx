import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {CH, FL1, W} from './House';
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
import {Wc3D} from './Ep20';

// 仕上げその4：照明・スイッチ・コンセント（NG探し：冒頭で「どこがおかしい？」→ 最後に答え＝1つだけ点かない照明）
const CEIL = FL1 + CH;
const DL: [number, number][] = [
  [1.0, 1.1], [2.3, 1.1], [3.6, 1.1],
  [1.0, 2.4], [2.3, 2.4], [3.6, 2.4],
];
const NG = 4; // the downlight that stays dark
const PEND: [number, number][] = [[1.55, 3.55], [2.35, 3.55]];
const lampOn = {color: '#fff6dc', emissive: '#ffe7b0', emissiveIntensity: 2.4, rough: 0.3};
const lampOff = {color: '#d9d9d6', rough: 0.4, emissive: '#151515', emissiveIntensity: 0.2};
const plate = {color: '#f6f6f3', rough: 0.35, emissive: '#2a2a2a', emissiveIntensity: 0.25};

export type LightState = {dl?: number; pend?: number; plate?: number; on?: number; fix?: number};
export const Lights3D: React.FC<{s: LightState}> = ({s}) => {
  const out: React.ReactNode[] = [];
  const dl = s.dl ?? 0;
  const on = s.on ?? 0;
  const fix = s.fix ?? 0;
  DL.forEach(([x, y], i) => {
    if (dl * DL.length <= i) return;
    const lit = i === NG ? fix > 0.5 : on * DL.length > i;
    out.push(<PBox key={'dl' + i} x0={x - 0.1} x1={x + 0.1} y0={y - 0.1} y1={y + 0.1} h0={CEIL - 0.012} h1={CEIL - 0.001} m={lit ? lampOn : lampOff} cast={false} />);
  });
  const p = s.pend ?? 0;
  PEND.forEach(([x, y], i) => {
    if (p <= i * 0.5) return;
    const drop = Math.min(1, (p - i * 0.5) * 2);
    const lit = on > 0.99;
    const h = CEIL - 0.7 * drop;
    out.push(<PBox key={'pc' + i} x0={x - 0.006} x1={x + 0.006} y0={y - 0.006} y1={y + 0.006} h0={h} h1={CEIL} m={{color: '#222'}} cast={false} />);
    out.push(<PBox key={'ps' + i} x0={x - 0.13} x1={x + 0.13} y0={y - 0.13} y1={y + 0.13} h0={h - 0.2} h1={h} m={lit ? {...lampOn, color: '#f3e3c3', emissiveIntensity: 1.4} : {color: '#e7e1d4', rough: 0.5}} />);
  });
  const pl = s.plate ?? 0;
  if (pl > 0) {
    // switch plate by the door and an outlet low on the same wall
    out.push(<PBox key="sw" x0={0.095} x1={0.11} y0={3.3} y1={3.3 + 0.12 * Math.min(1, pl * 2)} h0={FL1 + 1.12} h1={FL1 + 1.32} m={plate} cast={false} />);
    if (pl > 0.5) out.push(<PBox key="ot" x0={0.095} x1={0.11} y0={3.3} y1={3.42} h0={FL1 + 0.2} h1={FL1 + 0.4} m={plate} cast={false} />);
  }
  if (on > 0.3) {
    out.push(<pointLight key="l1" position={[1.6, CEIL - 0.3, -1.7]} intensity={0.45 * on} distance={4} color="#ffe2b0" />);
    out.push(<pointLight key="l2" position={[3.6, CEIL - 0.3, -1.7]} intensity={0.45 * on} distance={4} color="#ffe2b0" />);
  }
  return <group>{out}</group>;
};

const ROOM_CAM: [number, number, number] = [3.9, 0.4, FL1 + 1.45];
const ROOM_AT: [number, number, number] = [2.0, 2.3, CEIL - 0.1];
const cam = camTrack([
  [0, ROOM_CAM, ROOM_AT, 64],
  [42, [3.85, 0.45, FL1 + 1.45], ROOM_AT, 62],
  [56, ROOM_CAM, ROOM_AT, 62],
  [118, [3.8, 0.5, FL1 + 1.45], ROOM_AT, 62],
  [130, [3.6, 1.6, FL1 + 1.5], [1.9, 3.6, FL1 + 1.6], 56],
  [198, [3.5, 1.7, FL1 + 1.5], [1.9, 3.6, FL1 + 1.6], 56],
  [210, [2.0, 2.2, FL1 + 1.35], [0.1, 3.35, FL1 + 0.8], 52],
  [296, [1.9, 2.25, FL1 + 1.35], [0.1, 3.35, FL1 + 0.8], 52],
  [308, ROOM_CAM, ROOM_AT, 62],
  [366, [3.8, 0.5, FL1 + 1.45], ROOM_AT, 62],
  [378, ROOM_CAM, ROOM_AT, 62],
  [436, [3.8, 0.5, FL1 + 1.45], ROOM_AT, 62],
  [448, [3.6, 1.2, FL1 + 1.3], [DL[NG][0], DL[NG][1], CEIL], 50],
  [496, [3.55, 1.25, FL1 + 1.3], [DL[NG][0], DL[NG][1], CEIL], 50],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '電気屋さん：照明', '天井のダウンライトをつける', false],
  [125, 205, '電気屋さん：ペンダント', '高さを決めて吊る', false],
  [205, 300, '電気屋さん：スイッチ・コンセント', 'プレートをつける', false],
  [300, 370, '電気屋さん：電気を通す', '全部の照明を点けてみる', false],
  [370, 440, '渦さん：全部押して確かめる', 'スイッチとコンセントの数', false],
  [440, 500, '答え：1つだけ点かない照明', '引き渡し前に見つけて直す', false],
  [500, 600, '次は最終回、完成', '最後に見るところ', false],
];

const VOICE = 'スイッチ、全部押してみた？';
const V_AT = 446;
const ELEC = '#4a4f2f';

export const Ep21: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const hookF = f < 42;
  const dl = hookF ? 1 : ramp(f, 46, 110);
  const pend = hookF ? 1 : ramp(f, 132, 196);
  const pl = hookF ? 1 : ramp(f, 216, 286);
  const on = hookF ? 1 : ramp(f, 306, 360);
  const fix = f >= 486 ? 1 : 0;
  const answer = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, V_AT, V_AT + 4) * (1 - ramp(f, V_AT + 70, V_AT + 76));

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = null;
  if (hookF) {
    a = null;
  } else if (f < 125) {
    a = {x: 1.0 + Math.min(2, Math.floor((f - 42) / 28)) * 1.1, y: 2.0, h: FL1, yaw: 90, act: 'press'};
  } else if (f < 205) {
    a = {x: 2.0, y: 3.0, h: FL1, yaw: 90, act: 'measure'};
  } else if (f < 300) {
    a = {x: 0.5, y: 4.15, h: FL1, yaw: 180, act: 'press'};
  } else if (f < 370) {
    a = {x: 0.6, y: 1.1, h: FL1, yaw: 180, act: 'press'};
    kan = {x: 1.2, y: 1.0, h: FL1, yaw: 60, act: 'idle'};
  } else if (f < 440) {
    kan = {x: 0.6, y: 3.0, h: FL1, yaw: 180, act: 'press'};
  } else if (f < 500) {
    kan = {x: 1.5, y: 1.3, h: FL1, yaw: 45, act: 'point'};
    a = {x: 3.3, y: 3.1, h: FL1, yaw: 200, act: f > 470 ? 'press' : 'idle'};
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
        <Wc3D s={{drain: 1, cf: 1, toilet: 1, vanity: 1}} />
        <Lights3D s={{dl, pend, plate: pl, on, fix}} />
        {f >= 452 && f < 486 ? <Ring3D p={[DL[NG][0], DL[NG][1], CEIL - 0.02]} o={ramp(f, 452, 458)} f={f} r={0.22} /> : null}
        {f >= 488 && f < 500 ? <Check3D p={[DL[NG][0], DL[NG][1], CEIL - 0.4]} o={ramp(f, 488, 492)} size={0.25} /> : null}
        {f >= 250 && f < 296 ? <Ring3D p={[0.12, 3.36, FL1 + 1.22]} o={ramp(f, 250, 256)} f={f} r={0.16} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit={ELEC} vest={ELEC} /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={21}
        hook={['この部屋、どこがおかしい？', '答えは最後に']}
        title="照明・スイッチ"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [230, 296, 'スイッチの高さ、手が届くか見てな'],
          [380, 436, 'さて、最初の部屋、どこがおかしかった？'],
        ]}
      />
      <Sequence from={V_AT} durationInFrames={80}>
        <Audio src={staticFile('voice/ep21.wav')} />
      </Sequence>
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center', opacity: answer}}>
        <div style={{display: 'inline-block', fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 900, fontSize: 56, padding: '14px 36px', borderRadius: 18, lineHeight: 1.35}}>
          <span style={{color: '#ffd34d'}}>答え</span>　1つだけ点かない照明
          <div style={{fontSize: 36, fontWeight: 800}}>引き渡し前に、スイッチを全部押して確かめる</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
