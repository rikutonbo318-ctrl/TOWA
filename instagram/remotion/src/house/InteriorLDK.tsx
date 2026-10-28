import React from 'react';
import {CH, D, FL1, KITCHEN, M, STAIR, W} from './House';
import {Mat, PBox} from './Geo';

const C = FL1 + CH; // 1F ceiling
const DROP = C - 0.25; // dropped ceiling over the kitchen
const K = KITCHEN;

const WHITE: Mat = {color: '#f5f4f0', rough: 0.9};
const DOOR_WOOD: Mat = {color: '#ffffff', tex: 'grain', uv: 'front', rough: 0.55};
const WORKTOP: Mat = {color: '#ffffff', tex: 'quartz', rough: 0.25};
const STEEL: Mat = {color: '#c9cdd0', rough: 0.25, metal: 0.8};
const BLACK: Mat = {color: '#1e2124', rough: 0.4};
const FABRIC: Mat = {color: '#8f969b', rough: 1};
const WALNUT: Mat = {color: '#ffffff', tex: 'walnut', rough: 0.5};
const OAK: Mat = {color: '#ffffff', tex: 'oak', rough: 0.5};
const GLOW: Mat = {color: '#fff6e6', emissive: '#ffdca8', emissiveIntensity: 2.2};

// small helper for downlights
const Down: React.FC<{x: number; y: number; h: number}> = ({x, y, h}) => (
  <group>
    <PBox x0={x - 0.05} x1={x + 0.05} y0={y - 0.05} y1={y + 0.05} h0={h - 0.012} h1={h - 0.002} m={GLOW} cast={false} receive={false} />
    <pointLight position={[x, h - 0.15, -y]} intensity={0.9} distance={3.2} decay={2} color="#ffe2b8" />
  </group>
);

