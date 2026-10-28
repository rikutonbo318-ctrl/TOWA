import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {D, FDN_LINES, FDN_TOP, W} from './House';
import {PBox} from './Geo';
import {lineLen, linesUpTo, SUTE_TOP} from './Fdn3D';

// べた基礎の配筋・型枠・アンカーボルト・コンクリート（#3〜#5で使う）
export type BarState = {
  base?: number; // 0..1 底盤の鉄筋（南→北に組む）
  spacer?: number; // 0..1 スペーサー（サイコロ）
  wall?: number; // 0..1 立ち上がりの鉄筋（FDN_LINESの順に）
  form?: number; // 0..1 外周の型枠
  anchor?: number; // 0..1 アンカーボルト
  slab?: number; // 0..1 底盤コンクリートの高さ
  innerForm?: number; // 0..1 立ち上がりの内型枠
  wallConc?: number; // 0..1 立ち上がりコンクリート
  cure?: number; // 0..1 養生シート
  strip?: number; // 0..1 型枠を外す（1で基礎だけ）
};

export const SLAB_TOP = SUTE_TOP + 0.15;
const BAR_H = SUTE_TOP + 0.07;
const STEP = 0.2;
const rebarMat = new THREE.MeshStandardMaterial({color: '#6e4630', roughness: 0.7, metalness: 0.5});
const ply = {color: '#c9a46a', tex: 'lumber' as const, rough: 0.8};
const conc = (wet: boolean) => ({color: wet ? '#8f8d88' : '#c9c7c1', tex: 'conc' as const, rough: wet ? 0.3 : 0.95});

type Bar = {a: THREE.Vector3; b: THREE.Vector3};
const V = (x: number, y: number, h: number) => new THREE.Vector3(x, h, -y);

