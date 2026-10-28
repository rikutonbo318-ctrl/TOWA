import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, FDN_TOP, W} from './House';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Excavator3D, Site3D} from './Site3D';
import {Fdn3D, SUTE_TOP, Truck3D} from './Fdn3D';
import {ANCHORS, Rebar3D, SLAB_TOP} from './Rebar3D';

const cam = camTrack([
  [0, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [45, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [58, [W + 4.0, -6.0, 3.0], [W - 1.0, -1.0, 0.8], 50],
  [106, [W + 3.5, -5.5, 3.0], [W - 1.5, -0.8, 0.8], 50],
  [118, [3.0, -2.2, 2.2], [3.0, 1.5, -0.1], 52],
  [166, [3.6, -2.2, 2.2], [3.6, 1.5, -0.1], 52],
  [178, [1.0, -2.0, 1.4], [1.2, 0.4, -0.15], 52],
  [230, [1.4, -2.0, 1.4], [1.4, 0.4, -0.15], 52],
  [242, [-2.2, -2.2, 2.4], [0.6, 0.6, 0.1], 50],
  [296, [-2.0, -1.6, 2.4], [0.6, 0.9, 0.1], 50],
  [308, [W + 2.8, 1.2, 2.2], [W, 3.0, 0.3], 50],
  [356, [W + 2.8, 2.2, 2.2], [W, 4.0, 0.3], 50],
  [368, [4.5, -5.0, 4.0], [4.5, 1.5, 0], 50],
  [426, [4.5, -4.6, 3.8], [4.5, 1.8, 0], 50],
  [438, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [496, [4.5, -6.0, 12.5], [4.5, 3.1, -0.3], 50],
  [512, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [600, [W + 8.5, -12.5, 12.5], [4.5, 3.0, -0.3], 50],
]);

const STEPS: Step[] = [
  [45, 112, '検査員さん：到着', '住宅の保険の、第三者の検査員がチェック', true],
  [112, 172, '検査：鉄筋の太さ・間隔', '図面どおりの太さで、20cmごとか', true],
  [172, 236, '検査：かぶり厚さ', 'スペーサーで、鉄筋が浮いているか', true],
  [236, 302, '検査：つなぎ目の長さ', '鉄筋どうしの重なりが足りているか', true],
  [302, 362, '検査：アンカーボルト', '位置・間隔・高さが図面どおりか', true],
  [362, 432, '現場監督：記録写真', '黒板を入れて、全部写真に残す', true],
  [432, 500, '配筋検査：合格', '合格してから、コンクリートを打てる', true],
  [500, 600, '次は基礎のコンクリート', 'ベースと立ち上がりを打つ', false],
];

const INSPECTOR = {suit: '#e9ecef', vest: '#2f6fd1'};

export const Ep04: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);
  const stamp = ramp(f, 446, 456) * (1 - ramp(f, 492, 500));
  const flash = [374, 392, 410].reduce((m, t) => Math.max(m, ramp(f, t, t + 2) * (1 - ramp(f, t + 2, t + 8))), 0);
  const tape = ramp(f, 120, 150);
  const lap = ramp(f, 246, 280);

  type P = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: P = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let ins: P | null = null;
  if (f < 112) {
    ins = {x: W + 2.6 - 1.2 * ramp(f, 40, 90), y: -3.2 + 1.6 * ramp(f, 40, 90), yaw: 120, act: f > 40 && f < 90 ? 'walk' : 'idle'};
    kan = {x: W + 0.6, y: -0.8, yaw: 300, act: f > 92 ? 'wave' : 'idle'};
  } else if (f < 172) {
    ins = {x: 3.2, y: 0.8, h: SUTE_TOP, yaw: 90, act: 'measure'};
    kan = {x: 2.2, y: -0.6, yaw: 60, act: 'idle'};
  } else if (f < 236) {
    ins = {x: 1.4, y: 0.7, h: SUTE_TOP, yaw: 270, act: 'press'};
    kan = {x: 0.4, y: -0.6, yaw: 45, act: 'idle'};
  } else if (f < 302) {
    ins = {x: 0.7, y: 0.9, h: SUTE_TOP, yaw: 225, act: 'point'};
    kan = {x: -0.7, y: -0.7, yaw: 45, act: 'measure'};
  } else if (f < 362) {
    ins = {x: W + 0.55, y: 2.0 + 2.2 * ramp(f, 306, 356), yaw: 90, act: 'measure'};
    kan = {x: W + 1.4, y: 1.4 + 2.2 * ramp(f, 310, 358), yaw: 90, act: 'walk'};
  } else if (f < 432) {
    kan = {x: 4.5, y: -1.0, yaw: 90, act: 'point'};
    ins = {x: 3.3, y: -0.9, yaw: 60, act: 'idle'};
  } else if (f < 500) {
    kan = {x: 3.9, y: -1.6, yaw: 270, act: 'wave'};
    ins = {x: 5.1, y: -1.6, yaw: 270, act: 'idle'};
  } else {
    kan = {x: 3.8, y: -2.0, yaw: 270, act: f > 512 ? 'wave' : 'idle'};
    ins = {x: 5.4, y: -2.0, yaw: 270, act: 'idle'};
  }

  return (
    <AbsoluteFill>
      <Scene3D cam={c} noSite>
        <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
        <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
        <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1}} />
        <Excavator3D x={W + 2.8} y={D / 2} yaw={Math.PI} boom={0.9} arm={-1.9} bucket={-1.2} />
        {/* bar spacing: tape over the mat */}
        {f >= 112 && f < 172 ? (
          <group>
            <Line3D a={[2.5, 0.75, SUTE_TOP + 0.1]} b={[2.5 + 1.0 * tape, 0.75, SUTE_TOP + 0.1]} w={0.025} color="#f6d21f" emissive />
            {[0, 1, 2, 3, 4].map((i) => (
              <Ring3D key={i} p={[2.5 + i * 0.2, 0.75, SUTE_TOP + 0.06]} o={ramp(f, 130 + i * 5, 134 + i * 5)} f={f} r={0.07} />
            ))}
            <Check3D p={[3.0, 0.75, SUTE_TOP + 0.6]} o={ramp(f, 158, 164)} size={0.45} />
          </group>
        ) : null}
        {/* cover: spacer under the bars */}
        {f >= 172 && f < 236 ? (
          <group>
            <Ring3D p={[1.2, 0.45, SUTE_TOP]} o={ramp(f, 184, 190)} f={f} r={0.14} />
            <Line3D a={[1.33, 0.45, SUTE_TOP]} b={[1.33, 0.45, SUTE_TOP + 0.07 * ramp(f, 192, 212)]} w={0.02} color="#f6d21f" emissive />
            <Check3D p={[1.2, 0.45, SUTE_TOP + 0.5]} o={ramp(f, 216, 222)} size={0.4} />
          </group>
        ) : null}
        {/* lap length at the south-west corner */}
        {f >= 236 && f < 302 ? (
          <group>
            <Line3D a={[0.05, 0.08, FDN_TOP - 0.06]} b={[0.05 + 0.6 * lap, 0.08, FDN_TOP - 0.06]} w={0.03} color="#f6d21f" emissive />
            <Line3D a={[0.08, 0.05, FDN_TOP - 0.1]} b={[0.08, 0.05 + 0.6 * lap, FDN_TOP - 0.1]} w={0.03} color="#f6d21f" emissive />
            <Check3D p={[0.3, 0.3, FDN_TOP + 0.4]} o={ramp(f, 284, 290)} size={0.45} />
          </group>
        ) : null}
        {f >= 302 && f < 362
          ? ANCHORS.filter(([x]) => x > W - 0.1).map(([x, y], i) => (
              <group key={'ac' + i}>
                <Ring3D p={[x, y, FDN_TOP + 0.02]} o={ramp(f, 312 + i * 9, 316 + i * 9)} f={f} r={0.16} />
                <Check3D p={[x, y, FDN_TOP + 0.45]} o={ramp(f, 318 + i * 9, 322 + i * 9)} size={0.4} />
              </group>
            ))
          : null}
        <Truck3D x={W + 2.5} y={-7.0} />
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {ins ? <Person3D x={ins.x} y={ins.y} h={ins.h ?? 0} yaw={ins.yaw} act={ins.act} f={f} phase={4} suit={INSPECTOR.suit} vest={INSPECTOR.vest} /> : null}
      </Scene3D>
      {/* photo board + shutter flash while recording */}
      {f >= 366 && f < 432 ? (
        <div style={{position: 'absolute', left: 110, top: 760, width: 330, height: 230, background: '#1f4d36', border: '10px solid #b88a55', borderRadius: 8, fontFamily: FONT, color: '#fff', padding: '14px 18px', boxSizing: 'border-box', opacity: ramp(f, 366, 372)}}>
          <div style={{fontSize: 30, fontWeight: 900}}>工事名 渦巻ハウス</div>
          <div style={{fontSize: 28, fontWeight: 700, marginTop: 8}}>工種 基礎配筋</div>
          <div style={{fontSize: 28, fontWeight: 700, marginTop: 8}}>検査 配筋検査</div>
        </div>
      ) : null}
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.85, pointerEvents: 'none'}} />
      <OverlayV2
        f={f}
        no={4}
        hook={['コンクリートを打つ前に', '必ずある検査']}
        title="配筋検査"
        steps={STEPS}
        total={7}
        ctaAt={528}
        uzu={[
          [116, 172, '間隔は、メジャーを当てて確かめる'],
          [456, 500, '合格せんと、コンクリートは打てへん'],
        ]}
      />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', opacity: stamp, transform: `rotate(-8deg) scale(${1.4 - 0.4 * stamp})`}}>
        <span style={{fontFamily: FONT, border: '12px solid #d62b2b', color: '#d62b2b', fontWeight: 900, fontSize: 130, padding: '6px 40px', borderRadius: 24, background: 'rgba(255,255,255,0.85)'}}>合格</span>
      </div>
    </AbsoluteFill>
  );
};
