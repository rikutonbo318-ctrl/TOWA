import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Action, clamp, FONT, ramp, Worker} from './Mokuzou';

const P = (x: number, z: number, h = 0): [number, number] => [150 + x + z * 0.45, 1500 - z * 0.8 - h];
const pts = (a: [number, number][]) => a.map(([x, y]) => `${x},${y}`).join(' ');
const FP = {x0: 60, x1: 540, z0: 60, z1: 240};
const HB = -37;
const HT = 60; // foundation top
const H1 = HT + 16; // 1F floor level (top of sill/plywood)
const H2 = H1 + 190; // 2F floor beam top
const H3 = H2 + 180; // eaves beam top
const HR = H3 + 90; // ridge

const Box: React.FC<{x0: number; x1: number; z0: number; z1: number; hb: number; ht: number; front: string; side: string; top: string; dy?: number; opacity?: number}> = ({x0, x1, z0, z1, hb, ht, front, side, top, dy = 0, opacity = 1}) => (
  <g opacity={opacity} transform={`translate(0,${dy})`}>
    <polygon points={pts([P(x1, z0, hb), P(x1, z1, hb), P(x1, z1, ht), P(x1, z0, ht)])} fill={side} />
    <polygon points={pts([P(x0, z0, hb), P(x1, z0, hb), P(x1, z0, ht), P(x0, z0, ht)])} fill={front} />
    <polygon points={pts([P(x0, z0, ht), P(x1, z0, ht), P(x1, z1, ht), P(x0, z1, ht)])} fill={top} />
  </g>
);
const WOOD = {front: '#d9a466', side: '#bf8a4f', top: '#e9bd84'};
const CONC = {front: '#a9a9a3', side: '#999993', top: '#c9c9c3'};

const WALLS: [number, number, number, number][] = [
  [FP.x0, FP.z1, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x0, FP.z1],
  [300, FP.z0, 300, FP.z1],
  [FP.x1, FP.z0, FP.x1, FP.z1],
  [FP.x0, FP.z0, FP.x1, FP.z0],
];
const lineBox = ([x0, z0, x1, z1]: [number, number, number, number], t: number) =>
  z0 === z1 ? {x0: x0 - t, x1: x1 + t, z0: z0 - t, z1: z0 + t} : {x0: x0 - t, x1: x0 + t, z0: z0 - t, z1: z1 + t};

// columns, back row first
const COLS: [number, number][] = [
  ...[60, 180, 300, 420, 540].map((x) => [x, 240] as [number, number]),
  [60, 150],
  [300, 150],
  [540, 150],
  ...[60, 180, 300, 420, 540].map((x) => [x, 60] as [number, number]),
];

const CAM: [number, number, number, number][] = [
  [0, 540, 1260, 1.25],
  [45, 540, 1260, 1.25],
  [56, 520, 1400, 1.6],
  [86, 520, 1400, 1.6],
  [92, 250, 1420, 2.6],
  [112, 250, 1420, 2.6],
  [120, 520, 1400, 1.6],
  [142, 520, 1400, 1.6],
  [148, 380, 1400, 2.5],
  [170, 380, 1400, 2.5],
  [178, 520, 1400, 1.6],
  [202, 520, 1400, 1.6],
  [208, 330, 1390, 2.5],
  [230, 330, 1390, 2.5],
  [240, 600, 1250, 1.2],
  [268, 600, 1250, 1.2],
  [276, 520, 1300, 2.0],
  [298, 520, 1300, 2.0],
  [306, 600, 1250, 1.2],
  [338, 600, 1250, 1.2],
  [344, 330, 1230, 2.3],
  [366, 330, 1230, 2.3],
  [374, 600, 1200, 1.15],
  [430, 600, 1180, 1.15],
  [440, 470, 1020, 2.0],
  [462, 470, 1020, 2.0],
  [472, 560, 1200, 1.12],
  [600, 560, 1200, 1.12],
];
const camAt = (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f > CAM[i + 1][0]) i++;
  const [fa, xa, ya, za] = CAM[i];
  const [fb, xb, yb, zb] = CAM[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: xa + (xb - xa) * t, y: ya + (yb - ya) * t, z: za + (zb - za) * t};
};

