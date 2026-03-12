import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Step1Input } from './Step1Input';
import { Step2Processing } from './Step2Processing';
import { Step3Result } from './Step3Result';
import { generateResumeData, generateHeadshot, generateVisualCV } from '../services/aiService';
import { compileATSFriendlyPDF } from '../services/pdfService';
import { AlertCircle, Shield, Layout, Plus, Type, Image as ImageIcon, Upload } from 'lucide-react';

const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <button className={`flex flex-col items-center gap-1 group transition-all ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{label}</span>
  </button>
);

export const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [visualCvBase64, setVisualCvBase64] = useState<string | null>(null);

  const handleGenerate = async (
    text: string,
    photo: { base64: string; mimeType: string } | null,
    sourceDoc: { base64: string; mimeType: string } | null
  ) => {
    setStep(2);
    setError(null);

    try {
      // Phase 1: Data extraction & Rework
      setPhase(1);
      console.log('Phase 1: Starting AI analysis and rework...');
      const resumeData = await generateResumeData(text, sourceDoc);

      // Phase 2: Headshot Generation
      setPhase(2);
      let finalHeadshot = null;
      if (photo) {
        console.log('Phase 2: Generating professional headshot...');
        finalHeadshot = await generateHeadshot(photo.base64, photo.mimeType);
      }

      // Phase 3: Visual CV Generation
      setPhase(3);
      console.log('Phase 3: Designing visual layout...');
      const visualCv = await generateVisualCV(resumeData, finalHeadshot);
      if (!visualCv) throw new Error("Failed to generate visual CV image.");
      setVisualCvBase64(visualCv);

      // Phase 4: PDF Compilation
      setPhase(4);
      console.log('Phase 4: Compiling PDF with ATS layer...');

      // Convert base64 to Uint8Array for pdf-lib
      const binaryString = atob(visualCv);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pdf = await compileATSFriendlyPDF(bytes, resumeData);
      setPdfBytes(pdf);
      console.log('Generation complete!');

      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-sans">

      {/* Background decoration in main container to match lab */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header Info */}
      <header className="relative z-50 p-8 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 group pointer-events-auto cursor-pointer" onClick={() => { setStep(1); setError(null); }}>
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black text-xl rounded-sm transition-transform hover:scale-105">N</div>
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-bold tracking-tighter uppercase">Flow Assist</span>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest">v2.0.26-ALPHA</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-mono pointer-events-auto">
          {step === 3 && (
            <div className="px-3 py-1.5 bg-white/10 text-white rounded-full border border-white/20">
              PROCES ZAKOŃCZONY OK
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-500 uppercase tracking-widest">Core System Stable</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-20 overflow-y-auto no-scrollbar pt-4">
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 text-red-400 backdrop-blur-xl animate-bounce-in">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-red-300">Awaria Protokołu AI</h4>
              <p className="text-[11px] opacity-80 mt-1 uppercase tracking-tight">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center bg-transparent">
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
        </div>
      </main>

      {/* Footer Branding & Dock */}
      <footer className="relative z-50 p-10 pt-4 flex flex-col items-center gap-14 pointer-events-none">
        {/* Dock Navigation (Mockup structure from lab) */}
        <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/5 p-2 px-3 rounded-[2.5rem] flex items-center gap-1 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1 bg-white/5 p-1 px-4 rounded-[2rem] border border-white/5">
            <NavItem icon={Layout} label="Szablony" />
            <div className="w-[1px] h-6 bg-white/10 mx-4 opacity-50" />
            <NavItem icon={Plus} label="Elementy" />
            <div className="w-[1px] h-6 bg-white/10 mx-4 opacity-50" />
            <NavItem icon={Type} label="Tekst" />
            <div className="w-[1px] h-6 bg-white/10 mx-4 opacity-50" />
            <NavItem icon={ImageIcon} label="Galeria" />
            <div className="w-[1px] h-6 bg-white/10 mx-4 opacity-50" />
            <NavItem icon={Shield} label="Marka" />
            <div className="w-[1px] h-6 bg-white/10 mx-4 opacity-50" />
            <NavItem icon={Upload} label="Status" active={step === 2} />
          </div>
        </div>

        {/* Brand Label */}
        <div className="w-full flex justify-between px-10 items-end">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-[0.5em] text-zinc-700 uppercase mb-2">PROCESSED BY GEN_37</span>
            <div className="h-1 w-24 bg-zinc-900 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-white/20"
                animate={{ x: step === 2 ? ['-100%', '100%'] : '0%' }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </div>

          <div className="text-right border-r-2 border-white/20 pr-8 group pointer-events-auto">
            <h2 className="text-white text-3xl font-black tracking-tighter leading-none group-hover:tracking-normal transition-all duration-700 uppercase">FLOW ASSIST</h2>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-zinc-600 text-[9px] font-mono tracking-[0.5em] uppercase">Carrier</span>
              <span className="text-white/20 text-[9px] font-mono">2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
