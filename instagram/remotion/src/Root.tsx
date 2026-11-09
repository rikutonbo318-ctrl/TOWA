import React from 'react';
import {Composition} from 'remotion';
import {Ep01} from './house/Ep01';
import {Ep02} from './house/Ep02';
import {Ep03} from './house/Ep03';
import {Ep04} from './house/Ep04';
import {Ep05} from './house/Ep05';
import {Ep06} from './house/Ep06';
import {Ep07} from './house/Ep07';
import {Ep08} from './house/Ep08';
import {Ep09} from './house/Ep09';
import {Ep10} from './house/Ep10';
import {Ep11} from './house/Ep11';
import {Ep12} from './house/Ep12';
import {Ep13} from './house/Ep13';
import {Ep14} from './house/Ep14';
import {Ep15} from './house/Ep15';
import {Ep16} from './house/Ep16';
import {Ep17} from './house/Ep17';
import {Ep18} from './house/Ep18';
import {Ep19} from './house/Ep19';
import {Ep20} from './house/Ep20';
import {Ep21} from './house/Ep21';
import {Ep22} from './house/Ep22';
import {D1, D2, D3} from './house/Dassen';
import {M1} from './house/M1';
import {M2} from './house/M2';
import {M1b, M1B_FRAMES} from './house/M1b';
import {M2b, M2B_FRAMES} from './house/M2b';
import {M3, M3_FRAMES} from './house/M3';
import {M4, M4_FRAMES} from './house/M4';
import {M5, M5_FRAMES} from './house/M5';
import {M6, M6_FRAMES} from './house/M6';
import {M7, M7_FRAMES} from './house/M7';
import {M8, M8_FRAMES} from './house/M8';
import {M9, M9_FRAMES} from './house/M9';
import {M10, M10_FRAMES} from './house/M10';
import {G1} from './house/G1';
import {G2} from './house/G2';
import {G3} from './house/G3';
import {G4} from './house/G4';
import {PerthBudget} from './perth/PerthBudget';
import {PerthDayNight} from './perth/PerthDayNight';
import {PreviewExt} from './house/Preview3D';

// 木造の家ができるまで（全22話・施工順）。1話 = 20秒、1080x1920、30fps
export const Root: React.FC = () => (
  <>
    <Composition id="Ep01" component={Ep01} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep02" component={Ep02} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep03" component={Ep03} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep04" component={Ep04} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep05" component={Ep05} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep06" component={Ep06} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep07" component={Ep07} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep08" component={Ep08} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep09" component={Ep09} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep10" component={Ep10} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep11" component={Ep11} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep12" component={Ep12} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep13" component={Ep13} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep14" component={Ep14} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep15" component={Ep15} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep16" component={Ep16} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep17" component={Ep17} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep18" component={Ep18} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep19" component={Ep19} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep20" component={Ep20} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep21" component={Ep21} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="Ep22" component={Ep22} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="D1" component={D1} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="D2" component={D2} durationInFrames={1050} fps={30} width={1080} height={1920} />
    <Composition id="D3" component={D3} durationInFrames={1050} fps={30} width={1080} height={1920} />
    <Composition id="M1" component={M1} durationInFrames={1200} fps={30} width={1080} height={1920} />
    <Composition id="M2" component={M2} durationInFrames={1200} fps={30} width={1080} height={1920} />
    <Composition id="M1b" component={M1b} durationInFrames={M1B_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M2b" component={M2b} durationInFrames={M2B_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M3" component={M3} durationInFrames={M3_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M4" component={M4} durationInFrames={M4_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M5" component={M5} durationInFrames={M5_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M6" component={M6} durationInFrames={M6_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M7" component={M7} durationInFrames={M7_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M8" component={M8} durationInFrames={M8_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M9" component={M9} durationInFrames={M9_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="M10" component={M10} durationInFrames={M10_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="G1" component={G1} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="G2" component={G2} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="G3" component={G3} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="G4" component={G4} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="EpP1" component={PerthBudget} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="EpP2" component={PerthDayNight} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="PreviewExt" component={PreviewExt} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