const STEPS: [number, number, string, string, boolean][] = [
  [45, 115, '土台敷き', '基礎パッキンを敷き、土台をボルトで留める', false],
  [115, 175, '大引・鋼製束', '床を支える大引を、束で高さを合わせて支える', false],
  [175, 235, '床の合板', '厚い合板を敷き並べ、釘で留める', false],
  [235, 320, '建方（鳶さん・レッカー）', '足場を組み、クレーンで柱を吊って立てる', true],
  [320, 400, '梁・2階', '梁を架けて掛矢で納め、2階へ', false],
  [400, 470, '上棟', '屋根の一番上、棟木が上がる', false],
  [470, 600, '次回：屋根と構造', '垂木・野地板・金物・耐力壁へ', false],
];
const Caption: React.FC<{f: number}> = ({f}) => {
  const idx = STEPS.findIndex(([a, b]) => f >= a && f < b);
  if (idx < 0) return null;
  const [a, , title, sub, point] = STEPS[idx];
  const o = ramp(f, a, a + 8);
  const num = idx < 6 ? `${idx + 1}/6 ` : '';
  return (
    <div style={{position: 'absolute', top: 235, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: FONT}}>
      <div style={{background: point ? '#2f8f5b' : '#e8622c', color: '#fff', fontWeight: 900, fontSize: point ? 52 : 60, padding: '8px 30px', borderRadius: 14}}>
        <span style={{fontSize: 40, marginRight: 12}}>{num}</span>
        {title}
      </div>
      <div style={{marginTop: 14, background: 'rgba(16,22,30,0.86)', color: '#fff', fontWeight: 700, fontSize: 36, padding: '10px 24px', borderRadius: 12}}>{sub}</div>
    </div>
  );
};

