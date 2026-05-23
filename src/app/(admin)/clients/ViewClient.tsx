'use client';

import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Building
} from 'lucide-react';

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  client_mobile_1: string;
  client_mobile_2: string;
  client_email: string;
  added_on: string;
}

interface ViewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

interface FieldProps {
  label: string;
  value: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}

const Field = ({ label, value, icon: Icon, mono = false }: FieldProps) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#161a25]/60 border border-gray-800/40 hover:border-gray-700/40 transition-colors">
    {Icon && <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${value ? 'text-blue-400' : 'text-gray-600'}`} />}
    <div className="flex flex-col gap-0.5 overflow-hidden">
      <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{label}</span>
      <span className={`text-[13px] break-words ${value ? (mono ? 'font-mono text-blue-400 font-bold' : 'text-gray-200') : 'text-gray-600 italic'}`}>
        {value || 'Not Provided'}
      </span>
    </div>
  </div>
);

export default function ViewClientModal({ isOpen, onClose, client }: ViewClientModalProps) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[760px] max-w-[95vw] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-400" /> Client Profile Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Two Columns */}
        <div className="p-6 bg-[#11141e] flex flex-col md:flex-row gap-6 md:gap-0 overflow-y-auto">

          {/* Left Column: Avatar & Meta Identity */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center md:border-r border-gray-800/80 md:pr-6 pb-6 md:pb-0 shrink-0">
            <div className="w-20 h-20 rounded-full bg-blue-600/10 border-2 border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/5 relative mb-3">
              <User className="w-10 h-10" />
            </div>
            <h3 className="text-[17px] font-bold text-white text-center tracking-tight truncate max-w-full">
              {client.client_name}
            </h3>
            <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1.5 mt-1 text-center justify-center">
              <Building className="w-3.5 h-3.5 text-gray-600" /> Client of Darsh Builders
            </span>

            <div className="w-full mt-6 space-y-2">
              <Field label="Client ID" value={`CL-${client.client_id.padStart(3, '0')}`} mono icon={ShieldCheck} />
              <Field label="Added On" value={client.added_on} icon={Calendar} />
            </div>
          </div>

          {/* Right Column: Contact Details & Address */}
          <div className="w-full md:w-2/3 flex flex-col gap-3 md:pl-6">
            <h4 className="text-[11.5px] text-gray-500 font-bold uppercase tracking-wider mb-1">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email Address" value={client.client_email} icon={Mail} />
              <Field label="Primary Mobile" value={client.client_mobile_1} icon={Phone} />
            </div>
            <Field label="Secondary Mobile" value={client.client_mobile_2} icon={Phone} />

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#161a25]/60 border border-gray-800/40 hover:border-gray-700/40 transition-colors w-full mt-1">
              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${client.client_address ? 'text-red-400' : 'text-gray-600'}`} />
              <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">Permanent Address</span>
                <p className="text-[13px] leading-relaxed break-words text-gray-200 mt-1 max-h-[100px] overflow-y-auto pr-1 select-text scrollbar-thin">
                  {client.client_address || <span className="text-gray-600 italic">Not Provided</span>}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg text-xs font-bold transition-all duration-300 shadow-md hover:border-gray-600"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}

