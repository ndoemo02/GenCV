import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { motion } from 'motion/react';

export const ApiKeyGate: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) onKeySelected();
      }
      setLoading(false);
    };
    checkKey();
  }, [onKeySelected]);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
      onKeySelected();
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>;
  if (hasKey) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">API Key Required</h1>
        <p className="text-zinc-400 mb-8">
          To generate high-quality visual resumes and professional headshots, this app requires a paid Gemini API key.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
        >
          Select API Key
        </button>
      </motion.div>
    </div>
  );
};
