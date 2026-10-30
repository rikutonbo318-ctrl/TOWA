import React from 'react';
import {useVideoConfig} from 'remotion';
import {FONT, ramp} from '../Mokuzou';
import {Step} from '../Shared';
import {UzuGuide, UzuLine} from './Uzu';

// v2 overlay tuned for reach and sales:
// - 0〜1.3s: a question hook in big outlined text over the moving scene (no panel hiding the motion)
// - thin progress bar (people stay to see it fill)
// - a save nudge mid-way (saves are weighted above likes)
// - end card: note (template set for builders) first, DM consultation second
const ink = '#10161e';
const outline = (w: number, c = ink) => `${-w}px ${-w}px 0 ${c}, ${w}px ${-w}px 0 ${c}, ${-w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}, 0 ${w}px 0 ${c}, 0 ${-w}px 0 ${c}, ${w}px 0 0 ${c}, ${-w}px 0 0 ${c}, 0 8px 24px rgba(0,0,0,0.45)`;

export const OverlayV2: React.FC<{f: number; no: number; of?: number; hook: [string, string]; title: string; steps: Step[]; total: number; ctaAt: number; saveAt?: number; uzu?: UzuLine[]}> = ({f, no, of = 22, hook, title, steps, total, ctaAt, saveAt = 300, uzu = []}) => {
  const {durationInFrames} = useVideoConfig();
  const hk = 1 - ramp(f, 34, 44);
  const hkIn = ramp(f, 0, 6);
  const cta = ramp(f, ctaAt, ctaAt + 12);
  const save = ramp(f, saveAt, saveAt + 8) * (1 - ramp(f, saveAt + 60, saveAt + 68));
  const idx = steps.findIndex(([a, b]) => f >= a && f < b);
  const cur = idx >= 0 ? steps[idx] : null;
  const o = cur ? ramp(f, cur[0], cur[0] + 8) : 0;
  return (
    <>
      {/* progress bar */}
      <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(f / (durationInFrames - 1)) * 100}%`, background: '#e8622c'}} />
      {/* hook */}
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', opacity: hk * hkIn, transform: `scale(${0.92 + 0.08 * hkIn})`, fontFamily: FONT}}>
        <div style={{display: 'inline-block', background: '#e8622c', color: '#fff', fontSize: 40, fontWeight: 900, padding: '6px 22px', borderRadius: 10}}>{`渦さんと見る 家ができるまで ${no}/${of}`}</div>
        <div style={{fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginTop: 26, textShadow: outline(5)}}>
          {hook[0]}
          <br />
          <span style={{color: '#ffd34d'}}>{hook[1]}</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: 1 - hk, fontFamily: FONT, fontSize: 42, fontWeight: 900, color: '#fff', textShadow: outline(3)}}>{`#${no} ${title}`}</div>
      <div style={{position: 'absolute', top: 70, right: 50, background: ink, color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 700, padding: '6px 16px', borderRadius: 8}}>AI演出・早送り</div>
      {cur && f < ctaAt ? (
        <div style={{position: 'absolute', top: 235, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: FONT}}>
          <div style={{background: cur[4] ? '#2f8f5b' : '#e8622c', color: '#fff', fontWeight: 900, fontSize: cur[2].length > 9 ? 52 : 60, padding: '8px 30px', borderRadius: 14}}>
            {idx < total ? <span style={{fontSize: 40, marginRight: 12}}>{`${idx + 1}/${total}`}</span> : null}
            {cur[2]}
          </div>
          <div style={{marginTop: 14, background: 'rgba(16,22,30,0.86)', color: '#fff', fontWeight: 700, fontSize: 36, padding: '10px 24px', borderRadius: 12}}>{cur[3]}</div>
        </div>
      ) : null}
      {f < ctaAt ? <UzuGuide f={f} lines={uzu} /> : null}
      {/* save nudge */}
      <div style={{position: 'absolute', bottom: 540, width: '100%', display: 'flex', justifyContent: 'center', opacity: save, transform: `translateY(${(1 - save) * 16}px)`}}>
        <div style={{background: 'rgba(255,255,255,0.94)', color: ink, fontFamily: FONT, fontWeight: 800, fontSize: 38, padding: '12px 28px', borderRadius: 40, border: '4px solid #e8622c'}}>現場見学のチェック用に、保存しといてや</div>
      </div>
      {/* end card: next episode + note + DM */}
      <div style={{position: 'absolute', top: 250, left: 60, right: 60, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'stretch'}}>
        <div style={{background: 'rgba(16,22,30,0.9)', color: '#fff', borderRadius: 22, padding: '22px 30px', textAlign: 'center'}}>
          <div style={{fontSize: 36, fontWeight: 700, color: '#ffd34d'}}>{`次回 #${no + 1}`}</div>
          <div style={{fontSize: 54, fontWeight: 900, marginTop: 4}}>{steps[steps.length - 1][2].replace(/^次は/, '')}</div>
          <div style={{fontSize: 32, fontWeight: 700, marginTop: 6, opacity: 0.85}}>フォローで続きが届きます</div>
          <div style={{fontSize: 30, fontWeight: 800, marginTop: 10, color: '#ffd34d'}}>家を建てる友だちに送ってあげてな</div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 520, left: 60, right: 150, opacity: cta, transform: `scale(${0.94 + 0.06 * cta})`, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 18}}>
        <div style={{background: '#fff', borderRadius: 22, padding: '20px 28px', border: '5px solid #e8622c', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>
          <div style={{fontSize: 32, fontWeight: 800, color: '#e8622c'}}>これから家を建てる人へ</div>
          <div style={{fontSize: 46, fontWeight: 900, color: ink, marginTop: 4, lineHeight: 1.25}}>全22工程の現場見学チェックリスト</div>
          <div style={{fontSize: 36, fontWeight: 800, color: ink, marginTop: 6}}>プロフィールのnoteから →</div>
        </div>
        <div style={{background: '#e8622c', color: '#fff', borderRadius: 22, padding: '16px 28px', textAlign: 'center', fontSize: 44, fontWeight: 900}}>外構のご相談はDMで</div>
      </div>
      {/* disclosure (always on, kept above the caption area of the Reels UI) */}
      <div style={{position: 'absolute', bottom: 400, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: 'rgba(16,22,30,0.9)', color: '#fff', fontFamily: FONT, fontSize: 28, lineHeight: 1.4, padding: '10px 24px', borderRadius: 12, textAlign: 'center'}}>
          AI・CGの架空の工程イメージです
          <br />
          <span style={{color: '#ffd34d'}}>渦巻建設の施工実績ではありません</span>
        </div>
      </div>
    </>
  );
};
