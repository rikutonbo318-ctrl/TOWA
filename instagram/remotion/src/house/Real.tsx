import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer, N8AO, SMAA, Vignette} from '@react-three/postprocessing';
import {continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {Cam} from './Scene3D';
import {retargetAll} from './Retarget';

// ---------- assets (HDRI sky/lighting + rigged human) ----------
type Assets = {hdr: THREE.DataTexture; xbot: GLTF; man: GLTF; manClips: Record<string, THREE.AnimationClip>; grass: THREE.Texture; wood: THREE.Texture; woodBump: THREE.Texture; woodRough: THREE.Texture};
const cache: Partial<Assets> = {};
let loading: Promise<void> | null = null;
export const HDR_FILE = 'hdr/quarry_01_1k.hdr';

export const useAssets = (hdrFile = HDR_FILE) => {
  const [ready, setReady] = useState(Boolean(cache.hdr && cache.xbot && cache.grass && cache.man && cache.wood));
  const [handle] = useState(() => (ready ? null : delayRender('3d assets')));
  useEffect(() => {
    if (ready) return;
    loading ??= Promise.all([
      new RGBELoader().loadAsync(staticFile(hdrFile)).then((t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        cache.hdr = t;
      }),
      new GLTFLoader().loadAsync(staticFile('models/Xbot.glb')).then((g) => {
        cache.xbot = g;
      }),
      new GLTFLoader().loadAsync(staticFile('models/readyplayer.me.glb')).then((g) => {
        cache.man = g;
      }),
      ...(['wood', 'woodBump', 'woodRough'] as const).map((k, i) =>
        new THREE.TextureLoader().loadAsync(staticFile(['tex/hardwood2_diffuse.jpg', 'tex/hardwood2_bump.jpg', 'tex/hardwood2_roughness.jpg'][i])).then((t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(1 / 2.0, 1 / 1.0); // metre UVs: one tile = 2.0 x 1.0 m
          t.anisotropy = 8;
          if (k === 'wood') t.colorSpace = THREE.SRGBColorSpace;
          cache[k] = t;
        }),
      ),
      new THREE.TextureLoader().loadAsync(staticFile('tex/grasslight-big.jpg')).then((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(40, 40);
        t.colorSpace = THREE.SRGBColorSpace;
        cache.grass = t;
      }),
    ]).then(() => {
      cache.manClips = retargetAll(cache.xbot!, cache.man!);
    });
    loading.then(() => {
      setReady(true);
      if (handle !== null) continueRender(handle);
    });
  }, []);
  return ready ? (cache as Assets) : null;
};

const toV = ([x, y, h]: [number, number, number]) => new THREE.Vector3(x, h, -y);

const Rig: React.FC<{cam: Cam; hdr: THREE.DataTexture; exposure: number; bgBlur: number}> = ({cam, hdr, exposure, bgBlur}) => {
  const {camera, scene, gl} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.copy(toV(cam.pos));
  c.fov = cam.fov ?? 50;
  c.near = 0.05;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(toV(cam.look));
  scene.environment = hdr;
  scene.background = hdr;
  scene.backgroundBlurriness = bgBlur;
  scene.environmentIntensity = 1.0;
  gl.toneMapping = THREE.AgXToneMapping;
  gl.toneMappingExposure = exposure;
  return null;
};

// realistic scene: HDRI image-based light, soft sun shadows, ambient occlusion
export const RealScene: React.FC<{cam: Cam; children: React.ReactNode; assets: Assets; exposure?: number; sun?: number; ao?: boolean; bgBlur?: number; hdr?: THREE.DataTexture; sunColor?: string}> = ({cam, children, assets, exposure = 1.0, sun = 2.2, ao = true, bgBlur = 0, hdr, sunColor = '#fff4e4'}) => {
  const {width, height} = useVideoConfig();
  return (
  <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}}>
    <Rig cam={cam} hdr={hdr ?? assets.hdr} exposure={exposure} bgBlur={bgBlur} />
    <directionalLight
      position={[-8, 16, 12]}
      intensity={sun}
      color={sunColor}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-18}
      shadow-camera-right={18}
      shadow-camera-top={18}
      shadow-camera-bottom={-18}
      shadow-camera-near={1}
      shadow-camera-far={70}
      shadow-bias={-0.0003}
      shadow-normalBias={0.03}
      shadow-radius={4}
    />
    {children}
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {ao ? <N8AO aoRadius={0.8} intensity={2.2} distanceFalloff={0.6} quality="performance" halfRes /> : <></>}
      <SMAA />
      <Vignette offset={0.25} darkness={0.35} />
    </EffectComposer>
  </ThreeCanvas>
  );
};

