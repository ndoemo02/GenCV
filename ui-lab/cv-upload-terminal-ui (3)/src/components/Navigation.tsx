import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
}

export const NavItem = ({ icon: Icon, label, isActive }: NavItemProps) => (
  <button
    className={cn(
      "flex flex-col items-center gap-1 p-2 transition-all duration-300 group",
      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "text-blue-400")} />
    <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
  </button>
);

import { Layout, Shapes, Type, Image, Award, Upload } from 'lucide-react';

export const BottomNav = () => (
  <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-white/10 px-8 py-3 rounded-3xl flex items-center gap-10 z-50 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
    <NavItem icon={Layout} label="Szablony" />
    <NavItem icon={Shapes} label="Elementy" />
    <NavItem icon={Type} label="Tekst" />
    <NavItem icon={Image} label="Galeria" />
    <NavItem icon={Award} label="Marka" />
    <NavItem icon={Upload} label="Prześlij" isActive />
  </nav>
);
