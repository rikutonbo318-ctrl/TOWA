import React from 'react';
import {FONT, ramp} from '../Mokuzou';

// 渦さん: 渦巻建設の現場監督。白ヘルに黒い渦マーク、紺の作業着に胸のオレンジ。顔はつばの影で見せない
export const UZU = {suit: '#1c2a44', vest: '#e8622c', uzu: true} as const;

// [start, end, text] — 渦さんのひとこと（関西弁・1行）
export type UzuLine = [number, number, string];

const Spiral: React.FC<{cx: number; cy: number; r: number; w: number}> = ({cx, cy, r, w}) => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 5.2;
    const rr = (r * (0.06 + t / (Math.PI * 5.2))) * 0.95;
    pts.push(`${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`);
  }
  return <polyline points={pts.join(' ')} fill="none" stroke="#111" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
};

export const UzuFace: React.FC<{size: number; nod?: number}> = ({size, nod = 0}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx={100} cy={100} r={98} fill="#e8622c" />
    <circle cx={100} cy={100} r={90} fill="#f3efe6" />
    <g transform={`translate(0 ${nod * 4})`}>
      {/* shoulders: navy work jacket with the orange chest line */}
      <path d="M30 196 Q38 150 100 146 Q162 150 170 196 Z" fill="#1c2a44" />
      <rect x={44} y={170} width={112} height={9} rx={4} fill="#e8622c" />
      {/* face in the shadow of the brim */}
      <ellipse cx={100} cy={118} rx={34} ry={38} fill="#2a241f" />
      {/* helmet */}
      <path d="M48 98 Q50 38 100 36 Q150 38 152 98 Z" fill="#fbfbf8" stroke="#d9d6cf" strokeWidth={2} />
      <path d="M38 98 Q100 86 162 98 Q162 108 100 106 Q38 108 38 98 Z" fill="#fbfbf8" stroke="#d9d6cf" strokeWidth={2} />
      <rect x={96} y={38} width={8} height={56} rx={4} fill="#ecebe6" />
      <Spiral cx={100} cy={70} r={22} w={5.5} />
    </g>
  </svg>
);

export const UzuGuide: React.FC<{f: number; lines: UzuLine[]}> = ({f, lines}) => {
  const cur = lines.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a, b, text] = cur;
  const o = ramp(f, a, a + 7) * (1 - ramp(f, b - 7, b));
  const nod = Math.abs(Math.sin((f - a) / 5)) * (f - a < 24 ? 1 : 0);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, bottom: 640, display: 'flex', alignItems: 'flex-end', gap: 14, opacity: o, transform: `translateY(${(1 - o) * 24}px)`, fontFamily: FONT}}>
      <div style={{filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))'}}>
        <UzuFace size={170} nod={nod} />
        <div style={{marginTop: -18, textAlign: 'center'}}>
          <span style={{background: '#10161e', color: '#fff', fontSize: 28, fontWeight: 900, padding: '3px 14px', borderRadius: 8}}>渦さん</span>
        </div>
      </div>
      <div style={{position: 'relative', marginBottom: 70, background: '#fff', color: '#10161e', border: '5px solid #10161e', borderRadius: 26, padding: '16px 24px', fontSize: text.length > 14 ? 40 : 46, fontWeight: 900, lineHeight: 1.3, boxShadow: '0 8px 22px rgba(0,0,0,0.35)', maxWidth: 760}}>
        {text}
        <div style={{position: 'absolute', left: -26, bottom: 22, width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderRight: '26px solid #10161e'}} />
      </div>
    </div>
  );
};
