import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Action, clamp, FONT, ramp, Worker} from './Mokuzou';

const P = (x: number, z: number, h = 0): [number, number] => [150 + x + z * 0.45, 1500 - z * 0.8 - h];
const pts = (a: [number, number][]) => a.map(([x, y]) => `${x},${y}`).join(' ');
const D = 55;
const PIT = {x0: 40, x1: 560, z0: 40, z1: 260};
const FP = {x0: 60, x1: 540, z0: 60, z1: 240};
const HB = -D + 18; // top of base slab
const HT = 60; // top of the foundation walls
const T = 14; // wall thickness

// walls: [x0, z0, x1, z1] along the centre line, drawn back to front
const WALLS: [number, number, number, number][] = [
  [FP.x0, FP.z1, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x0, FP.z1],
  [300, FP.z0, 300, FP.z1],
  [FP.x1, FP.z0, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x1, FP.z0],
];

const CAM: [number, number, number, number][] = [
  [0, 520, 1370, 1.6],
  [45, 520, 1370, 1.6],
  [86, 520, 1370, 1.6],
  [92, 240, 1420, 2.6],
  [108, 240, 1420, 2.6],
  [116, 520, 1370, 1.6],
  [126, 360, 1430, 2.6],
  [152, 360, 1430, 2.6],
  [160, 520, 1370, 1.6],
  [178, 470, 1400, 2.3],
  [204, 600, 1400, 2.3],
  [212, 520, 1370, 1.6],
  [238, 520, 1370, 1.6],
  [244, 700, 1400, 2.4],
  [266, 700, 1400, 2.4],
  [274, 520, 1370, 1.6],
  [290, 330, 1400, 2.6],
  [316, 330, 1400, 2.6],
  [324, 520, 1370, 1.6],
  [356, 520, 1370, 1.6],
  [362, 420, 1400, 2.4],
  [386, 420, 1400, 2.4],
  [394, 520, 1370, 1.6],
  [420, 480, 1390, 2.4],
  [450, 480, 1390, 2.4],
  [460, 520, 1370, 1.6],
  [476, 300, 1410, 2.5],
  [500, 300, 1410, 2.5],
  [510, 520, 1370, 1.6],
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
  [45, 110, '配筋', 'スペーサーを置き、鉄筋を組んで結束する'],
  [110, 165, '設備屋さん', '配管が通るスリーブを先に入れる'],
  [165, 215, '配筋の確認', '本数・かぶり・継手を目で確かめる'],
  [215, 275, '型枠', '外まわりの型枠を立てる'],
  [275, 325, 'アンカーボルト', '土台を留めるボルトを位置に据える'],
  [325, 395, 'ベース打設', '底のコンクリートを打ち、締め固める'],
  [395, 465, '立ち上がり打設', '壁の部分にコンクリートを流し込む'],
  [465, 535, '型枠ばらし・天端', '型枠を外し、上面を平らにならす'],
  [535, 600, '次回：大工さん', 'この基礎に土台を敷いていく'],
];

const Caption: React.FC<{f: number}> = ({f}) => {
  const idx = STEPS.findIndex(([a, b]) => f >= a && f < b);
  if (idx < 0) return null;
  const [a, , title, sub] = STEPS[idx];
  const o = ramp(f, a, a + 8);
  const num = idx < 8 ? `${idx + 1}/8 ` : '';
  return (
    <div style={{position: 'absolute', top: 235, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: FONT}}>
      <div style={{background: idx === 1 ? '#2f8f5b' : '#e8622c', color: '#fff', fontWeight: 900, fontSize: 60, padding: '8px 34px', borderRadius: 14}}>
        <span style={{fontSize: 40, marginRight: 12}}>{num}</span>
        {title}
      </div>
      <div style={{marginTop: 14, background: 'rgba(16,22,30,0.86)', color: '#fff', fontWeight: 700, fontSize: 36, padding: '10px 24px', borderRadius: 12}}>{sub}</div>
    </div>
  );
};

