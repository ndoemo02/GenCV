import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Step2Props {
  currentPhase: number;
  label: string;
}

const PHASE_LOGS: Record<number, string[]> = {
  1: ['Skanowanie danych wejsciowych', 'Weryfikacja typu pliku', 'Start unified ingestion pipeline'],
  2: ['Normalizacja danych CV', 'Porzadkowanie sekcji i kompetencji', 'Budowanie struktury dokumentu'],
  3: ['Wyznaczanie roli i seniority', 'Liczenie score cards', 'Generowanie roadmap rozwoju'],
  4: ['Renderowanie CV do PDF', 'Dodawanie opcjonalnej warstwy ATS', 'Zapisywanie wersji do historii'],
};

export const Step2Processing: React.FC<Step2Props> = ({ currentPhase, label }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setLogs((previous) => [...previous, ...(PHASE_LOGS[currentPhase] ?? [])].slice(-9));
  }, [currentPhase]);

  return (
    <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-4 pb-28 pt-12 sm:px-6">
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.8, repeat: Infinity }}
        className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/5 text-3xl font-black text-white shadow-[0_0_80px_rgba(255,255,255,0.08)]"
      >
        AI
      </motion.div>

      <div className="w-full rounded-[2.2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">Processing</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{label}</h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            faza {currentPhase}/4
          </div>
        </div>

        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={`${log}-${index}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/25 px-4 py-3"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300">{log}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
