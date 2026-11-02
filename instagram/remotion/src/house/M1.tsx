import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {CH, FL1, FL2, M, W} from './House';
import {PBox} from './Geo';
import {Scene3D} from './Scene3D';
import {camTrack, Check3D, Person3D} from './Kit3D';
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

// もしも物理 M1：家の中で全員ジャンプしたら、2階の床は抜ける？（40秒）
// 0-60 疑問 / 60-300 ジャンプ / 300-540 床の中と計算 / 540-720 答え / 720-1020 ひとひねり（釘） / 1020-1200 締め
const ROOM = {x0: 0.1, x1: 4 * M - 0.1, y0: 0.1, y1: 4 * M - 0.1}; // 主寝室 約13㎡
const PEOPLE: [number, number, number][] = [
  [0.9, 0.9, 0],
  [1.9, 0.8, 7],
  [2.9, 1.0, 3],
  [0.9, 2.1, 11],
  [2.0, 2.2, 5],
  [3.0, 2.3, 9],
];
const outline = (w: number) => `${w}px ${w}px 0 #10161e, -${w}px ${w}px 0 #10161e, ${w}px -${w}px 0 #10161e, -${w}px -${w}px 0 #10161e, 0 ${w}px 0 #10161e, 0 -${w}px 0 #10161e, ${w}px 0 0 #10161e, -${w}px 0 0 #10161e`;

const cam = camTrack([
  [0, [5.0, 4.4, FL2 + 2.9], [1.8, 1.5, FL2 + 0.5], 54],
  [300, [4.8, 4.2, FL2 + 2.8], [1.8, 1.5, FL2 + 0.5], 56],
  // under the floor: the 1F ceiling is taken away to show the joists
  [312, [2.2, 4.4, FL1 + 1.0], [1.8, 1.6, FL2 - 0.2], 60],
  [530, [2.6, 4.2, FL1 + 1.0], [1.8, 1.6, FL2 - 0.2], 60],
  [540, [5.0, 4.4, FL2 + 2.9], [1.8, 1.5, FL2 + 0.5], 54],
  [716, [4.8, 4.2, FL2 + 2.8], [1.8, 1.5, FL2 + 0.5], 56],
  // close-up on the nails of the floor plywood
  [728, [1.0, 3.0, FL2 + 1.2], [1.0, 1.2, FL2], 52],
  [1016, [1.2, 2.8, FL2 + 1.0], [1.1, 1.1, FL2], 52],
  [1020, [W + 9, -14, 16], [4.5, 3.0, 3.6], 50],
  [1200, [W + 9.5, -14.5, 16.5], [4.5, 3.0, 3.6], 50],
]);

type Line = [number, number, string, string?];
// narration: [start, end, white text, orange text]
const TALK: Line[] = [
  [64, 150, '大人6人が、2階の寝室で', 'いっせいにジャンプ'],
  [150, 230, '着地のとき、床には', '体重の約2〜3倍の力'],
  [230, 300, 'これ、床は耐えられるのか？', ''],
  [312, 400, '床の下はこうなってる', '太い梁と、床をささえる横の木'],
  [400, 470, '6人×60kg×3倍＝', '約1,080kg'],
  [470, 536, '寝室は約13㎡なので', '1㎡あたり 約83kg'],
  [546, 630, '住宅の床は、1㎡あたり', '約180kg に耐えるよう計算する決まり'],
  [630, 716, '答え：', '抜けない（余裕あり）'],
  [728, 820, 'ただし、きしむ・たわむ床はある', ''],
  [820, 910, '原因の多くは、床の板を留める', '釘の間隔と本数'],
  [910, 1016, 'この釘は、床を張ったら', '二度と見られへん'],
];

