import * as THREE from 'three';

// procedural textures (canvas) for interior finishes. each covers `span` metres (u, v)
export type TexKind = 'oak' | 'slat' | 'stone' | 'quartz' | 'tatami' | 'tile' | 'walnut' | 'cloth' | 'grain' | 'gravel' | 'conc' | 'soil' | 'asphalt' | 'block' | 'lumber' | 'paint' | 'plaster';
export const TEX_SPAN: Record<TexKind, [number, number]> = {
  oak: [1.8, 0.6],
  slat: [0.6, 1.0],
  stone: [0.6, 0.6],
  quartz: [1.2, 0.6],
  tatami: [1.82, 1.82],
  tile: [0.6, 0.6],
  walnut: [0.6, 0.6],
  cloth: [0.5, 0.5],
  grain: [0.6, 1.2],
  gravel: [0.8, 0.8],
  conc: [1.2, 1.2],
  soil: [1.0, 1.0],
  asphalt: [1.5, 1.5],
  block: [0.8, 0.8],
  lumber: [0.3, 1.2],
  paint: [1.0, 1.0],
  plaster: [1.2, 1.2],
};
// textures that carry their own colour (material colour is set to white)
export const SELF_COLOR: Partial<Record<TexKind, boolean>> = {soil: true, asphalt: true, block: true, lumber: true};
// bump strength per kind (surface relief)
export const BUMP: Partial<Record<TexKind, number>> = {soil: 3, asphalt: 1.5, block: 2, lumber: 0.6, gravel: 3, conc: 0.8, plaster: 1.2, paint: 0.4, stone: 1.5, tile: 0.8, oak: 0.3, tatami: 0.8, slat: 0.6};

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const cache: Partial<Record<TexKind, THREE.CanvasTexture>> = {};

