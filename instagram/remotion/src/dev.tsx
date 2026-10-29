// 新しい話の試し書き用（本番の Root に入れる前に静止画で確認する）
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {Scene3D} from './house/Scene3D';
import {Person3D} from './house/Kit3D';
import {UZU} from './house/Uzu';
import {Ep09} from './house/Ep09';

const DogTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene3D cam={{pos: [0.5, -1.4, 1.65], look: [0, 0, 1.5], fov: 40}}>
      <Person3D x={0} y={0} yaw={270} act="idle" f={f} suit={UZU.suit} vest={UZU.vest} uzu phase={9} />
      <Person3D x={1.2} y={1.0} yaw={250} act="idle" f={f} phase={2} suit="#5a4a3a" />
    </Scene3D>
  );
};
const Dev: React.FC = () => (
  <>
    <Composition id="Dev" component={Ep09} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="DogTest" component={DogTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Dev);
