'use client';

import React from 'react';
import { X, Settings, AlertCircle } from 'lucide-react';

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  client_mobile_1: string;
  client_mobile_2: string;
  client_email: string;
  added_on: string;
}

interface ClientSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export default function ClientSettingsModal({ isOpen, onClose, client }: ClientSettingsModalProps) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[500px] max-w-[95vw] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-blue-400" /> Client Settings: {client.client_name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#11141e] flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/5 mb-2">
            <AlertCircle className="w-7 h-7 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          <p className="text-[13.5px] leading-relaxed text-gray-300 px-4">
            Currently, Zyn Software doesn't support client modules and usergroups. Therefore, client settings are not supported.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg text-xs font-bold transition-all duration-300 shadow-md hover:border-gray-600"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
