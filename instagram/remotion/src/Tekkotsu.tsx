import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Action, clamp, FONT, ramp, Worker} from './Mokuzou';

const G = 1380;
const X0 = 110;
const X1 = 770;
const CUT = 550; // interior (left) | exterior face (right)
const F1 = 1300; // 1F floor
const F2 = 1000; // 2F floor (top of beam)
const RF = 700; // roof
const COLS = [110, 330, 550, 750];

const CAM: [number, number, number, number][] = [
  [0, 560, 1060, 1.1],
  [45, 560, 1060, 1.1],
  [58, 160, 1290, 2.4],
  [96, 700, 1290, 2.4],
  [108, 560, 1000, 1.05],
  [148, 560, 1000, 1.05],
  [156, 330, 1240, 2.6],
  [170, 330, 1240, 2.6],
  [180, 560, 1000, 1.1],
  [192, 775, 960, 2.5],
  [220, 775, 960, 2.5],
  [230, 560, 1060, 1.1],
  [240, 235, 1190, 2.4],
  [262, 235, 1190, 2.4],
  [274, 720, 1150, 2.3],
  [298, 720, 920, 2.3],
  [308, 560, 1060, 1.1],
  [340, 560, 1060, 1.1],
  [348, 880, 1160, 1.7],
  [362, 880, 1160, 1.7],
  [376, 560, 1060, 1.1],
  [405, 560, 1090, 0.98],
  [480, 560, 1090, 0.98],
];

const camAt = (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
  const [fa, xa, ya, za] = CAM[i];
  const [fb, xb, yb, zb] = CAM[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: xa + (xb - xa) * t, y: ya + (yb - ya) * t, z: za + (zb - za) * t};
};

const STEPS: [number, number, string][] = [
  [45, 108, '外：基礎とアンカーボルト'],
  [108, 172, '外：クレーンで柱を建てる'],
  [172, 230, '外：梁を架けてボルトで締める'],
  [230, 304, '中：断熱材を入れる／外：黒い外壁パネル'],
  [304, 330, '中：壁・床・照明／外：大きな窓とドア'],
  [330, 364, '外：足場を外して外階段を組む'],
  [364, 480, '完成'],
];

const Caption: React.FC<{f: number}> = ({f}) => {
  const cur = STEPS.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const o = ramp(f, cur[0], cur[0] + 8);
  return (
    <div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
      <div style={{background: 'rgba(16,22,30,0.88)', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 48, padding: '14px 30px', borderRadius: 14}}>{cur[2]}</div>
    </div>
  );
};

