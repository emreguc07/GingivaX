'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="theme-toggle-btn" aria-label="Toggle Dark Mode" style={{ width: '40px', height: '40px' }}></button>;
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle Dark Mode"
      title={theme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
