import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Custom vignette + bloom-like glow using a fullscreen overlay quad.
 * This avoids `postprocessing` / `import.meta` issues entirely.
 *
 * The vignette is rendered as a screen-space overlay.
 * Bloom is achieved through the emissive materials already on scene objects.
 */

const vignetteVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const vignetteFragmentShader = `
  uniform float darkness;
  uniform float offset;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5);
    float dist = distance(uv, center);
    float vignette = smoothstep(offset, offset + 0.6, dist) * darkness;
    gl_FragColor = vec4(0.0, 0.0, 0.0, vignette);
  }
`;

function VignetteOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          darkness: { value: 0.75 },
          offset: { value: 0.25 },
        },
        vertexShader: vignetteVertexShader,
        fragmentShader: vignetteFragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Renders the vignette as a scene rendered on top via a second pass
 * using the onAfterRender approach, or simply as a screen-space overlay.
 */
export default function PostProcessing() {
  const { scene, camera } = useThree();
  const overlayScene = useMemo(() => new THREE.Scene(), []);
  const overlayCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );

  const vignetteMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          darkness: { value: 0.7 },
          offset: { value: 0.25 },
        },
        vertexShader: vignetteVertexShader,
        fragmentShader: vignetteFragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), vignetteMaterial);
    mesh.frustumCulled = false;
    overlayScene.add(mesh);
    return () => {
      overlayScene.remove(mesh);
    };
  }, [overlayScene, vignetteMaterial]);

  useFrame(({ gl }) => {
    // Render the vignette overlay on top (autoClear false to preserve the main scene)
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(overlayScene, overlayCamera);
    gl.autoClear = true;
  }, 1); // renderPriority 1 = runs after default (0)

  return null;
}
