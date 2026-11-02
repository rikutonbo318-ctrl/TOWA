import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {FL1, FL2, W} from './House';
import {Scene3D} from './Scene3D';
import {camTrack, Check3D, Person3D, Ring3D} from './Kit3D';
import {PBox} from './Geo';
import {Site3D} from './Site3D';
import {Fdn3D} from './Fdn3D';
import {Rebar3D} from './Rebar3D';
import {Floor3D} from './Ep06';
import {Frame3D} from './Ep07';
import {RoofFrame3D} from './Ep08';
import {Roof3D} from './Ep09';
import {Hardware3D} from './Ep10';
import {Sash3D} from './Ep11';
import {Skin3D} from './Ep12';
import {Ins3D} from './Ep13';
import {Board3D} from './Ep15';
import {Carp3D} from './Ep16';
import {Cloth3D} from './Ep18';
import {Kitchen3D} from './Ep19';

// 渦さんの脱線シリーズ：流行りの話 → 「…って、ちゃうちゃう！」→ 家の話（工事中にしか見られない所）
// 0-240 流行り（渦さんのアップ＋2Dの小道具） / 240-300 ツッコミ / 300-480 現場のアップ / 480-600 締め
const T_TURN = 240;
const T_SITE = 300;
const T_END = 480;
type Line = [number, number, string];

const outline = (w: number) => `${w}px ${w}px 0 #10161e, -${w}px ${w}px 0 #10161e, ${w}px -${w}px 0 #10161e, -${w}px -${w}px 0 #10161e, 0 ${w}px 0 #10161e, 0 -${w}px 0 #10161e, ${w}px 0 0 #10161e, -${w}px 0 0 #10161e`;

// the finished LDK with 渦さん facing the camera
const Home: React.FC<{f: number; act: 'idle' | 'wave' | 'point' | 'measure'}> = ({f, act}) => (
  <>
    <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
    <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
    <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab: 1, innerForm: 1, wallConc: 1, strip: 1}} />
    <Floor3D s={{sill: 1, obiki: 1, pipe: 1, ins: 1, ply: 1}} />
    <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 0, ply: 1}} />
    <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
    <Roof3D s={{scaf: 0, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
    <Hardware3D s={{brace: 0, plate: 1, hd: 1, bolt: 1}} />
    <Sash3D s={{sash1: 1, sash2: 1, tape: 1, mat: 1, top: 1, water: 0}} />
    <Skin3D s={{sheet: 1, batten: 1, side1: 1, side2: 1, gutter: 1}} />
    <Ins3D s={{wire: 0, ins1: 1, ins2: 1, vb: 1, tape: 0}} />
    <Board3D s={{ceil: 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: 0}} />
    <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
    <Cloth3D s={{putty: 0, ceil: 1, wall1: 1, accent: 1, wall2: 1}} />
    <Kitchen3D s={{pipe: 0, cab: 1, top: 1, hood: 1, tap: 1}} />
    <Person3D x={2.8} y={2.3} h={FL1} yaw={270} act={act} f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
  </>
);
const homeCam = camTrack([
  [0, [2.8, 0.95, FL1 + 1.85], [2.8, 2.3, FL1 + 1.75], 40],
  [90, [2.95, 1.0, FL1 + 1.8], [2.8, 2.3, FL1 + 1.7], 42],
  [239, [2.6, 0.85, FL1 + 1.6], [2.8, 2.3, FL1 + 1.4], 44],
  [240, [2.8, 1.25, FL1 + 1.75], [2.8, 2.3, FL1 + 1.6], 30],
  [300, [2.8, 1.2, FL1 + 1.75], [2.8, 2.3, FL1 + 1.6], 30],
]);
const endCam = camTrack([
  [480, [2.8, 0.7, FL1 + 1.6], [2.8, 2.3, FL1 + 1.2], 46],
  [600, [2.8, 0.55, FL1 + 1.6], [2.8, 2.3, FL1 + 1.2], 48],
]);

// big subtitle with the speaker tag
const Say: React.FC<{f: number; lines: Line[]; bottom?: number}> = ({f, lines, bottom = 470}) => {
  const cur = lines.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a, b, text] = cur;
  const o = ramp(f, a, a + 5) * (1 - ramp(f, b - 4, b));
  return (
    <div style={{position: 'absolute', bottom, left: 40, right: 40, textAlign: 'center', opacity: o, fontFamily: FONT}}>
      <span style={{display: 'inline-block', background: 'rgba(16,22,30,0.88)', color: '#fff', fontWeight: 800, fontSize: 50, lineHeight: 1.35, padding: '14px 30px', borderRadius: 18}}>
        <span style={{color: '#7fd49b', marginRight: 12}}>渦さん</span>
        {text}
      </span>
    </div>
  );
};

