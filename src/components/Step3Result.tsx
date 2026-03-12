import React from 'react';
import { Download, FileText, LineChart, Radar, RefreshCw, Route } from 'lucide-react';
import type { WorkflowResult } from '../types';

interface Step3Props {
  result: WorkflowResult;
  onRestart: () => void;
}

const scoreTone = (score: number) => {
  if (score >= 80) return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
  if (score >= 60) return 'text-amber-200 border-amber-300/20 bg-amber-300/10';
  return 'text-red-200 border-red-300/20 bg-red-300/10';
};

export const Step3Result: React.FC<Step3Props> = ({ result, onRestart }) => {
  const downloadPdf = () => {
    if (!result.artifacts.pdfBytes) {
      return;
    }

    const blob = new Blob([result.artifacts.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FlowAssist_Career_CV.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: 'gotowosc CV', value: result.analysis.readinessScore },
    { label: 'potencjal rozwoju', value: result.analysis.growthPotential },
    { label: 'klarownosc profilu', value: result.analysis.profileClarity },
  ];

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-zinc-600">CV Result</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">Nowe CV i profil kariery</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            FlowAssist zbudowal strukturalne CV, ocenil profil i przygotowal trzy kierunki rozwoju bez zaleznosci od obrazkowego layoutu AI.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
          >
            Pobierz PDF <Download size={16} />
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm uppercase tracking-[0.2em] text-zinc-300"
          >
            Nowy start <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-[1.6rem] border p-5 ${scoreTone(card.value)}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em]">{card.label}</p>
            <p className="mt-3 text-4xl font-black">{card.value}</p>
            <p className="mt-2 text-sm opacity-80">Score liczony na podstawie kompletnosci danych, jasnosci narracji i dopasowania kompetencji.</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
          <div className="mb-5 flex items-center gap-3 text-white">
            <FileText size={18} />
            <h3 className="text-xl font-bold">Nowe CV</h3>
          </div>
          <p className="text-lg font-semibold text-white">{result.structuredCv.fullName}</p>
          <p className="mt-1 text-sm text-zinc-400">{result.structuredCv.targetRole}</p>
          <p className="mt-4 text-sm text-zinc-300">{result.structuredCv.summary}</p>
          <div className="mt-6 space-y-5">
            {result.structuredCv.sections.map((section) => (
              <div key={section.title}>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">{section.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4">
          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-3 text-white">
              <Radar size={18} />
              <h3 className="text-xl font-bold">Profil zawodowy</h3>
            </div>
            <div className="space-y-3 text-sm text-zinc-300">
              <p><span className="text-zinc-500">Obecna rola:</span> {result.analysis.estimatedCurrentRole}</p>
              <p><span className="text-zinc-500">Seniority:</span> {result.analysis.seniorityLevel}</p>
              <p><span className="text-zinc-500">Najmocniejsze atuty:</span> {result.analysis.strongestSkills.join(', ')}</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-3 text-white">
              <LineChart size={18} />
              <h3 className="text-xl font-bold">Braki kompetencyjne</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.analysis.missingSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-3 text-white">
              <Route size={18} />
              <h3 className="text-xl font-bold">Mozliwe kierunki rozwoju</h3>
            </div>
            <div className="space-y-4">
              {result.roadmaps.map((roadmap) => (
                <div key={roadmap.id} className="rounded-[1.5rem] border border-white/6 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold capitalize text-white">{roadmap.variant}</p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">{roadmap.riskLevel}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{roadmap.targetRole}</p>
                  <p className="mt-2 text-sm text-zinc-400">{roadmap.reasoning}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{roadmap.timeline}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-bold text-white">Plan dzialania</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {result.roadmaps[0]?.nextActions.map((action) => (
              <li key={action} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">{action}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-bold text-white">Pobierz PDF</h3>
          <p className="mt-3 text-sm text-zinc-400">Plik jest renderowany z danych strukturalnych i moze opcjonalnie zawierac warstwe ATS.</p>
          <button
            type="button"
            onClick={downloadPdf}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm uppercase tracking-[0.2em] text-zinc-100"
          >
            Pobierz PDF <Download size={16} />
          </button>
        </section>
      </div>
    </div>
  );
};
