import { X, TriangleAlert } from 'lucide-react';
import React from 'react';

interface WarningAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onConfirm?: () => void;
}

export default function WarningAlertModal({ isOpen, onClose, title, content, onConfirm }: WarningAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1c2130] border border-orange-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[400px] max-w-[95vw] shadow-orange-500/10"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-[#232b3e]">
          <div className="flex items-center gap-2">
             <TriangleAlert className="w-[18px] h-[18px] text-orange-400" />
             <h2 className="text-[14px] text-orange-400 font-bold tracking-wide">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-3 bg-[#161a25]">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-1 shadow-inner shadow-orange-500/5">
             <TriangleAlert className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-[13px] text-[#ccd6f6] font-medium leading-relaxed px-2">
             {content}
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700/50 bg-[#1e2436] flex justify-center gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-[13px] font-bold text-gray-300 hover:text-white bg-gray-600/30 hover:bg-gray-600 rounded transition-colors shadow-sm min-w-[100px]"
              >
                No
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 text-[13px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors shadow-sm min-w-[100px]"
              >
                Yes
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 text-[13px] font-bold text-white bg-[#232b3e] border border-gray-600 hover:bg-gray-700 rounded transition-colors shadow-sm min-w-[120px]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
