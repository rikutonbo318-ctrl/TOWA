import React from 'react';
import {D, FDN_LINES, FDN_TOP, FL1, FL2, KITCHEN, M, Opening, PLATE_N, PLATE_S, ROOMS, roofH, STAIR, W, Wall, WALLS} from './House';
import {PBox, Prism} from './Geo';
import {InteriorReal} from './InteriorReal';

export const MAT = {
  white: {color: '#f2f0eb', rough: 0.9, tex: 'plaster' as const},
  inner: {color: '#f6f4ef', rough: 0.95, tex: 'cloth' as const},
  galva: {color: '#565d64', rough: 0.55, metal: 0.1},
  galvaRoof: {color: '#3a3f44', rough: 0.5, metal: 0.15},
  conc: {color: '#b8b6b0', rough: 0.95},
  frame: {color: '#26292c', rough: 0.4, metal: 0.4},
  glass: {color: '#a9c9dd', rough: 0.05, metal: 0.1, opacity: 0.28},
  oak: {color: '#ffffff', rough: 0.5, tex: 'oak' as const},
  tatami: {color: '#ffffff', rough: 0.9, tex: 'tatami' as const},
  tile: {color: '#ffffff', rough: 0.7, tex: 'tile' as const},
  frp: {color: '#9aa2a8', rough: 0.6},
  wood: {color: '#b07f52', rough: 0.7},
  door: {color: '#f3f2ee', rough: 0.6},
  entry: {color: '#6b4c33', rough: 0.6},
  dark: {color: '#2d3034', rough: 0.6},
};

const EXT_T = 0.16;
const INT_T = 0.11;

const wallTop = (w: Wall, x: number, y: number) => (w.floor === 1 ? FL2 : w.ext || true ? roofH(y) : roofH(y));

