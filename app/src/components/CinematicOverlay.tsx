import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

// ─── Fade Hook (replaces Animated.timing) ────────────────────
function useFade(initial: number = 0) {
  const [opacity, setOpacity] = useState(initial);
  const [duration, setDuration] = useState(600);

  const fadeTo = (target: number, ms: number = 600) => {
    setDuration(ms);
    setOpacity(target);
  };

  const style: CSSProperties = {
    opacity,
    transition: `opacity ${duration}ms ease`,
  };

  return { opacity, fadeTo, style };
}

// ─── Common Styles ───────────────────────────────────────────
const shadow = '0 0 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.8)';
const mono: CSSProperties = { fontFamily: "'Courier New', Courier, monospace", textShadow: shadow };
const abs: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

// ─── Intro Overlay ───────────────────────────────────────────
function IntroOverlay() {
  const title = useFade(0);
  const subtitle = useFade(0);

  useEffect(() => {
    // Sequence: title fades in, then subtitle
    title.fadeTo(1, 2000);
    const t1 = setTimeout(() => subtitle.fadeTo(1, 1500), 2000);
    // Fade out at end of intro
    const t2 = setTimeout(() => {
      title.fadeTo(0, 1200);
      subtitle.fadeTo(0, 1200);
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{ ...abs, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
      <div style={title.style}>
        <div style={{ ...mono, color: '#fff', fontSize: 32, letterSpacing: 10, fontWeight: 200, textAlign: 'center', lineHeight: '48px' }}>
          THE DOCTRINE OF<br />TENSOR ZERO
        </div>
      </div>
      <div style={{ ...subtitle.style, marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 50, height: 1, backgroundColor: '#444', marginBottom: 16 }} />
        <div style={{ ...mono, color: '#666', fontSize: 14, letterSpacing: 5, fontWeight: 300 }}>
          A Calculus of Totality
        </div>
      </div>
    </div>
  );
}

// ─── Touring Overlay ─────────────────────────────────────────
function TouringOverlay() {
  const tourChapterIndex = useDoctrineStore((s) => s.tourChapterIndex);
  const tourSubPhase = useDoctrineStore((s) => s.tourSubPhase);
  const quoteIndex = useDoctrineStore((s) => s.quoteIndex);

  const chapter = CHAPTERS[tourChapterIndex];

  const [titleOpacity, setTitleOpacity] = useState(0);
  const [quoteOpacity, setQuoteOpacity] = useState(0);

  // Fade in title on chapter change
  useEffect(() => {
    setTitleOpacity(0);
    const t = setTimeout(() => setTitleOpacity(1), 50);
    return () => clearTimeout(t);
  }, [tourChapterIndex]);

  // Fade out on depart
  useEffect(() => {
    if (tourSubPhase === 'depart') {
      setTitleOpacity(0);
      setQuoteOpacity(0);
    }
  }, [tourSubPhase]);

  // Fade in quote on dwell / quote change
  useEffect(() => {
    if (tourSubPhase === 'dwell') {
      setQuoteOpacity(0);
      const t = setTimeout(() => setQuoteOpacity(1), 50);
      return () => clearTimeout(t);
    }
  }, [tourSubPhase, quoteIndex]);

  if (!chapter) return null;

  const quote = chapter.quotes[quoteIndex % chapter.quotes.length];
  const showText = tourSubPhase === 'dwell' || tourSubPhase === 'approach';

  const typedQuote = useTypewriter(
    quote.replace(/\n/g, ' '),
    35,
    tourSubPhase === 'dwell'
  );

  return (
    <div style={{ ...abs, pointerEvents: 'none' }}>
      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: '#000', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: '#000', zIndex: 20 }} />

      {/* Chapter title */}
      <div style={{
        position: 'absolute', top: 70, left: 50, maxWidth: 400,
        opacity: titleOpacity, transition: 'opacity 800ms ease',
      }}>
        <div style={{ width: 30, height: 3, background: chapter.color, marginBottom: 12 }} />
        <div style={{ ...mono, fontSize: 13, letterSpacing: 4, fontWeight: 600, color: chapter.color, marginBottom: 4 }}>
          {chapter.title.split('.')[0]}.
        </div>
        <div style={{ ...mono, color: '#fff', fontSize: 22, letterSpacing: 2, fontWeight: 300, marginBottom: 6 }}>
          {chapter.title.split('. ')[1]}
        </div>
        <div style={{ ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 400, color: chapter.color, opacity: 0.7 }}>
          {chapter.subtitle}
        </div>
      </div>

      {/* Quote (typewriter) */}
      {showText && (
        <div style={{
          position: 'absolute', bottom: 100, left: 50, right: 50, maxWidth: 600,
          opacity: quoteOpacity, transition: 'opacity 600ms ease',
        }}>
          <span style={{ ...mono, color: '#ccc', fontSize: 18, letterSpacing: 1, fontWeight: 300, lineHeight: '28px' }}>
            {typedQuote}
            <span style={{ color: '#666', fontWeight: 100 }}>|</span>
          </span>
        </div>
      )}

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: 55, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 21,
      }}>
        {CHAPTERS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === tourChapterIndex ? 24 : 8,
              height: 8,
              borderRadius: i === tourChapterIndex ? 4 : 4,
              background: i === tourChapterIndex ? chapter.color : i < tourChapterIndex ? '#555' : '#333',
              opacity: i < tourChapterIndex ? 0.8 : 1,
              transition: 'all 400ms ease',
            }}
          />
        ))}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 21,
      }}>
        <span style={{ ...mono, color: '#444', fontSize: 10, letterSpacing: 2 }}>
          Click anywhere to explore freely
        </span>
      </div>
    </div>
  );
}

