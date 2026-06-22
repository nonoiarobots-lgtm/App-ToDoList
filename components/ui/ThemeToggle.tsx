'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from './Icon';

type Theme = 'light' | 'dark';
const KEY = 'cadence-theme';

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
}
function getServerSnapshot(): Theme {
  return 'light';
}
function appliquer(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* stockage indisponible */
  }
  document.documentElement.setAttribute('data-theme', t);
  listeners.forEach(l => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="theme-toggle">
      <button className={theme === 'light' ? 'active' : ''} onClick={() => appliquer('light')}>
        <Icon name="light_mode" size={18} /> Clair
      </button>
      <button className={theme === 'dark' ? 'active' : ''} onClick={() => appliquer('dark')}>
        <Icon name="dark_mode" size={18} /> Sombre
      </button>
    </div>
  );
}