// one wall with its openings; exterior walls get an outer skin in the facade material
const WallMesh: React.FC<{w: Wall; skin: {color: string; rough?: number; metal?: number}; showGlass: boolean}> = ({w, skin, showGlass}) => {
  const L = Math.hypot(w.x1 - w.x0, w.y1 - w.y0);
  const ux = (w.x1 - w.x0) / L;
  const uy = (w.y1 - w.y0) / L;
  const P = (s: number): [number, number] => [w.x0 + ux * s, w.y0 + uy * s];
  const base = w.floor === 1 ? FL1 - 0.15 : FL2 - 0.3;
  const fl = w.floor === 1 ? FL1 : FL2;
  const top = (s: number) => wallTop(w, ...P(s));
  const t = w.ext ? EXT_T : INT_T;
  const cuts = [...(w.open ?? [])].sort((a, b) => a.s - b.s);
  const solid: [number, number][] = [];
  let c = 0;
  for (const o of cuts) {
    solid.push([c, o.s]);
    c = o.e;
  }
  solid.push([c, L]);
  const piece = (s: number, e: number, hb: [number, number], ht: [number, number], key: string) => (
    <group key={key}>
      <Prism a={P(s)} b={P(e)} t={t} hb={hb} ht={ht} m={MAT.inner} />
      {w.ext ? <Prism a={P(s)} b={P(e)} t={0.03} off={t / 2 + 0.015 + (w.floor === 2 ? 0.006 : 0)} hb={w.floor === 2 ? [Math.max(hb[0], FL2 - 0.02), Math.max(hb[1], FL2 - 0.02)] : hb} ht={ht} m={skin} /> : null}
    </group>
  );
  return (
    <group>
      {solid.filter(([a, b]) => b - a > 0.005).map(([a, b], i) => piece(a, b, [base, base], [top(a), top(b)], 's' + i))}
      {w.ext && w.floor === 2
        ? Array.from({length: Math.floor(L / 0.2)}).map((_, i) => {
            const s0 = 0.1 + i * 0.2;
            if (cuts.some((o) => s0 > o.s - 0.02 && s0 < o.e + 0.02)) return null;
            return <Prism key={'rb' + i} a={P(s0)} b={P(s0 + 0.025)} t={0.02} off={t / 2 + 0.04} hb={FL2} ht={top(s0)} m={{color: '#4b5157', rough: 0.5, metal: 0.1}} cast={false} />;
          })
        : null}
      {cuts.map((o: Opening, i) => (
        <group key={'o' + i}>
          {o.h0 > 0 ? piece(o.s, o.e, [base, base], [fl + o.h0, fl + o.h0], 'b' + i) : null}
          {piece(o.s, o.e, [fl + o.h1, fl + o.h1], [top(o.s), top(o.e)], 't' + i)}
          {o.kind === 'window' || o.kind === 'high' || o.kind === 'sweep' ? (
            <group>
              {/* frame */}
              <Prism a={P(o.s)} b={P(o.e)} t={0.07} off={w.ext ? 0.03 : 0} hb={fl + o.h0} ht={fl + o.h0 + 0.05} m={MAT.frame} />
              <Prism a={P(o.s)} b={P(o.e)} t={0.07} off={w.ext ? 0.03 : 0} hb={fl + o.h1 - 0.05} ht={fl + o.h1} m={MAT.frame} />
              <Prism a={P(o.s)} b={P(o.s + 0.05)} t={0.07} off={w.ext ? 0.03 : 0} hb={fl + o.h0} ht={fl + o.h1} m={MAT.frame} />
              <Prism a={P(o.e - 0.05)} b={P(o.e)} t={0.07} off={w.ext ? 0.03 : 0} hb={fl + o.h0} ht={fl + o.h1} m={MAT.frame} />
              {o.e - o.s > 1.0 ? <Prism a={P((o.s + o.e) / 2 - 0.025)} b={P((o.s + o.e) / 2 + 0.025)} t={0.07} off={w.ext ? 0.03 : 0} hb={fl + o.h0} ht={fl + o.h1} m={MAT.frame} /> : null}
              {showGlass ? <Prism a={P(o.s + 0.05)} b={P(o.e - 0.05)} t={0.01} off={w.ext ? 0.03 : 0} hb={fl + o.h0 + 0.05} ht={fl + o.h1 - 0.05} m={MAT.glass} cast={false} receive={false} /> : null}
            </group>
          ) : o.kind === 'entry' ? (
            <Prism a={P(o.s)} b={P(o.e)} t={0.06} off={0.03} hb={fl} ht={fl + o.h1} m={MAT.entry} />
          ) : o.kind === 'door' ? (
            <group>
              <Prism a={P(o.s)} b={P(o.e)} t={0.04} hb={fl} ht={fl + o.h1} m={MAT.door} />
              <Prism a={P(o.e - 0.1)} b={P(o.e - 0.08)} t={0.09} hb={fl + 0.75} ht={fl + 1.35} m={MAT.dark} />
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
};

export type Show = {
  fdn?: boolean;
  floors?: boolean;
  walls?: boolean;
  roof?: boolean;
  interior?: boolean; // furniture & fixtures
  cutaway?: 'none' | '1F'; // hide 2F & roof for interior shots
};

export const House3D: React.FC<{show?: Show}> = ({show = {fdn: true, floors: true, walls: true, roof: true, interior: true, cutaway: 'none'}}) => {
  const up = show.cutaway !== '1F';
  return (
    <group>
      {/* foundation */}
      {show.fdn ? (
        <group>
          <PBox x0={-0.075} x1={W + 0.075} y0={-0.075} y1={D + 0.075} h0={-0.05} h1={0.15} m={MAT.conc} />
          {FDN_LINES.map(([x0, y0, x1, y1], i) => (
            <Prism key={'fd' + i} a={[x0, y0]} b={[x1, y1]} t={0.15} hb={0.1} ht={FDN_TOP} m={MAT.conc} />
          ))}
        </group>
      ) : null}
      {/* floors */}
      {show.floors ? (
        <group>
          {ROOMS.filter((r) => r.floor === 1 || up).map((r, i) => (
            <PBox key={'fl' + i} x0={r.x0} x1={r.x1} y0={r.y0} y1={r.y1} h0={(r.floor === 1 ? FL1 : FL2) - (r.finish === 'frp' ? 0.25 : 0.03) - (r.name === '玄関' ? 0.3 : 0)} h1={(r.floor === 1 ? FL1 : FL2) - (r.finish === 'frp' ? 0.22 : 0) - (r.name === '玄関' ? 0.3 : 0)} m={MAT[r.finish === 'frp' ? 'frp' : r.finish === 'tatami' ? 'tatami' : r.finish === 'tile' ? 'tile' : 'oak']} />
          ))}
          {up ? <PBox x0={0} x1={7 * M} y0={0} y1={D} h0={FL2 - 0.3} h1={FL2 - 0.04} m={MAT.inner} /> : null}
          {up ? <PBox x0={7 * M} x1={W} y0={3 * M} y1={D} h0={FL2 - 0.3} h1={FL2 - 0.04} m={MAT.inner} /> : null}
          {up ? <PBox x0={7 * M} x1={W} y0={0} y1={3 * M} h0={FL2 - 0.3} h1={FL2 - 0.26} m={MAT.inner} /> : null}
        </group>
      ) : null}
      {/* walls */}
      {show.walls
        ? WALLS.filter((w) => w.floor === 1 || up).map((w, i) => <WallMesh key={'w' + i} w={w} skin={w.floor === 1 ? MAT.white : MAT.galva} showGlass />)
        : null}
      {/* balcony parapet + glass rail */}
      {show.walls && up ? (
        <group>
          <Prism a={[7 * M, 0]} b={[W, 0]} t={0.16} hb={FL2 - 0.3} ht={FL2 + 0.75} m={MAT.white} />
          <Prism a={[W, 0]} b={[W, 3 * M]} t={0.16} hb={FL2 - 0.3} ht={FL2 + 0.75} m={MAT.white} />
          <Prism a={[7 * M, 0]} b={[W, 0]} t={0.02} hb={FL2 + 0.75} ht={FL2 + 1.1} m={MAT.glass} cast={false} />
          <Prism a={[W, 0]} b={[W, 3 * M]} t={0.02} hb={FL2 + 0.75} ht={FL2 + 1.1} m={MAT.glass} cast={false} />
          <Prism a={[7 * M, 0]} b={[W, 0]} t={0.05} hb={FL2 + 1.1} ht={FL2 + 1.14} m={MAT.frame} />
          <Prism a={[W, 0]} b={[W, 3 * M]} t={0.05} hb={FL2 + 1.1} ht={FL2 + 1.14} m={MAT.frame} />
          {/* corner post carrying the roof over the inner balcony */}
          <PBox x0={W - 0.12} x1={W} y0={0} y1={0.12} h0={FL2 + 0.75} h1={PLATE_S} m={MAT.galva} />
        </group>
      ) : null}
      {/* roof: shed, high on the south side */}
      {show.roof && up ? (
        <group>
          <Prism a={[W / 2, -0.6]} b={[W / 2, D + 0.45]} t={W + 0.9} hb={[roofH(-0.6), roofH(D + 0.45)]} ht={[roofH(-0.6) + 0.3, roofH(D + 0.45) + 0.3]} m={MAT.galvaRoof} />
          <Prism a={[W / 2, -0.6]} b={[W / 2, D + 0.45]} t={W + 0.92} hb={[roofH(-0.6) - 0.01, roofH(D + 0.45) - 0.01]} ht={[roofH(-0.6) + 0.02, roofH(D + 0.45) + 0.02]} m={{color: '#e9e5dd'}} />
          {/* downspout at the back of the east side */}
          <PBox x0={W + 0.18} x1={W + 0.26} y0={D - 0.35} y1={D - 0.27} h0={0.1} h1={roofH(D)} m={MAT.dark} />
        </group>
      ) : null}
      {/* entrance canopy + porch + louver */}
      {show.walls ? (
        <group>
          <PBox x0={W} x1={W + 1.1} y0={3.2 * M - 0.5} y1={4.2 * M + 0.5} h0={FL1 + 2.45} h1={FL1 + 2.55} m={MAT.dark} />
          <PBox x0={W} x1={W + 1.3} y0={3.2 * M - 0.6} y1={4.2 * M + 0.6} h0={0} h1={FL1 - 0.35} m={{color: '#8f8b84', rough: 0.8}} />
          {Array.from({length: 10}).map((_, i) => (
            <PBox key={'lv' + i} x0={W + 0.05} x1={W + 0.12} y0={4.2 * M + 0.25 + i * 0.12} y1={4.2 * M + 0.29 + i * 0.12} h0={FL1} h1={FL1 + 2.45} m={MAT.wood} />
          ))}
        </group>
      ) : null}
      {show.interior ? <InteriorReal /> : null}
    </group>
  );
};