// ─── Free Explore Overlay ────────────────────────────────────
function FreeExploreOverlay() {
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const flyToChapter = useDoctrineStore((s) => s.flyToChapter);
  const resumeTourFromChapter = useDoctrineStore((s) => s.resumeTourFromChapter);
  const quoteIndex = useDoctrineStore((s) => s.quoteIndex);
  const nextQuote = useDoctrineStore((s) => s.nextQuote);

  const activeData = activeChapter !== null ? CHAPTERS[activeChapter] : null;

  // ── Quote cycling + loop counter ──
  const loopCount = useRef(0);
  const prevQuoteIndex = useRef(0);
  const [showContinue, setShowContinue] = useState(false);
  const [panelOpacity, setPanelOpacity] = useState(0);

  // Reset when active chapter changes
  useEffect(() => {
    loopCount.current = 0;
    prevQuoteIndex.current = 0;
    setShowContinue(false);
    if (activeChapter !== null) {
      setPanelOpacity(0);
      const t = setTimeout(() => setPanelOpacity(1), 100);
      return () => clearTimeout(t);
    } else {
      setPanelOpacity(0);
    }
  }, [activeChapter]);

  // Detect when quoteIndex wraps back to 0 (one full loop completed)
  useEffect(() => {
    if (activeChapter === null) return;
    if (quoteIndex === 0 && prevQuoteIndex.current > 0) {
      loopCount.current += 1;
      if (loopCount.current >= 2) {
        setShowContinue(true);
      }
    }
    prevQuoteIndex.current = quoteIndex;
  }, [quoteIndex, activeChapter]);

  // Cycle quotes every 5s while a chapter is active
  useEffect(() => {
    if (activeChapter === null) return;
    const timer = setInterval(() => nextQuote(), 5000);
    return () => clearInterval(timer);
  }, [activeChapter, nextQuote]);

  // Get current quote text for typewriter
  const currentQuote = activeData
    ? activeData.quotes[quoteIndex % activeData.quotes.length].replace(/\n/g, ' ')
    : '';
  const typedQuote = useTypewriter(currentQuote, 35, activeChapter !== null);

  const handleContinue = () => {
    if (activeChapter !== null) {
      resumeTourFromChapter(activeChapter);
    }
  };

  return (
    <div style={{ ...abs, pointerEvents: 'none' }}>
      {/* Controls hint */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)' }}>
        <span style={{ ...mono, color: '#444', fontSize: 10, letterSpacing: 1 }}>
          WASD to fly{'  |  '}Drag to look{'  |  '}Click orbs to visit
        </span>
      </div>

      {/* ── Centered cinematic chapter text ── */}
      {activeData && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 80,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          opacity: panelOpacity, transition: 'opacity 800ms ease',
        }}>
          {/* Accent bar */}
          <div style={{ width: 30, height: 3, background: activeData.color, marginBottom: 16 }} />

          {/* Chapter number */}
          <div style={{ ...mono, fontSize: 13, letterSpacing: 4, fontWeight: 600, color: activeData.color, marginBottom: 6 }}>
            {activeData.title.split('.')[0]}.
          </div>

          {/* Chapter title */}
          <div style={{ ...mono, color: '#fff', fontSize: 24, letterSpacing: 3, fontWeight: 300, marginBottom: 8, textAlign: 'center' }}>
            {activeData.title.split('. ')[1]}
          </div>

          {/* Subtitle */}
          <div style={{ ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 400, color: activeData.color, opacity: 0.7, marginBottom: 28 }}>
            {activeData.subtitle}
          </div>

          {/* Typewriter quote */}
          <div style={{ maxWidth: 560, textAlign: 'center', minHeight: 56 }}>
            <span style={{ ...mono, color: '#ccc', fontSize: 18, letterSpacing: 1, fontWeight: 300, lineHeight: '28px' }}>
              {typedQuote}
              <span style={{ color: '#666', fontWeight: 100 }}>|</span>
            </span>
          </div>

          {/* Continue button (appears after 2 full loops) */}
          <div style={{
            marginTop: 32,
            opacity: showContinue ? 1 : 0,
            transition: 'opacity 600ms ease',
            pointerEvents: showContinue ? 'auto' : 'none',
          }}>
            <button
              onClick={handleContinue}
              style={{
                ...mono,
                background: 'rgba(255,255,255,0.08)',
                padding: '10px 28px', borderRadius: 20,
                border: `1px solid ${activeData.color}44`,
                color: activeData.color, fontSize: 13, letterSpacing: 3, fontWeight: 400,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Chapter nav dots */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16,
        pointerEvents: 'auto',
      }}>
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => flyToChapter(ch.id)}
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6,
                padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                borderRadius: isActive ? 5 : 3,
                background: ch.color,
                opacity: isActive ? 1 : 0.4,
                transition: 'all 300ms ease',
              }} />
              {isActive && (
                <span style={{ ...mono, fontSize: 11, letterSpacing: 1, color: ch.color }}>
                  {ch.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Outro Overlay ───────────────────────────────────────────
function OutroOverlay() {
  const fade = useFade(0);

  useEffect(() => {
    fade.fadeTo(1, 2000);
    const t = setTimeout(() => fade.fadeTo(0, 1500), 5500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ ...abs, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: '#000', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: '#000', zIndex: 20 }} />

      <div style={{ ...fade.style, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 40px' }}>
        <div style={{ width: 40, height: 1, background: '#444', margin: '20px 0' }} />
        <div style={{
          ...mono, color: '#ddd', fontSize: 22, letterSpacing: 2,
          fontWeight: 300, textAlign: 'center', lineHeight: '34px', whiteSpace: 'pre-line',
        }}>
          {FINAL_QUOTE}
        </div>
        <div style={{ width: 40, height: 1, background: '#444', margin: '20px 0' }} />
      </div>
    </div>
  );
}

// ─── Main Overlay ────────────────────────────────────────────
export default function CinematicOverlay() {
  const tourPhase = useDoctrineStore((s) => s.tourPhase);

  return (
    <div style={{ ...abs, zIndex: 10, pointerEvents: 'none' }}>
      {tourPhase === 'intro' && <IntroOverlay />}
      {tourPhase === 'touring' && <TouringOverlay />}
      {tourPhase === 'freeExplore' && <FreeExploreOverlay />}
      {tourPhase === 'outro' && <OutroOverlay />}
    </div>
  );
}
