import Experience from './src/Experience';
import CinematicOverlay from './src/components/CinematicOverlay';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <Experience />
      <CinematicOverlay />
    </div>
  );
}
