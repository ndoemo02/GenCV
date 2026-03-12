import React from 'react';
import { AlertCircle } from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { FloorGlow, Spotlight } from './Spotlight';
import { useAppState } from '../state/AppState';
import { CvTab } from './tabs/CvTab';
import { PlanTab } from './tabs/PlanTab';
import { ProfileTab } from './tabs/ProfileTab';
import { StartTab } from './tabs/StartTab';

export const ResumeBuilder: React.FC = () => {
  const { activeTab, processing, error, currentResult, workspace, navigate, submitInput, openVersion, resetError } = useAppState();

  return (
    <div className="fixed inset-0 overflow-hidden bg-black font-sans text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <FloorGlow />
      </div>

      <header className="relative z-40 flex items-start justify-between px-4 pb-2 pt-6 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate('start')} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white text-xl font-black text-black">N</div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-tighter text-white">Flow Assist Career</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-600">premium terminal workflow</p>
          </div>
        </button>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
          {processing.active ? `processing ${processing.phase}/4` : activeTab}
        </div>
      </header>

      <main className="relative z-30 h-[calc(100vh-88px)] overflow-y-auto no-scrollbar">
        {error ? (
          <div className="mx-4 mb-4 flex max-w-3xl items-start gap-3 rounded-[1.6rem] border border-red-400/20 bg-red-400/10 p-4 text-red-200 sm:mx-6 lg:mx-8">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Nie udalo sie domknac analizy.</p>
              <p className="mt-1 text-sm opacity-85">{error}</p>
              <button type="button" onClick={resetError} className="mt-3 text-xs uppercase tracking-[0.25em] text-red-100">
                zamknij
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'start' ? (
          <StartTab isProcessing={processing.active} phase={processing.phase} label={processing.label} onSubmit={submitInput} />
        ) : null}
        {activeTab === 'cv' ? <CvTab result={currentResult} onRestart={() => navigate('start')} /> : null}
        {activeTab === 'plan' ? <PlanTab result={currentResult} /> : null}
        {activeTab === 'profil' ? <ProfileTab result={currentResult} workspace={workspace} onOpenVersion={openVersion} /> : null}
      </main>

      <BottomNavigation activeTab={activeTab} onNavigate={navigate} />
    </div>
  );
};
