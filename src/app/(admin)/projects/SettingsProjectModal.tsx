'use client';
import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import WarningAlertModal from '@/components/WarningAlertModal';

interface SettingsProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function SettingsProjectModal({ isOpen, onClose, projectId, projectName }: SettingsProjectModalProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  useModalEscape(isOpen, () => setShowExitConfirm(true), 200);

  if (!isOpen) return null;

  return (
    <>
      <WarningAlertModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard Project Details?"
        content="Are you sure you want to exit without saving? All progress will be lost."
        onConfirm={() => {
           setShowExitConfirm(false);
           onClose();
        }}
      />
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
        <div className="bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative w-[500px] max-w-[95vw] overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
            <h2 className="text-[17px] font-semibold text-white tracking-wide flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Settings: {projectName}
            </h2>
            <button onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-white transition-colors bg-transparent hover:bg-gray-800 p-1.5 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 text-gray-300">
            <p className="text-sm mb-4">Configuration details for Project ID: <span className="font-bold text-white">{projectId}</span>.</p>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 flex flex-col gap-2 font-mono text-xs">
               <p className="text-gray-400">Settings panel under construction.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
