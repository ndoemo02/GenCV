import React, { useState } from 'react';
import { Step1Input } from './Step1Input';
import { Step2Processing } from './Step2Processing';
import { Step3Result } from './Step3Result';
import { generateResumeData, generateHeadshot, generateVisualCV } from '../services/aiService';
import { compileATSFriendlyPDF } from '../services/pdfService';
import { AlertCircle } from 'lucide-react';

export const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [visualCvBase64, setVisualCvBase64] = useState<string | null>(null);

  const handleGenerate = async (text: string, photoBase64: string | null, photoMimeType: string | null) => {
    setStep(2);
    setError(null);
    
    try {
      // Phase 1: Text Structuring
      setPhase(1);
      const resumeData = await generateResumeData(text);
      
      // Phase 2: Headshot Generation
      setPhase(2);
      let finalHeadshot = null;
      if (photoBase64 && photoMimeType) {
        finalHeadshot = await generateHeadshot(photoBase64, photoMimeType);
      }
      
      // Phase 3: Visual CV Generation
      setPhase(3);
      const visualCv = await generateVisualCV(resumeData, finalHeadshot);
      if (!visualCv) throw new Error("Failed to generate visual CV image.");
      setVisualCvBase64(visualCv);
      
      // Phase 4: PDF Compilation
      setPhase(4);
      const pdf = await compileATSFriendlyPDF(visualCv, resumeData);
      setPdfBytes(pdf);
      
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-semibold tracking-tight text-white">VisualResume AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Generation Failed</h4>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {step === 1 && <Step1Input onSubmit={handleGenerate} />}
        {step === 2 && <Step2Processing currentPhase={phase} />}
        {step === 3 && pdfBytes && visualCvBase64 && (
          <Step3Result 
            pdfBytes={pdfBytes} 
            visualCvBase64={visualCvBase64} 
            onRestart={() => {
              setStep(1);
              setPdfBytes(null);
              setVisualCvBase64(null);
            }} 
          />
        )}
      </main>
    </div>
  );
};
