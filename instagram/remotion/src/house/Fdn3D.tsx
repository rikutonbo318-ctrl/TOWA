import React from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {FDN_LINES} from './House';
import {PBox} from './Geo';
import {Line3D} from './Kit3D';
import {HOLE} from './Site3D';

// foundation groundwork inside the pit: gravel, compaction, vapour sheet, lean concrete, ink lines
export type FdnState = {gravel?: number; compact?: number; sheet?: number; sutecon?: number; suteconDry?: number; sumi?: number};

export const BOT = -HOLE.depth; // pit bottom
export const GRAVEL_TOP = BOT + 0.1;
export const SHEET_TOP = GRAVEL_TOP + 0.004;
export const SUTE_TOP = SHEET_TOP + 0.05;
const N = 10;

export const lineLen = ([x0, y0, x1, y1]: number[]) => Math.hypot(x1 - x0, y1 - y0);
export const TOTAL = FDN_LINES.reduce((a, l) => a + lineLen(l), 0);

// walk the foundation lines as one long path: returns per-line visible fraction for progress p
export const linesUpTo = (p: number) => {
  let acc = 0;
  const target = p * TOTAL;
  return FDN_LINES.map((l) => {
    const L = lineLen(l);
    const k = Math.max(0, Math.min(1, (target - acc) / L));
    acc += L;
    return k;
  });
};