const Hook: React.FC<{f: number; word: string; sub: string}> = ({f, word, sub}) => {
  const o = 1 - ramp(f, 80, 92);
  const pop = 0.85 + 0.15 * ramp(f, 0, 8);
  return (
    <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: o, fontFamily: FONT, transform: `scale(${pop})`, background: 'linear-gradient(rgba(16,22,30,0), rgba(16,22,30,0.55) 20%, rgba(16,22,30,0.55) 80%, rgba(16,22,30,0))', padding: '30px 0'}}>
      <div style={{fontSize: 120, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.15}}>{word}</div>
      <div style={{fontSize: 76, fontWeight: 900, color: '#ffd34d', textShadow: outline(4), marginTop: 14}}>{sub}</div>
    </div>
  );
};

type Tm = {turn: number; site: number; end: number; dur: number};
const TM20: Tm = {turn: T_TURN, site: T_SITE, end: T_END, dur: 600};
export const TM35: Tm = {turn: 420, site: 480, end: 870, dur: 1050};

const Turn: React.FC<{f: number; tm: Tm}> = ({f, tm}) => {
  if (f < tm.turn || f >= tm.site) return null;
  const o = ramp(f, tm.turn, tm.turn + 4) * (1 - ramp(f, tm.site - 6, tm.site));
  const shake = f < tm.turn + 14 ? Math.sin(f * 2.3) * 14 : 0;
  return (
    <div style={{position: 'absolute', top: 1220, width: '100%', textAlign: 'center', opacity: o, fontFamily: FONT, transform: `translateX(${shake}px) rotate(-4deg)`}}>
      <span style={{fontSize: 104, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>…って、ちゃうちゃう！</span>
    </div>
  );
};

const EndCard: React.FC<{f: number; lead: string; end: number}> = ({f, lead, end}) => {
  if (f < end) return null;
  const o = ramp(f, end + 4, end + 16);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 520, opacity: o, transform: `translateY(${(1 - o) * 30}px)`, fontFamily: FONT}}>
      <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
          <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
        </div>
        <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>{lead}</div>
        <div style={{fontSize: 54, fontWeight: 900, color: '#10161e', marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
        <div style={{fontSize: 40, fontWeight: 800, color: '#10161e', marginTop: 16}}>家建てる友だちに送ったって</div>
      </div>
    </div>
  );
};

const Note: React.FC = () => (
  <div style={{position: 'absolute', bottom: 300, width: '100%', textAlign: 'center', fontFamily: FONT}}>
    <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　渦巻建設の施工実績ではありません</span>
  </div>
);

type SiteShot = {cam: ReturnType<typeof camTrack>; scene: (f: number) => React.ReactNode};

const DassenReel: React.FC<{word: string; sub: string; prop: (f: number) => React.ReactNode; talk: Line[]; site: SiteShot; lead: string; tm?: Tm}> = ({word, sub, prop, talk, site, lead, tm = TM20}) => {
  const f = useCurrentFrame();
  const inSite = f >= tm.site && f < tm.end;
  // map this reel's timeline onto the 20-second camera / animation keys
  const hf = f < tm.turn ? (f * 239) / (tm.turn - 1) : 240 + ((f - tm.turn) * 60) / (tm.site - tm.turn);
  const lf = T_SITE + ((f - tm.site) * (T_END - T_SITE)) / (tm.end - tm.site);
  const ef = T_END + ((f - tm.end) * 120) / (tm.dur - tm.end);
  const c = inSite ? site.cam(lf) : f >= tm.end ? endCam(ef) : homeCam(hf);
  const act = f >= tm.end ? 'wave' : f >= tm.turn ? 'point' : 'idle';
  const zoom = f >= tm.turn && f < tm.turn + 10 ? 1 + 0.06 * (1 - (f - tm.turn) / 10) : 1;
  return (
    <AbsoluteFill style={{background: '#10161e'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <Scene3D cam={c} noSite>{inSite ? site.scene(lf) : <Home f={f} act={act} />}</Scene3D>
      </AbsoluteFill>
      {f < tm.turn ? prop(f) : null}
      <Hook f={f} word={word} sub={sub} />
      <Turn f={f} tm={tm} />
      <Say f={f} lines={talk} />
      <EndCard f={f} lead={lead} end={tm.end} />
      {inSite ? <Note /> : null}
    </AbsoluteFill>
  );
};

// ---------- 2D props ----------
const Phone: React.FC<{f: number}> = ({f}) => {
  const o = ramp(f, 4, 14);
  const k = Math.floor(f / 14);
  const t = (f % 14) / 14;
  const colors = ['#ff7a59', '#7b6cff', '#2fc4a3', '#ffc23d', '#ff5c9a', '#4aa8ff'];
  const card = (i: number, y: number) => (
    <div key={i} style={{position: 'absolute', left: 22, right: 22, top: y, height: 440, borderRadius: 26, background: colors[i % colors.length], boxShadow: 'inset 0 -120px 80px rgba(0,0,0,0.25)'}}>
      <div style={{position: 'absolute', left: 26, bottom: 34, width: 180, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.8)'}} />
      <div style={{position: 'absolute', left: 26, bottom: 70, width: 260, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.6)'}} />
      <div style={{position: 'absolute', right: 26, bottom: 120, width: 54, height: 54, borderRadius: 27, background: 'rgba(255,255,255,0.85)'}} />
    </div>
  );
  const shift = -480 * Math.min(1, t * 2.2);
  const hour = 23 + Math.floor(f / 60);
  const clock = `${String(hour % 24).padStart(2, '0')}:${String(Math.floor((f % 60) * 0.99)).padStart(2, '0')}`;
  return (
    <div style={{position: 'absolute', left: 560, top: 1150, width: 400, height: 540, opacity: o, transform: `rotate(-6deg) translateY(${(1 - o) * 80}px)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 52, background: '#111', padding: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
        <div style={{position: 'absolute', inset: 16, borderRadius: 38, overflow: 'hidden', background: '#000'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: shift}}>{[card(k, 20), card(k + 1, 500)]}</div>
          <div style={{position: 'absolute', top: 14, width: '100%', textAlign: 'center', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 800}}>{clock}</div>
        </div>
      </div>
    </div>
  );
};

const STICKERS: [number, number, string, 'c' | 's' | 'h'][] = [
  [90, 120, '#ff8fb1', 'h'],
  [250, 100, '#8fd3ff', 'c'],
  [400, 150, '#ffd36b', 's'],
  [140, 280, '#b59cff', 'c'],
  [320, 300, '#7fe0b2', 'h'],
];
const Sticker: React.FC<{c: string; shape: 'c' | 's' | 'h'; size: number}> = ({c, shape, size}) => {
  const fill = `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 38%, ${c} 70%, rgba(0,0,0,0.25) 100%)`;
  const clip = shape === 's' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : shape === 'h' ? 'path("M50 90 L12 52 A22 22 0 0 1 50 18 A22 22 0 0 1 88 52 Z")' : 'circle(50% at 50% 50%)';
  return <div style={{width: size, height: size, background: fill, clipPath: clip, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.3))', transform: shape === 'h' ? `scale(${size / 100})` : undefined, transformOrigin: '0 0'}} />;
};
const StickerBook: React.FC<{f: number}> = ({f}) => {
  const o = ramp(f, 4, 14);
  return (
    <div style={{position: 'absolute', left: 170, top: 1180, width: 740, height: 520, opacity: o, transform: `rotate(-3deg) translateY(${(1 - o) * 80}px)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 24, background: '#fff8ec', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', border: '10px solid #e5a1b8'}} />
      <div style={{position: 'absolute', left: 365, top: 10, bottom: 10, width: 6, background: '#e8d9c2'}} />
      {STICKERS.map(([x, y, c, s], i) => {
        const at = 20 + i * 34;
        const k = ramp(f, at, at + 10);
        if (k <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y - (1 - k) * 60, opacity: k, transform: `scale(${0.8 + 0.2 * k})`}}>
            <Sticker c={c} shape={s} size={100} />
          </div>
        );
      })}
      {/* the one 渦さん can't decide where to put */}
      {f > 190 ? (
        <div style={{position: 'absolute', left: 520 + Math.sin(f / 9) * 90, top: 330 + Math.cos(f / 11) * 40, transform: 'rotate(8deg)'}}>
          <Sticker c="#ff9e5a" shape="s" size={120} />
        </div>
      ) : null}
    </div>
  );
};

const Strip: React.FC<{x: number; y: number; r: number; plugs: number}> = ({x, y, r, plugs}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 260, height: 70, borderRadius: 16, background: '#f4f4f0', border: '4px solid #c9c9c2', transform: `rotate(${r}deg)`, boxShadow: '0 10px 20px rgba(0,0,0,0.35)'}}>
    {Array.from({length: 4}).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: 22 + i * 58, top: 14, width: 36, height: 36, borderRadius: 8, background: i < plugs ? '#2c2f33' : '#dcdcd6'}} />
    ))}
  </div>
);
const Cords: React.FC<{f: number}> = ({f}) => {
  const o = ramp(f, 4, 14);
  const n = Math.min(4, 1 + Math.floor(f / 40));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1200, height: 560, opacity: o}}>
      <svg width={1080} height={560} style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2, 3].slice(0, n).map((i) => (
          <path key={i} d={`M ${120 + i * 70} 40 C ${300 + i * 90} ${200 + i * 30}, ${200 + i * 150} ${380 - i * 20}, ${520 + i * 120} ${300 + i * 50}`} stroke={['#2c2f33', '#f0f0ea', '#444', '#ddd'][i]} strokeWidth={16} fill="none" strokeLinecap="round" />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 70, top: 0, width: 120, height: 150, borderRadius: 14, background: '#f6f5f0', border: '4px solid #c9c9c2'}}>
        <div style={{position: 'absolute', left: 30, top: 30, width: 56, height: 36, borderRadius: 6, background: '#2c2f33'}} />
        <div style={{position: 'absolute', left: 30, top: 84, width: 56, height: 36, borderRadius: 6, background: '#2c2f33'}} />
      </div>
      {n > 1 ? <Strip x={330} y={210} r={-8} plugs={4} /> : null}
      {n > 2 ? <Strip x={560} y={330} r={6} plugs={4} /> : null}
      {n > 3 ? <Strip x={300} y={430} r={-3} plugs={3} /> : null}
    </div>
  );
};

