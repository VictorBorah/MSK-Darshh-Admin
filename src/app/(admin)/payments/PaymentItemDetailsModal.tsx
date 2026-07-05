import { X, Box, Anchor, Download, Calendar, IndianRupee, Loader2 } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useAuth } from '@/components/providers/AuthProvider';
import ApprovePayment from './ApprovePayment';
import WarningAlertModal from '@/components/WarningAlertModal';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface PaymentItemDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onDemandAction: (row: any) => void;
   onSuccess?: () => void;
}

export default function PaymentItemDetailsModal({ isOpen, onClose, itemRow, onDemandAction, onSuccess }: PaymentItemDetailsModalProps) {
   useModalEscape(isOpen, onClose, 300);
   const { menu } = useAuth();
   const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
   const [isDisbursing, setIsDisbursing] = useState(false);
   const [isWarningAlertOpen, setIsWarningAlertOpen] = useState(false);

   if (!isOpen || !itemRow) return null;

   const isConnected = itemRow.demand_id && String(itemRow.demand_id) !== '0' && itemRow.demand_id !== '';
   const canConnect = String(itemRow.demands_available) === '1';

   const isApprovedVal = itemRow.is_approved === 'Yes' || itemRow.is_approved === '1' || itemRow.is_approved === 1;
   const isFulfilledVal = itemRow.is_fulfilled === 'Yes' || itemRow.is_fulfilled === '1' || itemRow.is_fulfilled === 1;

   const paymentsMenuItem = (menu as any[] || []).find((item: any) => item.slug === 'payments' || String(item.master_menu_id) === '5');
   const privileges = paymentsMenuItem?.privileges_array?.[0] || {};
   const canVerify = privileges.verify_payments === 1 || privileges.verify_payments === '1' || privileges.verify_payments === 'Yes';
   const canComplete = privileges.complete_payments === 1 || privileges.complete_payments === '1' || privileges.complete_payments === 'Yes';

   const showApproveBtn = !!canVerify;
   const showDisburseBtn = !!(canVerify && canComplete);

   const handleDisburse = async () => {
      if (isDisbursing || isFulfilledVal || !isApprovedVal) return;

      setIsDisbursing(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('payment_details_id', String(itemRow.payment_details_id || ''));

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/disbursePayment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
         });

         if (!res.ok) {
            throw new Error('Failed to submit disburse payment request');
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
            toast.success(data.Message || 'Payment marked disbursed');
            setIsWarningAlertOpen(false);
            onClose();
            onSuccess?.();
         } else {
            toast.error(data?.Message || 'Failed to disburse payment');
         }
      } catch (err: any) {
         console.error('Disbursement error:', err);
         toast.error(err.message || 'An error occurred during disbursement');
      } finally {
         setIsDisbursing(false);
      }
   };

   let statusText = 'UN-PAID';
   let statusColorClass = 'text-red-400';

   if (isApprovedVal) {
      if (isFulfilledVal) {
         statusText = 'PAID';
         statusColorClass = 'text-green-400';
      } else {
         statusText = 'APPROVED';
         statusColorClass = 'text-green-400';
      }
   }

   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[950px] max-w-[95vw] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  Payment Item Details
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 bg-[#161a25] grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[85vh]">
               {/* Left Column: Item Details + Approval Information */}
               <div className="flex flex-col gap-6">
                  {/* Prettified Content */}
                  <div className="bg-[#1b202c] p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
                     <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 pr-4">
                           <h3 className="text-white font-bold text-[15px]">{itemRow.item_name || 'N/A'}</h3>
                           <p className="text-gray-400 text-[12px] italic">{itemRow.purchase_title}</p>
                        </div>
                        <div className="text-right shrink-0">
                           <div className="text-emerald-400 font-bold text-[16px] flex items-center justify-end">
                              <IndianRupee className="w-4 h-4 mr-0.5 stroke-[2.5]" />{parseFloat(itemRow.gross_amount || 0).toFixed(2)}
                           </div>
                           <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Gross Amount</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-2 border-t border-gray-700/50 pt-4">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Payment Date</span>
                           <span className="text-[13px] text-white font-medium flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" /> {itemRow.payment_date || 'N/A'}
                           </span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Budget Head</span>
                           <span className="text-[13px] text-white font-medium break-words">{itemRow.budget_head_name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Quantity</span>
                           <span className="text-[13px] text-white font-medium">{itemRow.qnty || '0'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Mode</span>
                           <span className="text-[13px] text-white font-medium">{itemRow.payment_mode_txt || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Base Amount</span>
                           <span className="text-[13px] text-white font-medium flex items-center"><IndianRupee className="w-3.5 h-3.5 text-gray-400 mr-0.5" /> {parseFloat(itemRow.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">TDS Amount ({(!itemRow.tds_rate || String(itemRow.tds_rate).trim() === '' || String(itemRow.tds_rate).trim() === '0' || parseFloat(itemRow.tds_rate) === 0) ? '-' : (itemRow.tds_option === '-1' ? 'N/A' : `${itemRow.tds_rate}%`)})</span>
                           <span className="text-[13px] text-white font-medium flex items-center"><IndianRupee className="w-3.5 h-3.5 text-gray-400 mr-0.5" /> {parseFloat(itemRow.tds_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Voucher No</span>
                           <span className="text-[13px] text-white font-medium break-words">{itemRow.voucher_number || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Status</span>
                           <span className={`text-[13px] font-bold uppercase tracking-wider ${statusColorClass}`}>{statusText}</span>
                        </div>
                        {itemRow.worker_name && (
                           <div className="flex flex-col gap-1 col-span-2 border-t border-gray-700/50 pt-3 mt-1">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Paid to Staff</span>
                              <span className="text-[13px] text-white font-medium break-words">{itemRow.worker_name} (ID: {itemRow.worker_id})</span>
                           </div>
                        )}
                     </div>

                     {itemRow.has_txn_file === '1' && itemRow.presigned_transaction_file_url && (
                        <div className="mt-2 pt-4 border-t border-gray-700/50 flex justify-end">
                           <a href={itemRow.presigned_transaction_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide bg-blue-500/10 px-4 py-2 rounded border border-blue-500/20">
                              <Download className="w-3.5 h-3.5" /> Download Invoice
                           </a>
                        </div>
                     )}
                  </div>

                  <div className="h-px w-full bg-gray-700/50"></div>

                  {/* Approval Information Section */}
                  <div className="flex flex-col gap-3">
                     <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        Approval Information
                     </h4>

                     {/* Status Message */}
                     {!isApprovedVal ? (
                        <div className="text-[12px] font-bold text-red-400 text-center uppercase tracking-wider bg-red-950/20 border border-red-500/20 py-2.5 px-4 rounded-lg select-none">
                           Pending Approval / Not Approved
                        </div>
                     ) : !isFulfilledVal ? (
                        <div className="text-[12px] font-bold text-emerald-400 text-center uppercase tracking-wider bg-emerald-950/20 border border-emerald-500/20 py-2.5 px-4 rounded-lg select-none">
                           APPROVED
                        </div>
                     ) : (
                        <div className="text-[12px] font-bold text-blue-400 text-center uppercase tracking-wider bg-blue-950/20 border border-blue-500/20 py-2.5 px-4 rounded-lg select-none">
                           DISBURSED
                        </div>
                     )}

                     {/* Approver Details */}
                     {isApprovedVal && (
                        <div className="grid grid-cols-2 gap-4 bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-lg">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Approved By</span>
                              <span className="text-[13px] text-emerald-100 font-semibold">{itemRow.approved_by_name || 'N/A'}</span>
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">User Group</span>
                              <span className="text-[13px] text-emerald-100 font-semibold">{itemRow.approved_by_usergroup_name || 'N/A'}</span>
                           </div>
                        </div>
                     )}

                     {/* Comment Display */}
                     <div className="flex flex-col gap-1.5 bg-[#1b202c] border border-gray-700/50 p-4 rounded-lg">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Comment</span>
                        {itemRow.comment && String(itemRow.comment).trim() !== '' ? (
                           <span className="text-[13px] text-gray-300 italic">"{itemRow.comment}"</span>
                        ) : (
                           <span className="text-[12px] text-gray-600 italic">No comment recorded for this payment.</span>
                        )}
                     </div>

                     {/* Action Buttons */}
                     {(showApproveBtn || showDisburseBtn) && (
                        <div className="flex items-center justify-center gap-3 mt-1.5">
                           {showApproveBtn && (
                              <button
                                 disabled={isApprovedVal}
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setIsApproveModalOpen(true);
                                 }}
                                 className={`px-6 py-2 rounded font-bold text-[12px] uppercase tracking-wide transition-all duration-200 select-none ${
                                    isApprovedVal
                                       ? 'bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-50'
                                       : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-500/20 active:scale-95'
                                 }`}
                              >
                                 Approve
                              </button>
                           )}
                           {showDisburseBtn && (
                              <button
                                 disabled={isFulfilledVal || !isApprovedVal || isDisbursing}
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setIsWarningAlertOpen(true);
                                 }}
                                 className={`px-6 py-2 rounded font-bold text-[12px] uppercase tracking-wide transition-all duration-200 select-none flex items-center gap-1.5 ${
                                    (isFulfilledVal || !isApprovedVal || isDisbursing)
                                       ? 'bg-gray-700/50 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-50'
                                       : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20 active:scale-95'
                                 }`}
                              >
                                 {isDisbursing ? (
                                    <>
                                       <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                    </>
                                 ) : (
                                    'Disburse'
                                 )}
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               </div>

               {/* Right Column: Demand Connection */}
               <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3 h-full">
                     <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5" /> Demand Connection
                     </h4>
                     <div className={`bg-[#1b202c] border ${isConnected ? 'border-blue-500/30' : 'border-gray-700/50 border-dashed'} rounded-lg p-5 flex flex-col items-center justify-center text-center gap-3 flex-1 min-h-[200px]`}>
                        {isConnected ? (
                           <>
                              <span className="text-[13px] text-white font-bold">
                                 Connected to: <span className="text-blue-400 block mt-1">{itemRow.connected_to_demand || `Demand #${itemRow.demand_id}`}</span>
                              </span>
                           </>
                        ) : (
                           <span className="text-[13px] text-gray-500 font-medium italic">
                              This payment item is not connected to any demand.
                           </span>
                        )}

                        <button
                           disabled={!canConnect}
                           onClick={(e) => {
                              e.preventDefault();
                              onDemandAction(itemRow);
                           }}
                           className={`text-[11px] px-4 py-2 rounded font-bold uppercase tracking-wide transition-colors ${!canConnect ? 'text-gray-500 bg-gray-800 cursor-not-allowed opacity-50' : 'text-white bg-blue-600 hover:bg-blue-500 shadow-sm'}`}
                        >
                           Update Payment Connection
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <ApprovePayment
            isOpen={isApproveModalOpen}
            onClose={() => setIsApproveModalOpen(false)}
            itemRow={itemRow}
            onApproveSuccess={() => {
               setIsApproveModalOpen(false);
               onClose();
               onSuccess?.();
            }}
         />
         <WarningAlertModal
            isOpen={isWarningAlertOpen}
            onClose={() => setIsWarningAlertOpen(false)}
            title="Confirm Disbursement"
            content="Do you want to mark this payment as disbursed? This action is not reversible"
            onConfirm={handleDisburse}
            isLoading={isDisbursing}
         />
      </div>
   );
}