// ---------- rigged worker (mannequin body + helmet + safety vest) ----------
export type HumanAct = 'idle' | 'walk' | 'run' | 'hammer' | 'point' | 'measure' | 'wave' | 'shovel' | 'press' | 'crouch';

const pickBone = (root: THREE.Object3D, name: string) => root.getObjectByName(name) as THREE.Bone | undefined;

export type HumanProps = {a: Assets; x: number; y: number; h?: number; yaw: number; act: HumanAct; f: number; suit?: string; pants?: string; vest?: string; helmet?: string; phase?: number; tool?: 'hammer' | 'shovel' | 'tape'; uzu?: boolean};

// 渦さん's helmet mark: a black spiral (the 渦 of 渦巻建設) on a transparent canvas
let spiralTex: THREE.CanvasTexture | null = null;
const spiralTexture = () => {
  if (spiralTex) return spiralTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d')!;
  g.strokeStyle = '#111';
  g.lineWidth = 22;
  g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * Math.PI * 5.2;
    const r = 8 + t * 6.6;
    const px = 128 + r * Math.cos(t);
    const py = 128 + r * Math.sin(t);
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.stroke();
  spiralTex = new THREE.CanvasTexture(cv);
  spiralTex.colorSpace = THREE.SRGBColorSpace;
  return spiralTex;
};

