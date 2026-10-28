import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {D, M, W} from './House';
import {PBox} from './Geo';
import {Neighbour, SITE} from './Site3D';

// finished exterior works (外構) around the model house:
// 2-car parking with a flat-roof carport and slit concrete, gate pillar, stone approach to the east entrance,
// slatted privacy fence + wood deck + lawn on the LDK side, planting and night lighting.
const {x0, x1, y0, y1} = SITE;
const ENTRY = {y0: 3.2 * M - 0.6, y1: 4.2 * M + 0.6}; // porch extent on the east side
const PARK = {x0: 3.3, x1: 9.0, y0: y0, y1: -0.35};
const APPROACH = {x0: 9.35, x1: 10.75};

const mats = {
  alu: new THREE.MeshStandardMaterial({color: '#3b3d40', roughness: 0.4, metalness: 0.6}),
  roof: new THREE.MeshPhysicalMaterial({color: '#2f3134', roughness: 0.35, metalness: 0.5, clearcoat: 0.4}),
  slat: new THREE.MeshStandardMaterial({color: '#6e5440', roughness: 0.55, metalness: 0.15}),
  trunk: new THREE.MeshStandardMaterial({color: '#7d7468', roughness: 0.9}),
  leaf: new THREE.MeshStandardMaterial({color: '#4f7a3f', roughness: 0.75}),
  leaf2: new THREE.MeshStandardMaterial({color: '#6a8f4a', roughness: 0.75}),
  shrub: new THREE.MeshStandardMaterial({color: '#3f6232', roughness: 0.85}),
  lamp: new THREE.MeshStandardMaterial({color: '#fff3d6', emissive: '#ffcf86', emissiveIntensity: 2.5}),
};

// one compact car (rounded body, glass cabin, wheels); faces +y (north) when yaw = 0
const carMat = (c: string) => new THREE.MeshPhysicalMaterial({color: c, roughness: 0.25, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08});
const glassMat = new THREE.MeshPhysicalMaterial({color: '#141a1f', roughness: 0.03, metalness: 0.3});
const tireMat = new THREE.MeshStandardMaterial({color: '#1a1a1b', roughness: 0.9});
const rimMat = new THREE.MeshStandardMaterial({color: '#c3c7cb', roughness: 0.25, metalness: 0.9});
const Car: React.FC<{x: number; y: number; color: string}> = ({x, y, color}) => {
  const body = useMemo(() => new RoundedBoxGeometry(1.7, 0.62, 4.3, 5, 0.22), []);
  const cabin = useMemo(() => new RoundedBoxGeometry(1.5, 0.55, 2.3, 5, 0.2), []);
  const m = useMemo(() => carMat(color), [color]);
  return (
    <group position={[x, 0, -y]}>
      <mesh geometry={body} material={m} position={[0, 0.58, 0]} castShadow receiveShadow />
      <mesh geometry={cabin} material={glassMat} position={[0, 1.08, 0.25]} castShadow />
      <mesh geometry={useMemo(() => new RoundedBoxGeometry(1.52, 0.06, 1.9, 3, 0.03), [])} material={m} position={[0, 1.36, 0.25]} />
      {[
        [0.78, 1.35],
        [-0.78, 1.35],
        [0.78, -1.4],
        [-0.78, -1.4],
      ].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.32, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={tireMat} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
          </mesh>
          <mesh material={rimMat} position={[0, wx > 0 ? 0.112 : -0.112, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.01, 24]} />
          </mesh>
        </group>
      ))}
      {[-0.55, 0.55].map((lx) => (
        <mesh key={lx} position={[lx, 0.68, -2.14]} material={new THREE.MeshStandardMaterial({color: '#7a1010', emissive: '#a01010', emissiveIntensity: 0.4})}>
          <boxGeometry args={[0.35, 0.08, 0.02]} />
        </mesh>
      ))}
    </group>
  );
};

