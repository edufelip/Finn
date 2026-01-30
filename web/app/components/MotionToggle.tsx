'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'finn:force-motion';

export default function MotionToggle() {
  const isDev = process.env.NODE_ENV === 'development';
  const [enabled, setEnabled] = useState(() => {
    if (!isDev || typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (!isDev || typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (!isDev) {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [isDev]);

  useEffect(() => {
    if (!isDev) {
      return;
    }
    document.documentElement.classList.toggle('force-motion', enabled);
  }, [enabled, isDev]);

  if (!isDev) {
    return null;
  }

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
    document.documentElement.classList.toggle('force-motion', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] shadow-[0_18px_36px_rgba(15,23,42,0.15)] backdrop-blur"
      aria-pressed={enabled}
    >
      Force motion: {enabled ? 'On' : 'Off'}{reducedMotion ? ' (reduce motion on)' : ''}
    </button>
  );
}
