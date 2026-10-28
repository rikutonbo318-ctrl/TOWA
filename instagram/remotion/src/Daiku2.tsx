import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Action, ramp, Worker} from './Mokuzou';
import {Backdrop, BuiltFrame, H1, H2, H3, HR, HT, makeCam, Overlay, P, pts, Scaffold, Step} from './Shared';

const EAVE_Z = 28;
const EAVE_H = H3 - 10;
const RIDGE_Z = 150;
const RIDGE_H = HR + 6;
// point on the front roof slope: t=0 eave, t=1 ridge
const S = (x: number, t: number): [number, number] => P(x, EAVE_Z + (RIDGE_Z - EAVE_Z) * t, EAVE_H + (RIDGE_H - EAVE_H) * t);
const RX0 = 30;
const RX1 = 570;

const camAt = makeCam([
  [0, 560, 1150, 1.12],
  [45, 560, 1150, 1.12],
  [72, 470, 920, 2.2],
  [104, 470, 920, 2.2],
  [112, 560, 1150, 1.12],
  [132, 490, 890, 2.3],
  [160, 540, 890, 2.3],
  [170, 560, 1150, 1.12],
  [192, 430, 900, 2.3],
  [222, 430, 880, 2.3],
  [232, 560, 1150, 1.12],
  [258, 560, 890, 2.3],
  [288, 600, 890, 2.3],
  [298, 560, 1150, 1.12],
  [320, 470, 1190, 2.6],
  [348, 470, 1190, 2.6],
  [358, 560, 1150, 1.12],
  [388, 600, 1260, 2.4],
  [418, 600, 1260, 2.4],
  [428, 560, 1150, 1.12],
  [454, 420, 1380, 2.5],
  [482, 480, 1380, 2.5],
  [504, 540, 1120, 1.4],
  [600, 540, 1120, 1.4],
]);

const STEPS: Step[] = [
  [45, 110, '垂木', '屋根の骨になる垂木を掛けていく', false],
  [110, 170, '野地板', '垂木の上に板を張り、屋根の下地をつくる', false],
  [170, 232, '屋根屋さん：ルーフィング', '雨を止めるシートを下から重ねて張る', true],
  [232, 298, '屋根屋さん：屋根材', '金属の屋根材を張り、継ぎ目を締める', true],
  [298, 358, '金物', '柱と梁の継ぎ目を金物で締め付ける', false],
  [358, 428, '耐力壁', '外まわりに構造用の合板を張る', false],
  [428, 494, '防蟻屋さん', '土台と柱の足元に防蟻の薬を吹く', true],
  [494, 600, '次回：外まわり', 'サッシと外壁へ', false],
];

