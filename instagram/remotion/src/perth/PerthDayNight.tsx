import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT} from '../Mokuzou';
import {UzuGuide} from '../house/Uzu';

// パースのリール：同じ外構の昼と夜（照明の効き方を見せる）。金額は出さない
const PAIRS: [string, string, string][] = [
  ['perth/02_ext_day_black.png', 'perth/01_ext_dusk_black.png', '黒い外壁'],
  ['perth/06_ext_day_white.png', 'perth/07_ext_dusk_white.png', '白い外壁'],
  ['perth/08_ext_day_gray.png', 'perth/09_ext_dusk_lightgray.png', 'グレーの外壁'],
];
const PAIR_LEN = 110;
const START = 30;
const END_AT = START + PAIR_LEN * PAIRS.length; // 360
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const band: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, color: '#fff'};
// the renders carry a product list along the bottom: show only the picture part
const Pic: React.FC<{src: string; clip?: number}> = ({src, clip = 0}) => (
  <div style={{position: 'absolute', top: 300, left: 0, width: 1080, height: 1000, overflow: 'hidden', clipPath: `inset(0 0 0 ${clip * 100}%)`}}>
    <Img src={staticFile(src)} style={{width: 1080, height: 1350}} />
  </div>
);

export const PerthDayNight: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, Math.min(PAIRS.length - 1, Math.floor((f - START) / PAIR_LEN)));
  const t = f - START - i * PAIR_LEN;
  const wipe = f < START ? 1 : interpolate(t, [40, 70], [1, 0], cl); // 1 = all day, 0 = all night
  const night = wipe < 1;
  const [day, dusk, label] = PAIRS[i];
  const end = interpolate(f, [END_AT, END_AT + 12], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: '#11161d'}}>
      <div style={{opacity: 1 - end}}>
        <Pic src={day} />
        {night ? <Pic src={dusk} clip={wipe} /> : null}
        {night && wipe > 0 ? <div style={{position: 'absolute', top: 300, height: 1000, left: 1080 * wipe - 3, width: 6, background: '#ffb36b', boxShadow: '0 0 18px #ffb36b'}} /> : null}
        <div style={{...band, top: 1340, opacity: f < START ? 0 : 1}}>
          <div style={{display: 'inline-block', background: wipe > 0.5 ? '#3d7fc4' : '#e8622c', fontWeight: 900, fontSize: 84, padding: '6px 40px', borderRadius: 18}}>{wipe > 0.5 ? '昼' : '夜'}</div>
          <div style={{marginTop: 18, fontSize: 52, fontWeight: 800}}>{label}</div>
          <div style={{marginTop: 8, fontSize: 40, fontWeight: 700, color: '#d8dde3'}}>{wipe > 0.5 ? '昼は外壁と木目が主役' : '夜は門柱とアプローチの灯りが主役'}</div>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: end}}>
        <div style={{position: 'absolute', top: 300, left: 0, width: 1080, height: 1000, overflow: 'hidden'}}>
          <Img src={staticFile('perth/13_ext_evening_black.png')} style={{width: 1080, height: 1350, transform: `scale(${1 + 0.04 * end})`}} />
        </div>
        <div style={{...band, top: 1360}}>
          <div style={{display: 'inline-block', background: '#e8622c', fontWeight: 900, fontSize: 60, padding: '14px 40px', borderRadius: 20}}>うちの家の夜の顔は？</div>
          <div style={{marginTop: 18, fontSize: 48, fontWeight: 800}}>DMで「パース」と送ってください</div>
          <div style={{marginTop: 8, fontSize: 38, fontWeight: 700, color: '#d8dde3'}}>図面1枚で、昼と夜のパースをお返しします（無料）</div>
        </div>
      </div>
      {/* hook */}
      <div style={{...band, top: 330, opacity: interpolate(f, [0, 6, 64, 74], [1, 1, 1, 0], cl)}}>
        <div style={{fontSize: 84, fontWeight: 900, lineHeight: 1.3, textShadow: '0 4px 16px rgba(0,0,0,0.85)'}}>
          外構の夜の顔
          <br />
          <span style={{color: '#ffb36b'}}>考えてますか？</span>
        </div>
      </div>
      <div style={{...band, top: 70, fontSize: 40, fontWeight: 800}}>
        <span style={{background: 'rgba(16,22,30,0.8)', padding: '8px 26px', borderRadius: 14}}>外構パース・昼と夜</span>
      </div>
      <div style={{...band, top: 1840, fontSize: 28, fontWeight: 600, color: '#c9ced4'}}>※CGで作った外構のイメージです</div>
      <UzuGuide f={f} lines={[[90, 160, '照明ひとつで、夜の家はこう変わるんや'], [250, 330, '門柱とアプローチの灯りは、防犯にも効くで']]} />
    </AbsoluteFill>
  );
};
