import React from 'react';
import { Download, FileText, LineChart, Mail, MapPin, Phone, Radar, RefreshCw, Route, Zap } from 'lucide-react';
import type { WorkflowResult } from '../types';
import { getStructuredCvDisplayName, getStructuredCvDisplayTitle } from '../lib/cv/structured';

interface Step3Props {
  result: WorkflowResult;
  onRestart: () => void;
}

const scoreTone = (score: number) => {
  if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-300';
  if (score >= 60) return 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-200';
  return 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-200';
};

const roadmapIcon = (variant: string) => {
  if (variant === 'conservative') return <Zap size={18} className="text-emerald-400" />;
  if (variant === 'ambitious') return <Zap size={18} className="text-blue-400" />;
  return <Zap size={18} className="text-purple-400" />;
};

export const Step3Result: React.FC<Step3Props> = ({ result, onRestart }) => {
  const downloadPdf = () => {
    if (!result.artifacts.pdfBytes) return;
    const blob = new Blob([result.artifacts.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CV_${getStructuredCvDisplayName(result.structuredCv).replace(/\s+/g, '_')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: 'gotowosc', value: result.analysis.readinessScore, desc: 'Kompletnosc i jakosc' },
    { label: 'potencjal', value: result.analysis.growthPotential, desc: 'Dopasowanie do rynku' },
    { label: 'klarownosc', value: result.analysis.profileClarity, desc: 'Jasnosć narracji' },
  ];

  const fullName = getStructuredCvDisplayName(result.structuredCv);
  const title = getStructuredCvDisplayTitle(result.structuredCv);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">Analysis Complete</p>
          <h2 className="mt-2 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">Twoja Kariera 2.0</h2>
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            FlowAssist wygenerowal ustrukturyzowane CV i wyznaczyl trzy sciezki rozwoju oparte o realne braki kompetencyjne.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:scale-105 active:scale-95"
          >
            Pobierz PDF <Download size={18} className="transition group-hover:translate-y-0.5" />
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 transition hover:bg-white/10"
          >
            Reset <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-[2rem] border bg-gradient-to-br p-6 ${scoreTone(card.value)}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-70">{card.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-black">{card.value}</span>
              <span className="text-xl opacity-40">/100</span>
            </div>
            <p className="mt-3 text-xs opacity-60 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Paper Preview Column */}
        <section className="group relative rounded-[2.5rem] border border-white/10 bg-zinc-950/40 p-1 backdrop-blur-3xl transition-all duration-500 hover:border-white/20">
          <div className="absolute -top-3 left-8 rounded-full bg-zinc-900 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5">
            Podglad Dokumentu (Clean Design)
          </div>
          
          <div className="flex min-h-[800px] flex-col overflow-hidden rounded-[2.3rem] bg-white text-zinc-900 shadow-2xl sm:flex-row">
            {/* Paper Sidebar */}
            <div className="w-full flex-col gap-6 bg-zinc-50/80 p-6 sm:w-[200px] sm:flex sm:p-8 border-b sm:border-b-0 sm:border-r border-zinc-100">
              <div className="grid grid-cols-1 gap-6 mini:grid-cols-2 sm:grid-cols-1 sm:space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Dane Kontaktowe</h4>
                  <div className="mt-3 space-y-2 text-[11px] text-zinc-600">
                    {result.structuredCv.personal?.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="shrink-0 text-zinc-400" />
                        <span className="truncate">{result.structuredCv.personal.email}</span>
                      </div>
                    )}
                    {result.structuredCv.personal?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="shrink-0 text-zinc-400" />
                        <span>{result.structuredCv.personal.phone}</span>
                      </div>
                    )}
                    {result.structuredCv.personal?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="shrink-0 text-zinc-400" />
                        <span>{result.structuredCv.personal.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Umiejetnosci</h4>
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600 sm:block sm:space-y-2">
                    {result.structuredCv.skills?.slice(0, 15).map((skill) => (
                      <li key={skill} className="flex gap-2">
                        <span className="text-blue-500">•</span> {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Paper Main */}
            <div className="flex-1 p-8 sm:p-12 overflow-hidden">
              <header className="max-w-full overflow-hidden">
                <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 break-all sm:text-3xl sm:break-words leading-[1.1]">{fullName}</h3>
                {title && (
                  <p className="mt-3 text-[10px] font-bold text-blue-600 tracking-wider uppercase sm:text-sm break-words leading-snug max-w-lg">
                    {title}
                  </p>
                )}
              </header>

              <div className="mt-8 space-y-10">
                {/* Summary Section */}
                {result.structuredCv.summary && (
                  <div className="break-words">
                    <h4 className="border-b border-zinc-100 pb-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Podsumowanie zawodowe</h4>
                    <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-800">
                      {result.structuredCv.summary}
                    </p>
                  </div>
                )}

                {/* Experience Section */}
                {result.structuredCv.experience?.length ? (
                  <div className="break-words">
                    <h4 className="border-b border-zinc-100 pb-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Doświadczenie zawodowe</h4>
                    <div className="mt-6 space-y-8">
                      {result.structuredCv.experience.map((entry, i) => (
                        <div key={`exp-${i}`} className="relative">
                          <header>
                            <h5 className="text-[13px] font-black text-zinc-900 leading-tight">
                              {entry.role} {entry.company && <span className="text-zinc-400 font-normal mx-1">|</span>} {entry.company}
                            </h5>
                            {(entry.start || entry.end) && (
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-1">
                                {entry.start} - {entry.end || 'Obecnie'}
                              </p>
                            )}
                          </header>
                          {entry.bullets && entry.bullets.length > 0 && (
                            <ul className="mt-3 space-y-1.5 list-disc list-outside ml-4">
                              {entry.bullets.map((bullet, bi) => (
                                <li key={`bullet-${i}-${bi}`} className="text-[12px] text-zinc-700 leading-relaxed pl-1">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Education Section */}
                {result.structuredCv.education?.length ? (
                  <div className="break-words">
                    <h4 className="border-b border-zinc-100 pb-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Edukacja</h4>
                    <div className="mt-6 space-y-6">
                      {result.structuredCv.education.map((edu, i) => (
                        <div key={`edu-${i}`}>
                          <h5 className="text-[12.5px] font-bold text-zinc-900">
                            {edu.degree} {edu.school && <span className="text-zinc-300 font-normal mx-1">|</span>} {edu.school}
                          </h5>
                          {edu.end && (
                            <p className="text-[10.5px] text-zinc-500 mt-1 uppercase tracking-wider">{edu.end}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Side Column */}
        <div className="flex flex-col gap-6">
          <section className="rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent p-7">
            <div className="mb-5 flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-300">
                <Radar size={20} />
              </div>
              <h3 className="text-lg font-bold">Pozycjonowanie</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Obecna rola</span>
                <span className="text-sm text-zinc-100">{result.analysis.estimatedCurrentRole}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Poziom Seniority</span>
                <span className="text-sm text-zinc-100">{result.analysis.seniorityLevel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Kluczowe przewagi</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {result.analysis.strongestSkills.slice(0, 4).map(s => (
                    <span key={s} className="rounded-lg bg-zinc-100/5 px-2 py-1 text-[10px] text-zinc-300 border border-white/5">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 p-7">
            <div className="mb-5 flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-300">
                <LineChart size={20} />
              </div>
              <h3 className="text-lg font-bold">Luki w kompetencjach</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.analysis.missingSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[11px] font-medium text-red-100/80">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed italic">
              Te umiejetnosci czesto pojawiaja sie w ogloszeniach o Twoim docelowym profilu, a brak ich w obecnym CV obniza konwersje.
            </p>
          </section>

          <section className="flex-1 rounded-[2.5rem] border border-white/10 bg-zinc-900/50 p-7">
            <div className="mb-6 flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-300">
                <Route size={20} />
              </div>
              <h3 className="text-lg font-bold">Sciezki rozwoju</h3>
            </div>
            <div className="space-y-4">
              {result.roadmaps.map((roadmap) => (
                <div key={roadmap.id} className="group relative rounded-3xl border border-white/5 bg-black/40 p-5 transition hover:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 uppercase tracking-widest font-bold text-[10px] text-zinc-400">
                      {roadmapIcon(roadmap.variant)}
                      {roadmap.variant}
                    </div>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter ${
                      roadmap.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                      roadmap.riskLevel === 'medium' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {roadmap.riskLevel} risk
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">{roadmap.targetRole}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">{roadmap.reasoning}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Plan Dzialania Footnote */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 transition hover:bg-white-[0.07]">
          <h3 className="text-2xl font-black text-white">Kolejne kroki</h3>
          <p className="mt-2 text-zinc-400 text-sm">Wykonaj te zadania, aby zveryfikowac potencjal nowej roadmapy:</p>
          <ul className="mt-6 grid grid-cols-1 gap-3">
            {result.roadmaps[0]?.nextActions.map((action, i) => (
              <li key={action} className="flex items-center gap-4 rounded-2xl bg-black/40 p-4 border border-white/5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-black text-black">{i + 1}</span>
                <span className="text-sm text-zinc-200">{action}</span>
              </li>
            ))}
          </ul>
        </section>
        
        <section className="flex flex-col items-center justify-center rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-blue-600/20 to-zinc-900/50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-black mb-6 shadow-2xl">
            <FileText size={32} />
          </div>
          <h3 className="text-2xl font-black text-white">Ready for Export</h3>
          <p className="mt-2 text-zinc-400 text-sm max-w-xs mx-auto">
            Twój profesjonalny PDF jest juz gotowy. Wykorzystuje nowoczesny, minimalistyczny layout akceptowany przez systemy ATS.
          </p>
          <button
            type="button"
            onClick={downloadPdf}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:scale-105 active:scale-95 shadow-xl"
          >
            Pobierz Finalne CV <Download size={18} />
          </button>
        </section>
      </div>
    </div>
  );
};

