import React from 'react';
import type { PersistedWorkspace, WorkflowResult } from '../../types';
import { EmptyTabState } from './EmptyTabState';

export const ProfileTab: React.FC<{
  result: WorkflowResult | null;
  workspace: PersistedWorkspace;
  onOpenVersion: (versionId: string) => void;
}> = ({ result, workspace, onOpenVersion }) => {
  const profile = result?.profile ?? workspace.profile;
  if (!profile) {
    return <EmptyTabState title="Brak profilu" description="Po pierwszej analizie zapisujemy CareerProfile, analize i historie wygenerowanych wersji." />;
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-zinc-600">Profil</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white">{profile.fullName}</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
          <p className="text-sm text-zinc-400">Biezaca rola</p>
          <p className="mt-1 text-xl font-semibold text-white">{profile.currentRole}</p>
          <p className="mt-4 text-sm text-zinc-400">Seniority</p>
          <p className="mt-1 text-xl font-semibold capitalize text-white">{profile.seniorityLevel}</p>
          <p className="mt-4 text-sm text-zinc-400">Najmocniejsze kompetencje</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.strongestSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">{skill}</span>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-400">Obszary do rozwoju</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.missingSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-400">{skill}</span>
            ))}
          </div>
        </section>
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white">Historia wersji</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{workspace.versions.length} zapisow</span>
          </div>
          <div className="mt-4 space-y-3">
            {workspace.versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => onOpenVersion(version.id)}
                className="flex w-full items-center justify-between rounded-[1.4rem] border border-white/6 bg-black/20 px-4 py-4 text-left transition hover:border-white/20"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{version.structuredCv.targetRole}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{new Date(version.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">CV {version.analysis.readinessScore}/100</p>
                  <p className="text-xs text-zinc-500">{version.source}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
