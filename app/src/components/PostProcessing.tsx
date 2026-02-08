import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Simple screen-space vignette using a camera-attached overlay quad.
 * This approach avoids manipulating gl.autoClear or calling gl.render(),
 * which can corrupt the R3F render pipeline.
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

export default function PostProcessing() {
  const { size } = useThree();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          darkness: { value: 0.65 },
          offset: { value: 0.3 },
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
    <mesh renderOrder={999} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
