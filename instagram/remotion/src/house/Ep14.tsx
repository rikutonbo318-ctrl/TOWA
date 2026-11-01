import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {FL1, FL2, W} from './House';
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

// 内部その2：断熱検査（すき間の手直し → 検査員が壁・2階・気密テープを確認 → 合格）
const cam = camTrack([
  [0, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [42, [W + 10, -15, 17], [4.5, 3.0, 3.6], 50],
  [56, [2.2, 3.6, 1.8], [0, 2.5, 1.6], 50],
  [118, [2.0, 3.5, 1.8], [0, 2.5, 1.6], 50],
  [130, [4.6, 3.6, 1.9], [0, 1.9, 1.5], 55],
  [198, [4.3, 3.5, 1.9], [0, 1.9, 1.5], 55],
  [210, [3.4, 3.9, 1.9], [0, 2.0, 1.4], 52],
  [296, [3.1, 3.8, 1.9], [0, 2.0, 1.4], 52],
  [308, [3.6, 3.5, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [366, [3.4, 3.4, FL2 + 1.7], [0, 2.2, FL2 + 1.3], 55],
  [378, [1.6, 3.4, 1.3], [0, 2.4, 0.9], 50],
  [436, [1.4, 3.3, 1.3], [0, 2.4, 0.9], 50],
  [448, [4.6, 3.6, 1.9], [0, 1.9, 1.5], 55],
  [496, [4.4, 3.5, 1.9], [0, 1.9, 1.5], 55],
  [510, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [600, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, '現場監督：検査の前に自主チェック', 'すき間を見つけたら、その場で直す', false],
  [125, 205, '検査員さん：到着', '図面と同じ断熱材かを確認', true],
  [205, 300, '検査員さん：1階の壁', '柱のまわりにすき間がないか見る', true],
  [300, 370, '検査員さん：2階の壁', '窓のまわりも詰まっているか', true],
  [370, 440, '検査員さん：気密テープ', 'コンセントまわりもふさがっているか', true],
  [440, 500, '検査員さん：写真で記録', '壁をふさぐ前の最後の記録', true],
  [500, 600, '次はボード張り', '天井・壁・フローリング', false],
];

const VOICE = '壁の中、すき間あったらあかんで';
const VOICE_END = 6 + 70;
// the gap the site manager finds and fills (west wall, between two studs)
const GAP = {y0: 2.3, y1: 2.73, h0: FL1 + 1.0, h1: FL1 + 1.6};

export const Ep14: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const fill = ramp(f, 86, 116);
  const stamp = ramp(f, 500, 510) * (1 - ramp(f, 522, 530));
  const sub = ramp(f, 6, 10) * (1 - ramp(f, VOICE_END, VOICE_END + 6));
  const flash = f >= 450 && f < 500 && (f - 450) % 16 < 3;

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: W + 1.6, y: -1.8, yaw: 135, act: 'idle'};
  let a: Pp | null = {x: W + 1.4, y: -2.6, yaw: 0, act: f > 30 ? 'wave' : 'idle'};
  let insp: Pp | null = null;
  if (f >= 42 && f < 125) {
    kan = {x: 0.75, y: 1.85, h: FL1, yaw: 180, act: f < 80 ? 'point' : 'press'};
    a = null;
  } else if (f >= 125 && f < 205) {
    insp = {x: 2.2 - 0.9 * ramp(f, 130, 170), y: 2.6, h: FL1, yaw: 180, act: f < 170 ? 'walk' : 'idle'};
    kan = {x: 1.5, y: 0.9, h: FL1, yaw: 120, act: 'idle'};
    a = null;
  } else if (f >= 205 && f < 300) {
    insp = {x: 0.8, y: 1.2 + 1.6 * ramp(f, 210, 290), h: FL1, yaw: 180, act: 'measure'};
    kan = {x: 2.6, y: 0.9, h: FL1, yaw: 150, act: 'idle'};
    a = null;
  } else if (f >= 300 && f < 370) {
    insp = {x: 0.8, y: 0.8 + 1.4 * ramp(f, 310, 362), h: FL2, yaw: 180, act: 'measure'};
    kan = {x: 2.4, y: 0.9, h: FL2, yaw: 150, act: 'idle'};
    a = null;
  } else if (f >= 370 && f < 440) {
    insp = {x: 0.75, y: 2.0, h: FL1, yaw: 160, act: 'point'};
    a = null;
  } else if (f >= 440 && f < 500) {
    insp = {x: 1.6, y: 2.4, h: FL1, yaw: 180, act: 'measure'};
    kan = {x: 2.6, y: 0.9, h: FL1, yaw: 150, act: 'idle'};
    a = null;
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
        {/* the gap: a dark hole in front of the insulation, filled with a fresh piece */}
        {f < 125 ? (
          <group>
            {fill < 1 ? <PBox x0={0.045} x1={0.05} y0={GAP.y0} y1={GAP.y1} h0={GAP.h0} h1={GAP.h1} m={{color: '#4a4036', rough: 1}} cast={false} /> : null}
            {fill > 0 ? <PBox x0={0.04} x1={0.052} y0={GAP.y0} y1={GAP.y1} h0={GAP.h0} h1={GAP.h0 + (GAP.h1 - GAP.h0) * fill} m={{color: '#f6dc78', rough: 1}} cast={false} /> : null}
          </group>
        ) : null}
        {f >= 60 && f < 90 ? <Ring3D p={[0.1, (GAP.y0 + GAP.y1) / 2, (GAP.h0 + GAP.h1) / 2]} o={ramp(f, 60, 66)} f={f} r={0.4} vertical /> : null}
        {f >= 104 && f < 125 ? <Check3D p={[0.2, (GAP.y0 + GAP.y1) / 2, GAP.h1 + 0.3]} o={ramp(f, 106, 112)} size={0.3} /> : null}
        {f >= 260 && f < 300 ? <Check3D p={[0.2, 1.9, FL1 + 2.0]} o={ramp(f, 264, 270)} size={0.35} /> : null}
        {f >= 340 && f < 370 ? <Check3D p={[0.2, 1.6, FL2 + 2.0]} o={ramp(f, 344, 350)} size={0.35} /> : null}
        {f >= 410 && f < 440 ? <Check3D p={[0.2, 2.3, FL1 + 0.6]} o={ramp(f, 414, 420)} size={0.25} /> : null}
        {flash ? <pointLight position={[1.2, FL1 + 1.6, -2.4]} intensity={6} distance={4} color="#ffffff" /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} suit="#5a4a3a" /> : null}
        {insp ? <Person3D x={insp.x} y={insp.y} h={insp.h ?? 0} yaw={insp.yaw} act={insp.act} f={f} phase={4} suit="#2d3a4a" vest="#2d3a4a" helmet="#ffffff" /> : null}
      </Scene3D>
      <OverlayV2
        f={f}
        no={14}
        hook={['断熱材のすき間', '見たことありますか？']}
        title="断熱検査"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [88, 124, '検査の前に、自分らで先に見るんや'],
          [444, 498, '壁ふさいだら、もう見られへんからな'],
        ]}
      />
      <Sequence from={6} durationInFrames={90}>
        <Audio src={staticFile('voice/ep14.wav')} />
      </Sequence>
      {flash ? <div style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.35)'}} /> : null}
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: sub}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          {VOICE}
        </span>
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>断熱検査 合格</span>
      </div>
    </AbsoluteFill>
  );
};
