import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Loader2, IndianRupee, Link as LinkIcon, Maximize2, Minimize2, HelpCircle, Trash2 } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import WarningAlertModal from '@/components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface ConfigurePaymentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onApply: (data: any) => void;
}

export default function ConfigurePaymentSettings({ isOpen, onClose, item, onApply }: ConfigurePaymentSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTdsLoading, setIsTdsLoading] = useState(false);
  const [showEscapeWarning, setShowEscapeWarning] = useState(false);

  useModalEscape(isOpen, () => setShowEscapeWarning(true), 300);

  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [tdsOptions, setTdsOptions] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>(null);

  const [paymentMode, setPaymentMode] = useState('');
  const [connectDemand, setConnectDemand] = useState('');

  const [unitPaymentAmount, setUnitPaymentAmount] = useState('');
  const [quantity, setQuantity] = useState('');

  const [tdsOptionId, setTdsOptionId] = useState('');
  const [customTdsRate, setCustomTdsRate] = useState('');

  const [tdsData, setTdsData] = useState<any>(null);

  const [demandDetails, setDemandDetails] = useState<any[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [projectDemands, setProjectDemands] = useState<any[]>([]);
  const [hasDemandsData, setHasDemandsData] = useState(true);

  const [hasTransactionFile, setHasTransactionFile] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteInvoiceWarning, setShowDeleteInvoiceWarning] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  const [uploadedInvoiceFilename, setUploadedInvoiceFilename] = useState('');
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (isOpen && item) {
      setPaymentMode(item.mode_id || '');
      setUnitPaymentAmount(item.price ? String(item.price) : '');
      setQuantity(item.qnty || '1');
      setConnectDemand(item.demand_id || '');
      setDemandDetails([]);
      setSelectedDemandId(item.demand_id || null);
      setProjectDemands([]);
      setHasDemandsData(true);

      setHasTransactionFile(item.has_transaction_file === '1');
      setInvoiceFile(null);
      setTransactionNumber(item.transaction_number || '');
      setIsUploading(false);
      setUploadedInvoiceFilename(item.transaction_file || '');
      setUploadedInvoiceUrl(item.transaction_url || '');
      setShowDeleteInvoiceWarning(false);
      setIsDeletingInvoice(false);
      setIsManuallyEdited(false);

      setTdsData(item.tdsData || null);

      if (item.tds_option_id) {
        setTdsOptionId(String(item.tds_option_id));
        setCustomTdsRate(item.custom_tds_rate || '');
      } else {
        setTdsOptionId('');
        setCustomTdsRate('');
      }

      fetchInitialData();
    }
  }, [isOpen, item]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');

      const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const configText = await configRes.text();
      let configArr;
      try { configArr = JSON.parse(configText); } catch (e) { throw new Error('Invalid JSON'); }
      const configData = Array.isArray(configArr) ? configArr[0] : configArr;

      let fetchedTdsOptions: any[] = [];
      let currentAppSettings: any = null;
      if (String(configData?.Status) === '1') {
        setPaymentModes(configData.payment_modes || []);
        currentAppSettings = configData.app_settings;
        setAppSettings(currentAppSettings);

        let loadedTdsOptions = configData.tds_options || [];
        fetchedTdsOptions = loadedTdsOptions;

        loadedTdsOptions = [
          ...loadedTdsOptions,
          { id: 'not_applicable', tds_option: '0.00', label: 'Not Applicable' },
          { id: 'other', tds_option: '', label: 'Other' }
        ];
        setTdsOptions(loadedTdsOptions);

        if (!item.tds_option_id) {
          const defaultOpt = loadedTdsOptions.find((o: any) => String(o.is_default) === '1');
          if (defaultOpt) {
            setTdsOptionId(String(defaultOpt.id));
          }
        }
      }

      const fetchDemandsPromise = item.project_id ? (async () => {
        try {
          const dRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/getDemandInformation?project_id=${item.project_id}&is_material=0`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dText = await dRes.text();
          let dArr;
          try { dArr = JSON.parse(dText); } catch (e) { dArr = {}; }
          const dData = Array.isArray(dArr) ? dArr[0] : dArr;

          if (String(dData.Status) === '1' && String(dData.demands_exists) === '1') {
            const actualRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemands?project_id=${item.project_id}&is_material=0`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const actualText = await actualRes.text();
            let actualArr; try { actualArr = JSON.parse(actualText); } catch (e) { }
            const actualData = Array.isArray(actualArr) ? actualArr[0] : actualArr;

            if (String(actualData?.Status) === '1' && actualData.demands_data && actualData.demands_data.length > 0) {
              setProjectDemands(actualData.demands_data);
              setHasDemandsData(true);
            } else {
              setProjectDemands([]);
              setHasDemandsData(false);
            }
          } else {
            setProjectDemands([]);
            setHasDemandsData(false);
          }
        } catch (e) {
          console.error("Project Demands Fetch Failed", e);
          setProjectDemands([]);
          setHasDemandsData(false);
        }
      })() : Promise.resolve();

      await Promise.all([
        fetchDemandsPromise
      ]);

      const deductTdsEnabled = String(currentAppSettings?.deduct_tds) === '1';

      if (!deductTdsEnabled && !item.tds_option_id) {
        setTdsOptionId('not_applicable');
        toast('Auto TDS Deduction disabled To enable it go to Settings', { icon: '⚠️', id: 'tds_disabled_toast' });
        const baseAmt = Number(item.price || 0) * Number(item.qnty || 1);
        setTdsData({
          base_amount: String(baseAmt),
          tds_amount: '0',
          gross_amount: String(baseAmt)
        });
        setIsLoading(false);
        return;
      }

      const currentTdsOptionId = item.tds_option_id || (fetchedTdsOptions.find((o: any) => String(o.is_default) === '1')?.id);
      const currentCustomRate = item.custom_tds_rate || '';

      let effectiveRate = '0';
      if (currentTdsOptionId === 'not_applicable') {
        effectiveRate = '0';
      } else if (currentTdsOptionId === 'other') {
        effectiveRate = currentCustomRate || '0';
      } else {
        const matched = fetchedTdsOptions.find(o => String(o.id) === String(currentTdsOptionId));
        if (matched) effectiveRate = matched.tds_option;
      }

      await fetchTdsCalculation(item.price ? String(item.price) : '0', item.qnty || '1', effectiveRate, true);

    } catch (e) {
      console.error("Initialization Failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTdsCalculation = async (baseAmount: string, qty: string | number, rate: string, isInitialCall: boolean = false) => {
    setIsTdsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      params.set('base_amount', baseAmount);
      params.set('qnty', String(qty));
      params.set('tds_rate', rate);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/calculateTDSAmount?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (String(data.Status) === '1') {
        setTdsData(data);
        if (!isInitialCall) {
          toast.success(data.Message || 'TDS details updated');
        }
      } else {
        if (!isInitialCall) toast.error(data.Message || 'Failed to update TDS details');
      }
    } catch (e) {
      console.error("TDS Fetch Failed", e);
    } finally {
      setIsTdsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || isLoading || !isManuallyEdited) return;

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      // Removed global deduct_tds override so that user can manually select a TDS Percentage.

      let effectiveRate = '0';
      if (tdsOptionId === 'not_applicable') {
        effectiveRate = '0';
      } else if (tdsOptionId === 'other') {
        effectiveRate = customTdsRate || '0';
      } else {
        const matched = tdsOptions.find(o => String(o.id) === String(tdsOptionId));
        if (matched) effectiveRate = matched.tds_option;
      }
      fetchTdsCalculation(unitPaymentAmount, quantity, effectiveRate, false);
    }, 600);
    return () => clearTimeout(timer);
  }, [unitPaymentAmount, quantity, tdsOptionId, customTdsRate, isManuallyEdited, tdsOptions]);


  useEffect(() => {
    if (!connectDemand) {
      setDemandDetails([]);
      setSelectedDemandId(null);
      return;
    }
    const fetchDemand = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemandDetail?demand_no=${connectDemand}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        let arr;
        try { arr = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON'); }
        const data = Array.isArray(arr) ? arr[0] : arr;

        if (String(data.Status) === '1') {
          const fetchedDemands = data.demands_data || [];
          setDemandDetails(fetchedDemands);
          const connected = fetchedDemands.find((d: any) => String(d.is_connected) === '1');
          if (connected) {
            setSelectedDemandId(String(connected.demand_id));
          }
        } else {
          setDemandDetails([]);
        }
      } catch (e) {
        console.error("Demand Detail Fetch Failed", e);
        setDemandDetails([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDemand();
  }, [connectDemand]);

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

  const isApplyDisabled = hasTransactionFile && !uploadedInvoiceFilename;

  if (!isOpen) return null;

  return (
    <>
      <WarningAlertModal
        isOpen={showEscapeWarning}
        onClose={() => setShowEscapeWarning(false)}
        title="Discard Configuration?"
        content="Are you sure you want to close without applying your payment configuration changes?"
        onConfirm={() => {
          setShowEscapeWarning(false);
          onClose();
        }}
      />
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
        <div className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full rounded-none' : 'w-[1100px] max-w-[95vw] h-[85vh] max-h-[85vh] rounded-xl'}`}>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-[310] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-[2px]">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-300 font-medium text-[13px] tracking-wide">Syncing Configurations...</p>
            </div>
          )}

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
            <h2 className="text-[15px] font-bold text-white flex items-center gap-2 tracking-wide">
              <Settings className="w-4 h-4 text-blue-400" />
              Payment Configuration
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Toggle Size">
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#161a25]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

              {/* L E F T   C O L U M N */}
              <div className="flex flex-col gap-6 relative">
                {isTdsLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#161a25]/60 backdrop-blur-[1px] rounded-lg">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                )}

                {/* Top Setup */}
                <div className="bg-[#1b202c] p-5 border border-gray-700 rounded-lg shadow-inner">
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#11141e] border border-gray-700/50 rounded-md px-3 py-2.5 flex flex-col gap-0.5 shadow-sm">
                      <span className="text-[11px] text-blue-400 uppercase tracking-wide font-bold">Target Item</span>
                      <span className="text-[13px] text-white font-medium line-clamp-1">{item?.item_name || 'Selected Item'}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Payment Mode</label>
                      <Select
                        options={paymentModes?.map((m: any) => ({ value: String(m.id), label: m.mode })) || []}
                        value={paymentModes?.find(m => String(m.id) === paymentMode) ? { value: paymentMode, label: paymentModes.find((m: any) => String(m.id) === paymentMode)?.mode } : null}
                        onChange={(val: any) => {
                          setPaymentMode(val ? val.value : '');
                        }}
                        placeholder="Select Mode..."
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

                    {/* Checkboxes Inline */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-700/50">
                      <div className="flex gap-6 items-center">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={hasTransactionFile}
                              onChange={(e) => setHasTransactionFile(e.target.checked)}
                              className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded bg-[#11141e] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                            />
                            <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                              <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                            Upload Transaction File
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                          </span>
                        </label>
                      </div>

                      {hasTransactionFile && (
                        <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200 bg-[#11141e] p-3 rounded-md border border-gray-700/50">
                          <label className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5">
                            Enter Transaction Number
                          </label>
                          <input
                            type="text"
                            value={transactionNumber}
                            onChange={(e) => setTransactionNumber(e.target.value)}
                            placeholder="Txn. Number (Optional)..."
                            className="w-full bg-[#1b202c] border border-gray-600 rounded-md px-3 py-1.5 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors mb-2"
                          />
                          <label className="text-[12px] font-medium text-gray-400">Click here to upload transaction file</label>
                          {!uploadedInvoiceFilename ? (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className={`block w-full text-[12px] text-gray-400
                                           file:mr-4 file:py-2 file:px-4 
                                           file:rounded-md file:border-0 
                                           file:text-[12px] file:font-semibold 
                                           file:bg-gray-700 file:text-white 
                                           cursor-pointer ${isUploading ? 'opacity-50' : 'hover:file:bg-gray-600'}`}
                              />
                              {isUploading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin absolute right-2 top-0.5" />}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-[#1f2937] border border-gray-600 rounded-md p-2 animate-in fade-in">
                              <a href={uploadedInvoiceUrl} target="_blank" rel="noreferrer" className="text-[12px] text-blue-400 hover:text-blue-300 font-medium truncate border-b border-transparent hover:border-blue-400/50 pb-0.5">
                                Click here to preview uploaded file
                              </a>
                              <button
                                type="button"
                                onClick={() => setShowDeleteInvoiceWarning(true)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0"
                                title="Remove File"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & TDS Inputs */}
                <div className="bg-[#1b202c] p-5 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide">Base Payment Value</label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPaymentAmount}
                          onChange={(e) => {
                            setUnitPaymentAmount(e.target.value);
                            setIsManuallyEdited(true);
                          }}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide">Qnty</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          setIsManuallyEdited(true);
                        }}
                        className="w-full bg-[#11141e] border border-gray-600 rounded-md px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide">TDS Percentage</label>
                      <Select
                        options={tdsOptions?.map((o: any) => ({ value: String(o.id), label: o.label || `${o.tds_option}%` })) || []}
                        value={tdsOptions?.find(o => String(o.id) === tdsOptionId) ? { value: tdsOptionId, label: tdsOptions.find((o: any) => String(o.id) === tdsOptionId)?.label || `${tdsOptions.find((o: any) => String(o.id) === tdsOptionId)?.tds_option}%` } : null}
                        onChange={(val: any) => {
                          setTdsOptionId(val ? val.value : '');
                          setIsManuallyEdited(true);
                        }}
                        placeholder="Select TDS..."
                        styles={{
                          control: (base) => ({ ...base, backgroundColor: '#11141e', borderColor: '#4b5563', minHeight: '36px', borderRadius: '4px', color: '#fff', fontSize: '13px' }),
                          menuPortal: base => ({ ...base, zIndex: 99999 }),
                          menu: base => ({ ...base, backgroundColor: '#232b3e', border: '1px solid #4b5563', borderRadius: '4px' }),
                          option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#1f2937' : 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer' }),
                          singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                          input: base => ({ ...base, color: '#fff' })
                        }}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      />
                    </div>
                    {tdsOptionId === 'other' && (
                      <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in duration-200">
                        <label className="text-[12px] text-blue-400 font-medium tracking-wide">Custom TDS Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={customTdsRate}
                          onChange={(e) => {
                            setCustomTdsRate(e.target.value);
                            setIsManuallyEdited(true);
                          }}
                          placeholder="Enter rate..."
                          className="w-full bg-[#11141e] border border-blue-500 rounded-md px-3 py-2 text-white text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    )}

                    <div className="col-span-2 pt-2 border-t border-gray-700/50 mt-2"></div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        Total Base Amount
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={tdsData?.base_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        Total TDS Amount
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={tdsData?.tds_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2 mt-2">
                      <label className="text-[13px] text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5">
                        Gross Amount (Final Payout)
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-5 h-5 text-emerald-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={tdsData?.gross_amount || ''}
                          className="w-full bg-[#1f2937] border-2 border-emerald-500/50 rounded-md pl-10 pr-3 py-2.5 text-emerald-400 font-bold text-[15px] cursor-not-allowed shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* R I G H T   C O L U M N */}
              <div className="flex flex-col gap-6">
                <div className="bg-[#1b202c] p-5 border border-gray-700 rounded-lg shadow-inner">
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 opacity-70" /> Connect Demand
                    </label>
                    {!hasDemandsData ? (
                      <div className="bg-[#11141e] border border-red-500/30 text-red-400/80 rounded px-3 py-2 text-[12px] font-medium flex items-center h-[36px]">
                        No pending demands for this project
                      </div>
                    ) : (
                      <Select
                        options={projectDemands?.map((d: any) => ({
                          value: String(d.demand_no),
                          label: `[#${d.demand_no}] ${d.demand_title || d.item_name || 'Demand'}`,
                          is_connected: String(d.is_connected)
                        })) || []}
                        value={projectDemands?.find(d => String(d.demand_no) === connectDemand) ? {
                          value: connectDemand,
                          label: `[#${connectDemand}] ${projectDemands.find((d: any) => String(d.demand_no) === connectDemand)?.demand_title || projectDemands.find((d: any) => String(d.demand_no) === connectDemand)?.item_name || 'Demand'}`,
                          is_connected: String(projectDemands.find((d: any) => String(d.demand_no) === connectDemand)?.is_connected)
                        } : null}
                        onChange={(val: any) => {
                          if (val && val.is_connected === '1') {
                            toast.error('This demand is already connected to a different payment.');
                            return;
                          }
                          setConnectDemand(val ? val.value : '');
                        }}
                        placeholder="Select Demand to Merge..."
                        isClearable
                        styles={{
                          control: (base) => ({ ...base, backgroundColor: '#232b3e', borderColor: '#374151', minHeight: '36px', borderRadius: '4px', color: '#fff', fontSize: '13px' }),
                          menuPortal: base => ({ ...base, zIndex: 99999 }),
                          menu: base => ({ ...base, backgroundColor: '#232b3e', border: '1px solid #4b5563', borderRadius: '4px' }),
                          option: (base, state: any) => ({
                            ...base,
                            backgroundColor: state.isFocused && state.data.is_connected !== '1' ? '#1f2937' : 'transparent',
                            color: state.data.is_connected === '1' ? '#4b5563' : '#fff',
                            fontSize: '13px',
                            cursor: state.data.is_connected === '1' ? 'not-allowed' : 'pointer'
                          }),
                          singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                          input: base => ({ ...base, color: '#fff' })
                        }}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      />
                    )}
                  </div>
                </div>

                {demandDetails.length > 0 ? (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                    <h3 className="text-[13px] font-semibold text-white border-b border-gray-700/50 pb-2 flex items-center gap-2 shrink-0">
                      <LinkIcon className="w-4 h-4 text-blue-400" /> Select an item
                    </h3>
                    <div className="bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1 max-h-[100%] min-h-[300px]">
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-[13px] text-left">
                          <thead className="bg-[#232b3e] text-gray-400 border-b border-gray-700 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold w-10 text-center">SEL</th>
                              <th className="px-3 py-2.5 font-semibold">Demand Details</th>
                              <th className="px-3 py-2.5 font-semibold">Target Item</th>
                              <th className="px-3 py-2.5 font-semibold">Quantity</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700/50">
                            {demandDetails.map((dRow) => {
                              const isUnavailable = String(dRow.connection_available) === '0';

                              return (
                                <tr
                                  key={dRow.demand_id}
                                  title={isUnavailable ? "Payment already done for this demand" : undefined}
                                  className={`transition-colors ${isUnavailable ? 'opacity-60 cursor-not-allowed bg-gray-900/40' : 'hover:bg-white/5 cursor-pointer'} ${selectedDemandId === String(dRow.demand_id) ? 'bg-blue-500/10' : ''}`}
                                  onClick={() => {
                                    if (!isUnavailable) setSelectedDemandId(String(dRow.demand_id));
                                  }}
                                >
                                  <td className="px-3 py-3 text-center align-top mt-1">
                                    <input
                                      type="radio"
                                      name="demand_connect_radio"
                                      checked={selectedDemandId === String(dRow.demand_id)}
                                      disabled={isUnavailable}
                                      readOnly
                                      className={`w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-900 relative top-1 ${isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    />
                                  </td>
                                  <td className="px-3 py-3 align-top">
                                    <div className="font-medium text-white break-words">{dRow.project_name || 'N/A'}</div>
                                    <div className="text-[11px] text-gray-500 mt-0.5">#{dRow.demand_no} &bull; {dRow.demand_date}</div>
                                    <div className="mt-1.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${String(dRow.priority_id) === '1' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        String(dRow.priority_id) === '2' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                          'bg-green-500/10 text-green-500 border-green-500/20'
                                        }`}>
                                        {dRow.priority_txt || 'Low'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-gray-300 align-top">
                                    <div className="font-medium text-blue-300 break-words max-w-[150px]">{dRow.item_name}</div>
                                    {dRow.auto_title && <div className="text-[11px] text-gray-500 italic mt-1 line-clamp-2 max-w-[150px]">{dRow.auto_title}</div>}
                                  </td>
                                  <td className="px-3 py-3 text-white font-medium align-top">{dRow.quantity_txt || dRow.quantity || '-'}</td>
                                  <td className="px-3 py-3 text-white font-medium align-top text-right">
                                    <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-400 mr-0.5" />{parseFloat(dRow.payment_amount || 0).toFixed(2)}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-[#1b202c] border border-gray-700/50 border-dashed rounded-lg text-gray-500">
                    <LinkIcon className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-[13px]">Select a demand to view details</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3 z-10">
            <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm">
              Close
            </button>
            <button
              onClick={() => {
                onApply({
                  mode_id: paymentMode,
                  qnty: quantity,
                  price: unitPaymentAmount,
                  tds_option_id: tdsOptionId,
                  custom_tds_rate: customTdsRate,
                  demand_id: selectedDemandId,
                  has_transaction_file: hasTransactionFile ? '1' : '0',
                  transaction_number: transactionNumber,
                  transaction_file: uploadedInvoiceFilename,
                  transaction_url: uploadedInvoiceUrl,
                  amount: tdsData?.gross_amount ? String(tdsData.gross_amount).replace(/[^0-9.]/g, '') : item?.amount,
                  tdsData: tdsData
                });
                onClose();
              }}
              disabled={isApplyDisabled}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm"
            >
              Apply Config
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
