import React from 'react';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Layout, FileCheck } from 'lucide-react';

interface Step2Props {
  currentPhase: number;
}

export const Step2Processing: React.FC<Step2Props> = ({ currentPhase }) => {
  const phases = [
    { id: 1, title: "Structuring Text", desc: "Gemini 3.1 Pro is extracting ATS-friendly data...", icon: FileText },
    { id: 2, title: "Generating Headshot", desc: "Nano Banana 2 is creating your professional portrait...", icon: ImageIcon },
    { id: 3, title: "Designing Layout", desc: "Nano Banana Pro is rendering the visual CV...", icon: Layout },
    { id: 4, title: "Compiling PDF", desc: "Injecting invisible text layer for ATS systems...", icon: FileCheck },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Crafting Your Resume</h2>
        <p className="text-zinc-400">Please wait while our AI models work their magic.</p>
      </div>

      <div className="space-y-6">
        {phases.map((phase) => {
          const Icon = phase.icon;
          const isActive = currentPhase === phase.id;
          const isDone = currentPhase > phase.id;

          return (
            <motion.div 
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: phase.id * 0.1 }}
              className={`p-6 rounded-2xl border flex items-center gap-6 transition-all duration-500 ${
                isActive ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' :
                isDone ? 'bg-emerald-900/10 border-emerald-500/30' :
                'bg-zinc-900/50 border-zinc-800/50 opacity-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isActive ? 'bg-blue-500/20 text-blue-400' :
                isDone ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <h3 className={`text-lg font-medium mb-1 ${
                  isActive ? 'text-blue-400' :
                  isDone ? 'text-emerald-400' :
                  'text-zinc-400'
                }`}>{phase.title}</h3>
                <p className="text-sm text-zinc-500">{phase.desc}</p>
              </div>

              {isActive && (
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}
              {isDone && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
