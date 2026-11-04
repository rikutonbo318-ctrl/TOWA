import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {FL1, FL2, M, W} from './House';
import {PBox} from './Geo';
import {Scene3D} from './Scene3D';
import {camTrack, Person3D, Ring3D} from './Kit3D';
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
import DUR from '../../public/voice/M3/durations.json';
import LINES from '../../../narration/M3.json';

// もしも物理 M3：冷蔵庫を何台置いたら、2階の床は抜ける？（ナレーション入り・約60秒）
// 1台 → 10台（約1.2トン、広げればOK）→ 苦手なのは集中する重さ → ピアノ・本棚・水槽 → 床下の補強 → 床を張ったら入れられない → 打ち合わせで伝える
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
const PAUSE: Record<string, number> = {'01': 0.4, '02': 0.4, '03': 1.4, '04': 0.5, '05': 0.4, '06': 0.6, '07': 0.6, '08': 0.6, '09': 1.0, '10': 0.5, '11': 1.0};
const T: Record<string, [number, number]> = {};
{
  let t = 0.1;
  for (const l of lines) {
    const d = dur[l.id] ?? 3;
    T[l.id] = [Math.round(t * FPS), Math.round((t + d) * FPS)];
    t += d + (PAUSE[l.id] ?? 0.3);
  }
}
const at = (id: string) => T[id][0];
const end = (id: string) => T[id][1];
export const M3_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ink = '#10161e';
const outline = (w: number) => `${w}px ${w}px 0 ${ink}, -${w}px ${w}px 0 ${ink}, ${w}px -${w}px 0 ${ink}, -${w}px -${w}px 0 ${ink}, 0 ${w}px 0 ${ink}, 0 -${w}px 0 ${ink}, ${w}px 0 0 ${ink}, -${w}px 0 0 ${ink}`;
const ROOM = {x0: 0.1, x1: 4 * M - 0.1, y0: 0.1, y1: 4 * M - 0.1};
const F0 = FL2 + 0.012;

// 10 fridges spread over the bedroom
const FR: [number, number][] = [
  [0.6, 0.6], [1.5, 0.6], [2.4, 0.6], [3.2, 0.6],
  [0.6, 1.7], [3.2, 1.7],
  [0.6, 2.8], [1.5, 2.8], [2.4, 2.8], [3.2, 2.8],
];
const white = {color: '#eef0f2', rough: 0.25, metal: 0.15, emissive: '#1a1a1a', emissiveIntensity: 0.15};
const Fridge: React.FC<{x: number; y: number; drop: number}> = ({x, y, drop}) => {
  const h = F0 + (1 - drop) * 2.2;
  return (
    <group>
      <PBox x0={x - 0.34} x1={x + 0.34} y0={y - 0.33} y1={y + 0.33} h0={h} h1={h + 1.8} m={white} />
      <PBox x0={x - 0.34} x1={x + 0.34} y0={y + 0.33} y1={y + 0.336} h0={h + 1.15} h1={h + 1.17} m={{color: '#3a3d40'}} cast={false} />
      <PBox x0={x - 0.005} x1={x + 0.005} y0={y + 0.33} y1={y + 0.336} h0={h + 1.17} h1={h + 1.8} m={{color: '#3a3d40'}} cast={false} />
      <PBox x0={x - 0.06} x1={x - 0.03} y0={y + 0.336} y1={y + 0.36} h0={h + 1.3} h1={h + 1.6} m={{color: '#9a9ea3', metal: 0.6, rough: 0.3}} cast={false} />
      <PBox x0={x - 0.25} x1={x + 0.25} y0={y + 0.336} y1={y + 0.36} h0={h + 1.05} h1={h + 1.08} m={{color: '#9a9ea3', metal: 0.6, rough: 0.3}} cast={false} />
    </group>
  );
};

