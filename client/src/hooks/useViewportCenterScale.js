import { useEffect, useRef, useState } from 'react';

const useViewportCenterScale = () => {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const reduceMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (reduceMotion) {
      setScale(1);
      setOpacity(1);
      return undefined;
    }

    let animationFrameId = 0;

    const updateScale = () => {
      const rect = element.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      const threshold = window.innerHeight * 0.45;
      const proximity = Math.max(0, 1 - Math.min(distance / threshold, 1));
      const nextScale = 1 + proximity * 0.16;
      const nextOpacity = 0.55 + proximity * 0.45;

      setScale(Number(nextScale.toFixed(3)));
      setOpacity(Number(nextOpacity.toFixed(3)));
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateScale);
    };

    scheduleUpdate();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return { ref, scale, opacity };
};

export default useViewportCenterScale;
