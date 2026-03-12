import React, { createContext, startTransition, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AppTab,
  CareerAnalysis,
  CareerProfile,
  GeneratedCvVersion,
  PersistedWorkspace,
  Step1Submission,
  WorkflowResult,
} from '../types';
import { getTabFromHash, getTabHash } from '../lib/navigation/router';
import { loadPersistedTab, persistTab } from '../lib/navigation/storage';
import { loadWorkspace, saveWorkspace } from '../lib/persistence/storage';
import { routeIngestion } from '../lib/ingestion/router';
import { generateCareerAnalysis, generateCareerRoadmaps, generateStructuredCv, toCareerProfile } from '../services/aiService';
import { compileATSFriendlyPDF } from '../services/pdfService';

interface ProcessingState {
  active: boolean;
  phase: number;
  label: string;
}

interface AppStateValue {
  activeTab: AppTab;
  processing: ProcessingState;
  error: string | null;
  workspace: PersistedWorkspace;
  currentResult: WorkflowResult | null;
  navigate: (tab: AppTab) => void;
  submitInput: (payload: Step1Submission) => Promise<void>;
  openVersion: (versionId: string) => Promise<void>;
  resetError: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const emptyProcessing: ProcessingState = { active: false, phase: 0, label: 'Gotowy' };

const buildWorkspace = (
  previous: PersistedWorkspace,
  profile: CareerProfile,
  analysis: CareerAnalysis,
  version: GeneratedCvVersion,
): PersistedWorkspace => ({
  profile,
  latestVersionId: version.id,
  analyses: [analysis, ...previous.analyses.filter((item) => item.id !== analysis.id)].slice(0, 20),
  roadmaps: analysis.roadmaps,
  versions: [version, ...previous.versions.filter((item) => item.id !== version.id)].slice(0, 20),
});

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromHash(window.location.hash || getTabHash(loadPersistedTab())));
  const [workspace, setWorkspace] = useState<PersistedWorkspace>(() => loadWorkspace());
  const [currentResult, setCurrentResult] = useState<WorkflowResult | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>(emptyProcessing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      const next = getTabFromHash(window.location.hash);
      setActiveTab(next);
      persistTab(next);
    };

    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = getTabHash('start');
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  const navigate = (tab: AppTab) => {
    persistTab(tab);
    window.location.hash = getTabHash(tab);
    setActiveTab(tab);
  };

  const submitInput = async (payload: Step1Submission) => {
    setError(null);
    setProcessing({ active: true, phase: 1, label: 'Zbieranie danych wejsciowych' });
    navigate('start');

    try {
      const ingestion = await routeIngestion(payload);
      setProcessing({ active: true, phase: 2, label: 'Budowanie struktury CV' });
      const structuredCv = await generateStructuredCv(ingestion, payload.additionalContext);

      setProcessing({ active: true, phase: 3, label: 'Analiza profilu zawodowego' });
      const analysis = await generateCareerAnalysis(ingestion.normalizedCv, payload.additionalContext);
      const roadmaps = analysis.roadmaps.length ? analysis.roadmaps : await generateCareerRoadmaps(ingestion.normalizedCv, payload.additionalContext);
      const enrichedAnalysis = { ...analysis, roadmaps };

      setProcessing({ active: true, phase: 4, label: 'Renderowanie PDF' });
      const pdfBytes = await compileATSFriendlyPDF(structuredCv, true);
      const profile = toCareerProfile(enrichedAnalysis, ingestion.normalizedCv);
      const version: GeneratedCvVersion = {
        id: `version-${Date.now()}`,
        profileId: profile.id,
        createdAt: new Date().toISOString(),
        source: ingestion.source,
        structuredCv,
        analysis: enrichedAnalysis,
        ingestion,
      };

      const result: WorkflowResult = {
        profile,
        ingestion,
        structuredCv,
        analysis: enrichedAnalysis,
        roadmaps,
        version,
        artifacts: { pdfBytes },
      };

      startTransition(() => {
        setWorkspace((previous) => buildWorkspace(previous, profile, enrichedAnalysis, version));
        setCurrentResult(result);
        setProcessing(emptyProcessing);
        navigate('cv');
      });
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : 'Nie udalo sie przetworzyc danych kandydata.';
      setError(message);
      setProcessing(emptyProcessing);
      navigate('start');
    }
  };

  const openVersion = async (versionId: string) => {
    const version = workspace.versions.find((item) => item.id === versionId);
    if (!version) {
      return;
    }

    const pdfBytes = await compileATSFriendlyPDF(version.structuredCv, true);
    const profile = workspace.profile ?? {
      id: version.profileId,
      fullName: version.structuredCv.fullName,
      currentRole: version.analysis.estimatedCurrentRole,
      seniorityLevel: version.analysis.seniorityLevel,
      strongestSkills: version.analysis.strongestSkills,
      missingSkills: version.analysis.missingSkills,
      lastUpdatedAt: version.createdAt,
    };

    setCurrentResult({
      profile,
      ingestion: version.ingestion,
      structuredCv: version.structuredCv,
      analysis: version.analysis,
      roadmaps: version.analysis.roadmaps,
      version,
      artifacts: { pdfBytes },
    });

    navigate('cv');
  };

  const value = useMemo<AppStateValue>(
    () => ({
      activeTab,
      processing,
      error,
      workspace,
      currentResult,
      navigate,
      submitInput,
      openVersion,
      resetError: () => setError(null),
    }),
    [activeTab, processing, error, workspace, currentResult],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }

  return context;
};
