import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../Mokuzou';
import {D, FDN_TOP, FL1, FL2, KITCHEN, M, Opening, PLATE_N, PLATE_S, ROOMS, STAIR, W, Wall, WALLS} from './House';

const S = 105;
const INK = '#1d2328';

const Plan: React.FC<{floor: 1 | 2; ox: number; oy: number}> = ({floor, ox, oy}) => {
  const X = (x: number) => ox + x * S;
  const Y = (y: number) => oy + (D - y) * S;
  const walls = WALLS.filter((w) => w.floor === floor);
  const seg = (w: Wall) => {
    const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
    const ux = (w.x1 - w.x0) / L;
    const uy = (w.y1 - w.y0) / L;
    const cuts = [...(w.open ?? [])].sort((a, b) => a.s - b.s);
    const out: [number, number][] = [];
    let t = 0;
    for (const o of cuts) {
      out.push([t, o.s]);
      t = o.e;
    }
    out.push([t, L]);
    return {ux, uy, parts: out.filter(([a, b]) => b - a > 0.01), cuts};
  };
  const opening = (w: Wall, o: Opening, ux: number, uy: number, key: string) => {
    const ax = w.x0 + ux * o.s;
    const ay = w.y0 + uy * o.s;
    const bx = w.x0 + ux * o.e;
    const by = w.y0 + uy * o.e;
    const nx = -uy;
    const ny = ux; // left normal (plan coords)
    const t = (w.ext ? 0.075 : 0.05);
    if (o.kind === 'window' || o.kind === 'high' || o.kind === 'sweep') {
      return (
        <g key={key}>
          {[-t, 0, t].map((d, i) => (
            <line key={i} x1={X(ax + nx * d)} y1={Y(ay + ny * d)} x2={X(bx + nx * d)} y2={Y(by + ny * d)} stroke={i === 1 ? '#3b87c4' : INK} strokeWidth={i === 1 ? 3 : 1.5} />
          ))}
          {o.kind === 'sweep' ? <line x1={X(ax)} y1={Y(ay)} x2={X(bx)} y2={Y(by)} stroke="#3b87c4" strokeWidth={6} opacity={0.4} /> : null}
        </g>
      );
    }
    if (o.kind === 'slide') {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      return (
        <g key={key}>
          <line x1={X(ax + nx * 0.03)} y1={Y(ay + ny * 0.03)} x2={X(mx + ux * 0.1 + nx * 0.03)} y2={Y(my + uy * 0.1 + ny * 0.03)} stroke={INK} strokeWidth={3} />
          <line x1={X(mx - ux * 0.1 - nx * 0.03)} y1={Y(my - uy * 0.1 - ny * 0.03)} x2={X(bx - nx * 0.03)} y2={Y(by - ny * 0.03)} stroke={INK} strokeWidth={3} />
        </g>
      );
    }
    if (o.kind === 'door' || o.kind === 'entry') {
      const r = o.e - o.s;
      const sgn = o.kind === 'entry' ? -1 : 1;
      const tx = ax + nx * r * sgn;
      const ty = ay + ny * r * sgn;
      const sweepFlag = (ux * ny * sgn - uy * nx * sgn) > 0 ? 0 : 1;
      return (
        <g key={key}>
          <line x1={X(ax)} y1={Y(ay)} x2={X(tx)} y2={Y(ty)} stroke={INK} strokeWidth={2.5} />
          <path d={`M ${X(tx)} ${Y(ty)} A ${r * S} ${r * S} 0 0 ${sweepFlag} ${X(bx)} ${Y(by)}`} stroke={INK} strokeWidth={1} fill="none" strokeDasharray="4 3" />
        </g>
      );
    }
    return null;
  };
  return (
    <g>
      {/* grid */}
      {Array.from({length: 11}).map((_, i) => (
        <g key={'gx' + i}>
          <line x1={X(i * M)} y1={Y(D) - 40} x2={X(i * M)} y2={Y(0) + 40} stroke="#c9d3da" strokeWidth={1} strokeDasharray="10 4 2 4" />
          {i % 2 === 0 ? <circle cx={X(i * M)} cy={Y(D) - 52} r={12} fill="none" stroke="#8a96a0" /> : null}
          {i % 2 === 0 ? (
            <text x={X(i * M)} y={Y(D) - 47} fontSize={13} textAnchor="middle" fill="#55616b" fontFamily={FONT}>
              X{i}
            </text>
          ) : null}
        </g>
      ))}
      {Array.from({length: 8}).map((_, i) => (
        <g key={'gy' + i}>
          <line x1={X(0) - 40} y1={Y(i * M)} x2={X(W) + 40} y2={Y(i * M)} stroke="#c9d3da" strokeWidth={1} strokeDasharray="10 4 2 4" />
          {i % 2 === 1 || i === 0 ? null : null}
          <circle cx={X(0) - 52} cy={Y(i * M)} r={12} fill="none" stroke="#8a96a0" />
          <text x={X(0) - 52} y={Y(i * M) + 5} fontSize={13} textAnchor="middle" fill="#55616b" fontFamily={FONT}>
            Y{i}
          </text>
        </g>
      ))}
      {/* room floors */}
      {ROOMS.filter((r) => r.floor === floor).map((r, i) => (
        <rect key={'rf' + i} x={X(r.x0)} y={Y(r.y1)} width={(r.x1 - r.x0) * S} height={(r.y1 - r.y0) * S} fill={r.finish === 'frp' ? '#e3e6e8' : r.finish === 'tile' ? '#ece9e3' : r.finish === 'tatami' ? '#eef0dc' : '#fbf6ee'} />
      ))}
      {floor === 1 ? (
        <rect x={X(8 * M)} y={Y(3 * M) + 0} width={0} height={0} />
      ) : null}
      {/* tatami pattern */}
      {floor === 1
        ? [[7, 0, 9, 1], [9, 0, 10, 2], [7, 1, 8, 3], [8, 1, 9, 2], [8, 2, 10, 3]].map(([a, b, c, d], i) => (
            <rect key={'tt' + i} x={X(a * M)} y={Y(d * M)} width={(c - a) * M * S} height={(d - b) * M * S} fill="none" stroke="#b9bf8f" strokeWidth={1.5} />
          ))
        : null}
      {/* balcony hatch */}
      {floor === 2
        ? Array.from({length: 14}).map((_, i) => (
            <line key={'bh' + i} x1={X(7 * M + i * 0.2)} y1={Y(0)} x2={X(7 * M)} y2={Y(i * 0.2)} stroke="#c3c8cc" strokeWidth={1} />
          ))
        : null}
      {floor === 2 ? <polyline points={`${X(7 * M)},${Y(0) - 6} ${X(W) - 6},${Y(0) - 6} ${X(W) - 6},${Y(3 * M)}`} fill="none" stroke={INK} strokeWidth={6} /> : null}
      {/* fixtures */}
      {floor === 1 ? (
        <g stroke={INK} strokeWidth={1.5} fill="#fff">
          <rect x={X(KITCHEN.island.x0)} y={Y(KITCHEN.island.y1)} width={(KITCHEN.island.x1 - KITCHEN.island.x0) * S} height={(KITCHEN.island.y1 - KITCHEN.island.y0) * S} />
          <rect x={X(1.0)} y={Y(3.5)} width={0.6 * S} height={0.4 * S} rx={6} />
          <rect x={X(KITCHEN.back.x0)} y={Y(KITCHEN.back.y1)} width={(KITCHEN.back.x1 - KITCHEN.back.x0) * S} height={(KITCHEN.back.y1 - KITCHEN.back.y0) * S} />
          <rect x={X(2.4)} y={Y(3.55)} width={0.6 * S} height={0.5 * S} fill="none" />
          {/* dining table + sofa */}
          <rect x={X(1.2)} y={Y(2.4)} width={1.6 * S} height={0.85 * S} rx={4} fill="#f3ece0" />
          <rect x={X(3.9)} y={Y(1.3)} width={2.2 * S} height={0.85 * S} rx={10} fill="#e6e8ea" />
          {/* bath */}
          <rect x={X(2 * M + 0.15)} y={Y(D - 0.1)} width={0.8 * S} height={1.4 * S} rx={16} />
          {/* toilet */}
          <ellipse cx={X(4.5 * M)} cy={Y(D - 0.45)} rx={0.2 * S} ry={0.3 * S} />
          {/* washbasin */}
          <rect x={X(0.1)} y={Y(D - 0.1)} width={1.0 * S} height={0.55 * S} />
          <ellipse cx={X(0.6)} cy={Y(D - 0.38)} rx={0.25 * S} ry={0.16 * S} />
          {/* entrance step */}
          <line x1={X(8 * M)} y1={Y(4.4)} x2={X(W)} y2={Y(4.4)} strokeDasharray="6 4" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth={1.5} fill="#fff">
          <rect x={X(0.4)} y={Y(2.9)} width={1.6 * S} height={2.0 * S} rx={6} fill="#f3ece0" />
          <rect x={X(4.2)} y={Y(3.4)} width={1.0 * S} height={2.0 * S} rx={6} fill="#f3ece0" />
          <rect x={X(7 * M + 0.4)} y={Y(D - 0.3)} width={1.0 * S} height={2.0 * S} rx={6} fill="#f3ece0" />
          <ellipse cx={X(2.5 * M)} cy={Y(D - 0.45)} rx={0.2 * S} ry={0.3 * S} />
        </g>
      )}
      {/* stairs (U-turn) */}
      <g stroke={INK} strokeWidth={1.2}>
        {Array.from({length: 7}).map((_, i) => (
          <line key={'st' + i} x1={X(STAIR.x0)} y1={Y(STAIR.y0 + 0.2 + i * 0.13)} x2={X(STAIR.x0 + M)} y2={Y(STAIR.y0 + 0.2 + i * 0.13)} />
        ))}
        {Array.from({length: 7}).map((_, i) => (
          <line key={'st2' + i} x1={X(STAIR.x0 + M)} y1={Y(STAIR.y0 + 0.2 + i * 0.13)} x2={X(STAIR.x1)} y2={Y(STAIR.y0 + 0.2 + i * 0.13)} />
        ))}
        <line x1={X(STAIR.x0 + M)} y1={Y(STAIR.y0)} x2={X(STAIR.x0 + M)} y2={Y(STAIR.y1 - 0.9)} strokeWidth={3} />
        <path d={`M ${X(STAIR.x0 + 0.45)} ${Y(STAIR.y0 + 0.1)} L ${X(STAIR.x0 + 0.45)} ${Y(STAIR.y1 - 0.45)} L ${X(STAIR.x1 - 0.45)} ${Y(STAIR.y1 - 0.45)} L ${X(STAIR.x1 - 0.45)} ${Y(STAIR.y0 + 0.3)}`} fill="none" stroke="#c8102e" strokeWidth={1.5} />
      </g>
      {/* walls */}
      {walls.map((w, i) => {
        const {ux, uy, parts, cuts} = seg(w);
        return (
          <g key={'w' + i}>
            {parts.map(([a, b], k) => (
              <line key={k} x1={X(w.x0 + ux * a)} y1={Y(w.y0 + uy * a)} x2={X(w.x0 + ux * b)} y2={Y(w.y0 + uy * b)} stroke={INK} strokeWidth={w.ext ? 0.15 * S : 0.1 * S} strokeLinecap="square" />
            ))}
            {cuts.map((o, k) => opening(w, o, ux, uy, 'o' + k))}
          </g>
        );
      })}
      {/* room names */}
      {ROOMS.filter((r) => r.floor === floor).map((r, i) => (
        <text key={'rn' + i} x={X((r.x0 + r.x1) / 2) + (r.name === 'LDK' ? 60 : 0)} y={Y((r.y0 + r.y1) / 2) + (r.name === 'LDK' ? 40 : 6)} fontSize={r.name === 'LDK' ? 30 : 19} textAnchor="middle" fontFamily={FONT} fontWeight={700} fill="#33404a">
          {r.name}
        </text>
      ))}
      <text x={X(0)} y={Y(0) + 80} fontSize={30} fontFamily={FONT} fontWeight={900} fill={INK}>
        {floor}階平面図
      </text>
      {/* north arrow */}
      <g transform={`translate(${X(W) + 10},${Y(0) + 70})`}>
        <circle r={22} fill="none" stroke={INK} />
        <path d="M 0 -20 L 8 8 L 0 2 L -8 8 Z" fill={INK} />
        <text y={-28} fontSize={16} textAnchor="middle" fontFamily={FONT}>
          N
        </text>
      </g>
    </g>
  );
};

