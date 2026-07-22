import { useRef, useEffect, useCallback, useState } from 'react';

const TOTAL_FRAMES = 276;
const FPS = 46;

const getFrameSrc = (i) => `/frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;

const FrameAnimation = ({ loop = true, onProgress, className = '', style = {} }) => {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const loadedCountRef = useRef(0);
  const startedRef = useRef(false);

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let sw, sh, sx, sy;
    if (imgRatio > canvasRatio) {
      sh = img.naturalHeight;
      sw = sh * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    loadedCountRef.current = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loadedCountRef.current++;
        if (onProgress) onProgress(Math.round((loadedCountRef.current / TOTAL_FRAMES) * 100));

        if (loadedCountRef.current === Math.min(30, TOTAL_FRAMES) && !startedRef.current) {
          startedRef.current = true;
          lastTimeRef.current = performance.now();
          const interval = 1000 / FPS;

          const animate = (now) => {
            const elapsed = now - lastTimeRef.current;
            if (elapsed >= interval) {
              lastTimeRef.current = now - (elapsed % interval);
              resize();
              drawFrame(frameRef.current);
              frameRef.current++;
              if (frameRef.current >= TOTAL_FRAMES) {
                if (loop) {
                  frameRef.current = 0;
                } else {
                  return;
                }
              }
            }
            rafRef.current = requestAnimationFrame(animate);
          };
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      imagesRef.current.push(img);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [loop, drawFrame, onProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
    />
  );
};

export default FrameAnimation;
