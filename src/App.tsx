import React, { useState } from 'react';
import { ApiKeyGate } from './components/ApiKeyGate';
import { ResumeBuilder } from './components/ResumeBuilder';
import { AppStateProvider } from './state/AppState';

export default function App() {
  const [keySelected, setKeySelected] = useState(false);

  return keySelected ? (
    <AppStateProvider>
      <ResumeBuilder />
    </AppStateProvider>
  ) : (
    <ApiKeyGate onKeySelected={() => setKeySelected(true)} />
  );
}