// symbol tree (multi-stem, airy crown)
const Tree: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const blobs = useMemo(
    () =>
      Array.from({length: 260}, (_, i) => {
        const a = i * 2.39996;
        const k = ((i * 7919) % 1000) / 1000;
        const r = Math.sqrt(k) * 0.95;
        const h = 1.7 + ((i * 131) % 100) / 55 - r * 0.4;
        return {p: [Math.cos(a) * r, h, Math.sin(a) * r] as [number, number, number], r: 0.07 + ((i * 17) % 7) / 90, m: i % 3 ? mats.leaf : mats.leaf2};
      }),
    [],
  );
  return (
    <group position={[x, 0, -y]} scale={s}>
      {[-0.4, 0.1, 0.5].map((tilt, i) => (
        <mesh key={i} material={mats.trunk} position={[Math.sin(tilt) * 0.5, 1.2, Math.cos(i * 2) * 0.12]} rotation={[0, 0, -tilt * 0.35]} castShadow>
          <cylinderGeometry args={[0.025, 0.045, 2.4, 8]} />
        </mesh>
      ))}
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} material={b.m} castShadow>
          <sphereGeometry args={[b.r, 7, 5]} />
        </mesh>
      ))}
    </group>
  );
};

const Shrub: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 0.35}) => (
  <group position={[x, 0, -y]}>
    {Array.from({length: 40}, (_, i) => {
      const a = i * 2.39996;
      const k = Math.sqrt(((i * 7919) % 1000) / 1000);
      return (
        <mesh key={i} position={[Math.cos(a) * k * r, r * (0.35 + 0.75 * (1 - k * k)) * (0.6 + ((i * 37) % 10) / 25), Math.sin(a) * k * r]} material={i % 4 ? mats.shrub : mats.leaf} castShadow receiveShadow>
          <sphereGeometry args={[r * 0.28, 7, 5]} />
        </mesh>
      );
    })}
  </group>
);

// low garden light / bollard
const Bollard: React.FC<{x: number; y: number; night: boolean}> = ({x, y, night}) => (
  <group position={[x, 0, -y]}>
    <mesh material={mats.alu} position={[0, 0.3, 0]} castShadow>
      <boxGeometry args={[0.1, 0.6, 0.1]} />
    </mesh>
    <mesh material={night ? mats.lamp : mats.alu} position={[0, 0.5, 0.051]}>
      <boxGeometry args={[0.08, 0.12, 0.005]} />
    </mesh>
    {night ? <pointLight position={[0, 0.45, 0.25]} intensity={1.8} distance={2.6} color="#ffcf86" /> : null}
  </group>
);

