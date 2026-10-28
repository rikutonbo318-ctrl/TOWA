import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {CH, D, FL1, KITCHEN, M, STAIR, W} from './House';
import {Mat, PBox} from './Geo';
import {texM} from './Tex';

// 1F LDK fit-out, built like the real thing: split cabinet doors with shadow gaps, rounded upholstery,
// curved faucet, curtains, baseboards. Coordinates follow the plan (x east, y north, h up).
const C = FL1 + CH; // 1F ceiling
const DROP = C - 0.25; // dropped ceiling over the kitchen
const K = KITCHEN;

const WHITE: Mat = {color: '#f5f4f0', rough: 0.9};
const DOOR_WOOD: Mat = {color: '#ffffff', tex: 'grain', rough: 0.55};
const WORKTOP: Mat = {color: '#ffffff', tex: 'quartz', rough: 0.22};
const STEEL: Mat = {color: '#c9cdd0', rough: 0.25, metal: 0.8};
const BLACK: Mat = {color: '#1e2124', rough: 0.4};
const WALNUT: Mat = {color: '#ffffff', tex: 'walnut', rough: 0.5};
const OAK: Mat = {color: '#ffffff', tex: 'oak', rough: 0.5};
const GLOW: Mat = {color: '#fff6e6', emissive: '#ffdca8', emissiveIntensity: 2.2};
const GAP: Mat = {color: '#2a2622', rough: 0.9};

// rounded box in plan coords
const geoCache = new Map<string, THREE.BufferGeometry>();
const rgeo = (sx: number, sh: number, sy: number, r: number) => {
  const k = [sx, sh, sy, r].map((v) => v.toFixed(3)).join('|');
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(sx, sh, sy, 4, Math.min(r, sx / 2 - 0.001, sh / 2 - 0.001, sy / 2 - 0.001)));
  return geoCache.get(k)!;
};
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const smat = (color: string, rough: number, metal = 0, bump?: 'cloth' | 'plaster') => {
  const k = [color, rough, metal, bump].join('|');
  if (!matCache.has(k)) {
    const m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal});
    if (bump) {
      m.bumpMap = texM(bump);
      m.bumpScale = 1.5;
    }
    matCache.set(k, m);
  }
  return matCache.get(k)!;
};
const RB: React.FC<{x0: number; x1: number; y0: number; y1: number; h0: number; h1: number; r: number; color: string; rough?: number; metal?: number; bump?: 'cloth' | 'plaster'; cast?: boolean}> = ({x0, x1, y0, y1, h0, h1, r, color, rough = 0.8, metal = 0, bump, cast = true}) => (
  <mesh geometry={rgeo(Math.abs(x1 - x0), Math.abs(h1 - h0), Math.abs(y1 - y0), r)} material={smat(color, rough, metal, bump)} position={[(x0 + x1) / 2, (h0 + h1) / 2, -(y0 + y1) / 2]} castShadow={cast} receiveShadow />
);

// cabinet run facing ±y: doors/drawers split by dark shadow gaps
const Fronts: React.FC<{x0: number; x1: number; y: number; dir: 1 | -1; h0: number; h1: number; cols: number; rows?: number[]; m: Mat}> = ({x0, x1, y, dir, h0, h1, cols, rows = [], m}) => {
  const out: React.ReactNode[] = [];
  const w = (x1 - x0) / cols;
  const t = 0.018;
  const yf = y + dir * t;
  const cuts = [h0, ...rows, h1];
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < cuts.length - 1; r++) {
      const a = x0 + c * w + 0.002;
      const b = x0 + (c + 1) * w - 0.002;
      out.push(<PBox key={`d${c}_${r}`} x0={a} x1={b} y0={Math.min(y, yf)} y1={Math.max(y, yf)} h0={cuts[r] + 0.002} h1={cuts[r + 1] - 0.002} m={m} />);
    }
  // dark backing shows through the 4 mm gaps
  out.push(<PBox key="bk" x0={x0} x1={x1} y0={Math.min(y, y + dir * 0.004)} y1={Math.max(y, y + dir * 0.004)} h0={h0} h1={h1} m={GAP} cast={false} />);
  return <group>{out}</group>;
};

