import React from 'react';
import { Briefcase, Compass, House, UserRound } from 'lucide-react';
import type { AppTab } from '../types';

const items: Array<{ id: AppTab; label: string; icon: typeof House }> = [
  { id: 'start', label: 'Start', icon: House },
  { id: 'cv', label: 'CV', icon: Briefcase },
  { id: 'plan', label: 'Plan', icon: Compass },
  { id: 'profil', label: 'Profil', icon: UserRound },
];

export const BottomNavigation: React.FC<{
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
}> = ({ activeTab, onNavigate }) => (
  <nav className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6">
    <div className="mx-auto flex max-w-xl items-center justify-between rounded-[2rem] border border-white/10 bg-zinc-950/80 px-3 py-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-xs transition ${
              active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <Icon size={18} />
            <span className="font-mono uppercase tracking-[0.2em]">{item.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