export const Tekkotsu: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(f);
  const sp = (start: number, damping = 13) => spring({frame: f - start, fps, config: {damping, stiffness: 120}});

  const dusk = ramp(f, 364, 398);
  const skyTop = `rgb(${Math.round(150 - 95 * dusk)},${Math.round(196 - 125 * dusk)},${Math.round(228 - 110 * dusk)})`;
  const skyBot = `rgb(${Math.round(232 + 10 * dusk)},${Math.round(238 - 75 * dusk)},${Math.round(240 - 115 * dusk)})`;

  const forms = ramp(f, 44, 54) * (1 - ramp(f, 100, 106));
  const pour = ramp(f, 55, 100);
  const anchors = ramp(f, 98, 106);
  const col = COLS.map((_, i) => sp(110 + i * 10));
  const beam2 = sp(174);
  const beamR = sp(186);
  const joints = ramp(f, 196, 204);
  const scaffold = ramp(f, 168, 178) * (1 - ramp(f, 330, 344));
  const deck2 = ramp(f, 228, 244);
  const roofDeck = ramp(f, 240, 256);
  const ins = [ramp(f, 240, 250), ramp(f, 252, 262), ramp(f, 268, 278), ramp(f, 282, 292)];
  const pan1 = ramp(f, 236, 268);
  const pan2 = ramp(f, 268, 300);
  const finish = ramp(f, 304, 320);
  const floors = ramp(f, 306, 324);
  const glass = ramp(f, 306, 322);
  const lamp = ramp(f, 318, 332);
  const stringer = ramp(f, 340, 350);
  const handrail = ramp(f, 356, 362);
  const glow = ramp(f, 372, 396);
  const cta = ramp(f, 420, 434);

  // stair: landing at 2F next to the door, stringer down to ground
  const LX0 = 770;
  const LX1 = 840;
  const SX = 1030; // foot of stair on ground
  const stairY = (x: number) => F2 + ((x - LX1) * (G - F2)) / (SX - LX1);

  // worker A
  let ax = interpolate(f, [10, 44], [-80, 140], clamp);
  let ay = G;
  let aAct: Action = f < 44 ? 'walk' : 'idle';
  if (f >= 54 && f < 104) {
    ax = X0 + pour * (X1 - X0 - 40);
    aAct = 'hose';
  } else if (f >= 104 && f < 230) {
    ax = interpolate(f, [104, 120], [ax, 200], clamp);
    ay = F1;
    aAct = f < 120 ? 'walk' : 'idle';
  } else if (f >= 230 && f < 264) {
    ax = f < 251 ? 200 : 420;
    ay = F1;
    aAct = 'press';
  } else if (f >= 264 && f < 304) {
    ax = f < 281 ? 200 : 420;
    ay = F2 - 12;
    aAct = 'press';
  } else if (f >= 304 && f < 364) {
    ax = interpolate(f, [304, 330], [420, 300], clamp);
    ay = F2 - 12;
    aAct = f < 330 ? 'walk' : 'idle';
  } else if (f >= 364) {
    ax = 300;
    ay = F2 - 12;
    aAct = f > 384 ? 'wave' : 'idle';
  }

  // worker B
  let bx = interpolate(f, [16, 48], [-60, 60], clamp);
  let by = G;
  let bAct: Action = f < 48 ? 'walk' : 'idle';
  let bFlip = false;
  if (f >= 104 && f < 172) {
    bx = interpolate(f, [104, 140], [60, 285], clamp);
    by = f < 140 ? G : F1 + 20;
    bAct = f < 140 ? 'walk' : 'tighten';
  } else if (f >= 172 && f < 230) {
    bx = 822;
    by = 1050;
    bAct = f > 190 ? 'drill' : 'idle';
    bFlip = true;
  } else if (f >= 230 && f < 268) {
    bx = 822;
    by = interpolate(f, [236, 268], [G, 1160], clamp);
    bAct = 'drill';
    bFlip = true;
  } else if (f >= 268 && f < 330) {
    bx = 822;
    by = interpolate(f, [268, 300], [1050, 860], clamp);
    bAct = f < 304 ? 'drill' : 'idle';
    bFlip = true;
  } else if (f >= 330 && f < 366) {
    bx = SX + 30;
    by = G;
    bAct = f > 344 ? 'drill' : 'walk';
    bFlip = true;
  } else if (f >= 366) {
    const t = ramp(f, 366, 388);
    bx = SX - 20 + (LX0 + 40 - (SX - 20)) * t;
    by = t < 1 ? stairY(Math.min(SX, Math.max(LX1, bx))) : F2;
    if (bx < LX1) by = F2;
    bAct = t < 1 ? 'walk' : 'wave';
    bFlip = true;
  }

  const hook = 1 - ramp(f, 36, 46);
  const nTreads = 10;

  return (
    <AbsoluteFill style={{background: `linear-gradient(${skyTop}, ${skyBot})`}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <pattern id="hatchS" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="#5d5f63" />
            <line x1="0" y1="0" x2="0" y2="14" stroke="#7d8086" strokeWidth="5" />
          </pattern>
          <pattern id="blackPanel" width="26" height="1" patternUnits="userSpaceOnUse">
            <rect width="26" height="1" fill="#26292e" />
            <rect width="2" height="1" x="24" fill="#3b3f46" />
          </pattern>
          <linearGradient id="glassS" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c6e3f3" />
            <stop offset="1" stopColor="#7aaed0" />
          </linearGradient>
        </defs>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {[-260, 1120, 1300].map((x, i) => (
            <g key={'t' + i}>
              <rect x={x + 26} y={G - 130} width={10} height={130} fill="#6b4f36" />
              <circle cx={x + 31} cy={G - 160} r={64} fill={i % 2 ? '#5f8f4a' : '#6f9e55'} />
            </g>
          ))}
          <rect x={-800} y={G} width={2700} height={900} fill="#86ad62" />
          <rect x={-800} y={G + 14} width={2700} height={900} fill="#cbbd9e" />

          {/* foundation */}
          <g opacity={forms}>
            <rect x={X0 - 12} y={F1 + 14} width={12} height={G - F1 - 14} fill="#c99a5e" />
            <rect x={X1 + 20} y={F1 + 14} width={12} height={G - F1 - 14} fill="#c99a5e" />
          </g>
          <rect x={X0} y={F1 + 20} width={(X1 + 20 - X0) * pour} height={G - F1 - 20} fill="#a9aaa6" />
          <rect x={X0} y={F1 + 20} width={(X1 + 20 - X0) * pour} height={6} fill="#c3c4bf" />
          {COLS.map((x) => (
            <rect key={'a' + x} x={x + 4} y={F1 + 20 - 12 * anchors} width={4} height={12 * anchors} fill="#6d7178" />
          ))}

          {/* insulation (interior back wall) */}
          {[
            [130, 330, F2 + 30, F1],
            [350, 550, F2 + 30, F1],
            [130, 330, RF + 30, F2 - 12],
            [350, 550, RF + 30, F2 - 12],
          ].map(([xa, xb, ya, yb], i) => (
            <rect key={'i' + i} x={xa} y={yb - (yb - ya) * ins[i]} width={xb - xa} height={(yb - ya) * ins[i]} fill="#f2c7d0" stroke="#d9a6b1" strokeWidth={2} />
          ))}
          {/* interior finish */}
          {[
            [130, 330, F2 + 30, F1],
            [350, 550, F2 + 30, F1],
            [130, 330, RF + 30, F2 - 12],
            [350, 550, RF + 30, F2 - 12],
          ].map(([xa, xb, ya, yb], i) => (
            <rect key={'w' + i} x={xa} y={ya} width={(xb - xa) * finish} height={yb - ya} fill="#f3f1ec" />
          ))}
          {/* back wall big glass (1F) */}
          <g opacity={glass}>
            <rect x={370} y={1060} width={160} height={232} fill="url(#glassS)" stroke="#1d1f22" strokeWidth={6} />
            <rect x={370} y={1060} width={160} height={232} fill={`rgba(255,196,110,${0.85 * glow})`} />
          </g>

          {/* exterior face: black panels */}
          <rect x={CUT + 20} y={F1 - (F1 - F2 - 30) * pan1} width={X1 - CUT} height={(F1 - F2 - 30) * pan1} fill="url(#blackPanel)" />
          <rect x={CUT + 20} y={F2 + 30 - (F2 + 30 - RF) * pan2} width={X1 - CUT} height={(F2 + 30 - RF) * pan2} fill="url(#blackPanel)" />
          <g opacity={glass}>
            <rect x={585} y={1065} width={150} height={225} fill="url(#glassS)" stroke="#111" strokeWidth={6} />
            <line x1={660} y1={1065} x2={660} y2={1290} stroke="#111" strokeWidth={4} />
            <rect x={585} y={1065} width={150} height={225} fill={`rgba(255,196,110,${0.85 * glow})`} />
            <rect x={585} y={760} width={95} height={200} fill="url(#glassS)" stroke="#111" strokeWidth={6} />
            <rect x={585} y={760} width={95} height={200} fill={`rgba(255,196,110,${0.85 * glow})`} />
            {/* 2F door to the stair landing */}
            <rect x={700} y={858} width={58} height={130} fill="#9a6a3c" stroke="#5c3d1f" strokeWidth={4} />
            <circle cx={748} cy={925} r={4} fill="#e2c26a" />
          </g>

          {/* floors */}
          <rect x={X0} y={F1 - 8} width={(CUT - X0) * floors} height={8} fill="#d8b183" />
          <rect x={X0} y={F2 - 20} width={(CUT - X0) * floors} height={8} fill="#d8b183" />
          {/* 2F deck plate */}
          <rect x={X0} y={F2 - 12} width={(X1 + 20 - X0) * deck2} height={12} fill="#8c9096" />
          {/* roof deck + parapet */}
          <rect x={X0 - 10} y={RF - 20} width={(X1 + 40 - X0) * roofDeck} height={20} fill="#3a3d43" />
          <rect x={X0 - 10} y={RF - 40} width={(X1 + 40 - X0) * roofDeck} height={20} fill="#24272c" opacity={roofDeck} />

          {/* steel columns via crane */}
          {COLS.map((x, i) => {
            const p = col[i];
            const off = (1 - Math.min(1, p)) * -700;
            const hanging = p < 0.98 && f >= 110 + i * 10;
            return (
              <g key={'c' + x} transform={`translate(0,${off})`} opacity={f >= 110 + i * 10 ? 1 : 0}>
                <rect x={x} y={RF} width={20} height={F1 + 20 - RF} fill="#4b6584" stroke="#2f4560" strokeWidth={2} />
                {hanging ? <line x1={x + 10} y1={RF} x2={x + 10} y2={RF - 900} stroke="#333" strokeWidth={3} /> : null}
              </g>
            );
          })}
          {/* beams */}
          <g transform={`translate(0,${(1 - Math.min(1, beam2)) * -500})`} opacity={f >= 174 ? 1 : 0}>
            <rect x={X0} y={F2} width={X1 + 20 - X0} height={30} fill="#55708f" stroke="#2f4560" strokeWidth={2} />
            {beam2 < 0.98 ? <line x1={440} y1={F2} x2={440} y2={F2 - 900} stroke="#333" strokeWidth={3} /> : null}
          </g>
          <g transform={`translate(0,${(1 - Math.min(1, beamR)) * -500})`} opacity={f >= 186 ? 1 : 0}>
            <rect x={X0} y={RF} width={X1 + 20 - X0} height={30} fill="#55708f" stroke="#2f4560" strokeWidth={2} />
            {beamR < 0.98 ? <line x1={440} y1={RF} x2={440} y2={RF - 900} stroke="#333" strokeWidth={3} /> : null}
          </g>
          {/* joint plates with bolts */}
          {[F2, RF].map((y) => (
            <g key={'j' + y} opacity={joints}>
              <rect x={738} y={y - 14} width={44} height={58} fill="#3c4f66" stroke="#1f2c3b" strokeWidth={2} />
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={760} cy={y - 2 + k * 17} r={4} fill="#c9ced6" />
              ))}
            </g>
          ))}
          {/* section cut marks */}
          <g opacity={ramp(f, 230, 250)}>
            <rect x={CUT + 14} y={RF + 30} width={6} height={F1 - RF - 30} fill="url(#hatchS)" />
          </g>
          {/* lights */}
          {[230, 450].map((x) => (
            <g key={'l' + x} opacity={lamp}>
              {[F2 + 30, RF + 30].map((y) => (
                <g key={y}>
                  <line x1={x} y1={y} x2={x} y2={y + 60} stroke="#222" strokeWidth={2} />
                  <path d={`M ${x - 20} ${y + 80} L ${x + 20} ${y + 80} L ${x + 10} ${y + 60} L ${x - 10} ${y + 60} Z`} fill="#1f1f1f" />
                  <ellipse cx={x} cy={y + 110} rx={70 * glow + 1} ry={38 * glow + 1} fill={`rgba(255,210,130,${0.35 * glow})`} />
                </g>
              ))}
            </g>
          ))}
          {/* sofa */}
          <g opacity={lamp}>
            <rect x={150} y={1250} width={150} height={42} rx={8} fill="#8a8f96" />
            <rect x={150} y={1226} width={150} height={30} rx={8} fill="#9aa0a7" />
          </g>

          {/* scaffold (beside the building, does not cover the face) */}
          <g opacity={scaffold} transform={`translate(0,${ramp(f, 330, 344) * 140})`}>
            {[790, 870].map((x) => (
              <rect key={x} x={x} y={RF - 20} width={8} height={G - RF + 20} fill="#e0b21b" />
            ))}
            {[RF + 20, 860, 1050, 1160].map((y) => (
              <g key={y}>
                <rect x={782} y={y} width={100} height={10} fill="#c7c9cc" />
                <rect x={782} y={y + 10} width={100} height={4} fill="#9a9da2" />
              </g>
            ))}
          </g>

          {/* exterior stair: landing -> stringer -> treads -> handrail */}
          <g opacity={ramp(f, 338, 342)}>
            <rect x={LX0} y={F2 - 12} width={LX1 - LX0} height={12} fill="#1d1f22" />
            <rect x={LX1 - 8} y={F2} width={8} height={G - F2} fill="#1d1f22" opacity={0.9} />
          </g>
          <line x1={LX1} y1={F2} x2={LX1 + (SX - LX1) * stringer} y2={F2 + (G - F2) * stringer} stroke="#1d1f22" strokeWidth={10} />
          {Array.from({length: nTreads}).map((_, k) => {
            const t = (k + 0.5) / nTreads;
            const x = LX1 + (SX - LX1) * t;
            const y = F2 + (G - F2) * t;
            const o = ramp(f, 346 + k * 1.2, 349 + k * 1.2);
            return <rect key={k} x={x - 14} y={y - 4} width={28} height={6} fill="#2a2d31" opacity={o} />;
          })}
          <g opacity={handrail}>
            <line x1={LX1} y1={F2 - 60} x2={SX} y2={G - 60} stroke="#1d1f22" strokeWidth={5} />
            <line x1={LX0} y1={F2 - 60} x2={LX1} y2={F2 - 60} stroke="#1d1f22" strokeWidth={5} />
            <line x1={SX} y1={G - 60} x2={SX} y2={G} stroke="#1d1f22" strokeWidth={5} />
          </g>

          {/* concrete hose */}
          {f >= 50 && f < 104 ? <path d={`M ${ax + 20} ${F1 + 20} Q ${ax + 60} ${G - 220} ${ax + 260} ${G - 260} L 1400 ${G - 300}`} stroke="#2b2b2b" strokeWidth={10} fill="none" /> : null}
          {/* panel being fixed */}
          {f >= 236 && f < 300 ? <rect x={768} y={by - 120} width={10} height={60} fill="#26292e" /> : null}

          <Worker x={ax} y={ay} action={aAct} f={f} />
          <Worker x={bx} y={by} action={bAct} f={f} flip={bFlip} phase={5} />
        </g>
      </svg>

      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', opacity: hook, fontFamily: FONT}}>
        <div style={{fontSize: 84, fontWeight: 900, color: '#10161e'}}>鉄骨の家ができるまで</div>
        <div style={{fontSize: 44, fontWeight: 700, color: '#10161e', marginTop: 18}}>黒い箱 × 大きな窓 × 外階段</div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hook, fontFamily: FONT, fontSize: 46, fontWeight: 800, color: dusk > 0.5 ? '#fff' : '#10161e'}}>鉄骨の家ができるまで</div>
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
