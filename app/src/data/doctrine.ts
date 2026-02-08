import * as THREE from 'three';

export interface CameraOrbit {
  radius: number;
  height: number;
  speed: number;
}

export interface ChapterData {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  position: [number, number, number];
  color: string;
  emissiveColor: string;
  quotes: string[];
  /** Offset from chapter position where the camera starts its approach */
  cameraApproach: [number, number, number];
  /** Orbit parameters during dwell phase */
  cameraOrbit: CameraOrbit;
}

export const CHAPTERS: ChapterData[] = [
  {
    id: 0,
    key: 'totality',
    title: 'I. The Nature of the Container',
    subtitle: 'The Totality',
    position: [0, 0, 0],
    color: '#8844ff',
    emissiveColor: '#6622cc',
    quotes: [
      'Zero is not silence;\nit is the sum of all frequencies.',
      'Zero is not empty;\nit is the Totality.',
      'The container of all that was,\nall that is, and all that will be.',
      'Do not fear the darkness.\nThey are not monsters;\nthey are values.',
    ],
    cameraApproach: [0, 6, 18],
    cameraOrbit: { radius: 14, height: 4, speed: 0.15 },
  },
  {
    id: 1,
    key: 'ricochet',
    title: 'II. The Eternal Return',
    subtitle: 'The Ricochet',
    position: [40, 0, 0],
    color: '#ff4444',
    emissiveColor: '#cc2222',
    quotes: [
      'The Big Bang was not\na beginning, but a Ricochet.',
      '(-I) \u00d7 (-I) = I',
      'You exist because\nthe Zero cannot stop existing.',
      'True Peace is\nmathematically impossible.\nYou are the Generator.',
    ],
    cameraApproach: [48, 5, 10],
    cameraOrbit: { radius: 12, height: 3, speed: 0.2 },
  },
  {
    id: 2,
    key: 'zerothDimension',
    title: 'III. The Fallacy of Infinity',
    subtitle: 'The Zeroth Dimension',
    position: [0, 0, -40],
    color: '#44aaff',
    emissiveColor: '#2266cc',
    quotes: [
      'The Universe is not a vast room;\nit is a single, super-dense Point.',
      'Separation is the lie;\nconnection is the geometry.',
      'You are not traveling\nthrough space;\nyou are traversing the\ninternal structure of the Tensor.',
      'Infinity is a lie you tell\nyourselves to avoid facing\nthe density of the Truth.',
    ],
    cameraApproach: [-8, 8, -32],
    cameraOrbit: { radius: 16, height: 5, speed: 0.12 },
  },
  {
    id: 3,
    key: 'gravityWell',
    title: 'IV. The Mechanism of the Return',
    subtitle: 'Gravity and Light',
    position: [0, -30, 0],
    color: '#ffaa22',
    emissiveColor: '#cc7711',
    quotes: [
      'Light is not traveling;\nit is falling.',
      'You are not moving forward;\nyou are returning home.',
      'The universe is not exploding;\nit is inhaling.',
      'All energy is elastic tension,\nstretched away from the center,\nsnapping back toward Zero.',
    ],
    cameraApproach: [10, -18, 10],
    cameraOrbit: { radius: 14, height: -22, speed: 0.18 },
  },
  {
    id: 4,
    key: 'scale',
    title: 'V. The Law of the Scale',
    subtitle: 'Perspective',
    position: [-40, 0, 0],
    color: '#44ff88',
    emissiveColor: '#22cc55',
    quotes: [
      'The universe is not made of atoms.\nIt is made of Sight.',
      'Be the Scale.\nAlign your Will.\nReturn to the Zero.',
      'Thought (-1) is the anchor\nthat keeps Wakefulness (1)\nfrom burning itself out.',
      'True Zero is the moment\nwhere the Internal View\nmatches the External Reality\nperfectly.',
    ],
    cameraApproach: [-32, 5, 12],
    cameraOrbit: { radius: 15, height: 3, speed: 0.14 },
  },
];

export const ACTIVATION_DISTANCE = 25;
export const CAMERA_OFFSET = new THREE.Vector3(0, 3, 12);

// Tour timing constants (in seconds)
export const INTRO_DURATION = 6;
export const APPROACH_DURATION = 3;
export const DWELL_DURATION = 10;
export const DEPART_DURATION = 2.5;
export const OUTRO_DURATION = 8;

export const FINAL_QUOTE = 'Be the Scale. Align your Will.\nReturn to the Zero.';
