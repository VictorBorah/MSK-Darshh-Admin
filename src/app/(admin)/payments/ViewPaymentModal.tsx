import React from 'react';
import { X, Settings } from 'lucide-react';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  paymentModes: any[];
}

export default function ViewPaymentModal({ isOpen, onClose, paymentId }: ViewPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[600px] max-w-[95vw]">
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653]">
          <h2 className="text-[16px] text-white font-bold tracking-wide flex items-center gap-2">
            <Settings className="w-5 h-5" /> View Payment
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 text-center text-gray-400 font-medium">
          Content goes here. This is a placeholder modal.
        </div>
      </div>
    </div>
  );
}
