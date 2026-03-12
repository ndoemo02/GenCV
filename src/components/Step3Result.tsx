import React from 'react';
import { motion } from 'motion/react';
import { Download, RefreshCw, CheckCircle, ChevronRight, FileText, Layout } from 'lucide-react';

interface Step3Props {
  pdfBytes: Uint8Array;
  visualCvBase64: string;
  onRestart: () => void;
}

const Spotlight = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <div
      className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[1000px] opacity-40 z-0"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, white 180deg, transparent 200deg)',
        filter: 'blur(80px)',
      }}
    />
    <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] flex justify-center items-center">
      <div className="w-[500px] h-[120px] rounded-[100%] bg-white/10 blur-[50px]" />
    </div>
  </div>
);

export const Step3Result: React.FC<Step3Props> = ({ pdfBytes, visualCvBase64, onRestart }) => {
  const handleDownload = () => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FlowAssist_Career_CV.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-y-auto no-scrollbar font-sans selection:bg-white selection:text-black">
      <Spotlight />

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center animate-fade-in py-12">
        <div className="text-center mb-16 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.4)]"
          >
            <CheckCircle size={32} />
          </motion.div>
          <h2 className="text-[32px] md:text-[48px] font-black text-white leading-tight tracking-tighter uppercase">
            Projekt ukończony
          </h2>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.6em] font-mono mt-2">
            Dokument wygenerowany pomyślnie
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center w-full relative z-10">
          {/* Visual Showcase */}
          <div className="perspective-1000 relative">
            <motion.div
              animate={{
                rotateY: [-5, 5, -5],
                y: [0, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 p-2 rounded-[3rem] shadow-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="aspect-[3/4] w-full bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative">
                <img
                  src={`data:image/png;base64,${visualCvBase64}`}
                  alt="Visual CV Preview"
                  className="w-full h-full object-contain grayscale-0 opacity-90 group-hover:opacity-100 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                {/* Glass reflections */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_50%)] pointer-events-none" />
              </div>
            </motion.div>
            {/* Stage Reflection */}
            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[80%] h-[20px] bg-white/5 blur-[20px] rounded-[100%] pointer-events-none" />
          </div>

          <div className="flex flex-col gap-10">
            <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h3 className="text-white text-base font-bold tracking-tight mb-6">Specyfikacja Wyjściowa</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
                      <Layout size={18} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">Format wizualny 2K</p>
                      <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-widest font-mono">Renderowanie wysokiej rozdzielczości z zachowaniem spójności postaci.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">Warstwa Invisible ATS</p>
                      <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-widest font-mono">Zintegrowana mapa bitowa z metadanymi czytelnymi dla systemów HR.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="w-full group relative bg-white text-black py-7 rounded-[2rem] overflow-hidden transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3">
                  Pobierz PDF <Download size={20} />
                </span>
              </motion.button>

              <button
                onClick={onRestart}
                className="w-full flex items-center justify-center gap-3 py-6 text-zinc-600 hover:text-zinc-400 text-[10px] font-mono tracking-[0.4em] uppercase transition-all"
              >
                <RefreshCw size={14} /> Nowy Projekt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
