export type ThemeMode = 'light' | 'dark';

const KEY = 'theme-mode';

export function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(KEY, mode);
}
