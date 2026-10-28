import React from 'react';
import {Img, staticFile} from 'remotion';
import {FONT, ramp} from '../Mokuzou';

// 渦さん: 渦巻建設の現場監督。プロフィール写真のポメラニアン（クリーム色のヘルメットに六角の渦ロゴ、深緑の作業着）
export const UZU = {suit: '#1f3b2c', vest: '#1f3b2c', uzu: true} as const;

// [start, end, text, speaker?] — 渦さんのひとこと（関西弁・1行）。
// 渦さん以外がしゃべるときは speaker に別の名前を入れる（渦さんは1人だけ）
export type Speaker = {name: string; color: string};
export type UzuLine = [number, number, string, Speaker?];

// 渦さん以外の人：色ちがいのヘルメット姿（顔はつばの影）
const OtherFace: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx={100} cy={100} r={98} fill={color} />
    <circle cx={100} cy={100} r={90} fill="#f3efe6" />
    <path d="M30 196 Q38 150 100 146 Q162 150 170 196 Z" fill={color} />
    <ellipse cx={100} cy={118} rx={34} ry={38} fill="#2a241f" />
    <path d="M48 98 Q50 38 100 36 Q150 38 152 98 Z" fill="#fbfbf8" stroke="#d9d6cf" strokeWidth={2} />
    <path d="M38 98 Q100 86 162 98 Q162 108 100 106 Q38 108 38 98 Z" fill="#fbfbf8" stroke="#d9d6cf" strokeWidth={2} />
  </svg>
);

export const UzuFace: React.FC<{size: number; nod?: number}> = ({size, nod = 0}) => (
  <div style={{width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '6px solid #c9a44c', boxSizing: 'border-box', background: '#1f3b2c'}}>
    <Img src={staticFile('img/uzu_dog.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translateY(${nod * 4}px) scale(1.04)`}} />
  </div>
);

export const UzuGuide: React.FC<{f: number; lines: UzuLine[]}> = ({f, lines}) => {
  const cur = lines.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  const [a, b, text, who] = cur;
  const o = ramp(f, a, a + 7) * (1 - ramp(f, b - 7, b));
  const nod = Math.abs(Math.sin((f - a) / 5)) * (f - a < 24 ? 1 : 0);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, bottom: 640, display: 'flex', alignItems: 'flex-end', gap: 14, opacity: o, transform: `translateY(${(1 - o) * 24}px)`, fontFamily: FONT}}>
      <div style={{filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))'}}>
        {who ? <OtherFace size={170} color={who.color} /> : <UzuFace size={170} nod={nod} />}
        <div style={{marginTop: -18, textAlign: 'center'}}>
          <span style={{background: '#10161e', color: '#fff', fontSize: 28, fontWeight: 900, padding: '3px 14px', borderRadius: 8}}>{who ? who.name : '渦さん'}</span>
        </div>
      </div>
      <div style={{position: 'relative', marginBottom: 70, background: '#fff', color: '#10161e', border: '5px solid #10161e', borderRadius: 26, padding: '16px 24px', fontSize: text.length > 14 ? 40 : 46, fontWeight: 900, lineHeight: 1.3, boxShadow: '0 8px 22px rgba(0,0,0,0.35)', maxWidth: 760}}>
        {text}
        <div style={{position: 'absolute', left: -26, bottom: 22, width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderRight: '26px solid #10161e'}} />
      </div>
    </div>
  );
};
