import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {CH, FL1, FL2, M, W} from './House';
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
import DUR from '../../public/voice/M1b/durations.json';
import LINES from '../../../narration/M1b.json';

// もしも物理 M1（作り直し・約60秒・ナレーション入り）
// 6人 → 50人 → ミシミシ → 「ちゃんと作ってあれば」→ 配管で切られたはりが折れる → 天井を張る前に見に行こう
const FPS = 30;
type Ln = {id: string; text: string};
const lines = LINES as Ln[];
const dur = DUR as Record<string, number>;
// extra pause after a line (seconds): room for the jump, the count-up and the collapse
const PAUSE: Record<string, number> = {'01': 0.3, '02': 1.6, '03': 0.4, '04': 0.4, '05': 1.4, '06': 0.6, '07': 0.4, '08': 0.3, '09': 2.4, '10': 0.4, '11': 1.0};
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
export const M1B_FRAMES = end('11') + Math.round((PAUSE['11'] ?? 1) * FPS) + 30;

const ROOM = {x0: 0.1, x1: 4 * M - 0.1, y0: 0.1, y1: 4 * M - 0.1};
const SIX: [number, number][] = [[0.9, 0.9], [1.9, 0.8], [2.9, 1.0], [0.9, 2.1], [2.0, 2.2], [3.0, 2.3]];
const CROWD: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) out.push([0.45 + i * 0.47, 0.4 + j * 0.47]);
  out.push([3.3, 3.3]);
  return out;
})();
const SUITS = ['#e8e4dc', '#3c5a78', '#b8574a', '#6f8a5c', '#2d3a4a', '#c9a96e', '#9a8fb5', '#5f6b75'];
const HAIR = ['#1f2a3a', '#1a1a1a', '#d9cdb5', '#5a1f1f', '#3d4a3a'];
const PANTS = ['#2c3442', '#4a4e57', '#5b4a3a', '#1f2833', '#6b6f78'];
const outline = (w: number) => `${w}px ${w}px 0 #10161e, -${w}px ${w}px 0 #10161e, ${w}px -${w}px 0 #10161e, -${w}px -${w}px 0 #10161e, 0 ${w}px 0 #10161e, 0 -${w}px 0 #10161e, ${w}px 0 0 #10161e, -${w}px 0 0 #10161e`;

// featured beam under the bedroom, notched for a drain pipe
const BY = 1.95;
const BX0 = 0.2;
const BX1 = 3.45;
const NX = 1.82; // notch centre
const BH0 = FL2 - 0.33;
const BH1 = FL2 - 0.03;
const wood = {color: '#c99a62', tex: 'lumber', rough: 0.7} as const;

const Beam: React.FC<{drop: number}> = ({drop}) => {
  const th = drop * 0.5; // radians
  const piece = (x0: number, x1: number, pivot: number, sign: number) => (
    <group position={[pivot, BH1, -BY]} rotation={[0, 0, sign * th]}>
      <group position={[-pivot, -BH1, BY]}>
        <PBox x0={x0} x1={x1} y0={BY - 0.06} y1={BY + 0.06} h0={BH0} h1={BH1} m={wood} />
      </group>
    </group>
  );
  return (
    <group>
      {piece(BX0, NX - 0.05, BX0, -1)}
      {piece(NX + 0.05, BX1, BX1, 1)}
      {/* the notch: only a thin strip of the beam is left over the pipe */}
      {drop < 0.05 ? <PBox x0={NX - 0.05} x1={NX + 0.05} y0={BY - 0.06} y1={BY + 0.06} h0={BH1 - 0.07} h1={BH1} m={wood} /> : null}
      {/* drain pipe through the notch */}
      <PBox x0={NX - 0.035} x1={NX + 0.035} y0={0.6} y1={3.2} h0={BH0 + 0.03 - drop * 0.6} h1={BH0 + 0.1 - drop * 0.6} m={{color: '#9aa0a4', rough: 0.5}} />
      {/* the floor above gives way */}
      {drop > 0 ? <PBox x0={1.0} x1={2.6} y0={1.3} y1={2.6} h0={FL2 - 0.03 - drop * 0.9} h1={FL2 - 0.005 - drop * 0.9} m={{color: '#b48b5c', tex: 'lumber', rough: 0.7}} /> : null}
    </group>
  );
};

