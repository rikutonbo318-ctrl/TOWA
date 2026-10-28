import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, FONT, ramp, Worker} from './Mokuzou';
import {makeCam, Overlay, Step} from './Shared';
import {C1, C2, Daiku3, F1, F2, STUDS} from './Daiku3';

const camAt = makeCam([
  [0, 540, 1090, 1.15],
  [45, 540, 1090, 1.15],
  [58, 360, 960, 2.5],
  [104, 420, 960, 2.5],
  [114, 540, 1090, 1.15],
  [130, 600, 980, 2.2],
  [184, 600, 1260, 2.2],
  [194, 540, 1090, 1.15],
  [204, 790, 1300, 2.5],
  [244, 790, 1300, 2.5],
  [254, 540, 1090, 1.15],
  [262, 735, 990, 2.5],
  [294, 735, 990, 2.5],
  [304, 540, 1090, 1.15],
  [312, 620, 1330, 2.4],
  [336, 620, 1330, 2.4],
  [344, 830, 1020, 2.4],
  [366, 830, 1020, 2.4],
  [376, 540, 1090, 1.15],
  [420, 540, 1090, 1.15],
  [430, 500, 1360, 2.3],
  [474, 700, 1360, 2.3],
  [484, 540, 1090, 1.15],
  [600, 540, 1090, 1.15],
]);

const STEPS: Step[] = [
  [45, 112, 'クロス屋さん：パテ', 'ボードの継ぎ目とビス穴を平らにする', true],
  [112, 194, 'クロス屋さん：クロス貼り', '上から下へ、継ぎ目を合わせて貼る', true],
  [194, 254, '左官屋さん：塗り壁', 'リビングの一面をコテで塗り上げる', true],
  [254, 304, '建具屋さん：ドア', '枠にドアを吊り込み、動きを合わせる', true],
  [304, 372, '設備屋さん：器具付け', 'キッチンとトイレを取り付ける', true],
  [372, 424, '電気屋さん：器具付け', '照明とスイッチを付けて点灯を確かめる', true],
  [424, 484, 'クリーニング', '床・窓・設備をきれいに仕上げる', true],
  [484, 600, '完成', '木造の家ができるまで・完結', false],
];

// back-wall bays
const BAYS: {x0: number; x1: number; y0: number; y1: number}[] = [];
for (let i = 0; i < STUDS.length - 1; i++) {
  BAYS.push({x0: STUDS[i] + 8, x1: STUDS[i + 1] + 8, y0: C2 + 10, y1: F2 - 24});
  BAYS.push({x0: STUDS[i] + 8, x1: STUDS[i + 1] + 8, y0: C1 + 10, y1: F1 - 8});
}

