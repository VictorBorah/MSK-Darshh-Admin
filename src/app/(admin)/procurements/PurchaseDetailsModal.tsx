import { X, Box, FileText, Anchor, Printer, Info, Share2, MessageCircle, Send, Mail, MessageSquare, Copy, Check, Loader2, AlertTriangle, Maximize2, Minimize2, Pencil, Trash2 } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useState, useRef, useEffect } from 'react';
import { generatePdfFromElement } from '@/utils/pdfGenerator';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import ApprovePurchase from './ApprovePurchase';
import FinalizeInvoiceModal from './FinalizeInvoiceModal';

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
   const { menu } = useAuth();

   const [isShareOpen, setIsShareOpen] = useState(false);
   const [copied, setCopied] = useState(false);

   const [warehouses, setWarehouses] = useState<any[]>([]);
   const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
   const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
   const [showFinalizeInvoiceModal, setShowFinalizeInvoiceModal] = useState<boolean>(false);
   const [isFinalizing, setIsFinalizing] = useState(false);
   const [isMaximized, setIsMaximized] = useState(false);
   const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
   const [expenseEditName, setExpenseEditName] = useState('');
   const [expenseEditRate, setExpenseEditRate] = useState('');
   const [expenseEditQty, setExpenseEditQty] = useState('');

   // Local editable states and calculated data
   const [localItemData, setLocalItemData] = useState<any>(itemRow);
   const [isEditingQty, setIsEditingQty] = useState(false);
   const [isEditingPrice, setIsEditingPrice] = useState(false);
   const [editQty, setEditQty] = useState(String(itemRow?.qnty || ''));
   const [editPrice, setEditPrice] = useState(String(itemRow?.unit_price || ''));

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

            const histId = localItemData?.warehouse_id || itemRow?.warehouse_id;
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

   useEffect(() => {
      if (itemRow) {
         setLocalItemData(itemRow);
         setEditQty(String(itemRow.qnty || ''));
         setEditPrice(String(itemRow.unit_price || ''));
         setIsEditingQty(false);
         setIsEditingPrice(false);
      }
   }, [itemRow]);

   const handleTaxationFetch = async (newQty: string, newPrice: string) => {
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const params = new URLSearchParams({
            vendor_id: String(localItemData?.vendor_id || ''),
            item_id: String(localItemData?.item_id || ''),
            qnty: String(newQty),
            tax_inc: String(localItemData?.gst_inclusive || ''),
            unit_price: String(newPrice),
            gst_rate: String(localItemData?.gst_rate || '')
         });

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemTaxation?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });

         const text = await res.text();
         let arr;
         try { arr = JSON.parse(text); } catch (e) { }
         const data = arr && Array.isArray(arr) ? arr[0] : arr;

         if (data && String(data.Status) === '1') {
            setLocalItemData((prev: any) => ({
               ...prev,
               qnty: data.qnty,
               unit_price: data.unit_price,
               gst_rate: data.gst_rate ? parseFloat(data.gst_rate).toString() : prev.gst_rate,
               sgst_rate: data.sgst_rate || prev.sgst_rate,
               cgst_rate: data.cgst_rate || prev.cgst_rate,
               sgst_amount: data.sgst_amount,
               cgst_amount: data.cgst_amount,
               igst_amount: data.igst_amount,
               amount_exc_gst: data.base_price,
               gst_amount: data.gst_amount,
               amount_inc_gst: data.final_amount
            }));
            toast.success(data.Message || 'Taxation details updated');
         } else {
            toast.error(data?.Message || 'Failed to fetch taxation details');
            setEditQty(String(localItemData?.qnty || ''));
            setEditPrice(String(localItemData?.unit_price || ''));
         }
      } catch (err) {
         console.error('Failed to fetch taxation details:', err);
         toast.error('An error occurred while fetching taxation details');
         setEditQty(String(localItemData?.qnty || ''));
         setEditPrice(String(localItemData?.unit_price || ''));
      }
   };

   const handleModalClick = () => {
      if (isEditingQty || isEditingPrice) {
         const qtyChanged = parseFloat(editQty) !== parseFloat(localItemData?.qnty || 0);
         const priceChanged = parseFloat(editPrice) !== parseFloat(localItemData?.unit_price || 0);

         if (qtyChanged || priceChanged) {
            const parsedQty = parseFloat(editQty);
            const parsedPrice = parseFloat(editPrice);

            if (isNaN(parsedQty) || parsedQty <= 0) {
               toast.error('Please enter a valid quantity');
               setEditQty(String(localItemData?.qnty || ''));
               setEditPrice(String(localItemData?.unit_price || ''));
            } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
               toast.error('Please enter a valid unit price');
               setEditQty(String(localItemData?.qnty || ''));
               setEditPrice(String(localItemData?.unit_price || ''));
            } else {
               handleTaxationFetch(editQty, editPrice);
            }
         }
         setIsEditingQty(false);
         setIsEditingPrice(false);
      }
   };

   const handleChangeWarehouse = async () => {
      if (!selectedWarehouse) return;
      setIsSubmitting(true);
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('purchase_id', String(localItemData?.purchase_id || ''));
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

   const handleFinalizePurchase = async (invoiceData: {
      has_tax_invoice: string;
      tax_invoice_file_name?: string;
      tax_invoice_no?: string;
      payment_mode?: string;
   }) => {
      setIsFinalizing(true);
      const toastId = toast.loading('Finalizing purchase...');
      try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const formData = new FormData();
         formData.append('purchase_id', String(localItemData?.purchase_id || ''));
         formData.append('qnty', String(localItemData?.qnty || ''));
         formData.append('unit_price', String(localItemData?.unit_price || ''));
         formData.append('gst_rate', String(localItemData?.gst_rate || ''));
         formData.append('has_tax_invoice', invoiceData.has_tax_invoice);
         if (invoiceData.tax_invoice_file_name) {
            formData.append('tax_invoice_file_name', invoiceData.tax_invoice_file_name);
         }
         if (invoiceData.tax_invoice_no) {
            formData.append('tax_invoice_no', invoiceData.tax_invoice_no);
         }
         if (invoiceData.payment_mode) {
            formData.append('payment_mode', invoiceData.payment_mode);
         }

         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/closePurchase`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
         });

         if (!res.ok) {
            throw new Error('Network response was not ok');
         }

         const text = await res.text();
         let arr;
         try { arr = JSON.parse(text); } catch (e) { }
         const data = arr && Array.isArray(arr) ? arr[0] : arr;

         if (data && (String(data.Status) === '1' || data.Status === 1)) {
            toast.success(data.Message || 'Purchase Closed successfully', { id: toastId });
            setShowFinalizeInvoiceModal(false);
            onClose();
            if (onSuccess) {
               onSuccess();
            }
         } else {
            toast.error(data?.Message || 'Failed to close purchase', { id: toastId });
         }
      } catch (err: any) {
         console.error('Failed to close purchase:', err);
         toast.error(err.message || 'An error occurred while closing purchase', { id: toastId });
      } finally {
         setIsFinalizing(false);
      }
   };

   const handleStartEditExpense = (expense: any) => {
      setEditingExpenseId(String(expense.expense_id));
      setExpenseEditName(expense.item_name || '');
      setExpenseEditRate(String(expense.unit_price || ''));
      setExpenseEditQty(String(expense.qnty || ''));
   };

   const handleSaveExpense = (expenseId: string) => {
      const rateVal = parseFloat(expenseEditRate);
      const qtyVal = parseFloat(expenseEditQty);

      if (isNaN(rateVal) || rateVal < 0 || expenseEditRate === '') {
         toast.error('Invalid unit price');
         return;
      }
      if (isNaN(qtyVal) || qtyVal < 0 || expenseEditQty === '') {
         toast.error('Invalid quantity');
         return;
      }

      setLocalItemData((prev: any) => {
         if (!prev) return prev;
         const updatedExpenses = (prev.additional_expenses || []).map((exp: any) => {
            if (String(exp.expense_id) === String(expenseId)) {
               return {
                  ...exp,
                  item_name: expenseEditName,
                  unit_price: rateVal.toFixed(2),
                  qnty: qtyVal.toString(),
                  total_amount: (rateVal * qtyVal).toFixed(2)
               };
            }
            return exp;
         });
         return {
            ...prev,
            additional_expenses: updatedExpenses
         };
      });
      setEditingExpenseId(null);
   };

   const handleRemoveExpense = (expenseId: string) => {
      setLocalItemData((prev: any) => {
         if (!prev) return prev;
         const updatedExpenses = (prev.additional_expenses || []).filter(
            (exp: any) => String(exp.expense_id) !== String(expenseId)
         );
         return {
            ...prev,
            additional_expenses: updatedExpenses
         };
      });
      toast.success('Expense removed locally');
   };

   // Double-layered Safety: Early return immediately after hook declarations
   if (!isOpen || !itemRow) return null;

   const assignedWhName = warehouses?.find((w: any) => String(w.id) === selectedWarehouse)?.warehouse_name || localItemData?.warehouse_name || '';

   const getShareText = () => {
      if (!localItemData) return '';
      const gst = parseFloat(localItemData.gst_rate || 0).toFixed(0);
      const cgst = parseFloat(localItemData.cgst_rate || 0).toFixed(0);
      const sgst = parseFloat(localItemData.sgst_rate || 0).toFixed(0);
      const amountInc = parseFloat(localItemData.amount_inc_gst || 0).toFixed(2);
      const unitPrice = parseFloat(localItemData.unit_price || 0).toFixed(2);
      const amountExc = parseFloat(localItemData.amount_exc_gst || 0).toFixed(2);
      const gstAmt = parseFloat(localItemData.gst_amount || 0).toFixed(2);
      const cgstAmt = parseFloat(localItemData.cgst_amount || 0).toFixed(2);
      const sgstAmt = parseFloat(localItemData.sgst_amount || 0).toFixed(2);
      const igstAmt = parseFloat(localItemData.igst_amount || 0).toFixed(2);
      const dateVal = localItemData.purchase_date || (localItemData.created_on ? localItemData.created_on.split(' ')[0] : 'N/A');
      const orderIdVal = voucherNumber || localItemData.voucher_no || localItemData.voucher_number || 'N/A';

      return `--- ORDERED ITEM DETAILS ---
Order ID        : ${orderIdVal}
Item Name       : ${localItemData.item_name || 'N/A'}
Item ID         : ${localItemData.item_id || 'N/A'}
Purchase Date   : ${dateVal}
Quantity        : ${localItemData.qnty || '0'}
Unit Price      : ₹ ${unitPrice}
Total Base      : ₹ ${amountExc}
Total GST (${gst}%)  : ₹ ${gstAmt}
CGST (${cgst}%)     : ₹ ${cgstAmt}
SGST (${sgst}%)     : ₹ ${sgstAmt}
IGST (${gst}%)     : ₹ ${igstAmt}
Payment Mode    : ${localItemData.payment_mode_txt || 'N/A'}
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
      window.open(`mailto:?subject=${encodeURIComponent(`Purchase Details: ${localItemData?.item_name || 'N/A'}`)}&body=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   const shareViaSMS = () => {
      const text = getShareText();
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
      setIsShareOpen(false);
   };

   // Evaluate Demand connection status
   const demandInfo = localItemData?.connected_demand_info;
   const isConnected = demandInfo && Object.keys(demandInfo).length > 0 && demandInfo.demand_id;

   const isVerified = localItemData?.is_verified === 'Yes' || localItemData?.is_verified === '1';
   const isUnverified = localItemData?.is_verified === 'No' || localItemData?.is_verified === '0';

   const procurementsMenuItem = (menu as any[] || []).find((item: any) => String(item.master_menu_id) === '4');
   const privileges = procurementsMenuItem?.privileges_array?.[0] || {};
   const canApprove = privileges.approve_purchase === '1';
   const canClose = privileges.close_purchase === '1';
   const isClosedPurchase = localItemData?.is_closed !== 'No';

   return (
      <>
         <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
               className={`bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative transition-all duration-300 ${
                  isMaximized ? 'w-full h-full rounded-none' : 'w-[1250px] max-w-[95vw] h-[82vh] max-h-[82vh] rounded-xl'
               }`}
               onClick={handleModalClick}
            >

               <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25] shrink-0">
                  <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                     <Box className="w-5 h-5 text-emerald-400" />
                     Item Details
                  </h2>
                  <div className="flex items-center gap-1.5">
                     <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title={isMaximized ? "Restore Size" : "Maximize"}
                     >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                     </button>
                     <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
               </div>

               <div className="p-6 bg-[#161a25] overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                     {/* Left Column: Basic Pricing & Info (Span 4) */}
                     <div ref={itemDetailsRef} className="lg:col-span-4 bg-[#1b202c] p-5 rounded-lg border border-gray-700 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                           <div>
                              <h3 className="text-white font-bold text-[15px]">{localItemData?.item_name || 'N/A'}</h3>
                              {assignedWhName && assignedWhName !== 'Select Warehouse' && (
                                 <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 rounded text-[11px] font-bold text-blue-400">
                                    <Box className="w-3.5 h-3.5 shrink-0" />
                                    Warehouse: {assignedWhName}
                                 </div>
                              )}
                              <div className="mt-1">
                                 <span className="text-[11px] text-gray-400 font-medium tracking-wide">ID: {localItemData?.item_id || 'N/A'}</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-emerald-400 font-bold text-[15px]">₹ {parseFloat(localItemData?.amount_inc_gst || 0).toFixed(2)}</div>
                              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Inclusive of GST</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-700/50 pt-3">
                           <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                 <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Quantity</span>
                                 {isVerified && canClose && !isEditingQty && (
                                    isClosedPurchase ? (
                                       <span 
                                          title="Purchase Closed" 
                                          className="text-[10px] text-gray-500 cursor-not-allowed underline lowercase font-semibold select-none"
                                       >
                                          edit
                                       </span>
                                    ) : (
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setIsEditingQty(true);
                                          }}
                                          className="text-[10px] text-blue-400 hover:text-blue-300 underline lowercase font-semibold"
                                       >
                                          edit
                                       </button>
                                    )
                                 )}
                              </div>
                              {isEditingQty ? (
                                 <input
                                    type="number"
                                    step="any"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-[#232b3e] border border-gray-600 rounded px-2 py-0.5 text-[13px] text-white font-medium focus:outline-none focus:border-blue-500 w-full"
                                 />
                              ) : (
                                 <span className="text-[13px] text-white font-medium">{localItemData?.qnty || '0'}</span>
                              )}
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                 <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Unit Price</span>
                                 {isVerified && canClose && !isEditingPrice && (
                                    isClosedPurchase ? (
                                       <span 
                                          title="Purchase Closed" 
                                          className="text-[10px] text-gray-500 cursor-not-allowed underline lowercase font-semibold select-none"
                                       >
                                          edit
                                       </span>
                                    ) : (
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setIsEditingPrice(true);
                                          }}
                                          className="text-[10px] text-blue-400 hover:text-blue-300 underline lowercase font-semibold"
                                       >
                                          edit
                                       </button>
                                    )
                                 )}
                              </div>
                              {isEditingPrice ? (
                                 <input
                                    type="number"
                                    step="any"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-[#232b3e] border border-gray-600 rounded px-2 py-0.5 text-[13px] text-white font-medium focus:outline-none focus:border-blue-500 w-full"
                                 />
                              ) : (
                                 <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.unit_price || 0).toFixed(2)}</span>
                              )}
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total Base</span>
                              <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.amount_exc_gst || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total GST ({localItemData?.gst_rate || 0}%)</span>
                              <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.gst_amount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">CGST ({localItemData?.cgst_rate || 0}%)</span>
                              <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.cgst_amount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">SGST ({localItemData?.sgst_rate || 0}%)</span>
                              <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.sgst_amount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">IGST ({localItemData?.gst_rate || 0}%)</span>
                              <span className="text-[13px] text-white font-medium">₹ {parseFloat(localItemData?.igst_amount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Payment Mode</span>
                              <span className="text-[13px] text-emerald-400 font-bold">{localItemData?.payment_mode_txt || 'N/A'}</span>
                           </div>

                           {localItemData?.utility_tag_name && (
                              <div className="flex flex-col gap-0.5">
                                 <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Utility Tag</span>
                                 <span className="text-[13px] text-blue-400 font-bold">{localItemData.utility_tag_name}</span>
                              </div>
                           )}

                           {String(localItemData?.demand_diff) === '1' && (
                              <div className="col-span-2 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex flex-col gap-1.5">
                                 <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5" /> Purchase Information
                                 </h4>
                                 <div className="flex flex-col gap-1 mt-0.5">
                                    <div className="text-[12px] text-gray-300">
                                       <span className="font-semibold text-gray-400">Difference in Qnty. :</span> {localItemData?.diff_qnty}
                                    </div>
                                    <div className="text-[12px] text-gray-300">
                                       <span className="font-semibold text-gray-400">Message :</span> {localItemData?.diff_qnty_msg}
                                    </div>
                                 </div>
                              </div>
                           )}

                           <div className="flex flex-col gap-1.5 col-span-2 border-t border-gray-700/30 pt-2.5 mt-1">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Verification Details</span>
                              {isUnverified ? (
                                 <span className="text-[13px] text-amber-500 font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Unverified
                                 </span>
                              ) : (
                                 <div className="grid grid-cols-2 gap-4 text-[13px] text-white w-full">
                                    <div className="flex flex-col gap-1">
                                       <div className="font-semibold text-emerald-400">Verified</div>
                                       <div>
                                          <span className="text-gray-400 font-medium">Verified By:</span>{' '}
                                          <span className="text-white font-bold">{localItemData?.verified_by_Name || 'N/A'}</span>
                                       </div>
                                       <div className="text-gray-400">
                                          (Role: <span className="text-gray-300 font-medium">{localItemData?.verified_by_usergroup || 'N/A'}</span>)
                                       </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 border-l border-gray-700/50 pl-4">
                                       <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Verification Comment</span>
                                       <span className="text-gray-300 italic whitespace-pre-wrap mt-1">
                                          {localItemData?.comment ? `"${localItemData.comment}"` : 'No comment provided.'}
                                       </span>
                                    </div>
                                 </div>
                              )}
                           </div>

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
                                 onClick={() => generatePdfFromElement(itemDetailsRef.current, `Purchase of ${localItemData?.item_name || 'Item'}.pdf`)}
                                 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wide bg-[#232b3e] hover:bg-[#293653] px-3 py-1.5 rounded border border-gray-600 shadow-sm"
                                 title="Download as PDF"
                              >
                                 <Printer className="w-3.5 h-3.5" /> Print to PDF
                              </button>

                              {isUnverified && canApprove && (
                                 <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-white transition-colors uppercase tracking-wide bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded border border-emerald-600 shadow-sm active:scale-95 transition-all duration-200"
                                 >
                                    Approve
                                 </button>
                              )}

                              {isVerified && canClose && (
                                 <button
                                    onClick={() => setShowFinalizeInvoiceModal(true)}
                                    disabled={isFinalizing || isClosed || isClosedPurchase}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-white transition-colors uppercase tracking-wide bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 rounded border border-blue-600 shadow-sm active:scale-95 transition-all duration-200"
                                 >
                                    {isFinalizing ? 'Finalizing...' : 'Finalize Purchase'}
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Middle Column: Additional Expenses (Span 4) */}
                     <div className="lg:col-span-4 bg-[#1b202c] p-5 rounded-lg border border-gray-700 flex flex-col gap-3 self-stretch">
                        <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-gray-700/50">
                           Additional Expenses
                        </h4>

                        <div className="overflow-x-auto overflow-y-auto max-h-[300px] flex-1">
                           <table className="w-full text-[12px] text-left border-collapse">
                              <thead>
                                 <tr className="text-gray-500 font-bold uppercase border-b border-gray-700/50 text-[10px]">
                                    <th className="py-2 pr-1.5">Item</th>
                                    <th className="py-2 px-1 text-center w-20">Rate</th>
                                    <th className="py-2 px-1 text-center w-14">Qnty</th>
                                    <th className="py-2 px-1.5 text-right w-20">Total</th>
                                    <th className="py-2 w-20 text-center"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/30">
                                 {(localItemData?.additional_expenses || []).map((row: any, idx: number) => {
                                    const isEditing = String(editingExpenseId) === String(row.expense_id);

                                    return (
                                       <tr
                                          key={row.expense_id || idx}
                                          className={`group transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/5'}`}
                                       >
                                          {isEditing ? (
                                             <>
                                                <td className="py-2 pr-1">
                                                   <input
                                                      type="text"
                                                      value={expenseEditName}
                                                      onChange={(e) => setExpenseEditName(e.target.value)}
                                                      className="w-full bg-[#11141e] border border-gray-600 rounded px-1.5 py-0.5 text-white text-[12px] focus:outline-none focus:border-blue-500 font-medium"
                                                   />
                                                </td>
                                                <td className="py-2 px-1">
                                                   <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      value={expenseEditRate}
                                                      onChange={(e) => setExpenseEditRate(e.target.value)}
                                                      className="w-20 bg-[#11141e] border border-gray-600 rounded px-1 py-0.5 text-white text-center text-[12px] focus:outline-none focus:border-blue-500 font-medium"
                                                   />
                                                </td>
                                                <td className="py-2 px-1">
                                                   <input
                                                      type="number"
                                                      min="0"
                                                      step="1"
                                                      value={expenseEditQty}
                                                      onChange={(e) => setExpenseEditQty(e.target.value)}
                                                      className="w-14 bg-[#11141e] border border-gray-600 rounded px-1 py-0.5 text-white text-center text-[12px] focus:outline-none focus:border-blue-500 font-medium"
                                                   />
                                                </td>
                                                <td className="py-3 px-1 text-right text-gray-400 font-semibold">
                                                   {(
                                                      (parseFloat(expenseEditRate) || 0) *
                                                      (parseFloat(expenseEditQty) || 0)
                                                   ).toFixed(2)}
                                                </td>
                                                <td className="py-2 text-center">
                                                   <div className="flex items-center justify-center gap-1">
                                                      <button
                                                         onClick={() => handleSaveExpense(row.expense_id)}
                                                         className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase underline cursor-pointer"
                                                      >
                                                         Save
                                                      </button>
                                                      <button
                                                         onClick={() => setEditingExpenseId(null)}
                                                         className="text-gray-400 hover:text-white font-bold text-[10px] uppercase underline cursor-pointer"
                                                      >
                                                         Esc
                                                      </button>
                                                   </div>
                                                 </td>
                                             </>
                                          ) : (
                                             <>
                                                <td className="py-3 pr-1 text-white font-medium break-words">
                                                   {row.item_name}
                                                </td>
                                                <td className="py-3 px-1 text-center text-gray-300">
                                                   {parseFloat(row.unit_price || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3 px-1 text-center text-gray-300">
                                                   {row.qnty}
                                                 </td>
                                                <td className="py-3 px-1.5 text-right text-gray-400 font-semibold">
                                                   {parseFloat(row.total_amount || 0).toFixed(2)}
                                                </td>
                                                <td className="py-2 text-center">
                                                   <div className="flex items-center justify-center gap-1">
                                                      <button
                                                         onClick={() => !isClosedPurchase && handleStartEditExpense(row)}
                                                         title={isClosedPurchase ? "Purchase Closed" : "Edit Expense"}
                                                         className={`p-1 rounded transition-colors ${
                                                            isClosedPurchase
                                                               ? 'text-gray-600 cursor-not-allowed opacity-50'
                                                               : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                         }`}
                                                      >
                                                         <Pencil className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button
                                                         onClick={() => !isClosedPurchase && handleRemoveExpense(row.expense_id)}
                                                         title={isClosedPurchase ? "Purchase Closed" : "Remove Expense"}
                                                         className={`p-1 rounded transition-colors ${
                                                            isClosedPurchase
                                                               ? 'text-gray-600 cursor-not-allowed opacity-50'
                                                               : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                                         }`}
                                                      >
                                                         <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                   </div>
                                                </td>
                                             </>
                                          )}
                                       </tr>
                                    );
                                 })}
                                 {(localItemData?.additional_expenses || []).length === 0 && (
                                    <tr>
                                       <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                                          No additional expenses added.
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-700 mt-auto select-none">
                           <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                              Total Additional expenses:
                           </span>
                           <span className="text-[14px] text-emerald-400 font-bold">
                              ₹ {
                                 (localItemData?.additional_expenses || []).reduce(
                                    (acc: number, cur: any) => acc + (parseFloat(cur.total_amount) || 0),
                                    0
                                 ).toFixed(2)
                              }
                           </span>
                        </div>
                     </div>

                     {/* Right Column: Warehouse Setup & Demand Links (Span 4) */}
                     <div className="lg:col-span-4 flex flex-col gap-6">

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
                                 {localItemData?.warehouse_name && (
                                    <div className="text-[11px] text-gray-400 font-medium">
                                       Currently stored at: <span className="text-emerald-400 font-bold">{localItemData.warehouse_name}</span>
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
                                       onDemandAction(localItemData);
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
                                          onDemandAction(localItemData);
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

         <ApprovePurchase
            isOpen={showApproveModal}
            onClose={() => setShowApproveModal(false)}
            itemRow={localItemData}
            onSuccess={() => {
               setShowApproveModal(false);
               onClose();
               onSuccess?.();
            }}
         />

         <FinalizeInvoiceModal
            isOpen={showFinalizeInvoiceModal}
            onClose={() => setShowFinalizeInvoiceModal(false)}
            itemRow={localItemData}
            onConfirm={handleFinalizePurchase}
            isSaving={isFinalizing}
         />
      </>
   );
}
