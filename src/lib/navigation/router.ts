import type { AppTab } from '../../types';

export const APP_TABS: { id: AppTab; label: string }[] = [
  { id: 'start', label: 'Start' },
  { id: 'cv', label: 'CV' },
  { id: 'plan', label: 'Plan' },
  { id: 'profil', label: 'Profil' },
];

export const getTabHash = (tab: AppTab) => `#/${tab}`;

export const getTabFromHash = (hash: string): AppTab => {
  const normalized = hash.replace(/^#\/?/, '').toLowerCase();
  if (normalized === 'cv' || normalized === 'plan' || normalized === 'profil') {
    return normalized;
  }

  return 'start';
};