// gooseneck faucet
const Faucet: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => {
  const geo = useMemo(() => {
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0.33, 0.06), new THREE.Vector3(0, 0.3, 0.17), new THREE.Vector3(0, 0.22, 0.2)]);
    return new THREE.TubeGeometry(path, 40, 0.011, 12, false);
  }, []);
  return (
    <group position={[x, h, -y]} rotation={[0, Math.PI, 0]}>
      <mesh geometry={geo} material={smat('#d4d7da', 0.18, 1)} castShadow />
      <mesh position={[0, 0.015, 0]} material={smat('#d4d7da', 0.18, 1)}>
        <cylinderGeometry args={[0.025, 0.028, 0.03, 20]} />
      </mesh>
      <mesh position={[0.03, 0.2, -0.01]} rotation={[0, 0, -0.8]} material={smat('#d4d7da', 0.18, 1)}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 10]} />
      </mesh>
    </group>
  );
};

// pleated curtain hanging in front of a window (plan line along x at y, from x0 to x1)
const Curtain: React.FC<{x0: number; x1: number; y: number; h0: number; h1: number; color?: string}> = ({x0, x1, y, h0, h1, color = '#efe9df'}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(x1 - x0, h1 - h0, Math.round((x1 - x0) * 60), 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / 0.11) * Math.PI) * 0.035);
    g.computeVertexNormals();
    return g;
  }, [x0, x1, h0, h1]);
  return (
    <mesh geometry={geo} position={[(x0 + x1) / 2, (h0 + h1) / 2, -y]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} transparent opacity={0.92} />
    </mesh>
  );
};

// potted fiddle-leaf fig
const Plant: React.FC<{x: number; y: number}> = ({x, y}) => {
  const leaves = useMemo(
    () =>
      Array.from({length: 26}, (_, i) => {
        const a = i * 2.39996;
        const hh = 0.55 + (i / 26) * 0.75;
        const r = 0.08 + Math.sin(i * 1.7) * 0.05 + 0.08;
        return {p: [Math.cos(a) * r, hh, Math.sin(a) * r] as [number, number, number], rot: [0.5 + Math.sin(i) * 0.3, -a, 0.3] as [number, number, number], s: 0.85 + ((i * 37) % 10) / 30};
      }),
    [],
  );
  const leafGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.09, 12, 8);
    g.scale(0.75, 0.08, 1.3);
    g.translate(0, 0, 0.1);
    return g;
  }, []);
  return (
    <group position={[x, FL1, -y]}>
      <mesh position={[0, 0.17, 0]} material={smat('#e5e1d8', 0.6, 0, 'plaster')} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.34, 28]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={smat('#6b5440', 0.9)} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 0.85, 8]} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} geometry={leafGeo} position={l.p} rotation={l.rot} scale={l.s} material={smat(i % 3 ? '#3f6b39' : '#4c7d43', 0.55)} castShadow />
      ))}
    </group>
  );
};

const Down: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => (
  <group>
    <mesh position={[x, h - 0.004, -y]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.008, 24]} />
      <meshStandardMaterial color="#fff6e6" emissive="#ffdca8" emissiveIntensity={2.4} />
    </mesh>
    <mesh position={[x, h - 0.002, -y]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.055, 0.006, 8, 24]} />
      <meshStandardMaterial color="#f4f4f2" roughness={0.4} />
    </mesh>
    <pointLight position={[x, h - 0.15, -y]} intensity={0.9} distance={3.2} decay={2} color="#ffe2b8" />
  </group>
);

