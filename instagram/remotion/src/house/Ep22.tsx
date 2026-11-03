import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {OverlayV2} from './OverlayV2';
import {UZU} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {Act3, camTrack, Check3D, Person3D, Ring3D} from './Kit3D';

// 最終回：完成（クリーニング → 外構 → 施主検査 → 手直し → 引き渡し）
// 冒頭＝完成した家（夕方のあかり）。NGなし、最後は全22話のまとめ
const cam = camTrack([
  [0, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [42, [16.0, -13.0, 4.8], [5.5, 0.5, 1.6], 50],
  [56, [12.5, -6.5, 1.7], [10.0, -0.4, 1.4], 52],
  [118, [12.2, -6.8, 1.7], [10.0, -0.4, 1.4], 52],
  [130, [6.2, -10.5, 1.6], [6.2, -1.5, 1.0], 52],
  [198, [6.6, -10.8, 1.7], [6.2, -1.5, 1.0], 52],
  [210, [13.8, -9.4, 2.0], [9.6, -1.2, 1.0], 50],
  [296, [13.4, -9.0, 2.0], [9.6, -1.2, 1.0], 50],
  [308, [10.8, -7.2, 2.0], [8.7, -0.6, 1.1], 44],
  [366, [10.7, -7.0, 2.0], [8.7, -0.6, 1.1], 44],
  [378, [12.5, -6.5, 1.7], [10.0, -0.4, 1.4], 52],
  [436, [12.2, -6.8, 1.7], [10.0, -0.4, 1.4], 52],
  [448, [10.6, -6.6, 1.9], [8.8, -1.2, 1.1], 44],
  [496, [10.5, -6.4, 1.9], [8.8, -1.2, 1.1], 44],
  [510, [17.5, -14.5, 5.5], [5.5, 0.5, 1.6], 50],
  [600, [18.0, -15.0, 5.8], [5.5, 0.5, 1.6], 50],
]);

const STEPS: Step[] = [
  [42, 125, 'クリーニング屋さん', '窓・床・お風呂をみがく', false],
  [125, 205, '外構屋さん：駐車場と門柱', '家のまわりを仕上げる', false],
  [205, 300, '施主検査：一緒に見て回る', '開け閉め・傷・汚れ', false],
  [300, 370, '気になる所にテープ', 'その場で書き出す', false],
  [370, 440, '手直しして、もう一度確認', '直った所を自分の目で', false],
  [440, 500, '鍵を受け取って、完成', '保証書・取扱説明書も', false],
  [500, 600, '全22話、ありがとうございました', '保存して現場見学に', false],
];

const OWNER1 = '#c9a96e';
const OWNER2 = '#9a8fb5';

export const Ep22: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const c = cam(f);
  const hookF = f < 42;
  const gaiko = hookF || f >= 150;
  const pop = ramp(f, 150, 158) * (1 - ramp(f, 158, 172));
  const tape = f >= 320 && f < 440;
  const fixed = f >= 400;
  const key = ramp(f, 452, 470);

  type Pp = {x: number; y: number; h?: number; yaw: number; act: Act3};
  let kan: Pp = {x: 10.6, y: -2.6, yaw: 250, act: 'idle'};
  let o1: Pp | null = null;
  let o2: Pp | null = null;
  if (hookF) {
    kan = {x: 9.6, y: -3.2, yaw: 270, act: 'wave'};
    o1 = {x: 10.4, y: -3.4, yaw: 270, act: 'wave'};
    o2 = {x: 11.0, y: -3.3, yaw: 270, act: 'idle'};
  } else if (f < 205) {
    kan = {x: 11.2, y: -3.0, yaw: 120, act: f < 125 ? 'point' : 'idle'};
  } else if (f < 300) {
    kan = {x: 10.0, y: -2.2 - (f - 205) * 0.01, yaw: 270, act: 'walk'};
    o1 = {x: 10.6, y: -2.6 - (f - 205) * 0.01, yaw: 270, act: 'walk'};
    o2 = {x: 11.2, y: -2.5 - (f - 205) * 0.01, yaw: 270, act: 'walk'};
  } else if (f < 440) {
    kan = {x: 9.3, y: -0.8, yaw: 150, act: f < 370 ? 'point' : 'press'};
    o1 = {x: 9.6, y: -1.8, yaw: 110, act: 'idle'};
    o2 = {x: 8.1, y: -1.7, yaw: 70, act: 'idle'};
  } else if (f < 500) {
    kan = {x: 8.8, y: -1.0, yaw: 270, act: 'press'};
    o1 = {x: 9.4, y: -1.9, yaw: 120, act: f > 470 ? 'wave' : 'idle'};
    o2 = {x: 8.2, y: -1.9, yaw: 60, act: 'idle'};
  } else {
    kan = {x: 9.6, y: -3.2, yaw: 270, act: 'wave'};
    o1 = {x: 10.4, y: -3.4, yaw: 270, act: 'wave'};
    o2 = {x: 11.0, y: -3.3, yaw: 270, act: 'wave'};
  }
  if (!a) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} cam={c} exposure={1.0} sun={2.4}>
        <House3D />
        {gaiko ? <Gaiko3D cars={f >= 170 || hookF} /> : null}
        {/* masking tape marks on the entrance wall during the owner's check */}
        {tape
          ? [0, 1].map((i) => (
              <mesh key={i} position={[8.35 + i * 0.55, 0.95 + i * 0.35, 0.03]}>
                <boxGeometry args={[0.12, 0.04, 0.01]} />
                <meshStandardMaterial color={fixed ? '#7fd49b' : '#e8622c'} emissive={fixed ? '#2e7d4f' : '#a03a10'} emissiveIntensity={0.4} />
              </mesh>
            ))
          : null}
        {f >= 330 && f < 366 ? <Ring3D p={[8.6, -0.05, 1.1]} o={ramp(f, 330, 336)} f={f} r={0.3} /> : null}
        {f >= 410 && f < 440 ? <Check3D p={[8.6, -0.2, 1.7]} o={ramp(f, 410, 416)} size={0.3} /> : null}
        <Person3D x={kan.x} y={kan.y} h={kan.h ?? 0} yaw={kan.yaw} act={kan.act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
        {o1 ? <Person3D x={o1.x} y={o1.y} yaw={o1.yaw} act={o1.act} f={f} phase={2} suit={OWNER1} casual helmet="#1f2a3a" /> : null}
        {o2 ? <Person3D x={o2.x} y={o2.y} yaw={o2.yaw} act={o2.act} f={f} phase={5} suit={OWNER2} casual helmet="#d9cdb5" /> : null}
      </RealScene>
      {pop > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${pop * 0.6})`}} /> : null}
      {key > 0 && f < 500 ? (
        <div style={{position: 'absolute', top: 1040, width: '100%', textAlign: 'center', opacity: key, transform: `scale(${0.85 + 0.15 * key})`}}>
          <span style={{fontFamily: FONT, background: '#e8622c', color: '#fff', fontWeight: 900, fontSize: 80, padding: '14px 40px', borderRadius: 22, boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>引き渡し</span>
        </div>
      ) : null}
      <OverlayV2
        f={f}
        no={22}
        hook={['完成した家、', '最後にどこを見る？']}
        title="完成・引き渡し"
        steps={STEPS}
        total={6}
        ctaAt={528}
        uzu={[
          [230, 296, 'ドアも窓も、全部開け閉めしてみてな'],
          [380, 436, '直った所は、自分の目で見てOK出すんやで'],
        ]}
      />
      <div style={{position: 'absolute', bottom: 470, width: '100%', textAlign: 'center', opacity: ramp(f, 446, 452) * (1 - ramp(f, 516, 522))}}>
        <span style={{fontFamily: FONT, background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 46, padding: '12px 30px', borderRadius: 16}}>
          <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
          ついに完成や！最後に見るとこあるで
        </span>
      </div>
    </AbsoluteFill>
  );
};
