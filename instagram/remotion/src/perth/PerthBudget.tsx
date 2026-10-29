import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT} from '../Mokuzou';
import {UzuGuide} from '../house/Uzu';

// パースのリール：同じ家で外構の予算だけ変える（金額は公開してよい約180万・300万・420万円だけ）
type Slide = {s: number; e: number; img: string; label?: string; items?: string[]};
const SLIDES: Slide[] = [
  {s: 0, e: 75, img: 'perth/15_plan100_dusk.png'},
  {s: 75, e: 165, img: 'perth/15_plan100_dusk.png', label: '約180万円', items: ['土間コン駐車場 2台', '機能門柱・フェンス', '芝生＋シンボルツリー']},
  {s: 165, e: 255, img: 'perth/16_plan200_dusk.png', label: '約300万円', items: ['＋カーポート', '＋塗り壁の門柱と間接照明', '＋タイルのアプローチ']},
  {s: 255, e: 345, img: 'perth/17_plan300_garden.png', label: '約420万円', items: ['＋タイルデッキ', '＋ウッドデッキ', '＝庭が「外のリビング」に']},
  {s: 345, e: 450, img: 'perth/18_budget_summary.png'},
];
const fade = (f: number, s: number, e: number) => Math.min(interpolate(f, [s, s + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), interpolate(f, [e - 6, e + 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
const band: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, color: '#fff'};

export const PerthBudget: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#11161d'}}>
      {SLIDES.map((sl, i) => {
        const o = i === 0 ? fade(f, -10, sl.e) : fade(f, sl.s, i === SLIDES.length - 1 ? 1e9 : sl.e);
        if (o <= 0) return null;
        const z = 1.0 + 0.06 * ((f - sl.s) / (sl.e - sl.s));
        return (
          <AbsoluteFill key={i} style={{opacity: o}}>
            {i === SLIDES.length - 1 ? (
              <Img src={staticFile(sl.img)} style={{position: 'absolute', top: 110, width: 1080, height: 1350}} />
            ) : (
              <>
                <Img src={staticFile(sl.img)} style={{position: 'absolute', top: 0, left: -228, width: 1536, height: 1920, transform: `scale(${z})`}} />
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 760, background: 'linear-gradient(rgba(10,14,20,0), rgba(10,14,20,0.85))'}} />
              </>
            )}
            {sl.label ? (
              <div style={{...band, top: 1290}}>
                <div style={{display: 'inline-block', background: '#e8622c', fontWeight: 900, fontSize: 92, padding: '6px 40px', borderRadius: 18}}>{sl.label}</div>
                <div style={{marginTop: 22}}>
                  {sl.items!.map((t, k) => (
                    <div key={k} style={{fontSize: 52, fontWeight: 800, lineHeight: 1.45, opacity: interpolate(f, [sl.s + 12 + k * 10, sl.s + 20 + k * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), textShadow: '0 3px 12px rgba(0,0,0,0.8)'}}>{t}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </AbsoluteFill>
        );
      })}
      {/* hook */}
      <div style={{...band, top: 260, opacity: fade(f, -10, 75)}}>
        <div style={{fontSize: 84, fontWeight: 900, lineHeight: 1.3, textShadow: '0 4px 16px rgba(0,0,0,0.85)'}}>
          同じ家でも
          <br />
          外構の予算で
          <br />
          <span style={{color: '#ffb36b'}}>ここまで変わる</span>
        </div>
        <div style={{marginTop: 26, fontSize: 50, fontWeight: 800, textShadow: '0 3px 12px rgba(0,0,0,0.85)'}}>180万・300万・420万、比べたことありますか？</div>
      </div>
      {/* CTA */}
      <div style={{...band, top: 1490, opacity: interpolate(f, [360, 372], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <div style={{display: 'inline-block', background: '#e8622c', fontWeight: 900, fontSize: 60, padding: '14px 40px', borderRadius: 20}}>うちの家だといくら？</div>
        <div style={{marginTop: 18, fontSize: 48, fontWeight: 800}}>DMで「パース」と送ってください</div>
        <div style={{marginTop: 8, fontSize: 38, fontWeight: 700, color: '#d8dde3'}}>図面1枚でパースと目安の金額をお返しします（無料）</div>
      </div>
      <div style={{...band, top: 70, fontSize: 40, fontWeight: 800}}>
        <span style={{background: 'rgba(16,22,30,0.8)', padding: '8px 26px', borderRadius: 14}}>外構パース・予算別3案</span>
      </div>
      <div style={{...band, top: 1840, fontSize: 28, fontWeight: 600, color: '#c9ced4'}}>※金額は近畿の工事価格をもとにした目安です（敷地・地域で変わります）</div>
      <UzuGuide f={f} lines={[[90, 160, '同じ家やのに、外構で別の家みたいやろ'], [270, 340, 'デッキがあると、庭で過ごす時間が増えるで']]} />
    </AbsoluteFill>
  );
};
