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
    <Composition id="EpP1" component={PerthBudget} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="EpP2" component={PerthDayNight} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="PreviewExt" component={PreviewExt} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
