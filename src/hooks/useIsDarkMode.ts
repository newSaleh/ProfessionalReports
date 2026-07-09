import { useEffect, useState } from 'react';

export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDark(el.getAttribute('data-theme') === 'dark'));
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