const Narr: React.FC<{f: number}> = ({f}) => {
  const cur = TALK.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a, b, w, o] = cur;
  const k = ramp(f, a, a + 6) * (1 - ramp(f, b - 5, b));
  return (
    <div style={{position: 'absolute', top: 1150, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>
      <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.25}}>{w}</div>
      {o ? <div style={{fontSize: 74, fontWeight: 900, color: '#ff9a3c', textShadow: outline(5), lineHeight: 1.25, marginTop: 8}}>{o}</div> : null}
    </div>
  );
};

export const M1: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);
  const under = f >= 300 && f < 540;
  const nails = f >= 720 && f < 1020;
  const jumping = f >= 60 && f < 300;
  const hook = 1 - ramp(f, 54, 64);
  const stamp = ramp(f, 640, 652) * (1 - ramp(f, 708, 716));
  const end = ramp(f, 1026, 1040);
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
        {/* 2F oak floor in the bedroom (taken off for the nail close-up = before the floor is laid) */}
        {!nails ? <PBox x0={ROOM.x0} x1={ROOM.x1} y0={ROOM.y0} y1={ROOM.y1} h0={FL2 + 0.001} h1={FL2 + 0.012} m={{color: '#b98a5a', tex: 'oak', rough: 0.55}} cast={false} /> : null}
        {/* nails on the joist lines, every 15cm */}
        {nails
          ? [M, 2 * M, 4 * M - 0.06].flatMap((y, r) =>
              Array.from({length: 24}).map((_, i) => {
                const x = 0.12 + i * 0.15;
                const show = ramp(f, 740 + i * 2 + r * 10, 744 + i * 2 + r * 10);
                return show > 0 ? <PBox key={r + '_' + i} x0={x - 0.012} x1={x + 0.012} y0={y - 0.012} y1={y + 0.012} h0={FL2} h1={FL2 + 0.004} m={{color: '#3b3f44', rough: 0.3, metal: 0.6}} cast={false} /> : null;
              }),
            )
          : null}
        {f >= 960 && f < 1020 ? <Check3D p={[1.0, 1.82, FL2 + 0.5]} o={ramp(f, 962, 968)} size={0.3} /> : null}
        {PEOPLE.map(([x, y, ph], i) => {
          const t = jumping ? (f - 60 + ph) / 22 : 0;
          const jump = jumping ? Math.max(0, Math.sin(t * Math.PI)) * 0.32 : 0;
          if (nails) return null;
          const isUzu = i === 4;
          return (
            <Person3D key={i} x={x} y={y} h={FL2 + 0.012 + jump} yaw={40} act={jumping && jump > 0.05 ? 'wave' : 'idle'} f={f} phase={i * 3}
              suit={isUzu ? UZU.suit : ['#5a4a3a', '#3c5a78', '#7a3b3b', '#4d5f3c', '#2d3a4a', '#6a5a7a'][i]} vest={isUzu ? UZU.vest : undefined} uzu={isUzu} />
          );
        })}
      </Scene3D>
      {/* hook */}
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
        <div style={{fontSize: 74, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>家の中で 全員ジャンプしたら</div>
        <div style={{fontSize: 96, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>2階の床は抜ける？</div>
      </div>
      <Narr f={f} />
      {stamp > 0 ? (
        <div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', opacity: stamp, transform: `scale(${0.8 + 0.2 * stamp})`}}>
          <span style={{fontFamily: FONT, background: '#e8622c', color: '#fff', fontWeight: 900, fontSize: 88, padding: '16px 44px', borderRadius: 22, boxShadow: '0 12px 40px rgba(0,0,0,0.4)'}}>抜けない</span>
        </div>
      ) : null}
      {f >= 300 && f < 1020 ? (
        <div style={{position: 'absolute', bottom: 300, width: '100%', textAlign: 'center', fontFamily: FONT}}>
          <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です</span>
        </div>
      ) : null}
      {end > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 520, opacity: end, transform: `translateY(${(1 - end) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>床の釘は、床を張る前だけ見られる</div>
            <div style={{fontSize: 54, fontWeight: 900, color: '#10161e', marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#10161e', marginTop: 16}}>家建てる友だちに送ったって</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const M1_CH = CH;
