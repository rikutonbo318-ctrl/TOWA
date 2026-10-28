import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';

// mixamo clips (Xbot) -> readyplayer.me skeleton (same bone names without the prefix).
// Both rigs bind in a T-pose, so each bone gets the source's world-space rotation change from its bind pose.
const firstSkin = (o: THREE.Object3D) => {
  let skin: THREE.SkinnedMesh | null = null;
  o.traverse((c) => {
    if (!skin && (c as THREE.SkinnedMesh).isSkinnedMesh) skin = c as THREE.SkinnedMesh;
  });
  return skin as unknown as THREE.SkinnedMesh;
};
const bindRot = (sk: THREE.Skeleton, i: number) => {
  const q = new THREE.Quaternion();
  new THREE.Matrix4().copy(sk.boneInverses[i]).invert().decompose(new THREE.Vector3(), q, new THREE.Vector3());
  return q;
};
export const retargetAll = (src: GLTF, dst: GLTF) => {
  const sSkin = firstSkin(src.scene);
  const tSkin = firstSkin(dst.scene);
  const sSk = sSkin.skeleton;
  const tSk = tSkin.skeleton;
  dst.scene.updateMatrixWorld(true);
  const tHips = tSk.getBoneByName('Hips')!;
  const rootRot = new THREE.Quaternion();
  tHips.parent!.getWorldQuaternion(rootRot);
  const rootInv = new THREE.Matrix4().copy(tHips.parent!.matrixWorld).invert();
  const sHipsI = sSk.bones.findIndex((b) => b.name === 'mixamorigHips');
  const tHipsI = tSk.bones.indexOf(tHips);
  src.scene.updateMatrixWorld(true);
  const sHipY = new THREE.Vector3().setFromMatrixPosition(sSk.bones[sHipsI].matrixWorld).y;
  const tHipY = new THREE.Vector3().setFromMatrixPosition(tSk.bones[tHipsI].matrixWorld).y;
  const hipK = tHipY / sHipY; // world metres at rest
  const pairs = tSk.bones
    .map((tb, ti) => {
      const si = sSk.bones.findIndex((b) => b.name === 'mixamorig' + tb.name);
      return si < 0 ? null : {tb, ti, sb: sSk.bones[si], si, off: bindRot(sSk, si).invert().multiply(bindRot(tSk, ti))};
    })
    .filter(Boolean) as {tb: THREE.Bone; ti: number; sb: THREE.Bone; si: number; off: THREE.Quaternion}[];
  // parents first
  const depth = (b: THREE.Object3D) => {
    let d = 0;
    for (let p = b.parent; p; p = p.parent) d++;
    return d;
  };
  pairs.sort((p, q) => depth(p.tb) - depth(q.tb));
  const sMeshRot = new THREE.Quaternion();
  const out: Record<string, THREE.AnimationClip> = {};
  for (const name of ['idle', 'walk', 'run']) {
    const clip = src.animations.find((c) => c.name === name)!;
    const mixer = new THREE.AnimationMixer(src.scene);
    mixer.clipAction(clip).play();
    const n = Math.max(2, Math.round(clip.duration * 30));
    const times = new Float32Array(n);
    const qv = pairs.map(() => new Float32Array(n * 4));
    const pv = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const t = (k / (n - 1)) * clip.duration;
      times[k] = t;
      mixer.setTime(t);
      src.scene.updateMatrixWorld(true);
      sSkin.getWorldQuaternion(sMeshRot);
      const world = new Map<THREE.Object3D, THREE.Quaternion>();
      pairs.forEach((p, j) => {
        const ws = new THREE.Quaternion();
        p.sb.getWorldQuaternion(ws);
        ws.premultiply(sMeshRot.clone().invert());
        const wt = ws.multiply(p.off).premultiply(rootRot);
        world.set(p.tb, wt);
        const parentW = world.get(p.tb.parent!) ?? rootRot;
        const local = parentW.clone().invert().multiply(wt);
        local.toArray(qv[j], k * 4);
        if (p.tb === tHips) {
          const wp = new THREE.Vector3().setFromMatrixPosition(p.sb.matrixWorld);
          wp.multiplyScalar(hipK).applyMatrix4(rootInv);
          wp.toArray(pv, k * 3);
        }
      });
    }
    const tracks: THREE.KeyframeTrack[] = pairs.map((p, j) => new THREE.QuaternionKeyframeTrack(p.tb.name + '.quaternion', Array.from(times), Array.from(qv[j])));
    tracks.push(new THREE.VectorKeyframeTrack('Hips.position', Array.from(times), Array.from(pv)));
    out[name] = new THREE.AnimationClip(name, clip.duration, tracks);
    mixer.stopAllAction();
    mixer.uncacheRoot(src.scene);
  }
  return out;
};

