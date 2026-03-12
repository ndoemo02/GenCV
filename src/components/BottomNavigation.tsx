import React from 'react';
import { Briefcase, Compass, House, UserRound } from 'lucide-react';
import type { AppTab } from '../types';

const items: Array<{ id: AppTab; label: string; icon: typeof House }> = [
  { id: 'start', label: 'START', icon: House },
  { id: 'cv', label: 'CV', icon: Briefcase },
  { id: 'plan', label: 'PLAN', icon: Compass },
  { id: 'profil', label: 'PROFIL', icon: UserRound },
];

export const BottomNavigation: React.FC<{
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
}> = ({ activeTab, onNavigate }) => (
  <nav className="fixed inset-x-0 bottom-0 z-50">
    <div className="mx-auto flex w-full max-w-xl items-center justify-between border-t border-white/10 bg-black/48 px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center"
          >
            <Icon size={20} className={active ? 'text-white drop-shadow-[0_0_7px_rgba(255,255,255,0.45)]' : 'text-white/40'} />
            <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${active ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
