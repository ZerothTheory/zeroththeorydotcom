import { create } from 'zustand';
import * as THREE from 'three';
import { CHAPTERS, type ChapterData } from './data/doctrine';

export type TourPhase = 'intro' | 'touring' | 'freeExplore' | 'outro';
export type TourSubPhase = 'approach' | 'dwell' | 'depart';

interface DoctrineState {
  // Active chapter (proximity-based in free explore, tour-driven in tour)
  activeChapter: number | null;

  // Tour state machine
  tourPhase: TourPhase;
  tourChapterIndex: number;
  tourSubPhase: TourSubPhase;
  tourPaused: boolean;
  phaseElapsed: number; // seconds elapsed in current sub-phase

  // Quote cycling
  quoteIndex: number;

  // Free explore camera target
  cameraTarget: THREE.Vector3 | null;
  isTransitioning: boolean;

  // Actions
  setActiveChapter: (id: number | null) => void;
  setPhaseElapsed: (t: number) => void;
  addPhaseElapsed: (dt: number) => void;

  // Tour control
  startTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  resumeTourFromChapter: (id: number) => void;
  advanceTour: () => void;
  setTourSubPhase: (sub: TourSubPhase) => void;
  finishTour: () => void;
  enterFreeExplore: () => void;

  // Free explore
  flyToChapter: (id: number) => void;
  clearTarget: () => void;
  setTransitioning: (v: boolean) => void;

  // Quotes
  nextQuote: () => void;
  setQuoteIndex: (i: number) => void;

  getActiveChapterData: () => ChapterData | null;
}

export const useDoctrineStore = create<DoctrineState>((set, get) => ({
  activeChapter: null,
  tourPhase: 'intro',
  tourChapterIndex: 0,
  tourSubPhase: 'approach',
  tourPaused: false,
  phaseElapsed: 0,
  quoteIndex: 0,
  cameraTarget: null,
  isTransitioning: false,

  setActiveChapter: (id) => {
    const prev = get().activeChapter;
    if (prev !== id) {
      set({ activeChapter: id, quoteIndex: 0 });
    }
  },

  setPhaseElapsed: (t) => set({ phaseElapsed: t }),
  addPhaseElapsed: (dt) => set({ phaseElapsed: get().phaseElapsed + dt }),

  // --- Tour control ---
  startTour: () =>
    set({
      tourPhase: 'touring',
      tourChapterIndex: 0,
      tourSubPhase: 'approach',
      phaseElapsed: 0,
      activeChapter: 0,
      quoteIndex: 0,
    }),

  pauseTour: () => {
    if (get().tourPhase === 'intro' || get().tourPhase === 'outro') return;
    set({ tourPaused: true, tourPhase: 'freeExplore' });
  },

  resumeTour: () => {
    const { tourChapterIndex } = get();
    // Resume at the next chapter if we were mid-chapter, or same chapter
    const nextIdx = Math.min(tourChapterIndex + 1, CHAPTERS.length - 1);
    set({
      tourPaused: false,
      tourPhase: 'touring',
      tourChapterIndex: nextIdx,
      tourSubPhase: 'approach',
      phaseElapsed: 0,
      activeChapter: nextIdx,
      quoteIndex: 0,
    });
  },

  resumeTourFromChapter: (id) =>
    set({
      tourPaused: false,
      tourPhase: 'touring',
      tourChapterIndex: id,
      tourSubPhase: 'approach',
      phaseElapsed: 0,
      activeChapter: id,
      quoteIndex: 0,
    }),

  advanceTour: () => {
    const { tourSubPhase, tourChapterIndex } = get();

    if (tourSubPhase === 'approach') {
      set({ tourSubPhase: 'dwell', phaseElapsed: 0, quoteIndex: 0 });
    } else if (tourSubPhase === 'dwell') {
      set({ tourSubPhase: 'depart', phaseElapsed: 0 });
    } else if (tourSubPhase === 'depart') {
      const nextIdx = tourChapterIndex + 1;
      if (nextIdx >= CHAPTERS.length) {
        // All chapters done -> outro
        set({ tourPhase: 'outro', phaseElapsed: 0 });
      } else {
        set({
          tourChapterIndex: nextIdx,
          tourSubPhase: 'approach',
          phaseElapsed: 0,
          activeChapter: nextIdx,
          quoteIndex: 0,
        });
      }
    }
  },

  setTourSubPhase: (sub) => set({ tourSubPhase: sub, phaseElapsed: 0 }),

  finishTour: () =>
    set({ tourPhase: 'outro', phaseElapsed: 0 }),

  enterFreeExplore: () =>
    set({ tourPhase: 'freeExplore', tourPaused: false }),

  // --- Free explore ---
  flyToChapter: (id) => {
    const chapter = CHAPTERS[id];
    if (!chapter) return;
    const target = new THREE.Vector3(...chapter.position);
    set({
      cameraTarget: target,
      isTransitioning: true,
      activeChapter: id,
      tourChapterIndex: id,
    });
  },

  clearTarget: () =>
    set({ cameraTarget: null, isTransitioning: false }),

  setTransitioning: (v) => set({ isTransitioning: v }),

  // --- Quotes ---
  nextQuote: () => {
    const { activeChapter, quoteIndex } = get();
    if (activeChapter === null) return;
    const chapter = CHAPTERS[activeChapter];
    if (!chapter) return;
    set({ quoteIndex: (quoteIndex + 1) % chapter.quotes.length });
  },

  setQuoteIndex: (i) => set({ quoteIndex: i }),

  getActiveChapterData: () => {
    const { activeChapter } = get();
    if (activeChapter === null) return null;
    return CHAPTERS[activeChapter] ?? null;
  },
}));
