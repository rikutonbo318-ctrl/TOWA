import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Action, clamp, FONT, ramp, Worker} from './Mokuzou';

// oblique ground projection: plan (x, z) + height h -> screen
const P = (x: number, z: number, h = 0): [number, number] => [150 + x + z * 0.45, 1500 - z * 0.8 - h];
const pts = (a: [number, number][]) => a.map(([x, y]) => `${x},${y}`).join(' ');
const D = 55; // excavation depth
const PIT = {x0: 40, x1: 560, z0: 40, z1: 260};
const FP = {x0: 60, x1: 540, z0: 60, z1: 240}; // building footprint

const CAM: [number, number, number, number][] = [
  [0, 520, 1370, 1.6],
  [45, 520, 1370, 1.6],
  [86, 520, 1370, 1.6],
  [96, 185, 1420, 2.6],
  [118, 185, 1420, 2.6],
  [128, 520, 1370, 1.6],
  [134, 230, 1440, 2.5],
  [152, 230, 1440, 2.5],
  [162, 520, 1370, 1.6],
  [222, 520, 1370, 1.6],
  [230, 260, 1460, 2.5],
  [250, 260, 1460, 2.5],
  [258, 520, 1370, 1.6],
  [282, 520, 1370, 1.6],
  [290, 600, 1420, 2.4],
  [312, 600, 1420, 2.4],
  [320, 520, 1370, 1.6],
  [392, 520, 1370, 1.6],
  [398, 470, 1440, 2.4],
  [418, 470, 1440, 2.4],
  [426, 520, 1370, 1.6],
  [432, 300, 1400, 2.2],
  [462, 300, 1400, 2.2],
  [474, 520, 1370, 1.6],
  [600, 520, 1370, 1.6],
];
const camAt = (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
  const [fa, xa, ya, za] = CAM[i];
  const [fb, xb, yb, zb] = CAM[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: xa + (xb - xa) * t, y: ya + (yb - ya) * t, z: za + (zb - za) * t};
};

const STEPS: [number, number, string, string][] = [
  [45, 120, '配置確認', '地縄を張り、敷地境界からの距離を測る'],
  [120, 180, '遣り方', '杭と水貫を打ち、水糸で基礎の線と高さを出す'],
  [180, 255, '根切り', '重機で掘り、隅は手で整える'],
  [255, 315, '砕石・転圧', '砕石を敷きならし、締め固める'],
  [315, 360, '防湿シート', '地面からの湿気を止めるシートを重ねて敷く'],
  [360, 420, '捨てコン', '墨を打つための薄いコンクリートを打つ'],
  [420, 495, '墨出し', '墨つぼで基礎の位置を写す'],
  [495, 600, '次回：配筋', 'この墨に合わせて鉄筋を組んでいく'],
];

const Caption: React.FC<{f: number}> = ({f}) => {
  const idx = STEPS.findIndex(([a, b]) => f >= a && f < b);
  if (idx < 0) return null;
  const [a, , title, sub] = STEPS[idx];
  const o = ramp(f, a, a + 8);
  const num = idx < 7 ? `${idx + 1}/7 ` : '';
  return (
    <div style={{position: 'absolute', top: 235, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: FONT}}>
      <div style={{background: '#e8622c', color: '#fff', fontWeight: 900, fontSize: 60, padding: '8px 34px', borderRadius: 14}}>
        <span style={{fontSize: 40, marginRight: 12}}>{num}</span>
        {title}
      </div>
      <div style={{marginTop: 14, background: 'rgba(16,22,30,0.86)', color: '#fff', fontWeight: 700, fontSize: 36, padding: '10px 24px', borderRadius: 12}}>{sub}</div>
    </div>
  );
};

const Excavator: React.FC<{x: number; y: number; f: number; dig: boolean}> = ({x, y, f, dig}) => {
  const c = dig ? Math.sin(f * 0.22) : 0;
  const boom = -35 + c * 12;
  const stick = 70 + c * 25;
  const bucket = 40 + c * 40;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-80} y={-28} width={160} height={28} rx={14} fill="#2c2c2c" />
      {[-60, -30, 0, 30, 60].map((k) => (
        <circle key={k} cx={k} cy={-14} r={9} fill="#555" />
      ))}
      <rect x={-60} y={-80} width={120} height={50} rx={6} fill="#f2b51c" />
      <rect x={-10} y={-130} width={58} height={52} rx={6} fill="#f2b51c" />
      <rect x={-2} y={-122} width={42} height={30} fill="#9fc7e0" />
      <rect x={-62} y={-64} width={20} height={30} fill="#d99a10" />
      <g transform={`translate(-50,-70) rotate(${boom + 180})`}>
        <rect x={0} y={-9} width={150} height={18} rx={8} fill="#f2b51c" />
        <g transform={`translate(150,0) rotate(${stick})`}>
          <rect x={0} y={-7} width={110} height={14} rx={6} fill="#e3a812" />
          <g transform={`translate(110,0) rotate(${bucket})`}>
            <path d="M 0 -6 L 34 -16 L 40 18 L 4 14 Z" fill="#3a3a3a" />
          </g>
        </g>
      </g>
    </g>
  );
};

