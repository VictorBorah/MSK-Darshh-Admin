'use client';

import React, { useRef } from 'react';
import { X, Printer, FileText, IndianRupee, HelpCircle } from 'lucide-react';
import { generatePdfFromElement } from '@/utils/pdfGenerator';

interface PaymentRecord {
  payment_id: string;
  payment_date: string;
  project_name: string;
  project_id: string;
  payment_mode?: string;
  payment_mode_txt?: string;
  pay_mode?: string;
  amount: string | number;
  remarks?: string;
  transaction_number?: string;
  added_on?: string;
}

interface ClientPaymentDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  clientName: string;
}

export default function ClientPaymentDetails({ isOpen, onClose, payment, clientName }: ClientPaymentDetailsProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = async () => {
    if (!printRef.current) return;
    const filename = `payment_receipt_${payment.payment_id || 'details'}.pdf`;
    await generatePdfFromElement(
      printRef.current,
      filename,
      `Zyn Construction Network - Client: ${clientName}`
    );
  };

  const displayAmount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount || '0');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1f2536] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[550px] max-w-[95vw] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
            <FileText className="w-5 h-5 text-blue-400" /> Payment Details
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area Wrapper */}
        <div className="flex-grow overflow-y-auto bg-[#11141e] p-6 max-h-[70vh]">
          <div ref={printRef} className="p-6 bg-[#161a25] border border-gray-800 rounded-xl flex flex-col gap-6 text-gray-300">
            
            {/* Header info inside printable area */}
            <div className="border-b border-gray-800 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-[15px] font-extrabold text-white tracking-tight uppercase">Payment Voucher</h3>
                <span className="text-[10px] text-gray-500 font-semibold block mt-1 tracking-wider uppercase">ZYN CONSTRUCTION NETWORK</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-500 font-bold block">VOUCHER ID</span>
                <span className="text-[13px] font-bold text-blue-400 font-mono">#{payment.payment_id || 'N/A'}</span>
              </div>
            </div>

            {/* Main content grid */}
            <div className="space-y-4">
              
              {/* Payment Amount Card */}
              <div className="bg-[#1b202c]/60 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center py-6 shadow-inner">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">TOTAL AMOUNT PAID</span>
                <div className="text-2xl font-black text-emerald-400 flex items-center tracking-tight">
                  <IndianRupee className="w-6 h-6 mr-1" />
                  {displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Data Table details */}
              <div className="divide-y divide-gray-800/60 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Client Name</span>
                  <span className="text-white font-bold text-right">{clientName}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Associated Project</span>
                  <span className="text-white font-bold text-right">{payment.project_name || 'N/A'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Payment Mode</span>
                  <span className="text-white font-bold text-right uppercase tracking-wide">{payment.payment_mode || payment.payment_mode_txt || payment.pay_mode || 'N/A'}</span>
                </div>
                {payment.transaction_number && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Transaction Reference</span>
                    <span className="text-white font-bold text-right font-mono text-[11px]">{payment.transaction_number}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Date of Transaction</span>
                  <span className="text-white font-bold text-right font-mono">{payment.payment_date || 'N/A'}</span>
                </div>
                {payment.added_on && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-gray-500 font-medium">System Registered On</span>
                    <span className="text-white font-medium text-right font-mono">{payment.added_on}</span>
                  </div>
                )}
                {payment.remarks && (
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-gray-500 font-medium block">Voucher Remarks</span>
                    <p className="text-[11px] text-gray-400 bg-black/20 p-2.5 rounded-lg leading-relaxed">{payment.remarks}</p>
                  </div>
                )}
              </div>

            </div>

            <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-[9px] text-gray-600 font-semibold tracking-wider">
              <span>SYSTEM GENERATED VOUCHER</span>
              <span>VERIFIED TRANSACTION</span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-[13px] font-semibold transition-colors border border-gray-700"
          >
            Close
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" /> Print to PDF
          </button>
        </div>
        
      </div>
    </div>
  );
}
