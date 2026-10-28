import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene3D} from './Scene3D';
import {House3D} from './House3D';
import {FL1} from './House';

export const PreviewExt: React.FC = () => (
  <AbsoluteFill>
    <Scene3D cam={{pos: [24, -26, 6.5], look: [4.4, 3.0, 3.2], fov: 48}}>
      <House3D />
    </Scene3D>
  </AbsoluteFill>
);

export const PreviewInt: React.FC = () => (
  <AbsoluteFill>
    <Scene3D interior cam={{pos: [6.0, 2.75, FL1 + 1.5], look: [1.4, 3.7, FL1 + 1.0], fov: 62}}>
      <House3D />
    </Scene3D>
  </AbsoluteFill>
);

export const PreviewInt2: React.FC = () => (
  <AbsoluteFill>
    <Scene3D interior cam={{pos: [3.6, 3.85, FL1 + 1.55], look: [6.0, 0.7, FL1 + 1.05], fov: 62}}>
      <House3D />
    </Scene3D>
  </AbsoluteFill>
);
