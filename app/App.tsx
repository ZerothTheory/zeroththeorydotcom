import Experience from './src/Experience';
import CinematicOverlay from './src/components/CinematicOverlay';
import TouchControls from './src/components/TouchControls';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <Experience />
      <CinematicOverlay />
      <TouchControls />
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          textAlign: 'center',
          padding: '6px 0',
          pointerEvents: 'none',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 9,
          letterSpacing: 1,
          color: '#555',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        © 2026{' '}
        <a
          href="https://MichaelSimoneau.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#555',
            textDecoration: 'none',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#888'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
        >
          Michael Simoneau
        </a>
        . All rights reserved.
      </footer>
    </div>
  );
}