const draw: Record<TexKind, (g: CanvasRenderingContext2D, S: number) => void> = {
  oak: (g, S) => {
    seed = 11;
    const rows = 4;
    const h = S / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * S * 0.6;
      while (x < S) {
        const len = S * (0.45 + rnd() * 0.4);
        const tone = 0.9 + rnd() * 0.2;
        g.fillStyle = `rgb(${Math.round(205 * tone)},${Math.round(166 * tone)},${Math.round(118 * tone)})`;
        g.fillRect(x, r * h, len, h);
        for (let k = 0; k < 9; k++) {
          g.strokeStyle = `rgba(120,80,40,${0.08 + rnd() * 0.12})`;
          g.lineWidth = 1 + rnd() * 1.5;
          g.beginPath();
          const y = r * h + rnd() * h;
          g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + (rnd() - 0.5) * 8, x + len * 0.6, y + (rnd() - 0.5) * 8, x + len, y + (rnd() - 0.5) * 6);
          g.stroke();
        }
        g.fillStyle = 'rgba(70,45,20,0.45)';
        g.fillRect(x, r * h, 2, h);
        x += len;
      }
      g.fillStyle = 'rgba(70,45,20,0.4)';
      g.fillRect(0, r * h, S, 2);
    }
  },
  slat: (g, S) => {
    seed = 23;
    const n = 6;
    const w = S / n;
    for (let i = 0; i < n; i++) {
      const tone = 0.9 + rnd() * 0.18;
      g.fillStyle = `rgb(${Math.round(196 * tone)},${Math.round(150 * tone)},${Math.round(98 * tone)})`;
      g.fillRect(i * w, 0, w - 6, S);
      for (let k = 0; k < 6; k++) {
        g.strokeStyle = `rgba(110,70,30,${0.1 + rnd() * 0.1})`;
        g.beginPath();
        const x = i * w + rnd() * (w - 6);
        g.moveTo(x, 0);
        g.lineTo(x + (rnd() - 0.5) * 6, S);
        g.stroke();
      }
      g.fillStyle = '#3b2c1e';
      g.fillRect(i * w + w - 6, 0, 6, S);
    }
  },
  stone: (g, S) => {
    seed = 31;
    g.fillStyle = '#b9b5ad';
    g.fillRect(0, 0, S, S);
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? S / 4 : 0;
      for (let c = -1; c < 2; c++) {
        const tone = 0.88 + rnd() * 0.2;
        g.fillStyle = `rgb(${Math.round(190 * tone)},${Math.round(186 * tone)},${Math.round(178 * tone)})`;
        g.fillRect(c * (S / 2) + off + 3, r * (S / rows) + 3, S / 2 - 6, S / rows - 6);
        for (let k = 0; k < 40; k++) {
          g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '60,60,60'},${0.06 + rnd() * 0.08})`;
          g.fillRect(c * (S / 2) + off + rnd() * (S / 2), r * (S / rows) + rnd() * (S / rows), 2 + rnd() * 10, 1 + rnd() * 3);
        }
      }
    }
  },
  quartz: (g, S) => {
    seed = 41;
    g.fillStyle = '#d9d8d4';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(140,140,140,${0.15 + rnd() * 0.2})`;
      g.lineWidth = 0.5 + rnd() * 2;
      g.beginPath();
      let x = rnd() * S;
      let y = 0;
      g.moveTo(x, y);
      while (y < S) {
        x += (rnd() - 0.5) * 40;
        y += 20 + rnd() * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  },
  tatami: (g, S) => {
    seed = 51;
    // 4 borderless mats in a checker of weave directions
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const x0 = (i * S) / 2;
        const y0 = (j * S) / 2;
        g.fillStyle = (i + j) % 2 ? '#a9ab8f' : '#b3b59a';
        g.fillRect(x0 + 2, y0 + 2, S / 2 - 4, S / 2 - 4);
        g.strokeStyle = 'rgba(80,85,60,0.25)';
        for (let k = 0; k < 40; k++) {
          g.beginPath();
          if ((i + j) % 2) {
            g.moveTo(x0 + (k * S) / 80, y0);
            g.lineTo(x0 + (k * S) / 80, y0 + S / 2);
          } else {
            g.moveTo(x0, y0 + (k * S) / 80);
            g.lineTo(x0 + S / 2, y0 + (k * S) / 80);
          }
          g.stroke();
        }
      }
  },
  tile: (g, S) => {
    seed = 61;
    g.fillStyle = '#6f6c66';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const tone = 0.92 + rnd() * 0.12;
        g.fillStyle = `rgb(${Math.round(150 * tone)},${Math.round(147 * tone)},${Math.round(140 * tone)})`;
        g.fillRect((i * S) / 2 + 3, (j * S) / 2 + 3, S / 2 - 6, S / 2 - 6);
        for (let k = 0; k < 60; k++) {
          g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '40,40,40'},${0.05 + rnd() * 0.06})`;
          g.fillRect((i * S) / 2 + rnd() * (S / 2), (j * S) / 2 + rnd() * (S / 2), 2 + rnd() * 6, 2 + rnd() * 6);
        }
      }
  },
  walnut: (g, S) => {
    seed = 71;
    g.fillStyle = '#6b4a33';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = `rgba(40,25,15,${0.12 + rnd() * 0.15})`;
      g.lineWidth = 1 + rnd() * 2;
      g.beginPath();
      const y = rnd() * S;
      g.moveTo(0, y);
      g.bezierCurveTo(S * 0.3, y + (rnd() - 0.5) * 20, S * 0.7, y + (rnd() - 0.5) * 20, S, y + (rnd() - 0.5) * 10);
      g.stroke();
    }
  },
  grain: (g, S) => {
    seed = 91;
    g.fillStyle = '#cfae84';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 70; k++) {
      g.strokeStyle = `rgba(130,90,50,${0.06 + rnd() * 0.12})`;
      g.lineWidth = 0.8 + rnd() * 2;
      g.beginPath();
      const x = rnd() * S;
      g.moveTo(x, 0);
      g.bezierCurveTo(x + (rnd() - 0.5) * 18, S * 0.33, x + (rnd() - 0.5) * 18, S * 0.66, x + (rnd() - 0.5) * 10, S);
      g.stroke();
    }
  },
  gravel: (g, S) => {
    seed = 101;
    g.fillStyle = '#9d988f';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 2600; k++) {
      const v = Math.round(110 + rnd() * 110);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      const r = 2 + rnd() * 6;
      g.beginPath();
      g.ellipse(rnd() * S, rnd() * S, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
  },
  conc: (g, S) => {
    seed = 111;
    g.fillStyle = '#b9b7b1';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 4000; k++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '90,90,90'},${0.04 + rnd() * 0.06})`;
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1 + rnd() * 3);
    }
  },
  soil: (g, S) => {
    seed = 121;
    g.fillStyle = '#7d5f43';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 900; k++) {
      const r = 6 + rnd() * 40;
      const v = rnd();
      g.fillStyle = `rgba(${v > 0.5 ? '150,118,86' : '86,64,44'},${0.05 + rnd() * 0.1})`;
      g.beginPath();
      g.ellipse(rnd() * S, rnd() * S, r, r * (0.4 + rnd() * 0.6), rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let k = 0; k < 2500; k++) {
      const v = Math.round(90 + rnd() * 90);
      g.fillStyle = `rgba(${v},${Math.round(v * 0.82)},${Math.round(v * 0.62)},0.8)`;
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1 + rnd() * 3);
    }
  },
  asphalt: (g, S) => {
    seed = 131;
    g.fillStyle = '#4f5256';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 9000; k++) {
      const v = Math.round(50 + rnd() * 90);
      g.fillStyle = `rgba(${v},${v},${v + 3},0.7)`;
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
    }
    for (let k = 0; k < 30; k++) {
      g.fillStyle = `rgba(30,30,32,${0.04 + rnd() * 0.06})`;
      g.beginPath();
      g.ellipse(rnd() * S, rnd() * S, 20 + rnd() * 80, 10 + rnd() * 40, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
  },
  block: (g, S) => {
    // concrete block wall: 390 x 190 units with mortar joints (2 x 4 per 0.8 m tile)
    seed = 141;
    g.fillStyle = '#9d9c97';
    g.fillRect(0, 0, S, S);
    const rows = 4;
    const h = S / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? S / 4 : 0;
      for (let c = -1; c < 2; c++) {
        const tone = 0.9 + rnd() * 0.12;
        const x = c * (S / 2) + off;
        g.fillStyle = `rgb(${Math.round(186 * tone)},${Math.round(184 * tone)},${Math.round(178 * tone)})`;
        g.fillRect(x + 3, r * h + 3, S / 2 - 6, h - 6);
        for (let k = 0; k < 160; k++) {
          g.fillStyle = `rgba(${rnd() > 0.5 ? '230,230,225' : '90,90,88'},${0.08 + rnd() * 0.1})`;
          g.fillRect(x + 3 + rnd() * (S / 2 - 6), r * h + 3 + rnd() * (h - 6), 1 + rnd() * 3, 1 + rnd() * 3);
        }
      }
    }
    // rain streaks
    for (let k = 0; k < 12; k++) {
      g.fillStyle = `rgba(70,70,65,${0.03 + rnd() * 0.04})`;
      g.fillRect(rnd() * S, 0, 4 + rnd() * 10, S * (0.3 + rnd() * 0.7));
    }
  },
  lumber: (g, S) => {
    seed = 151;
    g.fillStyle = '#d7b88a';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 60; k++) {
      g.strokeStyle = `rgba(150,105,60,${0.08 + rnd() * 0.16})`;
      g.lineWidth = 0.6 + rnd() * 2.2;
      g.beginPath();
      const x = rnd() * S;
      g.moveTo(x, 0);
      g.bezierCurveTo(x + (rnd() - 0.5) * 14, S * 0.33, x + (rnd() - 0.5) * 14, S * 0.66, x + (rnd() - 0.5) * 8, S);
      g.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const x = rnd() * S;
      const y = rnd() * S;
      g.fillStyle = 'rgba(120,75,35,0.55)';
      g.beginPath();
      g.ellipse(x, y, 5 + rnd() * 6, 9 + rnd() * 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  },
  paint: (g, S) => {
    // near-white micro variation so flat painted parts don't look like CG plastic
    seed = 161;
    g.fillStyle = '#f2f2f2';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 40; k++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '200,200,200'},${0.05 + rnd() * 0.08})`;
      g.beginPath();
      g.ellipse(rnd() * S, rnd() * S, 30 + rnd() * 120, 20 + rnd() * 80, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let k = 0; k < 6000; k++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '170,170,170'},${0.05 + rnd() * 0.08})`;
      g.fillRect(rnd() * S, rnd() * S, 1.5, 1.5);
    }
  },
  plaster: (g, S) => {
    seed = 171;
    g.fillStyle = '#ededea';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 9000; k++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '150,148,140'},${0.08 + rnd() * 0.12})`;
      const r = 0.8 + rnd() * 2.2;
      g.beginPath();
      g.arc(rnd() * S, rnd() * S, r, 0, Math.PI * 2);
      g.fill();
    }
  },
  cloth: (g, S) => {
    seed = 81;
    g.fillStyle = '#f4f2ee';
    g.fillRect(0, 0, S, S);
    for (let k = 0; k < 2500; k++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '180,175,165'},${0.12 + rnd() * 0.12})`;
      g.fillRect(rnd() * S, rnd() * S, 2, 2);
    }
  },
};

export const getTex = (kind: TexKind) => {
  if (!cache[kind]) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    draw[kind](c.getContext('2d')!, 512);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    cache[kind] = t;
  }
  return cache[kind]!;
};

// a texture instance repeated to cover (u, v) metres
export const texFor = (kind: TexKind, u: number, v: number) => {
  const t = getTex(kind).clone();
  t.needsUpdate = true;
  const [su, sv] = TEX_SPAN[kind];
  t.repeat.set(Math.max(0.01, u / su), Math.max(0.01, v / sv));
  return t;
};

// shared texture for geometry whose UVs are in metres (see PBox): repeat = 1 / span
const mcache: Partial<Record<TexKind, THREE.Texture>> = {};
export const texM = (kind: TexKind) => {
  if (!mcache[kind]) {
    const t = getTex(kind).clone();
    t.needsUpdate = true;
    const [su, sv] = TEX_SPAN[kind];
    t.repeat.set(1 / su, 1 / sv);
    mcache[kind] = t;
  }
  return mcache[kind]!;
};
