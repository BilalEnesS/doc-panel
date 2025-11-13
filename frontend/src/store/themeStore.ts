/**
 * Theme store using Zustand
 */

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  initialize: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'doc-panel-theme';

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  initialize: () => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (storedTheme) {
      applyTheme(storedTheme);
      set({ theme: storedTheme });
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme: Theme = prefersDark ? 'dark' : 'light';
    applyTheme(initialTheme);
    set({ theme: initialTheme });
  },
  toggleTheme: () => {
    const newTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    set({ theme: newTheme });
  },
  setTheme: (theme: Theme) => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },
}));


