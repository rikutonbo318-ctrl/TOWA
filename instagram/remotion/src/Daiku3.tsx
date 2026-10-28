import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, ramp, Worker} from './Mokuzou';
import {makeCam, Overlay, Step} from './Shared';

// 2D section through the house: front wall removed, looking at the back wall
export const G = 1500;
export const F1 = 1430; // 1F floor top
export const F2 = 1100; // 2F floor top
export const C1 = 1112; // 1F ceiling (underside of 2F floor)
export const C2 = 790; // 2F ceiling
export const XL = 160; // inside face of left wall
export const XR = 920; // inside face of right wall
export const STUDS = [160, 290, 420, 540, 670, 800, 904];
export const WIN = [
  {x0: 600, x1: 790, y0: 1210, y1: 1370},
  {x0: 300, x1: 410, y0: 880, y1: 1010},
];
export const WELL = {x0: 176, x1: 470}; // stair opening in the 2F floor

const camAt = makeCam([
  [0, 540, 1090, 1.15],
  [45, 540, 1090, 1.15],
  [58, 330, 1340, 2.5],
  [104, 330, 1300, 2.5],
  [112, 540, 1090, 1.15],
  [124, 820, 1340, 2.5],
  [162, 820, 1300, 2.5],
  [172, 540, 1090, 1.15],
  [186, 360, 960, 2.3],
  [228, 360, 960, 2.3],
  [236, 540, 1090, 1.15],
  [248, 520, 1400, 2.6],
  [284, 640, 1400, 2.6],
  [292, 540, 1090, 1.15],
  [312, 700, 1000, 2.3],
  [362, 700, 1260, 2.3],
  [372, 540, 1090, 1.15],
  [384, 330, 1270, 1.9],
  [432, 330, 1270, 1.9],
  [442, 540, 1090, 1.15],
  [452, 360, 950, 2.5],
  [494, 360, 950, 2.5],
  [504, 540, 1090, 1.15],
  [600, 540, 1090, 1.15],
]);

const STEPS: Step[] = [
  [45, 112, '電気屋さん：先行配線', '壁をふさぐ前に、配線とボックスを通す', true],
  [112, 172, '設備屋さん：配管', '給水・給湯・排水の管を通す', true],
  [172, 236, '断熱', '柱の間に断熱材をすき間なく入れる', false],
  [236, 292, '床張り', 'フローリングを一枚ずつ張っていく', false],
  [292, 372, '下地・石膏ボード', '天井と壁にボードを張り、ビスで留める', false],
  [372, 442, '階段', '側板を据え、段板を一段ずつ納める', false],
  [442, 504, '造作', '窓枠・棚・ドア枠を取り付ける', false],
  [504, 600, '次回：仕上げの職人さん', 'クロス・塗装・器具付けへ', false],
];

const hatch = (x: number, y: number, w: number, h: number, key: string) => (
  <g key={key}>
    <rect x={x} y={y} width={w} height={h} fill="url(#cut)" />
  </g>
);

