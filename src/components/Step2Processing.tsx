import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface Step2Props {
  currentPhase: number;
}

const Spotlight = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <div
      className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[1000px] opacity-40 z-0"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, white 180deg, transparent 200deg)',
        filter: 'blur(80px)',
      }}
    />
    <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] flex justify-center items-center">
      <div className="w-[400px] h-[100px] rounded-[100%] bg-white/10 blur-[40px]" />
    </div>
  </div>
);

export const Step2Processing: React.FC<Step2Props> = ({ currentPhase }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const phaseMessages: Record<number, string[]> = {
    1: ["Inicjowanie procesora Gemini 3.1 Pro...", "Czytanie struktury dokumentu...", "Wykrywanie kompetencji kluczowych..."],
    2: ["Uruchamianie silnika obrazu flash-image...", "Generowanie profesjonalnego portretu...", "Optymalizacja oświetlenia studyjnego..."],
    3: ["Renderowanie układu graficznego w 2K...", "Nakładanie palety barw FlowAssist...", "Finalizacja warstwy wizualnej..."],
    4: ["Budowanie pliku PDF...", "Wstrzykiwanie warstwy tekstowej ATS...", "Szyfrowanie i kompresja..."],
  };

  useEffect(() => {
    const messages = phaseMessages[currentPhase] || [];
    setLogs(prev => [...prev.slice(-10), ...messages]);
  }, [currentPhase]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
      <Spotlight />

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        {/* Animated AI Core */}
        <div className="relative mb-16">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] bg-white/5 backdrop-blur-3xl"
          >
            <span className="text-4xl font-black text-white tracking-widest uppercase">AI</span>
          </motion.div>
          {/* Ring around AI core */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-[-10px] border border-dashed border-white/10 rounded-full"
          />
        </div>

        <div className="w-full bg-zinc-900/60 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-3 min-h-[160px]">
            {logs.map((log, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i}
                className="flex items-center gap-4 py-0.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                <span className="text-[10px] md:text-[11px] text-zinc-400 uppercase tracking-widest font-mono">
                  {log}
                </span>
              </motion.div>
            ))}

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-mono">
                  Faza {currentPhase}/4 Przetwarzanie
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono tracking-widest">GEMINI_3.1_PRO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
