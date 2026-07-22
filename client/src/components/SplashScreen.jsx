import { useState, useEffect, useCallback } from 'react';
import FrameAnimation from './FrameAnimation';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [fadeOut, setFadeOut] = useState(false);

  const handleProgress = useCallback((p) => {
    setProgress(p);
  }, []);

  useEffect(() => {
    if (progress >= 15 && phase === 'loading') {
      setPhase('ready');
    }
  }, [progress, phase]);

  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 900);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-800 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <FrameAnimation loop={true} onProgress={handleProgress} />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 sm:pb-32 px-8">
        <div
          className={`transition-all duration-700 ease-out ${
            phase === 'ready' && !fadeOut
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          <h1
            className="text-5xl sm:text-7xl font-extrabold text-white font-display tracking-tight mb-3"
            style={{ textShadow: '0 0 60px rgba(220,38,38,0.5), 0 4px 20px rgba(0,0,0,0.5)' }}
          >
            BloodOcean
          </h1>
          <p
            className="text-lg sm:text-xl text-white/70 font-medium text-center"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            Every drop counts. Donate blood, save lives.
          </p>
        </div>

        <div className="w-48 sm:w-64 mt-10">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-2 text-center tabular-nums">
            {phase === 'loading' ? `Loading... ${progress}%` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
