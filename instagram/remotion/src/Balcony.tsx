import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, FONT, ramp, Worker} from './Mokuzou';
import {makeCam, Overlay, pts, Step} from './Shared';

// close-up oblique view of a 2F balcony (front face of the house)
const Q = (x: number, z: number, h = 0): [number, number] => [380 + x + z * 0.5, 1250 - z * 0.62 - h];
const W = 300; // floor width
const DZ = 130; // floor depth
const PH = 75; // parapet height
const T = 10; // parapet thickness
const UP = 50; // waterproof upstand height
const WH = 270; // wall height above the floor
const DOOR = {x0: 95, x1: 205, h0: 58, h1: 222};
const DRAIN: [number, number] = [282, 118];

const quad = (a: [number, number][]) => pts(a);
const floorRect = (x0: number, x1: number, z0 = 0, z1 = DZ, h = 0) => quad([Q(x0, z0, h), Q(x1, z0, h), Q(x1, z1, h), Q(x0, z1, h)]);
const backRect = (x0: number, x1: number, h0: number, h1: number) => quad([Q(x0, DZ, h0), Q(x1, DZ, h0), Q(x1, DZ, h1), Q(x0, DZ, h1)]);
const leftRect = (z0: number, z1: number, h0: number, h1: number) => quad([Q(0, z0, h0), Q(0, z1, h0), Q(0, z1, h1), Q(0, z0, h1)]);

const PBox: React.FC<{x0: number; x1: number; z0: number; z1: number; hb: number; ht: number; front: string; side: string; top: string; dy?: number; opacity?: number}> = ({x0, x1, z0, z1, hb, ht, front, side, top, dy = 0, opacity = 1}) => (
  <g opacity={opacity} transform={`translate(0,${dy})`}>
    <polygon points={quad([Q(x1, z0, hb), Q(x1, z1, hb), Q(x1, z1, ht), Q(x1, z0, ht)])} fill={side} />
    <polygon points={quad([Q(x0, z0, hb), Q(x1, z0, hb), Q(x1, z0, ht), Q(x0, z0, ht)])} fill={front} />
    <polygon points={quad([Q(x0, z0, ht), Q(x1, z0, ht), Q(x1, z1, ht), Q(x0, z1, ht)])} fill={top} />
  </g>
);

// one waterproof layer: sweeps across x, covering floor, left upstand and back upstand
const Layer: React.FC<{p: number; fill: string; opacity?: number; up?: boolean}> = ({p, fill, opacity = 1, up = true}) =>
  p <= 0 ? null : (
    <g opacity={opacity}>
      {up ? <polygon points={leftRect(0, DZ, 0, UP)} fill={fill} opacity={Math.min(1, p * 6)} /> : null}
      {up ? <polygon points={backRect(0, W * p, 0, UP)} fill={fill} /> : null}
      <polygon points={floorRect(0, W * p)} fill={fill} />
    </g>
  );

const camAt = makeCam([
  [0, 565, 1060, 1.7],
  [45, 565, 1060, 1.7],
  [56, 520, 1190, 3.0],
  [110, 640, 1190, 3.0],
  [120, 560, 1170, 2.5],
  [168, 640, 1170, 2.5],
  [178, 560, 1170, 2.6],
  [238, 640, 1170, 2.6],
  [248, 560, 1170, 2.6],
  [306, 640, 1170, 2.6],
  [314, 600, 1200, 3.2],
  [356, 640, 1200, 3.2],
  [364, 580, 1160, 2.4],
  [416, 620, 1160, 2.4],
  [424, 470, 1130, 2.8],
  [454, 470, 1130, 2.8],
  [462, 620, 1180, 2.6],
  [490, 620, 1180, 2.6],
  [498, 650, 1180, 2.8],
  [548, 650, 1180, 2.8],
  [558, 565, 1060, 1.7],
  [600, 565, 1060, 1.7],
]);