const SE = 80;
const Elev: React.FC<{side: 'S' | 'E'; ox: number; oy: number}> = ({side, ox, oy}) => {
  const X = (u: number) => ox + u * SE;
  const H = (h: number) => oy - h * SE;
  const len = side === 'S' ? W : D;
  const roofAt = (y: number) => PLATE_S + (PLATE_N - PLATE_S) * (y / D);
  const DARK = '#2f3438';
  const WHITE = '#f4f2ee';
  const glass = '#9cc0d6';
  return (
    <g>
      <line x1={X(-1)} y1={H(0)} x2={X(len + 1)} y2={H(0)} stroke={INK} strokeWidth={3} />
      <rect x={X(0)} y={H(FDN_TOP)} width={len * SE} height={FDN_TOP * SE} fill="#b9b8b2" />
      {side === 'S' ? (
        <g>
          <rect x={X(0)} y={H(FL2)} width={W * SE} height={(FL2 - FDN_TOP) * SE} fill={WHITE} stroke={INK} />
          {/* 2F box (dark galvalume) and the recessed balcony wall */}
          <rect x={X(7 * M)} y={H(PLATE_S)} width={3 * M * SE} height={(PLATE_S - FL2) * SE} fill="#4a5056" stroke={INK} />
          <rect x={X(0)} y={H(PLATE_S)} width={7 * M * SE} height={(PLATE_S - FL2) * SE} fill={DARK} stroke={INK} />
          {Array.from({length: 46}).map((_, i) => (
            <line key={'gv' + i} x1={X(i * 0.14)} y1={H(PLATE_S)} x2={X(i * 0.14)} y2={H(FL2)} stroke="#3b4146" strokeWidth={1} />
          ))}
          {/* balcony: door behind, solid parapet + glass rail in front */}
          <rect x={X(7 * M + 0.45)} y={H(FL2 + 2.2)} width={1.82 * SE} height={1.4 * SE} fill="#9cc0d6" stroke={INK} strokeWidth={3} />
          <rect x={X(7 * M)} y={H(FL2 + 0.8)} width={3 * M * SE} height={1.05 * SE} fill="#e9e6df" stroke={INK} />
          <rect x={X(7 * M)} y={H(FL2 + 1.1)} width={3 * M * SE} height={0.3 * SE} fill="rgba(156,192,214,0.45)" stroke={INK} />
          {/* roof edge (shed, high on this side) */}
          <rect x={X(-0.45)} y={H(PLATE_S + 0.32)} width={(W + 0.9) * SE} height={0.3 * SE} fill="#24282c" />
        </g>
      ) : (
        <g>
          <polygon points={`${X(0)},${H(FDN_TOP)} ${X(D)},${H(FDN_TOP)} ${X(D)},${H(roofAt(D))} ${X(3 * M)},${H(roofAt(3 * M))} ${X(3 * M)},${H(FL2)} ${X(0)},${H(FL2)}`} fill={WHITE} stroke={INK} />
          <polygon points={`${X(3 * M)},${H(FL2)} ${X(D)},${H(FL2)} ${X(D)},${H(roofAt(D))} ${X(3 * M)},${H(roofAt(3 * M))}`} fill={DARK} stroke={INK} />
          <polygon points={`${X(0)},${H(FL2)} ${X(3 * M)},${H(FL2)} ${X(3 * M)},${H(roofAt(3 * M))} ${X(0)},${H(PLATE_S)}`} fill="rgba(80,86,92,0.25)" stroke={INK} strokeDasharray="6 4" />
          <rect x={X(0)} y={H(FL2 + 1.1)} width={3 * M * SE} height={1.1 * SE} fill="rgba(156,192,214,0.35)" stroke={INK} />
          <polygon points={`${X(-0.6)},${H(PLATE_S + 0.3)} ${X(D + 0.4)},${H(roofAt(D + 0.4) + 0.3)} ${X(D + 0.4)},${H(roofAt(D + 0.4))} ${X(-0.6)},${H(PLATE_S)}`} fill="#24282c" />
          {/* entrance canopy + door */}
          <rect x={X(3.2 * M - 0.4)} y={H(FL1 + 2.55)} width={(1 * M + 0.8) * SE} height={0.12 * SE} fill="#24282c" />
        </g>
      )}
      {/* openings from the plan data */}
      {WALLS.filter((w) => w.ext && (side === 'S' ? w.y0 === 0 && w.y1 === 0 : w.x0 === W && w.x1 === W)).map((w, i) => {
        const base = w.floor === 1 ? FL1 : FL2;
        return (w.open ?? []).map((o, k) => {
          const u0 = side === 'S' ? w.x0 + o.s : o.s + w.y0;
          return (
            <g key={'eo' + i + k}>
              <rect x={X(u0)} y={H(base + o.h1)} width={(o.e - o.s) * SE} height={(o.h1 - o.h0) * SE} fill={o.kind === 'entry' ? '#6b4c33' : glass} stroke="#1d2328" strokeWidth={3} />
              {o.kind !== 'entry' && o.e - o.s > 1.2 ? <line x1={X(u0 + (o.e - o.s) / 2)} y1={H(base + o.h1)} x2={X(u0 + (o.e - o.s) / 2)} y2={H(base + o.h0)} stroke="#1d2328" strokeWidth={2} /> : null}
            </g>
          );
        });
      })}
      {side === 'S'
        ? null
        : null}
      <text x={X(0)} y={H(0) + 50} fontSize={28} fontFamily={FONT} fontWeight={900} fill={INK}>
        {side === 'S' ? '南立面図' : '東立面図'}
      </text>
    </g>
  );
};

