import { X, Box, FileText, Anchor, Printer, Info, Share2, MessageCircle, Send, Mail, MessageSquare, Copy, Check, Loader2 } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useState, useRef, useEffect } from 'react';
import { generatePdfFromElement } from '@/utils/pdfGenerator';
import Select from 'react-select';
import toast from 'react-hot-toast';

interface PurchaseDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   itemRow: any;
   onDemandAction: (row: any) => void;
   isClosed?: boolean;
   voucherNumber?: string;
   onSuccess?: () => void;
}

export default function PurchaseDetailsModal({ isOpen, onClose, itemRow, onDemandAction, isClosed = false, voucherNumber, onSuccess }: PurchaseDetailsModalProps) {
   useModalEscape(isOpen, onClose, 300);
   const itemDetailsRef = useRef<HTMLDivElement>(null);

   const [isShareOpen, setIsShareOpen] = useState(false);
   const [copied, setCopied] = useState(false);

   const [warehouses, setWarehouses] = useState<any[]>([]);
   const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
   const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

   const fetchSystemConfig = async () => {
      setIsConfigLoading(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         const text = await res.text();
         const cleanedText = text.replace(/[\u0000-\u001f]/g, (ch) => {
            if (ch === '\n') return '\\n';
            if (ch === '\r') return '\\r';
            if (ch === '\t') return '\\t';
            return '';
         });
         let arr;
         try { arr = JSON.parse(cleanedText); } catch (e) { arr = {}; }
         const data = Array.isArray(arr) ? arr[0] : arr;

         if (data && String(data.Status) === '1' && Array.isArray(data.warehouse_data)) {
            setWarehouses(data.warehouse_data);

            const histId = itemRow?.warehouse_id;
            const isHistValid = histId && String(histId) !== '0' && String(histId).trim() !== '';

            if (isHistValid) {
               setSelectedWarehouse(String(histId));
            } else {
               const defaultWh = data.warehouse_data.find((w: any) => String(w.default_warehouse).toLowerCase() === 'yes');
               if (defaultWh) {
                  setSelectedWarehouse(String(defaultWh.id));
               } else {
                  setSelectedWarehouse('');
               }
            }
         }
      } catch (err) {
         console.error('Failed to fetch system config:', err);
      } finally {
         setIsConfigLoading(false);
      }
   };

   useEffect(() => {
      if (isOpen && itemRow) {
         fetchSystemConfig();
      }
   }, [isOpen, itemRow]);

   const handleChangeWarehouse = async () => {
      if (!selectedWarehouse) return;
      setIsSubmitting(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('purchase_id', String(itemRow?.purchase_id || ''));
         formData.append('warehouse_id', selectedWarehouse);

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/changeWarehouse`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
         });

         const text = await res.text();
         let arr;
         try { arr = JSON.parse(text); } catch (e) { }
         const data = arr && Array.isArray(arr) ? arr[0] : arr;

         if (data && String(data.Status) === '1') {
            toast.success(data.Message || 'Warehouse updated successfully');
            if (onSuccess) {
               onSuccess();
            }
         } else {
            toast.error(data?.Message || 'Failed to update warehouse');
         }
      } catch (err) {
         console.error('Failed to update warehouse:', err);
         toast.error('An error occurred while changing warehouse');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Double-layered Safety: Early return immediately after hook declarations
   if (!isOpen || !itemRow) return null;

   const getShareText = () => {
      if (!itemRow) return '';
      const gst = parseFloat(itemRow.gst_rate || 0).toFixed(0);
      const cgst = parseFloat(itemRow.cgst_rate || 0).toFixed(0);
      const sgst = parseFloat(itemRow.sgst_rate || 0).toFixed(0);
      const amountInc = parseFloat(itemRow.amount_inc_gst || 0).toFixed(2);
      const unitPrice = parseFloat(itemRow.unit_price || 0).toFixed(2);
      const amountExc = parseFloat(itemRow.amount_exc_gst || 0).toFixed(2);
      const gstAmt = parseFloat(itemRow.gst_amount || 0).toFixed(2);
      const cgstAmt = parseFloat(itemRow.cgst_amount || 0).toFixed(2);
      const sgstAmt = parseFloat(itemRow.sgst_amount || 0).toFixed(2);
      const igstAmt = parseFloat(itemRow.igst_amount || 0).toFixed(2);
      const dateVal = itemRow.purchase_date || (itemRow.created_on ? itemRow.created_on.split(' ')[0] : 'N/A');
      const orderIdVal = voucherNumber || itemRow.voucher_no || itemRow.voucher_number || 'N/A';

      return `--- ORDERED ITEM DETAILS ---
Order ID        : ${orderIdVal}
Item Name       : ${itemRow.item_name || 'N/A'}
Item ID         : ${itemRow.item_id || 'N/A'}
Purchase Date   : ${dateVal}
Quantity        : ${itemRow.qnty || '0'}
Unit Price      : ₹ ${unitPrice}
Total Base      : ₹ ${amountExc}
Total GST (${gst}%)  : ₹ ${gstAmt}
CGST (${cgst}%)     : ₹ ${cgstAmt}
SGST (${sgst}%)     : ₹ ${sgstAmt}
IGST (${gst}%)     : ₹ ${igstAmt}
------------------------------
Total Amount    : ₹ ${amountInc} (Inclusive of GST)
------------------------------`;
   };

   const handleCopy = () => {
      const text = getShareText();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleShareClick = () => {
      const text = getShareText();
      navigator.clipboard.writeText(text);
      setIsShareOpen(!isShareOpen);
   };

   const shareViaWhatsApp = () => {
      const text = getShareText();
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   const shareViaTelegram = () => {
      const text = getShareText();
      window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   const shareViaGmail = () => {
      const text = getShareText();
      window.open(`mailto:?subject=${encodeURIComponent(`Purchase Details: ${itemRow?.item_name || 'N/A'}`)}&body=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   const shareViaSMS = () => {
      const text = getShareText();
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   // Evaluate Demand connection status
   const demandInfo = itemRow?.connected_demand_info;
   const isConnected = demandInfo && Object.keys(demandInfo).length > 0 && demandInfo.demand_id;

   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[1100px] max-w-[95vw] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
               <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  Purchased Item Details
               </h2>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 bg-[#161a25] overflow-y-auto max-h-[82vh]">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Basic Pricing & Info (Span 7) */}
                  <div ref={itemDetailsRef} className="lg:col-span-7 bg-[#1b202c] p-5 rounded-lg border border-gray-700 flex flex-col gap-3">
                     <div className="flex items-start justify-between">
                        <div>
                           <h3 className="text-white font-bold text-[15px]">{itemRow?.item_name || 'N/A'}</h3>
                           <span className="text-[11px] text-gray-400 font-medium tracking-wide">ID: {itemRow?.item_id || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                           <div className="text-emerald-400 font-bold text-[15px]">₹ {parseFloat(itemRow?.amount_inc_gst || 0).toFixed(2)}</div>
                           <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Inclusive of GST</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-700/50 pt-3">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Quantity</span>
                           <span className="text-[13px] text-white font-medium">{itemRow?.qnty || '0'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Unit Price</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.unit_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total Base</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.amount_exc_gst || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total GST ({itemRow?.gst_rate || 0}%)</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.gst_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">CGST ({itemRow?.cgst_rate || 0}%)</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.cgst_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">SGST ({itemRow?.sgst_rate || 0}%)</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.sgst_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">IGST ({itemRow?.gst_rate || 0}%)</span>
                           <span className="text-[13px] text-white font-medium">₹ {parseFloat(itemRow?.igst_amount || 0).toFixed(2)}</span>
                        </div>

                        {itemRow?.utility_tag_name && (
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Utility Tag</span>
                              <span className="text-[13px] text-blue-400 font-bold">{itemRow.utility_tag_name}</span>
                           </div>
                        )}

                        {String(itemRow?.demand_diff) === '1' && (
                           <div className="col-span-2 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex flex-col gap-1.5">
                              <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                 <Info className="w-3.5 h-3.5" /> Purchase Information
                              </h4>
                              <div className="flex flex-col gap-1 mt-0.5">
                                 <div className="text-[12px] text-gray-300">
                                    <span className="font-semibold text-gray-400">Difference in Qnty. :</span> {itemRow?.diff_qnty}
                                 </div>
                                 <div className="text-[12px] text-gray-300">
                                    <span className="font-semibold text-gray-400">Message :</span> {itemRow?.diff_qnty_msg}
                                 </div>
                              </div>
                           </div>
                        )}

                        <div className="col-span-2 flex justify-end gap-2.5 mt-2 pt-2 border-t border-gray-700/50" data-html2canvas-ignore="true">

                           {/* Share Popover Wrapper */}
                           <div className="relative">
                              <button
                                 onClick={handleShareClick}
                                 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wide bg-[#232b3e] hover:bg-[#293653] px-3 py-1.5 rounded border border-gray-600 shadow-sm"
                                 title="Share Details"
                              >
                                 <Share2 className="w-3.5 h-3.5" /> Share
                              </button>

                              {isShareOpen && (
                                 <>
                                    {/* Transparent Backdrop to capture close events */}
                                    <div
                                       className="fixed inset-0 z-40 cursor-default"
                                       onClick={() => setIsShareOpen(false)}
                                    />

                                    {/* Dropdown Menu popover */}
                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col">
                                       <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700/50 pb-1.5 mb-1 select-none">
                                          Share Details Via
                                       </div>

                                       <button
                                          onClick={shareViaWhatsApp}
                                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:text-emerald-400 hover:bg-white/5 transition-colors text-left font-medium w-full"
                                       >
                                          <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                          WhatsApp
                                       </button>

                                       <button
                                          onClick={shareViaTelegram}
                                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:text-blue-400 hover:bg-white/5 transition-colors text-left font-medium w-full"
                                       >
                                          <Send className="w-4 h-4 text-blue-400 shrink-0" />
                                          Telegram
                                       </button>

                                       <button
                                          onClick={shareViaGmail}
                                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors text-left font-medium w-full"
                                       >
                                          <Mail className="w-4 h-4 text-red-400 shrink-0" />
                                          Gmail
                                       </button>

                                       <button
                                          onClick={shareViaSMS}
                                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:text-orange-400 hover:bg-white/5 transition-colors text-left font-medium w-full"
                                       >
                                          <MessageSquare className="w-4 h-4 text-orange-400 shrink-0" />
                                          Text Message
                                       </button>

                                       <div className="h-px bg-gray-700/50 my-1" />

                                       <button
                                          onClick={handleCopy}
                                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left font-medium w-full"
                                       >
                                          {copied ? (
                                             <>
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
                                                <span className="text-emerald-500 font-bold">Copied!</span>
                                             </>
                                          ) : (
                                             <>
                                                <Copy className="w-4 h-4 text-gray-400 shrink-0" />
                                                Copy as Text
                                             </>
                                          )}
                                       </button>
                                    </div>
                                 </>
                              )}
                           </div>

                           <button
                              onClick={() => generatePdfFromElement(itemDetailsRef.current, `Purchase of ${itemRow?.item_name || 'Item'}.pdf`)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wide bg-[#232b3e] hover:bg-[#293653] px-3 py-1.5 rounded border border-gray-600 shadow-sm"
                              title="Download as PDF"
                           >
                              <Printer className="w-3.5 h-3.5" /> Print to PDF
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Warehouse Setup & Demand Links (Span 5) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">

                     {/* Warehouse Configuration Block */}
                     <div className="flex flex-col gap-3 relative bg-[#1b202c] p-5 rounded-lg border border-gray-700">
                        <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                           <Box className="w-3.5 h-3.5 text-emerald-400" />
                           Warehouse Configuration
                        </h4>

                        {isConfigLoading ? (
                           <div className="flex items-center justify-center py-4 text-gray-400 text-[12px] gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              <span>Loading warehouse config...</span>
                           </div>
                        ) : (
                           <div className="flex flex-col gap-3.5 mt-1">
                              {itemRow?.warehouse_name && (
                                 <div className="text-[11px] text-gray-400 font-medium">
                                    Currently stored at: <span className="text-emerald-400 font-bold">{itemRow.warehouse_name}</span> 
                                 </div>
                              )}
                              <div className="flex flex-col gap-3">
                                 <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Select Warehouse</label>
                                    <Select
                                       options={[
                                          { value: '', label: 'Select Warehouse' },
                                          ...(warehouses?.map((w: any) => ({
                                             value: String(w.id),
                                             label: w.warehouse_name || ''
                                          })) || [])
                                       ]}
                                       value={
                                          selectedWarehouse
                                             ? { value: selectedWarehouse, label: warehouses?.find((w: any) => String(w.id) === selectedWarehouse)?.warehouse_name || 'Selected Warehouse' }
                                             : { value: '', label: 'Select Warehouse' }
                                       }
                                       onChange={(val: any) => {
                                          setSelectedWarehouse(val ? val.value : '');
                                       }}
                                       placeholder="Select Warehouse..."
                                       isDisabled={isClosed}
                                       styles={{
                                          control: (base) => ({ ...base, backgroundColor: '#232b3e', borderColor: '#374151', minHeight: '36px', borderRadius: '4px', color: '#fff', fontSize: '13px' }),
                                          menuPortal: base => ({ ...base, zIndex: 99999 }),
                                          menu: base => ({ ...base, backgroundColor: '#232b3e', border: '1px solid #4b5563', borderRadius: '4px' }),
                                          option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#1f2937' : 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer' }),
                                          singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                                          input: base => ({ ...base, color: '#fff' })
                                       }}
                                       menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                 </div>
                                 <button
                                    onClick={handleChangeWarehouse}
                                    disabled={!selectedWarehouse || isSubmitting || isClosed}
                                    className={`w-full h-[36px] flex items-center justify-center font-bold text-[12px] uppercase tracking-wider rounded border border-blue-600 transition-all duration-200 shadow-sm whitespace-nowrap ${(!selectedWarehouse || isSubmitting || isClosed)
                                       ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'
                                       : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                                       }`}
                                 >
                                    {isSubmitting ? (
                                       <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                          Updating...
                                       </>
                                    ) : (
                                       'Change Warehouse'
                                    )}
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Connected Demand Info */}
                     <div className="flex flex-col gap-3 bg-[#1b202c] p-5 rounded-lg border border-gray-700">
                        <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-gray-700/50">
                           <Anchor className="w-3.5 h-3.5 text-blue-400" /> Demand Connection {isConnected ? `: Connected to: #D-${demandInfo?.demand_id}` : ''}
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
                           <div className="flex flex-col gap-4 relative overflow-hidden">
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                 <div className="col-span-2 flex flex-col gap-0.5 pb-1">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Demand Title</span>
                                    <span className="text-[13px] text-white font-medium italic line-clamp-2">{demandInfo?.auto_title || 'N/A'}</span>
                                 </div>

                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Demand No</span>
                                    <span className="text-[13px] text-white font-bold">{demandInfo?.demand_no || 'N/A'}</span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Priority</span>
                                    <span className="text-[13px] text-blue-400 font-bold">{demandInfo?.priority_txt || 'Normal'}</span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Delivery Confirmed</span>
                                    <span className={`text-[13px] font-bold ${demandInfo?.delivery_confirmed === 'Yes' ? 'text-emerald-400' : 'text-gray-300'}`}>
                                       {demandInfo?.delivery_confirmed || 'No'}
                                    </span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Fulfillment</span>
                                    <span className={`text-[13px] font-bold ${demandInfo?.is_fulfilled === 'Yes' ? 'text-emerald-400' : 'text-gray-300'}`}>
                                       {demandInfo?.is_fulfilled || 'No'}
                                    </span>
                                 </div>

                                 <div className="col-span-2 flex flex-col gap-0.5 mt-1 border-t border-gray-700/50 pt-2">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</span>
                                    <span className="text-[12px] text-gray-300">{demandInfo?.procurement_txt || 'N/A'}</span>
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

         </div>
      </div>
   );
}
