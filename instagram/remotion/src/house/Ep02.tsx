import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {D, M, W} from './House';
import {Scene3D} from './Scene3D';
import {Act3, camTrack, Check3D, Line3D, Person3D, Ring3D} from './Kit3D';
import {Excavator3D, HOLE, NUKI_H, Site3D} from './Site3D';
import {BOT, Compactor3D, Fdn3D, GRAVEL_TOP, RebarStack, SUTE_TOP, Truck3D} from './Fdn3D';

const cam = camTrack([
  [0, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [45, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [58, [W + 5, -6, 4.5], [5.0, 2.0, -0.3], 50],
  [106, [W + 5, -5, 4.5], [5.0, 2.6, -0.3], 50],
  [118, [-3.5, -6.5, 5], [3.0, 2.0, -0.3], 50],
  [166, [-3.5, -5.5, 5], [3.0, 2.6, -0.3], 50],
  [178, [4.5, -8.5, 7.5], [4.5, 3.0, -0.3], 50],
  [230, [4.5, -8.0, 7.5], [4.5, 3.0, -0.3], 50],
  [244, [-2.8, -5.2, 4.0], [3.0, 1.5, -0.3], 50],
  [304, [-2.8, -4.0, 4.0], [3.0, 2.5, -0.3], 50],
  [318, [4.8, -5.8, 3.4], [1.0, 0.8, -0.3], 50],
  [374, [5.4, -5.8, 3.4], [1.6, 0.8, -0.3], 50],
  [388, [4.5, -6.0, 13.5], [4.5, 3.1, -0.3], 50],
  [434, [4.5, -6.0, 13.5], [4.5, 3.1, -0.3], 50],
  [448, [W + 6, -10, 4.2], [4.5, -3.5, 0.4], 50],
  [496, [W + 6, -9, 4.2], [4.0, -3.0, 0.4], 50],
  [512, [W + 8, -12, 12], [4.5, 3.0, -0.3], 50],
  [600, [W + 8.5, -12.5, 12.5], [4.5, 3.0, -0.3], 50],
]);

const STEPS: Step[] = [
  [45, 110, '基礎屋さん：砕石を敷く', '掘った底に砕石を平らに広げる', false],
  [110, 170, '基礎屋さん：転圧', '機械で締め固めて、沈まない地盤に', false],
  [170, 235, '基礎屋さん：防湿シート', '地面からの湿気を止めるシートを敷く', false],
  [235, 310, '基礎屋さん：捨てコン', '基礎の通りに薄くコンクリートを打つ', false],
  [310, 380, '基礎屋さん：墨出し', '水糸から下ろして、基礎の位置を墨で描く', false],
  [380, 440, '現場監督：墨の確認', '対角を測って、直角と位置を確かめる', true],
  [440, 500, '鉄筋屋さん：鉄筋の搬入', '次の配筋に使う鉄筋を運び込む', true],
  [500, 600, '次は配筋・型枠', '基礎の骨組みをつくっていく', false],
];

const KANTOKU = UZU; // 現場監督 = 渦さん
const CORNERS: [number, number][] = [
  [0, 0],
  [W, 0],
  [W, D],
  [0, D],
  [7 * M, 0],
  [7 * M, 5 * M],
];

export const Ep02: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);

  const gravel = ramp(f, 50, 104);
  const compact = ramp(f, 116, 166);
  const sheet = ramp(f, 176, 228);
  const sutecon = ramp(f, 240, 300);
  const dry = ramp(f, 306, 312);
  const sumi = ramp(f, 316, 372);
  const diag = ramp(f, 388, 410);
  const rebar = ramp(f, 452, 492);
  const stamp = ramp(f, 506, 516) * (1 - ramp(f, 522, 530));

  // compactor serpentine path inside the pit
  const rows = 6;
  const cp = compact * rows;
  const row = Math.min(rows - 1, Math.floor(cp));
  const t = cp - row;
  const cx = HOLE.x0 + 0.6 + (row % 2 ? 1 - t : t) * (HOLE.x1 - HOLE.x0 - 1.2);
  const cy = HOLE.y0 + 0.6 + (row / (rows - 1)) * (HOLE.y1 - HOLE.y0 - 1.2);

  type P = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: P = {x: W + 1.0, y: -1.2, yaw: 135, act: 'idle'};
  let a: P | null = {x: 2 + 3 * ramp(f, 0, 44), y: 1.5, h: BOT, yaw: 0, act: 'walk'};
  let b: P | null = null;
  if (f >= 45 && f < 110) {
    a = {x: HOLE.x0 + 0.6 + (HOLE.x1 - HOLE.x0 - 1) * gravel, y: 2.0, h: BOT + 0.1, yaw: 0, act: 'shovel'};
    b = {x: HOLE.x0 + 0.3 + (HOLE.x1 - HOLE.x0 - 1) * gravel, y: 4.6, h: BOT + 0.1, yaw: 0, act: 'shovel'};
  } else if (f >= 110 && f < 170) {
    a = {x: cx - (row % 2 ? -0.75 : 0.75), y: cy, h: GRAVEL_TOP, yaw: row % 2 ? 180 : 0, act: 'press'};
  } else if (f >= 170 && f < 235) {
    const i = Math.min(3, Math.floor(sheet * 4));
    const k = sheet * 4 - i;
    const y = HOLE.y0 + ((HOLE.y1 - HOLE.y0) * (i + 0.5)) / 4;
    a = {x: HOLE.x0 + (HOLE.x1 - HOLE.x0) * k + 0.4, y, h: GRAVEL_TOP, yaw: 180, act: 'press'};
    b = {x: HOLE.x0 + 0.5, y: y + 0.6, h: GRAVEL_TOP, yaw: 0, act: 'idle'};
  } else if (f >= 235 && f < 310) {
    const d = sutecon * 2 * (W + D);
    const pos = d < W ? [d, -0.6] : d < W + D ? [W + 0.6, d - W] : d < 2 * W + D ? [W - (d - W - D), D + 0.6] : [-0.6, D - (d - 2 * W - D)];
    a = {x: Math.max(-0.6, Math.min(W + 0.6, pos[0])), y: Math.max(-0.6, Math.min(D + 0.6, pos[1])), h: SUTE_TOP - 0.05, yaw: d < W ? 0 : d < W + D ? 90 : d < 2 * W + D ? 180 : 270, act: 'press'};
    b = {x: 3.0, y: 2.5, h: GRAVEL_TOP, yaw: 270, act: 'shovel'};
  } else if (f >= 310 && f < 380) {
    a = {x: 0.5 + 2.5 * sumi, y: -0.45, h: SUTE_TOP, yaw: 90, act: 'measure'};
    b = {x: -0.45, y: 0.6 + 2 * sumi, h: SUTE_TOP, yaw: 0, act: 'measure'};
  } else if (f >= 380 && f < 440) {
    kan = {x: -0.5, y: -0.5, yaw: 45, act: 'measure'};
    a = {x: W + 0.5, y: D + 0.5, h: SUTE_TOP, yaw: 225, act: 'measure'};
    b = null;
  } else if (f >= 440 && f < 500) {
    a = {x: 2.0 + 2.0 * ramp(f, 452, 492), y: -2.0, yaw: 0, act: 'walk'};
    b = {x: 3.0, y: -3.3, yaw: 90, act: 'idle'};
    kan = {x: 6.2, y: -2.6, yaw: 180, act: 'idle'};
  } else if (f >= 500) {
    kan = {x: 3.8, y: -2.0, yaw: 270, act: f > 512 ? 'wave' : 'idle'};
    a = {x: 5.4, y: -2.0, yaw: 270, act: f > 516 ? 'wave' : 'idle'};
    b = null;
  }

  return (
    <AbsoluteFill>
      <Scene3D cam={c} noSite>
        <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 1, pile: 0}} />
        <Fdn3D s={{gravel, compact, sheet, sutecon, suteconDry: dry, sumi}} />
        <Excavator3D x={W + 2.8} y={D / 2} yaw={Math.PI} boom={0.9} arm={-1.9} bucket={-1.2} />
        {/* gravel mound used up as it is spread */}
        {gravel < 1 ? (
          <mesh position={[W + 1.4, 0.4 * (1 - gravel), -(D + 1.9)]} castShadow>
            <coneGeometry args={[1.3 * Math.cbrt(1 - gravel) + 0.01, 0.8 * (1 - gravel) + 0.01, 20]} />
            <meshStandardMaterial color="#a19c93" roughness={1} />
          </mesh>
        ) : null}
        {f >= 110 && f < 170 ? <Compactor3D x={cx} y={cy} h={GRAVEL_TOP - 0.01} f={f} /> : null}
        {/* concrete hose while pouring the lean concrete */}
        {f >= 235 && f < 310 && a ? <Line3D a={[W + 3, -3.5, 0.1]} b={[a.x, a.y, SUTE_TOP + 0.4]} w={0.07} color="#2a2a2a" /> : null}
        {/* plumb bobs from the strings at the corners */}
        {f >= 316 && f < 380
          ? CORNERS.slice(0, 4).map(([x, y], i) => (
              <group key={'pb' + i}>
                <Line3D a={[x, y, NUKI_H + 0.05]} b={[x, y, SUTE_TOP + 0.08]} w={0.006} color="#333" opacity={ramp(f, 318 + i * 6, 322 + i * 6)} />
                {ramp(f, 318 + i * 6, 322 + i * 6) > 0 ? (
                  <mesh position={[x, SUTE_TOP + 0.06, -y]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.03, 0.07, 10]} />
                    <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
                  </mesh>
                ) : null}
              </group>
            ))
          : null}
        {/* diagonals + corner checks */}
        {f >= 380 && f < 440 ? (
          <group>
            <Line3D a={[0, 0, SUTE_TOP + 0.02]} b={[W * diag, D * diag, SUTE_TOP + 0.02]} w={0.03} color="#f6d21f" emissive />
            <Line3D a={[W, 0, SUTE_TOP + 0.02]} b={[W - W * diag, D * diag, SUTE_TOP + 0.02]} w={0.03} color="#f6d21f" emissive />
            {CORNERS.map(([x, y], i) => (
              <group key={'cc' + i}>
                <Ring3D p={[x, y, SUTE_TOP]} o={ramp(f, 400 + i * 5, 404 + i * 5)} f={f} r={0.32} />
                <Check3D p={[x, y, SUTE_TOP + 0.6]} o={ramp(f, 404 + i * 5, 408 + i * 5)} size={0.55} />
              </group>
            ))}
          </group>
        ) : null}
        <Truck3D x={W + 2.5} y={-7.0} />
        <RebarStack x={1.5} y={-2.7} o={rebar} />
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={KANTOKU.suit} vest={KANTOKU.vest} uzu phase={9} />
        {a ? <Person3D x={a.x} y={a.y} h={a.h ?? 0} yaw={a.yaw} act={a.act} f={f} phase={2} /> : null}
        {b ? <Person3D x={b.x} y={b.y} h={b.h ?? 0} yaw={b.yaw} act={b.act} f={f} phase={5} suit={f >= 440 && f < 500 ? '#5a4a3a' : '#3a5a3f'} /> : null}
      </Scene3D>
      <OverlayV2 f={f} no={2} hook={['基礎の下って', '見たことありますか？']} title="基礎の下地づくり" steps={STEPS} total={7} ctaAt={528} uzu={[[115, 200, '転圧が甘いと、あとで沈むんや'], [385, 440, '直角は、対角の長さで確かめる']]} />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: stamp}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.85)', color: '#fff', fontWeight: 900, fontSize: 64, padding: '12px 36px', borderRadius: 18}}>基礎の下地ができた</span>
      </div>
    </AbsoluteFill>
  );
};
