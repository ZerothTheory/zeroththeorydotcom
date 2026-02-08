import { create } from 'zustand';
import * as THREE from 'three';
import { CHAPTERS, type ChapterData } from './data/doctrine';

interface DoctrineState {
  activeChapter: number | null;
  targetChapter: number | null;
  cameraTarget: THREE.Vector3 | null;
  isTransitioning: boolean;
  quoteIndex: number;

  setActiveChapter: (id: number | null) => void;
  flyToChapter: (id: number) => void;
  clearTarget: () => void;
  setTransitioning: (v: boolean) => void;
  nextQuote: () => void;
  getActiveChapterData: () => ChapterData | null;
}

export const useDoctrineStore = create<DoctrineState>((set, get) => ({
  activeChapter: null,
  targetChapter: null,
  cameraTarget: null,
  isTransitioning: false,
  quoteIndex: 0,

  setActiveChapter: (id) => {
    const prev = get().activeChapter;
    if (prev !== id) {
      set({ activeChapter: id, quoteIndex: 0 });
    }
  },

  flyToChapter: (id) => {
    const chapter = CHAPTERS[id];
    if (!chapter) return;
    const target = new THREE.Vector3(...chapter.position);
    set({
      targetChapter: id,
      cameraTarget: target,
      isTransitioning: true,
    });
  },

  clearTarget: () => {
    set({ targetChapter: null, cameraTarget: null, isTransitioning: false });
  },

  setTransitioning: (v) => set({ isTransitioning: v }),

  nextQuote: () => {
    const { activeChapter, quoteIndex } = get();
    if (activeChapter === null) return;
    const chapter = CHAPTERS[activeChapter];
    if (!chapter) return;
    set({ quoteIndex: (quoteIndex + 1) % chapter.quotes.length });
  },

  getActiveChapterData: () => {
    const { activeChapter } = get();
    if (activeChapter === null) return null;
    return CHAPTERS[activeChapter] ?? null;
  },
}));
