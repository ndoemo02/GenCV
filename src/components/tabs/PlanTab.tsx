import React from 'react';
import type { WorkflowResult } from '../../types';
import { EmptyTabState } from './EmptyTabState';

export const PlanTab: React.FC<{ result: WorkflowResult | null }> = ({ result }) => {
  if (!result) {
    return <EmptyTabState title="Brak planu" description="Plan dzialania pojawi sie po analizie CV. Start pozostaje glownym wejsciem, ale mozesz tu wracac pozniej." />;
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-zinc-600">Plan</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white">Mozliwe kierunki rozwoju</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {result.roadmaps.map((roadmap) => (
          <section key={roadmap.id} className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold capitalize text-white">{roadmap.variant}</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{roadmap.riskLevel}</span>
            </div>
            <p className="mt-3 text-lg text-zinc-200">{roadmap.targetRole}</p>
            <p className="mt-3 text-sm text-zinc-400">{roadmap.reasoning}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">{roadmap.timeline}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {roadmap.nextActions.map((action) => (
                <li key={action} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">{action}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
