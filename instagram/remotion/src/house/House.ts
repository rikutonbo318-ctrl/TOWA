// 渦巻ハウス（架空）: 木造在来軸組 2階建て・910モジュール
// plan coords in metres: x = east, y = north (south facade at y = 0). 3D: X = x, Y = height, Z = -y
export const M = 0.91;
export const W = 10 * M; // 9.1
export const D = 7 * M; // 6.37

// levels
export const GL = 0;
export const FDN_TOP = 0.45; // foundation top
export const SILL = 0.105; // 土台
export const FL1 = 0.6;
export const FL2 = 3.5;
export const PLATE_N = 6.15; // north top plate (low side of the shed roof)
export const PLATE_S = 7.1; // south top plate (high side)
export const CH = 2.45; // ceiling height

export type Kind = 'sweep' | 'window' | 'high' | 'door' | 'entry' | 'open' | 'slide';
export type Opening = {s: number; e: number; h0: number; h1: number; kind: Kind};
export type Wall = {x0: number; y0: number; x1: number; y1: number; floor: 1 | 2; ext: boolean; open?: Opening[]};
export type Room = {name: string; floor: 1 | 2; x0: number; y0: number; x1: number; y1: number; finish?: 'oak' | 'tatami' | 'tile' | 'frp' | 'porch'};

const g = (n: number) => +(n * M).toFixed(3);

// openings measured along the wall from its first point; heights from that floor's FL
const sweep = (s: number, e: number): Opening => ({s: g(s), e: g(e), h0: 0, h1: 2.2, kind: 'sweep'});
const win = (s: number, e: number, h0 = 0.9, h1 = 2.0): Opening => ({s: g(s), e: g(e), h0, h1, kind: 'window'});
const high = (s: number, e: number): Opening => ({s: g(s), e: g(e), h0: 1.5, h1: 2.0, kind: 'high'});
const door = (s: number, e: number): Opening => ({s: g(s), e: g(e), h0: 0, h1: 2.35, kind: 'door'}); // high door
const open = (s: number, e: number): Opening => ({s: g(s), e: g(e), h0: 0, h1: 2.2, kind: 'open'});
const slide = (s: number, e: number): Opening => ({s: g(s), e: g(e), h0: 0, h1: 2.2, kind: 'slide'});

export const WALLS: Wall[] = [
  // ---------- 1F exterior ----------
  {x0: 0, y0: 0, x1: W, y1: 0, floor: 1, ext: true, open: [sweep(0.4, 2.6), sweep(3, 6), win(7.5, 9.5, 0.45, 2.0)]},
  {x0: W, y0: 0, x1: W, y1: D, floor: 1, ext: true, open: [win(0.8, 2), {s: g(3.2), e: g(4.2), h0: 0, h1: 2.3, kind: 'entry'}, high(5.3, 6.3)]},
  {x0: W, y0: D, x1: 0, y1: D, floor: 1, ext: true, open: [high(3.3, 4.2), high(5.2, 5.8), high(6.6, 7.6), high(8.3, 9.2)]},
  {x0: 0, y0: D, x1: 0, y1: 0, floor: 1, ext: true, open: [win(0.4, 1.6, 1.0, 2.0), win(3.5, 5.5, 0.9, 2.2)]},
  // ---------- 1F interior ----------
  {x0: 7 * M, y0: 0, x1: 7 * M, y1: 3 * M, floor: 1, ext: false, open: [slide(1.6, 2.9)]}, // tatami | LDK (TV wall on the south part)
  {x0: 7 * M, y0: 3 * M, x1: W, y1: 3 * M, floor: 1, ext: false}, // tatami | entrance
  {x0: 7 * M, y0: 3 * M, x1: 7 * M, y1: D, floor: 1, ext: false, open: [door(0.4, 1.4)]}, // LDK | hall
  {x0: 0, y0: 5 * M, x1: 7 * M, y1: 5 * M, floor: 1, ext: false, open: [door(0.6, 1.5), door(4.15, 4.85), open(5.05, 5.95)]}, // north band
  {x0: 2 * M, y0: 5 * M, x1: 2 * M, y1: D, floor: 1, ext: false, open: [door(0.4, 1.4)]}, // wash | bath
  {x0: 4 * M, y0: 5 * M, x1: 4 * M, y1: D, floor: 1, ext: false}, // bath | WC
  {x0: 5 * M, y0: 5 * M, x1: 5 * M, y1: D, floor: 1, ext: false}, // WC | stairs
  {x0: 8 * M, y0: 3 * M, x1: 8 * M, y1: D, floor: 1, ext: false, open: [open(0.3, 1.7), door(2.5, 3.4)]}, // hall | entrance / shoe
  {x0: 8 * M, y0: 5 * M, x1: W, y1: 5 * M, floor: 1, ext: false, open: [open(0.4, 1.6)]}, // entrance | shoe closet
  // ---------- 2F exterior (L shape around the inner balcony) ----------
  {x0: 0, y0: 0, x1: 7 * M, y1: 0, floor: 2, ext: true, open: [win(0.8, 3.2, 0.9, 2.1), win(4.4, 6.4, 0.9, 2.1)]},
  {x0: 7 * M, y0: 0, x1: 7 * M, y1: 3 * M, floor: 2, ext: true, open: [win(0.9, 2.1)]},
  {x0: 7 * M, y0: 3 * M, x1: W, y1: 3 * M, floor: 2, ext: true, open: [sweep(0.5, 2.5)]},
  {x0: W, y0: 3 * M, x1: W, y1: D, floor: 2, ext: true, open: [win(1.2, 2.6)]},
  {x0: W, y0: D, x1: 0, y1: D, floor: 2, ext: true, open: [high(3.3, 4.2), high(5.2, 5.8), high(7.6, 8.6)]},
  {x0: 0, y0: D, x1: 0, y1: 0, floor: 2, ext: true, open: [win(4.6, 6.0)]},
  // ---------- 2F interior ----------
  {x0: 4 * M, y0: 0, x1: 4 * M, y1: 4 * M, floor: 2, ext: false}, // bedroom | kid 1
  {x0: 0, y0: 4 * M, x1: 7 * M, y1: 4 * M, floor: 2, ext: false, open: [door(0.5, 1.4), door(3.1, 3.9), door(4.3, 5.1)]},
  {x0: 2 * M, y0: 4 * M, x1: 2 * M, y1: D, floor: 2, ext: false}, // WIC | WC
  {x0: 3 * M, y0: 4 * M, x1: 3 * M, y1: D, floor: 2, ext: false, open: [door(1.2, 2.0)]}, // WC | hall
  {x0: 5 * M, y0: 5 * M, x1: 7 * M, y1: 5 * M, floor: 2, ext: false, open: [open(0.1, 1.9)]}, // stair well edge
  {x0: 7 * M, y0: 3 * M, x1: 7 * M, y1: D, floor: 2, ext: false, open: [door(0.4, 1.3)]}, // hall | kid 2
];

