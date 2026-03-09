import React, { useState } from 'react';
import { ApiKeyGate } from './components/ApiKeyGate';
import { ResumeBuilder } from './components/ResumeBuilder';

export default function App() {
  const [keySelected, setKeySelected] = useState(false);

  return (
    <>
      {!keySelected ? (
        <ApiKeyGate onKeySelected={() => setKeySelected(true)} />
      ) : (
        <ResumeBuilder />
      )}
    </>
  );
}
