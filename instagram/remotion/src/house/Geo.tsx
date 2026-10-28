import React, {useMemo} from 'react';
import * as THREE from 'three';
import {BUMP, SELF_COLOR, texM, TexKind} from './Tex';
import {useAssets} from './Real';

// plan (x east, y north, h up) -> three (X = x, Y = h, Z = -y)
export const V = (x: number, y: number, h: number) => new THREE.Vector3(x, h, -y);

// a wall-like prism from plan point a to b, thickness t (centred, shifted by `off` along the right normal),
// bottom/top heights may differ at each end (for the sloped roof line)
export const prismGeo = (ax: number, ay: number, bx: number, by: number, t: number, hb0: number, hb1: number, ht0: number, ht1: number, off = 0) => {
  const L = Math.hypot(bx - ax, by - ay) || 1;
  const ux = (bx - ax) / L;
  const uy = (by - ay) / L;
  const nx = uy; // right normal
  const ny = -ux;
  const o1 = off - t / 2;
  const o2 = off + t / 2;
  const p = [
    V(ax + nx * o1, ay + ny * o1, hb0),
    V(bx + nx * o1, by + ny * o1, hb1),
    V(bx + nx * o2, by + ny * o2, hb1),
    V(ax + nx * o2, ay + ny * o2, hb0),
    V(ax + nx * o1, ay + ny * o1, ht0),
    V(bx + nx * o1, by + ny * o1, ht1),
    V(bx + nx * o2, by + ny * o2, ht1),
    V(ax + nx * o2, ay + ny * o2, ht0),
  ];
  const faces = [
    [0, 1, 2, 3], // bottom
    [7, 6, 5, 4], // top
    [0, 4, 5, 1], // left side
    [2, 6, 7, 3], // right side
    [3, 7, 4, 0], // start cap
    [1, 5, 6, 2], // end cap
  ];
  const pos: number[] = [];
  const cen = p.reduce((m, q) => m.add(q), new THREE.Vector3()).multiplyScalar(1 / 8);
  for (const [a, b, c, d] of faces) {
    const fc = new THREE.Vector3().add(p[a]).add(p[b]).add(p[c]).add(p[d]).multiplyScalar(0.25);
    const nn = new THREE.Vector3().subVectors(p[c], p[b]).cross(new THREE.Vector3().subVectors(p[a], p[b]));
    const order = nn.dot(new THREE.Vector3().subVectors(fc, cen)) >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
    for (const i of order) pos.push(p[i].x, p[i].y, p[i].z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // UVs in metres: horizontal faces use plan x/z, vertical faces use (distance along the wall, height)
  const uvs: number[] = [];
  for (let i = 0; i < pos.length / 9; i++) {
    const A = new THREE.Vector3(pos[i * 9], pos[i * 9 + 1], pos[i * 9 + 2]);
    const B = new THREE.Vector3(pos[i * 9 + 3], pos[i * 9 + 4], pos[i * 9 + 5]);
    const Cc = new THREE.Vector3(pos[i * 9 + 6], pos[i * 9 + 7], pos[i * 9 + 8]);
    const nn = new THREE.Vector3().subVectors(Cc, B).cross(new THREE.Vector3().subVectors(A, B)).normalize();
    const tan = Math.abs(nn.y) > 0.7 ? null : new THREE.Vector3(-nn.z, 0, nn.x).normalize();
    for (const P of [A, B, Cc]) {
      if (tan) uvs.push(P.dot(tan), P.y);
      else uvs.push(P.x, P.z);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  // flat normals: recompute per triangle
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < pos.length / 9; i++) {
    const A = new THREE.Vector3(pos[i * 9], pos[i * 9 + 1], pos[i * 9 + 2]);
    const B = new THREE.Vector3(pos[i * 9 + 3], pos[i * 9 + 4], pos[i * 9 + 5]);
    const C = new THREE.Vector3(pos[i * 9 + 6], pos[i * 9 + 7], pos[i * 9 + 8]);
    const nn = new THREE.Vector3().subVectors(C, B).cross(new THREE.Vector3().subVectors(A, B)).normalize();
    for (let k = 0; k < 3; k++) n.setXYZ(i * 3 + k, nn.x, nn.y, nn.z);
  }
  return g;
};

export type Mat = {color: string; rough?: number; metal?: number; opacity?: number; emissive?: string; emissiveIntensity?: number; tex?: TexKind; uv?: 'top' | 'front' | 'side'};

export const Prism: React.FC<{a: [number, number]; b: [number, number]; t: number; hb: number | [number, number]; ht: number | [number, number]; off?: number; m: Mat; cast?: boolean; receive?: boolean}> = ({a, b, t, hb, ht, off = 0, m, cast = true, receive = true}) => {
  const [hb0, hb1] = typeof hb === 'number' ? [hb, hb] : hb;
  const [ht0, ht1] = typeof ht === 'number' ? [ht, ht] : ht;
  const geo = useMemo(() => prismGeo(a[0], a[1], b[0], b[1], t, hb0, hb1, ht0, ht1, off), [a[0], a[1], b[0], b[1], t, hb0, hb1, ht0, ht1, off]);
  const pkind: TexKind | undefined = m.tex ?? ((m.opacity !== undefined && m.opacity < 1) || m.emissive || (m.metal ?? 0) > 0.3 ? undefined : 'paint');
  const pmap = pkind ? texM(pkind) : null;
  return (
    <mesh geometry={geo} castShadow={cast} receiveShadow={receive}>
      <meshStandardMaterial map={pmap} bumpMap={pmap} bumpScale={pkind ? BUMP[pkind] ?? 0.5 : 0} color={m.color} roughness={m.rough ?? 0.85} metalness={m.metal ?? 0} transparent={m.opacity !== undefined && m.opacity < 1} opacity={m.opacity ?? 1} emissive={m.emissive ?? '#000000'} emissiveIntensity={m.emissiveIntensity ?? 0} />
    </mesh>
  );
};

// box geometry with UVs in metres on every face, so a texture keeps its real scale on all sides
const boxCache = new Map<string, THREE.BoxGeometry>();
export const metreBox = (sx: number, sh: number, sy: number) => {
  const key = `${sx.toFixed(4)}|${sh.toFixed(4)}|${sy.toFixed(4)}`;
  let g = boxCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(sx, sh, sy);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    // face order: +x, -x, +y, -y, +z, -z (4 vertices each)
    const dims: [number, number][] = [[sy, sh], [sy, sh], [sx, sy], [sx, sy], [sx, sh], [sx, sh]];
    for (let f = 0; f < 6; f++)
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
      }
    uv.needsUpdate = true;
    boxCache.set(key, g);
  }
  return g;
};

// colours used across the site models that should read as real materials
const AUTO: Record<string, TexKind> = {
  '#8a6a4a': 'soil',
  '#7a5c3e': 'soil',
  '#b5a68e': 'gravel',
  '#5b5f63': 'asphalt',
  '#c4c3bd': 'block',
  '#b9b8b2': 'conc',
  '#d9d8d2': 'conc',
  '#d9ad74': 'lumber',
  '#e6c793': 'lumber',
  '#d6a35f': 'lumber',
  '#9c7a52': 'lumber',
  '#e4e1da': 'plaster',
  '#d8dcdf': 'plaster',
  '#ebe6dc': 'plaster',
};

let lawn: THREE.Texture | null = null;
const lawnM = (t: THREE.Texture) => {
  if (!lawn) {
    lawn = t.clone();
    lawn.needsUpdate = true;
    lawn.repeat.set(1 / 4, 1 / 4);
  }
  return lawn;
};

// axis-aligned box in plan coords
export const PBox: React.FC<{x0: number; x1: number; y0: number; y1: number; h0: number; h1: number; m: Mat; cast?: boolean; receive?: boolean}> = ({x0, x1, y0, y1, h0, h1, m, cast = true, receive = true}) => {
  const sx = Math.max(1e-4, Math.abs(x1 - x0));
  const sy = Math.max(1e-4, Math.abs(y1 - y0));
  const sh = Math.max(1e-4, Math.abs(h1 - h0));
  const auto = m.tex ? undefined : AUTO[m.color.toLowerCase()];
  const plain = (m.opacity !== undefined && m.opacity < 1) || Boolean(m.emissive);
  const kind: TexKind | undefined = m.tex ?? auto ?? (plain ? undefined : 'paint');
  const assets = useAssets();
  const isLawn = m.color.toLowerCase() === '#9bb47a' && assets;
  const isWood = kind === 'oak' && assets;
  const map = isLawn ? lawnM(assets!.grass) : isWood ? assets!.wood : kind ? texM(kind) : null;
  const color = isLawn ? '#c8d8b0' : auto && SELF_COLOR[auto] ? '#ffffff' : m.color;
  return (
    <mesh geometry={metreBox(sx, sh, sy)} position={[(x0 + x1) / 2, (h0 + h1) / 2, -(y0 + y1) / 2]} castShadow={cast} receiveShadow={receive}>
      <meshStandardMaterial map={map} bumpMap={isWood ? assets!.woodBump : map} roughnessMap={isWood ? assets!.woodRough : null} bumpScale={isLawn ? 2 : isWood ? 1.2 : kind ? BUMP[kind] ?? 0.5 : 0} color={isWood ? '#f3e6d2' : color} roughness={m.rough ?? 0.85} metalness={m.metal ?? 0} transparent={m.opacity !== undefined && m.opacity < 1} opacity={m.opacity ?? 1} emissive={m.emissive ?? '#000000'} emissiveIntensity={m.emissiveIntensity ?? 0} />
    </mesh>
  );
};