export const Daiku3: React.FC<{freezeAt?: number; cam?: (f: number) => {x: number; y: number; z: number}; bare?: boolean; children?: React.ReactNode; back?: React.ReactNode}> = ({freezeAt, cam: camFn, bare, children, back}) => {
  const f0 = useCurrentFrame();
  const f = freezeAt ?? f0;
  const cam = camFn ? camFn(f0) : camAt(f);

  const wires = ramp(f, 52, 100);
  const boxes = ramp(f, 70, 104);
  const pipes = ramp(f, 118, 160);
  const insul = ramp(f, 178, 228);
  const floor1 = ramp(f, 240, 270);
  const floor2 = ramp(f, 262, 288);
  const board = ramp(f, 296, 364);
  const ceil = ramp(f, 300, 330);
  const stair = ramp(f, 376, 432);
  const casing = ramp(f, 446, 470);
  const shelf = ramp(f, 466, 482);
  const doorF = ramp(f, 478, 494);

  // back-wall bays between studs, per storey
  const bays: {x0: number; x1: number; y0: number; y1: number}[] = [];
  for (let i = 0; i < STUDS.length - 1; i++) {
    bays.push({x0: STUDS[i] + 16, x1: STUDS[i + 1], y0: C1 + 2, y1: F1});
    bays.push({x0: STUDS[i] + 16, x1: STUDS[i + 1], y0: C2 + 12, y1: F2 - 24});
  }
  const bayOrder = [...bays].sort((a, b) => a.x0 - b.x0 || b.y0 - a.y0);

  type W = {x: number; y: number; act: Action; flip?: boolean};
  let A: W = {x: 300, y: F1, act: 'idle'};
  let B: W = {x: 760, y: F2 - 24, act: 'idle', flip: true};
  let C: W | null = null;
  let cSuit = '#2f7d55';
  if (f < 45) {
    A = {x: -40 + 300 * ramp(f, 6, 40), y: F1, act: 'walk'};
    B = {x: 1100 - 340 * ramp(f, 6, 40), y: F1, act: 'walk', flip: true};
  } else if (f < 112) {
    C = {x: 220 + 160 * wires, y: F1, act: f > 70 ? 'press' : 'walk'};
    A = {x: 560, y: F1, act: 'idle'};
  } else if (f < 172) {
    C = {x: 760, y: F1, act: 'tighten'};
    cSuit = '#2f6f8f';
    A = {x: 400, y: F1, act: 'idle'};
  } else if (f < 236) {
    A = {x: 200 + 560 * insul, y: F1, act: 'press'};
    B = {x: 240 + 520 * insul, y: F2 - 24, act: 'press'};
  } else if (f < 292) {
    A = {x: 200 + 600 * floor1, y: F1 - 8, act: 'hammer'};
    B = {x: 560 + 300 * floor2, y: F2 - 32, act: 'hammer', flip: true};
  } else if (f < 372) {
    A = {x: 230 + 600 * board, y: board < 0.5 ? F2 - 24 : F1, act: 'drill'};
    B = {x: 820 - 560 * board, y: board < 0.5 ? F1 : F2 - 24, act: 'drill', flip: true};
  } else if (f < 442) {
    const t = stair;
    A = {x: 200 + 260 * t, y: F1 - (F1 - F2) * t * 0.95, act: 'hammer'};
    B = {x: 560, y: F1, act: 'idle', flip: true};
  } else if (f < 504) {
    A = {x: 300, y: F2 - 24, act: 'drill'};
    B = {x: 700, y: F1, act: 'hammer', flip: true};
  } else {
    A = {x: 560, y: F2 - 24, act: f > 514 ? 'wave' : 'idle'};
    B = {x: 760, y: F1, act: f > 518 ? 'wave' : 'idle', flip: true};
  }

  const stairX0 = 196;
  const stairY0 = F1;
  const stairX1 = 470;
  const stairY1 = F2 - 24;
  const nTread = 13;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <pattern id="cut" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="12" height="12" fill="#55585e" />
            <line x1="0" y1="0" x2="0" y2="12" stroke="#7b7f86" strokeWidth="4" />
          </pattern>
          <pattern id="floorB" width="60" height="8" patternUnits="userSpaceOnUse">
            <rect width="60" height="8" fill="#cf9f6b" />
            <rect width="2" height="8" x="58" fill="#a87a4a" />
          </pattern>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          <rect x={-900} y={G} width={2900} height={900} fill="#8fb26a" />
          <rect x={-900} y={G + 14} width={2900} height={900} fill="#cbbd9e" />
          {/* back wall plane (plywood seen from inside) */}
          <rect x={XL} y={C2} width={XR - XL} height={F1 - C2} fill="#d9c08a" />
          {/* windows already fitted in #5 */}
          {WIN.map((w, i) => (
            <rect key={'w' + i} x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill="#a9d0e6" stroke="#2a2d31" strokeWidth={5} />
          ))}
          {/* studs */}
          {STUDS.map((x) => (
            <g key={'s' + x}>
              <rect x={x} y={C1} width={16} height={F1 - C1} fill="#d9a466" stroke="#b07a40" strokeWidth={1.5} />
              <rect x={x} y={C2} width={16} height={F2 - 24 - C2} fill="#d9a466" stroke="#b07a40" strokeWidth={1.5} />
            </g>
          ))}
          {/* insulation */}
          {bayOrder.map((b, i) => {
            const o = ramp(f, 178 + i * 4, 184 + i * 4);
            const h = (b.y1 - b.y0) * o;
            return <rect key={'in' + i} x={b.x0} y={b.y1 - h} width={b.x1 - b.x0} height={h} fill="#f3d24e" stroke="#d8b232" strokeWidth={1.5} opacity={insul > 0 ? 1 : 0} />;
          })}
          {WIN.map((w, i) => (
            <rect key={'w2' + i} x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill="#a9d0e6" stroke="#2a2d31" strokeWidth={5} opacity={insul > 0 ? 1 : 0} />
          ))}
          {/* electrical: wires + boxes */}
          <polyline points={`200,${C1 + 14} 880,${C1 + 14}`} stroke="#2b2b2b" strokeWidth={3} fill="none" strokeDasharray={700} strokeDashoffset={700 * (1 - wires)} />
          <polyline points={`200,${C2 + 14} 880,${C2 + 14}`} stroke="#2b2b2b" strokeWidth={3} fill="none" strokeDasharray={700} strokeDashoffset={700 * (1 - wires)} />
          {[296, 552, 812].map((x) => (
            <polyline key={'wd' + x} points={`${x + 8},${C1 + 14} ${x + 8},${F1 - 40}`} stroke="#2b2b2b" strokeWidth={3} fill="none" strokeDasharray={320} strokeDashoffset={320 * (1 - wires)} />
          ))}
          {[296, 676].map((x) => (
            <polyline key={'wu' + x} points={`${x + 8},${C2 + 14} ${x + 8},${F2 - 60}`} stroke="#2b2b2b" strokeWidth={3} fill="none" strokeDasharray={320} strokeDashoffset={320 * (1 - wires)} />
          ))}
          {[[300, F1 - 52], [556, F1 - 52], [816, F1 - 130], [300, F2 - 72], [680, F2 - 72], [440, C1 + 6], [720, C2 + 6]].map(([x, y], i) => (
            <rect key={'bx' + i} x={x - 8} y={y} width={16} height={22} rx={2} fill="#2f6fd1" opacity={ramp(f, 70 + i * 4, 76 + i * 4) * (1 - board * 0.0)} />
          ))}
          {/* plumbing */}
          <g opacity={pipes > 0 ? 1 : 0}>
            <line x1={840} y1={F1 + 20} x2={840} y2={F1 + 20 - 120 * pipes} stroke="#3a7bd5" strokeWidth={8} />
            <line x1={862} y1={F1 + 20} x2={862} y2={F1 + 20 - 120 * pipes} stroke="#d5533a" strokeWidth={8} />
            <line x1={884} y1={F1 + 30} x2={884} y2={F1 + 30 - (F1 - F2 + 40) * pipes} stroke="#9aa0a6" strokeWidth={14} />
            <line x1={600} y1={F1 + 22} x2={600 + 280 * pipes} y2={F1 + 22} stroke="#9aa0a6" strokeWidth={10} />
          </g>
          {/* gypsum boards over walls */}
          {bayOrder.map((b, i) => {
            const o = ramp(f, 300 + i * 5, 306 + i * 5);
            return <rect key={'bd' + i} x={b.x0 - 8} y={b.y0} width={b.x1 - b.x0 + 16} height={(b.y1 - b.y0) * o} fill="#e7e7e3" stroke="#c9c9c4" strokeWidth={1.5} />;
          })}
          {board > 0
            ? bayOrder.map((b, i) =>
                ramp(f, 306 + i * 5, 308 + i * 5) > 0.5
                  ? [0.25, 0.5, 0.75].map((k) => <circle key={'sc' + i + k} cx={b.x0 + (b.x1 - b.x0) * 0.5} cy={b.y0 + (b.y1 - b.y0) * k} r={1.8} fill="#9a9a96" />)
                  : null,
              )
            : null}
          {back}
          {/* windows stay visible */}
          {WIN.map((w, i) => (
            <rect key={'w3' + i} x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill="#a9d0e6" stroke="#2a2d31" strokeWidth={5} opacity={board > 0 ? 1 : 0} />
          ))}
          {/* outlets after boarding */}
          {board > 0.9
            ? [[300, F1 - 52], [556, F1 - 52], [300, F2 - 72], [680, F2 - 72]].map(([x, y], i) => <rect key={'ou' + i} x={x - 9} y={y} width={18} height={24} rx={3} fill="#f8f8f6" stroke="#aaa" />)
            : null}
          {/* ceilings */}
          <rect x={XL} y={C1} width={(XR - XL) * ceil} height={10} fill="#e7e7e3" />
          <rect x={XL} y={C2} width={(XR - XL) * ceil} height={10} fill="#e7e7e3" />
          {/* window casings, shelf, door frame */}
          {WIN.map((w, i) => (
            <rect key={'cs' + i} x={w.x0 - 10} y={w.y0 - 10} width={w.x1 - w.x0 + 20} height={w.y1 - w.y0 + 20} fill="none" stroke="#c8925a" strokeWidth={10} opacity={casing} />
          ))}
          <rect x={540} y={930} width={180 * shelf} height={10} fill="#c8925a" />
          <rect x={540} y={980} width={180 * shelf} height={10} fill="#c8925a" />
          <g opacity={doorF}>
            <rect x={690} y={F2 - 24 - 190} width={90} height={190} fill="none" stroke="#c8925a" strokeWidth={10} />
          </g>

          {/* floors: structure, then flooring */}
          <rect x={XL} y={F1} width={XR - XL} height={10} fill="#d8c08f" />
          <rect x={XL} y={F2 - 24} width={WELL.x0 - XL} height={24} fill="#c9a774" />
          <rect x={WELL.x1} y={F2 - 24} width={XR - WELL.x1} height={24} fill="#c9a774" />
          <rect x={XL} y={F1 - 8} width={(XR - XL) * floor1} height={8} fill="url(#floorB)" />
          <rect x={WELL.x1} y={F2 - 32} width={(XR - WELL.x1) * floor2} height={8} fill="url(#floorB)" />

          {/* stairs */}
          <line x1={stairX0} y1={stairY0} x2={stairX0 + (stairX1 - stairX0) * Math.min(1, stair * 3)} y2={stairY0 + (stairY1 - stairY0) * Math.min(1, stair * 3)} stroke="#b07a40" strokeWidth={14} />
          {Array.from({length: nTread}).map((_, k) => {
            const t = (k + 1) / (nTread + 1);
            const x = stairX0 + (stairX1 - stairX0) * t;
            const y = stairY0 + (stairY1 - stairY0) * t;
            const o = ramp(f, 392 + k * 2.6, 396 + k * 2.6);
            return <rect key={'tr' + k} x={x - 16} y={y - 10} width={30} height={7} fill="#cf9f6b" stroke="#a87a4a" strokeWidth={1} opacity={o} />;
          })}
          <line x1={stairX0 + 10} y1={stairY0 - 80} x2={stairX1 + 10} y2={stairY1 - 80} stroke="#8d5d33" strokeWidth={5} opacity={ramp(f, 428, 436)} />

          {/* cut walls, floors and roof (section) */}
          {hatch(140, C2 - 10, 20, G - C2 - 50, 'cl')}
          {hatch(920, C2 - 10, 20, G - C2 - 50, 'cr')}
          {hatch(140, G - 70, 800, 70, 'fd')}
          <polygon points={`100,${C2 - 4} 540,${C2 - 150} 980,${C2 - 4} 980,${C2 + 16} 540,${C2 - 130} 100,${C2 + 16}`} fill="url(#cut)" />
          <polygon points={`100,${C2 - 4} 540,${C2 - 150} 980,${C2 - 4}`} fill="none" stroke="#3c424b" strokeWidth={8} />

          {children}
          {!bare && C ? <Worker x={C.x} y={C.y} action={C.act} f={f} flip={C.flip} suit={cSuit} vest="#ffd34d" phase={9} /> : null}
          {!bare ? <Worker x={A.x} y={A.y} action={A.act} f={f} flip={A.flip} /> : null}
          {!bare ? <Worker x={B.x} y={B.y} action={B.act} f={f} flip={B.flip} phase={5} /> : null}
        </g>
      </svg>
      {bare ? null : <Overlay f={f} ep={6} title="大工さんの仕事③" sub="家の中をつくる造作" steps={STEPS} total={7} ctaAt={556} />}
    </AbsoluteFill>
  );
};
