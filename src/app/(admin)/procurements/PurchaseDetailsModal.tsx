import { X, Box, FileText, Anchor, Printer, Info } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useRef } from 'react';
import { generatePdfFromElement } from '@/utils/pdfGenerator';

interface PurchaseDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onDemandAction: (row: any) => void;
   isClosed?: boolean;
}

export default function PurchaseDetailsModal({ isOpen, onClose, itemRow, onDemandAction, isClosed = false }: PurchaseDetailsModalProps) {
   useModalEscape(isOpen, onClose, 300);
   const itemDetailsRef = useRef<HTMLDivElement>(null);

   if (!isOpen || !itemRow) return null;

   // Evaluate Demand connection status
   const demandInfo = itemRow.connected_demand_info;
   const isConnected = demandInfo && Object.keys(demandInfo).length > 0 && demandInfo.demand_id;

   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[600px] max-w-[95vw] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  Purchased Item Details
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 bg-[#161a25] flex flex-col gap-6 overflow-y-auto max-h-[75vh]">

               {/* Basic Info */}
               <div ref={itemDetailsRef} className="bg-[#1b202c] p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                     <div>
                        <h3 className="text-white font-bold text-[15px]">{itemRow.item_name || 'N/A'}</h3>
                        <span className="text-[11px] text-gray-400 font-medium tracking-wide">ID: {itemRow.item_id || 'N/A'}</span>
                     </div>
                     <div className="text-right">
                        <div className="text-emerald-400 font-bold text-[15px]">₹ {parseFloat(itemRow.amount_inc_gst || 0).toFixed(2)}</div>
                        <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Inclusive of GST</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-700/50 pt-3">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Quantity</span>
                        <span className="text-[13px] text-white font-medium">{itemRow.qnty || '0'}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Unit Price</span>
                        <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow.unit_price || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total Base</span>
                        <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow.amount_exc_gst || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total GST ({itemRow.gst_rate || 0}%)</span>
                        <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow.gst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">CGST ({itemRow.cgst_rate || 0}%)</span>
                        <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow.cgst_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">SGST ({itemRow.sgst_rate || 0}%)</span>
                        <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow.sgst_amount || 0).toFixed(2)}</span>
                     </div>

                     {String(itemRow.demand_diff) === '1' && (
                        <div className="col-span-2 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex flex-col gap-1.5">
                           <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> Purchase Information
                           </h4>
                           <div className="flex flex-col gap-1 mt-0.5">
                              <div className="text-[12px] text-gray-300">
                                 <span className="font-semibold text-gray-400">Difference in Qnty. :</span> {itemRow.diff_qnty}
                              </div>
                              <div className="text-[12px] text-gray-300">
                                 <span className="font-semibold text-gray-400">Message :</span> {itemRow.diff_qnty_msg}
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="col-span-2 flex justify-end mt-2 pt-2 border-t border-gray-700/50" data-html2canvas-ignore="true">
                        <button
                           onClick={() => generatePdfFromElement(itemDetailsRef.current, `Purchase of ${itemRow.item_name}.pdf`)}
                           className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wide bg-[#232b3e] hover:bg-[#293653] px-3 py-1.5 rounded border border-gray-600 shadow-sm"
                           title="Download as PDF"
                        >
                           <Printer className="w-3.5 h-3.5" /> Print to PDF
                        </button>
                     </div>
                  </div>
               </div>

               <div className="h-px w-full bg-gray-700"></div>

               {/* Connected Demand Info */}
               <div className="flex flex-col gap-3">
                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                     <Anchor className="w-3.5 h-3.5" /> Demand Connection {isConnected ? `: Connected to: #D-${demandInfo.demand_id}` : ''}
                  </h4>

                  {!isConnected ? (
                     <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2">
                        <span className="text-[13px] text-yellow-500/90 font-medium">
                           This item is not connected to any demand.
                        </span>
                        <button
                           onClick={(e) => {
                              e.preventDefault();
                              onDemandAction(itemRow);
                           }}
                           disabled={isClosed}
                           className={`text-[12px] font-bold uppercase tracking-wide mt-1 transition-colors ${isClosed ? 'text-gray-500 cursor-not-allowed opacity-50' : 'text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 underline-offset-4'}`}
                        >
                           Link to a Demand
                        </button>
                     </div>
                  ) : (
                     <div className="bg-[#1b202c] border border-blue-500/30 rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden">
                        {/* Accent left border */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50"></div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pl-2">
                           <div className="col-span-2 flex flex-col gap-0.5 pb-1">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Demand Title</span>
                              <span className="text-[13px] text-white font-medium italic line-clamp-2">{demandInfo.auto_title || 'N/A'}</span>
                           </div>

                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Demand No</span>
                              <span className="text-[13px] text-white font-bold">{demandInfo.demand_no || 'N/A'}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Priority</span>
                              <span className="text-[13px] text-blue-400 font-bold">{demandInfo.priority_txt || 'Normal'}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Delivery Confirmed</span>
                              <span className={`text-[13px] font-bold ${demandInfo.delivery_confirmed === 'Yes' ? 'text-emerald-400' : 'text-gray-300'}`}>
                                 {demandInfo.delivery_confirmed || 'No'}
                              </span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Fulfillment</span>
                              <span className={`text-[13px] font-bold ${demandInfo.is_fulfilled === 'Yes' ? 'text-emerald-400' : 'text-gray-300'}`}>
                                 {demandInfo.is_fulfilled || 'No'}
                              </span>
                           </div>

                           <div className="col-span-2 flex flex-col gap-0.5 mt-1 border-t border-gray-700/50 pt-2">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</span>
                              <span className="text-[12px] text-gray-300">{demandInfo.procurement_txt || 'N/A'}</span>
                           </div>
                        </div>

                        <div className="mt-1 flex justify-end">
                           <button
                              onClick={(e) => {
                                 e.preventDefault();
                                 onDemandAction(itemRow);
                              }}
                              disabled={isClosed}
                              className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded transition-colors ${isClosed ? 'text-gray-500 bg-gray-800 cursor-not-allowed opacity-50' : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'}`}
                           >
                              Update Demand Connection
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>

         </div>
      </div>
   );
}
