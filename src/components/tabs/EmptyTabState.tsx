import React from 'react';

export const EmptyTabState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 pb-28 pt-20 text-center">
    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-10 backdrop-blur-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">FlowAssist</p>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">{title}</h2>
      <p className="mt-4 max-w-xl text-sm text-zinc-400">{description}</p>
    </div>
  </div>
);
