import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import {Cam} from './Scene3D';
import {Human, useAssets} from './Real';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// camera keyframes: [frame, pos(plan x,y,h), look(plan x,y,h), fov]
export type CamKey = [number, [number, number, number], [number, number, number], number];
export const camTrack = (keys: CamKey[]) => (f: number): Cam => {
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = interpolate(f, [a[0], b[0]], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const mix = (p: number[], q: number[]) => p.map((v, k) => v + (q[k] - v) * t) as [number, number, number];
  return {pos: mix(a[1], b[1]), look: mix(a[2], b[2]), fov: a[3] + (b[3] - a[3]) * t};
};

export type Act3 = 'idle' | 'walk' | 'hammer' | 'point' | 'measure' | 'wave' | 'shovel' | 'press';

const Part: React.FC<{size: [number, number, number]; pos: [number, number, number]; color: string; rough?: number}> = ({size, pos, color, rough = 0.8}) => (
  <mesh position={pos} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={rough} />
  </mesh>
);

// low-poly worker. (x, y) plan position, yaw = facing direction in plan degrees (0 = east, 90 = north)
export const Person3DBlock: React.FC<{x: number; y: number; h?: number; yaw: number; act: Act3; f: number; suit?: string; vest?: string; helmet?: string; phase?: number; scale?: number}> = ({x, y, h = 0, yaw, act, f, suit = '#2f4a78', vest = '#f08a24', helmet = '#f4f4f2', phase = 0, scale = 1}) => {
  const t = f + phase;
  const walk = act === 'walk' ? Math.sin(t * 0.45) * 0.6 : 0;
  let rArm = act === 'walk' ? -walk * 0.8 : 0.1;
  let lArm = act === 'walk' ? walk * 0.8 : 0.1;
  if (act === 'hammer') {
    const c = (t % 14) / 14;
    rArm = c < 0.6 ? interpolate(c, [0, 0.6], [-0.6, -2.4]) : interpolate(c, [0.6, 0.75], [-2.4, -0.7], clamp);
  } else if (act === 'point') {
    rArm = -1.45;
  } else if (act === 'measure') {
    rArm = -1.2;
    lArm = -1.2;
  } else if (act === 'wave') {
    rArm = -2.8 + Math.sin(t * 0.5) * 0.3;
  } else if (act === 'shovel') {
    const c = Math.sin(t * 0.25);
    rArm = -0.9 + c * 0.5;
    lArm = -0.9 + c * 0.5;
  } else if (act === 'press') {
    rArm = -1.3 + Math.sin(t * 0.3) * 0.1;
    lArm = -0.4;
  }
  const lean = act === 'shovel' ? 0.25 : 0;
  // three: local +z is facing; yaw converts plan angle (0 = +x east) to rotation about Y
  const rotY = (yaw * Math.PI) / 180 + Math.PI / 2;
  return (
    <group position={[x, h, -y]} rotation={[0, rotY, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
      {/* legs */}
      <group position={[-0.09, 0.85, 0]} rotation={[walk, 0, 0]}>
        <Part size={[0.13, 0.8, 0.15]} pos={[0, -0.4, 0]} color="#253a5e" />
        <Part size={[0.15, 0.08, 0.26]} pos={[0, -0.8, 0.05]} color="#3a2a1e" />
      </group>
      <group position={[0.09, 0.85, 0]} rotation={[-walk, 0, 0]}>
        <Part size={[0.13, 0.8, 0.15]} pos={[0, -0.4, 0]} color="#2c4470" />
        <Part size={[0.15, 0.08, 0.26]} pos={[0, -0.8, 0.05]} color="#3a2a1e" />
      </group>
      <group position={[0, 0.85, 0]} rotation={[lean, 0, 0]}>
        {/* torso + vest band + belt */}
        <Part size={[0.42, 0.6, 0.25]} pos={[0, 0.3, 0]} color={suit} />
        <Part size={[0.43, 0.09, 0.26]} pos={[0, 0.4, 0]} color={vest} />
        <Part size={[0.43, 0.05, 0.26]} pos={[0, 0.03, 0]} color="#5b3d22" />
        {/* arms */}
        <group position={[0.27, 0.56, 0]} rotation={[rArm, 0, 0]}>
          <Part size={[0.11, 0.6, 0.12]} pos={[0, -0.3, 0]} color={suit} />
          <Part size={[0.1, 0.1, 0.1]} pos={[0, -0.62, 0]} color="#e2b48a" />
          {act === 'hammer' ? <Part size={[0.05, 0.05, 0.3]} pos={[0, -0.66, 0.12]} color="#5b6470" /> : null}
          {act === 'shovel' ? <Part size={[0.04, 0.04, 1.1]} pos={[0, -0.64, 0.4]} color="#8a5a2b" /> : null}
        </group>
        <group position={[-0.27, 0.56, 0]} rotation={[lArm, 0, 0]}>
          <Part size={[0.11, 0.6, 0.12]} pos={[0, -0.3, 0]} color={suit} />
          <Part size={[0.1, 0.1, 0.1]} pos={[0, -0.62, 0]} color="#e2b48a" />
        </group>
        {/* head + helmet */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshStandardMaterial color="#e2b48a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <sphereGeometry args={[0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={helmet} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.82, 0.03]}>
          <cylinderGeometry args={[0.17, 0.17, 0.015, 20]} />
          <meshStandardMaterial color={helmet} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// green check badge that always faces the camera
const checkTexture = (() => {
  let tex: THREE.CanvasTexture | null = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#2f9e5a';
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#fff';
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(34, 66);
    g.lineTo(55, 88);
    g.lineTo(94, 42);
    g.stroke();
    tex = new THREE.CanvasTexture(c);
    return tex;
  };
})();
export const Check3D: React.FC<{p: [number, number, number]; o: number; size?: number}> = ({p, o, size = 0.6}) =>
  o <= 0 ? null : (
    <sprite position={[p[0], p[2], -p[1]]} scale={[size * (0.6 + 0.4 * o), size * (0.6 + 0.4 * o), 1]}>
      <spriteMaterial map={checkTexture()} transparent opacity={o} depthTest={false} />
    </sprite>
  );

// pulsing yellow ring lying on a surface
export const Ring3D: React.FC<{p: [number, number, number]; o: number; f: number; r?: number; vertical?: boolean}> = ({p, o, f, r = 0.45, vertical}) =>
  o <= 0 ? null : (
    <mesh position={[p[0], p[2] + 0.02, -p[1]]} rotation={vertical ? [0, 0, 0] : [-Math.PI / 2, 0, 0]} scale={1 + Math.sin(f * 0.4) * 0.06}>
      <torusGeometry args={[r, 0.04, 8, 40]} />
      <meshBasicMaterial color="#ffd34d" transparent opacity={o} depthTest={false} />
    </mesh>
  );

// thin straight member between two plan points at given heights (strings, ropes, tape)
export const Line3D: React.FC<{a: [number, number, number]; b: [number, number, number]; w?: number; color: string; emissive?: boolean; opacity?: number}> = ({a, b, w = 0.015, color, emissive, opacity = 1}) => {
  const A = new THREE.Vector3(a[0], a[2], -a[1]);
  const B = new THREE.Vector3(b[0], b[2], -b[1]);
  const len = A.distanceTo(B);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), B.clone().sub(A).normalize()), [a[0], a[1], a[2], b[0], b[1], b[2]]);
  if (len < 0.001 || opacity <= 0) return null;
  return (
    <mesh position={mid} quaternion={q} castShadow={false}>
      <boxGeometry args={[len, w, w]} />
      {emissive ? <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} /> : <meshStandardMaterial color={color} roughness={0.7} transparent={opacity < 1} opacity={opacity} />}
    </mesh>
  );
};

// realistic worker (rigged human with helmet & vest); same props as the old block figure
export const Person3D: React.FC<{x: number; y: number; h?: number; yaw: number; act: Act3; f: number; suit?: string; vest?: string; helmet?: string; phase?: number; scale?: number; uzu?: boolean}> = ({suit, ...p}) => {
  const a = useAssets();
  if (!a) return null;
  return <Human a={a} {...p} suit={suit === '#2f4a78' || !suit ? '#34465e' : suit} />;
};
