import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const FONT = "'Noto Sans CJK JP', 'Noto Sans JP', sans-serif";
const G = 1380; // ground line
const X0 = 150;
const X1 = 930;
const CUT = 730; // cut line between interior (left) and exterior face (right)
const PILLARS = [160, 350, 540, 730, 905];
const roofY = (x: number) => 640 + ((x - X0) * 220) / (X1 - X0);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

// camera keyframes: [frame, focusX, focusY, zoom]
const CAM: [number, number, number, number][] = [
  [0, 540, 1060, 1.1],
  [45, 540, 1060, 1.1],
  [60, 200, 1290, 2.4],
  [98, 850, 1290, 2.4],
  [112, 540, 1060, 1.1],
  [124, 215, 1250, 2.7],
  [156, 215, 1250, 2.7],
  [170, 540, 1060, 1.1],
  [184, 840, 820, 2.4],
  [218, 840, 820, 2.4],
  [232, 540, 1060, 1.1],
  [242, 445, 1080, 2.5],
  [266, 445, 1080, 2.5],
  [276, 840, 1060, 2.5],
  [298, 840, 1000, 2.5],
  [312, 540, 1060, 1.1],
  [360, 540, 1060, 1.1],
  [400, 560, 1110, 0.94],
  [480, 560, 1110, 0.94],
];

const camAt = (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
  const [fa, xa, ya, za] = CAM[i];
  const [fb, xb, yb, zb] = CAM[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: xa + (xb - xa) * t, y: ya + (yb - ya) * t, z: za + (zb - za) * t};
};

export type Action = 'idle' | 'walk' | 'hammer' | 'hose' | 'press' | 'drill' | 'wave' | 'tighten';

export const Worker: React.FC<{x: number; y: number; s?: number; action: Action; f: number; flip?: boolean; phase?: number; suit?: string; vest?: string}> = ({x, y, s = 1, action, f, flip, phase = 0, suit = '#2f4a78', vest = '#f08a24'}) => {
  const t = f + phase;
  const legSwing = action === 'walk' ? Math.sin(t * 0.45) * 22 : 0;
  const bob = action === 'walk' ? Math.abs(Math.sin(t * 0.45)) * -3 : 0;
  let shoulder = 20;
  let elbow = -10;
  if (action === 'hammer') {
    const c = (t % 14) / 14; // one strike every 14 frames
    shoulder = c < 0.6 ? interpolate(c, [0, 0.6], [-30, -150]) : interpolate(c, [0.6, 0.75], [-150, -40], clamp);
    elbow = c < 0.6 ? -40 : -10;
  } else if (action === 'drill') {
    shoulder = -80 + Math.sin(t * 2.2) * 3;
    elbow = 0;
  } else if (action === 'tighten') {
    shoulder = -20 + Math.sin(t * 2.2) * 2;
    elbow = -50;
  } else if (action === 'press') {
    shoulder = -85 + Math.sin(t * 0.3) * 6;
    elbow = -5;
  } else if (action === 'hose') {
    shoulder = -40 + Math.sin(t * 0.5) * 8;
    elbow = 30;
  } else if (action === 'wave') {
    shoulder = -160 + Math.sin(t * 0.5) * 18;
    elbow = -20;
  } else if (action === 'walk') {
    shoulder = Math.sin(t * 0.45) * -20 + 10;
  }
  const strike = action === 'hammer' && (t % 14) / 14 > 0.72 && (t % 14) / 14 < 0.9;
  const tool =
    action === 'hammer' ? (
      <g>
        <rect x={-2} y={0} width={4} height={26} fill="#8a5a2b" />
        <rect x={-8} y={22} width={16} height={8} rx={1} fill="#5b6470" />
      </g>
    ) : action === 'drill' || action === 'tighten' ? (
      <g>
        <rect x={-6} y={0} width={12} height={20} rx={3} fill="#1f6fd1" />
        <rect x={-2} y={18} width={4} height={14} fill="#c9ced6" />
      </g>
    ) : action === 'hose' ? (
      <g>
        <rect x={-4} y={0} width={8} height={26} rx={3} fill="#2b2b2b" />
      </g>
    ) : null;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx={0} cy={2} rx={20} ry={4} fill="rgba(0,0,0,0.18)" />
      {/* legs */}
      <g transform={`translate(-6,-50) rotate(${legSwing})`}>
        <rect x={-5} y={0} width={10} height={50} rx={4} fill="#253a5e" />
        <rect x={-6} y={44} width={14} height={7} rx={2} fill="#3a2a1e" />
      </g>
      <g transform={`translate(6,-50) rotate(${-legSwing})`}>
        <rect x={-5} y={0} width={10} height={50} rx={4} fill="#2c4470" />
        <rect x={-6} y={44} width={14} height={7} rx={2} fill="#3a2a1e" />
      </g>
      {/* torso */}
      <rect x={-15} y={-100} width={30} height={54} rx={8} fill={suit} />
      <rect x={-15} y={-80} width={30} height={7} fill={vest} />
      <rect x={-16} y={-52} width={32} height={6} rx={2} fill="#6b4a2a" />
      {/* back arm */}
      <g transform={`translate(-8,-92) rotate(${shoulder * 0.4 + 15})`}>
        <rect x={-5} y={0} width={10} height={30} rx={5} fill="#24406b" />
      </g>
      {/* head */}
      <circle cx={0} cy={-114} r={13} fill="#e8b98f" />
      <path d="M -15 -116 A 15 15 0 0 1 15 -116 Z" fill="#f4f4f2" />
      <rect x={-17} y={-118} width={34} height={4} rx={2} fill="#dcdcd6" />
      {/* front arm */}
      <g transform={`translate(8,-92) rotate(${shoulder})`}>
        <rect x={-5} y={0} width={10} height={26} rx={5} fill={suit} />
        <g transform={`translate(0,24) rotate(${elbow})`}>
          <rect x={-4.5} y={0} width={9} height={24} rx={4.5} fill={suit} />
          <circle cx={0} cy={26} r={5.5} fill="#e8b98f" />
          <g transform="translate(0,24)">{tool}</g>
        </g>
      </g>
      {strike ? (
        <g transform="translate(34,-40)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 12} y2={Math.sin((a * Math.PI) / 180) * 12} stroke="#ffd34d" strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>
      ) : null}
    </g>
  );
};

