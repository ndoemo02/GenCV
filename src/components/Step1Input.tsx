import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CircleHelp, FileText, Upload } from 'lucide-react';
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

  const handleSubmit = async () => {
    if (!sourceFile && !rawText.trim()) {
      return;
    }

    await onSubmit({ sourceFile, rawText, additionalContext });
  };

  return (
    <div className="relative z-10 flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-zinc-600">Start</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-white sm:text-6xl">FlowAssist Career</h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-400 sm:text-base">
          Szybkie wejscie do nowego CV i planu rozwoju. Najpierw zbieramy dane, potem budujemy profil, roadmapy i PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.button
          whileHover={{ scale: 1.01, y: -2 }}
          onClick={() => fileRef.current?.click()}
          className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 text-left backdrop-blur-2xl transition-all hover:border-white/25"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative flex min-h-56 flex-col justify-between gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition-transform duration-500 group-hover:scale-110">
                <Upload size={26} />
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                PDF / DOCX / JPG / PNG
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Upload CV</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Jedno glowne miejsce wejscia dla dokumentu lub skanu CV. Zdjecie portretowe nie jest juz wymagane w pierwszym kroku.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/30 p-4 font-mono text-xs text-zinc-500">
              {sourceFile ? `Zaladowano: ${sourceFile.name}` : 'Przeciagnij plik lub kliknij, aby dolaczyc aktualne CV.'}
            </div>
          </div>
        </motion.button>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-2xl">
            <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">Dane tekstowe</label>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Wklej fragment CV, profil LinkedIn lub szybki opis doswiadczenia."
              className="h-36 w-full resize-none rounded-[1.5rem] border border-white/8 bg-black/30 px-4 py-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-2xl">
            <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
              Dodatkowe informacje (opcjonalnie)
            </label>
            <textarea
              value={additionalContext}
              onChange={(event) => setAdditionalContext(event.target.value)}
              placeholder={examplePlaceholder}
              className="h-40 w-full resize-none rounded-[1.5rem] border border-white/8 bg-black/30 px-4 py-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/25 hover:text-white"
        >
          <CircleHelp size={16} /> Pomoc
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={isBusy || (!sourceFile && !rawText.trim())}
          onClick={handleSubmit}
          className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-black transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          Analizuj profil <ArrowRight size={18} />
        </motion.button>
      </div>

      {showHelp ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-black/50 p-4 text-sm text-zinc-400 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2 text-white">
            <FileText size={16} />
            <span className="font-semibold">Szybka wskazowka</span>
          </div>
          FlowAssist najlepiej dziala, gdy dolaczysz aktualne CV i dopiszesz kierunek zmiany, rynek lub docelowa role.
        </div>
      ) : null}
    </div>
  );
};
