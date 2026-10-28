import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {Lawn, RealScene, useAssets} from './Real';

const DELTAS: [string, number, number, number][] = [
  ['none', 0, 0, 0],
  ['x+', 1.2, 0, 0],
  ['x-', -1.2, 0, 0],
  ['y+', 0, 1.2, 0],
  ['y-', 0, -1.2, 0],
  ['z+', 0, 0, 1.2],
  ['z-', 0, 0, -1.2],
];
const One: React.FC<{gltf: any; clips: any; i: number; bone: string; row: number}> = ({gltf, clips, i, bone, row}) => {
  const root = useMemo(() => {
    const r = SkeletonUtils.clone(gltf.scene);
    let skin: any = null;
    r.traverse((o: any) => { if (o.isSkinnedMesh && !skin) skin = o; o.frustumCulled = false; });
    {
      const mixer = new THREE.AnimationMixer(r);
      mixer.clipAction(clips.idle).play();
      mixer.setTime(0.5);
    }
    const b = r.getObjectByName(bone)!;
    const [, x, y, z] = DELTAS[i];
    b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
    return r;
  }, [gltf, i, bone]);
  // all face the camera (camera looks north)
  return <primitive object={root} position={[(i - 3) * 1.1, row * 2.2, 0]} rotation={[0, Math.PI / 4, 0]} />;
};
export const PoseTest: React.FC = () => {
  const a = useAssets();
  if (!a) return null;
  return (
    <AbsoluteFill>
      <RealScene assets={a} ao={false} cam={{pos: [0, -9, 9], look: [0, 4.6, 0.6], fov: 50}}>
        <Lawn tex={a.grass} h={0} />
        {['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'Spine'].map((bn, r) => DELTAS.map((_, i) => <One key={bn + i} gltf={a.man} clips={a.manClips} i={i} bone={bn} row={r} />))}
      </RealScene>
    </AbsoluteFill>
  );
};
