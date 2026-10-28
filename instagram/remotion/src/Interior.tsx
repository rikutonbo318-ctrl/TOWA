import React from 'react';
import {Action, FONT, Worker} from './Mokuzou';

// one-point perspective interior (metres). camera at x=0, eye height EYE, looking down +z
export const FL = 560;
export const HY = 1010;
export const EYE = 1.45;
export const RX = 2.4; // half room width
export const RH = 2.5; // ceiling height
export const ZN = 0.6; // near clip
export const ZB = 6.6; // back wall
export type V3 = [number, number, number];

export const pr = (x: number, y: number, z: number): [number, number] => [540 + (x * FL) / z, HY - ((y - EYE) * FL) / z];
export const poly = (a: V3[]) => a.map((p) => pr(...p).join(',')).join(' ');

export const Q3: React.FC<{p: V3[]; fill: string; stroke?: string; sw?: number; opacity?: number}> = ({p, fill, stroke, sw, opacity}) => (
  <polygon points={poly(p)} fill={fill} stroke={stroke} strokeWidth={sw} opacity={opacity} />
);
export const L3: React.FC<{a: V3; b: V3; stroke: string; sw?: number; opacity?: number; dash?: string}> = ({a, b, stroke, sw = 2, opacity, dash}) => {
  const [x1, y1] = pr(...a);
  const [x2, y2] = pr(...b);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} opacity={opacity} strokeDasharray={dash} strokeLinecap="round" />;
};

export type Shade = {front: string; side: string; top: string; bottom?: string};
// axis-aligned box: draws only the faces the camera can see
export const Box3: React.FC<{x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; c: Shade; opacity?: number; dy?: number}> = ({x0, x1, y0, y1, z0, z1, c, opacity = 1, dy = 0}) => (
  <g opacity={opacity} transform={dy ? `translate(0,${dy})` : undefined}>
    {x0 > 0 ? <Q3 p={[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]} fill={c.side} /> : null}
    {x1 < 0 ? <Q3 p={[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]} fill={c.side} /> : null}
    {y1 < EYE ? <Q3 p={[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]} fill={c.top} /> : null}
    {y0 > EYE ? <Q3 p={[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]} fill={c.bottom ?? c.top} /> : null}
    <Q3 p={[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]} fill={c.front} />
  </g>
);

// wall planes as quads
export const leftWall = (z0: number, z1: number, y0: number, y1: number, inset = 0): V3[] => [[-RX + inset, y0, z0], [-RX + inset, y0, z1], [-RX + inset, y1, z1], [-RX + inset, y1, z0]];
export const rightWall = (z0: number, z1: number, y0: number, y1: number, inset = 0): V3[] => [[RX - inset, y0, z0], [RX - inset, y0, z1], [RX - inset, y1, z1], [RX - inset, y1, z0]];
export const backWall = (x0: number, x1: number, y0: number, y1: number, inset = 0): V3[] => [[x0, y0, ZB - inset], [x1, y0, ZB - inset], [x1, y1, ZB - inset], [x0, y1, ZB - inset]];
export const floorQ = (x0: number, x1: number, z0: number, z1: number, y = 0): V3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
export const ceilQ = (x0: number, x1: number, z0: number, z1: number, y = RH): V3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];

// openings
export const WIN_BACK = {x0: -1.6, x1: 0.5, y0: 0.02, y1: 2.2};
export const WIN_LEFT = {z0: 3.1, z1: 4.6, y0: 1.0, y1: 2.0};
export const DOOR_RIGHT = {z0: 4.5, z1: 5.3, y0: 0, y1: 2.05};

// stud positions (455 pitch)
const PITCH = 0.455;
export const STUD_Z: number[] = [];
for (let z = 1.0; z < ZB - 0.1; z += PITCH) STUD_Z.push(+z.toFixed(3));
export const STUD_X: number[] = [];
for (let x = -RX + 0.1; x < RX - 0.05; x += PITCH) STUD_X.push(+x.toFixed(3));
export const JOIST_Z: number[] = STUD_Z;

