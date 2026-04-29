import { X, Box, Anchor, Download, Calendar, IndianRupee } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';

interface PaymentItemDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onDemandAction: (row: any) => void;
}

export default function PaymentItemDetailsModal({ isOpen, onClose, itemRow, onDemandAction }: PaymentItemDetailsModalProps) {
   useModalEscape(isOpen, onClose, 300);

   if (!isOpen || !itemRow) return null;

   const isConnected = itemRow.demand_id && String(itemRow.demand_id) !== '0' && itemRow.demand_id !== '';
   const canConnect = String(itemRow.demands_available) === '1';

   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[600px] max-w-[95vw] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  Payment Item Details
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 bg-[#161a25] flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
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
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">TDS Amount ({itemRow.tds_option === '-1' ? 'N/A' : `${itemRow.tds_rate}%`})</span>
                        <span className="text-[13px] text-white font-medium flex items-center"><IndianRupee className="w-3.5 h-3.5 text-gray-400 mr-0.5" /> {parseFloat(itemRow.tds_amount || 0).toFixed(2)}</span>
                     </div>
                  </div>

                  {itemRow.has_txn_file === '1' && itemRow.presigned_transaction_file_url && (
                     <div className="mt-2 pt-4 border-t border-gray-700/50 flex justify-end">
                        <a href={itemRow.presigned_transaction_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide bg-blue-500/10 px-4 py-2 rounded border border-blue-500/20">
                           <Download className="w-3.5 h-3.5" /> Download Invoice
                        </a>
                     </div>
                  )}
               </div>

               <div className="h-px w-full bg-gray-700"></div>

               <div className="flex flex-col gap-3">
                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                     <Anchor className="w-3.5 h-3.5" /> Demand Connection
                  </h4>
                  <div className={`bg-[#1b202c] border ${isConnected ? 'border-blue-500/30' : 'border-gray-700/50 border-dashed'} rounded-lg p-5 flex flex-col items-center justify-center text-center gap-3`}>
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
   );
}
