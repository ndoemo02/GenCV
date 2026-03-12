import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, CircleHelp, Plus, Upload } from 'lucide-react';
import type { Step1Submission, UploadedAsset } from '../types';

interface Step1Props {
  onSubmit: (payload: Step1Submission) => Promise<void> | void;
  isBusy?: boolean;
}

type AccordionSection = 'text' | 'context' | null;

const examplePlaceholder = `Chce zmienic branze na sprzedaz\nCeluje w rynek niemiecki\nMam doswiadczenie jako spawacz i chce isc w kierunku handlowca`;

const readFile = (file: File): Promise<UploadedAsset> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nie udalo sie odczytac pliku.'));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: result.split(',')[1] || '',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  });

const UploadModule: React.FC<{
  sourceFile: UploadedAsset | null;
  isDragOver: boolean;
  onOpenDialog: () => void;
  onDragOver: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLButtonElement>) => void;
}> = ({ sourceFile, isDragOver, onOpenDialog, onDragOver, onDragEnter, onDragLeave, onDrop }) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.995 }}
    type="button"
    onClick={onOpenDialog}
    onDragOver={onDragOver}
    onDragEnter={onDragEnter}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className="group flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-left backdrop-blur-md"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
        <Upload size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold tracking-tight text-white">Wczytaj CV</p>
        <p className="mt-0.5 text-sm text-white/60">PDF, DOCX, JPG, PNG</p>
      </div>
    </div>

    <div
      className={`flex min-h-[96px] items-center justify-center rounded-xl border border-dashed px-4 py-4 text-center transition ${
        isDragOver ? 'border-white/35 bg-black/45' : 'border-white/20 bg-black/30'
      }`}
    >
      <p className="text-sm text-white/50">
        {sourceFile ? `Zaladowano: ${sourceFile.name}` : 'Przeciagnij CV tutaj lub kliknij, aby wybrac plik'}
      </p>
    </div>
  </motion.button>
);

export const Step1Input: React.FC<Step1Props> = ({ onSubmit, isBusy = false }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sourceFile, setSourceFile] = useState<UploadedAsset | null>(null);
  const [rawText, setRawText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSourceFile(await readFile(file));
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    setSourceFile(await readFile(file));
  };

  const handleSubmit = async () => {
    if (!sourceFile && !rawText.trim()) {
      return;
    }

    await onSubmit({ sourceFile, rawText, additionalContext });
  };

  const toggleSection = (section: Exclude<AccordionSection, null>) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-[calc(6.8rem+env(safe-area-inset-bottom))] pt-2 sm:max-w-lg sm:px-6">
      <input ref={fileRef} type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <section className="flex flex-col items-center justify-center pt-2 text-center">
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <h1 className="relative text-[72px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[88px]">CV</h1>
          <div className="relative mt-2 h-[2px] w-40 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-[1px]" />
          <div className="relative -mt-5 h-10 w-48 bg-gradient-to-b from-white/16 to-transparent opacity-40 blur-lg" />
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.34em] text-white/60">Next generation career flow</p>
      </section>

      <section className="mt-1 flex flex-col gap-2">
        <UploadModule
          sourceFile={sourceFile}
          isDragOver={isDragOver}
          onOpenDialog={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        />

        <button
          type="button"
          onClick={() => setSourceFile(null)}
          className="inline-flex items-center justify-center gap-2 self-center rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/50"
        >
          <Plus size={14} /> Stworz nowe
        </button>
      </section>

      <section className="grid grid-cols-1 gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          <button type="button" onClick={() => toggleSection('text')} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="text-xs uppercase tracking-[0.24em] text-white/60">Dane tekstowe</span>
            <ChevronDown size={16} className={`text-white/40 transition ${openSection === 'text' ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${openSection === 'text' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}>
            <div className="overflow-hidden px-4 pb-4">
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Wklej fragment CV lub profil zawodowy."
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          <button type="button" onClick={() => toggleSection('context')} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="text-xs uppercase tracking-[0.24em] text-white/60">Dodatkowe informacje (opcjonalnie)</span>
            <ChevronDown size={16} className={`text-white/40 transition ${openSection === 'context' ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${openSection === 'context' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}>
            <div className="overflow-hidden px-4 pb-4">
              <textarea
                value={additionalContext}
                onChange={(event) => setAdditionalContext(event.target.value)}
                placeholder={examplePlaceholder}
                className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky bottom-[calc(4.3rem+env(safe-area-inset-bottom))] z-20 mt-1 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-md">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={isBusy || (!sourceFile && !rawText.trim())}
          onClick={handleSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black disabled:opacity-35"
        >
          Analizuj <ArrowRight size={16} />
        </motion.button>
      </section>

      <button
        type="button"
        onClick={() => setShowHelp((value) => !value)}
        className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60 backdrop-blur-md"
      >
        <CircleHelp size={14} /> Pomoc
      </button>

      {showHelp ? (
        <div className="fixed bottom-[calc(8.2rem+env(safe-area-inset-bottom))] right-4 z-30 w-[240px] rounded-2xl border border-white/10 bg-black/55 p-3 text-sm text-white/60 backdrop-blur-md">
          Dodaj CV i dopisz docelowy kierunek. To wystarczy, aby wygenerowac profil, plan i PDF.
        </div>
      ) : null}
    </div>
  );
};
