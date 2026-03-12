import React from 'react';
import { motion } from 'motion/react';

interface Step2Props {
  currentPhase: number;
  label: string;
}

export const Step2Processing: React.FC<Step2Props> = ({ currentPhase, label }) => {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 pb-28 pt-12 sm:px-6">
      <div className="relative flex flex-col items-center text-center">
        <div className="absolute h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <h1 className="relative text-[96px] font-semibold leading-none tracking-[-0.045em] text-white sm:text-[128px]">CV</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.25em] text-white/60">{label}</p>
      </div>

      <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/60">
          <span>Przetwarzanie</span>
          <span>{currentPhase}/4</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-white/70"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(8, Math.min(100, currentPhase * 25))}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};
