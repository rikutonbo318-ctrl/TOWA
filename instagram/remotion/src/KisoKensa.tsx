import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, FONT, ramp, Worker} from './Mokuzou';
import {makeCam, Overlay, P, pts, Step} from './Shared';
import {Kiso2} from './Kiso2';

const D = 55;
const HT = 60;
const ANCHORS: [number, number][] = [
  [60, 60],
  [180, 60],
  [420, 60],
  [540, 60],
  [540, 150],
  [300, 150],
  [60, 150],
];

const camAt = makeCam([
  [0, 520, 1370, 1.6],
  [45, 520, 1370, 1.6],
  [56, 360, 1420, 2.4],
  [104, 520, 1380, 2.4],
  [112, 260, 1410, 3.0],
  [166, 260, 1410, 3.0],
  [174, 360, 1460, 3.0],
  [226, 360, 1460, 3.0],
  [234, 520, 1400, 2.8],
  [286, 560, 1400, 2.8],
  [294, 300, 1360, 2.6],
  [356, 480, 1360, 2.6],
  [364, 330, 1360, 3.2],
  [416, 330, 1360, 3.2],
  [424, 420, 1400, 2.2],
  [486, 420, 1400, 2.2],
  [496, 520, 1370, 1.6],
  [600, 520, 1370, 1.6],
]);

const STEPS: Step[] = [
  [45, 110, '配筋検査：図面と照合', '鉄筋の太さと本数を図面と照らし合わせる', true],
  [110, 170, '配筋検査：間隔', 'スケールを当てて鉄筋の間隔を確かめる', true],
  [170, 230, '配筋検査：かぶり', 'スペーサーで、土や型枠からの距離を確保', true],
  [230, 290, '配筋検査：継手', '鉄筋どうしの重ねの長さを確かめる', true],
  [290, 360, 'アンカー検査：位置', 'ボルトの位置を墨と糸で確かめる', true],
  [360, 420, 'アンカー検査：高さ・垂直', '出の高さ、まっすぐ立っているかを見る', true],
  [420, 490, '記録写真', '工事黒板を入れて、写真で残す', true],
  [490, 600, '検査OK → 次は打設', 'ここまで確かめてから、コンクリートを打つ', false],
];

const Ring: React.FC<{p: [number, number]; o: number; f: number; r?: number}> = ({p, o, f, r = 18}) => (
  <circle cx={p[0]} cy={p[1]} r={r + Math.sin(f * 0.4) * 2} fill="none" stroke="#ffd34d" strokeWidth={3} opacity={o} />
);
const Check: React.FC<{p: [number, number]; o: number}> = ({p, o}) => (
  <g opacity={o} transform={`translate(${p[0]},${p[1]}) scale(${0.6 + 0.4 * o})`}>
    <circle r={12} fill="#2f9e5a" />
    <path d="M -5 0 L -1 5 L 6 -5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
  </g>
);

