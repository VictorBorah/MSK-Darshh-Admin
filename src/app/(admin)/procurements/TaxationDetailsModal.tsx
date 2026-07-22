import { useState, useEffect, useRef } from 'react';
import { Settings, X, Loader2, IndianRupee, Link as LinkIcon, Maximize2, Minimize2, HelpCircle, Trash2 } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import WarningAlertModal from '@/components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';
import AdditionalExpenses from './AdditionalExpenses';

interface TaxationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  vendors: any[];
  demands: any[];
  utilityTags?: any[];
  onApply: (data: any) => void;
}

export default function TaxationDetailsModal({ isOpen, onClose, item, vendors, demands, utilityTags = [], onApply }: TaxationDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [showEscapeWarning, setShowEscapeWarning] = useState(false);

  useModalEscape(isOpen, () => setShowEscapeWarning(true), 300);

  const [appData, setAppData] = useState({ default_gst: '', gst_inclusive: '' });

  const [buyingVendor, setBuyingVendor] = useState('');
  const [connectDemand, setConnectDemand] = useState('');

  const [unitPrice, setUnitPrice] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [quantity, setQuantity] = useState('');

  const [taxData, setTaxData] = useState<any>(null);

  const [demandDetails, setDemandDetails] = useState<any[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [projectDemands, setProjectDemands] = useState<any[]>([]);
  const [hasDemandsData, setHasDemandsData] = useState(true);

  const [hasGstInvoice, setHasGstInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteInvoiceWarning, setShowDeleteInvoiceWarning] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  const [uploadedInvoiceFilename, setUploadedInvoiceFilename] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');
  const [isGstInclusive, setIsGstInclusive] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [additionalExpenses, setAdditionalExpenses] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [showAdditionalExpensesModal, setShowAdditionalExpensesModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');

  // Track if manually edited
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (isOpen && item) {
      setBuyingVendor(item.vendor_id || '');
      setUnitPrice(item.price ? String(item.price) : '');
      setGstRate(item.gst_rate ? String(item.gst_rate) : '');
      setQuantity(item.qnty || '1');
      setConnectDemand(item.demand_id || '');
      setDemandDetails([]);
      setSelectedDemandId(item.demand_id || null);
      setProjectDemands([]);
      setHasDemandsData(true);
      setTaxData(item.taxData || null);
      setHasGstInvoice(item.has_gst_invoice === '1');
      setInvoiceFile(null);
      setInvoiceNumber(item.invoice_number || '');
      setIsUploading(false);
      setUploadedInvoiceFilename(item.invoice_file || '');
      setUploadedInvoiceUrl(item.invoice_url || '');
      setShowDeleteInvoiceWarning(false);
      setIsDeletingInvoice(false);
      setIsGstInclusive(false);
      setShowMathModal(false);
      setIsManuallyEdited(false);
      setSelectedTag(item.utility_tag || '');
      setSelectedWarehouse(item.warehouse_id || '');
      setAdditionalExpenses(item.additional_expenses || []);
      setSelectedPaymentMode(item.payment_mode || '');
      fetchInitialData();
    }
  }, [isOpen, item]);

  const fetchInitialData = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');

      const appRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appText = await appRes.text();
      let appArr;
      try { appArr = JSON.parse(appText); } catch (e) { throw new Error('Invalid JSON'); }
      const appDataRaw = Array.isArray(appArr) ? appArr[0] : appArr;

      // Fetch system configs to load warehouses
      const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const configText = await configRes.text();
      const cleanedConfigText = configText.replace(/[\u0000-\u001f]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      let configArr;
      try {
        configArr = JSON.parse(cleanedConfigText);
      } catch (e) {
        configArr = {};
      }
      const configData = Array.isArray(configArr) ? configArr[0] : configArr;

      if (configData && String(configData.Status) === '1' && Array.isArray(configData.warehouse_data)) {
        setWarehouses(configData.warehouse_data);
        if (!item.warehouse_id) {
          const defaultWh = configData.warehouse_data.find((w: any) => String(w.default_warehouse).toLowerCase() === 'yes');
          if (defaultWh) {
            setSelectedWarehouse(String(defaultWh.id));
          }
        }
      }

      const modes = appDataRaw?.paymentmodes_Arr || (configData && String(configData.Status) === '1' && Array.isArray(configData.payment_modes) ? configData.payment_modes : []);
      if (modes && Array.isArray(modes) && modes.length > 0) {
        setPaymentModes(modes);
      }

      const defaultGst = appDataRaw?.System_Data?.default_gst || '';
      const gstInc = appDataRaw?.System_Data?.gst_inclusive || '0';
      setAppData({ default_gst: defaultGst, gst_inclusive: gstInc });
      setIsGstInclusive(item.tax_inc !== undefined ? item.tax_inc === '1' : gstInc === '1');
      setGstRate(item.gst_rate || defaultGst);

      const fetchDemandsPromise = item.project_id ? (async () => {
        try {
          const dRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemands?project_id=${item.project_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dText = await dRes.text();
          let dArr;
          try { dArr = JSON.parse(dText); } catch (e) { dArr = {}; }
          const dData = Array.isArray(dArr) ? dArr[0] : dArr;

          if (String(dData.Status) === '1' && dData.demands_data && dData.demands_data.length > 0) {
            setProjectDemands(dData.demands_data);
            setHasDemandsData(true);
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
        fetchTaxation(
          item.vendor_id || '',
          item.item_id,
          item.qnty || '1',
          item.tax_inc !== undefined ? String(item.tax_inc) : gstInc,
          item.price ? String(item.price) : '',
          item.gst_rate || '',
          true
        ),
        fetchDemandsPromise
      ]);

    } catch (e) {
      console.error("Initialization Failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaxation = async (vendorId: string, itemId: string, qnty: string | number, taxInc: string, uprice: string, grate: string, isInitialCall: boolean = false) => {
    setIsTaxLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      if (vendorId) params.set('vendor_id', vendorId);
      if (itemId) params.set('item_id', itemId);
      if (qnty) params.set('qnty', String(qnty));
      params.set('tax_inc', taxInc);
      if (uprice) params.set('unit_price', uprice);
      if (grate) params.set('gst_rate', grate);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemTaxation?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (String(data.Status) === '1') {
        const newUp = data.unit_price ? String(data.unit_price).replace(/[^0-9.]/g, '') : '';
        const newGst = data.gst_rate ? String(data.gst_rate).replace(/[^0-9.]/g, '') : '';
        const newQnty = data.qnty ? String(data.qnty).replace(/[^0-9.]/g, '') : '';

        if (!isInitialCall && (newUp !== unitPrice || newGst !== gstRate || newQnty !== quantity)) {
          skipNextFetchRef.current = true;
        }

        setTaxData(data);
        if (data.unit_price) setUnitPrice(newUp);
        if (data.gst_rate) setGstRate(newGst);
        if (data.qnty) setQuantity(newQnty);
        toast.success(data.Message || 'Taxation details updated');
      } else {
        toast.error(data.Message || 'Failed to update taxation details');
      }
    } catch (e) {
      console.error("Tax Fetch Failed", e);
    } finally {
      setIsTaxLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || isLoading || !isManuallyEdited || !item) return;

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchTaxation(buyingVendor, item.item_id, quantity, isGstInclusive ? '1' : '0', unitPrice, gstRate, false);
    }, 600);
    return () => clearTimeout(timer);
  }, [unitPrice, gstRate, quantity, buyingVendor, isManuallyEdited, isGstInclusive, item]);


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

  const isApplyDisabled = hasGstInvoice && !uploadedInvoiceFilename;

  if (!isOpen || !item) return null;

  return (
    <>
      <WarningAlertModal
        isOpen={showEscapeWarning}
        onClose={() => setShowEscapeWarning(false)}
        title="Discard Taxation Details?"
        content="Are you sure you want to close without applying your taxation configuration changes?"
        onConfirm={() => {
          setShowEscapeWarning(false);
          onClose();
        }}
      />
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
        <div className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full rounded-none' : 'w-[1150px] max-w-[95vw] h-[92vh] max-h-[92vh] rounded-xl'}`}>

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
              Configure Purchase
              {item?.item_name && (
                <span className="ml-2 px-2.5 py-0.5 text-[15px] font-bold bg-red-500/10 border border-dotted border-red-500/30 rounded-md text-red-400">
                  {item.item_name}
                </span>
              )}
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
                {isTaxLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#161a25]/60 backdrop-blur-[1px] rounded-lg">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                )}

                {/* Top Setup */}
                <div className="bg-[#1b202c] p-5 border border-gray-700 rounded-lg shadow-inner">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Buying From Vendor */}
                      <div className="flex flex-col gap-2 bg-[#11141e] p-3 border border-gray-700/50 rounded-md">
                        <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Buying From Vendor</label>
                        <Select
                          options={vendors?.map((v: any) => ({ value: String(v.id), label: v.vendor_name || v.name })) || []}
                          value={vendors?.find(v => String(v.id) === buyingVendor) ? { value: buyingVendor, label: vendors.find((v: any) => String(v.id) === buyingVendor)?.vendor_name || vendors.find((v: any) => String(v.id) === buyingVendor)?.name } : null}
                          onChange={(val: any) => {
                            setBuyingVendor(val ? val.value : '');
                            setIsManuallyEdited(true);
                          }}
                          placeholder="Select Vendor..."
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

                      {/* Payment Mode */}
                      <div className="flex flex-col gap-2 bg-[#11141e] p-3 border border-gray-700/50 rounded-md">
                        <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Payment Mode</label>
                        <Select
                          options={paymentModes?.map((pm: any) => ({ value: String(pm.id), label: pm.mode || '' })) || []}
                          value={paymentModes?.find(pm => String(pm.id) === selectedPaymentMode) ? { value: selectedPaymentMode, label: paymentModes.find((pm: any) => String(pm.id) === selectedPaymentMode)?.mode || '' } : null}
                          onChange={(val: any) => {
                            setSelectedPaymentMode(val ? val.value : '');
                          }}
                          placeholder="Select Payment Mode..."
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
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Warehouse</label>
                      <Select
                        options={warehouses?.map((w: any) => ({ value: String(w.id), label: w.warehouse_name || '' })) || []}
                        value={warehouses?.find(w => String(w.id) === selectedWarehouse) ? { value: selectedWarehouse, label: warehouses.find((w: any) => String(w.id) === selectedWarehouse)?.warehouse_name || '' } : null}
                        onChange={(val: any) => {
                          setSelectedWarehouse(val ? val.value : '');
                        }}
                        placeholder="Select Warehouse..."
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
                              checked={hasGstInvoice}
                              onChange={(e) => setHasGstInvoice(e.target.checked)}
                              className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded bg-[#11141e] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                            />
                            <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                              <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5" title="Upload a scanned copy of the Tax Invoice provided by the vendor">
                            Upload GST Invoice
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isGstInclusive}
                              onChange={(e) => {
                                setIsGstInclusive(e.target.checked);
                                setIsManuallyEdited(true);
                              }}
                              className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded bg-[#11141e] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                            />
                            <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                              <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5" title="Check this if the Unit Price already has GST included">
                            GST Inclusive
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                          </span>
                        </label>
                      </div>

                      {hasGstInvoice && (
                        <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200 bg-[#11141e] p-3 rounded-md border border-gray-700/50">
                          <label className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5" title="Invoice number of Tax Invoice provided by vendor">
                            Invoice Number
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                          </label>
                          <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="Inv. Number..."
                            className="w-full bg-[#1b202c] border border-gray-600 rounded-md px-3 py-1.5 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors mb-2"
                          />
                          <label className="text-[12px] font-medium text-gray-400">Click here to upload GST invoice</label>
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
                                Click here to download and preview file
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

                {/* Pricing & GST Inputs */}
                <div className="bg-[#1b202c] p-5 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide">Unit Price</label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e) => {
                            setUnitPrice(e.target.value);
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
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide">GST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={gstRate}
                        onChange={(e) => {
                          setGstRate(e.target.value);
                          setIsManuallyEdited(true);
                        }}
                        className="w-full bg-[#11141e] border border-gray-600 rounded-md px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        SGST
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.sgst_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        CGST
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.cgst_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        IGST
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.igst_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        Total price exc. GST
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.base_price || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        Total GST amount
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.gst_amount || ''}
                          className="w-full bg-[#11141e] border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-300 text-[13px] cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5" title="Automatically Calculated">
                        Total Price including GST
                        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-white transition-colors cursor-help" />
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          readOnly
                          value={taxData?.final_amount || ''}
                          className="w-full bg-[#1f2937] border border-blue-500/50 rounded-md pl-9 pr-3 py-2 text-emerald-400 font-bold text-[13px] cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Add a tag</label>
                      <Select
                        options={utilityTags?.map((tag: any) => ({ value: String(tag.id || tag.tag_id || ''), label: tag.utility || tag.utility_tag || '' })) || []}
                        value={utilityTags?.find(tag => String(tag.id || tag.tag_id) === selectedTag) ? { value: selectedTag, label: utilityTags.find((tag: any) => String(tag.id || tag.tag_id) === selectedTag)?.utility || utilityTags.find((tag: any) => String(tag.id || tag.tag_id) === selectedTag)?.utility_tag } : null}
                        onChange={(val: any) => {
                          setSelectedTag(val ? val.value : '');
                        }}
                        placeholder="Select Utility Tag..."
                        isClearable
                        styles={{
                          control: (base) => ({ ...base, backgroundColor: '#11141e', borderColor: '#4b5563', minHeight: '38px', borderRadius: '6px', color: '#fff', fontSize: '13px' }),
                          menuPortal: base => ({ ...base, zIndex: 99999 }),
                          menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #4b5563', borderRadius: '6px' }),
                          option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#11141e' : 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer' }),
                          singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                          input: base => ({ ...base, color: '#fff' })
                        }}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button onClick={(e) => { e.preventDefault(); setShowMathModal(true); }} className="text-blue-400 hover:text-blue-300 text-[12px] underline font-medium">See computation math</button>
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
                            toast.error('This demand is already connected to a different purchase.');
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
                  <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-[13px] font-semibold text-white border-b border-gray-700/50 pb-2 flex items-center gap-2 shrink-0">
                      <LinkIcon className="w-4 h-4 text-blue-400" /> Select an item
                    </h3>
                    <div className="bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-[180px] min-h-[130px]">
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-[13px] text-left">
                          <thead className="bg-[#232b3e] text-gray-400 border-b border-gray-700 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold w-12 text-center">SEL</th>
                              <th className="px-4 py-2.5 font-semibold">Demand Details</th>
                              <th className="px-4 py-2.5 font-semibold">Target Item</th>
                              <th className="px-4 py-2.5 font-semibold">Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700/50">
                            {demandDetails.map((dRow) => {
                              const isUnavailable = String(dRow.connection_available) === '0';

                              return (
                                <tr
                                  key={dRow.demand_id}
                                  title={isUnavailable ? "Purchase already done for this demand" : undefined}
                                  className={`transition-colors ${isUnavailable ? 'opacity-60 cursor-not-allowed bg-gray-900/40' : 'hover:bg-white/5 cursor-pointer'} ${selectedDemandId === String(dRow.demand_id) ? 'bg-blue-500/10' : ''}`}
                                  onClick={() => {
                                    if (!isUnavailable) setSelectedDemandId(String(dRow.demand_id));
                                  }}
                                >
                                  <td className="px-4 py-3 text-center align-top mt-1">
                                    <input
                                      type="radio"
                                      name="demand_connect_radio"
                                      checked={selectedDemandId === String(dRow.demand_id)}
                                      disabled={isUnavailable}
                                      readOnly
                                      className={`w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-900 relative top-1 ${isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 align-top">
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
                                  <td className="px-4 py-3 text-gray-300 align-top">
                                    <div className="font-medium text-blue-300 break-words max-w-[150px]">{dRow.item_name}</div>
                                    {dRow.auto_title && <div className="text-[11px] text-gray-500 italic mt-1 line-clamp-2 max-w-[150px]">{dRow.auto_title}</div>}
                                  </td>
                                  <td className="px-4 py-3 text-white font-medium align-top">{dRow.quantity_txt || dRow.quantity || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 min-h-[90px] bg-[#1b202c] border border-gray-700/50 border-dashed rounded-lg text-gray-500">
                    <LinkIcon className="w-6 h-6 mb-1.5 opacity-30" />
                    <p className="text-[12px]">Select a demand to view details</p>
                  </div>
                )}

                {/* Additional Expenses Section */}
                {(() => {
                  const totalAdditionalExpenses = (additionalExpenses || []).reduce((acc: number, exp: any) => {
                    const amt = parseFloat(exp.total_price || exp.total_amount || exp.amount || (parseFloat(exp.unit_price || 0) * parseFloat(exp.qnty || 1))) || 0;
                    return acc + amt;
                  }, 0);

                  return (
                    <div className="bg-[#1b202c] p-4 border border-gray-700 rounded-lg flex flex-col gap-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-gray-700/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-amber-400" />
                          <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">
                            Additional Expenses
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray-400 font-semibold uppercase">Total:</span>
                          <span className="text-[13px] font-bold text-amber-400 flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {totalAdditionalExpenses.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {additionalExpenses && additionalExpenses.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                          <div className="divide-y divide-gray-700/50 bg-[#11141e] border border-gray-700/60 rounded-md overflow-hidden">
                            {additionalExpenses.map((exp: any, idx: number) => {
                              const modeObj = paymentModes?.find((pm: any) => String(pm.id) === String(exp.payment_mode));
                              const modeName = modeObj?.mode || modeObj?.payment_mode || '';
                              const amt = parseFloat(exp.total_price || exp.total_amount || exp.amount || (parseFloat(exp.unit_price || 0) * parseFloat(exp.qnty || 1))) || 0;

                              return (
                                <div key={exp.id || idx} className="p-2.5 flex items-center justify-between text-[12px] hover:bg-white/5 transition-colors">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-white">{exp.item_name || exp.name || 'Expense Item'}</span>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                      <span>Qty: {exp.qnty || exp.quantity || 1}</span>
                                      <span>&bull;</span>
                                      <span>Rate: ₹{parseFloat(exp.unit_price || exp.price || 0).toFixed(2)}</span>
                                      {modeName && (
                                        <>
                                          <span>&bull;</span>
                                          <span className="text-blue-400">{modeName}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-bold text-amber-400 flex items-center">
                                    <IndianRupee className="w-3 h-3 mr-0.5" />
                                    {amt.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#11141e] border border-gray-700/50 border-dashed rounded-md p-3 text-center text-gray-500 text-[12px]">
                          No additional expenses added for this item.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAdditionalExpensesModal(true)}
                        className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                      >
                        {additionalExpenses && additionalExpenses.length > 0 ? 'Edit Additional Expenses' : '+ Add Additional Expenses'}
                      </button>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3 z-10">
            <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm">
              Close
            </button>
            <button
              type="button"
              onClick={() => setShowAdditionalExpensesModal(true)}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
            >
              Add Additional Expenses
            </button>
            <button
              onClick={() => {
                onApply({
                  vendor_id: buyingVendor,
                  qnty: quantity,
                  price: unitPrice,
                  gst_rate: gstRate,
                  tax_inc: isGstInclusive ? '1' : '0',
                  demand_id: selectedDemandId,
                  has_gst_invoice: hasGstInvoice ? '1' : '0',
                  invoice_number: invoiceNumber,
                  invoice_file: uploadedInvoiceFilename,
                  invoice_url: uploadedInvoiceUrl,
                  amount: taxData?.final_amount ? String(taxData.final_amount).replace(/[^0-9.]/g, '') : item?.amount,
                  taxData: taxData,
                  utility_tag: selectedTag,
                  warehouse_id: selectedWarehouse,
                  payment_mode: selectedPaymentMode,
                  additional_expenses: additionalExpenses
                });
                onClose();
              }}
              disabled={isApplyDisabled}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm"
            >
              Apply Tax Config
            </button>
          </div>

          {/* Computed Tax Math Modal */}
          {showMathModal && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#11141e] border border-gray-700 rounded-xl shadow-2xl flex flex-col w-[400px] overflow-hidden relative">
                <div className="px-5 py-4 border-b border-gray-700/80 flex justify-between items-center bg-[#1b202c]">
                  <h3 className="text-[14px] font-bold text-emerald-400 tracking-wide uppercase">Computed Tax Math</h3>
                  <button onClick={() => setShowMathModal(false)} className="p-1 text-gray-400 hover:text-white rounded transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-gray-500 font-semibold">Calculated Unit Price</span>
                    <span className="text-[13px] text-white flex items-center font-medium">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-gray-400" />
                      {taxData?.unit_price || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-gray-500 font-semibold">Total Baseline Price</span>
                    <span className="text-[13px] text-white flex items-center font-medium">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-gray-400" />
                      {taxData?.base_price || '0.00'}
                    </span>
                  </div>
                  {parseFloat(taxData?.igst_amount || '0') > 0 ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-gray-500 font-semibold">IGST ({taxData?.gst_percent || taxData?.gst_rate || '0'}%)</span>
                      <span className="text-[13px] text-orange-400 flex items-center font-medium">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {taxData?.igst_amount || '0.00'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-gray-500 font-semibold">SGST ({taxData?.sgst_rate || (parseFloat(taxData?.gst_percent || taxData?.gst_rate || '0') / 2).toFixed(1)}%)</span>
                        <span className="text-[13px] text-orange-400 flex items-center font-medium">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {taxData?.sgst_amount || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-gray-500 font-semibold">CGST ({taxData?.cgst_rate || (parseFloat(taxData?.gst_percent || taxData?.gst_rate || '0') / 2).toFixed(1)}%)</span>
                        <span className="text-[13px] text-orange-400 flex items-center font-medium">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {taxData?.cgst_amount || '0.00'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-800 pt-3 mt-1">
                    <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Total GST Amount</span>
                    <span className="text-[14px] text-orange-400 font-bold flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                      {taxData?.gst_amount || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#1b202c] p-3 rounded border border-gray-700/50 mt-1">
                    <span className="text-[12px] text-emerald-500/80 font-bold uppercase tracking-wide">Gross Amount</span>
                    <span className="text-[16px] text-emerald-400 font-black flex items-center">
                      <IndianRupee className="w-4 h-4 mr-0.5" />
                      {taxData?.final_amount || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <WarningAlertModal
            isOpen={showDeleteInvoiceWarning}
            onClose={() => setShowDeleteInvoiceWarning(false)}
            title="Remove File?"
            content="Are you sure you want to delete this uploaded invoice file? This action cannot be undone."
            onConfirm={handleFileDelete}
            isLoading={isDeletingInvoice}
          />
          <AdditionalExpenses
            isOpen={showAdditionalExpensesModal}
            onClose={() => setShowAdditionalExpensesModal(false)}
            projectId={item.project_id || ''}
            paymentModes={paymentModes}
            initialExpenses={additionalExpenses}
            onAdd={(expenses) => {
              setAdditionalExpenses(expenses);
            }}
          />
        </div>
      </div>
    </>
  );
}
