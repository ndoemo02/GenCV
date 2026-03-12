import React from 'react';
import type { WorkflowResult } from '../../types';
import { Step3Result } from '../Step3Result';
import { EmptyTabState } from './EmptyTabState';

export const CvTab: React.FC<{ result: WorkflowResult | null; onRestart: () => void }> = ({ result, onRestart }) => {
  if (!result) {
    return <EmptyTabState title="Brak CV" description="Najpierw przejdz przez Start i dolacz CV albo dane tekstowe, a gotowy dokument pojawi sie tutaj." />;
  }

  return <Step3Result result={result} onRestart={onRestart} />;
};