const inOpening = {
  left: (z: number) => z > WIN_LEFT.z0 - 0.02 && z < WIN_LEFT.z1,
  right: (z: number) => z > DOOR_RIGHT.z0 - 0.02 && z < DOOR_RIGHT.z1,
  back: (x: number) => x > WIN_BACK.x0 - 0.02 && x < WIN_BACK.x1,
};

export const WOOD3: Shade = {front: '#d8ab72', side: '#c4955c', top: '#e7c08c', bottom: '#b8894f'};
const SHEATH = '#c9a36e';

export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8fc3ea" />
      <stop offset="0.7" stopColor="#d9ecf6" />
      <stop offset="1" stopColor="#eef3e6" />
    </linearGradient>
    <pattern id="wool" width={18} height={18} patternUnits="userSpaceOnUse">
      <rect width={18} height={18} fill="#f0cc58" />
      <path d="M 0 5 Q 4 2 9 5 T 18 5 M 0 13 Q 4 10 9 13 T 18 13" stroke="#e2b63e" strokeWidth={1.4} fill="none" />
    </pattern>
    <pattern id="cover" width={60} height={60} patternUnits="userSpaceOnUse">
      <rect width={60} height={60} fill="#d5dadb" />
      <path d="M 0 0 L 60 0" stroke="#b9c0c2" strokeWidth={2} />
    </pattern>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="rgba(255,226,170,0.75)" />
      <stop offset="1" stopColor="rgba(255,226,170,0)" />
    </radialGradient>
  </defs>
);

// outdoor view seen through the openings
const Outside: React.FC = () => (
  <g>
    <Q3 p={backWall(WIN_BACK.x0, WIN_BACK.x1, WIN_BACK.y0, WIN_BACK.y1, -0.01)} fill="url(#sky)" />
    <Q3 p={backWall(WIN_BACK.x0, WIN_BACK.x1, WIN_BACK.y0, 0.7, -0.01)} fill="#9cbf7a" />
    <Q3 p={backWall(-1.2, -0.3, 0.7, 1.6, -0.01)} fill="#6f9a5c" />
    <Q3 p={leftWall(WIN_LEFT.z0, WIN_LEFT.z1, WIN_LEFT.y0, WIN_LEFT.y1, -0.01)} fill="url(#sky)" />
    <Q3 p={rightWall(DOOR_RIGHT.z0, DOOR_RIGHT.z1, DOOR_RIGHT.y0, DOOR_RIGHT.y1, -0.01)} fill="#6d6a64" />
  </g>
);

// shell: sheathing, floor and the open ceiling of a framed room
export const Shell: React.FC<{floor?: 'ply' | 'cover' | 'oak'; ceiling?: 'open' | 'board'}> = ({floor = 'ply', ceiling = 'open'}) => (
  <g>
    <rect x={-2000} y={-2000} width={5000} height={6000} fill="#3d3a36" />
    <Q3 p={ceilQ(-RX, RX, ZN, ZB)} fill={ceiling === 'open' ? '#8a6f4d' : '#f2f1ec'} />
    <Q3 p={leftWall(ZN, ZB, 0, RH)} fill={SHEATH} />
    <Q3 p={rightWall(ZN, ZB, 0, RH)} fill="#d3ad78" />
    <Q3 p={backWall(-RX, RX, 0, RH)} fill="#d6b17c" />
    <Q3 p={floorQ(-RX, RX, ZN, ZB)} fill={floor === 'oak' ? '#c49a6c' : floor === 'cover' ? 'url(#cover)' : '#cfa66f'} />
    {floor === 'oak'
      ? Array.from({length: 20}).map((_, i) => {
          const x = -RX + i * 0.25;
          return <L3 key={'fb' + i} a={[x, 0, ZN]} b={[x, 0, ZB]} stroke="#ad845a" sw={1.5} />;
        })
      : null}
    {floor === 'ply'
      ? [-1.8, -0.9, 0, 0.9, 1.8].map((x) => <L3 key={'pl' + x} a={[x, 0, ZN]} b={[x, 0, ZB]} stroke="#b88d55" sw={1.5} />)
      : null}
    {floor === 'cover'
      ? [-1.8, 0, 1.8].map((x) => <L3 key={'cv' + x} a={[x, 0.002, ZN]} b={[x, 0.002, ZB]} stroke="#8fa0a6" sw={4} />)
      : null}
    {floor !== 'oak' ? [2, 3.5, 5].map((z) => <L3 key={'pz' + z} a={[-RX, 0, z]} b={[RX, 0, z]} stroke={floor === 'cover' ? '#9fb0b5' : '#b88d55'} sw={1.5} />) : null}
  </g>
);

