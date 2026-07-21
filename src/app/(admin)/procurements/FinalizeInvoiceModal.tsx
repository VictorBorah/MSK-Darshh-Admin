import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, HelpCircle, Trash2, AlertCircle, Box, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import WarningAlertModal from '../../../components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface FinalizeInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemRow: any;
  onConfirm: (invoiceData: {
    has_tax_invoice: string;
    tax_invoice_file_name?: string;
    tax_invoice_no?: string;
    tax_invoice_url?: string;
    payment_mode?: string;
  }) => void;
  isSaving?: boolean;
}

export default function FinalizeInvoiceModal({
  isOpen,
  onClose,
  itemRow,
  onConfirm,
  isSaving = false
}: FinalizeInvoiceModalProps) {
  const [hasGstInvoice, setHasGstInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedInvoiceFilename, setUploadedInvoiceFilename] = useState('');
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');

  const [showDeleteInvoiceWarning, setShowDeleteInvoiceWarning] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#161a25',
      borderColor: state.isFocused ? '#3b82f6' : '#4b5563',
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#6b7280' },
      boxShadow: 'none',
      minHeight: '38px',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#2d3a6c' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px'
    }),
    singleValue: (base: any) => ({ ...base, color: '#e5e7eb', fontSize: '13px' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '13px' }),
  };

  const [showEscapeWarning, setShowEscapeWarning] = useState(false);
  useModalEscape(isOpen, () => setShowEscapeWarning(true), 450);

  useEffect(() => {
    if (isOpen) {
      setHasGstInvoice(false);
      setInvoiceNumber('');
      setInvoiceFile(null);
      setIsUploading(false);
      setUploadedInvoiceFilename('');
      setUploadedInvoiceUrl('');
      setShowDeleteInvoiceWarning(false);
      setIsDeletingInvoice(false);
      setSelectedPaymentMode(null);

      const fetchConfigAndDetails = async () => {
        setIsLoadingConfig(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          
          // 1. Fetch system config to get payment modes list
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
          let arr; try { arr = JSON.parse(cleanedText); } catch (e) { }
          const configData = arr && Array.isArray(arr) ? arr[0] : arr;
          
          let loadedModes: any[] = [];
          if (configData && String(configData.Status) === '1' && Array.isArray(configData.payment_modes)) {
            setPaymentModes(configData.payment_modes);
            loadedModes = configData.payment_modes;
          }

          // 2. Fetch purchase details to get exact payment mode for this item
          const procurementId = itemRow?.purchase_id;
          if (procurementId) {
            const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchPurchaseDetails?procurement_id=${procurementId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const detailsText = await detailsRes.text();
            let detailsArr; try { detailsArr = JSON.parse(detailsText); } catch (e) { }
            const detailsData = detailsArr && Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

            if (detailsData && String(detailsData.Status) === '1' && detailsData.item_data) {
              const matchItem = detailsData.item_data.find((i: any) => String(i.item_id) === String(itemRow.item_id));
              const exactPaymentMode = matchItem ? matchItem.payment_mode : (detailsData.item_data[0]?.payment_mode || '');
              if (exactPaymentMode) {
                const foundMode = loadedModes.find((m: any) => String(m.id) === String(exactPaymentMode));
                if (foundMode) {
                  setSelectedPaymentMode({ value: foundMode.id, label: foundMode.mode });
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch config and details in FinalizeInvoiceModal:', err);
        } finally {
          setIsLoadingConfig(false);
        }
      };
      fetchConfigAndDetails();
    }
  }, [isOpen, itemRow]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInvoiceFile(file);
    setIsUploading(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('my_file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/uploadFile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'File uploaded successfully');
        setUploadedInvoiceFilename(data.file_name);
        setUploadedInvoiceUrl(data.presigned_url);
      } else {
        toast.error(data?.Message || 'Failed to upload file');
        setInvoiceFile(null);
      }
    } catch (err) {
      console.error("Upload error", err);
      toast.error('An error occurred during file upload');
      setInvoiceFile(null);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFileDelete = async () => {
    if (!uploadedInvoiceFilename) return;
    setIsDeletingInvoice(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('filename', uploadedInvoiceFilename);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/deleteFile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'File Deleted');
        setInvoiceFile(null);
        setUploadedInvoiceFilename('');
        setUploadedInvoiceUrl('');
        setShowDeleteInvoiceWarning(false);
      } else {
        toast.error(data?.Message || 'Failed to delete file');
      }
    } catch (err) {
      console.error("Delete error", err);
      toast.error('An error occurred during file deletion');
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedPaymentMode) {
      toast.error('Please select a payment method');
      return;
    }

    if (hasGstInvoice && !uploadedInvoiceFilename) {
      toast.error('Please upload the GST invoice file');
      return;
    }

    onConfirm({
      has_tax_invoice: hasGstInvoice ? '1' : '0',
      tax_invoice_no: hasGstInvoice ? invoiceNumber : '',
      tax_invoice_file_name: hasGstInvoice ? uploadedInvoiceFilename : '',
      tax_invoice_url: hasGstInvoice ? uploadedInvoiceUrl : '',
      payment_mode: selectedPaymentMode ? selectedPaymentMode.value : ''
    });
  };

  const isFormDisabled = isSaving || isUploading || isDeletingInvoice || isLoadingConfig;
  const preventConfirm = !selectedPaymentMode || (hasGstInvoice && !uploadedInvoiceFilename);

  if (!isOpen || !itemRow) return null;

  return (
    <>
      <WarningAlertModal
        isOpen={showEscapeWarning}
        onClose={() => setShowEscapeWarning(false)}
        title="Discard Finalize Settings?"
        content="Are you sure you want to exit without closing this purchase? All progress will be lost."
        onConfirm={() => {
          setShowEscapeWarning(false);
          onClose();
        }}
      />
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[#1f2536] border border-gray-700 shadow-2xl flex flex-col w-[550px] max-w-[95vw] rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25]">
            <h2 className="text-[14px] font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Finalize & Close Purchase
            </h2>
            <button onClick={onClose} disabled={isFormDisabled} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 bg-[#161a25] flex flex-col gap-5 relative">
            {isSaving && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#161a25]/60 backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-[13px] font-semibold text-white tracking-wide">Closing Purchase...</span>
              </div>
            )}

            {/* Read-Only Summary Card */}
            <div className="border border-gray-700/80 rounded-lg p-4 bg-[#1b202c] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Summary</span>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="text-[13px] text-white font-bold flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-blue-400 shrink-0" />
                  {itemRow.item_name || 'N/A'}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-1 border-t border-gray-800/60 pt-2 text-[12px] text-gray-300">
                  <div>
                    <span className="text-gray-400 font-medium">Final Qty:</span> <strong className="text-white">{itemRow.qnty || '0'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Unit Price:</span> <strong className="text-white">₹ {parseFloat(itemRow.unit_price || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="border border-gray-700/80 rounded-lg p-4 bg-[#1b202c] flex flex-col gap-2">
              <label className="text-[12px] text-gray-400 font-medium">Payment Method <span className="text-red-400">*</span></label>
              <Select
                options={paymentModes.map(m => ({ value: m.id, label: m.mode }))}
                value={selectedPaymentMode}
                onChange={setSelectedPaymentMode}
                placeholder="Select payment method..."
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                isClearable={false}
                isDisabled={true}
                isLoading={isLoadingConfig}
              />
            </div>

            <div className="bg-[#1b202c] p-4 border border-gray-700/80 rounded-lg flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={hasGstInvoice}
                    onChange={(e) => setHasGstInvoice(e.target.checked)}
                    disabled={isFormDisabled}
                    className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded bg-[#11141e] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5" title="Upload a GST Invoice covering this purchase">
                  Upload GST Invoice
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                </span>
              </label>

              {hasGstInvoice && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-[#11141e] p-4 rounded-md border border-gray-700/50">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      disabled={isFormDisabled}
                      placeholder="Inv. Number..."
                      className="w-full bg-[#1b202c] border border-gray-600 rounded-md px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-gray-400">Click here to upload GST invoice</label>
                    {!uploadedInvoiceFilename ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          disabled={isFormDisabled}
                          className={`block w-full text-[12px] text-gray-400
                                        file:mr-4 file:py-2 file:px-4 
                                        file:rounded-md file:border-0 
                                        file:text-[12px] file:font-semibold 
                                        file:bg-gray-700 file:text-white 
                                        cursor-pointer ${(isUploading || isFormDisabled) ? 'opacity-50' : 'hover:file:bg-gray-600'}`}
                        />
                        {isUploading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin absolute right-2 top-0.5" />}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#1f2937] border border-gray-600 rounded-md p-2 mt-1">
                        <a href={uploadedInvoiceUrl} target="_blank" rel="noreferrer" className="text-[12px] text-blue-400 hover:text-blue-300 font-medium truncate block max-w-[85%] border-b border-transparent hover:border-blue-400/50 pb-0.5">
                          Click here to download and preview file
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowDeleteInvoiceWarning(true)}
                          disabled={isFormDisabled}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {hasGstInvoice && !uploadedInvoiceFilename && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 p-3 rounded-lg animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[12px] leading-relaxed">
                  You have checked the box to upload a GST invoice. Please upload the file before saving to proceed.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isFormDisabled}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 text-white rounded font-medium text-[12px] uppercase tracking-wider transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={preventConfirm || isFormDisabled}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded font-bold text-[12px] uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Closing...
                </>
              ) : (
                'Close Purchase'
              )}
            </button>
          </div>
        </div>
      </div>

      <WarningAlertModal
        isOpen={showDeleteInvoiceWarning}
        onClose={() => setShowDeleteInvoiceWarning(false)}
        title="Remove Invoice?"
        content="Are you sure you want to delete this uploaded invoice file? This action cannot be undone."
        onConfirm={handleFileDelete}
        isLoading={isDeletingInvoice}
      />
    </>
  );
}