export const InteriorLDK: React.FC<{lights?: boolean}> = ({lights = true}) => (
  <group>
    {/* ---------- ceilings ---------- */}
    <PBox x0={0} x1={W} y0={0} y1={5 * M} h0={C} h1={C + 0.02} m={WHITE} />
    <PBox x0={0} x1={STAIR.x0} y0={5 * M} y1={D} h0={C} h1={C + 0.02} m={WHITE} />
    <PBox x0={STAIR.x1} x1={W} y0={5 * M} y1={D} h0={C} h1={C + 0.02} m={WHITE} />
    {/* dropped ceiling in wood slats over the kitchen, with a cove light on its edge */}
    <PBox x0={0.06} x1={4 * M} y0={3 * M} y1={5 * M - 0.06} h0={DROP} h1={C} m={{color: '#ffffff', tex: 'slat', rough: 0.6}} />
    <PBox x0={0.06} x1={4 * M} y0={3 * M - 0.02} y1={3 * M} h0={DROP - 0.015} h1={DROP} m={GLOW} cast={false} receive={false} />
    {lights ? <pointLight position={[1.8, DROP - 0.2, -(3 * M - 0.3)]} intensity={1.2} distance={4} color="#ffd9a0" /> : null}
    {/* living ceiling cove (indirect light along the south wall) */}
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

    {/* ---------- kitchen: flat face-to-face island ---------- */}
    <PBox x0={K.island.x0} x1={K.island.x1} y0={K.island.y0} y1={K.island.y1} h0={FL1} h1={FL1 + 0.82} m={{color: '#7c8186', rough: 0.6}} />
    {/* dining-side wood panel */}
    <PBox x0={K.island.x0} x1={K.island.x1} y0={K.island.y0 - 0.02} y1={K.island.y0} h0={FL1} h1={FL1 + 0.82} m={DOOR_WOOD} />
    <PBox x0={K.island.x0 - 0.02} x1={K.island.x1 + 0.02} y0={K.island.y0 - 0.04} y1={K.island.y1 + 0.02} h0={FL1 + 0.82} h1={FL1 + 0.85} m={WORKTOP} />
    {/* sink + faucet, IH */}
    <PBox x0={0.95} x1={1.75} y0={3.12} y1={3.5} h0={FL1 + 0.85} h1={FL1 + 0.853} m={STEEL} cast={false} />
    <PBox x0={1.33} x1={1.37} y0={3.52} y1={3.56} h0={FL1 + 0.85} h1={FL1 + 1.15} m={STEEL} />
    <PBox x0={1.33} x1={1.37} y0={3.35} y1={3.56} h0={FL1 + 1.12} h1={FL1 + 1.15} m={STEEL} />
    <PBox x0={2.25} x1={3.05} y0={3.1} y1={3.52} h0={FL1 + 0.85} h1={FL1 + 0.856} m={{color: '#141517', rough: 0.15, metal: 0.2}} cast={false} />
    {/* slim range hood hung from the dropped ceiling */}
    <PBox x0={2.35} x1={2.95} y0={3.12} y1={3.48} h0={DROP - 0.42} h1={DROP} m={{color: '#e9e9e7', rough: 0.35, metal: 0.3}} />
    {/* pendants over the island */}
    {[1.0, 1.6, 2.2].map((x) => (
      <group key={'pd' + x}>
        <PBox x0={x - 0.004} x1={x + 0.004} y0={3.27} y1={3.28} h0={FL1 + 1.75} h1={DROP} m={BLACK} cast={false} />
        <mesh position={[x, FL1 + 1.68, -3.275]} castShadow={false}>
          <cylinderGeometry args={[0.05, 0.11, 0.16, 20, 1, true]} />
          <meshStandardMaterial color="#1e2124" roughness={0.4} side={2} />
        </mesh>
        <mesh position={[x, FL1 + 1.62, -3.275]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color="#fff" emissive="#ffd59a" emissiveIntensity={3} />
        </mesh>
        {lights ? <pointLight position={[x, FL1 + 1.55, -3.275]} intensity={0.6} distance={2.5} color="#ffd59a" /> : null}
      </group>
    ))}
    {/* back cupboard: lower cabinets + kitchen panel + tall storage */}
    <PBox x0={K.back.x0} x1={K.back.x1} y0={K.back.y0} y1={K.back.y1} h0={FL1} h1={FL1 + 0.85} m={DOOR_WOOD} />
    <PBox x0={K.back.x0} x1={K.back.x1} y0={K.back.y0 - 0.02} y1={K.back.y1} h0={FL1 + 0.85} h1={FL1 + 0.88} m={WORKTOP} />
    <PBox x0={1.2} x1={2.6} y0={K.back.y1 - 0.03} y1={K.back.y1} h0={FL1 + 0.88} h1={FL1 + 1.75} m={{color: '#ffffff', tex: 'quartz', uv: 'front', rough: 0.3}} />
    <PBox x0={1.2} x1={2.6} y0={K.back.y0 + 0.15} y1={K.back.y1} h0={FL1 + 1.75} h1={DROP} m={DOOR_WOOD} />
    <PBox x0={K.back.x0} x1={1.2} y0={K.back.y0} y1={K.back.y1} h0={FL1} h1={DROP} m={DOOR_WOOD} />
    {/* fridge */}
    <PBox x0={2.7} x1={3.45} y0={K.back.y0 - 0.15} y1={K.back.y1} h0={FL1} h1={FL1 + 1.82} m={{color: '#d8d9d7', rough: 0.3, metal: 0.4}} />
    {/* handles: thin black lines on the cabinets */}
    {[0.6, 1.4, 2.2].map((x) => (
      <PBox key={'hd' + x} x0={x} x1={x + 0.5} y0={K.back.y0 - 0.012} y1={K.back.y0} h0={FL1 + 0.8} h1={FL1 + 0.81} m={BLACK} cast={false} />
    ))}

    {/* ---------- dining ---------- */}
    <PBox x0={1.15} x1={2.85} y0={1.6} y1={2.45} h0={FL1 + 0.69} h1={FL1 + 0.72} m={OAK} />
    {[
      [1.22, 1.67],
      [2.78, 1.67],
      [1.22, 2.38],
      [2.78, 2.38],
    ].map(([x, y], i) => (
      <PBox key={'tl' + i} x0={x - 0.025} x1={x + 0.025} y0={y - 0.025} y1={y + 0.025} h0={FL1} h1={FL1 + 0.69} m={BLACK} />
    ))}
    {[
      [1.55, 1.38, 0],
      [2.45, 1.38, 0],
      [1.55, 2.67, 1],
      [2.45, 2.67, 1],
    ].map(([x, y, n], i) => (
      <group key={'ch' + i}>
        <PBox x0={x - 0.21} x1={x + 0.21} y0={y - 0.2} y1={y + 0.2} h0={FL1 + 0.42} h1={FL1 + 0.46} m={{color: '#c49a6c', tex: 'oak', rough: 0.5}} />
        <PBox x0={x - 0.2} x1={x + 0.2} y0={n ? y + 0.17 : y - 0.2} y1={n ? y + 0.2 : y - 0.17} h0={FL1 + 0.46} h1={FL1 + 0.8} m={{color: '#c49a6c', tex: 'oak', rough: 0.5}} />
        {[
          [-0.17, -0.17],
          [0.17, -0.17],
          [-0.17, 0.17],
          [0.17, 0.17],
        ].map(([dx, dy], k) => (
          <PBox key={k} x0={x + dx - 0.012} x1={x + dx + 0.012} y0={y + dy - 0.012} y1={y + dy + 0.012} h0={FL1} h1={FL1 + 0.42} m={BLACK} />
        ))}
      </group>
    ))}

    {/* ---------- living: sofa facing the TV wall (east) ---------- */}
    <PBox x0={3.75} x1={4.6} y0={0.35} y1={2.45} h0={FL1 + 0.1} h1={FL1 + 0.42} m={FABRIC} />
    <PBox x0={3.75} x1={3.97} y0={0.35} y1={2.45} h0={FL1 + 0.42} h1={FL1 + 0.82} m={FABRIC} />
    <PBox x0={3.75} x1={4.6} y0={0.35} y1={0.52} h0={FL1 + 0.42} h1={FL1 + 0.6} m={FABRIC} />
    <PBox x0={3.75} x1={4.6} y0={2.28} y1={2.45} h0={FL1 + 0.42} h1={FL1 + 0.6} m={FABRIC} />
    <PBox x0={4.05} x1={4.45} y0={0.9} y1={1.3} h0={FL1 + 0.42} h1={FL1 + 0.7} m={{color: '#c9b79b', rough: 1}} />
    <PBox x0={4.0} x1={6.0} y0={0.4} y1={2.4} h0={FL1} h1={FL1 + 0.008} m={{color: '#e2dccf', rough: 1}} />
    <PBox x0={4.9} x1={5.55} y0={1.05} y1={1.75} h0={FL1 + 0.3} h1={FL1 + 0.34} m={WALNUT} />
    <PBox x0={5.0} x1={5.45} y0={1.15} y1={1.65} h0={FL1} h1={FL1 + 0.3} m={BLACK} />
    {/* TV wall: stone-look accent tiles, floating TV board, TV */}
    <PBox x0={7 * M - 0.075} x1={7 * M - 0.055} y0={0.08} y1={1.42} h0={FL1} h1={C} m={{color: '#ffffff', tex: 'stone', uv: 'side', rough: 0.9}} />
    <PBox x0={5.95} x1={7 * M - 0.075} y0={0.15} y1={1.35} h0={FL1 + 0.22} h1={FL1 + 0.45} m={WALNUT} />
    <PBox x0={6.22} x1={6.26} y0={0.25} y1={1.25} h0={FL1 + 0.75} h1={FL1 + 1.36} m={{color: '#0d0f11', rough: 0.15, metal: 0.3}} />
    {/* plant */}
    <PBox x0={5.95} x1={6.2} y0={1.55} y1={1.8} h0={FL1} h1={FL1 + 0.35} m={{color: '#e8e4dc'}} />
    {[0, 1, 2, 3, 4].map((k) => (
      <mesh key={'lf' + k} position={[6.075 + Math.cos(k * 1.3) * 0.12, FL1 + 0.75 + (k % 2) * 0.12, -(1.675 + Math.sin(k * 1.3) * 0.12)]} rotation={[Math.sin(k) * 0.4, k, Math.cos(k) * 0.4]} castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color={k % 2 ? '#4f7d4a' : '#5f9258'} roughness={0.8} />
      </mesh>
    ))}

    {/* ---------- stair: oak treads, iron rail ---------- */}
    {Array.from({length: 7}).map((_, i) => (
      <PBox key={'s1' + i} x0={STAIR.x0} x1={STAIR.x0 + M} y0={STAIR.y0 + i * 0.18} y1={STAIR.y0 + i * 0.18 + 0.24} h0={FL1 + (i + 1) * 0.2 - 0.04} h1={FL1 + (i + 1) * 0.2} m={OAK} />
    ))}
    <PBox x0={STAIR.x0} x1={STAIR.x1} y0={STAIR.y1 - 0.5} y1={STAIR.y1} h0={FL1 + 1.4} h1={FL1 + 1.44} m={OAK} />
    {Array.from({length: 7}).map((_, i) => (
      <PBox key={'s2' + i} x0={STAIR.x0 + M} x1={STAIR.x1} y0={STAIR.y1 - 0.5 - (i + 1) * 0.18} y1={STAIR.y1 - 0.5 - i * 0.18} h0={FL1 + 1.6 + i * 0.2} h1={FL1 + 1.64 + i * 0.2} m={OAK} />
    ))}
    {[0, 0.6, 1.2].map((d) => (
      <PBox key={'rl' + d} x0={STAIR.x0 + M - 0.015} x1={STAIR.x0 + M + 0.015} y0={STAIR.y0 + 0.2 + d} y1={STAIR.y0 + 0.23 + d} h0={FL1 + 0.3 + d * 1.1} h1={FL1 + 1.2 + d * 1.1} m={BLACK} />
    ))}
    <PBox x0={STAIR.x0 + M - 0.02} x1={STAIR.x0 + M + 0.02} y0={STAIR.y0 + 0.2} y1={STAIR.y1 - 0.5} h0={FL1 + 1.2} h1={FL1 + 1.23} m={BLACK} />
  </group>
);
