import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, ramp, Worker} from './Mokuzou';
import {Backdrop, BuiltFrame, H1, H2, H3, HR, HT, makeCam, Overlay, P, pts, roofH, Scaffold, Step} from './Shared';

const EAVE_Z = 28;
const EAVE_H = H3 - 10;
const RIDGE_H = HR + 6;
const S = (x: number, t: number): [number, number] => P(x, EAVE_Z + (150 - EAVE_Z) * t, EAVE_H + (RIDGE_H - EAVE_H) * t);
const FZ = 50; // front face plane
const RXF = 550; // right face plane
const HB = HT + 4;

const FRONT_WIN = [
  {x0: 180, x1: 300, h0: H1 + 30, h1: H2 - 40},
  {x0: 80, x1: 160, h0: H2 + 40, h1: H3 - 60},
  {x0: 420, x1: 520, h0: H2 + 40, h1: H3 - 60},
  {x0: 400, x1: 450, h0: H1 + 10, h1: H2 - 40},
];
const RIGHT_WIN = [{z0: 160, z1: 230, h0: H2 + 50, h1: H3 - 60}];

const frontRect = (x0: number, x1: number, h0: number, h1: number) => pts([P(x0, FZ, h0), P(x1, FZ, h0), P(x1, FZ, h1), P(x0, FZ, h1)]);
const rightRect = (z0: number, z1: number, h0: number, h1: number) => pts([P(RXF, z0, h0), P(RXF, z1, h0), P(RXF, z1, h1), P(RXF, z0, h1)]);
// right face incl. gable, cut at height ht
const rightShape = (ht: number) => {
  const a: [number, number][] = [P(RXF, 52, HB), P(RXF, 248, HB)];
  for (let z = 248; z >= 52; z -= 14) a.push(P(RXF, z, Math.min(ht, roofH(z) - 6)));
  a.push(P(RXF, 52, Math.min(ht, roofH(52) - 6)));
  return pts(a);
};

const camAt = makeCam([
  [0, 560, 1150, 1.12],
  [45, 560, 1150, 1.12],
  [74, 420, 1270, 2.4],
  [150, 420, 1270, 2.4],
  [160, 560, 1150, 1.12],
  [188, 480, 1120, 2.2],
  [222, 520, 1060, 2.2],
  [232, 560, 1150, 1.12],
  [246, 690, 1150, 2.3],
  [274, 690, 1150, 2.3],
  [284, 560, 1150, 1.12],
  [308, 470, 1100, 2.3],
  [342, 560, 1080, 2.3],
  [356, 560, 1150, 1.12],
  [386, 640, 990, 2.2],
  [402, 720, 1040, 2.0],
  [416, 720, 1040, 2.0],
  [424, 560, 1150, 1.12],
  [500, 540, 1120, 1.4],
  [600, 540, 1120, 1.4],
]);

const STEPS: Step[] = [
  [45, 110, 'サッシ屋さん：サッシ', '窓の枠とガラスを開口に取り付ける', true],
  [110, 160, '防水テープ', '窓のまわりをテープでふさぐ', false],
  [160, 232, '透湿防水シート', '雨は止めて湿気は逃がすシートを張る', false],
  [232, 284, '胴縁', '外壁の裏に空気が通る下地を打つ', false],
  [284, 358, '外壁屋さん：外壁', '杉板と白い外壁を張っていく', true],
  [358, 424, '板金屋さん：水切り・雨どい', '足元の水切りと、雨どい（縦樋は側面の奥）を付ける', true],
  [424, 494, '鳶さん：足場ばらし', '足場を外して、家の顔が見える', true],
  [494, 600, '次回：中の大工さん', '断熱・床・壁の下地・階段へ', false],
];

