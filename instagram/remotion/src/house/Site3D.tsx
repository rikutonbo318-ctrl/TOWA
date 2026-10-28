import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {D, M, W} from './House';
import {PBox} from './Geo';
import {Line3D} from './Kit3D';

export const SITE = {x0: -3.5, x1: 13.0, y0: -4.5, y1: 10.0};
export const HOLE = {x0: -0.3, x1: W + 0.3, y0: -0.3, y1: D + 0.3, depth: 0.35};
export const BOUNDS: [number, number][] = [
  [SITE.x0, SITE.y0],
  [SITE.x1, SITE.y0],
  [SITE.x1, SITE.y1],
  [SITE.x0, SITE.y1],
  [4.75, SITE.y0],
];
export const YK = 1.2; // 遣り方 offset from the building line
export const NUKI_H = 0.6;
export const YK_RECT = {x0: -YK, x1: W + YK, y0: -YK, y1: D + YK};
export const YK_POSTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const {x0, x1, y0, y1} = YK_RECT;
  const n = (a: number, b: number) => Math.max(1, Math.round((b - a) / 1.8));
  for (let i = 0; i < n(x0, x1); i++) out.push([x0 + ((x1 - x0) * i) / n(x0, x1), y0]);
  for (let i = 0; i < n(y0, y1); i++) out.push([x1, y0 + ((y1 - y0) * i) / n(y0, y1)]);
  for (let i = 0; i < n(x0, x1); i++) out.push([x1 - ((x1 - x0) * i) / n(x0, x1), y1]);
  for (let i = 0; i < n(y0, y1); i++) out.push([x0, y1 - ((y1 - y0) * i) / n(y0, y1)]);
  return out;
})();
// strings along the main grid lines (x = const or y = const)
export const STRINGS: {x?: number; y?: number}[] = [{x: 0}, {x: W}, {y: 0}, {y: D}, {x: 7 * M}, {y: 5 * M}, {x: 4 * M}];

const SOIL = '#8a6a4a';
const GRAVEL = '#b5a68e';
const N_STRIP = 12;

export type SiteState = {
  dig?: (i: number) => number; // 0..1 per strip (west → east)
  rope?: number; // 地縄 visibility
  ropeDraw?: number; // 0..1 how much of the rope is laid
  posts?: number; // 0..1 how many 遣り方 posts are in
  nuki?: number; // 0..1 boards
  strings?: number; // 0..1 strings
  laser?: number;
  pile?: number; // soil pile size 0..1
};