export const Kiso1: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);

  const rope = ramp(f, 50, 84);
  const tape = ramp(f, 92, 106);
  const ok = ramp(f, 110, 116);
  const stakes = ramp(f, 124, 146);
  const boards = ramp(f, 146, 160);
  const thread = ramp(f, 160, 176);
  const dig = ramp(f, 192, 246);
  const d = D * dig;
  const exIn = ramp(f, 180, 192) * (1 - ramp(f, 252, 264));
  const gravel = ramp(f, 258, 282);
  const compact = ramp(f, 284, 312);
  const sheet = ramp(f, 318, 352);
  const sute = ramp(f, 364, 400);
  const inkLines: [number, number, number, number][] = [
    [FP.x0, FP.z0, FP.x1, FP.z0],
    [FP.x1, FP.z0, FP.x1, FP.z1],
    [FP.x1, FP.z1, FP.x0, FP.z1],
    [FP.x0, FP.z1, FP.x0, FP.z0],
    [300, FP.z0, 300, FP.z1],
  ];
  const cta = ramp(f, 540, 554);
  const hook = 1 - ramp(f, 36, 46);

  // pit polygons
  const top: [number, number][] = [P(PIT.x0, PIT.z0), P(PIT.x1, PIT.z0), P(PIT.x1, PIT.z1), P(PIT.x0, PIT.z1)];
  const floor = top.map(([x, y]) => [x, y + d] as [number, number]);
  const [fl, fr] = [P(PIT.x0, PIT.z0)[0] - 10, P(PIT.x1, PIT.z1)[0] + 10];
  const spread = (p: number) => fl + (fr - fl) * p;

  // workers
  let A: {x: number; y: number; act: Action; flip?: boolean} = {x: -60, y: 1500, act: 'walk'};
  let B: {x: number; y: number; act: Action; flip?: boolean} = {x: -120, y: 1500, act: 'walk'};
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  if (f < 50) {
    const t = ramp(f, 8, 46);
    A = {x: -60 + 200 * t, y: P(-40, 60)[1], act: 'walk'};
    B = {x: -120 + 330 * t, y: P(60, 60)[1], act: 'walk'};
  } else if (f < 120) {
    // B walks the rope around the footprint, then both measure
    const corners: [number, number][] = [P(FP.x0, FP.z0), P(FP.x1, FP.z0), P(FP.x1, FP.z1), P(FP.x0, FP.z1), P(FP.x0, FP.z0)];
    const seg = Math.min(3.999, rope * 4);
    const i = Math.floor(seg);
    const [bx, by] = f < 86 ? lerp(corners[i], corners[i + 1], seg - i) : P(FP.x0, FP.z0);
    B = {x: bx, y: by, act: f < 86 ? 'walk' : 'press', flip: f >= 86};
    const [ax0, ay0] = P(-40, 60);
    A = {x: ax0 - 10, y: ay0, act: f < 86 ? 'idle' : 'press'};
  } else if (f < 180) {
    const [sx, sy] = P(20, 10);
    A = {x: sx - 34, y: sy, act: f < 146 ? 'hammer' : 'idle'};
    const [tx, ty] = P(580, 290);
    B = {x: tx + 30, y: ty, act: f > 158 ? 'press' : 'walk', flip: true};
  } else if (f < 255) {
    const [cx, cy] = P(PIT.x0 + 30, PIT.z0 + 30);
    A = {x: cx, y: cy + d, act: f > 224 ? 'hammer' : 'idle'};
    const [gx, gy] = P(600, 0);
    B = {x: gx + 40, y: gy, act: 'wave', flip: true};
  } else if (f < 315) {
    const t = gravel;
    const [rx, ry] = P(PIT.x0 + 40 + 400 * t, 140);
    A = {x: rx, y: ry + D, act: f < 282 ? 'hose' : 'idle'};
    const c = compact;
    const [bx, by] = P(480 - 300 * c, 90);
    B = {x: bx, y: by + D, act: f >= 284 ? 'press' : 'idle', flip: true};
  } else if (f < 360) {
    const [ax, ay] = P(PIT.x0 + 20 + 480 * sheet, 80);
    const [bx, by] = P(PIT.x0 + 20 + 480 * sheet, 220);
    A = {x: ax, y: ay + D, act: 'walk'};
    B = {x: bx, y: by + D, act: 'walk'};
  } else if (f < 420) {
    const [ax, ay] = P(PIT.x0 + 20 + 470 * sute, 110);
    A = {x: ax - 10, y: ay + D, act: f < 398 ? 'hose' : 'tighten'};
    const [bx, by] = P(560, 300);
    B = {x: bx + 20, y: by, act: 'idle', flip: true};
  } else if (f < 495) {
    const i = Math.min(4, Math.max(0, Math.floor((f - 424) / 13)));
    const [x0, z0, x1, z1] = inkLines[i];
    const [ax, ay] = P(x0, z0, -D);
    const [bx, by] = P(x1, z1, -D);
    A = {x: ax - 12, y: ay, act: 'tighten'};
    B = {x: bx + 12, y: by, act: 'press', flip: true};
  } else {
    const [ax, ay] = P(150, 300);
    const [bx, by] = P(450, 300);
    A = {x: ax, y: ay, act: f > 510 ? 'wave' : 'idle'};
    B = {x: bx, y: by, act: f > 516 ? 'wave' : 'idle', flip: true};
  }

  const stakeList: [number, number][] = [];
  for (let x = 20; x <= 580; x += 140) stakeList.push([x, 10], [x, 290]);
  for (let z = 80; z <= 220; z += 140) stakeList.push([10, z], [590, z]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <pattern id="gravel" width="18" height="12" patternUnits="userSpaceOnUse">
            <rect width="18" height="12" fill="#9b9a95" />
            <circle cx="4" cy="4" r="2.4" fill="#c4c2bc" />
            <circle cx="12" cy="8" r="2" fill="#7c7b77" />
            <circle cx="15" cy="2" r="1.6" fill="#b1afa9" />
          </pattern>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {/* backdrop: neighbouring houses and trees */}
          {[[-180, 0], [60, 1], [700, 0], [960, 1]].map(([x, k], i) => (
            <g key={'h' + i}>
              <rect x={x} y={1080 - 30 * k} width={180} height={110 + 30 * k} fill={k ? '#d7d2c8' : '#c9cfd4'} />
              <polygon points={pts([[x - 10, 1080 - 30 * k], [x + 90, 1020 - 30 * k], [x + 190, 1080 - 30 * k]])} fill="#6c737b" />
            </g>
          ))}
          <rect x={-900} y={1180} width={2900} height={1200} fill="#8fb26a" />
          {/* lot */}
          <polygon points={pts([P(-90, -60), P(700, -60), P(700, 380), P(-90, 380)])} fill="#c9a77c" />
          {/* boundary pins */}
          {[P(-40, -20), P(-40, 340), P(660, 340), P(660, -20), P(-40, 60)].map(([x, y], i) => (
            <g key={'b' + i}>
              <rect x={x - 4} y={y - 14} width={8} height={14} fill="#d23c3c" />
            </g>
          ))}

          {/* excavation pit */}
          {d > 0.5 ? (
            <g>
              <clipPath id="pitClip">
                <polygon points={pts(top)} />
              </clipPath>
              <polygon points={pts(top)} fill="#6e4f35" />
              <g clipPath="url(#pitClip)">
                <polygon points={pts(floor)} fill="#8d6a4a" />
                <rect x={fl} y={0} width={spread(gravel) - fl} height={2000} fill="url(#gravel)" clipPath="url(#floorClip)" />
                <clipPath id="floorClip">
                  <polygon points={pts(floor)} />
                </clipPath>
                <g clipPath="url(#floorClip)">
                  {f >= 284 ? <rect x={spread(1 - compact)} y={0} width={fr - spread(1 - compact)} height={2000} fill="rgba(70,70,70,0.18)" /> : null}
                  <rect x={fl} y={0} width={spread(sheet) - fl} height={2000} fill="rgba(140,190,215,0.75)" />
                  {sheet > 0 ? [0.33, 0.66].map((k) => <line key={k} x1={spread(k * sheet)} y1={0} x2={spread(k * sheet) + 60} y2={2000} stroke="rgba(255,255,255,0.7)" strokeWidth={3} />) : null}
                  <rect x={fl} y={0} width={spread(sute) - fl} height={2000} fill="#c3c3bd" />
                </g>
              </g>
            </g>
          ) : null}
          {/* soil pile */}
          <ellipse cx={P(660, 330)[0]} cy={P(660, 330)[1]} rx={90 * dig + 1} ry={50 * dig + 1} fill="#7a5a3d" />

          {/* ink lines (墨) */}
          {inkLines.map(([x0, z0, x1, z1], i) => {
            const s = 424 + i * 13;
            const [ax, ay] = P(x0, z0, -D);
            const [bx, by] = P(x1, z1, -D);
            const taut = f >= s && f < s + 8;
            const snapped = f >= s + 8;
            const flash = f >= s + 8 && f < s + 11;
            const mid = [(ax + bx) / 2, (ay + by) / 2];
            const wob = taut ? 0 : 0;
            return (
              <g key={'ink' + i}>
                {taut ? <path d={`M ${ax} ${ay} Q ${mid[0]} ${mid[1] - 10 + wob} ${bx} ${by}`} stroke="#f4f4f4" strokeWidth={2} fill="none" /> : null}
                {snapped ? <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#1b1b1b" strokeWidth={3} /> : null}
                {flash ? <line x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(30,30,30,0.35)" strokeWidth={10} /> : null}
              </g>
            );
          })}

          {/* 地縄 (rope on the ground) */}
          {rope > 0 && d < 1 ? (
            <polyline
              points={pts([P(FP.x0, FP.z0), P(FP.x1, FP.z0), P(FP.x1, FP.z1), P(FP.x0, FP.z1), P(FP.x0, FP.z0)])}
              fill="none"
              stroke="#ffffff"
              strokeWidth={4}
              strokeDasharray={2000}
              strokeDashoffset={2000 * (1 - rope)}
            />
          ) : null}
          {rope > 0 && d < 1
            ? [P(FP.x0, FP.z0), P(FP.x1, FP.z0), P(FP.x1, FP.z1), P(FP.x0, FP.z1)].map(([x, y], i) => <rect key={'rs' + i} x={x - 3} y={y - 16} width={6} height={16} fill="#e9d7b0" />)
            : null}
          {/* tape measure from the boundary pin */}
          {f >= 88 && f < 122 ? (
            <g>
              <line x1={P(-40, 60)[0]} y1={P(-40, 60)[1] - 4} x2={P(-40, 60)[0] + (P(FP.x0, FP.z0)[0] - P(-40, 60)[0]) * tape} y2={P(-40, 60)[1] - 4} stroke="#f6d21f" strokeWidth={6} />
              <rect x={P(-40, 60)[0] - 14} y={P(-40, 60)[1] - 18} width={22} height={22} rx={5} fill="#f6d21f" stroke="#333" strokeWidth={2} />
              <g opacity={ok} transform={`translate(${P(10, 60)[0]},${P(10, 60)[1] - 70})`}>
                <circle r={22} fill="#2f9e5a" />
                <path d="M -10 0 L -3 8 L 11 -8" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
            </g>
          ) : null}

          {/* 遣り方: stakes, boards (水貫), threads (水糸) */}
          {stakeList.map(([x, z], i) => {
            const [sx, sy] = P(x, z);
            const o = ramp(f, 124 + i * 1.2, 128 + i * 1.2);
            return <rect key={'st' + i} x={sx - 4} y={sy - 44 * o} width={8} height={44 * o} fill="#c99a5e" stroke="#9a6f3b" strokeWidth={1.5} />;
          })}
          {boards > 0
            ? (
                [
                  [20, 10, 580, 10],
                  [20, 290, 580, 290],
                  [10, 80, 10, 220],
                  [590, 80, 590, 220],
                ] as [number, number, number, number][]
              ).map(([x0, z0, x1, z1], i) => {
                const [ax, ay] = P(x0, z0, 34);
                const [bx, by] = P(x0 + (x1 - x0) * boards, z0 + (z1 - z0) * boards, 34);
                return <line key={'bd' + i} x1={ax} y1={ay} x2={bx} y2={by} stroke="#e7c48e" strokeWidth={9} />;
              })
            : null}
          {thread > 0
            ? (
                [
                  [FP.x0, 10, FP.x0, 290],
                  [FP.x1, 10, FP.x1, 290],
                  [20, FP.z0, 580, FP.z0],
                  [20, FP.z1, 580, FP.z1],
                ] as [number, number, number, number][]
              ).map(([x0, z0, x1, z1], i) => {
                const [ax, ay] = P(x0, z0, 34);
                const [bx, by] = P(x0 + (x1 - x0) * thread, z0 + (z1 - z0) * thread, 34);
                return <line key={'th' + i} x1={ax} y1={ay} x2={bx} y2={by} stroke="#ff4f8b" strokeWidth={2} />;
              })
            : null}

          {/* tools */}
          {f >= 284 && f < 315 ? (
            <g transform={`translate(${B.x - 50 + Math.sin(f * 3) * 1.5},${B.y - 22})`}>
              <rect x={0} y={0} width={44} height={22} fill="#e2551e" />
              <rect x={4} y={18} width={36} height={6} fill="#444" />
              <line x1={40} y1={2} x2={58} y2={-40} stroke="#333" strokeWidth={4} />
            </g>
          ) : null}
          {f >= 255 && f < 284 ? (
            <g transform={`translate(${A.x + 30},${A.y - 6})`}>
              <line x1={-20} y1={-60} x2={10} y2={0} stroke="#8a5a2b" strokeWidth={4} />
              <rect x={0} y={-2} width={34} height={6} fill="#555" />
            </g>
          ) : null}
          {f >= 318 && f < 356 ? (
            <g>
              <line x1={A.x + 18} y1={A.y - 60} x2={B.x + 18} y2={B.y - 60} stroke="#6aa3c4" strokeWidth={14} strokeLinecap="round" />
            </g>
          ) : null}
          {f >= 364 && f < 400 ? <path d={`M ${A.x + 20} ${A.y - 40} Q ${A.x + 100} ${A.y - 260} ${A.x + 500} ${A.y - 300}`} stroke="#2b2b2b" strokeWidth={9} fill="none" /> : null}
          {f >= 398 && f < 420 ? <rect x={A.x + 18} y={A.y - 8} width={40} height={6} fill="#c9ced6" stroke="#666" strokeWidth={1.5} /> : null}
          {f >= 424 && f < 495 ? (
            <g transform={`translate(${A.x + 22},${A.y - 22})`}>
              <rect x={-12} y={-10} width={26} height={18} rx={6} fill="#7b4a26" />
              <circle cx={1} cy={-1} r={5} fill="#2a1a10" />
            </g>
          ) : null}

          {/* excavator */}
          <g opacity={exIn}>
            <Excavator x={P(640, 120)[0] + (1 - ramp(f, 180, 192)) * 300} y={P(640, 120)[1]} f={f} dig={f >= 192 && f < 246} />
          </g>

          <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.9} flip={A.flip} />
          <Worker x={B.x} y={B.y} action={B.act} f={f} s={0.9} flip={B.flip} phase={5} />
        </g>
      </svg>

      <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', opacity: hook, fontFamily: FONT}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#10161e'}}>木造の家ができるまで #1</div>
        <div style={{fontSize: 92, fontWeight: 900, color: '#10161e', marginTop: 10}}>基礎屋さんの仕事①</div>
        <div style={{fontSize: 42, fontWeight: 700, color: '#10161e', marginTop: 16}}>家が建つ前の、見えない段取り</div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hook, fontFamily: FONT, fontSize: 42, fontWeight: 800, color: '#10161e'}}>基礎屋さんの仕事①</div>
      <div style={{position: 'absolute', top: 70, right: 50, background: '#10161e', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 700, padding: '6px 16px', borderRadius: 8}}>AI演出・早送り</div>
      <Caption f={f} />
      <div style={{position: 'absolute', bottom: 330, width: '100%', display: 'flex', justifyContent: 'center', opacity: cta, transform: `scale(${0.9 + 0.1 * cta})`}}>
        <div style={{background: '#e8622c', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 56, padding: '22px 44px', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>外構・新築のご相談はDMで</div>
      </div>
      <div style={{position: 'absolute', bottom: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: 'rgba(16,22,30,0.9)', color: '#fff', fontFamily: FONT, fontSize: 30, lineHeight: 1.45, padding: '12px 26px', borderRadius: 12, textAlign: 'center'}}>
          AI・CGの架空の工程イメージです
          <br />
          <span style={{color: '#ffd34d'}}>渦巻建設の施工実績ではありません</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