export const M1b: React.FC = () => {
  const f = useCurrentFrame();
  // phases
  const under = (f >= at('04') && f < end('04') + 12) || (f >= at('09') && f < at('10'));
  const crowd = f >= at('05') + 20;
  const jumping = f < at('05') || (f >= at('06') && f < at('08'));
  const frozen = f >= at('08') && f < at('09');
  const crashAt = end('09') + 4;
  const crash = f >= crashAt && f < at('10');
  const drop = crash ? Math.min(1, ramp(f, crashAt, crashAt + 24) * 1.0) : f >= at('10') ? 1 : 0;
  const creak = f >= at('07') && f < at('08');
  // camera shake on landings, the creaking and the collapse
  const land = jumping ? Math.max(0, Math.sin(((f - at('02')) / 22) * Math.PI * 2 + 1.2)) : 0;
  const shakeAmp = (jumping ? 0.012 * land * (crowd ? 2.2 : 1) : 0) + (creak ? 0.02 : 0) + (crash ? 0.08 * (1 - ramp(f, crashAt, crashAt + 50)) : 0);
  const sh = (k: number) => Math.sin(f * 2.7 + k) * shakeAmp;

  const ROOMCAM: [number, [number, number, number], [number, number, number], number][] = [];
  const cam = camTrack([
    [0, [5.0, 4.4, FL2 + 2.9], [1.8, 1.5, FL2 + 0.5], 54],
    [at('02'), [4.9, 4.3, FL2 + 2.8], [1.8, 1.5, FL2 + 0.5], 55],
    [at('03'), [5.0, 4.3, FL2 + 2.4], [1.8, 1.5, FL2 + 0.4], 52],
    [at('04') - 1, [4.9, 4.2, FL2 + 2.3], [1.8, 1.5, FL2 + 0.4], 52],
    [at('04'), [2.2, 4.4, FL1 + 1.0], [1.8, 1.6, FL2 - 0.2], 60],
    [end('04') + 11, [2.6, 4.2, FL1 + 1.0], [1.8, 1.6, FL2 - 0.2], 60],
    [end('04') + 12, [5.1, 4.4, FL2 + 2.6], [1.8, 1.6, FL2 + 0.1], 54],
    [at('06'), [5.05, 4.35, FL2 + 2.55], [1.8, 1.6, FL2 + 0.2], 54],
    [at('07'), [5.0, 4.3, FL2 + 2.5], [1.8, 1.6, FL2 + 0.2], 54],
    [at('09') - 1, [4.9, 4.2, FL2 + 2.4], [1.8, 1.6, FL2 + 0.2], 54],
    [at('09'), [NX + 1.2, 0.45, FL1 + 1.3], [NX, BY, BH0 + 0.1], 50],
    [crashAt, [NX + 1.1, 0.55, FL1 + 1.3], [NX, BY, BH0 + 0.1], 50],
    [at('10') - 1, [NX + 1.2, 0.4, FL1 + 1.2], [NX, BY, BH0 - 0.2], 56],
    [at('10'), [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
    [M1B_FRAMES, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
  ]);
  void ROOMCAM;
  const c0 = cam(f);
  const c = {...c0, pos: [c0.pos[0] + sh(0), c0.pos[1] + sh(1.3), c0.pos[2] + sh(2.1)] as [number, number, number]};

  const people = crowd ? CROWD : SIX;
  const sag = creak ? 0.025 * (0.5 + 0.5 * Math.sin(f * 0.9)) : 0;
  const showPeople = !under && f < at('10');
  const hook = 1 - ramp(f, end('01') - 4, end('01') + 4);
  const cur = lines.find((l) => f >= T[l.id][0] && f < T[l.id][1] + 6);
  const big = (n: string) => (
    <div style={{fontFamily: FONT, fontSize: 132, fontWeight: 900, color: '#ffd34d', textShadow: outline(7), textAlign: 'center'}}>{n}</div>
  );
  const count = f < at('05') ? 6 : Math.round(6 + 44 * ramp(f, at('05') + 10, at('05') + 50));
  const ton = f >= at('03') && f < end('03') + 10 ? '約1トン' : f >= at('06') && f < end('06') + 10 ? '約9トン' : null;
  const endCard = ramp(f, at('11') + 6, at('11') + 20);
  const flash = crash ? 1 - ramp(f, crashAt, crashAt + 10) : 0;
  const red = creak ? 0.18 + 0.1 * Math.sin(f * 0.6) : 0;

  return (
    <AbsoluteFill style={{background: '#10161e'}}>
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
        <Board3D s={{ceil: under ? 0 : 1, base: 1, wall1: 1, wall2: 1, floor: 1, cover: 0}} />
        <Carp3D s={{run1: 1, run2: 1, rail: 1, casing: 1, skirting: 1}} />
        <Cloth3D s={{putty: 0, ceil: under ? 0 : 1, wall1: 1, accent: 1, wall2: 1}} />
        <Kitchen3D s={{pipe: 0, cab: 1, top: 1, hood: 1, tap: 1}} />
        <PBox x0={ROOM.x0} x1={ROOM.x1} y0={ROOM.y0} y1={ROOM.y1} h0={FL2 + 0.001 - sag} h1={FL2 + 0.012 - sag} m={{color: '#b98a5a', tex: 'oak', rough: 0.55}} cast={false} />
        {f >= at('09') && f < at('10') ? <Beam drop={drop} /> : null}
        {f >= at('09') + 20 && f < crashAt ? <Ring3D p={[NX, BY - 0.07, BH0 + 0.06]} o={ramp(f, at('09') + 20, at('09') + 26)} f={f} r={0.13} /> : null}
        {showPeople
          ? people.map(([x, y], i) => {
              const ph = (i * 7) % 22;
              const t = jumping ? (f - at('02') + ph) / 22 : frozen ? 0.5 : 0;
              const jump = jumping || frozen ? Math.max(0, Math.sin(t * Math.PI)) * 0.3 : 0;
              const isUzu = !crowd && i === 4;
              return (
                <Person3D key={i} x={x} y={y} h={FL2 + 0.012 - sag + jump} yaw={40 + ((i * 37) % 40) - 20} act={(jumping || frozen) && jump > 0.05 ? 'wave' : 'idle'} f={frozen ? at('08') : f} phase={i * 3}
                  suit={isUzu ? UZU.suit : SUITS[i % SUITS.length]} pants={isUzu ? undefined : PANTS[i % PANTS.length]} vest={isUzu ? UZU.vest : undefined} uzu={isUzu} casual={!isUzu} helmet={HAIR[i % HAIR.length]} />
              );
            })
          : null}
      </Scene3D>
      {/* grade: vignette, red pulse while creaking, grey freeze, white flash on the collapse */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {red > 0 ? <AbsoluteFill style={{background: `rgba(200,30,20,${red})`, mixBlendMode: 'multiply'}} /> : null}
      {frozen ? <AbsoluteFill style={{backdropFilter: 'grayscale(1)', background: 'rgba(20,24,30,0.25)'}} /> : null}
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} /> : null}
      {crash
        ? Array.from({length: 26}).map((_, i) => {
            const k = ramp(f, crashAt + 4, crashAt + 60);
            const x = 540 + Math.cos(i * 2.4) * (120 + 380 * k) * ((i % 3) + 1) / 2;
            const y = 900 + Math.sin(i * 1.7) * 160 + 420 * k * ((i % 4) / 3);
            const r = 60 + (i % 5) * 30 + 120 * k;
            return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'rgba(200,185,160,0.35)', filter: 'blur(30px)', opacity: 1 - k * 0.6}} />;
          })
        : null}
      {/* hook */}
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
          <div style={{fontSize: 76, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>家の中で 全員ジャンプしたら</div>
          <div style={{fontSize: 100, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>2階の床は抜ける？</div>
        </div>
      ) : null}
      {/* people counter */}
      {f >= at('02') && f < at('08') && !under ? (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0}}>
          {big(`${count}人`)}
          {ton ? <div style={{fontFamily: FONT, fontSize: 70, fontWeight: 900, color: '#fff', textShadow: outline(5), textAlign: 'center'}}>{ton}</div> : null}
        </div>
      ) : null}
      {f >= at('04') && f < end('04') + 10 ? (
        <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 60, fontWeight: 900, color: '#fff', textShadow: outline(5)}}>床が耐える力（計算）</div>
          <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6)}}>約180kg/㎡</div>
        </div>
      ) : null}
      {f >= at('10') && f < at('11') ? (
        <div style={{position: 'absolute', top: 200, left: 50, right: 50, fontFamily: FONT, display: 'flex', gap: 24, opacity: ramp(f, at('10'), at('10') + 10)}}>
          {[
            {ok: false, t: 'はりを切って配管', d: '強さが大きく落ちる'},
            {ok: true, t: 'はりを避けて配管', d: '設計どおりの強さ'},
          ].map((b) => (
            <div key={b.t} style={{flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '22px 16px', textAlign: 'center', borderTop: `14px solid ${b.ok ? '#2e7d4f' : '#c0392b'}`}}>
              <div style={{fontSize: 80, fontWeight: 900, color: b.ok ? '#2e7d4f' : '#c0392b'}}>{b.ok ? 'OK' : 'NG'}</div>
              <svg width={300} height={150} viewBox="0 0 300 150">
                <rect x={10} y={30} width={280} height={60} fill="#c99a62" />
                {b.ok ? null : <rect x={130} y={60} width={40} height={30} fill="#fff" />}
                <rect x={136} y={b.ok ? 104 : 64} width={28} height={28} rx={14} fill="#8e9295" />
                {b.ok ? null : <path d="M150 30 L142 50 L156 58 L148 75" stroke="#c0392b" strokeWidth={5} fill="none" />}
              </svg>
              <div style={{fontSize: 44, fontWeight: 900, color: '#10161e'}}>{b.t}</div>
              <div style={{fontSize: 34, fontWeight: 800, color: '#555'}}>{b.d}</div>
            </div>
          ))}
        </div>
      ) : null}
      {/* narration subtitle */}
      {cur && f < at('11') && cur.id !== '01' ? (
        <div style={{position: 'absolute', top: 1180, left: 50, right: 50, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 56, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.35}}>{cur.text.replace(/はり/g, '梁（はり）').replace('チェック、とコメント', '「チェック」とコメント')}</div>
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
            <div style={{fontSize: 42, fontWeight: 800, color: '#e8622c'}}>梁は、天井を張る前だけ見られる</div>
            <div style={{fontSize: 54, fontWeight: 900, color: '#10161e', marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#10161e', marginTop: 16}}>家建てる友だちに送ったって</div>
          </div>
        </div>
      ) : null}
      {/* narration + sound effects */}
      {lines.map((l) => (
        <Sequence key={l.id} from={at(l.id)}>
          <Audio src={staticFile(`voice/M1b/${l.id}.wav`)} />
        </Sequence>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Sequence key={'th' + k} from={at('02') + 15 + 11 + k * 22} durationInFrames={20}>
          <Audio src={staticFile('sfx/thud.wav')} volume={0.5} />
        </Sequence>
      ))}
      {[0, 1, 2].map((k) => (
        <Sequence key={'tc' + k} from={at('06') + 11 + k * 22} durationInFrames={20}>
          <Audio src={staticFile('sfx/thud.wav')} volume={0.9} />
        </Sequence>
      ))}
      <Sequence from={at('04') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={at('05') + 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      {Array.from({length: 12}).map((_, k) => (
        <Sequence key={'tk' + k} from={at('05') + 12 + k * 3} durationInFrames={4}><Audio src={staticFile('sfx/tick.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={at('07')} durationInFrames={60}><Audio src={staticFile('sfx/creak.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('07') + 50} durationInFrames={60}><Audio src={staticFile('sfx/creak.wav')} volume={0.8} /></Sequence>
      <Sequence from={at('08')} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.6} /></Sequence>
      <Sequence from={at('09') - 6} durationInFrames={20}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={crashAt - 2} durationInFrames={20}><Audio src={staticFile('sfx/crack.wav')} volume={1} /></Sequence>
      <Sequence from={crashAt + 6} durationInFrames={70}><Audio src={staticFile('sfx/boom.wav')} volume={1} /></Sequence>
      <Sequence from={at('11') + 6} durationInFrames={20}><Audio src={staticFile('sfx/hit.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};

export const M1B_CH = CH;
