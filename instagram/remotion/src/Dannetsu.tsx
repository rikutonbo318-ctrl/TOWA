import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, ramp} from './Mokuzou';
import {makeCam, Overlay, Step} from './Shared';
import {BAYS, Blackboard, bayCenter, bayQuad, Box3, ceilQ, Check, Defs, JOIST_Z, Joists, L3, leftWall, Openings, pr, PWorker, Q3, Ring, RH, rightWall, RX, backWall, Shell, Stamp, Studs, HookPanel, workerScale, ZB, ZN, V3} from './Interior';

const camAt = makeCam([
  [0, 540, 980, 1.0],
  [45, 540, 980, 1.0],
  [56, 330, 1040, 1.5],
  [84, 330, 1040, 1.5],
  [94, 540, 1010, 1.5],
  [108, 740, 1040, 1.5],
  [130, 540, 980, 1.0],
  [140, 540, 980, 1.0],
  [196, 540, 980, 1.0],
  [206, 300, 1020, 1.7],
  [256, 300, 1020, 1.7],
  [266, 420, 1000, 1.6],
  [316, 420, 1000, 1.6],
  [326, 800, 1100, 1.6],
  [376, 800, 1100, 1.6],
  [386, 540, 800, 1.4],
  [436, 540, 800, 1.4],
  [446, 520, 1080, 1.4],
  [494, 520, 1080, 1.4],
  [504, 540, 980, 1.0],
  [600, 540, 980, 1.0],
]);

const STEPS: Step[] = [
  [45, 130, '大工さん：断熱材を入れる', '柱と柱のあいだに、すき間なく詰める', false],
  [130, 200, '大工さん：防湿シート', '室内側にシートを張り、湿気を止める', false],
  [200, 260, '断熱検査：すき間', '詰め残しや、つぶれがないか見る', true],
  [260, 320, '断熱検査：気密テープ', 'シートの継ぎ目がふさがっているか', true],
  [320, 380, '断熱検査：配線・配管まわり', 'コンセントや配管の穴まわりを確かめる', true],
  [380, 440, '断熱検査：天井', '天井の断熱材も、すき間なく入っているか', true],
  [440, 500, '記録写真', '工事黒板を入れて、写真で残す', true],
  [500, 600, '検査OK → 次はボード張り', '壁を閉じる前に、ここまで確かめる', false],
];

const NL = BAYS.filter((b) => b.wall === 'L').length;
const NB = BAYS.filter((b) => b.wall === 'B').length;
const bayStart = (i: number) => (i < NL ? 50 + i * (32 / NL) : i < NL + NB ? 84 + (i - NL) * (22 / NB) : 106 + (i - NL - NB) * (22 / (BAYS.length - NL - NB)));

const JGAPS: [number, number][] = [];
{
  const s = [ZN, ...JOIST_Z, ZB];
  for (let i = 0; i < s.length - 1; i++) JGAPS.push([s[i] + (i === 0 ? 0 : 0.045), s[i + 1]]);
}

const OUTLET: V3 = [RX - 0.12, 0.36, 3.4];
const PIPE: V3 = [1.5, 1.7, ZB - 0.11];