export const ROOMS: Room[] = [
  {name: 'LDK', floor: 1, x0: 0, y0: 0, x1: 7 * M, y1: 5 * M, finish: 'oak'},
  {name: '和室', floor: 1, x0: 7 * M, y0: 0, x1: W, y1: 3 * M, finish: 'tatami'},
  {name: '玄関', floor: 1, x0: 8 * M, y0: 3 * M, x1: W, y1: 5 * M, finish: 'tile'},
  {name: 'SCL', floor: 1, x0: 8 * M, y0: 5 * M, x1: W, y1: D, finish: 'tile'},
  {name: 'ホール', floor: 1, x0: 7 * M, y0: 3 * M, x1: 8 * M, y1: D, finish: 'oak'},
  {name: '洗面', floor: 1, x0: 0, y0: 5 * M, x1: 2 * M, y1: D, finish: 'oak'},
  {name: '浴室', floor: 1, x0: 2 * M, y0: 5 * M, x1: 4 * M, y1: D, finish: 'tile'},
  {name: 'WC', floor: 1, x0: 4 * M, y0: 5 * M, x1: 5 * M, y1: D, finish: 'oak'},
  {name: '階段', floor: 1, x0: 5 * M, y0: 5 * M, x1: 7 * M, y1: D, finish: 'oak'},
  {name: '主寝室', floor: 2, x0: 0, y0: 0, x1: 4 * M, y1: 4 * M, finish: 'oak'},
  {name: '子ども室1', floor: 2, x0: 4 * M, y0: 0, x1: 7 * M, y1: 4 * M, finish: 'oak'},
  {name: '子ども室2', floor: 2, x0: 7 * M, y0: 3 * M, x1: W, y1: D, finish: 'oak'},
  {name: 'WIC', floor: 2, x0: 0, y0: 4 * M, x1: 2 * M, y1: D, finish: 'oak'},
  {name: 'WC', floor: 2, x0: 2 * M, y0: 4 * M, x1: 3 * M, y1: D, finish: 'oak'},
  {name: 'ホール', floor: 2, x0: 3 * M, y0: 4 * M, x1: 7 * M, y1: D, finish: 'oak'},
  {name: 'バルコニー', floor: 2, x0: 7 * M, y0: 0, x1: W, y1: 3 * M, finish: 'frp'},
];

// kitchen: face-to-face island facing south, back counter on the north band wall
export const KITCHEN = {island: {x0: 0.6, x1: 3.3, y0: 2.95, y1: 3.6}, back: {x0: 0.3, x1: 3.5, y0: 4.0, y1: 4.55}};
// U-turn stair in the north-east of the LDK
export const STAIR = {x0: 5 * M, y0: 5 * M, x1: 7 * M, y1: D};
// foundation rises under these lines (exterior + main interior lines)
export const FDN_LINES: [number, number, number, number][] = [
  [0, 0, W, 0],
  [W, 0, W, D],
  [W, D, 0, D],
  [0, D, 0, 0],
  [7 * M, 0, 7 * M, D],
  [0, 5 * M, W, 5 * M],
  [7 * M, 3 * M, W, 3 * M],
  [2 * M, 5 * M, 2 * M, D],
  [4 * M, 0, 4 * M, 5 * M],
];
// columns on the 910 grid along walls (simplified: every wall corner + every 2 modules on exterior)
export const roofH = (y: number) => PLATE_S + (PLATE_N - PLATE_S) * (y / D);