export const InteriorReal: React.FC<{lights?: boolean}> = ({lights = true}) => (
  <group>
    {/* ---------- ceilings ---------- */}
    <PBox x0={0} x1={W} y0={0} y1={5 * M} h0={C} h1={C + 0.02} m={WHITE} />
    <PBox x0={0} x1={STAIR.x0} y0={5 * M} y1={D} h0={C} h1={C + 0.02} m={WHITE} />
    <PBox x0={STAIR.x1} x1={W} y0={5 * M} y1={D} h0={C} h1={C + 0.02} m={WHITE} />
    {/* dropped wood-slat ceiling over the kitchen with a cove light on its edge */}
    <PBox x0={0.06} x1={4 * M} y0={3 * M} y1={5 * M - 0.06} h0={DROP} h1={C} m={{color: '#ffffff', tex: 'slat', rough: 0.6}} />
    <PBox x0={0.06} x1={4 * M} y0={3 * M - 0.02} y1={3 * M} h0={DROP - 0.015} h1={DROP} m={GLOW} cast={false} receive={false} />
    {lights ? <pointLight position={[1.8, DROP - 0.2, -(3 * M - 0.3)]} intensity={1.2} distance={4} color="#ffd9a0" /> : null}
    <PBox x0={3.7} x1={6.3} y0={0.06} y1={0.3} h0={C - 0.12} h1={C - 0.1} m={WHITE} />
    <PBox x0={3.7} x1={6.3} y0={0.28} y1={0.3} h0={C - 0.1} h1={C - 0.02} m={GLOW} cast={false} receive={false} />
    {lights ? (
      <group>
        {[
          [4.4, 1.0],
          [5.6, 1.0],
          [4.4, 2.2],
          [5.6, 2.2],
          [1.4, 1.3],
          [2.6, 1.3],
          [5.0, 3.6],
        ].map(([x, y], i) => (
          <Down key={'dl' + i} x={x} y={y} h={C} />
        ))}
        {[0.9, 2.0, 3.0].map((x) => (
          <Down key={'dk' + x} x={x} y={3.6} h={DROP} />
        ))}
      </group>
    ) : null}

    {/* ---------- baseboards ---------- */}
    {[
      [0.02, 0.02, 0.03, 5 * M],
      [0.02, 0.02, 7 * M - 0.08, 0.03],
    ].map(([x0, y0, x1, y1], i) => (
      <PBox key={'bb' + i} x0={x0} x1={x0 + Math.max(0.012, x1 - x0)} y0={y0} y1={y0 + Math.max(0.012, y1 - y0)} h0={FL1} h1={FL1 + 0.06} m={{color: '#f3f2ee', rough: 0.5}} />
    ))}

    {/* ---------- kitchen: flat face-to-face island ---------- */}
    <PBox x0={K.island.x0} x1={K.island.x1} y0={K.island.y0} y1={K.island.y1} h0={FL1 + 0.08} h1={FL1 + 0.82} m={{color: '#7c8186', rough: 0.6}} />
    <PBox x0={K.island.x0 + 0.03} x1={K.island.x1 - 0.03} y0={K.island.y0 + 0.05} y1={K.island.y1 - 0.05} h0={FL1} h1={FL1 + 0.08} m={{color: '#26282a', rough: 0.8}} />
    {/* kitchen-side drawers (north face) */}
    <Fronts x0={K.island.x0} x1={K.island.x1} y={K.island.y1} dir={1} h0={FL1 + 0.08} h1={FL1 + 0.82} cols={4} rows={[FL1 + 0.36, FL1 + 0.62]} m={{color: '#ffffff', tex: 'grain', rough: 0.5}} />
    {/* dining-side wood panel */}
    <PBox x0={K.island.x0} x1={K.island.x1} y0={K.island.y0 - 0.02} y1={K.island.y0} h0={FL1} h1={FL1 + 0.82} m={DOOR_WOOD} />
    <PBox x0={K.island.x0 - 0.02} x1={K.island.x1 + 0.02} y0={K.island.y0 - 0.04} y1={K.island.y1 + 0.02} h0={FL1 + 0.82} h1={FL1 + 0.85} m={WORKTOP} />
    {/* integrated sink bowl (recessed) + gooseneck faucet */}
    <PBox x0={0.95} x1={1.75} y0={3.12} y1={3.5} h0={FL1 + 0.849} h1={FL1 + 0.852} m={{color: '#8b9095', rough: 0.3, metal: 0.8}} cast={false} />
    <PBox x0={0.97} x1={1.73} y0={3.14} y1={3.48} h0={FL1 + 0.852} h1={FL1 + 0.853} m={{color: '#5d6266', rough: 0.35, metal: 0.8}} cast={false} />
    <Faucet x={1.35} y={3.54} h={FL1 + 0.85} />
    {/* IH hob: black glass with ring marks */}
    <PBox x0={2.25} x1={3.05} y0={3.1} y1={3.52} h0={FL1 + 0.85} h1={FL1 + 0.856} m={{color: '#0c0d0e', rough: 0.3, metal: 0.1}} cast={false} />
    {[
      [2.45, 3.3],
      [2.85, 3.3],
    ].map(([x, y], i) => (
      <mesh key={'ih' + i} position={[x, FL1 + 0.857, -y]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.085, 0.09, 40]} />
        <meshStandardMaterial color="#6b6f74" roughness={0.4} />
      </mesh>
    ))}
    {/* slim range hood */}
    <RB x0={2.35} x1={2.95} y0={3.12} y1={3.48} h0={DROP - 0.42} h1={DROP} r={0.02} color="#ecebe8" rough={0.3} metal={0.3} />
    {/* pendants */}
    {[1.0, 1.6, 2.2].map((x) => (
      <group key={'pd' + x}>
        <mesh position={[x, (FL1 + 1.75 + DROP) / 2, -3.275]}>
          <cylinderGeometry args={[0.002, 0.002, DROP - FL1 - 1.75, 6]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[x, FL1 + 1.68, -3.275]}>
          <cylinderGeometry args={[0.05, 0.11, 0.16, 32, 1, true]} />
          <meshStandardMaterial color="#1e2124" roughness={0.35} metalness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[x, FL1 + 1.62, -3.275]}>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshStandardMaterial color="#fff" emissive="#ffd59a" emissiveIntensity={3} />
        </mesh>
        {lights ? <pointLight position={[x, FL1 + 1.55, -3.275]} intensity={0.6} distance={2.5} color="#ffd59a" /> : null}
      </group>
    ))}
    {/* back cupboard: plinth, drawer fronts, worktop, quartz panel, wall units, tall unit */}
    <PBox x0={K.back.x0} x1={K.back.x1} y0={K.back.y0 + 0.05} y1={K.back.y1} h0={FL1} h1={FL1 + 0.08} m={{color: '#26282a', rough: 0.8}} />
    <PBox x0={K.back.x0} x1={K.back.x1} y0={K.back.y0} y1={K.back.y1} h0={FL1 + 0.08} h1={FL1 + 0.85} m={GAP} />
    <Fronts x0={1.2} x1={K.back.x1} y={K.back.y0} dir={-1} h0={FL1 + 0.08} h1={FL1 + 0.85} cols={3} rows={[FL1 + 0.4, FL1 + 0.64]} m={DOOR_WOOD} />
    <PBox x0={K.back.x0} x1={K.back.x1} y0={K.back.y0 - 0.02} y1={K.back.y1} h0={FL1 + 0.85} h1={FL1 + 0.88} m={WORKTOP} />
    <PBox x0={1.2} x1={2.6} y0={K.back.y1 - 0.03} y1={K.back.y1} h0={FL1 + 0.88} h1={FL1 + 1.75} m={{color: '#ffffff', tex: 'quartz', rough: 0.25}} />
    <PBox x0={1.2} x1={2.6} y0={K.back.y0 + 0.17} y1={K.back.y1} h0={FL1 + 1.75} h1={DROP} m={GAP} />
    <Fronts x0={1.2} x1={2.6} y={K.back.y0 + 0.17} dir={-1} h0={FL1 + 1.75} h1={DROP} cols={3} m={DOOR_WOOD} />
    <PBox x0={K.back.x0} x1={1.2} y0={K.back.y0} y1={K.back.y1} h0={FL1} h1={DROP} m={GAP} />
    <Fronts x0={K.back.x0} x1={1.2} y={K.back.y0} dir={-1} h0={FL1 + 0.08} h1={DROP} cols={2} rows={[FL1 + 1.8]} m={DOOR_WOOD} />
    {/* coffee machine & kettle on the counter */}
    <RB x0={1.35} x1={1.55} y0={4.25} y1={4.5} h0={FL1 + 0.88} h1={FL1 + 1.2} r={0.03} color="#2b2d30" rough={0.35} metal={0.3} />
    <mesh position={[2.1, FL1 + 0.98, -4.35]} material={smat('#e9e7e2', 0.3)} castShadow>
      <cylinderGeometry args={[0.065, 0.08, 0.2, 28]} />
    </mesh>
    {/* french-door fridge */}
    <RB x0={2.7} x1={3.45} y0={K.back.y0 - 0.15} y1={K.back.y1} h0={FL1} h1={FL1 + 1.82} r={0.025} color="#d9dad8" rough={0.25} metal={0.5} />
    <PBox x0={3.074} x1={3.076} y0={K.back.y0 - 0.152} y1={K.back.y0 - 0.149} h0={FL1 + 0.85} h1={FL1 + 1.8} m={GAP} cast={false} />
    <PBox x0={2.71} x1={3.44} y0={K.back.y0 - 0.152} y1={K.back.y0 - 0.149} h0={FL1 + 0.84} h1={FL1 + 0.846} m={GAP} cast={false} />
    <PBox x0={2.71} x1={3.44} y0={K.back.y0 - 0.152} y1={K.back.y0 - 0.149} h0={FL1 + 0.44} h1={FL1 + 0.446} m={GAP} cast={false} />

    {/* ---------- dining: oak table, upholstered chairs ---------- */}
    <RB x0={1.15} x1={2.85} y0={1.6} y1={2.45} h0={FL1 + 0.69} h1={FL1 + 0.725} r={0.008} color="#c79f72" rough={0.45} />
    <PBox x0={1.16} x1={2.84} y0={1.61} y1={2.44} h0={FL1 + 0.7251} h1={FL1 + 0.7252} m={OAK} cast={false} />
    {[
      [1.22, 1.67],
      [2.78, 1.67],
      [1.22, 2.38],
      [2.78, 2.38],
    ].map(([x, y], i) => (
      <RB key={'tl' + i} x0={x - 0.022} x1={x + 0.022} y0={y - 0.022} y1={y + 0.022} h0={FL1} h1={FL1 + 0.69} r={0.008} color="#1e2124" rough={0.4} />
    ))}
    {[
      [1.55, 1.38, 0],
      [2.45, 1.38, 0],
      [1.55, 2.67, 1],
      [2.45, 2.67, 1],
    ].map(([x, y, n], i) => (
      <group key={'ch' + i}>
        <RB x0={x - 0.21} x1={x + 0.21} y0={y - 0.2} y1={y + 0.2} h0={FL1 + 0.4} h1={FL1 + 0.47} r={0.03} color="#b9ad9c" rough={1} bump="cloth" />
        <RB x0={x - 0.2} x1={x + 0.2} y0={n ? y + 0.15 : y - 0.2} y1={n ? y + 0.2 : y - 0.15} h0={FL1 + 0.47} h1={FL1 + 0.8} r={0.02} color="#c49a6c" rough={0.5} />
        {[
          [-0.17, -0.17],
          [0.17, -0.17],
          [-0.17, 0.17],
          [0.17, 0.17],
        ].map(([dx, dy], k) => (
          <mesh key={k} position={[x + dx, FL1 + 0.2, -(y + dy)]} material={smat('#1e2124', 0.4)} castShadow>
            <cylinderGeometry args={[0.012, 0.009, 0.4, 10]} />
          </mesh>
        ))}
      </group>
    ))}

    {/* ---------- living: 3-seat sofa facing the TV wall (east) ---------- */}
    <RB x0={3.75} x1={4.6} y0={0.35} y1={2.45} h0={FL1 + 0.12} h1={FL1 + 0.3} r={0.04} color="#7f878c" rough={1} bump="cloth" />
    {[0.55, 1.18, 1.81].map((y0) => (
      <group key={'cu' + y0}>
        <RB x0={3.98} x1={4.62} y0={y0 + 0.005} y1={y0 + 0.625} h0={FL1 + 0.29} h1={FL1 + 0.44} r={0.06} color="#8a9297" rough={1} bump="cloth" />
        <RB x0={3.78} x1={4.02} y0={y0 + 0.01} y1={y0 + 0.62} h0={FL1 + 0.42} h1={FL1 + 0.84} r={0.08} color="#8a9297" rough={1} bump="cloth" />
      </group>
    ))}
    <RB x0={3.75} x1={4.65} y0={0.35} y1={0.56} h0={FL1 + 0.12} h1={FL1 + 0.62} r={0.07} color="#7f878c" rough={1} bump="cloth" />
    <RB x0={3.75} x1={4.65} y0={2.24} y1={2.45} h0={FL1 + 0.12} h1={FL1 + 0.62} r={0.07} color="#7f878c" rough={1} bump="cloth" />
    {[
      [3.8, 0.4],
      [4.55, 0.4],
      [3.8, 2.4],
      [4.55, 2.4],
    ].map(([x, y], i) => (
      <mesh key={'sl' + i} position={[x, FL1 + 0.06, -y]} material={smat('#4a3626', 0.5)}>
        <cylinderGeometry args={[0.018, 0.014, 0.12, 10]} />
      </mesh>
    ))}
    <RB x0={4.1} x1={4.48} y0={0.75} y1={1.13} h0={FL1 + 0.42} h1={FL1 + 0.72} r={0.1} color="#cbb99b" rough={1} bump="cloth" />
    <RB x0={4.1} x1={4.48} y0={1.75} y1={2.13} h0={FL1 + 0.42} h1={FL1 + 0.72} r={0.1} color="#a8b0a0" rough={1} bump="cloth" />
    {/* rug */}
    <RB x0={4.0} x1={6.0} y0={0.4} y1={2.4} h0={FL1} h1={FL1 + 0.012} r={0.005} color="#e4ddcf" rough={1} bump="cloth" cast={false} />
    {/* round walnut coffee table */}
    <mesh position={[5.22, FL1 + 0.33, -1.4]} material={smat('#5b3f2b', 0.45)} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.035, 48]} />
    </mesh>
    <mesh position={[5.22, FL1 + 0.16, -1.4]} material={smat('#1e2124', 0.4)} castShadow>
      <cylinderGeometry args={[0.04, 0.1, 0.31, 20]} />
    </mesh>
    {/* TV wall: stone-look accent tiles, floating TV board, TV */}
    <PBox x0={7 * M - 0.075} x1={7 * M - 0.055} y0={0.08} y1={1.42} h0={FL1} h1={C} m={{color: '#ffffff', tex: 'stone', rough: 0.9}} />
    <RB x0={5.95} x1={7 * M - 0.075} y0={0.15} y1={1.35} h0={FL1 + 0.22} h1={FL1 + 0.45} r={0.01} color="#5b3f2b" rough={0.5} />
    <PBox x0={5.948} x1={5.95} y0={0.16} y1={1.34} h0={FL1 + 0.23} h1={FL1 + 0.44} m={WALNUT} cast={false} />
    <RB x0={6.2} x1={6.26} y0={0.22} y1={1.28} h0={FL1 + 0.72} h1={FL1 + 1.38} r={0.006} color="#0b0c0e" rough={0.12} metal={0.3} />
    {/* sheer curtains on the south sweep windows */}
    <Curtain x0={0.2} x1={1.0} y={0.12} h0={FL1 + 0.02} h1={FL1 + 2.25} />
    <Curtain x0={2.5} x1={3.4} y={0.12} h0={FL1 + 0.02} h1={FL1 + 2.25} />
    <PBox x0={0.15} x1={5.6} y0={0.08} y1={0.16} h0={FL1 + 2.26} h1={FL1 + 2.3} m={{color: '#e8e6e1', rough: 0.5}} />
    <Plant x={6.05} y={1.68} />

    {/* ---------- stair: oak treads, iron rail ---------- */}
    {Array.from({length: 7}).map((_, i) => (
      <RB key={'s1' + i} x0={STAIR.x0} x1={STAIR.x0 + M} y0={STAIR.y0 + i * 0.18} y1={STAIR.y0 + i * 0.18 + 0.24} h0={FL1 + (i + 1) * 0.2 - 0.04} h1={FL1 + (i + 1) * 0.2} r={0.006} color="#c79f72" rough={0.45} />
    ))}
    <PBox x0={STAIR.x0} x1={STAIR.x1} y0={STAIR.y1 - 0.5} y1={STAIR.y1} h0={FL1 + 1.4} h1={FL1 + 1.44} m={OAK} />
    {Array.from({length: 7}).map((_, i) => (
      <RB key={'s2' + i} x0={STAIR.x0 + M} x1={STAIR.x1} y0={STAIR.y1 - 0.5 - (i + 1) * 0.18} y1={STAIR.y1 - 0.5 - i * 0.18} h0={FL1 + 1.6 + i * 0.2} h1={FL1 + 1.64 + i * 0.2} r={0.006} color="#c79f72" rough={0.45} />
    ))}
    {[0, 0.6, 1.2].map((d) => (
      <PBox key={'rl' + d} x0={STAIR.x0 + M - 0.012} x1={STAIR.x0 + M + 0.012} y0={STAIR.y0 + 0.2 + d} y1={STAIR.y0 + 0.224 + d} h0={FL1 + 0.3 + d * 1.1} h1={FL1 + 1.2 + d * 1.1} m={BLACK} />
    ))}
    <PBox x0={STAIR.x0 + M - 0.02} x1={STAIR.x0 + M + 0.02} y0={STAIR.y0 + 0.2} y1={STAIR.y1 - 0.5} h0={FL1 + 1.2} h1={FL1 + 1.23} m={BLACK} />
  </group>
);