export const KisoKensa: React.FC = () => {
  const f = useCurrentFrame();

  type W = {x: number; y: number; act: Action; flip?: boolean};
  const at = (p: [number, number], act: Action, flip = false): W => ({x: p[0], y: p[1], act, flip});
  let I: W = at(P(-40, 30), 'walk');
  let A: W = at(P(600, 100), 'idle', true);
  if (f < 45) {
    I = at(P(-80 + 200 * ramp(f, 6, 40), 30), 'walk');
  } else if (f < 110) {
    I = at(P(120 + 300 * ramp(f, 50, 104), 30, -D), 'press');
  } else if (f < 170) {
    I = at(P(110, 34, -D), 'press');
    A = at(P(230, 34, -D), 'press', true);
  } else if (f < 230) {
    I = at(P(180, 100, -D), 'tighten');
    A = at(P(560, 120, 0), 'idle', true);
  } else if (f < 290) {
    I = at(P(330, 34, -D), 'press');
  } else if (f < 360) {
    const i = Math.max(0, Math.min(ANCHORS.length - 1, Math.floor((f - 294) / 9)));
    const [x, z] = ANCHORS[i];
    I = at(P(x - 26, z - 22, z === 60 ? -D : -D + 18), 'press');
    A = at(P(600, 120, 0), 'idle', true);
  } else if (f < 420) {
    I = at(P(150, 38, -D), 'tighten');
  } else if (f < 490) {
    I = at(P(330, 30, -D), 'press');
    A = at(P(470, 30, -D), 'idle', true);
  } else {
    I = at(P(200, 300), f > 504 ? 'wave' : 'idle');
    A = at(P(420, 300), f > 508 ? 'wave' : 'idle', true);
  }

  const drawing = f >= 45 && f < 110;
  const rings1 = [0, 1, 2, 3, 4].map((i) => ramp(f, 54 + i * 9, 58 + i * 9));
  const tape = ramp(f, 118, 140);
  const spacer = ramp(f, 178, 190);
  const lap = ramp(f, 238, 252);
  const thread = ramp(f, 296, 310);
  const anchorChecks = ANCHORS.map((_, i) => ramp(f, 300 + i * 8, 304 + i * 8));
  const level = ramp(f, 366, 376);
  const board = ramp(f, 426, 436);
  const flash = f >= 452 && f < 458 ? 1 - (f - 452) / 6 : 0;
  const stamp = ramp(f, 498, 508);

  const children = (
    <g>
      {/* rebar check rings */}
      {[
        [120, 60, 10],
        [300, 60, 10],
        [480, 60, 10],
        [300, 150, 10],
        [540, 150, 10],
      ].map(([x, z, h], i) => (
        <g key={'r' + i}>
          <Ring p={P(x, z, h)} o={drawing ? rings1[i] : 0} f={f} r={22} />
          <Check p={P(x, z, h + 40)} o={drawing ? ramp(f, 58 + i * 9, 62 + i * 9) : 0} />
        </g>
      ))}
      {/* tape measure along the wall rebar */}
      {f >= 112 && f < 170 ? (
        <g>
          <line x1={P(120, 56, 20)[0]} y1={P(120, 56, 20)[1]} x2={P(120 + 80 * tape, 56, 20)[0]} y2={P(120 + 80 * tape, 56, 20)[1]} stroke="#f6d21f" strokeWidth={5} />
          {[0, 20, 40, 60, 80].map((d) => (d <= 80 * tape ? <line key={d} x1={P(120 + d, 56, 20)[0]} y1={P(120 + d, 56, 20)[1] - 6} x2={P(120 + d, 56, 20)[0]} y2={P(120 + d, 56, 20)[1] + 2} stroke="#333" strokeWidth={1.5} /> : null))}
          <Check p={P(160, 56, 50)} o={ramp(f, 146, 152)} />
        </g>
      ) : null}
      {/* spacer / cover */}
      {f >= 170 && f < 230 ? (
        <g opacity={spacer}>
          <Ring p={P(200, 100, -D + 4)} o={1} f={f} r={14} />
          <Ring p={P(300, 100, -D + 4)} o={ramp(f, 190, 196)} f={f} r={14} />
          <line x1={P(250, 96, -D)[0]} y1={P(250, 96, -D)[1]} x2={P(250, 96, -D + 8)[0]} y2={P(250, 96, -D + 8)[1] - 4} stroke="#e8622c" strokeWidth={3} />
          <polygon points={pts([[P(250, 96, -D + 8)[0] - 5, P(250, 96, -D + 8)[1] - 2], [P(250, 96, -D + 8)[0] + 5, P(250, 96, -D + 8)[1] - 2], [P(250, 96, -D + 8)[0], P(250, 96, -D + 8)[1] - 10]])} fill="#e8622c" />
          <Check p={P(250, 100, 30)} o={ramp(f, 206, 212)} />
        </g>
      ) : null}
      {/* lap splice */}
      {f >= 230 && f < 290 ? (
        <g opacity={lap}>
          <line x1={P(330, 58, 10)[0]} y1={P(330, 58, 10)[1]} x2={P(420, 58, 10)[0]} y2={P(420, 58, 10)[1]} stroke="#e8622c" strokeWidth={5} />
          <line x1={P(370, 62, 13)[0]} y1={P(370, 62, 13)[1]} x2={P(460, 62, 13)[0]} y2={P(460, 62, 13)[1]} stroke="#ffb020" strokeWidth={5} />
          <path d={`M ${P(370, 58, 26)[0]} ${P(370, 58, 26)[1]} l 0 -8 L ${P(420, 58, 34)[0]} ${P(420, 58, 34)[1]} l 0 8`} stroke="#fff" strokeWidth={3} fill="none" />
          <Check p={P(395, 58, 60)} o={ramp(f, 266, 272)} />
        </g>
      ) : null}
      {/* anchor position: thread + checks */}
      {f >= 290 && f < 420 ? (
        <g>
          <line x1={P(30, 60, HT + 6)[0]} y1={P(30, 60, HT + 6)[1]} x2={P(30 + 540 * thread, 60, HT + 6)[0]} y2={P(30 + 540 * thread, 60, HT + 6)[1]} stroke="#ff4f8b" strokeWidth={2} />
          {ANCHORS.map(([x, z], i) => (
            <g key={'ac' + i}>
              <Ring p={P(x, z, HT - 6)} o={f < 360 ? anchorChecks[i] : 0} f={f} r={12} />
              <Check p={P(x, z, HT + 40)} o={f < 360 ? anchorChecks[i] : 0} />
            </g>
          ))}
        </g>
      ) : null}
      {/* anchor height + plumb */}
      {f >= 360 && f < 420 ? (
        <g opacity={level}>
          <rect x={P(60, 60, HT)[0] + 10} y={P(60, 60, HT)[1] - 40} width={6} height={44} fill="#f6d21f" stroke="#333" strokeWidth={1} />
          {[0, 10, 20, 30, 40].map((d) => (
            <line key={d} x1={P(60, 60, HT)[0] + 10} y1={P(60, 60, HT)[1] - d} x2={P(60, 60, HT)[0] + 14} y2={P(60, 60, HT)[1] - d} stroke="#333" strokeWidth={1} />
          ))}
          <line x1={P(60, 60, HT)[0] - 18} y1={P(60, 60, HT)[1] - 50} x2={P(60, 60, HT)[0] - 18} y2={P(60, 60, HT)[1] + 4} stroke="#2f6fd1" strokeWidth={2} strokeDasharray="4 3" />
          <Check p={P(60, 60, HT + 70)} o={ramp(f, 396, 402)} />
        </g>
      ) : null}
      {/* site blackboard + photo */}
      {f >= 420 && f < 492 ? (
        <g opacity={board} transform={`translate(${P(400, 34, -D)[0]},${P(400, 34, -D)[1]})`}>
          <line x1={-14} y1={0} x2={-8} y2={-50} stroke="#555" strokeWidth={3} />
          <line x1={14} y1={0} x2={8} y2={-50} stroke="#555" strokeWidth={3} />
          <rect x={-34} y={-96} width={68} height={50} fill="#1f3b2d" stroke="#c9a77c" strokeWidth={3} />
          <line x1={-26} y1={-82} x2={22} y2={-82} stroke="#e8e8e2" strokeWidth={2} />
          <line x1={-26} y1={-70} x2={14} y2={-70} stroke="#e8e8e2" strokeWidth={2} />
          <line x1={-26} y1={-58} x2={18} y2={-58} stroke="#e8e8e2" strokeWidth={2} />
        </g>
      ) : null}
      {f >= 420 && f < 492 ? <rect x={I.x + 12} y={I.y - 96} width={22} height={16} rx={3} fill="#222" /> : null}
      {/* drawing sheet / clipboard */}
      {drawing || (f >= 290 && f < 360) ? <rect x={I.x + 12} y={I.y - 86} width={26} height={32} fill="#f4f4f0" stroke="#5b7fa8" strokeWidth={2} /> : null}

      <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.9} flip={A.flip} phase={5} />
      <Worker x={I.x} y={I.y} action={I.act} f={f} s={0.9} flip={I.flip} suit="#e3e7ec" vest="#2f6fd1" phase={9} />
    </g>
  );

  return (
    <AbsoluteFill>
      <Kiso2 freezeAt={320} cam={camAt} bare>
        {children}
      </Kiso2>
      <AbsoluteFill style={{background: `rgba(255,255,255,${0.85 * flash})`}} />
      <Overlay f={f} ep="基礎編" title="基礎の検査" sub="打設の前に、配筋とアンカーを確かめる" steps={STEPS} total={7} ctaAt={556} />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', opacity: stamp * (1 - ramp(f, 548, 556)), fontFamily: FONT}}>
        <span style={{border: '10px solid #c8102e', color: '#c8102e', fontWeight: 900, fontSize: 100, padding: '6px 40px', borderRadius: 20, display: 'inline-block', transform: `rotate(-8deg) scale(${1.4 - 0.4 * stamp})`, background: 'rgba(255,255,255,0.85)'}}>検査OK</span>
      </div>
    </AbsoluteFill>
  );
};
