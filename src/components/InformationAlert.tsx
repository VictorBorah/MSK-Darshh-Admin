import { X, CheckSquare } from 'lucide-react';
import React from 'react';
import { useModalEscape } from '@/hooks/useModalEscape';

interface InformationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function InformationAlert({ isOpen, onClose, title, content }: InformationAlertProps) {
  useModalEscape(isOpen, onClose, 9999);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1c2130] border border-emerald-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[400px] max-w-[95vw] shadow-emerald-500/10">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-[#232b3e]">
          <div className="flex items-center gap-2">
             <CheckSquare className="w-[18px] h-[18px] text-emerald-400" />
             <h2 className="text-[14px] text-emerald-400 font-bold tracking-wide">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-3 bg-[#161a25]">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1 shadow-inner shadow-emerald-500/5">
             <CheckSquare className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-[13px] text-[#ccd6f6] font-medium leading-relaxed px-2">
             {content}
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700/50 bg-[#1e2436] flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-sm flex items-center justify-center"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}