export const Sotomawari: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);

  const sash = FRONT_WIN.map((_, i) => ramp(f, 52 + i * 9, 62 + i * 9));
  const sashR = ramp(f, 90, 100);
  const tape = ramp(f, 114, 152);
  const sheet = ramp(f, 166, 222);
  const furring = ramp(f, 236, 272);
  const siding = ramp(f, 288, 346);
  const mizukiri = ramp(f, 364, 384);
  const gutter = ramp(f, 384, 404);
  const downspout = ramp(f, 402, 414);
  const scafOut = ramp(f, 432, 482);

  const hTop = (p: number) => HB + (HR + 20 - HB) * p;

  // workers
  type W = {x: number; y: number; act: Action; flip?: boolean};
  const at = (p: [number, number], act: Action, flip = false): W => ({x: p[0], y: p[1], act, flip});
  let A: W = at(P(120, 22, 110), 'idle');
  let B: W = at(P(578, 120, H2 - 20), 'idle', true);
  let C: W | null = null;
  let cSuit = '#2f7d55';
  let cVest = '#ffd34d';
  if (f < 45) {
    A = at(P(-60 + 160 * ramp(f, 6, 40), 8), 'walk');
    B = at(P(700 - 160 * ramp(f, 6, 40), 8), 'walk', true);
  } else if (f < 110) {
    const i = Math.min(3, Math.floor((f - 52) / 9));
    const w = FRONT_WIN[Math.max(0, i)];
    C = at(P((w.x0 + w.x1) / 2 - 40, 22, w.h0 < H2 ? 0 : H2 - 20), 'press');
    A = at(P(560, 10), 'idle', true);
  } else if (f < 160) {
    A = at(P(160, 22, 0), 'press');
    B = at(P(420, 22, H2 - 20), 'press', true);
  } else if (f < 232) {
    A = at(P(100 + 360 * sheet, 22, sheet < 0.5 ? 110 : H2 - 20), 'hammer');
    B = at(P(578, 90 + 120 * sheet, sheet < 0.5 ? 110 : H2 - 20), 'hammer', true);
  } else if (f < 284) {
    B = at(P(578, 70 + 150 * furring, H2 - 20), 'hammer', true);
    A = at(P(120 + 300 * furring, 22, 110), 'hammer');
  } else if (f < 358) {
    C = at(P(120 + 360 * siding, 22, siding < 0.45 ? 110 : siding < 0.8 ? H2 - 20 : H3 - 20), 'drill');
    cSuit = '#2f6f8f';
    A = at(P(578, 120, 110), 'hammer', true);
  } else if (f < 424) {
    C = at(P(560, 22, f < 384 ? 0 : H3 - 20), f < 384 ? 'tighten' : 'press', true);
    cSuit = '#4b5560';
    cVest = '#e8e8e2';
    A = at(P(160, 8), 'idle');
  } else if (f < 494) {
    C = at(P(300, 8), 'wave');
    cSuit = '#2b2f36';
    A = at(P(80, 8), 'idle');
    B = at(P(600, 8), 'idle', true);
  } else {
    A = at(P(180, 8), f > 506 ? 'wave' : 'idle');
    B = at(P(440, 8), f > 510 ? 'wave' : 'idle', true);
  }

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <pattern id="cedarV" width="16" height="10" patternUnits="userSpaceOnUse">
            <rect width="16" height="10" fill="#b9814d" />
            <rect width="2" height="10" x="14" fill="#8d5d33" />
          </pattern>
          <pattern id="tyvek" width="60" height="30" patternUnits="userSpaceOnUse">
            <rect width="60" height="30" fill="#f1f3f4" />
            <text x="4" y="18" fontSize="9" fill="#a8c2d6" fontFamily="sans-serif">
              シート
            </text>
          </pattern>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          <Backdrop />
          <BuiltFrame rafterStep={40} />
          {/* roof (finished in #4) */}
          <polygon points={pts([P(30, 150, RIDGE_H), P(570, 150, RIDGE_H), P(570, 272, EAVE_H), P(30, 272, EAVE_H)])} fill="#5d6670" />
          <polygon points={pts([S(30, 0), S(570, 0), S(570, 1), S(30, 1)])} fill="#6b7580" />
          {Array.from({length: 18}).map((_, k) => (
            <polyline key={'sm' + k} points={pts([S(45 + k * 30, 0), S(45 + k * 30, 1)])} stroke="#8b96a2" strokeWidth={2.5} fill="none" />
          ))}
          <polyline points={pts([S(30, 1), S(570, 1)])} stroke="#4c545d" strokeWidth={9} fill="none" />

          {/* plywood faces (from #4) */}
          <polygon points={frontRect(52, 548, H1, H3 - 2)} fill="#d9c08a" />
          <polygon points={rightShape(HR)} fill="#c9af78" />

          {/* breathable sheet */}
          <polygon points={frontRect(52, 548, HB, Math.min(H3 - 2, hTop(sheet)))} fill="url(#tyvek)" opacity={sheet > 0 ? 1 : 0} />
          <polygon points={rightShape(hTop(sheet))} fill="url(#tyvek)" opacity={sheet > 0 ? 0.92 : 0} />
          {/* furring strips */}
          {Array.from({length: 17}).map((_, k) => {
            const x = 60 + k * 30;
            const o = ramp(f, 236 + k * 1.6, 240 + k * 1.6);
            return <polyline key={'fu' + k} points={pts([P(x, FZ - 2, HB), P(x, FZ - 2, H3 - 4)])} stroke="#c99a5e" strokeWidth={5} opacity={o * (1 - siding)} />;
          })}
          {Array.from({length: 7}).map((_, k) => {
            const z = 60 + k * 30;
            const o = ramp(f, 246 + k * 2, 250 + k * 2);
            return <polyline key={'fr' + k} points={pts([P(RXF + 2, z, HB), P(RXF + 2, z, Math.min(H3 + 30, roofH(z) - 8))])} stroke="#c99a5e" strokeWidth={5} opacity={o * (1 - siding)} />;
          })}
          {/* siding: 1F white, 2F cedar; right side white */}
          <polygon points={frontRect(52, 548, HB, Math.min(H2, hTop(siding * 0.95)))} fill="#f2efe8" opacity={siding > 0 ? 1 : 0} />
          {hTop(siding * 0.95) > H2 ? <polygon points={frontRect(52, 548, H2, Math.min(H3 - 2, hTop(siding * 0.95)))} fill="url(#cedarV)" /> : null}
          <polygon points={rightShape(hTop(siding))} fill="#e9e5dc" opacity={siding > 0 ? 1 : 0} />

          {/* openings and sashes */}
          {FRONT_WIN.map((w, i) => (
            <g key={'fw' + i}>
              <polygon points={frontRect(w.x0, w.x1, w.h0, w.h1)} fill="#3a2f25" opacity={1 - sash[i]} />
              <g opacity={sash[i]} transform={`translate(0,${(1 - sash[i]) * -20})`}>
                <polygon points={frontRect(w.x0, w.x1, w.h0, w.h1)} fill="#a9d0e6" stroke="#2a2d31" strokeWidth={5} />
                <polyline points={pts([P((w.x0 + w.x1) / 2, FZ, w.h0), P((w.x0 + w.x1) / 2, FZ, w.h1)])} stroke="#2a2d31" strokeWidth={3} />
              </g>
              {tape > 0 && siding < 0.05 ? <polygon points={frontRect(w.x0 - 6, w.x1 + 6, w.h0 - 6, w.h1 + 6)} fill="none" stroke="#c0c4c8" strokeWidth={7} strokeDasharray={600} strokeDashoffset={600 * (1 - tape)} /> : null}
            </g>
          ))}
          {RIGHT_WIN.map((w, i) => (
            <g key={'rw' + i}>
              <polygon points={rightRect(w.z0, w.z1, w.h0, w.h1)} fill="#3a2f25" opacity={1 - sashR} />
              <polygon points={rightRect(w.z0, w.z1, w.h0, w.h1)} fill="#97c2da" stroke="#2a2d31" strokeWidth={5} opacity={sashR} />
            </g>
          ))}
          {/* door on 1F */}
          <polygon points={frontRect(320, 370, H1 + 4, H2 - 50)} fill="#6b4a2a" opacity={siding} />

          {/* sheet metal: base flashing, gutter, downspout */}
          <polyline points={pts([P(48, FZ - 3, HB + 2), P(552, FZ - 3, HB + 2), P(552, 250, HB + 2)])} stroke="#2f3338" strokeWidth={6 * mizukiri + 0.01} fill="none" opacity={mizukiri} />
          <polyline points={pts([S(28, 0), S(28 + 544 * gutter, 0)])} stroke="#3a3f45" strokeWidth={12} fill="none" opacity={gutter > 0 ? 1 : 0} />
          <polyline points={pts([P(556, 262, EAVE_H - 4), P(556, 248, EAVE_H - 30), P(556, 248, EAVE_H - 30 - (EAVE_H - 30 - HT) * downspout)])} stroke="#3a3f45" strokeWidth={8} fill="none" opacity={downspout > 0 ? 1 : 0} />

          <Scaffold opacity={1 - scafOut} dy={scafOut * 120} />

          {C ? <Worker x={C.x} y={C.y} action={C.act} f={f} s={0.85} flip={C.flip} suit={cSuit} vest={cVest} phase={9} /> : null}
          <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.85} flip={A.flip} />
          <Worker x={B.x} y={B.y} action={B.act} f={f} s={0.85} flip={B.flip} phase={5} />
        </g>
      </svg>
      <Overlay f={f} ep={5} title="外まわりの仕事" sub="窓と外壁で、家の顔ができる" steps={STEPS} total={7} ctaAt={556} />
    </AbsoluteFill>
  );
};