// grand piano (3 legs), book shelf, aquarium
const PX = 2.55;
const PY = 1.05;
const LEGS: [number, number][] = [[PX - 0.62, PY - 0.55], [PX + 0.62, PY - 0.55], [PX + 0.1, PY + 0.75]];
const black = {color: '#121314', rough: 0.15, metal: 0.2};
const Piano: React.FC<{o: number}> = ({o}) => {
  const d = (1 - o) * 1.5;
  return (
    <group>
      {LEGS.map(([x, y], i) => (
        <PBox key={i} x0={x - 0.05} x1={x + 0.05} y0={y - 0.05} y1={y + 0.05} h0={F0 + d} h1={F0 + 0.68 + d} m={black} />
      ))}
      <PBox x0={PX - 0.75} x1={PX + 0.75} y0={PY - 0.7} y1={PY + 0.2} h0={F0 + 0.66 + d} h1={F0 + 1.0 + d} m={black} />
      <PBox x0={PX - 0.55} x1={PX + 0.55} y0={PY + 0.2} y1={PY + 0.9} h0={F0 + 0.66 + d} h1={F0 + 1.0 + d} m={black} />
      <PBox x0={PX - 0.72} x1={PX + 0.72} y0={PY - 0.82} y1={PY - 0.7} h0={F0 + 0.74 + d} h1={F0 + 0.78 + d} m={{color: '#f4f2ec', rough: 0.3}} />
    </group>
  );
};
const Shelf: React.FC<{o: number}> = ({o}) => {
  if (o <= 0) return null;
  const d = (1 - o) * 1.5;
  const x0 = 0.15;
  const y0 = 2.75;
  return (
    <group>
      <PBox x0={x0} x1={x0 + 0.36} y0={y0} y1={y0 + 0.9} h0={F0 + d} h1={F0 + 1.8 + d} m={{color: '#7a5634', tex: 'lumber', rough: 0.7}} />
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3, 4, 5].map((k) => (
          <PBox key={r + '_' + k} x0={x0 + 0.362} x1={x0 + 0.37} y0={y0 + 0.05 + k * 0.14} y1={y0 + 0.17 + k * 0.14} h0={F0 + 0.08 + r * 0.35 + d} h1={F0 + 0.36 + r * 0.35 + d} m={{color: ['#8a3b3b', '#2f4a78', '#c9a96e', '#3d5a3a', '#6a5a7a', '#d9cdb5'][(r + k) % 6]}} cast={false} />
        )),
      )}
    </group>
  );
};
const Tank: React.FC<{o: number}> = ({o}) => {
  if (o <= 0) return null;
  const d = (1 - o) * 1.5;
  const x0 = 2.6;
  const y0 = 3.0;
  return (
    <group>
      <PBox x0={x0} x1={x0 + 1.2} y0={y0} y1={y0 + 0.45} h0={F0 + d} h1={F0 + 0.7 + d} m={{color: '#2b2d30', rough: 0.5}} />
      <PBox x0={x0 + 0.02} x1={x0 + 1.18} y0={y0 + 0.02} y1={y0 + 0.43} h0={F0 + 0.7 + d} h1={F0 + 1.15 + d} m={{color: '#4fa3d1', rough: 0.05, opacity: 0.55, emissive: '#1d5f88', emissiveIntensity: 0.5}} cast={false} />
    </group>
  );
};

