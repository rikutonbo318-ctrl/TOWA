import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {UZU, UzuFace} from './Uzu';
import {RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {Gaiko3D, PARK} from './Gaiko3D';
import {camTrack, Person3D} from './Kit3D';

// もしも物理 M2：台風でカーポートは飛ぶ？（40秒）
// 0-60 疑問 / 60-300 台風 / 300-540 図解：柱の根元 / 540-720 答え / 720-1020 ひとひねり（埋めたら見えない） / 1020-1200 締め
const outline = (w: number) => `${w}px ${w}px 0 #10161e, -${w}px ${w}px 0 #10161e, ${w}px -${w}px 0 #10161e, -${w}px -${w}px 0 #10161e, 0 ${w}px 0 #10161e, 0 -${w}px 0 #10161e, ${w}px 0 0 #10161e, -${w}px 0 0 #10161e`;

const cam = camTrack([
  [0, [6.4, -11.8, 1.7], [6.2, -1.5, 1.5], 58],
  [300, [5.6, -10.4, 1.7], [6.2, -1.5, 1.5], 58],
  [540, [8.4, -10.6, 2.3], [6.0, -1.5, 1.3], 56],
  [716, [7.8, -10.0, 2.1], [6.0, -1.5, 1.3], 56],
  [1020, [16.5, -13.5, 5.0], [5.5, 0.5, 1.6], 50],
  [1200, [17.0, -14.0, 5.3], [5.5, 0.5, 1.6], 50],
]);

type Line = [number, number, string, string?];
const TALK: Line[] = [
  [64, 150, '台風の風は、カーポートの屋根を', '下から持ち上げる'],
  [150, 230, 'よくあるカーポートは', '風速38m/sくらいが目安'],
  [230, 300, 'それ以上の風が来たら、飛ぶ？', ''],
  [312, 400, '怖いのは屋根より', '柱ごと引っこ抜けるパターン'],
  [400, 470, '柱は地面に', '約50cm 埋めてコンクリで固める'],
  [470, 536, 'ここが浅いと', '屋根より先に根元が負ける'],
  [546, 630, '飛ぶかどうかは、屋根より', '「柱の根元」で決まる'],
  [630, 716, '答え：', '根元しだい'],
  [728, 820, 'でも、この根元', '土間コンを打ったら二度と見られへん'],
  [820, 910, '穴の深さを見られるのは', '柱を立てる日だけ'],
  [910, 1016, 'その日にメジャーで', '深さを見せてもらおう'],
];

const Narr: React.FC<{f: number}> = ({f}) => {
  const cur = TALK.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a, b, w, o] = cur;
  const k = ramp(f, a, a + 6) * (1 - ramp(f, b - 5, b));
  return (
    <div style={{position: 'absolute', top: 1150, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>
      <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: outline(4), lineHeight: 1.25}}>{w}</div>
      {o ? <div style={{fontSize: 72, fontWeight: 900, color: '#ff9a3c', textShadow: outline(5), lineHeight: 1.25, marginTop: 8}}>{o}</div> : null}
    </div>
  );
};