export const Gaiko3D: React.FC<{night?: boolean; cars?: boolean}> = ({night = false, cars = false}) => {
  // slit concrete: slabs split by gravel joints every ~1.8 m across the parking
  const slabs: [number, number][] = [];
  for (let y = PARK.y0; y < PARK.y1 - 0.1; y += 1.5) slabs.push([y, Math.min(PARK.y1, y + 1.4)]);
  return (
    <group>
      {/* surroundings */}
      <PBox x0={-40} x1={50} y0={y1} y1={60} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={-40} x1={x0} y0={y0 - 0.15} y1={y1} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={x1} x1={50} y0={y0 - 0.15} y1={y1} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={-40} x1={50} y0={-40} y1={-11} h0={-0.6} h1={0} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={-40} x1={50} y0={-11} y1={y0 - 0.15} h0={-0.6} h1={0.0} m={{color: '#5b5f63', rough: 0.9}} />
      <PBox x0={-30} x1={40} y0={-7.9} y1={-7.75} h0={0.0} h1={0.004} m={{color: '#e8e8e2'}} />
      <PBox x0={-30} x1={40} y0={y0 - 0.15} y1={y0} h0={-0.05} h1={0.06} m={{color: '#b9b8b2'}} />
      <PBox x0={x0 - 0.15} x1={x0} y0={y0} y1={y1 + 0.15} h0={0} h1={1.2} m={{color: '#c4c3bd'}} />
      <PBox x0={x0 - 0.15} x1={x1} y0={y1} y1={y1 + 0.15} h0={0} h1={1.2} m={{color: '#c4c3bd'}} />
      <Neighbour x0={-14} x1={-6} y0={-1} y1={8} h={6.0} wall="#e4e1da" roof="#4a4f55" />
      <Neighbour x0={1} x1={10} y0={13} y1={20} h={6.3} wall="#d8dcdf" roof="#3f454b" />
      <Neighbour x0={16} x1={24} y0={0} y1={8} h={5.8} wall="#ebe6dc" roof="#5e5246" />

      {/* base: dark gravel (防草シート + 砂利) everywhere not paved */}
      <PBox x0={x0} x1={x1} y0={y0} y1={y1} h0={-0.6} h1={0.0} m={{color: '#8a857c', tex: 'gravel', rough: 1}} />

      {/* parking: slit concrete with gravel joints */}
      {slabs.map(([a, b], i) => (
        <PBox key={'sl' + i} x0={PARK.x0} x1={PARK.x1} y0={a} y1={b} h0={0} h1={0.03} m={{color: '#d7d4cd', tex: 'conc', rough: 0.9}} />
      ))}
      {/* approach: large porcelain pavers to the porch */}
      {Array.from({length: 9}).map((_, i) => {
        const a = y0 + 0.05 + i * 0.86;
        if (a > ENTRY.y0 - 0.1) return null;
        return <PBox key={'ap' + i} x0={APPROACH.x0} x1={APPROACH.x1} y0={a} y1={a + 0.8} h0={0} h1={0.04} m={{color: '#cfc9bd', tex: 'tile', rough: 0.7}} />;
      })}
      {/* gate pillar (門柱) facing the road: rendered wall with house number, post slot, intercom, top light */}
      <PBox x0={10.95} x1={12.55} y0={y0 + 0.6} y1={y0 + 0.82} h0={0} h1={1.45} m={{color: '#cfcac0', tex: 'plaster', rough: 0.9}} />
      <PBox x0={11.15} x1={11.55} y0={y0 + 0.59} y1={y0 + 0.6} h0={1.1} h1={1.22} m={{color: '#2b2d30', rough: 0.4, metal: 0.5}} />
      <PBox x0={11.8} x1={12.3} y0={y0 + 0.59} y1={y0 + 0.6} h0={0.82} h1={0.95} m={{color: '#3a3c3f', rough: 0.4, metal: 0.6}} />
      <PBox x0={11.62} x1={11.72} y0={y0 + 0.585} y1={y0 + 0.6} h0={1.12} h1={1.28} m={{color: '#1e2124', rough: 0.3}} />
      <PBox x0={10.95} x1={12.55} y0={y0 + 0.57} y1={y0 + 0.6} h0={1.42} h1={1.45} m={night ? {color: '#fff3d6', emissive: '#ffcf86', emissiveIntensity: 2} : {color: '#2b2d30'}} cast={false} />
      {night ? <pointLight position={[11.75, 1.25, -(y0 + 0.2)]} intensity={3.2} distance={3.5} color="#ffcf86" /> : null}
      {/* carport: 2-car flat roof, posts on the house side, thin dark roof */}
      {[PARK.x0 + 0.2, (PARK.x0 + PARK.x1) / 2, PARK.x1 - 0.2].map((px) => (
        <mesh key={'cp' + px} material={mats.alu} position={[px, 1.2, -(PARK.y1 - 0.15)]} castShadow>
          <boxGeometry args={[0.1, 2.4, 0.1]} />
        </mesh>
      ))}
      <mesh material={mats.alu} position={[(PARK.x0 + PARK.x1) / 2, 2.38, -(PARK.y1 - 0.15)]} castShadow>
        <boxGeometry args={[PARK.x1 - PARK.x0 - 0.2, 0.14, 0.12]} />
      </mesh>
      <mesh material={mats.roof} position={[(PARK.x0 + PARK.x1) / 2, 2.5, -((PARK.y1 + PARK.y0 + 0.4) / 2)]} castShadow receiveShadow>
        <boxGeometry args={[PARK.x1 - PARK.x0 + 0.1, 0.1, PARK.y1 - PARK.y0 - 0.2]} />
      </mesh>
      {cars ? (
        <>
          <Car x={4.85} y={-2.5} color="#e9e9e6" />
          <Car x={7.5} y={-2.4} color="#2c3a4f" />
        </>
      ) : null}

      {/* LDK garden on the west: lawn, wood deck off the sweep windows, slatted privacy fence */}
      <PBox x0={x0} x1={PARK.x0 - 0.1} y0={y0} y1={-0.1} h0={0} h1={0.02} m={{color: '#9bb47a', rough: 1}} />
      <PBox x0={0.2} x1={3.0} y0={-1.8} y1={-0.08} h0={0.3} h1={0.36} m={{color: '#8a6a50', tex: 'lumber', rough: 0.7}} />
      {Array.from({length: 14}).map((_, i) => (
        <PBox key={'dk' + i} x0={0.2} x1={3.0} y0={-1.8 + i * 0.123} y1={-1.8 + i * 0.123 + 0.006} h0={0.36} h1={0.361} m={{color: '#3a2c20'}} cast={false} />
      ))}
      <PBox x0={0.2} x1={3.0} y0={-1.8} y1={-0.08} h0={0} h1={0.3} m={{color: '#5d4636', rough: 0.8}} />
      {Array.from({length: 13}).map((_, i) => (
        <mesh key={'fs' + i} material={mats.slat} position={[(x0 + PARK.x0 - 0.3) / 2, 0.25 + i * 0.12, -(y0 + 0.15)]} castShadow receiveShadow>
          <boxGeometry args={[PARK.x0 - 0.3 - x0, 0.09, 0.02]} />
        </mesh>
      ))}
      {[x0 + 0.05, (x0 + PARK.x0 - 0.3) / 2, PARK.x0 - 0.35].map((px) => (
        <mesh key={'fp' + px} material={mats.alu} position={[px, 0.95, -(y0 + 0.15)]} castShadow>
          <boxGeometry args={[0.07, 1.9, 0.07]} />
        </mesh>
      ))}
      {/* planting */}
      <Tree x={12.4} y={y0 + 1.7} />
      <Tree x={-2.4} y={-3.4} s={0.85} />
      {[
        [11.2, y0 + 0.3],
        [12.3, y0 + 0.3],
        [11.6, y0 + 1.4],
        [-3.0, -1.0],
        [-1.9, -2.2],
        [9.9, -0.2],
      ].map(([x, y], i) => (
        <Shrub key={'sh' + i} x={x} y={y} r={0.28 + (i % 3) * 0.06} />
      ))}
      {[
        [APPROACH.x0 - 0.15, -2.6],
        [APPROACH.x0 - 0.15, -0.6],
        [APPROACH.x1 + 0.15, 1.2],
      ].map(([x, y], i) => (
        <Bollard key={'bl' + i} x={x} y={y} night={night} />
      ))}
      {night ? (
        <>
          <pointLight position={[W + 0.6, 2.9, -(3.35)]} intensity={4} distance={5} color="#ffcf86" />
          <pointLight position={[(PARK.x0 + PARK.x1) / 2, 2.3, -(PARK.y0 + PARK.y1) / 2]} intensity={4} distance={6} color="#ffe2b0" />
          <pointLight position={[11.8, 0.3, -(y0 + 1.6)]} intensity={3} distance={4} color="#ffcf86" />
        </>
      ) : null}
    </group>
  );
};
