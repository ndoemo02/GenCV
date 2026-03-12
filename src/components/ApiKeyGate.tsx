import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Key } from 'lucide-react';

const Spotlight = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <div
      className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[1000px] opacity-40 z-0"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, white 180deg, transparent 200deg)',
        filter: 'blur(80px)',
      }}
    />
    <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] flex justify-center items-center">
      <div className="w-[600px] h-[150px] rounded-[100%] bg-white/10 blur-[50px]" />
    </div>
  </div>
);

export const ApiKeyGate: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // 1. Check AI Studio context
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (selected) {
          setHasKey(true);
          onKeySelected();
          setLoading(false);
          return;
        }
      }

      // 2. Check environment variable (for local dev)
      const localKey = (process.env as any).GEMINI_API_KEY;
      if (localKey && localKey !== "MY_GEMINI_API_KEY" && localKey !== "") {
        setHasKey(true);
        onKeySelected();
      }

      setLoading(false);
    };
    checkKey();
  }, [onKeySelected]);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      onKeySelected();
    }
  };

  if (loading || hasKey) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono">
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[10px] tracking-[0.4em] text-white/40 uppercase"
        >
          Inicjalizacja Systemu...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-sans selection:bg-white selection:text-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <Spotlight />

      {/* Header Info */}
      <header className="relative z-50 p-8 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 group pointer-events-auto cursor-pointer">
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black text-xl rounded-sm transition-transform hover:scale-105">N</div>
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-bold tracking-tighter uppercase">Flow Assist</span>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest">v2.0.26-ALPHA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-sm text-center px-6"
        >
          <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-center text-white/40 mb-8">
            <Shield size={28} />
          </div>

          <h1 className="text-white text-2xl font-black tracking-tight uppercase mb-4">Wymagana Autoryzacja</h1>
          <p className="text-zinc-500 text-[11px] leading-relaxed uppercase tracking-[0.2em] mb-10">
            Aby korzystać z protokołów Gemini 3.1 Pro, wymagany jest aktywny klucz AI Studio.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSelectKey}
            className="group relative bg-white text-black px-12 py-5 rounded-full overflow-hidden transition-all shadow-[0_20px_60px_-10px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10 font-black text-sm tracking-widest uppercase flex items-center gap-3">
              Podłącz klucz API <Key size={18} />
            </span>
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.button>
        </motion.div>
      </main>

      <footer className="relative z-50 p-10 flex justify-center pointer-events-none">
        <span className="text-[9px] tracking-[0.4em] text-zinc-800 uppercase font-mono">
          Status: Oczekiwanie na autoryzację
        </span>
      </footer>
    </div>
  );
};