// a box between plan rectangle [x0,x1]x[z0,z1] and heights hb..ht, faces visible from front-right-above
const Box: React.FC<{x0: number; x1: number; z0: number; z1: number; hb: number; ht: number; front: string; side: string; top: string; opacity?: number}> = ({x0, x1, z0, z1, hb, ht, front, side, top, opacity = 1}) => (
  <g opacity={opacity}>
    <polygon points={pts([P(x1, z0, hb), P(x1, z1, hb), P(x1, z1, ht), P(x1, z0, ht)])} fill={side} />
    <polygon points={pts([P(x0, z0, hb), P(x1, z0, hb), P(x1, z0, ht), P(x0, z0, ht)])} fill={front} />
    <polygon points={pts([P(x0, z0, ht), P(x1, z0, ht), P(x1, z1, ht), P(x0, z1, ht)])} fill={top} />
  </g>
);

const wallRect = ([x0, z0, x1, z1]: [number, number, number, number], pad = 0) =>
  z0 === z1 ? {x0: x0 - T / 2 - pad, x1: x1 + T / 2 + pad, z0: z0 - T / 2 - pad, z1: z0 + T / 2 + pad} : {x0: x0 - T / 2 - pad, x1: x0 + T / 2 + pad, z0: z0 - T / 2 - pad, z1: z1 + T / 2 + pad};

