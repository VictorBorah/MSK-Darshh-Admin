'use client';

import { X, CheckCircle, XCircle, User, ShieldAlert, MessageSquare, ClipboardCheck, Truck } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useTheme } from '@/components/providers/ThemeProvider';

interface VerificationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  verificationData: any | null;
  onVerifyClick?: (data: any) => void;
}

export default function VerificationDetails({ isOpen, onClose, verificationData, onVerifyClick }: VerificationDetailsProps) {
  useModalEscape(isOpen, onClose, 200);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen || !verificationData) return null;

  const isVerified = String(verificationData.is_verified).toLowerCase() === 'yes';
  const isFulfilled = String(verificationData.is_fulfilled).toLowerCase() === 'yes';
  const isDelivered = String(verificationData.delivery_confirmed).toLowerCase() === 'yes';

  // Theme-aware styles config
  const modalBg = isDark ? 'bg-[#232b3e] border-gray-700/80' : 'bg-white border-slate-200';
  const headerBg = isDark ? 'bg-[#293653] border-gray-700/50' : 'bg-slate-50 border-slate-200';
  const labelColor = isDark ? 'text-gray-400' : 'text-slate-500';
  const textValColor = isDark ? 'text-white' : 'text-slate-800';
  const cardBg = isDark ? 'bg-[#1b202c] border-gray-700/30' : 'bg-slate-50 border-slate-100';

  return (
    <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className={`border rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col relative w-[550px] max-w-[95vw] overflow-hidden transition-all duration-300 ${modalBg}`}>
        
        {/* Header */}
        <div className={`px-6 py-4.5 border-b flex justify-between items-center ${headerBg}`}>
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h2 className={`text-[15px] font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Verification Details
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className={`transition-colors p-1.5 rounded-md border-0 bg-transparent ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-5">
          
          {/* Item Context Row */}
          {verificationData.item_name && (
            <div className={`px-4 py-3 rounded-lg border text-xs font-semibold ${isDark ? 'bg-[#151924]/60 border-gray-800/40 text-gray-300' : 'bg-slate-50 border-slate-200/50 text-slate-600'}`}>
              Details audit for item: <span className={isDark ? 'text-white font-bold' : 'text-slate-800 font-bold'}>{verificationData.item_name}</span>
            </div>
          )}

          {/* Section 1: Verification Audit State */}
          <div className={`p-4 rounded-lg border flex flex-col gap-4.5 ${cardBg}`}>
            <div className="flex justify-between items-center border-b border-gray-700/10 pb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Verification Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isVerified 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isVerified ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Unverified
                  </>
                )}
              </span>
            </div>

            {/* Audit Status Level Text */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>Verification Summary</span>
              <span className={`text-[13px] font-semibold flex items-center gap-2 ${textValColor}`}>
                <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
                {verificationData.verification_status_txt || 'Status description unavailable'}
              </span>
            </div>

            {/* Verified Comment */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>Auditor Comment</span>
              <div className={`p-3 rounded border text-[12.5px] italic flex gap-2.5 ${
                isDark 
                  ? 'bg-[#151924]/80 border-gray-800 text-gray-300' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <MessageSquare className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <span>{verificationData.verified_comment || 'No comments recorded.'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Requester & Demand Details */}
          <div className={`p-4 rounded-lg border grid grid-cols-3 gap-4 ${cardBg}`}>
            
            {/* Raised By Staff */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>Raised By Staff</span>
              <span className={`text-[13px] font-semibold flex items-center gap-1.5 ${textValColor}`}>
                <User className="w-3.5 h-3.5 text-gray-500" />
                {verificationData.raised_by_staff_name || 'System / Default'}
              </span>
            </div>

            {/* User Group */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>User Group / Role</span>
              <span className={`text-[13px] font-semibold ${textValColor}`}>
                {verificationData.raised_by_usergroup_name || 'N/A'}
              </span>
            </div>

            {/* Demand ID */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>Demand ID</span>
              <span className={`text-[13px] font-semibold font-mono ${textValColor}`}>
                #{verificationData.demand_id || verificationData.id || 'N/A'}
              </span>
            </div>

          </div>

          {/* Section 3: Fulfillment & Delivery Status */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Fulfillment Status Card */}
            <div className={`p-4 rounded-lg border flex flex-col gap-3 ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>Fulfillment Status</span>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                  isFulfilled 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                }`}>
                  {isFulfilled ? 'Fulfilled' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Delivery Confirmation Card */}
            <div className={`p-4 rounded-lg border flex flex-col gap-3 ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor} flex items-center gap-1.5`}>
                <Truck className="w-3.5 h-3.5 text-gray-500" /> Delivery Status
              </span>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                  isDelivered 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                }`}>
                  {isDelivered ? 'Confirmed' : 'Unconfirmed'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4.5 border-t flex justify-end gap-3 ${isDark ? 'bg-[#1b202c]/50 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-colors border ${
              isDark 
                ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Close
          </button>
          <button
            onClick={() => onVerifyClick?.(verificationData)}
            disabled={isVerified}
            title={isVerified ? "Already verified" : "Verify Demand"}
            className={`px-5 py-2 text-[13px] font-bold rounded-lg transition-colors ${
              isVerified
                ? 'bg-gray-700/50 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow active:scale-95'
            }`}
          >
            Verify
          </button>
        </div>

      </div>
    </div>
  );
}