const Caption: React.FC<{f: number}> = ({f}) => {
  const steps: [number, number, string][] = [
    [45, 108, '外：基礎のコンクリートを打つ'],
    [108, 168, '外：柱を立てる'],
    [168, 232, '外：梁と片流れ屋根を組む'],
    [232, 304, '中：断熱材を入れる／外：杉板を張る'],
    [304, 362, '中：壁・床・照明／外：デッキと足場の撤去'],
    [362, 480, '完成'],
  ];
  const cur = steps.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a] = cur;
  const o = ramp(f, a, a + 8);
  return (
    <div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
      <div style={{background: 'rgba(16,22,30,0.88)', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 50, padding: '14px 34px', borderRadius: 14}}>{cur[2]}</div>
    </div>
  );
};

export const Mokuzou: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(f);
  const sp = (start: number, damping = 12) => spring({frame: f - start, fps, config: {damping, stiffness: 140}});

  // sky: day -> dusk at completion
  const dusk = ramp(f, 360, 395);
  const skyTop = `rgb(${Math.round(150 - 90 * dusk)},${Math.round(196 - 120 * dusk)},${Math.round(228 - 110 * dusk)})`;
  const skyBot = `rgb(${Math.round(232 + 10 * dusk)},${Math.round(238 - 70 * dusk)},${Math.round(240 - 110 * dusk)})`;

  // progress values
  const formsIn = ramp(f, 44, 54);
  const pour = ramp(f, 55, 100);
  const sill = ramp(f, 100, 110);
  const pillar = PILLARS.map((_, i) => sp(112 + i * 9, 10));
  const beam = sp(166, 11);
  const rafters = ramp(f, 182, 202);
  const roof = ramp(f, 200, 222);
  const scaffold = ramp(f, 158, 172) * (1 - ramp(f, 340, 358));
  const insul = [0, 1, 2].map((i) => ramp(f, 236 + i * 14, 248 + i * 14));
  const clad = ramp(f, 236, 300);
  const floor = ramp(f, 302, 322);
  const inwall = [0, 1, 2].map((i) => ramp(f, 304 + i * 6, 316 + i * 6));
  const glass = ramp(f, 310, 326);
  const lamp = ramp(f, 322, 336);
  const deck = ramp(f, 328, 350);
  const glow = ramp(f, 368, 392);
  const cta = ramp(f, 420, 434);

  // worker A (interior / foundation)
  let ax = interpolate(f, [10, 44], [-80, 300], clamp);
  let ay = G;
  let aAct: Action = f < 44 ? 'walk' : 'idle';
  if (f >= 54 && f < 104) {
    ax = X0 + 30 + pour * (X1 - X0 - 60) - 30;
    ay = G;
    aAct = 'hose';
  } else if (f >= 104 && f < 168) {
    ax = interpolate(f, [104, 120], [ax, 520], clamp);
    ay = G - 80;
    aAct = f < 120 ? 'walk' : 'hammer';
  } else if (f >= 168 && f < 232) {
    ax = 470;
    ay = G - 80;
    aAct = 'press';
  } else if (f >= 232 && f < 304) {
    const seg = Math.min(2, Math.floor((f - 236) / 14));
    const target = [255, 445, 635][Math.max(0, seg)];
    ax = interpolate(f, [232, 240], [470, target], clamp);
    if (f > 250) ax = target;
    ay = G - 80;
    aAct = 'press';
  } else if (f >= 304 && f < 362) {
    ax = interpolate(f, [304, 330], [300, 600], clamp);
    ay = G - 80;
    aAct = f < 330 ? 'walk' : 'idle';
  } else if (f >= 362) {
    ax = 430;
    ay = G - 80;
    aAct = f > 372 ? 'wave' : 'idle';
  }

  // worker B (pillars / scaffold / exterior)
  let bx = interpolate(f, [16, 48], [-60, 220], clamp);
  let by = G;
  let bAct: Action = f < 48 ? 'walk' : 'idle';
  let bFlip = false;
  if (f >= 48 && f < 104) {
    bx = 120;
    by = G;
    bAct = 'idle';
  } else if (f >= 104 && f < 168) {
    bx = interpolate(f, [104, 118], [120, 205], clamp);
    by = G - 80;
    bAct = f < 118 ? 'walk' : 'hammer';
  } else if (f >= 168 && f < 232) {
    bx = 985;
    by = 905;
    bAct = 'drill';
    bFlip = true;
  } else if (f >= 232 && f < 304) {
    bx = 985;
    by = interpolate(f, [232, 300], [1300, 1005], clamp);
    bAct = 'hammer';
    bFlip = true;
  } else if (f >= 304 && f < 362) {
    bx = interpolate(f, [304, 330], [985, 1000], clamp);
    by = G - 60;
    bAct = f < 340 ? 'hammer' : 'idle';
    bFlip = true;
  } else if (f >= 362) {
    bx = 1000;
    by = G - 60;
    bAct = f > 378 ? 'wave' : 'idle';
    bFlip = true;
  }

  const hookTitle = 1 - ramp(f, 36, 46);

  return (
    <AbsoluteFill style={{background: `linear-gradient(${skyTop}, ${skyBot})`}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="#5d5f63" />
            <line x1="0" y1="0" x2="0" y2="14" stroke="#7d8086" strokeWidth="5" />
          </pattern>
          <pattern id="cedar" width="1" height="18" patternUnits="userSpaceOnUse">
            <rect width="1" height="18" fill="#b9814d" />
            <rect width="1" height="2" y="16" fill="#8d5d33" />
          </pattern>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#bfe0f2" />
            <stop offset="1" stopColor="#7fb3d3" />
          </linearGradient>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {/* distant trees */}
          {[-200, 40, 1080, 1250].map((x, i) => (
            <g key={'t' + i}>
              <rect x={x + 26} y={G - 120} width={10} height={120} fill="#6b4f36" />
              <circle cx={x + 31} cy={G - 150} r={60} fill={i % 2 ? '#5f8f4a' : '#6f9e55'} />
            </g>
          ))}
          {/* ground */}
          <rect x={-800} y={G} width={2700} height={900} fill="#86ad62" />
          <rect x={-800} y={G + 14} width={2700} height={900} fill="#cbbd9e" />
          <rect x={-800} y={G + 14} width={2700} height={6} fill="#b3a483" />
          {/* foundation forms */}
          <g opacity={formsIn * (1 - ramp(f, 100, 108))}>
            <rect x={X0 - 12} y={G - 66} width={12} height={66} fill="#c99a5e" />
            <rect x={X1} y={G - 66} width={12} height={66} fill="#c99a5e" />
          </g>
          {/* foundation pour */}
          <rect x={X0} y={G - 60} width={(X1 - X0) * pour} height={60} fill="#a9aaa6" />
          <rect x={X0} y={G - 60} width={(X1 - X0) * pour} height={8} fill="#c3c4bf" />
          {/* sill + floor deck structure */}
          <rect x={X0} y={G - 80} width={(X1 - X0) * sill} height={20} fill="#c8925a" />
          {/* back wall insulation (interior zone) */}
          {[0, 1, 2].map((i) => {
            const xa = PILLARS[i] + 22;
            const xb = PILLARS[i + 1];
            const top = roofY(xb) + 10;
            const h = (G - 80 - top) * insul[i];
            return <rect key={i} x={xa} y={G - 80 - h} width={xb - xa} height={h} fill="#f3d24e" stroke="#d8b232" strokeWidth={2} />;
          })}
          {/* interior wall finish over insulation */}
          {[0, 1, 2].map((i) => {
            const xa = PILLARS[i] + 22;
            const xb = PILLARS[i + 1];
            const top = roofY(xb) + 10;
            return <rect key={'w' + i} x={xa} y={top} width={(xb - xa) * inwall[i]} height={G - 80 - top} fill="#f4f1ea" />;
          })}
          {/* back-wall window */}
          <g opacity={glass}>
            <rect x={395} y={950} width={110} height={190} fill="url(#glass)" stroke="#2b2b2b" strokeWidth={6} />
            <rect x={395} y={950} width={110} height={190} fill={`rgba(255,196,110,${0.85 * glow})`} />
          </g>
          {/* exterior face cladding (right zone) */}
          <g>
            <clipPath id="cladClip">
              <rect x={CUT + 22} y={G - 80 - (G - 80 - roofY(CUT)) * clad} width={X1 - CUT - 22 + 6} height={(G - 80 - roofY(CUT)) * clad + 2} />
            </clipPath>
            <polygon clipPath="url(#cladClip)" points={`${CUT + 22},${G - 80} ${X1 + 6},${G - 80} ${X1 + 6},${roofY(X1)} ${CUT + 22},${roofY(CUT)}`} fill="url(#cedar)" />
            <polygon clipPath="url(#cladClip)" points={`${CUT + 22},${G - 80} ${CUT + 80},${G - 80} ${CUT + 80},${roofY(CUT + 80)} ${CUT + 22},${roofY(CUT)}`} fill="#f2efe8" />
            <g opacity={glass}>
              <rect x={820} y={1030} width={70} height={130} fill="url(#glass)" stroke="#222" strokeWidth={5} />
              <rect x={820} y={1030} width={70} height={130} fill={`rgba(255,196,110,${0.85 * glow})`} />
            </g>
          </g>
          {/* pillars */}
          {PILLARS.map((x, i) => {
            const top = roofY(x + 11);
            const full = G - 80 - top;
            const h = full * Math.min(1, pillar[i]);
            return <rect key={x} x={x} y={G - 80 - h} width={22} height={h} fill="#d9a466" stroke="#a87440" strokeWidth={2} />;
          })}
          {/* exposed beam (見せ梁) */}
          <g transform={`translate(0,${(1 - Math.min(1, beam)) * -260})`} opacity={Math.min(1, beam * 3)}>
            <rect x={X0} y={880} width={CUT - X0 + 22} height={30} fill="#c88b4f" stroke="#99602d" strokeWidth={2} />
          </g>
          {/* rafters */}
          {Array.from({length: 9}).map((_, i) => {
            const x = X0 - 20 + i * 100;
            const vis = ramp(f, 182 + i * 2, 186 + i * 2);
            return <rect key={i} x={x} y={roofY(x) - 18} width={14} height={18} fill="#b9814d" opacity={vis * (1 - roof * 0.0)} />;
          })}
          {/* roof */}
          <g>
            <clipPath id="roofClip">
              <rect x={X0 - 60} y={0} width={(X1 - X0 + 140) * roof} height={1400} />
            </clipPath>
            <polygon clipPath="url(#roofClip)" points={`${X0 - 50},${roofY(X0 - 50) - 22} ${X1 + 60},${roofY(X1 + 60) - 22} ${X1 + 60},${roofY(X1 + 60) + 8} ${X0 - 50},${roofY(X0 - 50) + 8}`} fill="#3d4148" />
            <polygon clipPath="url(#roofClip)" points={`${X0 - 50},${roofY(X0 - 50) - 22} ${X1 + 60},${roofY(X1 + 60) - 22} ${X1 + 60},${roofY(X1 + 60) - 16} ${X0 - 50},${roofY(X0 - 50) - 16}`} fill="#5b616b" />
          </g>
          {/* floor boards */}
          <rect x={X0} y={G - 86} width={(CUT - X0) * floor} height={8} fill="#d8b183" />
          {/* pendant lights */}
          {[300, 590].map((x) => (
            <g key={x} opacity={lamp}>
              <line x1={x} y1={910} x2={x} y2={990} stroke="#222" strokeWidth={2} />
              <path d={`M ${x - 22} 1010 L ${x + 22} 1010 L ${x + 12} 990 L ${x - 12} 990 Z`} fill="#2a2a2a" />
              <ellipse cx={x} cy={1040} rx={70 * glow + 1} ry={40 * glow + 1} fill={`rgba(255,210,130,${0.35 * glow})`} />
            </g>
          ))}
          {/* section cut band */}
          <g opacity={ramp(f, 112, 140)}>
            <rect x={X0 - 8} y={roofY(X0) + 8} width={8} height={G - roofY(X0) - 8} fill="url(#hatch)" />
            <rect x={CUT + 18} y={roofY(CUT) + 8} width={6} height={G - 80 - roofY(CUT)} fill="url(#hatch)" opacity={clad > 0 ? 1 : 0} />
          </g>
          {/* deck */}
          <g>
            <rect x={X1 + 6} y={G - 74} width={170 * deck} height={12} fill="#9a6a3c" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={X1 + 20 + i * 60} y={G - 62} width={8} height={62 * deck} fill="#7d5530" />
            ))}
          </g>
          {/* scaffold (in front of exterior face) */}
          <g opacity={scaffold} transform={`translate(0,${ramp(f, 340, 358) * 120})`}>
            {[950, 1030].map((x) => (
              <rect key={x} x={x} y={760} width={8} height={G - 760} fill="#e0b21b" />
            ))}
            {[905, 1005, 1300].map((y) => (
              <g key={y}>
                <rect x={940} y={y} width={100} height={10} fill="#c7c9cc" />
                <rect x={940} y={y + 10} width={100} height={4} fill="#9a9da2" />
              </g>
            ))}
            <line x1={950} y1={1300} x2={1038} y2={1005} stroke="#e0b21b" strokeWidth={5} />
          </g>
          {/* concrete hose */}
          {f >= 50 && f < 104 ? <path d={`M ${ax + 20} ${G - 60} Q ${ax + 60} ${G - 220} ${ax + 260} ${G - 260} L 1300 ${G - 300}`} stroke="#2b2b2b" strokeWidth={10} fill="none" /> : null}
          {/* cladding board being carried */}
          {f >= 232 && f < 300 ? <rect x={bx - 70} y={by - 64} width={60} height={14} fill="#b9814d" stroke="#8d5d33" strokeWidth={2} /> : null}
          <Worker x={ax} y={ay} action={aAct} f={f} />
          <Worker x={bx} y={by} action={bAct} f={f} flip={bFlip} phase={5} />
        </g>
      </svg>

      {/* hook title */}
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', opacity: hookTitle, fontFamily: FONT}}>
        <div style={{fontSize: 84, fontWeight: 900, color: '#10161e', letterSpacing: 2}}>木造の家ができるまで</div>
        <div style={{fontSize: 44, fontWeight: 700, color: '#10161e', marginTop: 18}}>職人の手元を早送りで</div>
      </div>

      {/* persistent header */}
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hookTitle, fontFamily: FONT, fontSize: 46, fontWeight: 800, color: dusk > 0.5 ? '#fff' : '#10161e'}}>木造の家ができるまで</div>
      <div style={{position: 'absolute', top: 70, right: 50, background: '#10161e', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 700, padding: '6px 16px', borderRadius: 8}}>AI演出・早送り</div>

      <Caption f={f} />

      {/* CTA */}
      <div style={{position: 'absolute', bottom: 330, width: '100%', display: 'flex', justifyContent: 'center', opacity: cta, transform: `scale(${0.9 + 0.1 * cta})`}}>
        <div style={{background: '#e8622c', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 56, padding: '22px 44px', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>外構・新築のご相談はDMで</div>
      </div>

      {/* disclaimer (always) */}
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
