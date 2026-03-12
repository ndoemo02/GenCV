import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Plus, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  ChevronRight,
  Shield
} from 'lucide-react';

const Spotlight = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    {/* Top Beam - Conic gradient for narrow beam effect */}
    <div 
      className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[1000px] opacity-40 z-0"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, white 180deg, transparent 200deg)',
        filter: 'blur(80px)',
      }}
    />
    
    {/* Floor Glow (The Stage) */}
    <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] flex justify-center items-center">
      <div 
        className="w-[600px] h-[150px] rounded-[100%] bg-white/20 blur-[50px]"
      />
      <div 
        className="absolute w-[300px] h-[60px] rounded-[100%] bg-white/50 blur-[25px]"
      />
      <div 
        className="absolute w-[150px] h-[30px] rounded-[100%] bg-white/80 blur-[10px]"
      />
    </div>
  </div>
);

const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <button className={`flex flex-col items-center gap-1 group transition-all ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{label}</span>
  </button>
);

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Header Info */}
      <header className="relative z-20 p-8 flex justify-between items-start">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black text-xl rounded-sm transition-transform group-hover:scale-105">N</div>
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-bold tracking-tighter uppercase">Flow Assist</span>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest">v2.0.26-ALPHA</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">CORE SYSTEM STABLE</span>
          </div>
        </div>
      </header>

      {/* Main Stage Area */}
      <main className="relative flex-grow flex flex-col items-center justify-center">
        <Spotlight />
        
        {/* The CV Text on Stage */}
        <div className="relative z-10 perspective-1000 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-[180px] md:text-[260px] font-black tracking-[-0.05em] text-white leading-none mix-blend-difference"
              style={{
                textShadow: '0 0 40px rgba(255,255,255,0.4), 0 0 100px rgba(255,255,255,0.1)',
              }}
            >
              CV
            </h1>
            
            {/* The Stage Line/Floor */}
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent -mt-8 blur-[1px]" />
          </motion.div>
        </div>

        {/* Action Entry Panels - Positioned Lower to avoid overlapping */}
        <div className="relative z-20 mt-4 flex flex-col md:flex-row gap-5 px-6 w-full max-w-2xl">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-7 rounded-[2rem] overflow-hidden transition-all hover:border-white/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Upload size={28} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-base tracking-tight">Wczytaj stare CV</h3>
                <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-widest font-mono">PDF, DOCX, TXT</p>
              </div>
              <div className="ml-auto w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 group relative bg-white text-black p-7 rounded-[2rem] overflow-hidden transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-6">
              <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Plus size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base tracking-tight">Stwórz projekt</h3>
                <p className="text-black/50 text-[10px] mt-0.5 uppercase tracking-widest font-mono">Zacznij od zera</p>
              </div>
              <div className="ml-auto w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer Branding & Dock */}
      <footer className="relative z-20 p-10 pt-4 flex flex-col items-center gap-14">
        {/* Dock Navigation */}
        <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/5 p-2 px-3 rounded-[2.5rem] flex items-center gap-1 shadow-2xl">
          <div className="flex items-center gap-1 bg-white/5 p-1 px-4 rounded-[2rem] border border-white/5">
            <NavItem icon={Layout} label="Szablony" />
            <div className="w-[1px] h-6 bg-white/10 mx-4" />
            <NavItem icon={Plus} label="Elementy" />
            <div className="w-[1px] h-6 bg-white/10 mx-4" />
            <NavItem icon={Type} label="Tekst" />
            <div className="w-[1px] h-6 bg-white/10 mx-4" />
            <NavItem icon={ImageIcon} label="Galeria" />
            <div className="w-[1px] h-6 bg-white/10 mx-4" />
            <NavItem icon={Shield} label="Marka" />
            <div className="w-[1px] h-6 bg-white/10 mx-4" />
            <NavItem icon={Upload} label="Prześlij" active />
          </div>
        </div>

        {/* Brand Label */}
        <div className="w-full flex justify-end px-4">
          <div className="text-right border-r-2 border-white/20 pr-6 group">
            <h2 className="text-white text-3xl font-black tracking-tighter leading-none group-hover:tracking-normal transition-all duration-700 uppercase">FLOW ASSIST</h2>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-zinc-600 text-[9px] font-mono tracking-[0.5em] uppercase">Caarer</span>
              <span className="text-white/20 text-[9px] font-mono">2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
