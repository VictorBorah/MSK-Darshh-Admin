import { X, Box, FileText, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface ApprovePurchaseProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onSuccess: () => void;
}

export default function ApprovePurchase({ isOpen, onClose, itemRow, onSuccess }: ApprovePurchaseProps) {
   useModalEscape(isOpen, onClose, 350);
   const [comment, setComment] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showTaxDetails, setShowTaxDetails] = useState(false);
   const [paymentModes, setPaymentModes] = useState<any[]>([]);
   const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
   const [isLoadingModes, setIsLoadingModes] = useState(false);

   useEffect(() => {
      if (isOpen && itemRow) {
         const fetchConfigAndDetails = async () => {
            setIsLoadingModes(true);
            try {
               const token = localStorage.getItem('at_ki8Xq1iV');
               
               // Fetch app config to get payment modes list
               const appRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
                  headers: { 'Authorization': `Bearer ${token}` }
               });
               const appText = await appRes.text();
               const appArr = JSON.parse(appText);
               const appDataRaw = Array.isArray(appArr) ? appArr[0] : appArr;
               const modes = appDataRaw?.paymentmodes_Arr || [];
               setPaymentModes(modes);

               // Fetch details to get exact payment mode for this item
               const procurementId = itemRow.purchase_id;
               if (procurementId) {
                  const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchPurchaseDetails?procurement_id=${procurementId}`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const detailsText = await detailsRes.text();
                  const detailsArr = JSON.parse(detailsText);
                  const detailsData = Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

                  if (detailsData && String(detailsData.Status) === '1' && detailsData.item_data) {
                     // Match row by item_id
                     const matchItem = detailsData.item_data.find((i: any) => String(i.item_id) === String(itemRow.item_id));
                     const exactPaymentMode = matchItem ? matchItem.payment_mode : (detailsData.item_data[0]?.payment_mode || '');
                     setSelectedPaymentMode(String(exactPaymentMode || ''));
                  }
               }
            } catch (e) {
               console.error("Failed to load configs", e);
            } finally {
               setIsLoadingModes(false);
            }
         };
         fetchConfigAndDetails();
      } else {
         setComment('');
         setSelectedPaymentMode('');
      }
   }, [isOpen, itemRow]);

   if (!isOpen || !itemRow) return null;

   const maxChars = 250;
   const remainingChars = maxChars - comment.length;

   const handleApprove = async () => {
      setIsSubmitting(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('purchase_id', String(itemRow.purchase_id || ''));
         formData.append('comment', comment);
         formData.append('payment_mode', selectedPaymentMode);

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/approvePurchase`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
         });

         const text = await res.text();
         let arr;
         try { arr = JSON.parse(text); } catch (e) { }
         const result = arr && Array.isArray(arr) ? arr[0] : arr;

         if (result && (String(result.Status) === '1' || result.Status === 1)) {
            toast.success(result.Message || 'Purchase Approved');
            onSuccess();
            onClose();
         } else {
            toast.error(result?.Message || 'Failed to approve purchase');
         }
      } catch (err: any) {
         toast.error(err.message || 'An error occurred during approval');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[650px] max-w-[95vw] rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Approve Purchase
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Cancel">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 bg-[#161a25] flex flex-col gap-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4">
                     {/* Purchase Details Container */}
                     <div className="border border-gray-700/80 rounded-lg p-4 bg-[#1b202c] flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase details</span>
                        <div className="flex flex-col gap-1 mt-1">
                           <div className="text-[13px] text-white font-bold">{itemRow.item_name || 'N/A'}</div>
                           <div className="text-[12px] text-gray-300">
                              <span className="text-gray-400">Qty:</span> {itemRow.qnty || '0'}
                           </div>
                           <button
                              onClick={() => setShowTaxDetails(true)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 underline text-left mt-1 w-fit focus:outline-none"
                           >
                              Taxation Details
                           </button>
                        </div>
                     </div>

                     {/* Warehouse Container */}
                     <div className="border border-gray-700/80 rounded-lg p-4 bg-[#1b202c] flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Warehouse</span>
                        <div className="text-[13px] text-white font-semibold mt-1">{itemRow.warehouse_name || 'N/A'}</div>
                     </div>
                  </div>

                  <div>
                     {/* Vendor Details Container */}
                     <div className="border border-gray-700/80 rounded-lg p-4 bg-[#1b202c] flex flex-col gap-2 h-full">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendor details</span>
                        <div className="flex flex-col gap-1.5 mt-1">
                           <div className="text-[13px] text-white font-bold">{itemRow.vendor_name || 'N/A'}</div>
                           <div className="text-[12px] text-gray-300">
                              <span className="text-gray-400">Mobile:</span> {itemRow.vendor_mobile || 'N/A'}
                           </div>
                           <div className="text-[12px] text-gray-300">
                              <span className="text-gray-400">Email:</span> {itemRow.vendor_email || 'N/A'}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Payment Mode Selector */}
               <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Payment Mode <span className="text-red-400">*</span></label>
                  <Select
                     options={paymentModes?.map((pm: any) => ({ value: String(pm.id), label: pm.mode || '' })) || []}
                     value={paymentModes?.find(pm => String(pm.id) === selectedPaymentMode) ? { value: selectedPaymentMode, label: paymentModes.find((pm: any) => String(pm.id) === selectedPaymentMode)?.mode || '' } : null}
                     onChange={(val: any) => {
                        setSelectedPaymentMode(val ? val.value : '');
                      }}
                     placeholder="Select Payment Mode..."
                     isLoading={isLoadingModes}
                     styles={{
                        control: (base, state) => ({ ...base, backgroundColor: '#232b3e', borderColor: state.isFocused ? '#3b82f6' : '#4b5563', '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' }, minHeight: '38px', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                        menuPortal: base => ({ ...base, zIndex: 99999 }),
                        menu: base => ({ ...base, backgroundColor: '#232b3e', border: '1px solid #4b5563', borderRadius: '4px' }),
                        option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#374151' : state.isFocused ? '#1f2937' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                        singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                        input: base => ({ ...base, color: '#fff' })
                     }}
                     menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
               </div>

               {/* Comment Textarea */}
               <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add a comment</label>
                  <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value.slice(0, maxChars))}
                     placeholder="Type comment here..."
                     rows={3}
                     className="w-full bg-[#232b3e] border border-gray-700 rounded p-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 font-medium resize-none"
                  />
                  <span className="text-[10px] text-gray-500 font-semibold self-end">
                     Remaining characters: {remainingChars}
                  </span>
               </div>
            </div>

            <div className="px-5 py-3.5 border-t border-gray-700 bg-[#1b202c] flex justify-end gap-3">
               <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded font-medium text-[12px] uppercase tracking-wider transition-colors shadow-sm"
               >
                  Cancel
               </button>
               <button
                  onClick={handleApprove}
                  disabled={isSubmitting || !selectedPaymentMode}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-[12px] uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center gap-1.5 active:scale-95"
               >
                  {isSubmitting ? (
                     <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Approving...
                     </>
                  ) : (
                     'Approve'
                  )}
               </button>
            </div>

         </div>

         {/* Taxation Details Popup */}
         {showTaxDetails && (
            <div className="fixed inset-0 z-[410] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
               <div className="bg-[#1b202c] border border-gray-700 w-[450px] max-w-full rounded-lg shadow-2xl p-5 relative animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2.5 mb-4">
                     <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" /> Taxation Details
                     </h3>
                     <button onClick={() => setShowTaxDetails(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="flex flex-col gap-3 text-xs">
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">Item Name</span>
                        <span className="text-white font-bold text-right pl-4">{itemRow.item_name || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">Quantity</span>
                        <span className="text-white font-bold">{itemRow.qnty || '0'}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">Unit Price</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.unit_price || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">Amount (Exc. GST)</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.amount_exc_gst || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">GST Rate</span>
                        <span className="text-white font-bold">{itemRow.gst_rate || 0}%</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">GST Amount</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.gst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">SGST Amount</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.sgst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">CGST Amount</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.cgst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                        <span className="text-gray-400 font-medium">IGST Amount</span>
                        <span className="text-white font-bold">₹ {parseFloat(itemRow.igst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-1">
                        <span className="text-gray-300 font-bold uppercase">Amount (Inc. GST)</span>
                        <span className="text-emerald-400 font-black text-sm">₹ {parseFloat(itemRow.amount_inc_gst || 0).toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                     <button
                        onClick={() => setShowTaxDetails(false)}
                        className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-semibold transition-colors"
                     >
                        Close
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
}
