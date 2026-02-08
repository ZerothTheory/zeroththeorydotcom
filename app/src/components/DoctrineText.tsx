import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { CHAPTERS } from '../data/doctrine';
import { useDoctrineStore } from '../store';

/**
 * Renders floating doctrine text panels near each chapter.
 * Text fades in when the camera is near, cycles through quotes.
 * Uses refs + useFrame for smooth opacity animation.
 */

interface ChapterTextProps {
  chapterId: number;
}

function ChapterText({ chapterId }: ChapterTextProps) {
  const chapter = CHAPTERS[chapterId];
  const opacity = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const titleRef = useRef<any>(null);
  const subtitleRef = useRef<any>(null);
  const quoteRef = useRef<any>(null);
  const ruleRef = useRef<THREE.Mesh>(null);
  const quoteTimerRef = useRef(0);
  const currentQuoteIdx = useRef(0);

  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const nextQuote = useDoctrineStore((s) => s.nextQuote);
  const quoteIndex = useDoctrineStore((s) => s.quoteIndex);

  const isActive = activeChapter === chapterId;

  useFrame((_, delta) => {
    const targetOpacity = isActive ? 1 : 0;
    opacity.current += (targetOpacity - opacity.current) * delta * 2.5;
    const o = opacity.current;

    if (groupRef.current) {
      const pos = new THREE.Vector3(...chapter.position);
      pos.y += 7 + Math.sin(Date.now() * 0.001) * 0.2;
      groupRef.current.position.copy(pos);
      groupRef.current.visible = o > 0.01;
    }

    // Update text material opacities directly
    if (titleRef.current) {
      titleRef.current.fillOpacity = Math.min(o, 1);
    }
    if (subtitleRef.current) {
      subtitleRef.current.fillOpacity = Math.min(o * 0.8, 1);
    }
    if (quoteRef.current) {
      quoteRef.current.fillOpacity = Math.min(o, 1);
    }
    if (ruleRef.current) {
      (ruleRef.current.material as THREE.MeshBasicMaterial).opacity = o * 0.4;
    }

    // Cycle quotes
    if (isActive) {
      quoteTimerRef.current += delta;
      if (quoteTimerRef.current > 5) {
        quoteTimerRef.current = 0;
        nextQuote();
      }
    } else {
      quoteTimerRef.current = 0;
    }
  });

  const quote = chapter.quotes[quoteIndex % chapter.quotes.length];

  return (
    <group ref={groupRef} visible={false}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Chapter title */}
        <Text
          ref={titleRef}
          fontSize={0.6}
          color={chapter.color}
          anchorX="center"
          anchorY="bottom"
          position={[0, 2, 0]}
          fillOpacity={0}
          outlineWidth={0.02}
          outlineColor="#000000"
          maxWidth={20}
        >
          {chapter.title}
        </Text>

        {/* Subtitle */}
        <Text
          ref={subtitleRef}
          fontSize={0.35}
          color="#888888"
          anchorX="center"
          anchorY="bottom"
          position={[0, 1.2, 0]}
          fillOpacity={0}
          maxWidth={20}
        >
          {chapter.subtitle}
        </Text>

        {/* Horizontal rule */}
        <mesh ref={ruleRef} position={[0, 0.9, 0]}>
          <planeGeometry args={[8, 0.005]} />
          <meshBasicMaterial
            color={chapter.color}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* Quote text */}
        <Text
          ref={quoteRef}
          fontSize={0.4}
          color="#cccccc"
          anchorX="center"
          anchorY="top"
          position={[0, 0.5, 0]}
          fillOpacity={0}
          outlineWidth={0.01}
          outlineColor="#000000"
          textAlign="center"
          maxWidth={18}
          lineHeight={1.4}
        >
          {quote}
        </Text>
      </Billboard>
    </group>
  );
}

export default function DoctrineText() {
  return (
    <>
      {CHAPTERS.map((ch) => (
        <ChapterText key={ch.id} chapterId={ch.id} />
      ))}
    </>
  );
}