const STEPS: Step[] = [
  [45, 116, '防水屋さん：下地調整', '合板の継ぎ目とビス頭を平らにする', false],
  [116, 174, '防水屋さん：プライマー', '下地に塗って、樹脂の密着をよくする', false],
  [174, 244, '防水屋さん：ガラスマット', '壁の立ち上がりまで、すき間なく敷く', false],
  [244, 310, '防水屋さん：樹脂を塗る', 'マットに樹脂をしみ込ませて固める', false],
  [310, 360, '防水屋さん：脱泡', 'ローラーで中の空気を押し出す', false],
  [360, 420, '防水屋さん：トップコート', '仕上げの色を塗って、表面を守る', false],
  [420, 494, '板金屋さん：笠木・手すり', '壁の上を板金でふさぎ、手すりを付ける', true],
  [494, 600, '排水の確認', '水を流して、ドレンへ流れるか見る', false],
];

const BUBBLES: [number, number][] = Array.from({length: 22}).map((_, k) => [14 + ((k * 61) % 272), 10 + ((k * 37) % 112)]);

export const Balcony: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);

  const putty = ramp(f, 52, 108);
  const primer = ramp(f, 122, 168);
  const mats = [0, 1, 2].map((i) => ramp(f, 182 + i * 18, 200 + i * 18));
  const resin = ramp(f, 250, 304);
  const defoam = ramp(f, 316, 354);
  const top = ramp(f, 366, 414);
  const kasagi = ramp(f, 426, 452);
  const rail = ramp(f, 462, 488);
  const water = ramp(f, 500, 516) * (1 - ramp(f, 548, 560));
  const flow = ramp(f, 500, 548);
  const deco = ramp(f, 556, 572);

  type Wk = {x: number; z: number; act: Action; flip?: boolean; suit: string; vest?: string};
  const BOU = '#4f5d68';
  let w: Wk | null = null;
  if (f >= 45 && f < 116) w = {x: 40 + 230 * putty, z: 70, act: 'press', suit: BOU};
  else if (f >= 116 && f < 174) w = {x: 30 + W * primer, z: 40, act: 'hose', suit: BOU};
  else if (f >= 174 && f < 244) w = {x: 40 + 220 * ramp(f, 182, 236), z: 30, act: 'press', suit: BOU};
  else if (f >= 244 && f < 310) w = {x: 30 + W * resin, z: 40, act: 'hose', suit: BOU};
  else if (f >= 310 && f < 360) w = {x: 30 + W * defoam, z: 40, act: 'hose', suit: BOU};
  else if (f >= 360 && f < 420) w = {x: 30 + W * top, z: 40, act: 'hose', suit: BOU};
  else if (f >= 420 && f < 494) w = f < 456 ? {x: 26, z: 70, act: 'hammer', suit: '#6b5a8e', vest: '#ffd34d'} : {x: 150, z: 26, act: 'drill', suit: '#6b5a8e', vest: '#ffd34d'};
  else if (f >= 494 && f < 552) w = {x: 40, z: 40, act: 'hose', suit: BOU};

  // plywood seams and screw heads
  const seamsX = [100, 200];
  const screws: [number, number][] = [];
  for (const x of [8, 100, 200, 292]) for (const z of [12, 40, 65, 92, 120]) screws.push([x, z]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#bcd9ee 0%, #e6eef2 60%, #e9e5dc 100%)'}}>
      <svg width={1080} height={1920}>
        <defs>
          <pattern id="mat" width={14} height={14} patternUnits="userSpaceOnUse">
            <rect width={14} height={14} fill="#f6f4ee" />
            <path d="M 0 3 L 9 6 M 4 12 L 14 9 M 2 8 L 6 1 M 9 13 L 12 4" stroke="#d8d3c6" strokeWidth={1} />
          </pattern>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {/* distant neighbours */}
          {[[180, 980], [820, 1010], [930, 960]].map(([x, y], i) => (
            <g key={'nb' + i} opacity={0.55}>
              <rect x={x} y={y} width={120} height={300} fill={i % 2 ? '#cfd3d6' : '#d9d3c9'} />
              <polygon points={pts([[x - 8, y], [x + 60, y - 50], [x + 128, y]])} fill="#7c838b" />
            </g>
          ))}
          {/* 1F facade under the balcony */}
          <polygon points={quad([Q(-T, 0, -16), Q(W + T, 0, -16), Q(W + T, 0, -260), Q(-T, 0, -260)])} fill="#ece8df" />
          <polygon points={quad([Q(W + T, 0, -16), Q(W + T, DZ + 60, -16), Q(W + T, DZ + 60, -260), Q(W + T, 0, -260)])} fill="#d3cec3" />
          <polygon points={quad([Q(40, 0, -70), Q(260, 0, -70), Q(260, 0, -190), Q(40, 0, -190)])} fill="#2f3438" />
          <polygon points={quad([Q(46, 0, -76), Q(254, 0, -76), Q(254, 0, -184), Q(46, 0, -184)])} fill="#8fa9b6" />
          <polygon points={quad([Q(60, 0, -84), Q(110, 0, -84), Q(80, 0, -176), Q(60, 0, -176)])} fill="rgba(255,255,255,0.25)" />
          {/* back wall (dark vertical siding) with sash door */}
          <polygon points={backRect(-T, W + T, 0, WH)} fill="#3e4449" />
          {Array.from({length: 16}).map((_, k) => {
            const x = -T + 8 + k * 20;
            return <line key={'sd' + k} x1={Q(x, DZ, 0)[0]} y1={Q(x, DZ, 0)[1]} x2={Q(x, DZ, WH)[0]} y2={Q(x, DZ, WH)[1]} stroke="#353a3f" strokeWidth={2} />;
          })}
          <polygon points={backRect(DOOR.x0 - 5, DOOR.x1 + 5, DOOR.h0 - 5, DOOR.h1 + 5)} fill="#24282c" />
          <polygon points={backRect(DOOR.x0, DOOR.x1, DOOR.h0, DOOR.h1)} fill="#a9c1cc" />
          <polygon points={backRect(DOOR.x0 + 53, DOOR.x0 + 57, DOOR.h0, DOOR.h1)} fill="#24282c" />
          <polygon points={quad([Q(DOOR.x0 + 8, DZ, DOOR.h1 - 6), Q(DOOR.x0 + 30, DZ, DOOR.h1 - 6), Q(DOOR.x0 + 14, DZ, DOOR.h0 + 20), Q(DOOR.x0 + 8, DZ, DOOR.h0 + 20)])} fill="rgba(255,255,255,0.3)" />
          {/* eave line at the top */}
          <polygon points={quad([Q(-T - 12, DZ - 12, WH), Q(W + T + 12, DZ - 12, WH), Q(W + T + 12, DZ + 20, WH + 6), Q(-T - 12, DZ + 20, WH + 6)])} fill="#2a2e32" />
          {/* slab edge */}
          <PBox x0={-T} x1={W + T} z0={0} z1={DZ} hb={-16} ht={0} front="#cdbb98" side="#b9a684" top="#d8b07a" />
          {/* plywood floor */}
          <polygon points={floorRect(0, W)} fill="#d8b07a" />
          <polygon points={leftRect(0, DZ, 0, UP)} fill="#cfa46c" />
          <polygon points={backRect(0, W, 0, UP)} fill="#cfa46c" opacity={0.0} />
          {seamsX.map((x) => (
            <line key={'sx' + x} x1={Q(x, 0)[0]} y1={Q(x, 0)[1]} x2={Q(x, DZ)[0]} y2={Q(x, DZ)[1]} stroke="#a77d48" strokeWidth={2} />
          ))}
          <line x1={Q(0, 65)[0]} y1={Q(0, 65)[1]} x2={Q(W, 65)[0]} y2={Q(W, 65)[1]} stroke="#a77d48" strokeWidth={2} />
          {screws.map(([x, z], i) => (
            <circle key={'sc' + i} cx={Q(x, z)[0]} cy={Q(x, z)[1]} r={1.8} fill="#6d6d6d" />
          ))}
          {/* drain */}
          <ellipse cx={Q(...DRAIN)[0]} cy={Q(...DRAIN)[1]} rx={9} ry={4} fill="#5d646b" />
          <ellipse cx={Q(...DRAIN)[0]} cy={Q(...DRAIN)[1]} rx={5} ry={2.2} fill="#1d2023" />
          {/* 1: putty on seams and screws */}
          <g opacity={1 - primer * 0.6}>
            {seamsX.map((x) => (
              <line key={'pu' + x} x1={Q(x, 0)[0]} y1={Q(x, 0)[1]} x2={Q(x, DZ * Math.min(1, putty * 1.5))[0]} y2={Q(x, DZ * Math.min(1, putty * 1.5))[1]} stroke="#efe9da" strokeWidth={5} strokeLinecap="round" opacity={putty > 0 ? 1 : 0} />
            ))}
            <line x1={Q(0, 65)[0]} y1={Q(0, 65)[1]} x2={Q(W * putty, 65)[0]} y2={Q(W * putty, 65)[1]} stroke="#efe9da" strokeWidth={5} strokeLinecap="round" opacity={putty > 0 ? 1 : 0} />
            {screws.map(([x, z], i) => (x < W * putty ? <circle key={'ps' + i} cx={Q(x, z)[0]} cy={Q(x, z)[1]} r={3} fill="#efe9da" /> : null))}
          </g>
          {/* 2: primer (wet amber) */}
          <Layer p={primer} fill="#b98a4e" opacity={0.75} />
          {/* 3: glass mat strips */}
          {mats.map((m, i) =>
            m > 0 ? (
              <g key={'mt' + i}>
                <polygon points={floorRect(i * 100, i * 100 + 100, DZ - DZ * m, DZ)} fill="url(#mat)" />
                <polygon points={backRect(i * 100, i * 100 + 100, 0, UP * Math.min(1, m * 3))} fill="url(#mat)" />
                {i === 0 ? <polygon points={leftRect(DZ - DZ * m, DZ, 0, UP)} fill="url(#mat)" /> : null}
                {m < 1 ? <polygon points={quad([Q(i * 100, DZ - DZ * m, 0), Q(i * 100 + 100, DZ - DZ * m, 0), Q(i * 100 + 100, DZ - DZ * m - 4, 8), Q(i * 100, DZ - DZ * m - 4, 8)])} fill="#e7e3d8" /> : null}
              </g>
            ) : null,
          )}
          {/* 4: resin soaks the mat (translucent) */}
          <Layer p={resin} fill="rgba(196,170,98,0.62)" />
          {resin > 0 ? <polygon points={floorRect(Math.max(0, W * resin - 18), W * resin, 0, DZ)} fill="rgba(255,255,255,0.35)" /> : null}
          {/* 5: air bubbles pushed out by the roller */}
          {resin > 0
            ? BUBBLES.map(([x, z], i) =>
                x < W * resin && x > W * defoam ? <circle key={'bb' + i} cx={Q(x, z)[0]} cy={Q(x, z)[1]} r={2.6} fill="rgba(255,255,255,0.85)" stroke="#a8935a" strokeWidth={0.6} /> : null,
              )
            : null}
          {defoam > 0 && defoam < 1 ? <polygon points={floorRect(Math.max(0, W * defoam - 10), W * defoam, 0, DZ)} fill="rgba(255,255,255,0.4)" /> : null}
          {/* 6: top coat */}
          <Layer p={top} fill="#8e979d" />
          {top > 0 ? <polygon points={floorRect(Math.max(0, W * top - 30), W * top, 0, DZ)} fill="rgba(255,255,255,0.18)" /> : null}
          {top > 0.99 ? <ellipse cx={Q(...DRAIN)[0]} cy={Q(...DRAIN)[1]} rx={9} ry={4} fill="#5d646b" /> : null}
          {top > 0.99 ? <ellipse cx={Q(...DRAIN)[0]} cy={Q(...DRAIN)[1]} rx={5} ry={2.2} fill="#1d2023" /> : null}
          {/* parapets (side walls) */}
          <PBox x0={-T} x1={0} z0={0} z1={DZ} hb={0} ht={PH} front="#e3dfd6" side="#f0ece4" top="#d4cfc4" />
          <polygon points={leftRect(0, DZ, 0, UP)} fill={top > 0.05 ? '#8e979d' : resin > 0.05 ? 'rgba(196,170,98,0.62)' : 'transparent'} />
          {/* front curb */}
          <PBox x0={0} x1={W} z0={0} z1={6} hb={0} ht={12} front={top > 0.99 ? '#8e979d' : '#cfa46c'} side="#b98a4e" top={top > 0.99 ? '#9aa3a9' : '#d8b07a'} />
          {/* worker on the balcony (behind the right parapet front) */}
          {w ? <Worker x={Q(w.x, w.z)[0]} y={Q(w.x, w.z)[1]} action={w.act} f={f} flip={w.flip} suit={w.suit} vest={w.vest ?? '#f08a24'} phase={7} s={0.95} /> : null}
          <PBox x0={W} x1={W + T} z0={0} z1={DZ} hb={0} ht={PH} front="#e3dfd6" side="#cfcac0" top="#d4cfc4" />
          {/* 7: kasagi caps */}
          <PBox x0={-T - 2} x1={2} z0={-2} z1={DZ} hb={PH} ht={PH + 5} front="#4c5359" side="#5d646b" top="#6c747b" dy={(1 - kasagi) * -40} opacity={kasagi} />
          <PBox x0={W - 2} x1={W + T + 2} z0={-2} z1={DZ} hb={PH} ht={PH + 5} front="#4c5359" side="#5d646b" top="#6c747b" dy={(1 - kasagi) * -40} opacity={kasagi} />
          {/* 7: glass handrail on the front curb */}
          <g opacity={rail} transform={`translate(0,${(1 - rail) * 30})`}>
            <polygon points={quad([Q(0, 3, 16), Q(W, 3, 16), Q(W, 3, 76), Q(0, 3, 76)])} fill="rgba(190,226,242,0.32)" stroke="rgba(120,160,180,0.6)" strokeWidth={1} />
            {[4, 150, 296].map((x) => (
              <PBox key={'po' + x} x0={x - 2} x1={x + 2} z0={1} z1={5} hb={12} ht={78} front="#2b2f33" side="#202326" top="#3a3f44" />
            ))}
            <PBox x0={0} x1={W} z0={0} z1={6} hb={76} ht={81} front="#2b2f33" side="#202326" top="#3a3f44" />
          </g>
          {/* 8: water flows to the drain */}
          {water > 0 ? (
            <g opacity={water}>
              <polygon points={floorRect(0, W)} fill="rgba(110,180,225,0.28)" />
              {Array.from({length: 14}).map((_, k) => {
                const sx = 20 + ((k * 47) % 250);
                const sz = 10 + ((k * 29) % 100);
                const t = (flow * 2 + k * 0.13) % 1;
                const x = sx + (DRAIN[0] - sx) * t;
                const z = sz + (DRAIN[1] - sz) * t;
                const [px, py] = Q(x, z);
                const [qx, qy] = Q(x - (DRAIN[0] - sx) * 0.08, z - (DRAIN[1] - sz) * 0.08);
                return <line key={'wf' + k} x1={qx} y1={qy} x2={px} y2={py} stroke="rgba(235,248,255,0.9)" strokeWidth={2} strokeLinecap="round" />;
              })}
              <circle cx={Q(...DRAIN)[0]} cy={Q(...DRAIN)[1]} r={6 + 3 * Math.abs(Math.sin(f * 0.3))} fill="none" stroke="rgba(235,248,255,0.9)" strokeWidth={1.5} />
            </g>
          ) : null}
          {/* finished: outdoor chair and plant */}
          <g opacity={deco}>
            <PBox x0={190} x1={230} z0={70} z1={100} hb={0} ht={20} front="#a77d4f" side="#8d6a43" top="#c29563" />
            <PBox x0={190} x1={230} z0={96} z1={100} hb={20} ht={44} front="#a77d4f" side="#8d6a43" top="#c29563" />
            <PBox x0={30} x1={46} z0={96} z1={112} hb={0} ht={22} front="#d9d4ca" side="#c2bdb3" top="#e6e2d9" />
            {[-12, -4, 4, 12].map((d, k) => (
              <ellipse key={'lf' + k} cx={Q(38, 104, 22)[0] + d} cy={Q(38, 104, 22)[1] - 14 - (k % 2) * 6} rx={6} ry={14} fill={k % 2 ? '#4f7d4a' : '#5f9258'} transform={`rotate(${d * 2},${Q(38, 104, 22)[0] + d},${Q(38, 104, 22)[1] - 14})`} />
            ))}
          </g>
        </g>
      </svg>
      <Overlay f={f} ep="バルコニー編" title="バルコニーの防水" sub="FRP防水を重ねて、雨から家を守る" steps={STEPS} total={7} ctaAt={556} />
    </AbsoluteFill>
  );
};