// many thin bars as one instanced mesh; `n` bars from the front of the list are visible
const Bars: React.FC<{bars: Bar[]; n: number; r?: number}> = ({bars, n, r = 0.0065}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r, 1, 6), [r]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const up = new THREE.Vector3(0, 1, 0);
    const o = new THREE.Object3D();
    bars.forEach((bar, i) => {
      const dir = bar.b.clone().sub(bar.a);
      o.position.copy(bar.a.clone().add(bar.b).multiplyScalar(0.5));
      o.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      o.scale.set(1, dir.length(), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [bars]);
  const count = Math.max(0, Math.min(bars.length, Math.round(n)));
  if (count === 0) return null;
  return <instancedMesh ref={ref} args={[geo, rebarMat, bars.length]} count={count} castShadow />;
};

// bottom mat: bars every 200mm both ways inside the building outline, built south → north
const baseBars = (() => {
  const xs: Bar[] = [];
  const ys: Bar[] = [];
  for (let y = 0.1; y < D; y += STEP) xs.push({a: V(0.05, y, BAR_H), b: V(W - 0.05, y, BAR_H)});
  for (let x = 0.1; x < W; x += STEP) ys.push({a: V(x, 0.05, BAR_H + 0.013), b: V(x, D - 0.05, BAR_H + 0.013)});
  return {xs, ys};
})();

// wall bars: verticals every 200mm along every foundation line + top/bottom horizontals
const wallBars = (() => {
  const per: Bar[][] = FDN_LINES.map(([x0, y0, x1, y1]) => {
    const L = lineLen([x0, y0, x1, y1]);
    const out: Bar[] = [];
    for (let s = 0.1; s < L; s += STEP) {
      const t = s / L;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      out.push({a: V(x, y, BAR_H), b: V(x, y, FDN_TOP - 0.04)});
    }
    out.push({a: V(x0, y0, FDN_TOP - 0.06), b: V(x1, y1, FDN_TOP - 0.06)});
    out.push({a: V(x0, y0, SLAB_TOP + 0.02), b: V(x1, y1, SLAB_TOP + 0.02)});
    return out;
  });
  return per;
})();

// anchor bolts along the exterior lines, every 1.82m and near the corners
export const ANCHORS: [number, number][] = (() => {
  const out: [number, number][] = [];
  FDN_LINES.slice(0, 4).forEach(([x0, y0, x1, y1]) => {
    const L = lineLen([x0, y0, x1, y1]);
    const n = Math.max(2, Math.round(L / 1.82));
    for (let i = 0; i < n; i++) {
      const t = (0.25 + i) / n;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    }
  });
  return out;
})();

export const Rebar3D: React.FC<{s: BarState}> = ({s}) => {
  const base = s.base ?? 0;
  const strip = s.strip ?? 0;
  const formO = (s.form ?? 0) * (1 - strip);
  const inner = (s.innerForm ?? 0) * (1 - strip);
  const slab = s.slab ?? 0;
  const wc = s.wallConc ?? 0;
  const wl = linesUpTo(s.wall ?? 0);
  const allXs = baseBars.xs.length;
  const nx = Math.min(allXs, base * 2 * allXs);
  const ny = Math.max(0, (base * 2 - 1) * baseBars.ys.length);
  const t = 0.15; // wall thickness
  // outer form panels: one per exterior side, raised in order
  const sides = FDN_LINES.slice(0, 4);
  return (
    <group>
      {/* spacers under the mat */}
      {(s.spacer ?? 0) > 0
        ? Array.from({length: Math.round(40 * (s.spacer ?? 0))}).map((_, i) => {
            const x = 0.45 + (i % 8) * ((W - 0.9) / 7);
            const y = 0.45 + Math.floor(i / 8) * ((D - 0.9) / 4);
            return <PBox key={'sp' + i} x0={x - 0.03} x1={x + 0.03} y0={y - 0.03} y1={y + 0.03} h0={SUTE_TOP} h1={BAR_H - 0.006} m={{color: '#b9b6ae', tex: 'conc'}} />;
          })
        : null}
      {slab < 0.98 ? (
        <>
          <Bars bars={baseBars.xs} n={nx} />
          <Bars bars={baseBars.ys} n={ny} />
        </>
      ) : null}
      {wallBars.map((bars, i) => (wc < 0.98 || strip < 0.5 ? <Bars key={'wb' + i} bars={bars} n={wl[i] * bars.length} /> : null))}
      {/* base slab concrete rises over the mat */}
      {slab > 0 ? <PBox x0={-0.075} x1={W + 0.075} y0={-0.075} y1={D + 0.075} h0={SUTE_TOP} h1={SUTE_TOP + 0.01 + (SLAB_TOP - SUTE_TOP - 0.01) * slab} m={conc((s.cure ?? 0) < 0.5 && strip < 0.5)} /> : null}
      {/* wall concrete */}
      {wc > 0
        ? FDN_LINES.map(([x0, y0, x1, y1], i) => (
            <PBox key={'wc' + i} x0={Math.min(x0, x1) - t / 2} x1={Math.max(x0, x1) + t / 2} y0={Math.min(y0, y1) - t / 2} y1={Math.max(y0, y1) + t / 2} h0={SLAB_TOP - 0.01} h1={SLAB_TOP + (FDN_TOP - SLAB_TOP) * wc} m={conc(strip < 0.5 && (s.cure ?? 0) < 0.5)} />
          ))
        : null}
      {/* outer formwork */}
      {formO > 0
        ? sides.map(([x0, y0, x1, y1], i) => {
            const k = Math.max(0, Math.min(1, formO * 4 - i));
            if (k <= 0) return null;
            const horiz = y0 === y1;
            const off = (i === 0 || i === 3 ? -1 : 1) * (t / 2 + 0.01);
            const ox = horiz ? 0 : off;
            const oy = horiz ? off : 0;
            const ex = x0 + (x1 - x0) * k;
            const ey = y0 + (y1 - y0) * k;
            return <PBox key={'fo' + i} x0={Math.min(x0, ex) + ox - 0.006 - (horiz ? 0.08 : 0)} x1={Math.max(x0, ex) + ox + 0.006 + (horiz ? 0.08 : 0)} y0={Math.min(y0, ey) + oy - 0.006 - (horiz ? 0 : 0.08)} y1={Math.max(y0, ey) + oy + 0.006 + (horiz ? 0 : 0.08)} h0={SUTE_TOP} h1={FDN_TOP + 0.03} m={ply} />;
          })
        : null}
      {/* inner forms for the walls (both faces of interior lines, inner face of exterior lines) */}
      {inner > 0
        ? FDN_LINES.map(([x0, y0, x1, y1], i) => {
            const k = Math.max(0, Math.min(1, inner * FDN_LINES.length - i));
            if (k <= 0) return null;
            const horiz = y0 === y1;
            const ex = x0 + (x1 - x0) * k;
            const ey = y0 + (y1 - y0) * k;
            return [-1, 1].map((sg) => {
              const off = sg * (t / 2 + 0.01);
              return <PBox key={'fi' + i + sg} x0={Math.min(x0, ex) + (horiz ? 0 : off) - 0.006} x1={Math.max(x0, ex) + (horiz ? 0 : off) + 0.006} y0={Math.min(y0, ey) + (horiz ? off : 0) - 0.006} y1={Math.max(y0, ey) + (horiz ? off : 0) + 0.006} h0={SLAB_TOP} h1={FDN_TOP + 0.03} m={{...ply, color: '#d4b27a'}} />;
            });
          })
        : null}
      {/* anchor bolts (hang from a bar until the concrete is in) */}
      {(s.anchor ?? 0) > 0
        ? ANCHORS.map(([x, y], i) => {
            const k = Math.max(0, Math.min(1, (s.anchor ?? 0) * ANCHORS.length - i));
            if (k <= 0) return null;
            return (
              <group key={'ab' + i} position={[x, 0, -y]}>
                <mesh position={[0, FDN_TOP - 0.18 + 0.08 * (1 - k), 0]} castShadow>
                  <cylinderGeometry args={[0.008, 0.008, 0.46, 8]} />
                  <meshStandardMaterial color="#b9bcbf" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, FDN_TOP + 0.06, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.02, 6]} />
                  <meshStandardMaterial color="#d8dadc" metalness={0.8} roughness={0.3} />
                </mesh>
              </group>
            );
          })
        : null}
      {/* curing sheet */}
      {(s.cure ?? 0) > 0 && strip < 1 ? <PBox x0={-0.3} x1={(W + 0.6) * (s.cure ?? 0) - 0.3} y0={-0.3} y1={D + 0.3} h0={FDN_TOP + 0.04} h1={FDN_TOP + 0.05} m={{color: '#4f86c6', rough: 0.4, opacity: 0.92}} cast={false} /> : null}
    </group>
  );
};