// ---------- 現場のアップ ----------
const rebarCam = camTrack([
  [300, [-1.4, -1.2, 1.6], [0.8, 0.9, 0.0], 44],
  [480, [-1.0, -1.4, 1.5], [0.9, 0.9, 0.0], 46],
]);
const RebarScene = (f: number) => (
  <>
    <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
    <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
    <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1}} />
    {f >= 316 ? <Ring3D p={[0.6, 0.6, 0.05]} o={ramp(f, 316, 322)} f={f} r={0.5} /> : null}
    {f >= 420 ? <Check3D p={[0.6, 0.6, 0.7]} o={ramp(f, 422, 428)} size={0.35} /> : null}
  </>
);

const tapeCam = camTrack([
  [300, [7.0, -4.4, FL1 + 1.6], [7.74, 0, FL1 + 1.2], 44],
  [480, [8.4, -4.4, FL1 + 1.6], [7.74, 0, FL1 + 1.2], 44],
]);
const tapeM = {color: '#b9bdc2', rough: 0.35};
const TapeScene = (f: number) => (
  <>
    <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
    <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
    <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab: 1, innerForm: 1, wallConc: 1, strip: 1}} />
    <Floor3D s={{sill: 1, obiki: 1, pipe: 1, ins: 1, ply: 1}} />
    <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 0, ply: 1}} />
    <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
    <Roof3D s={{scaf: 0, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
    <Hardware3D s={{brace: 0, plate: 1, hd: 1, bolt: 1}} />
    <Sash3D s={{sash1: 1, sash2: 1, tape: 1, mat: 0, top: 0, water: 0}} />
    {/* 防水テープ：下 → 左右 → 上の順に重ねて貼る */}
    {f >= 300 ? <PBox x0={6.73} x1={8.75} y0={-0.13} y1={-0.115} h0={FL1 + 0.37} h1={FL1 + 0.45} m={tapeM} cast={false} /> : null}
    {f >= 330 ? <PBox x0={6.73} x1={6.83} y0={-0.135} y1={-0.12} h0={FL1 + 0.37} h1={FL1 + 0.37 + 1.71 * ramp(f, 330, 350)} m={tapeM} cast={false} /> : null}
    {f >= 330 ? <PBox x0={8.65} x1={8.75} y0={-0.135} y1={-0.12} h0={FL1 + 0.37} h1={FL1 + 0.37 + 1.71 * ramp(f, 330, 350)} m={tapeM} cast={false} /> : null}
    {f >= 356 ? <PBox x0={6.73} x1={6.73 + 2.02 * ramp(f, 356, 376)} y0={-0.14} y1={-0.125} h0={FL1 + 2.0} h1={FL1 + 2.08} m={tapeM} cast={false} /> : null}
    {f >= 392 ? <Ring3D p={[6.8, -0.2, FL1 + 2.0]} o={ramp(f, 392, 398)} f={f} r={0.32} vertical /> : null}
    {f >= 420 ? <Check3D p={[7.74, -0.3, FL1 + 2.5]} o={ramp(f, 422, 428)} size={0.35} /> : null}
  </>
);

const wireCam = camTrack([
  [300, [4.6, 3.6, 1.8], [0, 1.9, 1.3], 50],
  [480, [4.3, 3.5, 1.8], [0, 1.9, 1.3], 50],
]);
const WireScene = (f: number) => (
  <>
    <Site3D f={f} s={{dig: () => 1, rope: 0, posts: 1, nuki: 1, strings: 0, pile: 0}} />
    <Fdn3D s={{gravel: 1, compact: 1, sheet: 1, sutecon: 1, suteconDry: 1, sumi: 1}} />
    <Rebar3D s={{form: 1, spacer: 1, base: 1, wall: 1, anchor: 1, slab: 1, innerForm: 1, wallConc: 1, strip: 1}} />
    <Floor3D s={{sill: 1, obiki: 1, pipe: 1, ins: 1, ply: 1}} />
    <Frame3D s={{post: 1, beam: 1, joist: 1, brace: 0, ply: 1}} />
    <RoofFrame3D s={{post: 1, plate: 1, purlin: 1, rafter: 1, sheath: 1}} />
    <Roof3D s={{scaf: 0, felt: 1, drip: 1, metal: 1, edge: 1, soffit: 1}} />
    <Hardware3D s={{brace: 0, plate: 1, hd: 1, bolt: 1}} />
    <Sash3D s={{sash1: 1, sash2: 1, tape: 1, mat: 1, top: 1, water: 0}} />
    <Skin3D s={{sheet: 1, batten: 1, side1: 1, side2: 1, gutter: 1}} />
    <Ins3D s={{wire: 1, ins1: 0, ins2: 0, vb: 0, tape: 0}} />
    <Person3D x={1.3} y={2.2} h={FL1} yaw={180} act="point" f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
    {f >= 420 ? <Check3D p={[0.3, 1.9, FL1 + 1.6]} o={ramp(f, 422, 428)} size={0.35} /> : null}
  </>
);

// ---------- D1〜D3 ----------
export const D1: React.FC = () => (
  <DassenReel
    word="ショート動画"
    sub="やめられへん"
    prop={(f) => <Phone f={f} />}
    talk={[
      [96, 168, '気づいたら2時間たってるねん'],
      [168, 238, 'これがドパガキってやつか…'],
      [306, 392, 'この鉄筋、コンクリ流したら一生見られへんのやで'],
      [392, 478, 'スワイプする前に、この日だけは現場行っとき'],
    ]}
    site={{cam: rebarCam, scene: RebarScene}}
    lead="コンクリートを流す前の日が、いちばん大事"
  />
);

export const D2: React.FC = () => (
  <DassenReel
    word="シール帳"
    sub="ハマってもうた"
    prop={(f) => <StickerBook f={f} />}
    talk={[
      [96, 176, 'ぷっくりしたやつ、貼る場所めっちゃ悩むねん'],
      [176, 256, '1回貼ったら、はがすと跡つくしな…'],
      [256, 336, 'せやから、貼る前にどこにするか決めるんや'],
      [336, 418, '…でもな、家にも「貼る場所」で人生変わるとこあんねん'],
      [486, 576, '窓のまわりの防水テープ。下→横→上の順で重ねて貼る'],
      [576, 666, '順番が逆やと、水がテープのすき間に入ってまうねん'],
      [666, 756, 'ここがズレてたら、雨もれの入口や'],
      [756, 866, '外壁貼ったら二度と見られへん。写真もらっとき'],
    ]}
    tm={TM35}
    site={{cam: tapeCam, scene: TapeScene}}
    lead="窓まわりの防水テープは、外壁の前だけ"
  />
);

export const D3: React.FC = () => (
  <DassenReel
    word="コンセント"
    sub="足りなさすぎて滅"
    prop={(f) => <Cords f={f} />}
    talk={[
      [96, 176, 'ソファの裏もテレビの横も、全部延長コードや'],
      [176, 256, 'スマホの充電、ベッドまで届かへんし'],
      [256, 336, '掃除機かけるたびに、コード抜き差しや'],
      [336, 418, 'なんでやねん！建てる前に言うといてや…'],
      [486, 576, '位置を変えられる最後の日は、打ち合わせちゃう'],
      [576, 666, '壁をふさぐ前の「先行配線」の日や'],
      [666, 756, 'この日に現場行って、家具を置く場所に立ってみ'],
      [756, 866, 'ベッドの横、テレビの裏、充電する場所。全部ここで決まるで'],
    ]}
    tm={TM35}
    site={{cam: wireCam, scene: WireScene}}
    lead="コンセントの位置を変えられる最後の日"
  />
);

export const DASSEN_W = W;
