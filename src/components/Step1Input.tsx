import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, CircleHelp, Plus, Upload } from 'lucide-react';
import type { Step1Submission, UploadedAsset } from '../types';

interface Step1Props {
  onSubmit: (payload: Step1Submission) => Promise<void> | void;
  isBusy?: boolean;
}

const examplePlaceholder = `Chce zmienic branze na sprzedaz\nCeluje w rynek niemiecki\nMam CV na spawacza ale chce isc w kierunku handlowca`;

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

export const Step1Input: React.FC<Step1Props> = ({ onSubmit, isBusy = false }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sourceFile, setSourceFile] = useState<UploadedAsset | null>(null);
  const [rawText, setRawText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSourceFile(await readFile(file));
  };

  const handleDrop = async (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
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

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-28 pt-4 sm:px-6">
      <input ref={fileRef} type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <section className="flex flex-col items-center justify-center pt-8 text-center sm:pt-12">
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <h1 className="relative text-[112px] font-semibold leading-none tracking-[-0.045em] text-white sm:text-[156px]">CV</h1>
          <div className="relative mt-3 h-[2px] w-56 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-[1px]" />
          <div className="relative -mt-6 h-16 w-72 bg-gradient-to-b from-white/18 to-transparent opacity-40 blur-xl" />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.45em] text-white/60">Next generation career flow</p>
      </section>

      <section className="mt-3 flex flex-col gap-3">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.995 }}
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-left backdrop-blur-md transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <Upload size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tracking-tight text-white">Wczytaj CV</p>
            <p className="mt-0.5 text-sm text-white/60">Importuj PDF, DOCX, JPG, PNG</p>
          </div>
          <ChevronRight size={20} className="text-white/40 transition group-hover:text-white/70" />
        </motion.button>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.995 }}
          type="button"
          onClick={() => setSourceFile(null)}
          className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-left backdrop-blur-md transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <Plus size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tracking-tight text-white">Stwórz nowe</p>
            <p className="mt-0.5 text-sm text-white/60">Zacznij od zera</p>
          </div>
          <ChevronRight size={20} className="text-white/40 transition group-hover:text-white/70" />
        </motion.button>
      </section>

      <section className="mt-2 grid grid-cols-1 gap-3">
        <button
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[140px] w-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/35 px-4 py-6 text-center"
        >
          <p className="text-sm text-white/50">
            {sourceFile ? `Zaladowano: ${sourceFile.name}` : 'Przeciagnij CV tutaj lub kliknij, aby wybrac plik'}
          </p>
        </button>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/60">Dane tekstowe</label>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Wklej fragment CV lub profil zawodowy."
            className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/60">Dodatkowe informacje (opcjonalnie)</label>
          <textarea
            value={additionalContext}
            onChange={(event) => setAdditionalContext(event.target.value)}
            placeholder={examplePlaceholder}
            className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </div>
      </section>

      <section className="sticky bottom-20 z-20 mt-1 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60"
        >
          <CircleHelp size={16} /> Pomoc
        </button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={isBusy || (!sourceFile && !rawText.trim())}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black disabled:opacity-35"
        >
          Analizuj <ArrowRight size={16} />
        </motion.button>
      </section>

      {showHelp ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white/60 backdrop-blur-md">
          Dodaj CV i dopisz docelowy kierunek. To wystarczy, aby wygenerowac profil, plan i PDF.
        </div>
      ) : null}
    </div>
  );
};
