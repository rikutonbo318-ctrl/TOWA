import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT} from '../Mokuzou';
import {RealScene, useAssets, useHdr} from './Real';
import {House3D} from './House3D';
import {Gaiko3D} from './Gaiko3D';
import {Cam} from './Scene3D';

// carousel (1080 x 1350): "新築の外構、あとで後悔しやすい5つ" on the model house, CTA = consult by DM
type Slide = {cam: Cam; night?: boolean; tag?: string; head: string[]; body?: string; cover?: boolean; cta?: boolean};
const SLIDES: Slide[] = [
  {cam: {pos: [16.5, -13.5, 5.0], look: [5.5, 0.5, 1.6], fov: 50}, cover: true, head: ['新築の外構', 'あとで後悔しやすい', '5つのこと'], body: '家の打合せと一緒に考えないと、やり直しが高くつきます'},
  {cam: {pos: [6.2, -10.5, 1.6], look: [6.2, -1.5, 1.0], fov: 52}, tag: '① 駐車場', head: ['車の幅だけで', '決めない'], body: 'ドアを開けて乗り降りする幅、子どもの乗せ降ろし、自転車の置き場まで入れて考える'},
  {cam: {pos: [5.2, -8.6, 4.6], look: [6.1, -2.2, 0], fov: 50}, tag: '② 土間コンクリート', head: ['水の逃げ道と', '目地まで決める'], body: '勾配と目地（スリット）がないと、水たまりやひび割れの原因に'},
  {cam: {pos: [11.2, -8.6, 1.35], look: [11.7, -3.7, 0.95], fov: 46}, tag: '③ 門柱', head: ['ポスト・インターホン', '照明はセットで'], body: '後から付けると、電気の配線工事が増えがち'},
  {cam: {pos: [2.4, -0.4, 1.2], look: [0.2, -4.35, 1.0], fov: 62}, tag: '④ 目隠しフェンス', head: ['リビングに座った', '目線で高さを決める'], body: '道路から見えるかどうかは、立った目線と座った目線で変わる'},
  {cam: {pos: [13.8, -9.4, 2.0], look: [9.6, -1.2, 1.0], fov: 50}, night: true, tag: '⑤ 夜のあかり', head: ['玄関までの', '足元を照らす'], body: '段差と通路が見えると、夜も歩きやすく、家の印象も上がる'},
  {cam: {pos: [17.5, -14.5, 5.5], look: [5.5, 0.5, 1.6], fov: 50}, night: true, cta: true, head: ['図面か', '今の写真1枚を', 'DMで'], body: 'どこから考えればいいか、一緒に整理します'},
];

const ink = '#10161e';
const Panel: React.FC<{s: Slide; i: number}> = ({s, i}) => (
  <AbsoluteFill style={{fontFamily: FONT}}>
    {/* readable band */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: s.cover || s.cta ? 640 : 470, background: 'linear-gradient(rgba(10,14,20,0.78), rgba(10,14,20,0))'}} />
    <div style={{position: 'absolute', top: 60, left: 64, right: 64, color: '#fff'}}>
      {s.tag ? <div style={{display: 'inline-block', background: '#e8622c', fontSize: 40, fontWeight: 900, padding: '6px 22px', borderRadius: 10}}>{s.tag}</div> : null}
      {s.cover ? <div style={{display: 'inline-block', background: '#e8622c', fontSize: 36, fontWeight: 900, padding: '6px 20px', borderRadius: 10}}>保存して打合せで使ってください</div> : null}
      <div style={{fontSize: s.cover || s.cta ? 104 : 84, fontWeight: 900, lineHeight: 1.18, marginTop: 22, textShadow: '0 4px 18px rgba(0,0,0,0.5)'}}>
        {s.head.map((h, k) => (
          <div key={k} style={{color: (s.cover && k === 1) || (s.cta && k === 2) ? '#ffd34d' : '#fff'}}>
            {h}
          </div>
        ))}
      </div>
    </div>
    {s.body ? (
      <div style={{position: 'absolute', left: 64, right: 64, bottom: 130, background: 'rgba(255,255,255,0.94)', color: ink, borderRadius: 22, padding: '24px 30px', fontSize: 42, fontWeight: 800, lineHeight: 1.45, borderLeft: '12px solid #e8622c'}}>{s.body}</div>
    ) : null}
    {s.cta ? (
      <div style={{position: 'absolute', left: 64, right: 64, top: 600, display: 'flex', flexDirection: 'column', gap: 16}}>
        {['カーポート・駐車場の土間コン', '門柱・フェンス・ブロック塀', 'ウッドデッキ・お庭'].map((t) => (
          <div key={t} style={{background: 'rgba(16,22,30,0.82)', color: '#fff', fontSize: 40, fontWeight: 800, padding: '12px 24px', borderRadius: 14}}>{`✓ ${t}`}</div>
        ))}
      </div>
    ) : null}
    {/* page + disclosure */}
    <div style={{position: 'absolute', right: 40, top: 40, color: '#fff', fontSize: 30, fontWeight: 800, background: 'rgba(16,22,30,0.7)', padding: '4px 16px', borderRadius: 20}}>{`${i + 1}/${SLIDES.length}`}</div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center'}}>
      <span style={{background: 'rgba(16,22,30,0.85)', color: '#fff', fontSize: 26, padding: '6px 18px', borderRadius: 10}}>
        AI・CGのイメージです <span style={{color: '#ffd34d'}}>渦巻建設の施工実績ではありません</span>
      </span>
    </div>
    {!s.cta ? <div style={{position: 'absolute', right: 40, bottom: 92, color: '#fff', fontSize: 30, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>次へ →</div> : null}
  </AbsoluteFill>
);

export const GaikoSlide: React.FC<{i: number}> = ({i}) => {
  const a = useAssets();
  const dusk = useHdr('hdr/venice_sunset_1k.hdr');
  const s = SLIDES[i];
  if (!a || !dusk) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} cam={s.cam} hdr={s.night ? dusk : undefined} exposure={s.night ? 0.24 : 1.0} sun={s.night ? 0.05 : 2.4} sunColor={s.night ? '#ffb070' : '#fff4e4'} bgBlur={s.cta ? 0.15 : 0}>
        <House3D />
        <Gaiko3D night={s.night} />
      </RealScene>
      <Panel s={s} i={i} />
    </AbsoluteFill>
  );
};
export const GAIKO_N = SLIDES.length;

// one frame per slide: render with `remotion still Gaiko --frame=<i>`
export const Gaiko: React.FC = () => {
  const f = useCurrentFrame();
  return <GaikoSlide i={Math.min(GAIKO_N - 1, f)} />;
};
