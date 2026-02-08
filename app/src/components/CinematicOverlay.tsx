import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { useDoctrineStore } from '../store';
import { CHAPTERS, FINAL_QUOTE } from '../data/doctrine';

// ─── Typewriter Hook ─────────────────────────────────────────
function useTypewriter(text: string, speed: number = 30, active: boolean = true) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const prevText = useRef('');

  useEffect(() => {
    if (text !== prevText.current) {
      prevText.current = text;
      indexRef.current = 0;
      setDisplayed('');
    }
  }, [text]);

  useEffect(() => {
    if (!active) return;
    if (indexRef.current >= text.length) return;

    const timer = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, active]);

  return displayed;
}

// ─── Intro Overlay ───────────────────────────────────────────
function IntroOverlay() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out at end of intro
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleFade, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.introContainer} pointerEvents="none">
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={styles.introTitle}>THE DOCTRINE OF{'\n'}TENSOR ZERO</Text>
      </Animated.View>
      <Animated.View style={{ opacity: subtitleFade, alignItems: 'center', marginTop: 24 }}>
        <View style={styles.introDivider} />
        <Text style={styles.introSubtitle}>A Calculus of Totality</Text>
      </Animated.View>
    </View>
  );
}

// ─── Touring Overlay ─────────────────────────────────────────
function TouringOverlay() {
  const tourChapterIndex = useDoctrineStore((s) => s.tourChapterIndex);
  const tourSubPhase = useDoctrineStore((s) => s.tourSubPhase);
  const quoteIndex = useDoctrineStore((s) => s.quoteIndex);

  const chapter = CHAPTERS[tourChapterIndex];
  if (!chapter) return null;

  const quote = chapter.quotes[quoteIndex % chapter.quotes.length];
  const showText = tourSubPhase === 'dwell' || tourSubPhase === 'approach';

  const titleFade = useRef(new Animated.Value(0)).current;
  const quoteFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    titleFade.setValue(0);
    Animated.timing(titleFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [tourChapterIndex]);

  useEffect(() => {
    if (tourSubPhase === 'depart') {
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(quoteFade, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [tourSubPhase]);

  useEffect(() => {
    if (tourSubPhase === 'dwell') {
      quoteFade.setValue(0);
      Animated.timing(quoteFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [tourSubPhase, quoteIndex]);

  const typedQuote = useTypewriter(
    quote.replace(/\n/g, ' '),
    35,
    tourSubPhase === 'dwell'
  );

  return (
    <View style={styles.touringContainer} pointerEvents="box-none">
      {/* Letterbox bars */}
      <View style={styles.letterboxTop} />
      <View style={styles.letterboxBottom} />

      {/* Chapter title */}
      <Animated.View style={[styles.chapterTitleContainer, { opacity: titleFade }]}>
        <View style={[styles.chapterAccent, { backgroundColor: chapter.color }]} />
        <Text style={[styles.chapterNumber, { color: chapter.color }]}>
          {chapter.title.split('.')[0]}.
        </Text>
        <Text style={styles.chapterTitle}>
          {chapter.title.split('. ')[1]}
        </Text>
        <Text style={[styles.chapterSubtitle, { color: chapter.color }]}>
          {chapter.subtitle}
        </Text>
      </Animated.View>

      {/* Quote (typewriter) */}
      {showText && (
        <Animated.View style={[styles.quoteContainer, { opacity: quoteFade }]}>
          <Text style={styles.quoteText}>
            {typedQuote}
            <Text style={styles.cursor}>|</Text>
          </Text>
        </Animated.View>
      )}

      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {CHAPTERS.map((ch, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === tourChapterIndex && {
                backgroundColor: chapter.color,
                width: 24,
                borderRadius: 4,
              },
              i < tourChapterIndex && { backgroundColor: '#555', opacity: 0.8 },
            ]}
          />
        ))}
      </View>

      {/* Hint */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Click anywhere to explore freely</Text>
      </View>
    </View>
  );
}

// ─── Free Explore Overlay ────────────────────────────────────
function FreeExploreOverlay() {
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const resumeTour = useDoctrineStore((s) => s.resumeTour);
  const flyToChapter = useDoctrineStore((s) => s.flyToChapter);
  const tourChapterIndex = useDoctrineStore((s) => s.tourChapterIndex);
  const tourPaused = useDoctrineStore((s) => s.tourPaused);

  const activeData = activeChapter !== null ? CHAPTERS[activeChapter] : null;

  return (
    <View style={styles.freeContainer} pointerEvents="box-none">
      {/* Controls hint */}
      <View style={styles.freeHintTop} pointerEvents="none">
        <Text style={styles.freeHintText}>
          WASD to fly{'  |  '}Drag to look{'  |  '}Click orbs to visit
        </Text>
      </View>

      {/* Active chapter indicator */}
      {activeData && (
        <View style={styles.freeChapterIndicator} pointerEvents="none">
          <View style={[styles.chapterAccent, { backgroundColor: activeData.color }]} />
          <Text style={[styles.freeChapterTitle, { color: activeData.color }]}>
            {activeData.title}
          </Text>
        </View>
      )}

      {/* Resume tour button */}
      {tourPaused && tourChapterIndex < CHAPTERS.length - 1 && (
        <Pressable
          onPress={resumeTour}
          style={({ hovered }: any) => [
            styles.resumeButton,
            hovered && styles.resumeButtonHovered,
          ]}
        >
          <Text style={styles.resumeButtonText}>Resume Tour</Text>
        </Pressable>
      )}

      {/* Chapter nav dots */}
      <View style={styles.freeNavBar}>
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <Pressable
              key={ch.id}
              onPress={() => flyToChapter(ch.id)}
              style={[styles.freeNavItem]}
            >
              <View
                style={[
                  styles.freeNavDot,
                  { backgroundColor: ch.color },
                  isActive && styles.freeNavDotActive,
                ]}
              />
              {isActive && (
                <Text style={[styles.freeNavLabel, { color: ch.color }]}>
                  {ch.subtitle}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Outro Overlay ───────────────────────────────────────────
function OutroOverlay() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }, 5500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.outroContainer} pointerEvents="none">
      {/* Letterbox bars */}
      <View style={styles.letterboxTop} />
      <View style={styles.letterboxBottom} />

      <Animated.View style={[styles.outroTextContainer, { opacity: fadeAnim }]}>
        <View style={styles.outroDivider} />
        <Text style={styles.outroQuote}>{FINAL_QUOTE.replace(/\n/g, '\n')}</Text>
        <View style={styles.outroDivider} />
      </Animated.View>
    </View>
  );
}

// ─── Main Overlay ────────────────────────────────────────────
export default function CinematicOverlay() {
  const tourPhase = useDoctrineStore((s) => s.tourPhase);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {tourPhase === 'intro' && <IntroOverlay />}
      {tourPhase === 'touring' && <TouringOverlay />}
      {tourPhase === 'freeExplore' && <FreeExploreOverlay />}
      {tourPhase === 'outro' && <OutroOverlay />}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // ── Intro ──
  introContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    color: '#fff',
    fontSize: 32,
    letterSpacing: 10,
    fontWeight: '200',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 48,
  },
  introDivider: {
    width: 50,
    height: 1,
    backgroundColor: '#444',
    marginBottom: 16,
  },
  introSubtitle: {
    color: '#666',
    fontSize: 14,
    letterSpacing: 5,
    fontWeight: '300',
    fontFamily: 'monospace',
  },

  // ── Touring ──
  touringContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  letterboxTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#000',
    zIndex: 20,
  },
  letterboxBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#000',
    zIndex: 20,
  },
  chapterTitleContainer: {
    position: 'absolute',
    top: 70,
    left: 50,
    maxWidth: 400,
  },
  chapterAccent: {
    width: 30,
    height: 3,
    marginBottom: 12,
  },
  chapterNumber: {
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: '300',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  chapterSubtitle: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '400',
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  quoteContainer: {
    position: 'absolute',
    bottom: 100,
    left: 50,
    right: 50,
    maxWidth: 600,
  },
  quoteText: {
    color: '#ccc',
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: '300',
    fontFamily: 'monospace',
    lineHeight: 28,
  },
  cursor: {
    color: '#666',
    fontWeight: '100',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 55,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 21,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    zIndex: 21,
  },
  hintText: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  // ── Free Explore ──
  freeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  freeHintTop: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
  },
  freeHintText: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  freeChapterIndicator: {
    position: 'absolute',
    left: 30,
    top: '38%' as any,
    maxWidth: 300,
  },
  freeChapterTitle: {
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  resumeButton: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resumeButtonHovered: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  resumeButtonText: {
    color: '#aaa',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'monospace',
    fontWeight: '400',
  },
  freeNavBar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  freeNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  freeNavDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  freeNavDotActive: {
    opacity: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  freeNavLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },

  // ── Outro ──
  outroContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outroTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  outroDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#444',
    marginVertical: 20,
  },
  outroQuote: {
    color: '#ddd',
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: '300',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 34,
  },
});
