import type { AppTab } from '../../types';

const STORAGE_KEY = 'flowassist-career-route';

export const loadPersistedTab = (): AppTab => {
  if (typeof window === 'undefined') {
    return 'start';
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'cv' || saved === 'plan' || saved === 'profil' || saved === 'start') {
    return saved;
  }

  return 'start';
};

export const persistTab = (tab: AppTab) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, tab);
};
