'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, IndianRupee, Loader2 } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import toast from 'react-hot-toast';

interface ApprovePaymentProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onApproveSuccess?: () => void;
}

export default function ApprovePayment({ isOpen, onClose, itemRow, onApproveSuccess }: ApprovePaymentProps) {
   useModalEscape(isOpen, onClose, 200);

   const [amount, setAmount] = useState('');
   const [qnty, setQnty] = useState('');
   const [paymentModeId, setPaymentModeId] = useState('');
   const [comment, setComment] = useState('');
   const [tdsOptionId, setTdsOptionId] = useState('');
   const [customTdsRate, setCustomTdsRate] = useState('');

   const [paymentModes, setPaymentModes] = useState<any[]>([]);
   const [tdsOptions, setTdsOptions] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [tdsData, setTdsData] = useState<any>(null);
   const [isTdsLoading, setIsTdsLoading] = useState(false);

   const isMountedRef = useRef(false);
   const isSyncingRef = useRef(false);

   // Sync form fields with row details when opened
   useEffect(() => {
      if (isOpen && itemRow) {
         isSyncingRef.current = true;
         setAmount(String(itemRow.unit_price || ''));
         setQnty(String(itemRow.qnty || ''));
         setPaymentModeId(String(itemRow.payment_mode_id || ''));
         setComment(String(itemRow.comment || ''));

         // Sync TDS fields from historical row details
         let initialTdsOptionId = String(itemRow.tds_option || '');
         if (initialTdsOptionId === '-1') {
            initialTdsOptionId = 'not_applicable';
         } else if (initialTdsOptionId === '-2') {
            initialTdsOptionId = 'other';
         }
         setTdsOptionId(initialTdsOptionId);
         setCustomTdsRate(String(itemRow.tds_rate || ''));

         // Initialize tdsData with historical values
         setTdsData({
            base_amount: String(itemRow.amount || '0.00'),
            tds_amount: String(itemRow.tds_amount || '0.00'),
            gross_amount: String(itemRow.gross_amount || '0.00'),
            tds_rate: String(itemRow.tds_rate || '0.00')
         });

         setTimeout(() => {
            isSyncingRef.current = false;
         }, 50);
      }
   }, [isOpen, itemRow]);

   // Validate and show toast on user updates
   useEffect(() => {
      if (!isMountedRef.current) {
         isMountedRef.current = true;
         return;
      }
      if (isSyncingRef.current) {
         return;
      }

      const amtNum = parseFloat(amount);
      const qtyNum = parseInt(qnty, 10);
      const rateNum = parseFloat(customTdsRate);

      let errorMsg = '';
      if (!amount || isNaN(amtNum) || amtNum <= 0) {
         errorMsg = 'Amount must be a valid number greater than 0';
      } else if (!qnty || isNaN(qtyNum) || qtyNum <= 0) {
         errorMsg = 'Quantity must be a valid integer greater than 0';
      } else if (!paymentModeId) {
         errorMsg = 'Please select a valid payment mode';
      } else if (tdsOptionId === 'other' && (!customTdsRate || isNaN(rateNum) || rateNum < 0)) {
         errorMsg = 'Custom TDS rate must be a valid number greater than or equal to 0';
      }

      if (errorMsg) {
         toast.error(errorMsg);
      }
   }, [amount, qnty, paymentModeId, tdsOptionId, customTdsRate]);

   // Calculate form validity
   const amtNum = parseFloat(amount);
   const qtyNum = parseInt(qnty, 10);
   const rateNum = parseFloat(customTdsRate);

   const isTdsValid = tdsOptionId !== 'other' || (customTdsRate && !isNaN(rateNum) && rateNum >= 0);
   const isFormValid = !!(
      amount && !isNaN(amtNum) && amtNum > 0 &&
      qnty && !isNaN(qtyNum) && qtyNum > 0 &&
      paymentModeId &&
      isTdsValid
   );

   // Real-time calculation of TDS when amount, qnty, or TDS percentage changes
   useEffect(() => {
      if (!isOpen || isSyncingRef.current) return;

      const baseAmt = parseFloat(amount);
      const qty = parseInt(qnty, 10);
      if (isNaN(baseAmt) || baseAmt <= 0 || isNaN(qty) || qty <= 0) {
         return;
      }

      const timer = setTimeout(async () => {
         let effectiveRate = '0';
         if (tdsOptionId === 'not_applicable') {
            effectiveRate = '0';
         } else if (tdsOptionId === 'other') {
            effectiveRate = customTdsRate || '0';
         } else {
            const matched = tdsOptions.find(o => String(o.id) === String(tdsOptionId));
            if (matched) effectiveRate = matched.tds_option;
         }

         setIsTdsLoading(true);
         try {
            const token = localStorage.getItem('at_ki8Xq1iV');
            const params = new URLSearchParams();
            params.set('base_amount', amount);
            params.set('qnty', String(qnty));
            params.set('tds_rate', effectiveRate);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/calculateTDSAmount?${params.toString()}`, {
               headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
               const text = await res.text();
               let arr;
               try { arr = JSON.parse(text); } catch (e) { }
               const data = arr && Array.isArray(arr) ? arr[0] : arr;
               if (data && String(data.Status) === '1') {
                  setTdsData(data);
               }
            }
         } catch (e) {
            console.error("TDS Calculation failed:", e);
         } finally {
            setIsTdsLoading(false);
         }
      }, 500);

      return () => clearTimeout(timer);
   }, [amount, qnty, tdsOptionId, customTdsRate, tdsOptions, isOpen]);

   // Fetch master payment modes and TDS options
   useEffect(() => {
      const fetchData = async () => {
         setIsLoading(true);
         try {
            const token = localStorage.getItem('at_ki8Xq1iV');
            
            // 1. Fetch Payment Modes
            const resModes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
               method: 'GET',
               headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resModes.ok) {
               const dataModes = await resModes.json();
               const dataArr = Array.isArray(dataModes) ? dataModes[0] : dataModes;
               if (dataArr && dataArr.paymentmodes_Arr) {
                  setPaymentModes(dataArr.paymentmodes_Arr);
               }
            }

            // 2. Fetch TDS Options
            const resTds = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
               headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resTds.ok) {
               const dataTds = await resTds.json();
               const dataArr = Array.isArray(dataTds) ? dataTds[0] : dataTds;
               if (dataArr && dataArr.tds_options) {
                  let loadedTdsOptions = dataArr.tds_options || [];
                  let finalTds = [...loadedTdsOptions];
                  if (!finalTds.find(o => String(o.id) === 'not_applicable')) {
                     finalTds.push({ id: 'not_applicable', tds_option: '0.00', label: 'Not Applicable' });
                  }
                  if (!finalTds.find(o => String(o.id) === 'other')) {
                     finalTds.push({ id: 'other', tds_option: '', label: 'Other' });
                  }
                  setTdsOptions(finalTds);
               }
            }

         } catch (err: any) {
            console.error('Failed to fetch data:', err);
            toast.error('Failed to load form options');
         } finally {
            setIsLoading(false);
         }
      };

      if (isOpen) {
         fetchData();
      }
   }, [isOpen]);

   if (!isOpen || !itemRow) return null;

   const handleApproveSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) {
         toast.error('Please correct the validation errors in the form');
         return;
      }

      setIsSubmitting(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('payment_details_id', String(itemRow.payment_details_id || ''));
         formData.append('qnty', String(qnty));

         // tds_option mapping
         let tdsOptValue = tdsOptionId;
         if (tdsOptionId === 'not_applicable') {
            tdsOptValue = '-1';
         } else if (tdsOptionId === 'other') {
            tdsOptValue = '-2';
         }
         formData.append('tds_option', tdsOptValue);

         // tds_rate (send customTdsRate if Other selected, else send '0' or matched value)
         let effectiveRate = '0';
         if (tdsOptionId === 'other') {
            effectiveRate = customTdsRate || '0';
         } else {
            const matched = tdsOptions.find(o => String(o.id) === String(tdsOptionId));
            if (matched) effectiveRate = matched.tds_option;
         }
         formData.append('tds_rate', effectiveRate);

         formData.append('unit_price', amount);
         formData.append('base_amount', tdsData?.base_amount || String(Number(amount) * Number(qnty)));
         formData.append('tds_amount', tdsData?.tds_amount || '0.00');
         formData.append('gross_amount', tdsData?.gross_amount || '0.00');
         
         if (comment) {
            formData.append('comment', comment);
         }

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/approvePayment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
         });

         if (!res.ok) {
            throw new Error('Failed to submit payment approval');
         }

         const text = await res.text();
         let arr;
         try {
            arr = JSON.parse(text);
         } catch (err) {
            throw new Error('Invalid JSON response from server');
         }
         const data = arr && Array.isArray(arr) ? arr[0] : arr;

         if (data && (String(data.Status) === '1' || data.Status === 1)) {
            toast.success(data.Message || 'Payment Approved');
            onClose();
            onApproveSuccess?.();
         } else {
            toast.error(data?.Message || 'Failed to approve payment');
         }
      } catch (err: any) {
         console.error('Approval submission error:', err);
         toast.error(err.message || 'An error occurred during approval submission');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[850px] max-w-[95vw] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
                  Approve Payment
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleApproveSubmit} className="p-6 bg-[#161a25] flex flex-col gap-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: User Inputs */}
                  <div className="flex flex-col gap-4">
                     {/* Amount */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           Unit Cost <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="number"
                           step="0.01"
                           placeholder="0.00"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-[#1b202c] border border-gray-700 rounded py-2 px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                           required
                        />
                     </div>

                     {/* Quantity */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="number"
                           step="1"
                           placeholder="0"
                           value={qnty}
                           onChange={(e) => setQnty(e.target.value)}
                           className="w-full bg-[#1b202c] border border-gray-700 rounded py-2 px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                           required
                        />
                     </div>

                     {/* Payment Mode */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                           value={paymentModeId}
                           onChange={(e) => setPaymentModeId(e.target.value)}
                           className="w-full bg-[#1b202c] border border-gray-700 rounded py-2 px-3 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                           required
                        >
                           <option value="">-- Select Payment Mode --</option>
                           {paymentModes.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                 {opt.mode}
                              </option>
                           ))}
                        </select>
                     </div>

                     {/* TDS Percentage */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           TDS Percentage
                        </label>
                        <select
                           value={tdsOptionId}
                           onChange={(e) => setTdsOptionId(e.target.value)}
                           className="w-full bg-[#1b202c] border border-gray-700 rounded py-2 px-3 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                        >
                           <option value="">-- Select TDS Percentage --</option>
                           {tdsOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                 {opt.label || `${parseFloat(opt.tds_option).toFixed(2)}%`}
                              </option>
                           ))}
                        </select>
                     </div>

                     {/* Custom TDS Rate */}
                     {tdsOptionId === 'other' && (
                        <div className="flex flex-col animate-in fade-in zoom-in-95 duration-200">
                           <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                              Custom TDS Rate (%) <span className="text-red-500">*</span>
                           </label>
                           <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={customTdsRate}
                              onChange={(e) => setCustomTdsRate(e.target.value)}
                              className="w-full bg-[#1b202c] border border-blue-500 rounded py-2 px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              required
                           />
                        </div>
                     )}

                     {/* Comment */}
                     <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                           <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              Comment <span className="text-gray-500">(Optional)</span>
                           </label>
                           <span className="text-[10px] text-gray-500 font-medium">
                              Remaining Chars. {200 - comment.length}
                           </span>
                        </div>
                        <textarea
                           placeholder="Enter any additional notes..."
                           value={comment}
                           maxLength={200}
                           onChange={(e) => setComment(e.target.value.slice(0, 200))}
                           className="w-full bg-[#1b202c] border border-gray-700 rounded py-2 px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium h-[40px] resize-none"
                        />
                     </div>
                  </div>

                  {/* Right Column: TDS Calculation Display */}
                  <div className="flex flex-col gap-4">
                     {/* Total Base Amount */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           Total Base Amount
                        </label>
                        <div className="relative">
                           <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                           <input
                              type="text"
                              readOnly
                              value={tdsData?.base_amount || '0.00'}
                              className="w-full bg-[#1b202c] border border-gray-700 rounded pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80 font-medium"
                           />
                        </div>
                     </div>

                     {/* Total TDS Amount */}
                     <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                           Total TDS Amount
                        </label>
                        <div className="relative">
                           <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                           <input
                              type="text"
                              readOnly
                              value={tdsData?.tds_amount || '0.00'}
                              className="w-full bg-[#1b202c] border border-gray-700 rounded pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80 font-medium"
                           />
                        </div>
                     </div>

                     {/* Gross Amount */}
                     <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                           Gross Amount (Final Payout)
                        </label>
                        <div className="relative">
                           <IndianRupee className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                           <input
                              type="text"
                              readOnly
                              value={tdsData?.gross_amount || '0.00'}
                              className="w-full bg-[#1b202c] border border-emerald-500/50 rounded pl-9 pr-3 py-2.5 text-emerald-400 font-bold text-[14px] cursor-not-allowed shadow-inner"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Footer Action Buttons */}
               <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700/60">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-[12px] uppercase tracking-wide transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={!isFormValid || isSubmitting}
                     className={`px-5 py-2 rounded font-bold text-[12px] uppercase tracking-wide transition-colors flex items-center gap-1.5 ${
                        isFormValid && !isSubmitting
                           ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-500/20'
                           : 'bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-50'
                     }`}
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                     ) : (
                        <>
                           <Check className="w-4 h-4" /> Approve
                        </>
                     )}
                  </button>
               </div>

            </form>
         </div>
      </div>
   );
}