export const Shiage: React.FC = () => {
  const f = useCurrentFrame();

  const putty = ramp(f, 50, 104);
  const cloth = BAYS.map((_, i) => ramp(f, 116 + i * 5, 128 + i * 5));
  const plaster = ramp(f, 198, 246);
  const door = ramp(f, 258, 290);
  const kitchen = ramp(f, 306, 326);
  const sink = ramp(f, 326, 338);
  const toilet = ramp(f, 346, 364);
  const lights = ramp(f, 376, 396);
  const lit = ramp(f, 400, 414);
  const clean = ramp(f, 428, 478);
  const furniture = ramp(f, 486, 506);
  const done = ramp(f, 492, 504);

  type W = {x: number; y: number; act: Action; flip?: boolean; suit: string; vest?: string};
  let C: W | null = null;
  if (f >= 45 && f < 112) C = {x: 260 + 260 * putty, y: f < 78 ? F2 - 24 : F1 - 8, act: 'press', suit: '#7a5ea8'};
  else if (f >= 112 && f < 194) C = {x: 300 + 520 * ramp(f, 116, 186), y: f < 152 ? F2 - 24 : F1 - 8, act: 'press', suit: '#7a5ea8'};
  else if (f >= 194 && f < 254) C = {x: 650 + 220 * plaster, y: F1 - 8, act: 'hose', suit: '#8a6a4a'};
  else if (f >= 254 && f < 304) C = {x: 640, y: F2 - 24, act: 'drill', suit: '#4a6b8a'};
  else if (f >= 304 && f < 372) C = f < 340 ? {x: 480, y: F1 - 8, act: 'tighten', suit: '#2f6f8f'} : {x: 760, y: F2 - 24, act: 'tighten', suit: '#2f6f8f'};
  else if (f >= 372 && f < 424) C = {x: 560, y: F1 - 8, act: 'press', suit: '#2f7d55'};
  else if (f >= 424 && f < 484) C = {x: 300 + 520 * clean, y: F1 - 8, act: 'press', suit: '#c0507a', vest: '#f2f2ee'};

  const owners = f >= 486;

  const back = (
    <g>
      {/* putty lines on board joints */}
      {BAYS.map((b, i) => {
        const o = ramp(f, 50 + i * 3.5, 56 + i * 3.5);
        return (
          <g key={'pt' + i} opacity={o * (1 - cloth[i])}>
            <rect x={b.x0 - 4} y={b.y0} width={8} height={b.y1 - b.y0} fill="#f7f7f4" />
            {[0.25, 0.5, 0.75].map((k) => (
              <circle key={k} cx={(b.x0 + b.x1) / 2} cy={b.y0 + (b.y1 - b.y0) * k} r={5} fill="#fbfbf9" />
            ))}
          </g>
        );
      })}
      {/* wallpaper (2F accent bay in grey-blue) */}
      {BAYS.map((b, i) => {
        const accent = i === 7;
        const h = (b.y1 - b.y0) * cloth[i];
        return <rect key={'cl' + i} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={h} fill={accent ? '#7d8fa0' : '#f6f3ec'} />;
      })}
      {/* plaster wall on the 1F right bays */}
      <rect x={678} y={C1 + 10} width={(912 - 678) * plaster} height={F1 - 8 - C1 - 10} fill="#e6dccb" />
      {plaster > 0
        ? Array.from({length: 40}).map((_, k) => {
            const x = 684 + ((k * 53) % 220);
            const y = C1 + 20 + ((k * 37) % 290);
            return x < 678 + (912 - 678) * plaster ? <ellipse key={'pl' + k} cx={x} cy={y} rx={9} ry={3} fill="#d9cdb8" /> : null;
          })
        : null}
    </g>
  );

  const front = (
    <g>
      {/* door on 2F */}
      <g transform={`translate(${695},${F2 - 24 - 185})`}>
        <rect x={0} y={0} width={80 * door} height={185} fill="#b98a5a" stroke="#8d5d33" strokeWidth={2} />
        {door > 0.9 ? <circle cx={66} cy={96} r={4} fill="#3a3a3a" /> : null}
      </g>
      {/* kitchen counter + sink */}
      <g opacity={kitchen} transform={`translate(0,${(1 - kitchen) * 30})`}>
        <rect x={520} y={F1 - 100} width={220} height={92} fill="#f4f1ea" stroke="#c9c4b8" strokeWidth={2} />
        <rect x={516} y={F1 - 106} width={228} height={10} fill="#3c3f44" />
        {[0, 1, 2].map((k) => (
          <rect key={k} x={528 + k * 72} y={F1 - 88} width={64} height={72} fill="#ece7dc" stroke="#cfc8b9" />
        ))}
        <rect x={520} y={C1 + 40} width={220} height={60} fill="#f4f1ea" stroke="#c9c4b8" strokeWidth={2} opacity={kitchen} />
      </g>
      <g opacity={sink}>
        <rect x={600} y={F1 - 110} width={60} height={6} fill="#9aa0a6" />
        <path d={`M 650 ${F1 - 106} L 650 ${F1 - 140} L 632 ${F1 - 140}`} stroke="#9aa0a6" strokeWidth={5} fill="none" />
      </g>
      {/* toilet on 2F */}
      <g opacity={toilet} transform={`translate(840,${F2 - 32})`}>
        <rect x={-6} y={-70} width={30} height={46} rx={4} fill="#fafafa" stroke="#bbb" />
        <path d="M -30 -26 L 20 -26 L 14 0 L -20 0 Z" fill="#fafafa" stroke="#bbb" />
      </g>
      {/* lights */}
      {[600, 680].map((x) => (
        <g key={'pd' + x} opacity={lights} transform={`translate(0,${(1 - lights) * -30})`}>
          <line x1={x} y1={C1 + 10} x2={x} y2={C1 + 80} stroke="#222" strokeWidth={2} />
          <path d={`M ${x - 24} ${C1 + 102} L ${x + 24} ${C1 + 102} L ${x + 12} ${C1 + 80} L ${x - 12} ${C1 + 80} Z`} fill="#2a2a2a" />
          <ellipse cx={x} cy={C1 + 150} rx={90 * lit + 1} ry={50 * lit + 1} fill={`rgba(255,210,130,${0.4 * lit})`} />
        </g>
      ))}
      <g opacity={lights}>
        <rect x={560} y={C2 + 10} width={70} height={12} rx={6} fill="#f4f4f0" />
        <ellipse cx={595} cy={C2 + 60} rx={110 * lit + 1} ry={60 * lit + 1} fill={`rgba(255,226,170,${0.35 * lit})`} />
      </g>
      {/* cleaning sparkles */}
      {clean > 0 && clean < 1
        ? Array.from({length: 10}).map((_, k) => {
            const x = 220 + ((k * 97) % 680);
            const y = k % 2 ? F1 - 20 : F2 - 40;
            const tw = Math.abs(Math.sin(f * 0.4 + k));
            return x < 220 + 700 * clean ? (
              <g key={'sp' + k} transform={`translate(${x},${y}) scale(${0.6 + tw})`} opacity={tw}>
                <path d="M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill="#fff6c8" />
              </g>
            ) : null;
          })
        : null}
      {/* furniture */}
      <g opacity={furniture}>
        <rect x={760} y={F1 - 58} width={140} height={50} rx={10} fill="#7b8794" />
        <rect x={760} y={F1 - 84} width={140} height={32} rx={10} fill="#8d99a6" />
        <rect x={180} y={F2 - 70} width={150} height={38} rx={6} fill="#efe9dc" stroke="#cfc6b3" />
        <rect x={180} y={F2 - 92} width={20} height={60} fill="#b98a5a" />
      </g>
      {C ? <Worker x={C.x} y={C.y} action={C.act} f={f} flip={C.flip} suit={C.suit} vest={C.vest ?? '#ffd34d'} phase={9} /> : null}
      {owners ? (
        <>
          <Worker x={560} y={F2 - 24} action={f > 500 ? 'wave' : 'idle'} f={f} />
          <Worker x={720} y={F1 - 8} action={f > 504 ? 'wave' : 'idle'} f={f} flip phase={5} />
        </>
      ) : null}
    </g>
  );

  return (
    <AbsoluteFill>
      <Daiku3 freezeAt={503} cam={camAt} bare back={back}>
        {front}
      </Daiku3>
      <Overlay f={f} ep={7} title="仕上げの職人さん" sub="クロス・左官・器具付けで完成へ" steps={STEPS} total={7} ctaAt={540} />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: done * (1 - ramp(f, 536, 546)), fontFamily: FONT, transform: `scale(${0.85 + 0.15 * done})`}}>
        <span style={{background: '#c8102e', color: '#fff', fontWeight: 900, fontSize: 110, padding: '10px 50px', borderRadius: 24}}>完成</span>
      </div>
    </AbsoluteFill>
  );
};