export const Openings: React.FC<{frame?: string; glass?: boolean}> = ({frame = '#2e3236', glass = true}) => (
  <g>
    <Outside />
    {glass ? (
      <g>
        <Q3 p={backWall(WIN_BACK.x0, WIN_BACK.x1, WIN_BACK.y0, WIN_BACK.y1, 0.02)} fill="rgba(255,255,255,0.12)" />
        <L3 a={[(WIN_BACK.x0 + WIN_BACK.x1) / 2, WIN_BACK.y0, ZB - 0.02]} b={[(WIN_BACK.x0 + WIN_BACK.x1) / 2, WIN_BACK.y1, ZB - 0.02]} stroke={frame} sw={5} />
        <Q3 p={[[WIN_BACK.x0 + 0.2, 1.9, ZB - 0.03], [WIN_BACK.x0 + 0.5, 1.9, ZB - 0.03], [WIN_BACK.x0 + 0.3, 0.5, ZB - 0.03], [WIN_BACK.x0 + 0.15, 0.5, ZB - 0.03]]} fill="rgba(255,255,255,0.28)" />
      </g>
    ) : null}
    {/* frames */}
    {[
      [[WIN_BACK.x0, WIN_BACK.y0, ZB - 0.02], [WIN_BACK.x1, WIN_BACK.y0, ZB - 0.02], [WIN_BACK.x1, WIN_BACK.y1, ZB - 0.02], [WIN_BACK.x0, WIN_BACK.y1, ZB - 0.02]] as V3[],
      leftWall(WIN_LEFT.z0, WIN_LEFT.z1, WIN_LEFT.y0, WIN_LEFT.y1, 0.02),
    ].map((p, i) => (
      <polygon key={'fr' + i} points={poly(p)} fill="none" stroke={frame} strokeWidth={6} strokeLinejoin="round" />
    ))}
    <polygon points={poly(rightWall(DOOR_RIGHT.z0, DOOR_RIGHT.z1, DOOR_RIGHT.y0, DOOR_RIGHT.y1, 0.02))} fill="none" stroke="#b58b5c" strokeWidth={5} />
  </g>
);

