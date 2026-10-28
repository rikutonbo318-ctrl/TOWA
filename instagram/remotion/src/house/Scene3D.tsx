import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Lawn, RealScene, useAssets} from './Real';
import {texFor} from './Tex';

export type Cam = {pos: [number, number, number]; look: [number, number, number]; fov?: number};
// plan coords (x east, y north, h up)
const toV = ([x, y, h]: [number, number, number]) => new THREE.Vector3(x, h, -y);

const CamRig: React.FC<{cam: Cam}> = ({cam}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.copy(toV(cam.pos));
  c.fov = cam.fov ?? 50;
  c.near = 0.05;
  c.far = 200;
  c.updateProjectionMatrix();
  c.lookAt(toV(cam.look));
  return null;
};

export const Scene3D: React.FC<{cam: Cam; children: React.ReactNode; interior?: boolean; sky?: string; noSite?: boolean; exposure?: number}> = ({cam, children, interior, noSite, exposure}) => {
  const a = useAssets();
  if (!a) return null;
  return (
    <RealScene assets={a} cam={cam} exposure={exposure ?? (interior ? 1.1 : 1.0)} sun={interior ? 1.8 : 2.4}>
      <Lawn tex={a.grass} h={noSite ? -0.62 : -0.001} />
      {noSite ? null : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.55, 0.002, -3.2]} receiveShadow>
          <planeGeometry args={[16, 14]} />
          <meshStandardMaterial map={texFor('gravel', 16, 14)} color="#d8d0c2" roughness={1} />
        </mesh>
      )}
      {children}
    </RealScene>
  );
};