export const Daiku2: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);

  const extraRafters = [100, 140, 180, 220, 260, 340, 380, 420, 460, 500].map((x, i) => [x, ramp(f, 50 + i * 4, 56 + i * 4)] as [number, number]);
  const noji = ramp(f, 116, 162);
  const roofing = ramp(f, 176, 224);
  const metal = ramp(f, 238, 292);
  const kana = Array.from({length: 10}).map((_, i) => ramp(f, 304 + i * 4, 308 + i * 4));
  const panels = Array.from({length: 12}).map((_, i) => ramp(f, 364 + i * 4.5, 370 + i * 4.5));
  const termite = ramp(f, 436, 486);

  // workers
  type W = {x: number; y: number; act: Action; flip?: boolean};
  const at = (p: [number, number], act: Action, flip = false): W => ({x: p[0], y: p[1], act, flip});
  let A: W = at(P(100, 22, H3 - 20), 'idle');
  let B: W = at(P(400, 120, H2), 'idle', true);
  let C: W | null = null;
  if (f < 45) {
    A = at(P(-60 + 160 * ramp(f, 6, 40), 10), 'walk');
    B = at(P(700 - 160 * ramp(f, 6, 40), 10), 'walk', true);
  } else if (f < 110) {
    A = at(P(120 + 300 * ramp(f, 50, 100), 22, H3 - 20), 'hammer');
    B = at(P(360, 150, H2), 'press', true);
  } else if (f < 170) {
    B = at(S(140 + 330 * noji, 0.35), 'hammer');
    A = at(P(520, 22, H3 - 20), 'press', true);
  } else if (f < 232) {
    C = at(S(80 + 420 * ((roofing * 4) % 1), 0.15 + 0.7 * roofing), 'press');
    A = at(P(560, 22, H3 - 20), 'idle', true);
    B = at(P(300, 150, H2), 'idle', true);
  } else if (f < 298) {
    C = at(S(80 + 440 * metal, 0.4), 'drill');
    A = at(P(560, 22, H3 - 20), 'idle', true);
    B = at(P(300, 150, H2), 'idle', true);
  } else if (f < 358) {
    const i = Math.min(4, Math.floor((f - 302) / 8));
    A = at(P(60 + i * 120 - 20, 22, H2 - 20), 'drill');
    B = at(P(300, 150, H2), 'idle', true);
  } else if (f < 428) {
    const i = Math.min(4, Math.floor((f - 362) / 11));
    B = at(P(80 + i * 110, 22, i % 2 ? H2 - 20 : 110), 'hammer');
    A = at(P(560, 22, H3 - 20), 'idle', true);
  } else if (f < 494) {
    C = at(P(70 + 470 * termite, 18), 'hose');
    A = at(P(560, 22, H3 - 20), 'idle', true);
    B = at(P(300, 150, H2), 'idle', true);
  } else {
    A = at(P(160, 22, H3 + 50), f > 506 ? 'wave' : 'idle');
    B = at(P(440, 22, H3 + 50), f > 510 ? 'wave' : 'idle', true);
  }
  const cIsTermite = f >= 428 && f < 494;

  // front slope polygons
  const slopeQuad = (x0: number, x1: number, t0: number, t1: number) => pts([S(x0, t0), S(x1, t0), S(x1, t1), S(x0, t1)]);
  const backSlope = pts([P(RX0, RIDGE_Z, RIDGE_H), P(RX1, RIDGE_Z, RIDGE_H), P(RX1, 272, EAVE_H), P(RX0, 272, EAVE_H)]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9cc8e6, #e9eef0)'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <g transform={`translate(540,960) scale(${cam.z}) translate(${-cam.x},${-cam.y})`}>
          <Backdrop />
          <BuiltFrame />
          {extraRafters.map(([x, o]) => (
            <polyline key={'xr' + x} points={pts([P(x, 40, H3 - 10), P(x, 150, HR + 4), P(x, 260, H3 - 10)])} stroke="#c48d52" strokeWidth={7} fill="none" opacity={o} />
          ))}

          {/* load-bearing plywood on the front and right walls */}
          {panels.map((o, i) => {
            const bay = i % 6;
            const storey = Math.floor(i / 6);
            const hb = storey ? H2 + 2 : H1;
            const ht = storey ? H3 - 16 : H2 - 16;
            if (bay < 4) {
              const x0 = 60 + bay * 120;
              const q = pts([P(x0 + 4, 50, hb), P(x0 + 116, 50, hb), P(x0 + 116, 50, ht), P(x0 + 4, 50, ht)]);
              return <polygon key={'pn' + i} points={q} fill="#d9c08a" stroke="#b39a62" strokeWidth={2} opacity={o} />;
            }
            const z0 = bay === 4 ? 64 : 154;
            const q = pts([P(550, z0, hb), P(550, z0 + 82, hb), P(550, z0 + 82, ht), P(550, z0, ht)]);
            return <polygon key={'pn' + i} points={q} fill="#c9af78" stroke="#a88f5a" strokeWidth={2} opacity={o} />;
          })}

          {/* hardware plates */}
          {kana.map((o, i) => {
            const x = 60 + (i % 5) * 120;
            const h = i < 5 ? H2 - 10 : H1 + 8;
            const [sx, sy] = P(x, 52, h);
            return (
              <g key={'k' + i} opacity={o}>
                <rect x={sx - 7} y={sy - 12} width={14} height={24} fill="#4a4f57" stroke="#2c3036" strokeWidth={1.5} />
                <circle cx={sx} cy={sy - 5} r={2} fill="#c9ced6" />
                <circle cx={sx} cy={sy + 5} r={2} fill="#c9ced6" />
                {o > 0 && o < 1 ? <circle cx={sx} cy={sy} r={16 * o} fill="none" stroke="#ffd34d" strokeWidth={2} /> : null}
              </g>
            );
          })}

          {/* termite treatment band at the foot of the walls */}
          <clipPath id="termClip">
            <rect x={P(40, 50)[0] - 20} y={0} width={(P(560, 250)[0] - P(40, 50)[0] + 40) * termite} height={2000} />
          </clipPath>
          <g clipPath="url(#termClip)">
            <polygon points={pts([P(52, 50, HT + 4), P(548, 50, HT + 4), P(548, 50, H1 + 70), P(52, 50, H1 + 70)])} fill="rgba(60,160,120,0.38)" />
            <polygon points={pts([P(550, 52, HT + 4), P(550, 248, HT + 4), P(550, 248, H1 + 70), P(550, 52, H1 + 70)])} fill="rgba(60,160,120,0.32)" />
          </g>

          {/* roof: back slope, then front slope layers */}
          <polygon points={backSlope} fill="#c9a774" opacity={noji} />
          <polygon points={slopeQuad(RX0, RX0 + (RX1 - RX0) * noji, 0, 1)} fill="#d6b07a" stroke="#b48d58" strokeWidth={1} />
          {noji > 0
            ? Array.from({length: 6}).map((_, k) => {
                const x = RX0 + k * 90;
                return x < RX0 + (RX1 - RX0) * noji ? <polyline key={'nj' + k} points={pts([S(x, 0), S(x, 1)])} stroke="#b48d58" strokeWidth={1.5} fill="none" /> : null;
              })
            : null}
          {roofing > 0 ? <polygon points={slopeQuad(RX0, RX1, 0, roofing)} fill="#3c424b" /> : null}
          {roofing > 0 ? <polygon points={backSlope} fill="#3c424b" opacity={roofing} /> : null}
          {roofing > 0
            ? [0.25, 0.5, 0.75].filter((t) => t < roofing).map((t) => <polyline key={'rl' + t} points={pts([S(RX0, t), S(RX1, t)])} stroke="#59606b" strokeWidth={2} fill="none" />)
            : null}
          {metal > 0 ? <polygon points={slopeQuad(RX0, RX0 + (RX1 - RX0) * metal, 0, 1)} fill="#6b7580" /> : null}
          {metal > 0 ? <polygon points={backSlope} fill="#5d6670" opacity={metal} /> : null}
          {metal > 0
            ? Array.from({length: 18}).map((_, k) => {
                const x = RX0 + 15 + k * 30;
                return x < RX0 + (RX1 - RX0) * metal ? <polyline key={'sm' + k} points={pts([S(x, 0), S(x, 1)])} stroke="#8b96a2" strokeWidth={2.5} fill="none" /> : null;
              })
            : null}
          {metal > 0.98 ? <polyline points={pts([S(RX0, 1), S(RX1, 1)])} stroke="#4c545d" strokeWidth={9} fill="none" /> : null}

          <Scaffold />

          {/* tools and materials */}
          {f >= 170 && f < 232 && C ? <rect x={C.x + 14} y={C.y - 46} width={34} height={14} rx={7} fill="#2c3036" /> : null}
          {cIsTermite && C ? (
            <g>
              {Array.from({length: 7}).map((_, k) => (
                <circle key={k} cx={C.x + 34 + k * 7} cy={C.y - 40 - Math.sin((f + k * 3) * 0.7) * 6 - k * 1.5} r={2.5 + (k % 3)} fill="rgba(120,200,160,0.7)" />
              ))}
            </g>
          ) : null}

          {C ? <Worker x={C.x} y={C.y} action={C.act} f={f} s={0.85} flip={C.flip} suit={cIsTermite ? '#3a6f7d' : '#2f7d55'} vest={cIsTermite ? '#f2f2ee' : '#ffd34d'} phase={9} /> : null}
          <Worker x={A.x} y={A.y} action={A.act} f={f} s={0.85} flip={A.flip} />
          <Worker x={B.x} y={B.y} action={B.act} f={f} s={0.85} flip={B.flip} phase={5} />
        </g>
      </svg>
      <Overlay f={f} ep={4} title="大工さんの仕事②" sub="屋根と構造を固める" steps={STEPS} total={7} ctaAt={556} />
    </AbsoluteFill>
  );
};
