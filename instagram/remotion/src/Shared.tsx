import React from 'react';
import {Easing, interpolate} from 'remotion';
import {clamp, FONT, ramp} from './Mokuzou';

// oblique projection shared by the trade series
export const P = (x: number, z: number, h = 0): [number, number] => [150 + x + z * 0.45, 1500 - z * 0.8 - h];
export const pts = (a: [number, number][]) => a.map(([x, y]) => `${x},${y}`).join(' ');

export const FP = {x0: 60, x1: 540, z0: 60, z1: 240};
export const HB = -37;
export const HT = 60;
export const H1 = HT + 16;
export const H2 = H1 + 190;
export const H3 = H2 + 180;
export const HR = H3 + 90;

export const WOOD = {front: '#d9a466', side: '#bf8a4f', top: '#e9bd84'};
export const CONC = {front: '#a9a9a3', side: '#999993', top: '#c9c9c3'};

export const WALLS: [number, number, number, number][] = [
  [FP.x0, FP.z1, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x0, FP.z1],
  [300, FP.z0, 300, FP.z1],
  [FP.x1, FP.z0, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x1, FP.z0],
];
export const lineBox = ([x0, z0, x1, z1]: [number, number, number, number], t: number) =>
  z0 === z1 ? {x0: x0 - t, x1: x1 + t, z0: z0 - t, z1: z0 + t} : {x0: x0 - t, x1: x0 + t, z0: z0 - t, z1: z1 + t};

export const COLS: [number, number][] = [
  ...[60, 180, 300, 420, 540].map((x) => [x, 240] as [number, number]),
  [60, 150],
  [300, 150],
  [540, 150],
  ...[60, 180, 300, 420, 540].map((x) => [x, 60] as [number, number]),
];

// roof slope height at plan depth z (gable, ridge along x at z=150)
export const roofH = (z: number) => (z <= 150 ? H3 + ((z - 40) / 110) * 90 : H3 + ((260 - z) / 110) * 90);

export const Box: React.FC<{x0: number; x1: number; z0: number; z1: number; hb: number; ht: number; front: string; side: string; top: string; dy?: number; opacity?: number}> = ({x0, x1, z0, z1, hb, ht, front, side, top, dy = 0, opacity = 1}) => (
  <g opacity={opacity} transform={`translate(0,${dy})`}>
    <polygon points={pts([P(x1, z0, hb), P(x1, z1, hb), P(x1, z1, ht), P(x1, z0, ht)])} fill={side} />
    <polygon points={pts([P(x0, z0, hb), P(x1, z0, hb), P(x1, z0, ht), P(x0, z0, ht)])} fill={front} />
    <polygon points={pts([P(x0, z0, ht), P(x1, z0, ht), P(x1, z1, ht), P(x0, z1, ht)])} fill={top} />
  </g>
);

export const makeCam = (CAM: [number, number, number, number][]) => (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
  const [fa, xa, ya, za] = CAM[i];
  const [fb, xb, yb, zb] = CAM[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: xa + (xb - xa) * t, y: ya + (yb - ya) * t, z: za + (zb - za) * t};
};

export const Backdrop: React.FC = () => (
  <g>
    {[[-180, 0], [60, 1], [760, 0], [990, 1]].map(([x, k], i) => (
      <g key={'h' + i}>
        <rect x={x} y={1080 - 30 * k} width={180} height={110 + 30 * k} fill={k ? '#d7d2c8' : '#c9cfd4'} />
        <polygon points={pts([[x - 10, 1080 - 30 * k], [x + 90, 1020 - 30 * k], [x + 190, 1080 - 30 * k]])} fill="#6c737b" />
      </g>
    ))}
    <rect x={-900} y={1180} width={2900} height={1200} fill="#8fb26a" />
    <polygon points={pts([P(-90, -60), P(860, -60), P(860, 380), P(-90, 380)])} fill="#c9a77c" />
  </g>
);