export const M3: React.FC = () => {
  const f = useCurrentFrame();
  const under = f >= at('08') && f < at('10');
  // fridges: hook shows all 10; then 1, then 2 / 5 / 10
  const nShow = f < at('02') ? 10 : f < at('03') ? 1 : f < at('03') + 22 ? 2 : f < at('03') + 44 ? 5 : 10;
  const fridges = f < at('05') + 12;
  const dropOf = (i: number) => {
    if (f < at('02')) return 1;
    const start = i === 0 ? at('02') + 10 : i === 1 ? at('03') : i < 5 ? at('03') + 22 + (i - 2) * 3 : at('03') + 44 + (i - 5) * 3;
    return ramp(f, start, start + 10);
  };
  const piano = f >= at('06') ? ramp(f, at('06') + 4, at('06') + 16) : 0;
  const shelf = f >= at('07') ? ramp(f, at('07') + 4, at('07') + 14) : 0;
  const tank = f >= at('07') ? ramp(f, at('07') + 18, at('07') + 28) : 0;
  const reinf = ramp(f, at('08') + 20, at('08') + 50);
  const closeUp = ramp(f, at('09') + 30, at('09') + 60); // 1F ceiling comes back = can't add any more
  const cam = camTrack([
    [0, [5.0, 4.4, FL2 + 2.6], [1.8, 1.6, FL2 + 0.4], 66],
    [at('02'), [4.9, 4.3, FL2 + 2.55], [1.8, 1.6, FL2 + 0.3], 66],
    [at('04'), [5.0, 4.3, FL2 + 2.6], [1.8, 1.6, FL2 + 0.3], 66],
    [at('06'), [4.8, 4.2, FL2 + 2.4], [PX - 0.4, PY, FL2 + 0.3], 54],
    [at('07'), [4.6, 0.6, FL2 + 2.0], [1.6, 2.6, FL2 + 0.6], 56],
    [at('08') - 1, [4.5, 0.7, FL2 + 1.9], [1.6, 2.6, FL2 + 0.6], 56],
    [at('08'), [2.6, 4.3, FL1 + 1.0], [PX, PY, FL2 - 0.2], 60],
    [at('10') - 1, [2.8, 4.1, FL1 + 1.0], [PX, PY, FL2 - 0.2], 60],
    [at('10'), [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
    [M3_FRAMES, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
  ]);
  const c = cam(f);
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const count = f >= at('02') && f < at('05') ? `${nShow}台` : null;
  const ton = f >= at('04') && f < at('05') ? '約1.2トン' : null;
  const ok = f >= at('04') + 40 && f < at('05') ? ramp(f, at('04') + 40, at('04') + 50) : 0;
  const conc = f >= at('05') + 10 && f < at('06') ? ramp(f, at('05') + 10, at('05') + 20) : 0;
  const endCard = ramp(f, at('11') + 6, at('11') + 20);

  return (
    <AbsoluteFill style={{background: ink}}>
      <Scene3D cam={c} noSite>
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
        <Board3D s={{ceil: under ? closeUp : 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: 0}} />
        <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
        <Cloth3D s={{putty: 0, ceil: under ? (closeUp >= 1 ? 1 : 0) : 1, wall1: 1, accent: 1, wall2: 1}} />
        <Kitchen3D s={{pipe: 0, cab: 1, top: 1, hood: 1, tap: 1}} />
        <PBox x0={ROOM.x0} x1={ROOM.x1} y0={ROOM.y0} y1={ROOM.y1} h0={FL2 + 0.001} h1={F0} m={{color: '#b98a5a', tex: 'oak', rough: 0.55}} cast={false} />
        {ok > 0 ? <PBox x0={ROOM.x0} x1={ROOM.x1} y0={ROOM.y0} y1={ROOM.y1} h0={F0 + 0.001} h1={F0 + 0.004} m={{color: '#59c27a', emissive: '#2e9b52', emissiveIntensity: 0.8, opacity: 0.35 * ok}} cast={false} /> : null}
        {fridges ? FR.slice(0, nShow).map(([x, y], i) => <Fridge key={i} x={x} y={y} drop={dropOf(i)} />) : null}
        {piano > 0 ? <Piano o={piano} /> : null}
        <Shelf o={shelf} />
        <Tank o={tank} />
        {/* concentrated load: red glow under the 3 legs */}
        {f >= at('06') + 20 && f < at('08')
          ? LEGS.map(([x, y], i) => <Ring3D key={i} p={[x, y, F0 + 0.01]} o={ramp(f, at('06') + 20, at('06') + 26)} f={f} r={0.14} />)
          : null}
        {/* added joists / blocking under the piano (seen from below) */}
        {under && reinf > 0
          ? [PX - 0.45, PX, PX + 0.45].map((x, i) => (
              <PBox key={i} x0={x - 0.05} x1={x + 0.05} y0={PY - 0.9} y1={PY - 0.9 + 1.9 * Math.min(1, reinf * 1.3 - i * 0.15)} h0={FL2 - 0.24} h1={FL2 - 0.03} m={{color: '#e8a24a', tex: 'lumber', rough: 0.6, emissive: '#7a4a10', emissiveIntensity: 0.4}} />
            ))
          : null}
        {f >= at('10') ? <Person3D x={W + 1.6} y={-1.8} yaw={250} act="wave" f={f} suit={UZU.suit} vest={UZU.vest} uzu /> : null}
      </Scene3D>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 76, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>冷蔵庫を 何台置いたら</div>
          <div style={{fontSize: 100, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>2階の床は抜ける？</div>
        </div>
      ) : null}
      {count ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 132, fontWeight: 900, color: '#ffd34d', textShadow: outline(7)}}>{count}</div>
          {ton ? <div style={{fontSize: 70, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>{ton}</div> : null}
          {ok > 0 ? <div style={{display: 'inline-block', marginTop: 16, opacity: ok, background: '#2e7d4f', color: '#fff', fontSize: 52, fontWeight: 900, padding: '8px 28px', borderRadius: 16}}>広げて置けば OK</div> : null}
        </div>
      ) : null}
      {conc > 0 ? (
        <div style={{position: 'absolute', top: 260, left: 60, right: 60, opacity: conc, display: 'flex', gap: 20, fontFamily: FONT}}>
          {[
            {t: '広がる重さ', d: '床ぜんたいで受ける', ok: true},
            {t: '集中する重さ', d: '小さい面積に乗る', ok: false},
          ].map((b) => (
            <div key={b.t} style={{flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 22, padding: '20px 12px', textAlign: 'center', borderTop: `12px solid ${b.ok ? '#2e7d4f' : '#c0392b'}`}}>
              <svg width={260} height={120} viewBox="0 0 260 120">
                <rect x={10} y={90} width={240} height={14} fill="#b98a5a" />
                {b.ok ? <rect x={30} y={40} width={200} height={50} fill="#9aa0a4" /> : <rect x={110} y={10} width={40} height={80} fill="#9aa0a4" />}
                {(b.ok ? [50, 90, 130, 170, 210] : [130]).map((x) => (
                  <path key={x} d={`M${x} 92 l-8 14 h16 z`} fill={b.ok ? '#2e7d4f' : '#c0392b'} />
                ))}
              </svg>
              <div style={{fontSize: 46, fontWeight: 900, color: b.ok ? '#2e7d4f' : '#c0392b'}}>{b.t}</div>
              <div style={{fontSize: 32, fontWeight: 800, color: '#444'}}>{b.d}</div>
            </div>
          ))}
        </div>
      ) : null}
      {f >= at('06') + 10 && f < at('07') ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 110, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>約250kg</div>
          <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>÷ 足3本</div>
        </div>
      ) : null}
      {f >= at('07') + 10 && f < at('08') ? (
        <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>本棚・水槽</div>
          <div style={{fontSize: 110, fontWeight: 900, color: '#ff5a3c', textShadow: outline(6)}}>200kg超も</div>
        </div>
      ) : null}
      {under ? (
        <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          {f < at('09') ? (
            <span style={{background: '#e8a24a', color: ink, fontSize: 56, fontWeight: 900, padding: '10px 30px', borderRadius: 16}}>床下の補強</span>
          ) : (
            <span style={{background: '#c0392b', color: '#fff', fontSize: 56, fontWeight: 900, padding: '10px 30px', borderRadius: 16, opacity: ramp(f, at('09') + 40, at('09') + 50)}}>床を張ったら ✕ 入れられない</span>
          )}
        </div>
      ) : null}
      {f >= at('10') && f < at('11') ? (
        <div style={{position: 'absolute', top: 220, left: 70, right: 70, fontFamily: FONT, opacity: ramp(f, at('10'), at('10') + 10)}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: '26px 30px', borderLeft: '14px solid #e8622c'}}>
            <div style={{fontSize: 42, fontWeight: 900, color: '#e8622c'}}>打ち合わせで伝えること</div>
            {['ピアノを置く場所', '水槽を置く場所', '大きな本棚を置く壁'].map((t) => (
              <div key={t} style={{fontSize: 50, fontWeight: 900, color: ink, marginTop: 10}}>{`✓ ${t}`}</div>
            ))}
          </div>
        </div>
      ) : null}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1180, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 56, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text.replace('約120キロ', '約120kg').replace('約250キロ', '約250kg').replace('200キロ', '200kg').replace('チェック、とコメント', '「チェック」とコメント')}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', bottom: 290, width: '100%', textAlign: 'center', fontFamily: FONT}}>
        <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です</span>
      </div>
      {endCard > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 470, opacity: endCard, transform: `translateY(${(1 - endCard) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>床の補強は、床を張る前だけ</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />打ち合わせで聞くリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: ink, marginTop: 16}}>家建てる友だちに送ったって</div>
          </div>
        </div>
      ) : null}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M3/${l.id}.wav`)} />
        </Sequence>
      ))}
      {[at('02') + 18, at('03') + 8, at('03') + 30, at('03') + 52, at('06') + 14, at('07') + 12, at('07') + 26].map((s, i) => (
        <Sequence key={'th' + i} from={s} durationInFrames={20}><Audio src={staticFile('sfx/thud.wav')} volume={i >= 2 && i <= 3 ? 0.9 : 0.6} /></Sequence>
      ))}
      {[at('03') + 30, at('03') + 52].map((s, i) => (
        <Sequence key={'cr' + i} from={s + 4} durationInFrames={50}><Audio src={staticFile('sfx/creak.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={at('04') + 40} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('05') + 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('08') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('09') + 50} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('10') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
