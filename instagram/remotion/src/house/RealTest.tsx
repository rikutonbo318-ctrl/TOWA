import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Human, Lawn, RealScene, useAssets} from './Real';
import {House3D} from './House3D';
import {FL1} from './House';

export const RealExt: React.FC = () => {
  const a = useAssets();
  const f = useCurrentFrame();
  if (!a) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} cam={{pos: [22, -22, 4.5], look: [4.4, 3.0, 3.0], fov: 50}}>
        <Lawn tex={a.grass} h={-0.6} />
        <House3D />
        <Human a={a} x={11} y={-3} yaw={180} act="walk" f={f} />
        <Human a={a} x={12.5} y={-1.5} yaw={150} act="point" f={f} suit="#3b3b3b" vest="#c9e400" />
        <Human a={a} x={9.5} y={-2} yaw={220} act="idle" f={f} phase={20} />
      </RealScene>
    </AbsoluteFill>
  );
};

export const RealInt: React.FC = () => {
  const a = useAssets();
  if (!a) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} exposure={1.1} sun={1.6} cam={{pos: [6.0, 2.75, FL1 + 1.5], look: [1.4, 3.7, FL1 + 1.0], fov: 62}}>
        <Lawn tex={a.grass} h={-0.6} />
        <House3D />
      </RealScene>
    </AbsoluteFill>
  );
};

export const RealPpl: React.FC = () => {
  const a = useAssets();
  const f = useCurrentFrame();
  if (!a) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} cam={{pos: [11.2, -9.5, 1.6], look: [11, -2.8, 0.6], fov: 42}}>
        <Lawn tex={a.grass} h={-0.6} />
        <House3D />
        <Human a={a} x={10.2} y={-2} h={-0.6} yaw={0} act="shovel" tool="shovel" f={f} />
        <Human a={a} x={11.5} y={-2.5} h={-0.6} yaw={-60} act="point" f={f} suit="#3b3b3b" vest="#c9e400" />
        <Human a={a} x={12.6} y={-1.8} h={-0.6} yaw={-110} act="hammer" tool="hammer" f={f} phase={20} />
        <Human a={a} x={9.2} y={-3.4} h={-0.6} yaw={40} act="wave" f={f} />
        <Human a={a} x={10.8} y={-4.6} h={-0.6} yaw={90} act="measure" tool="tape" f={f} suit="#5b5f52" vest="#c9e400" />
        <Human a={a} x={12.2} y={-4.2} h={-0.6} yaw={150} act="crouch" f={f} suit="#4a4038" />
      </RealScene>
    </AbsoluteFill>
  );
};