// the frame as it stands after 上棟 (#3), without scaffold
export const BuiltFrame: React.FC<{rafterStep?: number}> = ({rafterStep = 80}) => (
  <g>
    <polygon points={pts([P(FP.x0, FP.z0, HB), P(FP.x1, FP.z0, HB), P(FP.x1, FP.z1, HB), P(FP.x0, FP.z1, HB)])} fill="#9d9d97" />
    {WALLS.map((w, i) => (
      <Box key={'fw' + i} {...lineBox(w, 7)} hb={HB} ht={HT} {...CONC} />
    ))}
    {WALLS.map((w, i) => (
      <g key={'s' + i}>
        <Box {...lineBox(w, 7)} hb={HT} ht={HT + 4} front="#2b2b2b" side="#222" top="#333" />
        <Box {...lineBox(w, 7)} hb={HT + 4} ht={H1 - 4} {...WOOD} />
      </g>
    ))}
    <polygon points={pts([P(FP.x0, FP.z0, H1), P(FP.x1, FP.z0, H1), P(FP.x1, FP.z1, H1), P(FP.x0, FP.z1, H1)])} fill="#d8c08f" />
    {COLS.map(([x, z], i) => (
      <Box key={'c' + i} x0={x - 7} x1={x + 7} z0={z - 7} z1={z + 7} hb={H1} ht={H2 - 16} {...WOOD} />
    ))}
    {WALLS.map((w, i) => (
      <Box key={'b2' + i} {...lineBox(w, 8)} hb={H2 - 16} ht={H2} {...WOOD} />
    ))}
    <polygon points={pts([P(FP.x0, FP.z0, H2 + 2), P(FP.x1, FP.z0, H2 + 2), P(FP.x1, FP.z1, H2 + 2), P(FP.x0, FP.z1, H2 + 2)])} fill="#d8c08f" opacity={0.85} />
    {COLS.map(([x, z], i) => (
      <Box key={'c2' + i} x0={x - 7} x1={x + 7} z0={z - 7} z1={z + 7} hb={H2} ht={H3 - 16} {...WOOD} />
    ))}
    {WALLS.map((w, i) => (
      <Box key={'e' + i} {...lineBox(w, 8)} hb={H3 - 16} ht={H3} {...WOOD} />
    ))}
    {[60, 300, 540].map((x) => (
      <Box key={'rp' + x} x0={x - 5} x1={x + 5} z0={145} z1={155} hb={H3} ht={HR - 14} {...WOOD} />
    ))}
    <Box x0={40} x1={560} z0={142} z1={158} hb={HR - 14} ht={HR} front="#e0ad6c" side="#c4904f" top="#f0c88f" />
    {Array.from({length: Math.floor(480 / rafterStep) + 1}).map((_, i) => {
      const x = 60 + i * rafterStep;
      return <polyline key={'rf' + i} points={pts([P(x, 40, H3 - 10), P(x, 150, HR + 4), P(x, 260, H3 - 10)])} stroke="#c48d52" strokeWidth={7} fill="none" />;
    })}
  </g>
);

export const Scaffold: React.FC<{opacity?: number; dy?: number}> = ({opacity = 1, dy = 0}) => (
  <g opacity={opacity} transform={`translate(0,${dy})`}>
    {[30, 134, 238, 342, 446, 550].map((x) => (
      <line key={'sp' + x} x1={P(x, 22)[0]} y1={P(x, 22)[1]} x2={P(x, 22, H3 + 60)[0]} y2={P(x, 22, H3 + 60)[1]} stroke="#8d949b" strokeWidth={3} />
    ))}
    {[40, 150, 260].map((z) => (
      <line key={'sr' + z} x1={P(578, z)[0]} y1={P(578, z)[1]} x2={P(578, z, H3 + 60)[0]} y2={P(578, z, H3 + 60)[1]} stroke="#8d949b" strokeWidth={3} />
    ))}
    {[110, H2 - 20, H3 - 20, H3 + 50].map((h) => (
      <g key={'pl' + h}>
        <polyline points={pts([P(30, 22, h), P(578, 22, h), P(578, 260, h)])} stroke="#b9bdc2" strokeWidth={6} fill="none" />
        <polyline points={pts([P(30, 22, h + 40), P(578, 22, h + 40), P(578, 260, h + 40)])} stroke="#e0b21b" strokeWidth={2} fill="none" />
      </g>
    ))}
  </g>
);

export type Step = [number, number, string, string, boolean];

export const Overlay: React.FC<{f: number; ep: number; title: string; sub: string; steps: Step[]; total: number; ctaAt: number}> = ({f, ep, title, sub, steps, total, ctaAt}) => {
  const hook = 1 - ramp(f, 36, 46);
  const cta = ramp(f, ctaAt, ctaAt + 14);
  const idx = steps.findIndex(([a, b]) => f >= a && f < b);
  const cur = idx >= 0 ? steps[idx] : null;
  const o = cur ? ramp(f, cur[0], cur[0] + 8) : 0;
  return (
    <>
      <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', opacity: hook, fontFamily: FONT}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#10161e'}}>木造の家ができるまで #{ep}</div>
        <div style={{fontSize: 92, fontWeight: 900, color: '#10161e', marginTop: 10}}>{title}</div>
        <div style={{fontSize: 42, fontWeight: 700, color: '#10161e', marginTop: 16}}>{sub}</div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hook, fontFamily: FONT, fontSize: 42, fontWeight: 800, color: '#10161e'}}>{title}</div>
      <div style={{position: 'absolute', top: 70, right: 50, background: '#10161e', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 700, padding: '6px 16px', borderRadius: 8}}>AI演出・早送り</div>
      {cur ? (
        <div style={{position: 'absolute', top: 235, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: FONT}}>
          <div style={{background: cur[4] ? '#2f8f5b' : '#e8622c', color: '#fff', fontWeight: 900, fontSize: cur[2].length > 9 ? 52 : 60, padding: '8px 30px', borderRadius: 14}}>
            {idx < total ? <span style={{fontSize: 40, marginRight: 12}}>{`${idx + 1}/${total}`}</span> : null}
            {cur[2]}
          </div>
          <div style={{marginTop: 14, background: 'rgba(16,22,30,0.86)', color: '#fff', fontWeight: 700, fontSize: 36, padding: '10px 24px', borderRadius: 12}}>{cur[3]}</div>
        </div>
      ) : null}
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
    </>
  );
};