export const Studs: React.FC = () => (
  <g>
    {[...STUD_Z].reverse().filter((z) => !inOpening.left(z)).map((z) => (
      <Box3 key={'sl' + z} x0={-RX} x1={-RX + 0.105} y0={0} y1={RH} z0={z} z1={z + 0.045} c={WOOD3} />
    ))}
    {[...STUD_Z].reverse().filter((z) => !inOpening.right(z)).map((z) => (
      <Box3 key={'sr' + z} x0={RX - 0.105} x1={RX} y0={0} y1={RH} z0={z} z1={z + 0.045} c={WOOD3} />
    ))}
    {STUD_X.filter((x) => !inOpening.back(x)).map((x) => (
      <Box3 key={'sb' + x} x0={x} x1={x + 0.045} y0={0} y1={RH} z0={ZB - 0.105} z1={ZB} c={WOOD3} />
    ))}
    {/* headers / sills around openings */}
    <Box3 x0={WIN_BACK.x0} x1={WIN_BACK.x1} y0={WIN_BACK.y1} y1={WIN_BACK.y1 + 0.1} z0={ZB - 0.105} z1={ZB} c={WOOD3} />
    <Box3 x0={-RX} x1={-RX + 0.105} y0={WIN_LEFT.y0 - 0.06} y1={WIN_LEFT.y0} z0={WIN_LEFT.z0} z1={WIN_LEFT.z1} c={WOOD3} />
    <Box3 x0={-RX} x1={-RX + 0.105} y0={WIN_LEFT.y1} y1={WIN_LEFT.y1 + 0.08} z0={WIN_LEFT.z0} z1={WIN_LEFT.z1} c={WOOD3} />
    <Box3 x0={RX - 0.105} x1={RX} y0={DOOR_RIGHT.y1} y1={DOOR_RIGHT.y1 + 0.1} z0={DOOR_RIGHT.z0} z1={DOOR_RIGHT.z1} c={WOOD3} />
  </g>
);

export const Joists: React.FC = () => (
  <g>
    {[...JOIST_Z].reverse().map((z) => (
      <Box3 key={'j' + z} x0={-RX} x1={RX} y0={RH - 0.12} y1={RH} z0={z} z1={z + 0.045} c={WOOD3} />
    ))}
  </g>
);

// bays between studs, ordered left wall (far → near), back wall, right wall
export type Bay = {wall: 'L' | 'R' | 'B' | 'C'; a: number; b: number; y0: number; y1: number};
export const BAYS: Bay[] = (() => {
  const out: Bay[] = [];
  const segs = (list: number[], lo: number, hi: number) => {
    const s = [lo, ...list, hi];
    const r: [number, number][] = [];
    for (let i = 0; i < s.length - 1; i++) r.push([s[i] + (i === 0 ? 0 : 0.045), s[i + 1]]);
    return r;
  };
  for (const [a, b] of segs(STUD_Z, ZN, ZB).reverse()) {
    if (b <= WIN_LEFT.z0 || a >= WIN_LEFT.z1) out.push({wall: 'L', a, b, y0: 0.02, y1: RH - 0.02});
    else {
      out.push({wall: 'L', a: Math.max(a, WIN_LEFT.z0), b: Math.min(b, WIN_LEFT.z1), y0: 0.02, y1: WIN_LEFT.y0 - 0.06});
      out.push({wall: 'L', a: Math.max(a, WIN_LEFT.z0), b: Math.min(b, WIN_LEFT.z1), y0: WIN_LEFT.y1 + 0.08, y1: RH - 0.02});
    }
  }
  for (const [a, b] of segs(STUD_X, -RX, RX)) {
    if (b <= WIN_BACK.x0 || a >= WIN_BACK.x1) out.push({wall: 'B', a, b, y0: 0.02, y1: RH - 0.02});
    else out.push({wall: 'B', a: Math.max(a, WIN_BACK.x0), b: Math.min(b, WIN_BACK.x1), y0: WIN_BACK.y1 + 0.1, y1: RH - 0.02});
  }
  for (const [a, b] of segs(STUD_Z, ZN, ZB)) {
    if (b <= DOOR_RIGHT.z0 || a >= DOOR_RIGHT.z1) out.push({wall: 'R', a, b, y0: 0.02, y1: RH - 0.02});
    else out.push({wall: 'R', a: Math.max(a, DOOR_RIGHT.z0), b: Math.min(b, DOOR_RIGHT.z1), y0: DOOR_RIGHT.y1 + 0.1, y1: RH - 0.02});
  }
  return out;
})();