export const Kiso2: React.FC<{freezeAt?: number; cam?: (f: number) => {x: number; y: number; z: number}; bare?: boolean; children?: React.ReactNode}> = ({freezeAt, cam: camFn, bare, children}) => {
  const f0 = useCurrentFrame();
  const f = freezeAt ?? f0;
  const cam = camFn ? camFn(f0) : camAt(f);

  const spacer = ramp(f, 48, 56);
  const grid = ramp(f, 55, 84);
  const cage = ramp(f, 78, 104);
  const sleeves = [ramp(f, 126, 134), ramp(f, 142, 150)];
  const checks = [0, 1, 2, 3].map((i) => ramp(f, 176 + i * 7, 180 + i * 7));
  const forms = WALLS.map((_, i) => ramp(f, 220 + i * 7, 234 + i * 7));
  const anchors = ramp(f, 280, 312);
  const base = ramp(f, 330, 380);
  const rise = ramp(f, 408, 452);
  const strip = ramp(f, 470, 500);
  const level = ramp(f, 506, 526);
  const cta = ramp(f, 560, 574);
  const hook = 1 - ramp(f, 36, 46);

  const top: [number, number][] = [P(PIT.x0, PIT.z0), P(PIT.x1, PIT.z0), P(PIT.x1, PIT.z1), P(PIT.x0, PIT.z1)];
  const floor = top.map(([x, y]) => [x, y + D] as [number, number]);
  const fl = P(FP.x0, FP.z0)[0] - 10;
  const fr = P(FP.x1, FP.z1)[0] + 10;
  const spread = (p: number) => fl + (fr - fl) * p;

  const formOpacity = 1 - strip;
  const formDrop = strip * 40;

  // workers
  type W = {x: number; y: number; act: Action; flip?: boolean};
  const on = (x: number, z: number, h: number, act: Action, flip = false): W => {
    const [sx, sy] = P(x, z, h);
    return {x: sx, y: sy, act, flip};
  };
  let A: W = on(-40, 120, 0, 'walk');
  let B: W = on(640, 120, 0, 'idle', true);
  let C: W | null = null;
  if (f < 45) {
    A = on(-80 + 140 * ramp(f, 6, 40), 140, 0, 'walk');
    B = on(700 - 80 * ramp(f, 6, 40), 140, 0, 'walk', true);
  } else if (f < 110) {
    A = on(110, 40, -D, f > 84 ? 'tighten' : 'walk');
    B = on(440, 150, -D, 'tighten', true);
  } else if (f < 165) {
    A = on(110, 40, -D, 'idle');
    B = on(600, 140, 0, 'idle', true);
    const t = ramp(f, 110, 124);
    C = on(-60 + 260 * t, 30, f < 124 ? 0 : -D, f < 124 ? 'walk' : 'press');
  } else if (f < 215) {
    const t = ramp(f, 172, 206);
    B = on(220 + 300 * t, 30, -D, 'walk');
    A = on(110, 40, -D, 'idle');
  } else if (f < 275) {
    A = on(110, 30, -D, 'idle');
    B = on(450, 24, -D, f > 236 ? 'hammer' : 'walk');
  } else if (f < 325) {
    A = on(260, 30, -D, f > 288 ? 'tighten' : 'walk');
    B = on(600, 150, 0, 'idle', true);
  } else if (f < 395) {
    A = on(90 + 380 * base, 150, HB, base < 1 ? 'hose' : 'idle');
    B = on(60 + 360 * base, 110, HB, 'press');
  } else if (f < 465) {
    A = on(80 + 380 * rise, 30, -D, 'hose');
    B = on(600, 120, 0, 'idle', true);
  } else if (f < 535) {
    A = on(240, 26, -D, f < 504 ? 'hammer' : 'idle');
    B = on(330, 150, HB, f > 504 ? 'tighten' : 'idle');
  } else {
    A = on(160, 300, 0, f > 548 ? 'wave' : 'idle');
    B = on(440, 300, 0, f > 552 ? 'wave' : 'idle', true);
  }

  const rebar = '#a2552d';

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {[[-180, 0], [60, 1], [700, 0], [960, 1]].map(([x, k], i) => (
            <g key={'h' + i}>
              <rect x={x} y={1080 - 30 * k} width={180} height={110 + 30 * k} fill={k ? '#d7d2c8' : '#c9cfd4'} />
              <polygon points={pts([[x - 10, 1080 - 30 * k], [x + 90, 1020 - 30 * k], [x + 190, 1080 - 30 * k]])} fill="#6c737b" />
            </g>
          ))}
          <rect x={-900} y={1180} width={2900} height={1200} fill="#8fb26a" />
          <polygon points={pts([P(-90, -60), P(700, -60), P(700, 380), P(-90, 380)])} fill="#c9a77c" />
          {/* pit with sute-con floor and ink lines */}
          <clipPath id="pit2">
            <polygon points={pts(top)} />
          </clipPath>
          <polygon points={pts(top)} fill="#6e4f35" />
          <g clipPath="url(#pit2)">
            <polygon points={pts(floor)} fill="#c3c3bd" />
          </g>
          {WALLS.map(([x0, z0, x1, z1], i) => (
            <line key={'ink' + i} x1={P(x0, z0, -D)[0]} y1={P(x0, z0, -D)[1]} x2={P(x1, z1, -D)[0]} y2={P(x1, z1, -D)[1]} stroke="#1b1b1b" strokeWidth={2.5} opacity={1 - base} />
          ))}

          {/* spacers */}
          {[100, 200, 300, 400, 500].flatMap((x) => [100, 200].map((z) => [x, z])).map(([x, z], i) => {
            const [sx, sy] = P(x, z, -D);
            return <rect key={'sp' + i} x={sx - 5} y={sy - 8 * spacer} width={10} height={8 * spacer} fill="#9a9a94" />;
          })}

          {/* slab rebar grid */}
          {Array.from({length: 25}).map((_, i) => {
            const x = FP.x0 + 10 + i * 19;
            const o = ramp(f, 55 + i * 0.8, 60 + i * 0.8);
            const [ax, ay] = P(x, FP.z0 + 6, -D + 8);
            const [bx, by] = P(x, FP.z1 - 6, -D + 8);
            return <line key={'gx' + i} x1={ax} y1={ay} x2={bx} y2={by} stroke={rebar} strokeWidth={2} opacity={o * grid > 0 ? o : 0} />;
          })}
          {Array.from({length: 9}).map((_, i) => {
            const z = FP.z0 + 10 + i * 20;
            const o = ramp(f, 66 + i * 1.5, 72 + i * 1.5);
            const [ax, ay] = P(FP.x0 + 6, z, -D + 9);
            const [bx, by] = P(FP.x1 - 6, z, -D + 9);
            return <line key={'gz' + i} x1={ax} y1={ay} x2={bx} y2={by} stroke={rebar} strokeWidth={2} opacity={o} />;
          })}
          {/* base concrete covers the grid */}
          <clipPath id="slab">
            <polygon points={pts([P(FP.x0 - 10, FP.z0 - 10, HB), P(FP.x1 + 10, FP.z0 - 10, HB), P(FP.x1 + 10, FP.z1 + 10, HB), P(FP.x0 - 10, FP.z1 + 10, HB)])} />
          </clipPath>
          <g clipPath="url(#slab)">
            <rect x={fl} y={0} width={spread(base) - fl} height={2000} fill="#9d9d97" />
            {base > 0 && base < 1 ? <rect x={spread(base) - 30} y={0} width={30} height={2000} fill="#a6a69f" /> : null}
            <rect x={fl} y={0} width={(spread(level) - fl) * 0} height={2000} fill="#cfcfc9" />
          </g>

          {/* walls: rebar cages -> concrete */}
          {WALLS.map((w, i) => {
            const r = wallRect(w);
            const hTop = HB + (HT - HB) * rise;
            const isX = w[1] === w[3];
            const n = Math.round((isX ? w[2] - w[0] : w[3] - w[1]) / 20);
            return (
              <g key={'w' + i}>
                {/* cage */}
                {Array.from({length: n + 1}).map((_, k) => {
                  const x = isX ? w[0] + k * 20 : w[0];
                  const z = isX ? w[1] : w[1] + k * 20;
                  const o = ramp(f, 78 + i * 4 + k * 0.3, 84 + i * 4 + k * 0.3);
                  const [ax, ay] = P(x, z, -D + 6);
                  const [bx, by] = P(x, z, HT - 4);
                  return <line key={k} x1={ax} y1={ay} x2={bx} y2={by} stroke={rebar} strokeWidth={2} opacity={o} />;
                })}
                {[-D + 14, 10, HT - 6].map((h) => {
                  const [ax, ay] = P(w[0], w[1], h);
                  const [bx, by] = P(w[2], w[3], h);
                  return <line key={'hz' + h} x1={ax} y1={ay} x2={bx} y2={by} stroke={rebar} strokeWidth={2} opacity={cage} />;
                })}
                {rise > 0 ? <Box {...r} hb={HB} ht={hTop} front="#a9a9a3" side="#999993" top="#c2c2bc" /> : null}
                {level > 0 ? <Box {...r} hb={HT} ht={HT + 4 * level} front="#d2d2cc" side="#c3c3bd" top="#deded8" /> : null}
              </g>
            );
          })}

          {/* sleeves */}
          {[
            [200, FP.z0],
            [300, 160],
          ].map(([x, z], i) => {
            const [sx, sy] = P(x, z, -5);
            return (
              <g key={'sl' + i} opacity={sleeves[i]}>
                <rect x={sx - 18} y={sy - 9} width={36} height={18} fill={rise > 0.6 ? '#3a3a3a' : '#9aa7b3'} rx={3} />
                <ellipse cx={sx - 18} cy={sy} rx={4} ry={9} fill="#5c6b78" />
              </g>
            );
          })}

          {/* inspection check marks */}
          {[
            [140, FP.z0],
            [300, 120],
            [420, FP.z0],
            [FP.x1, 150],
          ].map(([x, z], i) => {
            const [sx, sy] = P(x, z, 70);
            return (
              <g key={'ck' + i} opacity={checks[i] * (f < 220 ? 1 : 0)} transform={`translate(${sx},${sy})`}>
                <circle r={16} fill="#2f9e5a" />
                <path d="M -7 0 L -2 6 L 8 -6" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
              </g>
            );
          })}

          {/* anchor bolts with templates */}
          {[
            [FP.x0, FP.z0],
            [180, FP.z0],
            [420, FP.z0],
            [FP.x1, FP.z0],
            [FP.x1, 150],
            [FP.x1, FP.z1],
            [300, 150],
            [FP.x0, 150],
            [FP.x0, FP.z1],
          ].map(([x, z], i) => {
            const o = ramp(f, 280 + i * 3, 286 + i * 3);
            const [sx, sy] = P(x, z, HT);
            return (
              <g key={'ab' + i} opacity={o}>
                <line x1={sx} y1={sy + 40} x2={sx} y2={sy - 22} stroke="#5d6168" strokeWidth={4} />
                <rect x={sx - 6} y={sy - 18} width={12} height={6} fill="#43474d" />
                {f < 470 ? <rect x={sx - 16} y={sy - 14} width={32} height={5} fill="#c99a5e" /> : null}
              </g>
            );
          })}

          {/* forms (outer), translucent so the pour is readable */}
          {WALLS.map((w, i) => {
            if (i === 2) return null;
            const r = wallRect(w, 10);
            const h = (HT + 6 - HB) * forms[i];
            return (
              <g key={'fm' + i} transform={`translate(0,${formDrop})`}>
                <Box {...r} hb={HB} ht={HB + h} front="rgba(214,175,110,0.38)" side="rgba(190,150,90,0.38)" top="rgba(150,110,60,0.4)" opacity={formOpacity} />
              </g>
            );
          })}

          {/* tools */}
          {f >= 325 && f < 395 ? <path d={`M ${A.x + 20} ${A.y - 40} Q ${A.x + 120} ${A.y - 300} ${A.x + 520} ${A.y - 340}`} stroke="#2b2b2b" strokeWidth={9} fill="none" /> : null}
          {f >= 395 && f < 465 ? <path d={`M ${A.x + 20} ${A.y - 40} Q ${A.x + 120} ${A.y - 300} ${A.x + 520} ${A.y - 340}`} stroke="#2b2b2b" strokeWidth={9} fill="none" /> : null}
          {f >= 325 && f < 395 ? <line x1={B.x + 22} y1={B.y - 50} x2={B.x + 30 + Math.sin(f * 3)} y2={B.y + 4} stroke="#555" strokeWidth={4} /> : null}
          {f >= 165 && f < 215 ? <rect x={B.x + 14} y={B.y - 82} width={22} height={28} fill="#f4f4f0" stroke="#555" strokeWidth={2} /> : null}

          {children}
          {!bare && C ? <Worker x={C.x} y={C.y} action={C.act} f={f} s={0.9} flip={C.flip} suit="#2f7d55" vest="#ffd34d" phase={9} /> : null}
          {!bare ? <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.9} flip={A.flip} /> : null}
          {!bare ? <Worker x={B.x} y={B.y} action={B.act} f={f} s={0.9} flip={B.flip} phase={5} /> : null}
        </g>
      </svg>

      {bare ? null : (<>
      <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', opacity: hook, fontFamily: FONT}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#10161e'}}>木造の家ができるまで #2</div>
        <div style={{fontSize: 92, fontWeight: 900, color: '#10161e', marginTop: 10}}>基礎屋さんの仕事②</div>
        <div style={{fontSize: 42, fontWeight: 700, color: '#10161e', marginTop: 16}}>鉄筋からコンクリートの基礎まで</div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hook, fontFamily: FONT, fontSize: 42, fontWeight: 800, color: '#10161e'}}>基礎屋さんの仕事②</div>
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
      </>)}
    </AbsoluteFill>
  );
};
