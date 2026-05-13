'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable browser's automatic scroll restoration on reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Always scroll to top on path change or reload
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