export const bayQuad = (b: Bay, inset: number, fill = 1): V3[] => {
  const y1 = b.y0 + (b.y1 - b.y0) * fill;
  if (b.wall === 'L') return leftWall(b.a, b.b, b.y0, y1, inset);
  if (b.wall === 'R') return rightWall(b.a, b.b, b.y0, y1, inset);
  return backWall(b.a, b.b, b.y0, y1, inset);
};
export const bayCenter = (b: Bay, inset = 0.1): V3 => {
  const m = (b.a + b.b) / 2;
  const y = (b.y0 + b.y1) / 2;
  if (b.wall === 'L') return [-RX + inset, y, m];
  if (b.wall === 'R') return [RX - inset, y, m];
  return [m, y, ZB - inset];
};

// a worker standing in the room, scaled by depth
export const PWorker: React.FC<{x: number; z: number; y?: number; action: Action; f: number; flip?: boolean; suit?: string; vest?: string; phase?: number}> = ({x, z, y = 0, action, f, flip, suit, vest, phase}) => {
  const [sx, sy] = pr(x, y, z);
  const s = ((FL / z) * 1.72) / 128;
  return <Worker x={sx} y={sy} s={s} action={action} f={f} flip={flip} suit={suit} vest={vest} phase={phase} />;
};
export const workerScale = (z: number) => ((FL / z) * 1.72) / 128;

export const Ring: React.FC<{p: [number, number]; o: number; f: number; r?: number}> = ({p, o, f, r = 26}) => (
  <circle cx={p[0]} cy={p[1]} r={r + Math.sin(f * 0.4) * 3} fill="none" stroke="#ffd34d" strokeWidth={5} opacity={o} />
);
export const Check: React.FC<{p: [number, number]; o: number; s?: number}> = ({p, o, s = 1.5}) => (
  <g opacity={o} transform={`translate(${p[0]},${p[1]}) scale(${s * (0.6 + 0.4 * o)})`}>
    <circle r={12} fill="#2f9e5a" />
    <path d="M -5 0 L -1 5 L 6 -5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
  </g>
);
export const Stamp: React.FC<{o: number; text: string; top?: number}> = ({o, text, top = 700}) => (
  <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: o, fontFamily: FONT}}>
    <span style={{border: '10px solid #c8102e', color: '#c8102e', fontWeight: 900, fontSize: 100, padding: '6px 40px', borderRadius: 20, display: 'inline-block', transform: `rotate(-8deg) scale(${1.4 - 0.4 * Math.min(1, o)})`, background: 'rgba(255,255,255,0.85)'}}>{text}</span>
  </div>
);
// site blackboard on a stand, at screen point p with scale s
export const Blackboard: React.FC<{p: [number, number]; s: number; o: number}> = ({p, s, o}) => (
  <g opacity={o} transform={`translate(${p[0]},${p[1]}) scale(${s})`}>
    <line x1={-14} y1={0} x2={-8} y2={-50} stroke="#555" strokeWidth={3} />
    <line x1={14} y1={0} x2={8} y2={-50} stroke="#555" strokeWidth={3} />
    <rect x={-34} y={-96} width={68} height={50} fill="#1f3b2d" stroke="#c9a77c" strokeWidth={3} />
    <line x1={-26} y1={-82} x2={22} y2={-82} stroke="#e8e8e2" strokeWidth={2} />
    <line x1={-26} y1={-70} x2={14} y2={-70} stroke="#e8e8e2" strokeWidth={2} />
    <line x1={-26} y1={-58} x2={18} y2={-58} stroke="#e8e8e2" strokeWidth={2} />
  </g>
);

// soft light panel behind the hook title (interiors are darker than the sky scenes)
export const HookPanel: React.FC<{f: number}> = ({f}) => {
  const o = 1 - Math.min(1, Math.max(0, (f - 36) / 10));
  return <div style={{position: 'absolute', top: 350, left: 60, right: 60, height: 300, borderRadius: 28, background: 'rgba(255,255,255,0.82)', opacity: o}} />;
};