export const Dannetsu: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);

  const ceilIns = ramp(f, 112, 128);
  const filmL = ramp(f, 136, 160);
  const filmB = ramp(f, 158, 176);
  const filmR = ramp(f, 174, 194);
  const tape = ramp(f, 186, 198);
  const flash = f >= 476 && f < 482 ? 1 - (f - 476) / 6 : 0;
  const stamp = ramp(f, 506, 516) * (1 - ramp(f, 548, 556));

  type Wk = {x: number; z: number; act: Action; flip?: boolean};
  let C: Wk | null = null;
  let I: Wk | null = null;
  if (f < 45) C = {x: -1.2 + 0.4 * ramp(f, 0, 44), z: 3.4, act: 'walk'};
  else if (f < 84) C = {x: -1.75, z: 4.8 - 1.8 * ramp(f, 50, 82), act: 'press', flip: true};
  else if (f < 106) C = {x: -1.2 + 2.2 * ramp(f, 84, 104), z: 5.6, act: 'press'};
  else if (f < 130) C = {x: 1.7, z: 3.4 + 1.6 * ramp(f, 106, 128), act: 'press'};
  else if (f < 162) C = {x: -1.75, z: 5.2 - 2.4 * filmL, act: 'press', flip: true};
  else if (f < 178) C = {x: -1.0 + 2 * filmB, z: 5.6, act: 'press'};
  else if (f < 200) C = {x: 1.7, z: 3.2 + 2 * filmR, act: 'press'};
  if (f >= 200 && f < 260) I = {x: -1.6, z: 4.6 - 1.4 * ramp(f, 204, 254), act: 'press', flip: true};
  else if (f >= 260 && f < 320) I = {x: -1.0 + 1.6 * ramp(f, 264, 314), z: 5.4, act: 'press'};
  else if (f >= 320 && f < 380) I = {x: 1.5, z: 3.9, act: 'press'};
  else if (f >= 380 && f < 440) I = {x: -0.3, z: 4.2, act: 'press'};
  else if (f >= 440 && f < 500) I = {x: 0.2, z: 3.6, act: 'idle'};
  else if (f >= 500) I = {x: -0.4, z: 3.8, act: f > 512 ? 'wave' : 'idle'};
  if (f >= 500) C = {x: 0.8, z: 4.2, act: f > 516 ? 'wave' : 'idle', flip: true};

  // inspection targets
  const LB = BAYS.filter((b) => b.wall === 'L');
  const nearest = (z: number, low: boolean) => LB.filter((b) => (low ? b.y1 < 1.2 : b.y1 > 2)).reduce((m, b) => (Math.abs((b.a + b.b) / 2 - z) < Math.abs((m.a + m.b) / 2 - z) ? b : m));
  const gapBays = [nearest(2.8, false), nearest(3.9, true), nearest(5.6, false)];
  const gapO = gapBays.map((_, i) => ramp(f, 210 + i * 14, 216 + i * 14));
  const tapeCheck = [0, 1, 2].map((i) => ramp(f, 272 + i * 14, 278 + i * 14));
  const tapePts: V3[] = [
    [-RX + 0.11, 1.25, 4.0],
    [-0.6, 1.25, ZB - 0.11],
    [-RX + 0.11, 2.2, ZB - 0.2],
  ];
  const holeO = [ramp(f, 330, 338), ramp(f, 352, 360)];
  const ceilChecks: V3[] = [
    [-1.2, RH - 0.13, 3.2],
    [0.6, RH - 0.13, 4.4],
    [1.4, RH - 0.13, 2.6],
  ];
  const ceilO = ceilChecks.map((_, i) => ramp(f, 392 + i * 12, 398 + i * 12));
  const inspecting = f >= 200 && f < 500;

  const filmQuad = (w: 'L' | 'B' | 'R', p: number): V3[] =>
    w === 'L' ? leftWall(ZB - (ZB - ZN) * p, ZB, 0, RH, 0.106) : w === 'R' ? rightWall(ZB - (ZB - ZN) * p, ZB, 0, RH, 0.106) : backWall(-RX, -RX + 2 * RX * p, 0, RH, 0.106);

  const ip = I ? pr(I.x, 0, I.z) : ([0, 0] as [number, number]);
  const is = I ? workerScale(I.z) : 1;

  return (
    <AbsoluteFill style={{background: '#3d3a36'}}>
      <svg width={1080} height={1920}>
        <Defs />
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          <Shell floor="cover" ceiling="open" />
          {/* wall insulation, bay by bay */}
          {BAYS.map((b, i) => {
            const p = ramp(f, bayStart(i), bayStart(i) + 6);
            return p > 0 ? <Q3 key={'in' + i} p={bayQuad(b, 0.02, p)} fill="url(#wool)" /> : null;
          })}
          {/* ceiling insulation between joists */}
          {JGAPS.map(([a, b], i) => (
            <Q3 key={'ci' + i} p={ceilQ(-RX, -RX + 2 * RX * ceilIns, a, b, RH - 0.01)} fill="url(#wool)" opacity={ceilIns > 0 ? 1 : 0} />
          ))}
          <Joists />
          <Studs />
          {/* vapour barrier film */}
          {(['L', 'B', 'R'] as const).map((w) => {
            const p = w === 'L' ? filmL : w === 'B' ? filmB : filmR;
            return p > 0 ? (
              <g key={'fm' + w}>
                <Q3 p={filmQuad(w, p)} fill="rgba(226,240,250,0.42)" stroke="rgba(255,255,255,0.6)" sw={1} />
              </g>
            ) : null;
          })}
          {filmL > 0 ? <Q3 p={[[-RX + 0.107, 2.3, 6.2], [-RX + 0.107, 2.3, 5.6], [-RX + 0.107, 0.2, 4.4], [-RX + 0.107, 0.2, 5.0]]} fill="rgba(255,255,255,0.16)" opacity={filmL} /> : null}
          {filmR > 0 ? <Q3 p={[[RX - 0.107, 2.3, 6.2], [RX - 0.107, 2.3, 5.6], [RX - 0.107, 0.2, 4.0], [RX - 0.107, 0.2, 4.6]]} fill="rgba(255,255,255,0.16)" opacity={filmR} /> : null}
          {/* airtight tape on film seams */}
          <g opacity={tape}>
            <L3 a={[-RX + 0.11, 1.25, ZN + 0.4]} b={[-RX + 0.11, 1.25, ZB - 0.11]} stroke="#c3c9ce" sw={6} />
            <L3 a={[-RX + 0.11, 1.25, ZB - 0.11]} b={[RX - 0.11, 1.25, ZB - 0.11]} stroke="#c3c9ce" sw={4} />
            <L3 a={[RX - 0.11, 1.25, ZB - 0.11]} b={[RX - 0.11, 1.25, ZN + 0.4]} stroke="#c3c9ce" sw={6} />
            <L3 a={[-RX + 0.11, 0.02, ZB - 0.11]} b={[-RX + 0.11, RH, ZB - 0.11]} stroke="#c3c9ce" sw={4} />
            <L3 a={[RX - 0.11, 0.02, ZB - 0.11]} b={[RX - 0.11, RH, ZB - 0.11]} stroke="#c3c9ce" sw={4} />
            <L3 a={[-RX + 0.11, 2.36, ZN + 0.4]} b={[-RX + 0.11, 2.36, ZB - 0.11]} stroke="#c3c9ce" sw={4} />
          </g>
          <Openings glass />
          {/* airtight outlet box and pipe sleeve */}
          <Box3 x0={OUTLET[0] - 0.03} x1={OUTLET[0] + 0.01} y0={OUTLET[1]} y1={OUTLET[1] + 0.13} z0={OUTLET[2]} z1={OUTLET[2] + 0.08} c={{front: '#2f6fd1', side: '#3f7fe0', top: '#5a95ea'}} />
          {(() => {
            const [px, py] = pr(...PIPE);
            const r = (0.06 * 560) / PIPE[2];
            return (
              <g>
                <circle cx={px} cy={py} r={r + 5 * tape} fill="#c3c9ce" />
                <circle cx={px} cy={py} r={r} fill="#8d949a" />
                <circle cx={px} cy={py} r={r * 0.6} fill="#4a4f54" />
              </g>
            );
          })()}
          {/* workers */}
          {C ? <PWorker x={C.x} z={C.z} action={C.act} f={f} flip={C.flip} phase={4} /> : null}
          {I ? <PWorker x={I.x} z={I.z} action={I.act} f={f} flip={I.flip} suit="#e3e7ec" vest="#2f6fd1" phase={9} /> : null}
          {/* clipboard + flashlight cone while inspecting */}
          {I && inspecting && f < 440 ? (
            <rect x={ip[0] + (I.flip ? -40 : 12) * is} y={ip[1] - 88 * is} width={26 * is} height={32 * is} fill="#f4f4f0" stroke="#5b7fa8" strokeWidth={2} />
          ) : null}
          {f >= 200 && f < 260
            ? gapBays.map((b, i) => (
                <g key={'gb' + i}>
                  <Ring p={pr(...bayCenter(b, 0.12))} o={gapO[i]} f={f} r={30} />
                  <Check p={pr(...bayCenter(b, 0.12)).map((v, k) => (k ? v - 46 : v)) as [number, number]} o={gapO[i]} />
                </g>
              ))
            : null}
          {f >= 260 && f < 320
            ? tapePts.map((p, i) => (
                <g key={'tp' + i}>
                  <Ring p={pr(...p)} o={tapeCheck[i]} f={f} r={24} />
                  <Check p={[pr(...p)[0], pr(...p)[1] - 40]} o={tapeCheck[i]} />
                </g>
              ))
            : null}
          {f >= 320 && f < 380 ? (
            <g>
              <Ring p={pr(OUTLET[0], OUTLET[1] + 0.06, OUTLET[2] + 0.04)} o={holeO[0]} f={f} r={32} />
              <Check p={[pr(...OUTLET)[0] - 10, pr(...OUTLET)[1] - 70]} o={holeO[0]} />
              <Ring p={pr(...PIPE)} o={holeO[1]} f={f} r={22} />
              <Check p={[pr(...PIPE)[0], pr(...PIPE)[1] - 36]} o={holeO[1]} />
            </g>
          ) : null}
          {f >= 380 && f < 440
            ? ceilChecks.map((p, i) => (
                <g key={'cc' + i}>
                  <Ring p={pr(...p)} o={ceilO[i]} f={f} r={30} />
                  <Check p={[pr(...p)[0], pr(...p)[1] + 44]} o={ceilO[i]} />
                </g>
              ))
            : null}
          {f >= 440 && f < 500 ? (
            <g>
              <Blackboard p={pr(-0.7, 0, 3.4)} s={workerScale(3.4) * 0.9} o={ramp(f, 446, 456)} />
              <rect x={ip[0] + 12 * is} y={ip[1] - 98 * is} width={22 * is} height={16 * is} rx={3} fill="#222" />
            </g>
          ) : null}
        </g>
      </svg>
      <AbsoluteFill style={{background: `rgba(255,255,255,${0.85 * flash})`}} />
      <HookPanel f={f} />
      <Overlay f={f} ep="大工編" title="断熱検査" sub="壁を閉じる前に、断熱材を確かめる" steps={STEPS} total={7} ctaAt={556} />
      <Stamp o={stamp} text="検査OK" top={640} />
    </AbsoluteFill>
  );
};