export const Daiku1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(f);
  const drop = (start: number) => (1 - Math.min(1, spring({frame: f - start, fps, config: {damping: 14, stiffness: 110}}))) * -380;
  const shown = (start: number) => (f >= start ? 1 : 0);

  const packing = ramp(f, 48, 58);
  const sills = WALLS.map((_, i) => ramp(f, 58 + i * 6, 70 + i * 6));
  const joists = [120, 180, 240, 360, 420, 480].map((_, i) => ramp(f, 124 + i * 5, 132 + i * 5));
  const sheets = Array.from({length: 8}).map((_, i) => ramp(f, 182 + i * 5, 188 + i * 5));
  const crane = ramp(f, 236, 248) * (1 - ramp(f, 520, 534));
  const colStart = (i: number) => 250 + i * 4;
  const beam2Start = (i: number) => 322 + i * 4;
  const floor2 = ramp(f, 358, 372);
  const col2Start = (i: number) => 372 + i * 2;
  const eaveStart = (i: number) => 402 + i * 3;
  const ridgePost = ramp(f, 416, 424);
  const ridgeStart = 426;
  const rafters = ramp(f, 440, 460);
  const joto = ramp(f, 452, 460) * (1 - ramp(f, 520, 530));
  const cta = ramp(f, 556, 570);
  const hook = 1 - ramp(f, 36, 46);

  // current crane load target (screen)
  let load: [number, number] = P(300, 150, H2);
  if (f < 320) {
    const i = Math.max(0, Math.min(COLS.length - 1, Math.floor((f - 250) / 4)));
    load = P(COLS[i][0], COLS[i][1], H2 + 10 + drop(colStart(i)) * -1);
  } else if (f < 372) {
    load = P(300, 150, H2 + 10 + drop(330) * -1);
  } else if (f < 426) {
    load = P(300, 150, H3 + 10 + drop(410) * -1);
  } else {
    load = P(300, 150, HR + 10 + drop(ridgeStart) * -1);
  }
  const truck = P(760, 150);

  type W = {x: number; y: number; act: Action; flip?: boolean};
  const on = (x: number, z: number, h: number, act: Action, flip = false): W => {
    const [sx, sy] = P(x, z, h);
    return {x: sx, y: sy, act, flip};
  };
  let A: W = on(-60, 30, 0, 'walk');
  let B: W = on(640, 30, 0, 'walk', true);
  let C: W | null = null;
  if (f < 45) {
    A = on(-80 + 120 * ramp(f, 6, 40), 30, 0, 'walk');
    B = on(700 - 120 * ramp(f, 6, 40), 30, 0, 'walk', true);
  } else if (f < 115) {
    A = on(110, 40, 0, f > 86 ? 'tighten' : 'walk');
    B = on(480, 30, 0, 'hammer', true);
  } else if (f < 175) {
    A = on(110, 30, 0, 'idle');
    B = on(330, 150, HB, f > 140 ? 'tighten' : 'walk');
  } else if (f < 235) {
    A = on(150 + 260 * ramp(f, 182, 226), 100, H1, 'hammer');
    B = on(480, 200, H1, 'press', true);
  } else if (f < 320) {
    A = on(200, 110, H1, 'press');
    B = on(420, 110, H1, 'press', true);
    C = on(660, 20, 0, 'wave', true);
  } else if (f < 400) {
    A = on(260, 110, H1, f > 336 ? 'hammer' : 'idle');
    B = on(400, 150, f > 372 ? H2 : H1, 'press', true);
    C = on(660, 20, 0, 'wave', true);
  } else if (f < 470) {
    A = on(240, 140, H2, f > 430 ? 'press' : 'idle');
    B = on(380, 160, H2, 'press', true);
    C = on(660, 20, 0, 'wave', true);
  } else {
    A = on(200, 120, H2, f > 480 ? 'wave' : 'idle');
    B = on(420, 120, H2, f > 486 ? 'wave' : 'idle', true);
    C = f < 530 ? on(660, 20, 0, 'idle', true) : null;
  }

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          {[[-180, 0], [60, 1], [760, 0], [990, 1]].map(([x, k], i) => (
            <g key={'h' + i}>
              <rect x={x} y={1080 - 30 * k} width={180} height={110 + 30 * k} fill={k ? '#d7d2c8' : '#c9cfd4'} />
              <polygon points={pts([[x - 10, 1080 - 30 * k], [x + 90, 1020 - 30 * k], [x + 190, 1080 - 30 * k]])} fill="#6c737b" />
            </g>
          ))}
          <rect x={-900} y={1180} width={2900} height={1200} fill="#8fb26a" />
          <polygon points={pts([P(-90, -60), P(860, -60), P(860, 380), P(-90, 380)])} fill="#c9a77c" />

          {/* foundation (finished) */}
          <polygon points={pts([P(FP.x0, FP.z0, HB), P(FP.x1, FP.z0, HB), P(FP.x1, FP.z1, HB), P(FP.x0, FP.z1, HB)])} fill="#9d9d97" />
          {WALLS.map((w, i) => (
            <Box key={'fw' + i} {...lineBox(w, 7)} hb={HB} ht={HT} {...CONC} />
          ))}

          {/* steel posts + joists (大引・鋼製束) */}
          {[120, 180, 240, 360, 420, 480].map((x, i) => (
            <g key={'j' + x} opacity={joists[i]}>
              {[105, 150, 195].map((z) => (
                <line key={z} x1={P(x, z, HB)[0]} y1={P(x, z, HB)[1]} x2={P(x, z, HT)[0]} y2={P(x, z, HT)[1]} stroke="#8b9097" strokeWidth={4} />
              ))}
              <Box x0={x - 5} x1={x + 5} z0={FP.z0} z1={FP.z1} hb={HT} ht={H1 - 4} {...WOOD} />
            </g>
          ))}
          {/* packing + sills */}
          {WALLS.map((w, i) => (
            <g key={'s' + i}>
              <Box {...lineBox(w, 7)} hb={HT} ht={HT + 4} front="#2b2b2b" side="#222" top="#333" opacity={packing} />
              <Box {...lineBox(w, 7)} hb={HT + 4} ht={H1 - 4} {...WOOD} opacity={sills[i]} dy={(1 - sills[i]) * -30} />
            </g>
          ))}
          {/* floor plywood sheets */}
          {sheets.map((o, i) => {
            const cx = i % 4;
            const cz = Math.floor(i / 4);
            const x0 = FP.x0 + cx * 120;
            const z0 = FP.z0 + cz * 90;
            return <polygon key={'pw' + i} points={pts([P(x0 + 2, z0 + 2, H1), P(x0 + 118, z0 + 2, H1), P(x0 + 118, z0 + 88, H1), P(x0 + 2, z0 + 88, H1)])} fill="#d8c08f" stroke="#b49a68" strokeWidth={1.5} opacity={o} transform={`translate(0,${(1 - o) * -40})`} />;
          })}

          {/* back-row first: columns 1F, then beams, floor 2F, columns 2F, eaves, ridge */}
          {COLS.map(([x, z], i) => (
            <g key={'c' + i} opacity={shown(colStart(i))}>
              <Box x0={x - 7} x1={x + 7} z0={z - 7} z1={z + 7} hb={H1} ht={H2 - 16} {...WOOD} dy={drop(colStart(i))} />
            </g>
          ))}
          {WALLS.map((w, i) => (
            <g key={'b2' + i} opacity={shown(beam2Start(i))}>
              <Box {...lineBox(w, 8)} hb={H2 - 16} ht={H2} {...WOOD} dy={drop(beam2Start(i))} />
            </g>
          ))}
          <polygon points={pts([P(FP.x0, FP.z0, H2 + 2), P(FP.x1, FP.z0, H2 + 2), P(FP.x1, FP.z1, H2 + 2), P(FP.x0, FP.z1, H2 + 2)])} fill="#d8c08f" stroke="#b49a68" strokeWidth={1.5} opacity={floor2 * 0.85} />
          {COLS.map(([x, z], i) => (
            <g key={'c2' + i} opacity={shown(col2Start(i))}>
              <Box x0={x - 7} x1={x + 7} z0={z - 7} z1={z + 7} hb={H2} ht={H3 - 16} {...WOOD} dy={drop(col2Start(i))} />
            </g>
          ))}
          {WALLS.map((w, i) => (
            <g key={'e' + i} opacity={shown(eaveStart(i))}>
              <Box {...lineBox(w, 8)} hb={H3 - 16} ht={H3} {...WOOD} dy={drop(eaveStart(i))} />
            </g>
          ))}
          {/* ridge posts and ridge */}
          {[60, 300, 540].map((x) => (
            <Box key={'rp' + x} x0={x - 5} x1={x + 5} z0={145} z1={155} hb={H3} ht={HR - 14} {...WOOD} opacity={ridgePost} />
          ))}
          <g opacity={shown(ridgeStart)}>
            <Box x0={40} x1={560} z0={142} z1={158} hb={HR - 14} ht={HR} front="#e0ad6c" side="#c4904f" top="#f0c88f" dy={drop(ridgeStart)} />
          </g>
          {/* rafters */}
          {[60, 140, 220, 300, 380, 460, 540].map((x, i) => {
            const o = ramp(f, 440 + i * 2, 446 + i * 2);
            const a = P(x, 40, H3 - 10);
            const b = P(x, 150, HR + 4);
            const c = P(x, 260, H3 - 10);
            return <polyline key={'rf' + i} points={pts([a, b, c])} stroke="#c48d52" strokeWidth={7} fill="none" opacity={o} />;
          })}

          {/* scaffold by the tobi (front and right side) */}
          <g opacity={ramp(f, 236, 250)}>
            {[30, 134, 238, 342, 446, 550].map((x) => (
              <line key={'sp' + x} x1={P(x, 22)[0]} y1={P(x, 22)[1]} x2={P(x, 22, H3 + 60)[0]} y2={P(x, 22, H3 + 60)[1]} stroke="#8d949b" strokeWidth={3} />
            ))}
            {[40, 150, 260].map((z) => (
              <line key={'sr' + z} x1={P(578, z)[0]} y1={P(578, z)[1]} x2={P(578, z, H3 + 60)[0]} y2={P(578, z, H3 + 60)[1]} stroke="#8d949b" strokeWidth={3} />
            ))}
            {[110, H2 - 20, H3 - 20, H3 + 50].map((h) => (
              <g key={'pl' + h}>
                <polyline points={pts([P(30, 22, h), P(578, 22, h), P(578, 260, h)])} stroke="#b9bdc2" strokeWidth={6} fill="none" />
                <polyline points={pts([P(30, 22, h + 40), P(578, 22, h + 40), P(578, 260, h + 40)])} stroke="#e0b21b" strokeWidth={2} fill="none" />
              </g>
            ))}
          </g>

          {/* crane truck */}
          <g opacity={crane}>
            <rect x={truck[0] - 80} y={truck[1] - 60} width={190} height={46} rx={8} fill="#f0f0ea" stroke="#999" />
            <rect x={truck[0] + 70} y={truck[1] - 90} width={50} height={40} rx={6} fill="#e8622c" />
            {[-50, 0, 60, 95].map((k) => (
              <circle key={k} cx={truck[0] + k} cy={truck[1] - 12} r={14} fill="#333" />
            ))}
            <line x1={truck[0]} y1={truck[1] - 60} x2={load[0] + 10} y2={Math.min(load[1] - 160, 760)} stroke="#e8622c" strokeWidth={14} strokeLinecap="round" />
            <line x1={load[0] + 10} y1={Math.min(load[1] - 160, 760)} x2={load[0]} y2={load[1] - 30} stroke="#333" strokeWidth={3} />
            <path d={`M ${load[0] - 6} ${load[1] - 30} q 6 14 12 0`} stroke="#333" strokeWidth={3} fill="none" />
          </g>

          {/* 上棟 pop */}
          <g opacity={joto} transform={`translate(${P(300, 150, HR + 70)[0]},${P(300, 150, HR + 70)[1]}) scale(${0.8 + 0.2 * joto})`}>
            <rect x={-110} y={-48} width={220} height={84} rx={16} fill="#c8102e" />
            <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff">上棟</text>
          </g>

          {C ? <Worker x={C.x} y={C.y} action={C.act} f={f} s={0.9} flip={C.flip} suit="#2b2f36" vest="#ffd34d" phase={9} /> : null}
          <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.9} flip={A.flip} />
          <Worker x={B.x} y={B.y} action={B.act} f={f} s={0.9} flip={B.flip} phase={5} />
        </g>
      </svg>

      <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', opacity: hook, fontFamily: FONT}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#10161e'}}>木造の家ができるまで #3</div>
        <div style={{fontSize: 92, fontWeight: 900, color: '#10161e', marginTop: 10}}>大工さんの仕事①</div>
        <div style={{fontSize: 42, fontWeight: 700, color: '#10161e', marginTop: 16}}>土台から上棟まで</div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hook, fontFamily: FONT, fontSize: 42, fontWeight: 800, color: '#10161e'}}>大工さんの仕事①</div>
      <div style={{position: 'absolute', top: 70, right: 50, background: '#10161e', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 700, padding: '6px 16px', borderRadius: 8}}>AI演出・早送り</div>
      <Caption f={f} />
      <div style={{position: 'absolute', bottom: 330, width: '100%', display: 'flex', justifyContent: 'center', opacity: cta, transform: `scale(${0.9 + 0.1 * cta})`}}>
        <div style={{background: '#e8622c', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 56, padding: '22px 44px', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>外構・新築のご相談はDMで</div>
      </div>
      <div style={{position: 'absolute', bottom: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: 'rgba(16,22,30,0.9)', color: '#fff', fontFamily: FONT, fontSize: 30, lineHeight: 1.45, padding: '12px 26px', borderRadius: 12, textAlign: 'center'}}>
          AI・CGの架空の工程イメージです
          <br />
          <span style={{color: '#ffd34d'}}>渦巻建設の施工実績ではありません</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