export const Fdn3D: React.FC<{s: FdnState}> = ({s}) => {
  const H = HOLE;
  const strip = (i: number) => [H.x0 + ((H.x1 - H.x0) * i) / N, H.x0 + ((H.x1 - H.x0) * (i + 1)) / N];
  const g = s.gravel ?? 0;
  const c = s.compact ?? 0;
  const sh = s.sheet ?? 0;
  const su = linesUpTo(s.sutecon ?? 0);
  const sm = linesUpTo(s.sumi ?? 0);
  const dry = s.suteconDry ?? 0;
  return (
    <group>
      {/* gravel, spread west → east */}
      {Array.from({length: N}).map((_, i) => {
        const k = Math.max(0, Math.min(1, g * N - i));
        if (k <= 0) return null;
        const [a, b] = strip(i);
        const compacted = Math.max(0, Math.min(1, c * N - i));
        return <PBox key={'gv' + i} x0={a} x1={b} y0={H.y0} y1={H.y1} h0={BOT} h1={BOT + 0.02 + 0.1 * k - 0.015 * compacted} m={{color: compacted > 0.5 ? '#d8d6d0' : '#ffffff', tex: 'gravel', rough: 1}} />;
      })}
      {/* vapour barrier sheet in overlapping runs */}
      {Array.from({length: 4}).map((_, i) => {
        const k = Math.max(0, Math.min(1, sh * 4 - i));
        if (k <= 0) return null;
        const y0 = H.y0 + ((H.y1 - H.y0) * i) / 4 - (i ? 0.15 : 0);
        const y1 = H.y0 + ((H.y1 - H.y0) * (i + 1)) / 4;
        return (
          <group key={'sh' + i}>
            <PBox x0={H.x0} x1={H.x0 + (H.x1 - H.x0) * k} y0={y0} y1={y1} h0={GRAVEL_TOP - 0.01 + i * 0.004} h1={SHEET_TOP + i * 0.004} m={{color: '#e2eaee', rough: 0.3, tex: 'plaster'}} cast={false} />
            {k < 1 ? (
              <mesh position={[H.x0 + (H.x1 - H.x0) * k, SHEET_TOP + 0.06, -(y0 + y1) / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, y1 - y0, 16]} />
                <meshStandardMaterial color="#dfe9ee" roughness={0.3} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {/* lean concrete strips under every foundation line */}
      {FDN_LINES.map(([x0, y0, x1, y1], i) => {
        const k = su[i];
        if (k <= 0) return null;
        const ex = x0 + (x1 - x0) * k;
        const ey = y0 + (y1 - y0) * k;
        const w = 0.25;
        return (
          <PBox key={'sc' + i} x0={Math.min(x0, ex) - w} x1={Math.max(x0, ex) + w} y0={Math.min(y0, ey) - w} y1={Math.max(y0, ey) + w} h0={SHEET_TOP + 0.016} h1={SUTE_TOP + i * 0.0006} m={{color: dry > 0.5 ? '#ffffff' : '#9a9893', tex: 'conc', rough: dry > 0.5 ? 0.95 : 0.35}} />
        );
      })}
      {/* ink lines: wall centre + both faces */}
      {FDN_LINES.map(([x0, y0, x1, y1], i) => {
        const k = sm[i];
        if (k <= 0) return null;
        const ex = x0 + (x1 - x0) * k;
        const ey = y0 + (y1 - y0) * k;
        const horiz = y0 === y1;
        return [-0.075, 0, 0.075].map((d) => (
          <Line3D key={'sm' + i + d} a={[x0 + (horiz ? 0 : d), y0 + (horiz ? d : 0), SUTE_TOP + 0.009]} b={[ex + (horiz ? 0 : d), ey + (horiz ? d : 0), SUTE_TOP + 0.009]} w={d === 0 ? 0.012 : 0.008} color={d === 0 ? '#c8102e' : '#1b2a4a'} emissive />
        ));
      })}
    </group>
  );
};

const veh = {
  white: new THREE.MeshPhysicalMaterial({color: '#f1f1ee', roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.15}),
  glass: new THREE.MeshPhysicalMaterial({color: '#1d272e', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.8}),
  tire: new THREE.MeshStandardMaterial({color: '#1b1b1c', roughness: 0.9}),
  rim: new THREE.MeshStandardMaterial({color: '#b8bcc0', roughness: 0.3, metalness: 0.9}),
  steel: new THREE.MeshStandardMaterial({color: '#8e9296', roughness: 0.45, metalness: 0.7}),
  dark: new THREE.MeshStandardMaterial({color: '#2c2d2f', roughness: 0.7, metalness: 0.2}),
  yellow: new THREE.MeshPhysicalMaterial({color: '#eab01c', roughness: 0.4, clearcoat: 0.5}),
  lamp: new THREE.MeshStandardMaterial({color: '#fffbe8', emissive: '#fff5d0', emissiveIntensity: 0.3, roughness: 0.1}),
  rebar: new THREE.MeshStandardMaterial({color: '#6e4630', roughness: 0.7, metalness: 0.5}),
};

// plate compactor
export const Compactor3D: React.FC<{x: number; y: number; h: number; f: number}> = ({x, y, h, f}) => (
  <group position={[x, h + Math.abs(Math.sin(f * 1.7)) * 0.01, -y]}>
    <mesh geometry={new RoundedBoxGeometry(0.5, 0.06, 0.4, 2, 0.02)} material={veh.steel} position={[0, 0.03, 0]} castShadow receiveShadow />
    <mesh geometry={new RoundedBoxGeometry(0.34, 0.2, 0.28, 3, 0.05)} material={veh.yellow} position={[0, 0.17, 0]} castShadow />
    <mesh position={[0.02, 0.3, 0]} material={veh.dark} castShadow>
      <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
    </mesh>
    <Line3D a={[-0.15, 0.12, 0.3]} b={[-0.75, 0.12, 0.95]} w={0.025} color="#2b2b2b" />
    <Line3D a={[-0.15, -0.12, 0.3]} b={[-0.75, -0.12, 0.95]} w={0.025} color="#2b2b2b" />
    <Line3D a={[-0.75, 0.2, 0.95]} b={[-0.75, -0.2, 0.95]} w={0.03} color="#2b2b2b" />
  </group>
);

// rebar bundles on timbers (round deformed bars)
export const RebarStack: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) =>
  o <= 0 ? null : (
    <group>
      <PBox x0={x - 0.05} x1={x + 0.05} y0={y - 0.6} y1={y + 0.6} h0={0} h1={0.1} m={{color: '#9c7a52'}} />
      <PBox x0={x + 3.45} x1={x + 3.55} y0={y - 0.6} y1={y + 0.6} h0={0} h1={0.1} m={{color: '#9c7a52'}} />
      {Array.from({length: Math.round(18 * o)}).map((_, i) => (
        <mesh key={i} material={veh.rebar} position={[x + 1.75, 0.12 + Math.floor(i / 9) * 0.026, -(y - 0.45 + (i % 9) * 0.1)]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.0065, 0.0065, 4.1, 8]} />
        </mesh>
      ))}
    </group>
  );

// small flatbed truck on the road (cab faces +x)
export const Truck3D: React.FC<{x: number; y: number}> = ({x, y}) => (
  <group position={[x, 0, -y]}>
    {/* cab */}
    <mesh geometry={new RoundedBoxGeometry(1.55, 1.55, 1.7, 4, 0.14)} material={veh.white} position={[0.78, 1.2, 0]} castShadow receiveShadow />
    <mesh geometry={new RoundedBoxGeometry(0.06, 0.62, 1.48, 2, 0.02)} material={veh.glass} position={[1.55, 1.55, 0]} rotation={[0, 0, 0.12]} />
    {[0.86, -0.86].map((z) => (
      <mesh key={z} position={[0.95, 1.55, z]} material={veh.glass}>
        <boxGeometry args={[0.8, 0.55, 0.02]} />
      </mesh>
    ))}
    <mesh position={[1.56, 0.62, 0]} material={veh.dark}>
      <boxGeometry args={[0.06, 0.25, 1.62]} />
    </mesh>
    {[0.6, -0.6].map((z) => (
      <mesh key={'l' + z} position={[1.57, 0.85, z]} material={veh.lamp}>
        <boxGeometry args={[0.03, 0.12, 0.22]} />
      </mesh>
    ))}
    {/* chassis + flatbed with side gates */}
    <mesh position={[-1.9, 0.55, 0]} material={veh.dark} castShadow>
      <boxGeometry args={[4.6, 0.16, 1.0]} />
    </mesh>
    <mesh geometry={new RoundedBoxGeometry(4.2, 0.12, 1.9, 2, 0.02)} material={veh.steel} position={[-2.1, 0.74, 0]} castShadow receiveShadow />
    {[0.94, -0.94].map((z) => (
      <mesh key={'g' + z} position={[-2.1, 0.94, z]} material={veh.steel} castShadow>
        <boxGeometry args={[4.2, 0.32, 0.03]} />
      </mesh>
    ))}
    <mesh position={[-4.18, 0.94, 0]} material={veh.steel} castShadow>
      <boxGeometry args={[0.03, 0.32, 1.9]} />
    </mesh>
    {/* wheels */}
    {[0.85, -2.6, -3.3].map((wx) =>
      [0.82, -0.82].map((z) => (
        <group key={wx + '_' + z} position={[wx, 0.36, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={veh.tire} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.24, 28]} />
          </mesh>
          <mesh material={veh.rim} position={[0, z > 0 ? 0.121 : -0.121, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.01, 20]} />
          </mesh>
        </group>
      )),
    )}
  </group>
);
