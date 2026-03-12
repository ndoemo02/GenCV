import React from 'react';
import type { Step1Submission } from '../../types';
import { Step1Input } from '../Step1Input';
import { Step2Processing } from '../Step2Processing';

interface StartTabProps {
  isProcessing: boolean;
  phase: number;
  label: string;
  onSubmit: (payload: Step1Submission) => Promise<void> | void;
}

export const StartTab: React.FC<StartTabProps> = ({ isProcessing, phase, label, onSubmit }) => {
  if (isProcessing) {
    return <Step2Processing currentPhase={phase} label={label} />;
  }

  return <Step1Input onSubmit={onSubmit} />;
};
