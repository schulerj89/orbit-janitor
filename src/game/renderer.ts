import * as THREE from 'three/webgpu';
import { MAX_PIXEL_RATIO } from './constants';

export async function createRenderer(
  canvas: HTMLCanvasElement
): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    forceWebGL: false
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  await renderer.init();

  return renderer;
}