export const Human: React.FC<HumanProps> = ({a, x, y, h = 0, yaw, act, f, suit = '#34465e', pants = '#2c3442', vest = '#f08a24', helmet = '#f4f4f2', phase = 0, tool, uzu}) => {
  const rig = useMemo(() => {
    const root = SkeletonUtils.clone(a.man.scene) as THREE.Object3D;
    const cutY = {value: 0.9};
    let skin: THREE.SkinnedMesh | null = null;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      if ((m as THREE.SkinnedMesh).isSkinnedMesh && !skin) skin = m as THREE.SkinnedMesh;
      const n = (m.material as THREE.Material).name;
      if (n === 'Wolf3D_Headwear') m.visible = false;
      else if (n === 'Wolf3D_Outfit_Top') {
        // work jacket: the avatar's coat tails are cut off just below the waist
        const mt = new THREE.MeshStandardMaterial({color: suit, roughness: 0.92});
        mt.onBeforeCompile = (sh) => {
          sh.uniforms.cutY = cutY;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLy;').replace('#include <project_vertex>', '#include <project_vertex>\nvLy = transformed.y;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLy;\nuniform float cutY;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vLy < cutY) discard;');
        };
        mt.side = THREE.DoubleSide;
        m.material = mt;
      }
      else if (n === 'Wolf3D_Outfit_Bottom') m.material = new THREE.MeshStandardMaterial({color: pants, roughness: 0.92});
      else if (n === 'Wolf3D_Outfit_Footwear') m.material = new THREE.MeshStandardMaterial({color: '#3a2e25', roughness: 0.7});
    });
    root.updateMatrixWorld(true);
    const head = pickBone(root, 'Head')!;
    const top = pickBone(root, 'HeadTop_End')!;
    const spine = pickBone(root, 'Spine2')!;
    const ws = new THREE.Vector3();
    head.getWorldScale(ws);
    const k = 1 / ws.x;
    const hel = new THREE.Group();
    const hm = new THREE.MeshStandardMaterial({color: helmet, roughness: 0.3});
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hm);
    dome.scale.set(1, 0.95, 1.12);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.13, 0.01, 32), hm);
    brim.scale.set(1, 1, 1.18);
    brim.position.set(0, 0, 0.025);
    dome.castShadow = brim.castShadow = true;
    hel.add(dome, brim);
    if (uzu) {
      // spiral marks on the front and both sides of the helmet, so 渦さん reads from any camera angle
      const dm = new THREE.MeshBasicMaterial({map: spiralTexture(), transparent: true, depthWrite: false});
      for (const [ang, yy] of [[0, 0.045], [Math.PI / 2, 0.04], [-Math.PI / 2, 0.04]] as [number, number][]) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), dm);
        const rr = 0.121;
        d.position.set(Math.sin(ang) * rr, yy, Math.cos(ang) * rr * 1.12);
        d.rotation.set(-0.35, ang, 0);
        hel.add(d);
      }
    }
    hel.scale.setScalar(k);
    hel.position.copy(top.position).multiplyScalar(0.55);
    hel.position.z += 0.005 * k;
    head.add(hel);
    spine.getWorldScale(ws);
    const kv = 1 / ws.x;
    const vm = new THREE.MeshStandardMaterial({color: vest, roughness: 0.65, side: THREE.DoubleSide});
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.15, 0.34, 28, 1, true), vm);
    v.castShadow = true;
    v.scale.set(kv * 1.16, kv, kv * 0.98);
    v.position.set(0, -0.06 * kv, 0.005 * kv);
    spine.add(v);
    const bm = new THREE.MeshStandardMaterial({color: '#e9eef0', roughness: 0.2, metalness: 0.4, side: THREE.DoubleSide});
    for (const yy of [-0.1, -0.17]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.158, 0.025, 28, 1, true), bm);
      band.scale.set(kv * 1.17, kv, kv * 0.99);
      band.position.set(0, yy * kv, 0.005 * kv);
      spine.add(band);
    }
    let toolObj: THREE.Group | null = null;
    if (tool) {
      const g = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({color: '#a07a4a', roughness: 0.7});
      const steel = new THREE.MeshStandardMaterial({color: '#6b6f74', roughness: 0.35, metalness: 0.8});
      // tool axis = local +Y (grip at origin)
      const add = (geo: THREE.BufferGeometry, m: THREE.Material, px: number, py: number, pz: number) => {
        const me = new THREE.Mesh(geo, m);
        me.position.set(px, py, pz);
        me.castShadow = true;
        g.add(me);
      };
      if (tool === 'hammer') {
        add(new THREE.CylinderGeometry(0.013, 0.016, 0.3, 10), wood, 0, 0.1, 0);
        add(new THREE.BoxGeometry(0.035, 0.035, 0.12), steel, 0, 0.24, 0.02);
      } else if (tool === 'shovel') {
        add(new THREE.CylinderGeometry(0.016, 0.016, 1.15, 10), wood, 0, -0.35, 0);
        add(new THREE.BoxGeometry(0.21, 0.28, 0.012), steel, 0, -1.02, 0);
      } else {
        add(new THREE.BoxGeometry(0.07, 0.07, 0.035), new THREE.MeshStandardMaterial({color: '#e8c21a', roughness: 0.4}), 0, 0.03, 0);
      }
      root.add(g);
      toolObj = g;
    }
    const mixer = new THREE.AnimationMixer(root);
    return {root, mixer, clips: a.manClips, toolObj, cutY};
  }, [a, suit, pants, vest, helmet, tool, uzu]);

  const t = (f + phase) / 30;
  const base = act === 'walk' ? 'walk' : act === 'run' ? 'run' : 'idle';
  rig.mixer.stopAllAction();
  const action = rig.mixer.clipAction(rig.clips[base]);
  action.reset().play();
  rig.mixer.setTime(t);

  // poses layered on top of the clip: bones are aimed at directions in the body's own frame
  // (+Z forward, +Y up, +X the body's left), so they don't depend on each rig's bone axes
  const root = rig.root;
  root.updateMatrixWorld(true);
  const rootQ = new THREE.Quaternion();
  root.getWorldQuaternion(rootQ);
  const rootQi = rootQ.clone().invert();
  const rootMi = root.matrixWorld.clone().invert();
  const B = (n: string) => pickBone(root, n)!;
  const lp = (o: THREE.Object3D) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(rootMi);
  const lq = (o: THREE.Object3D) => o.getWorldQuaternion(new THREE.Quaternion()).premultiply(rootQi);
  const setLq = (b: THREE.Bone, q: THREE.Quaternion) => {
    b.quaternion.copy(lq(b.parent!).invert().multiply(q));
    b.updateMatrixWorld(true);
  };
  const aim = (bone: string, child: string, x: number, y: number, z: number) => {
    const b = B(bone);
    const d0 = lp(B(child)).sub(lp(b)).normalize();
    const d1 = new THREE.Vector3(x, y, z).normalize();
    setLq(b, new THREE.Quaternion().setFromUnitVectors(d0, d1).multiply(lq(b)));
  };
  const bend = (bone: string, ang: number) => {
    const b = B(bone);
    setLq(b, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ang).multiply(lq(b)));
  };
  const R = (x: number, y: number, z: number, fx: number, fy: number, fz: number) => {
    aim('RightArm', 'RightForeArm', x, y, z);
    aim('RightForeArm', 'RightHand', fx, fy, fz);
  };
  const L = (x: number, y: number, z: number, fx: number, fy: number, fz: number) => {
    aim('LeftArm', 'LeftForeArm', x, y, z);
    aim('LeftForeArm', 'LeftHand', fx, fy, fz);
  };
  if (act === 'point') {
    R(-0.35, 0.1, 1, -0.3, 0.12, 1);
  } else if (act === 'wave') {
    R(-0.85, 0.5, 0.15, -0.25 + Math.sin(t * 9) * 0.35, 1, 0.15);
  } else if (act === 'hammer') {
    const c = ((f + phase) % 16) / 16;
    const up = c < 0.65 ? c / 0.65 : Math.max(0, 1 - (c - 0.65) / 0.12);
    bend('Spine', 0.25);
    bend('Spine1', 0.15);
    R(-0.35, -0.55 + 0.75 * up, 0.75, -0.2, -0.6 + 1.7 * up, 0.8 - 0.5 * up);
    L(0.2, -0.65, 0.75, -0.1, -0.45, 1);
  } else if (act === 'measure' || act === 'press') {
    bend('Spine', act === 'press' ? 0.35 : 0.2);
    bend('Spine1', act === 'press' ? 0.2 : 0.1);
    R(-0.25, -0.6, 0.8, 0.05, -0.5, 1);
    L(0.25, -0.6, 0.8, -0.05, -0.5, 1);
  } else if (act === 'shovel') {
    const k = Math.sin(t * 5);
    bend('Spine', 0.35 + 0.12 * k);
    bend('Spine1', 0.15);
    R(-0.3, -0.9, 0.15, 0.1, -0.35, 1);
    L(0.2, -0.75, 0.65 + 0.15 * k, -0.15, -0.9 + 0.2 * k, 0.6);
  } else if (act === 'crouch') {
    const hips = B('Hips');
    hips.position.y -= 0.38;
    hips.updateMatrixWorld(true);
    for (const sd of ['Left', 'Right']) {
      aim(sd + 'UpLeg', sd + 'Leg', sd === 'Left' ? 0.15 : -0.15, -0.35, 1);
      aim(sd + 'Leg', sd + 'Foot', 0, -1, -0.25);
    }
    bend('Spine', 0.35);
    R(-0.2, -0.75, 0.6, 0, -0.6, 1);
    L(0.25, -0.8, 0.5, 0, -0.6, 1);
  }
  rig.cutY.value = lp(B('Hips')).y - 0.06;
  // tool follows the right hand
  if (rig.toolObj) {
    const hand = lp(B('RightHand'));
    const tip = lp(B('RightHandMiddle1'));
    rig.toolObj.position.copy(hand).lerp(tip, 0.6);
    const fore = hand.clone().sub(lp(B('RightForeArm'))).normalize();
    if (tool === 'shovel') {
      // handle runs from the right hand through the left hand and down to the blade
      const lh = lp(B('LeftHand'));
      const d = lh.sub(hand).normalize();
      rig.toolObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
    } else if (tool === 'hammer') {
      // handle points out of the fist, roughly perpendicular to the forearm and upward
      const side = new THREE.Vector3(-1, 0, 0);
      const dir = fore.clone().cross(side).normalize().multiplyScalar(-1).lerp(fore, 0.25).normalize();
      rig.toolObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    } else {
      rig.toolObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fore);
    }
  }

  return <primitive object={rig.root} position={[x, h, -y]} rotation={[0, (yaw * Math.PI) / 180 + Math.PI / 2, 0]} />;
};

// lawn with a real grass texture
export const Lawn: React.FC<{tex: THREE.Texture; h?: number}> = ({tex, h = -0.6}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, h, -3]} receiveShadow>
    <planeGeometry args={[300, 300]} />
    <meshStandardMaterial map={tex} roughness={1} color="#c8d8b0" />
  </mesh>
);

// an extra HDRI (e.g. dusk) loaded on demand
const hdrCache: Record<string, THREE.DataTexture> = {};
export const useHdr = (file: string) => {
  const [t, setT] = useState<THREE.DataTexture | null>(hdrCache[file] ?? null);
  const [handle] = useState(() => (t ? null : delayRender('hdr ' + file)));
  useEffect(() => {
    if (t) return;
    new RGBELoader().loadAsync(staticFile(file)).then((x) => {
      x.mapping = THREE.EquirectangularReflectionMapping;
      hdrCache[file] = x;
      setT(x);
      if (handle !== null) continueRender(handle);
    });
  }, []);
  return t;
};