export const Zumen: React.FC = () => (
  <AbsoluteFill style={{background: '#fdfdfb'}}>
    <svg width={2400} height={2000}>
      <rect x={30} y={30} width={2340} height={1940} fill="none" stroke={INK} strokeWidth={3} />
      <Plan floor={1} ox={170} oy={200} />
      <Plan floor={2} ox={1330} oy={200} />
      <Elev side="S" ox={170} oy={1720} />
      <Elev side="E" ox={1450} oy={1720} />
      {/* title block */}
      <g fontFamily={FONT}>
        <rect x={1900} y={1780} width={440} height={160} fill="#fff" stroke={INK} strokeWidth={2} />
        <text x={1920} y={1822} fontSize={26} fontWeight={900} fill={INK}>
          リール用モデルハウス（架空）
        </text>
        <text x={1920} y={1860} fontSize={19} fill={INK}>
          木造在来軸組・2階建て・片流れ屋根
        </text>
        <text x={1920} y={1892} fontSize={19} fill={INK}>
          910モジュール／べた基礎／インナーバルコニー
        </text>
        <text x={1920} y={1924} fontSize={16} fill="#c8102e">
          AI・CGの架空の計画です（実在の物件ではありません）
        </text>
      </g>
    </svg>
  </AbsoluteFill>
);
