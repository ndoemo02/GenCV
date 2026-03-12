import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  Plus,
  Type,
  Image as ImageIcon,
  ChevronRight,
  FileText,
  ArrowRight
} from 'lucide-react';

interface Step1Props {
  onSubmit: (
    text: string,
    photo: { base64: string; mimeType: string } | null,
    sourceDoc: { base64: string; mimeType: string } | null
  ) => void;
}

const Spotlight = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    {/* Top Beam */}
    <div
      className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[1000px] opacity-40 z-0"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, white 180deg, transparent 200deg)',
        filter: 'blur(80px)',
      }}
    />

    {/* Floor Glow */}
    <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] flex justify-center items-center">
      <div className="w-[600px] h-[150px] rounded-[100%] bg-white/10 blur-[50px]" />
      <div className="absolute w-[300px] h-[60px] rounded-[100%] bg-white/40 blur-[25px]" />
      <div className="absolute w-[150px] h-[30px] rounded-[100%] bg-white/70 blur-[10px]" />
    </div>
  </div>
);

export const Step1Input: React.FC<Step1Props> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<{ base64: string; mimeType: string } | null>(null);
  const [sourceDoc, setSourceDoc] = useState<{ base64: string; mimeType: string } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (type === 'photo') {
          setPhoto({ base64, mimeType: file.type });
        } else {
          setSourceDoc({ base64, mimeType: file.type });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !sourceDoc) return;
    onSubmit(text, photo, sourceDoc);
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <Spotlight />

      {/* Hero Section */}
      <div className="relative z-10 perspective-1000 mb-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1
            className="text-[120px] md:text-[220px] font-black tracking-[-0.05em] text-white leading-none mix-blend-difference"
            style={{
              textShadow: '0 0 40px rgba(255,255,255,0.4), 0 0 100px rgba(255,255,255,0.1)',
            }}
          >
            CV
          </h1>
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent -mt-6 blur-[1px]" />
        </motion.div>
      </div>

      {/* Main Controls Overlay */}
      <div className="relative z-20 w-full max-w-4xl px-6 grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Source CV Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => docInputRef.current?.click()}
          className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] overflow-hidden transition-all hover:border-white/30 text-left"
        >
          <input type="file" ref={docInputRef} onChange={(e) => handleFileUpload(e, 'doc')} accept=".pdf,.doc,.docx,image/*" className="hidden" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col h-full justify-between gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Upload size={24} className={sourceDoc ? 'text-blue-400' : ''} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight">{sourceDoc ? 'Dokument gotowy' : 'Wczytaj stare CV'}</h3>
              <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-widest font-mono">
                {sourceDoc ? 'PLIK ZAŁADOWANY' : 'PDF, JPG, PNG'}
              </p>
            </div>
          </div>
        </motion.button>

        {/* Text Input Block */}
        <div className="md:col-span-1 group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] overflow-hidden transition-all hover:border-white/20">
          <div className="flex flex-col h-full gap-3">
            <div className="flex justify-between items-center text-white/20 text-[9px] font-mono tracking-widest uppercase mb-1">
              <span>DANE TEKSTOWE</span>
              <span className={text.length > 0 ? 'text-white/60' : ''}>{text.length} B</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Wklej tutaj treść profili, tekst CV lub notatki..."
              className="flex-grow bg-transparent border-none p-0 text-[11px] text-zinc-400 placeholder-zinc-700 focus:outline-none focus:ring-0 resize-none font-mono leading-relaxed h-[80px]"
            />
          </div>
        </div>

        {/* Portrait / Photo Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => photoInputRef.current?.click()}
          className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] overflow-hidden transition-all hover:border-white/30 text-left"
        >
          <input type="file" ref={photoInputRef} onChange={(e) => handleFileUpload(e, 'photo')} accept="image/*" className="hidden" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col h-full justify-between gap-4">
            {photo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <img src={`data:${photo.mimeType};base64,${photo.base64}`} alt="Preview" className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/10 rounded-2xl text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ImageIcon size={24} />
              </div>
            )}
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight">{photo ? 'Wykryto portret' : 'Dodaj zdjęcie'}</h3>
              <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-widest font-mono">KOMPONENT OPCJONALNY</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Final Submit Action */}
      <div className="relative z-20 mt-12 mb-12">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!text.trim() && !sourceDoc}
          onClick={handleSubmit}
          className="group relative bg-white text-black px-12 py-5 rounded-full overflow-hidden transition-all shadow-[0_20px_60px_-10px_rgba(255,255,255,0.2)] disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed"
        >
          <span className="relative z-10 font-black text-sm tracking-widest uppercase flex items-center gap-3">
            Rozpocznij proces <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
      </div>

      {/* Disclaimer / System Log */}
      <div className="relative z-20 text-[9px] font-mono tracking-[0.4em] text-zinc-600 uppercase opacity-50 px-10 text-center">
        Protokół AI: Gemini_3.1_Pro_H-T // STATUS: CORE SYSTEM STABLE
      </div>
    </div>
  );
};
