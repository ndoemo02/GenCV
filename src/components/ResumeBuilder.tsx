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
    <div className="terminal-shell fixed inset-0 overflow-hidden bg-black font-sans text-white">
      <div className="terminal-grid absolute inset-0" />
      <div className="terminal-noise absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <FloorGlow />
      </div>

      <header className="relative z-40 flex items-start justify-between px-4 pb-2 pt-6 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate('start')} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-red-600 text-xl font-black text-white">N</div>
        </button>
      </header>

      <main className="relative z-30 h-[calc(100vh-72px)] overflow-y-auto pb-[calc(5.8rem+env(safe-area-inset-bottom))]">
        {error ? (
          <div className="mx-4 mb-3 flex max-w-3xl items-start gap-3 rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-red-100 sm:mx-6 lg:mx-8">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Nie udalo sie domknac analizy.</p>
              <p className="mt-1 text-sm opacity-80">{error}</p>
              <button type="button" onClick={resetError} className="mt-2 text-xs uppercase tracking-[0.22em] text-red-100/90">
                Zamknij
              </button>
            </div>
          </div>
        ) : null}

        <div className={activeTab === 'start' ? 'block' : 'hidden'}>
          <StartTab isProcessing={processing.active} phase={processing.phase} label={processing.label} onSubmit={submitInput} />
        </div>
        {activeTab === 'cv' ? <CvTab result={currentResult} onRestart={() => navigate('start')} /> : null}
        {activeTab === 'plan' ? <PlanTab result={currentResult} /> : null}
        {activeTab === 'profil' ? <ProfileTab result={currentResult} workspace={workspace} onOpenVersion={openVersion} /> : null}
      </main>

      <BottomNavigation activeTab={activeTab} onNavigate={navigate} />
    </div>
  );
};