// own carport so the roof can shake in the wind (posts on the house side, cantilever roof)
const POSTS = [PARK.x0 + 0.2, (PARK.x0 + PARK.x1) / 2, PARK.x1 - 0.2];
const Carport: React.FC<{tilt: number}> = ({tilt}) => {
  const zb = -(PARK.y1 - 0.15);
  const depth = PARK.y1 - PARK.y0 - 0.2;
  const cx = (PARK.x0 + PARK.x1) / 2;
  return (
    <group>
      {POSTS.map((px) => (
        <mesh key={px} position={[px, 1.2, zb]} castShadow>
          <boxGeometry args={[0.1, 2.4, 0.1]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <group position={[cx, 2.42, zb]} rotation={[tilt, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[PARK.x1 - PARK.x0 - 0.2, 0.14, 0.12]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.08, depth / 2 - 0.05]} castShadow receiveShadow>
          <boxGeometry args={[PARK.x1 - PARK.x0 + 0.1, 0.1, depth]} />
          <meshStandardMaterial color="#3a3f45" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

// 2D rain + wind streaks
const Rain: React.FC<{f: number; k: number}> = ({f, k}) => {
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: k, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(rgba(20,30,45,0.55), rgba(20,30,45,0.15) 60%, rgba(20,30,45,0.35))'}} />
      {Array.from({length: 90}).map((_, i) => {
        const sx = (i * 197) % 1300;
        const sp = 46 + (i % 7) * 6;
        const y = ((f * sp + i * 131) % 2200) - 200;
        const x = sx - (y * 0.45) % 1400 + 200;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 70 + (i % 4) * 20, background: 'rgba(220,230,245,0.55)', transform: 'rotate(24deg)', borderRadius: 2}} />;
      })}
      {Array.from({length: 7}).map((_, i) => {
        const y = 300 + i * 150;
        const x = ((f * 38 + i * 420) % 1800) - 600;
        return <div key={'w' + i} style={{position: 'absolute', left: x, top: y, width: 380, height: 6, borderRadius: 6, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />;
      })}
    </AbsoluteFill>
  );
};

const ink = '#10161e';
// ground cross-section of one post: depth in metres (0.5 = OK), lift = how far it is pulled up (m)
export const PostCut: React.FC<{cx: number; depth: number; lift: number; label: string; ok?: boolean; arrow?: number; slab?: number; hole?: number; conc?: number; q?: number}> = ({cx, depth, lift, label, ok, arrow = 1, slab = 0, hole = 1, conc = 1, q = 0}) => {
  const S = 520; // px per metre
  const G = 560; // ground line
  const d = depth * S;
  const up = lift * S;
  return (
    <g>
      {/* hole */}
      <rect x={cx - 95} y={G} width={190} height={(d + 30) * hole} fill="#6b5236" />
      {/* concrete block + post */}
      <g transform={`translate(0 ${-up})`} opacity={conc > 0 ? 1 : 0}>
        <rect x={cx - 80} y={G + (d + 20) * (1 - conc) - 4} width={160} height={(d + 20) * conc + 4} fill="#bdb8ae" stroke="#8c877e" strokeWidth={3} />
      </g>
      <g transform={`translate(0 ${-up})`}>
        <rect x={cx - 20} y={G - 380} width={40} height={380 + d} fill="#d4d8dc" stroke="#8f959b" strokeWidth={3} />
      </g>
      {/* slab on top */}
      {slab > 0 ? <rect x={cx - 230} y={G - 40 * slab} width={460} height={40 * slab} fill="#d7d4cd" stroke="#a9a59c" strokeWidth={3} /> : null}
      {/* depth arrow */}
      {arrow > 0 ? (
        <g opacity={arrow}>
          <line x1={cx + 140} y1={G} x2={cx + 140} y2={G + d} stroke={ok ? '#ff9a3c' : '#e8622c'} strokeWidth={8} />
          <polygon points={`${cx + 124},${G + 22} ${cx + 156},${G + 22} ${cx + 140},${G}`} fill={ok ? '#ff9a3c' : '#e8622c'} />
          <polygon points={`${cx + 124},${G + d - 22} ${cx + 156},${G + d - 22} ${cx + 140},${G + d}`} fill={ok ? '#ff9a3c' : '#e8622c'} />
          <text x={cx + 170} y={G + d / 2 + 16} fontSize={46} fontWeight={900} fill={ink} fontFamily={FONT}>{ok ? '約50cm' : '浅い'}</text>
        </g>
      ) : null}
      {q > 0 ? <text x={cx} y={G + 160} textAnchor="middle" fontSize={140} fontWeight={900} fill="#ffd34d" stroke={ink} strokeWidth={6} opacity={q} fontFamily={FONT}>？</text> : null}
      <text x={cx} y={G - 420 - up} textAnchor="middle" fontSize={50} fontWeight={900} fill={ok ? '#2e7d4f' : '#c0392b'} fontFamily={FONT}>{label}</text>
    </g>
  );
};

const Diagram: React.FC<{f: number}> = ({f}) => {
  const k = ramp(f, 300, 312) * (1 - ramp(f, 532, 540));
  if (k <= 0) return null;
  const pull = f < 400 ? ramp(f, 330, 392) : 0; // one post pulled out with its roof
  const split = ramp(f, 470, 482);
  const ngLift = ramp(f, 490, 530) * 0.32;
  return (
    <AbsoluteFill style={{opacity: k}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 36.5%, #8a6a46 36.5%, #7a5b3b)'}} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
        <g transform="translate(0 140)">
          {f < 400 ? (
            <g transform={`translate(0 ${-pull * 120}) rotate(${-pull * 8} 540 180)`}>
              {/* side view: post + cantilever roof */}
              <rect x={330} y={180} width={36} height={380} fill="#d4d8dc" stroke="#8f959b" strokeWidth={3} />
              <rect x={300} y={160} width={480} height={26} fill="#3a3f45" />
              <rect x={290} y={556} width={116} height={90} fill="#bdb8ae" stroke="#8c877e" strokeWidth={3} opacity={pull > 0.05 ? 1 : 0} />
            </g>
          ) : null}
          {f < 400
            ? [0, 1, 2].map((i) => {
                const x = 360 + i * 150;
                const y = 330 - ((f * 6 + i * 40) % 120);
                return (
                  <g key={i} opacity={0.9}>
                    <line x1={x} y1={y + 120} x2={x} y2={y} stroke="#2f80ed" strokeWidth={12} />
                    <polygon points={`${x - 26},${y + 10} ${x + 26},${y + 10} ${x},${y - 30}`} fill="#2f80ed" />
                  </g>
                );
              })
            : null}
          {f < 400 ? <text x={540} y={10} textAnchor="middle" fontSize={56} fontWeight={900} fill="#2f80ed" fontFamily={FONT}>風が下から持ち上げる</text> : null}
          {f >= 400 && split < 1 ? <g opacity={1 - split}><PostCut cx={480} depth={0.5} lift={0} label="柱の根元" ok /></g> : null}
          {split > 0 ? (
            <g opacity={split}>
              <PostCut cx={270} depth={0.5} lift={0} label="しっかり" ok />
              <PostCut cx={760} depth={0.22} lift={ngLift} label="浅い" />
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// the twist: hole → post → concrete → slab, then the depth can no longer be seen
const Bury: React.FC<{f: number}> = ({f}) => {
  const k = ramp(f, 720, 732) * (1 - ramp(f, 1012, 1020));
  if (k <= 0) return null;
  const hole = ramp(f, 736, 770);
  const post = ramp(f, 770, 790);
  const conc = ramp(f, 790, 816);
  const slab = ramp(f, 830, 856);
  const arrow = ramp(f, 760, 770) * (1 - ramp(f, 860, 876)) + ramp(f, 920, 934);
  const q = ramp(f, 870, 884) * (1 - ramp(f, 912, 920));
  const steps = ['① 穴を掘る', '② 柱を立てて固める', '③ 土間コンを打つ'];
  const at = f < 790 ? 0 : f < 830 ? 1 : 2;
  const back = f >= 910; // rewind: the day the post goes in
  return (
    <AbsoluteFill style={{opacity: k}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#cfe0ee, #eaf1f6 36.5%, #8a6a46 36.5%, #7a5b3b)'}} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', top: 0, left: 0}}>
        <g transform="translate(40 140)">
          {post > 0 || back ? (
            <PostCut cx={460} depth={0.5} lift={back ? 0 : (1 - post) * 0.9} label={back ? 'この日だけ見られる' : ''} ok arrow={back ? arrow : arrow} slab={back ? 0 : slab} hole={1} conc={back ? 0 : conc} q={q} />
          ) : (
            <g>
              <rect x={365} y={560} width={190} height={290 * hole} fill="#6b5236" />
              <g opacity={arrow}>
                <line x1={600} y1={560} x2={600} y2={560 + 260 * hole} stroke="#ff9a3c" strokeWidth={8} />
                <text x={630} y={560 + 140 * hole} fontSize={46} fontWeight={900} fill={ink} fontFamily={FONT}>約50cm</text>
              </g>
            </g>
          )}
          {back ? (
            <g opacity={ramp(f, 940, 952)}>
              {/* measuring tape held in the hole */}
              <rect x={378} y={540} width={26} height={300} fill="#ffd34d" stroke="#b38f00" strokeWidth={3} />
              {Array.from({length: 6}).map((_, i) => (
                <line key={i} x1={378} y1={560 + i * 52} x2={396} y2={560 + i * 52} stroke={ink} strokeWidth={4} />
              ))}
              <circle cx={250} cy={360} r={70} fill="#2e7d4f" />
              <text x={250} y={392} textAnchor="middle" fontSize={90} fontWeight={900} fill="#fff" fontFamily={FONT}>✓</text>
            </g>
          ) : null}
        </g>
      </svg>
      {!back ? (
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, fontFamily: FONT}}>
          {steps.map((s, i) => (
            <div key={s} style={{fontSize: 34, fontWeight: 900, padding: '8px 16px', borderRadius: 12, background: i === at ? '#e8622c' : 'rgba(16,22,30,0.55)', color: '#fff'}}>{s}</div>
          ))}
        </div>
      ) : (
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <span style={{fontSize: 46, fontWeight: 900, padding: '10px 26px', borderRadius: 14, background: '#2e7d4f', color: '#fff'}}>柱を立てる日</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const M2: React.FC = () => {
  const f = useCurrentFrame();
  const a = useAssets();
  const c = cam(f);
  const storm = f < 300 ? 1 : f < 540 ? 0 : f < 720 ? 1 - ramp(f, 640, 700) * 0.7 : 0;
  const gust = f < 300 ? ramp(f, 60, 200) : 0.3;
  const tilt = -(0.012 + 0.03 * gust) * (0.5 + 0.5 * Math.sin(f * 0.55)) * (f < 720 ? storm : 0);
  const hook = 1 - ramp(f, 54, 64);
  const stamp = ramp(f, 640, 652) * (1 - ramp(f, 708, 716));
  const end = ramp(f, 1026, 1040);
  if (!a) return null;
  return (
    <AbsoluteFill style={{background: '#10161e'}}>
      <RealScene assets={a} cam={c} exposure={f < 300 ? 0.62 : f < 720 ? 0.62 + 0.38 * ramp(f, 640, 700) : 1.0} sun={f < 300 ? 0.5 : f < 720 ? 0.5 + 1.9 * ramp(f, 640, 700) : 2.4}>
        <House3D />
        <Gaiko3D noCarport cars />
        <Carport tilt={tilt} />
        <Person3D x={9.9} y={-6.4} yaw={265} act={f >= 546 && f < 716 ? 'wave' : 'idle'} f={f} suit={UZU.suit} vest={UZU.vest} uzu />
      </RealScene>
      <Rain f={f} k={storm} />
      <Diagram f={f} />
      <Bury f={f} />
      {/* hook */}
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: hook}}>
        <div style={{fontSize: 80, fontWeight: 900, color: '#fff', textShadow: outline(5), lineHeight: 1.25}}>台風で</div>
        <div style={{fontSize: 104, fontWeight: 900, color: '#ffd34d', textShadow: outline(6), marginTop: 10}}>カーポートは飛ぶ？</div>
      </div>
      <Narr f={f} />
      {stamp > 0 ? (
        <div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', opacity: stamp, transform: `scale(${0.8 + 0.2 * stamp})`}}>
          <span style={{fontFamily: FONT, background: '#e8622c', color: '#fff', fontWeight: 900, fontSize: 88, padding: '16px 44px', borderRadius: 22, boxShadow: '0 12px 40px rgba(0,0,0,0.4)'}}>柱の根元しだい</span>
        </div>
      ) : null}
      {f >= 60 && f < 1020 ? (
        <div style={{position: 'absolute', bottom: 300, width: '100%', textAlign: 'center', fontFamily: FONT}}>
          <span style={{background: 'rgba(16,22,30,0.7)', color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 16px', borderRadius: 10}}>AI・CGのイメージです　数字は一般的な目安です（商品・地域で変わります）</span>
        </div>
      ) : null}
      {end > 0 ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 480, opacity: end, transform: `translateY(${(1 - end) * 30}px)`, fontFamily: FONT}}>
          <div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: '34px 30px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 14}}>
              <UzuFace size={150} nod={Math.abs(Math.sin(f / 6))} />
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#e8622c'}}>柱の根元は、土間コンの前だけ見られる</div>
            <div style={{fontSize: 54, fontWeight: 900, color: ink, marginTop: 8, lineHeight: 1.3}}>「チェック」とコメントで<br />見に行く日のリスト送るで</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 16}}>カーポート・外構の相談はDMで</div>
            <div style={{fontSize: 38, fontWeight: 800, color: ink, marginTop: 8}}>家建てる友だちに送ったって</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
