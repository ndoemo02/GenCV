import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Step1Props {
  onSubmit: (text: string, photoBase64: string | null, photoMimeType: string | null) => void;
}

export const Step1Input: React.FC<Step1Props> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setPhoto({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text, photo?.base64 || null, photo?.mimeType || null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto w-full"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Create an ATS-Friendly <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Visual CV</span> with AI
        </h1>
        <p className="text-lg text-zinc-400">
          Paste your LinkedIn profile or resume text, upload a casual selfie, and let AI design a stunning, ATS-readable PDF.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
            <FileText className="w-4 h-4 text-blue-400" />
            Your Experience & Details
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your LinkedIn 'About' and 'Experience' sections here, or type your resume details..."
            className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            required
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Professional Headshot (Optional)
          </label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              photo ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            {photo ? (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-emerald-500/30">
                  <img src={`data:${photo.mimeType};base64,${photo.base64}`} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-emerald-400 font-medium">Photo selected</p>
                <p className="text-xs text-zinc-500 mt-1">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-zinc-300 font-medium">Upload a casual selfie</p>
                <p className="text-sm text-zinc-500 mt-2">AI will transform it into a professional headshot.</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl font-medium text-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Generate Visual CV <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
};