export const Site3D: React.FC<{s: SiteState; f: number}> = ({s, f}) => {
  const dig = s.dig ?? (() => 0);
  const {x0, x1, y0, y1} = SITE;
  const H = HOLE;
  const perim: [number, number][] = [
    [0, 0],
    [W, 0],
    [W, D],
    [0, D],
    [0, 0],
  ];
  const ropeLen = 2 * (W + D);
  let acc = 0;
  return (
    <group>
      {/* lawn around the site (the global ground sits lower so the pit can open) */}
      <PBox x0={-40} x1={50} y0={y1} y1={60} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={-40} x1={x0} y0={SITE.y0 - 0.15} y1={y1} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={x1} x1={50} y0={SITE.y0 - 0.15} y1={y1} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={-40} x1={50} y0={-40} y1={-11} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      {/* road on the south */}
      <PBox x0={-40} x1={50} y0={-11} y1={SITE.y0 - 0.15} h0={-0.6} h1={0.0} m={{color: '#5b5f63', rough: 0.9}} />
      <PBox x0={-30} x1={40} y0={-7.9} y1={-7.75} h0={0.0} h1={0.004} m={{color: '#e8e8e2'}} />
      {/* curb */}
      <PBox x0={-30} x1={40} y0={SITE.y0 - 0.15} y1={SITE.y0} h0={-0.05} h1={0.12} m={{color: '#b9b8b2'}} />
      {/* site surface with the excavation hole */}
      <PBox x0={x0} x1={x1} y0={y0} y1={H.y0} h0={-0.6} h1={0.004} m={{color: GRAVEL, rough: 1}} />
      <PBox x0={x0} x1={x1} y0={H.y1} y1={y1} h0={-0.6} h1={0.004} m={{color: GRAVEL, rough: 1}} />
      <PBox x0={x0} x1={H.x0} y0={H.y0} y1={H.y1} h0={-0.6} h1={0.004} m={{color: GRAVEL, rough: 1}} />
      <PBox x0={H.x1} x1={x1} y0={H.y0} y1={H.y1} h0={-0.6} h1={0.004} m={{color: GRAVEL, rough: 1}} />
      {Array.from({length: N_STRIP}).map((_, i) => {
        const p = dig(i);
        const a = H.x0 + ((H.x1 - H.x0) * i) / N_STRIP;
        const b = H.x0 + ((H.x1 - H.x0) * (i + 1)) / N_STRIP;
        return <PBox key={'st' + i} x0={a} x1={b} y0={H.y0} y1={H.y1} h0={-0.6} h1={0.004 - H.depth * p} m={{color: p > 0.02 ? SOIL : GRAVEL, rough: 1}} />;
      })}
      {/* block walls of the neighbours (west + north) */}
      <PBox x0={x0 - 0.15} x1={x0} y0={y0} y1={y1 + 0.15} h0={0} h1={1.2} m={{color: '#c4c3bd'}} />
      <PBox x0={x0 - 0.15} x1={x1} y0={y1} y1={y1 + 0.15} h0={0} h1={1.2} m={{color: '#c4c3bd'}} />
      {/* neighbour houses */}
      <Neighbour x0={-14} x1={-6} y0={-1} y1={8} h={6.0} wall="#e4e1da" roof="#4a4f55" />
      <Neighbour x0={1} x1={10} y0={13} y1={20} h={6.3} wall="#d8dcdf" roof="#3f454b" />
      <Neighbour x0={16} x1={24} y0={0} y1={8} h={5.8} wall="#ebe6dc" roof="#5e5246" />
      {/* boundary markers */}
      {BOUNDS.map(([x, y], i) => (
        <group key={'bd' + i}>
          <PBox x0={x - 0.06} x1={x + 0.06} y0={y - 0.06} y1={y + 0.06} h0={0} h1={0.12} m={{color: '#d9d8d2'}} />
          <PBox x0={x - 0.05} x1={x + 0.05} y0={y - 0.008} y1={y + 0.008} h0={0.12} h1={0.125} m={{color: '#c8102e'}} cast={false} />
          <PBox x0={x - 0.008} x1={x + 0.008} y0={y - 0.05} y1={y + 0.05} h0={0.12} h1={0.125} m={{color: '#c8102e'}} cast={false} />
        </group>
      ))}
      {/* 地縄 (white rope with corner pins) */}
      {(s.rope ?? 0) > 0
        ? perim.slice(0, 4).map(([ax, ay], i) => {
            const [bx, by] = perim[i + 1];
            const L = Math.hypot(bx - ax, by - ay);
            const start = acc;
            acc += L;
            const draw = (s.ropeDraw ?? 1) * ropeLen;
            const k = Math.max(0, Math.min(1, (draw - start) / L));
            return (
              <group key={'rp' + i}>
                {k > 0 ? <Line3D a={[ax, ay, 0.03]} b={[ax + (bx - ax) * k, ay + (by - ay) * k, 0.03]} w={0.05} color="#ffffff" emissive opacity={s.rope} /> : null}
                {k > 0 ? <PBox x0={ax - 0.025} x1={ax + 0.025} y0={ay - 0.025} y1={ay + 0.025} h0={0} h1={0.25} m={{color: '#d6a35f', opacity: s.rope}} /> : null}
              </group>
            );
          })
        : null}
      {/* 遣り方: posts, boards (水貫), strings (水糸) */}
      {YK_POSTS.map(([x, y], i) => {
        const o = Math.max(0, Math.min(1, (s.posts ?? 0) * YK_POSTS.length - i));
        return o > 0 ? (
          <group key={'yp' + i}>
            <PBox x0={x - 0.03} x1={x + 0.03} y0={y - 0.03} y1={y + 0.03} h0={0} h1={0.95 - (1 - o) * 0.5} m={{color: '#d9ad74', rough: 0.8}} />
            {(s.laser ?? 0) > 0 ? <PBox x0={x - 0.035} x1={x + 0.035} y0={y - 0.035} y1={y + 0.035} h0={NUKI_H + 0.04} h1={NUKI_H + 0.055} m={{color: '#ff2a2a', emissive: '#ff2a2a', emissiveIntensity: 1.5 * (s.laser ?? 0)}} cast={false} /> : null}
          </group>
        ) : null;
      })}
      {(s.nuki ?? 0) > 0
        ? (() => {
            const {x0: a, x1: b, y0: c, y1: d} = YK_RECT;
            const sides: [number, number, number, number][] = [
              [a, c, b, c],
              [b, c, b, d],
              [b, d, a, d],
              [a, d, a, c],
            ];
            return sides.map(([sx, sy, ex, ey], i) => {
              const k = Math.max(0, Math.min(1, (s.nuki ?? 0) * 4 - i));
              if (k <= 0) return null;
              const mx = sx + (ex - sx) * k;
              const my = sy + (ey - sy) * k;
              const t = 0.012;
              return <PBox key={'nk' + i} x0={Math.min(sx, mx) - t} x1={Math.max(sx, mx) + t} y0={Math.min(sy, my) - t} y1={Math.max(sy, my) + t} h0={NUKI_H - 0.045} h1={NUKI_H + 0.045} m={{color: '#e6c793', rough: 0.8}} />;
            });
          })()
        : null}
      {(s.strings ?? 0) > 0
        ? STRINGS.map((g, i) => {
            const k = Math.max(0, Math.min(1, (s.strings ?? 0) * STRINGS.length - i));
            if (k <= 0) return null;
            const h = NUKI_H + 0.05;
            if (g.x !== undefined) return <Line3D key={'sg' + i} a={[g.x, YK_RECT.y0, h]} b={[g.x, YK_RECT.y0 + (YK_RECT.y1 - YK_RECT.y0) * k, h]} w={0.012} color="#ff4f8b" emissive />;
            return <Line3D key={'sg' + i} a={[YK_RECT.x0, g.y!, h]} b={[YK_RECT.x0 + (YK_RECT.x1 - YK_RECT.x0) * k, g.y!, h]} w={0.012} color="#ff4f8b" emissive />;
          })
        : null}
      {/* soil pile */}
      {(s.pile ?? 0) > 0 ? (
        <mesh position={[W + 1.6, 0.6 * (s.pile ?? 0), -(D + 2.2)]} castShadow receiveShadow>
          <coneGeometry args={[1.7 * Math.cbrt(s.pile ?? 0), 1.2 * (s.pile ?? 0), 24]} />
          <meshStandardMaterial color="#7a5c3e" roughness={1} />
        </mesh>
      ) : null}
      {/* laser level on a tripod */}
      {(s.laser ?? 0) > 0 ? (
        <group position={[W + 1.2, 0, -(D + 2.4)]}>
          {[0, 2.1, 4.2].map((a) => (
            <mesh key={a} position={[Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}>
              <cylinderGeometry args={[0.015, 0.015, 1.1, 6]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          ))}
          <mesh position={[0, 1.15, 0]} rotation={[0, f * 0.5, 0]}>
            <boxGeometry args={[0.18, 0.2, 0.18]} />
            <meshStandardMaterial color="#f2c230" />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#ff2a2a" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

// small excavator. (x, y) plan position; yaw/boom/arm in radians
// a typical 2-storey neighbour: rendered walls, hipped roof with eaves, windows on every side
export const Neighbour: React.FC<{x0: number; x1: number; y0: number; y1: number; h: number; wall: string; roof: string}> = ({x0, x1, y0, y1, h, wall, roof}) => {
  const w = x1 - x0;
  const d = y1 - y0;
  const roofGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    return g;
  }, []);
  const wins: React.ReactNode[] = [];
  const winRow = (fl: number) => {
    const hb = fl === 1 ? 0.9 : 3.8;
    for (let k = 0; k < Math.floor(w / 2.6); k++) {
      const cx = x0 + 1.3 + k * 2.6;
      for (const [yy, side] of [[y0, -1], [y1, 1]] as [number, number][]) {
        wins.push(<PBox key={`w${fl}${k}${side}`} x0={cx - 0.6} x1={cx + 0.6} y0={yy + side * 0.02 - 0.02} y1={yy + side * 0.02 + 0.02} h0={hb} h1={hb + 1.1} m={{color: '#2a3238', rough: 0.08, metal: 0.4}} />);
        wins.push(<PBox key={`f${fl}${k}${side}`} x0={cx - 0.66} x1={cx + 0.66} y0={yy + side * 0.035 - 0.012} y1={yy + side * 0.035 + 0.012} h0={hb - 0.06} h1={hb - 0.02} m={{color: '#8d9196'}} />);
      }
    }
    for (let k = 0; k < Math.floor(d / 2.8); k++) {
      const cy = y0 + 1.4 + k * 2.8;
      for (const [xx, side] of [[x0, -1], [x1, 1]] as [number, number][]) {
        wins.push(<PBox key={`s${fl}${k}${side}`} x0={xx + side * 0.02 - 0.02} x1={xx + side * 0.02 + 0.02} y0={cy - 0.45} y1={cy + 0.45} h0={hb + 0.3} h1={hb + 1.1} m={{color: '#2a3238', rough: 0.08, metal: 0.4}} />);
      }
    }
  };
  winRow(1);
  winRow(2);
  return (
    <group>
      <PBox x0={x0} x1={x1} y0={y0} y1={y1} h0={0} h1={h} m={{color: wall, tex: 'plaster'}} />
      <PBox x0={x0 - 0.02} x1={x1 + 0.02} y0={y0 - 0.02} y1={y1 + 0.02} h0={0} h1={0.4} m={{color: '#9a9994', tex: 'conc'}} />
      <PBox x0={x0 - 0.02} x1={x1 + 0.02} y0={y0 - 0.02} y1={y1 + 0.02} h0={3.05} h1={3.15} m={{color: '#bdbab3'}} />
      {wins}
      <PBox x0={x0 - 0.6} x1={x1 + 0.6} y0={y0 - 0.6} y1={y1 + 0.6} h0={h} h1={h + 0.12} m={{color: roof}} />
      <mesh geometry={roofGeo} position={[(x0 + x1) / 2, h + 0.12 + 0.9, -(y0 + y1) / 2]} scale={[w + 1.2, 1.8, d + 1.2]} castShadow receiveShadow>
        <meshStandardMaterial color={roof} roughness={0.55} metalness={0.2} />
      </mesh>
    </group>
  );
};

// mini excavator (rubber tracks, cab with glass, curved boom, hydraulic rams); same kinematics as before
const exMat = {
  paint: new THREE.MeshPhysicalMaterial({color: '#f0b21a', roughness: 0.42, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.3}),
  dark: new THREE.MeshStandardMaterial({color: '#2a2b2d', roughness: 0.75, metalness: 0.2}),
  rubber: new THREE.MeshStandardMaterial({color: '#1c1c1d', roughness: 0.95}),
  steel: new THREE.MeshStandardMaterial({color: '#7a7d80', roughness: 0.35, metalness: 0.85}),
  chrome: new THREE.MeshStandardMaterial({color: '#e8eaec', roughness: 0.12, metalness: 1}),
  glass: new THREE.MeshPhysicalMaterial({color: '#29343c', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55}),
};
const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 3, r);
const sideShape = (pts: [number, number][]) => {
  const sh = new THREE.Shape();
  sh.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([px, py]) => sh.lineTo(px, py));
  sh.closePath();
  return sh;
};
const extrude = (pts: [number, number][], depth: number) => {
  const g = new THREE.ExtrudeGeometry(sideShape(pts), {depth, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2});
  g.translate(0, 0, -depth / 2);
  return g;
};
const EX = {
  track: rbox(2.0, 0.42, 0.36, 0.17),
  body: rbox(1.55, 0.62, 1.45, 0.08),
  counter: rbox(0.55, 0.62, 1.42, 0.22),
  hood: rbox(0.9, 0.18, 0.7, 0.06),
  boom: extrude([[0, -0.13], [0.9, 0.05], [1.5, 0.12], [2.4, -0.1], [2.4, 0.1], [1.5, 0.3], [0.9, 0.24], [0, 0.13]], 0.22),
  arm: extrude([[0, -0.11], [1.7, -0.07], [1.7, 0.07], [0.3, 0.16], [0, 0.11]], 0.18),
  bucket: extrude([[0, 0.12], [0.18, -0.35], [0.5, -0.42], [0.55, -0.3], [0.2, 0.1]], 0.55),
};
const Mx: React.FC<{g: THREE.BufferGeometry; m: THREE.Material; p?: [number, number, number]; r?: [number, number, number]}> = ({g, m, p = [0, 0, 0], r = [0, 0, 0]}) => (
  <mesh geometry={g} material={m} position={p} rotation={r} castShadow receiveShadow />
);
const Ram: React.FC<{a: [number, number]; b: [number, number]; z: number}> = ({a, b, z}) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx) - Math.PI / 2;
  return (
    <group position={[a[0], a[1], z]} rotation={[0, 0, ang]}>
      <mesh position={[0, L * 0.3, 0]} material={exMat.paint} castShadow>
        <cylinderGeometry args={[0.055, 0.055, L * 0.6, 14]} />
      </mesh>
      <mesh position={[0, L * 0.75, 0]} material={exMat.chrome} castShadow>
        <cylinderGeometry args={[0.03, 0.03, L * 0.5, 12]} />
      </mesh>
    </group>
  );
};
export const Excavator3D: React.FC<{x: number; y: number; yaw: number; boom: number; arm: number; bucket: number}> = ({x, y, yaw, boom, arm, bucket}) => {
  const shoes = useMemo(() => Array.from({length: 22}, (_, i) => -0.95 + i * 0.09), []);
  return (
    <group position={[x, 0, -y]}>
      {[0.72, -0.72].map((z) => (
        <group key={z} position={[0, 0.21, z]}>
          <Mx g={EX.track} m={exMat.rubber} />
          {shoes.map((sx) => (
            <mesh key={sx} position={[sx, 0.215, 0]} material={exMat.rubber} castShadow>
              <boxGeometry args={[0.04, 0.02, 0.36]} />
            </mesh>
          ))}
          {[-0.82, 0.82].map((wx) => (
            <mesh key={wx} position={[wx, 0, z > 0 ? 0.19 : -0.19]} rotation={[Math.PI / 2, 0, 0]} material={exMat.steel}>
              <cylinderGeometry args={[0.15, 0.15, 0.03, 20]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.5, 0]} material={exMat.dark} castShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.18, 28]} />
      </mesh>
      {/* blade */}
      <Mx g={rbox(0.12, 0.32, 1.7, 0.03)} m={exMat.paint} p={[1.15, 0.2, 0]} />
      <group position={[0, 0.62, 0]} rotation={[0, yaw, 0]}>
        <Mx g={EX.body} m={exMat.paint} p={[-0.3, 0.33, 0]} />
        <Mx g={EX.counter} m={exMat.paint} p={[-0.95, 0.33, 0]} />
        <Mx g={EX.hood} m={exMat.dark} p={[-0.55, 0.7, -0.25]} />
        {/* cab: 4 posts, roof, glass */}
        <group position={[0.18, 0.64, 0.33]}>
          {[[-0.36, -0.33], [0.36, -0.33], [-0.36, 0.33], [0.36, 0.33]].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 0.5, cz]} material={exMat.dark} castShadow>
              <boxGeometry args={[0.05, 1.0, 0.05]} />
            </mesh>
          ))}
          <Mx g={rbox(0.86, 0.07, 0.78, 0.03)} m={exMat.paint} p={[0, 1.02, 0]} />
          <mesh position={[0.37, 0.5, 0]} material={exMat.glass}>
            <boxGeometry args={[0.01, 0.95, 0.66]} />
          </mesh>
          <mesh position={[0, 0.5, 0.34]} material={exMat.glass}>
            <boxGeometry args={[0.7, 0.95, 0.01]} />
          </mesh>
          <mesh position={[0, 0.5, -0.34]} material={exMat.glass}>
            <boxGeometry args={[0.7, 0.95, 0.01]} />
          </mesh>
          <mesh position={[-0.05, 0.25, 0]} material={exMat.dark}>
            <boxGeometry args={[0.4, 0.45, 0.45]} />
          </mesh>
        </group>
        {/* boom */}
        <group position={[0.6, 0.7, -0.25]} rotation={[0, 0, boom]}>
          <Mx g={EX.boom} m={exMat.paint} />
          <Ram a={[0.15, -0.35]} b={[1.2, 0.0]} z={0} />
          <group position={[2.4, 0, 0]} rotation={[0, 0, arm]}>
            <Mx g={EX.arm} m={exMat.paint} />
            <Ram a={[0.2, 0.2]} b={[1.4, 0.1]} z={0} />
            <group position={[1.7, 0, 0]} rotation={[0, 0, bucket]}>
              <Mx g={EX.bucket} m={exMat.dark} p={[0, 0.05, 0]} />
              {[-0.2, -0.07, 0.07, 0.2].map((tz) => (
                <mesh key={tz} position={[0.55, -0.4, tz]} rotation={[0, 0, -0.4]} material={exMat.steel} castShadow>
                  <coneGeometry args={[0.03, 0.12, 8]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
