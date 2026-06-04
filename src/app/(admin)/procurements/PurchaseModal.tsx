import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Trash2, XCircle, IndianRupee, Maximize2, Minimize2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import WarningAlertModal from '../../../components/WarningAlertModal';
import SuccessConfirmationModal from '../../../components/SuccessConfirmationModal';
import TaxationDetailsModal from './TaxationDetailsModal';
import SaveProcurementModal from './SaveProcurementModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  vendors: any[];
  demands: any[];
  utilityTags?: any[];
  onSuccess?: () => void;
}

export default function PurchaseModal({ isOpen, onClose, projects, vendors, demands, utilityTags = [], onSuccess }: PurchaseModalProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [showProjectChangeWarning, setShowProjectChangeWarning] = useState(false);
  const [pendingProjectChange, setPendingProjectChange] = useState<string | null>(null);
  const [showVendorRequiredWarning, setShowVendorRequiredWarning] = useState(false);
  const [tableItems, setTableItems] = useState<any[]>([]);

  const [showTaxationModal, setShowTaxationModal] = useState(false);
  const [taxationItem, setTaxationItem] = useState<any>(null);
  const [defaultGstInclusive, setDefaultGstInclusive] = useState('0');

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSavingProcurement, setIsSavingProcurement] = useState(false);

  const [showDemandPrompt, setShowDemandPrompt] = useState(false);
  const [isCheckingDemands, setIsCheckingDemands] = useState(false);
  const [isFetchingDemands, setIsFetchingDemands] = useState(false);

  const [showEscapeWarning, setShowEscapeWarning] = useState(false);

  const [enableBackDates, setEnableBackDates] = useState('0');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isMarkComplete, setIsMarkComplete] = useState(false);

  useModalEscape(isOpen, () => setShowEscapeWarning(true), 200);

  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const lastSearchedQuery = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProject('');
      setItemSearch('');
      setSearchResults([]);
      setShowSearchDropdown(false);
      setTableItems([]);
      lastSearchedQuery.current = '';
      setIsMarkComplete(false);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    } else {
      const fetchAppConfig = async () => {
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          const appRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const appText = await appRes.text();
          const appArr = JSON.parse(appText);
          const appDataRaw = Array.isArray(appArr) ? appArr[0] : appArr;
          const gstInc = appDataRaw?.System_Data?.gst_inclusive || '0';
          setDefaultGstInclusive(String(gstInc));
          const enableBackDatesVal = appDataRaw?.System_Data?.enableBackDates || '0';
          setEnableBackDates(String(enableBackDatesVal));
        } catch (e) {
          console.error("Failed to fetch app config", e);
        }
      };
      fetchAppConfig();
    }
  }, [isOpen]);

  const fetchTaxForRow = async (rowId: string, rowData: any, gstInc: string) => {
    setTableItems(prev => prev.map(r => r.id === rowId ? { ...r, isFetchingTax: true } : r));
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      if (rowData.vendor_id) params.set('vendor_id', rowData.vendor_id);
      if (rowData.item_id) params.set('item_id', rowData.item_id);
      if (rowData.qnty) params.set('qnty', String(rowData.qnty));
      params.set('tax_inc', rowData.tax_inc !== undefined ? String(rowData.tax_inc) : gstInc);
      if (rowData.price) params.set('unit_price', String(rowData.price));
      if (rowData.gst_rate) params.set('gst_rate', String(rowData.gst_rate));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemTaxation?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (e) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setTableItems(prev => prev.map(r => {
          if (r.id === rowId) {
            return {
              ...r,
              price: data.unit_price ? String(data.unit_price).replace(/[^0-9.]/g, '') : r.price,
              amount: data.final_amount ? String(data.final_amount).replace(/[^0-9.]/g, '') : r.amount,
              gst_rate: data.gst_rate !== undefined ? String(data.gst_rate).replace(/[^0-9.]/g, '') : r.gst_rate,
              taxData: data,
              isFetchingTax: false
            };
          }
          return r;
        }));
      } else {
        setTableItems(prev => prev.map(r => r.id === rowId ? { ...r, isFetchingTax: false } : r));
      }
    } catch (e) {
      setTableItems(prev => prev.map(r => r.id === rowId ? { ...r, isFetchingTax: false } : r));
    }
  };

  const checkActiveDemands = async (projectId: string) => {
    setIsCheckingDemands(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/getDemandInformation?project_id=${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (e) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'Demand check successful');
        if (String(data.demands_exists) === '1') {
          setShowDemandPrompt(true);
        }
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || 'Failed to check active demands');
      }
    } catch (e) {
      toast.error('Failed to communicate with demand API');
    } finally {
      setIsCheckingDemands(false);
    }
  };

  const handleLoadDemands = async () => {
    setIsFetchingDemands(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemandItems?project_id=${selectedProject}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (e) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1' && data.items_data) {
        toast.success(data.Message || 'Demands loaded!');
        const addedDemandItems: any[] = [];
        data.items_data.forEach((item: any) => {
          const isDuplicate = tableItems.some(t => String(t.item_id) === String(item.item_id) && String(t.demand_id || '') === String(item.demand_id || '')) || addedDemandItems.some(t => String(t.item_id) === String(item.item_id) && String(t.demand_id || '') === String(item.demand_id || ''));
          if (!isDuplicate) {
            const qty_val = parseFloat(item.qnty || '1');
            const default_val = parseFloat(item.default_price || '0');
            const newItem = {
              id: Math.random().toString(36).substr(2, 9),
              project_id: selectedProject,
              item_id: item.item_id,
              item_name: item.item_name,
              demand_id: item.demand_id || '',
              unit_name: item.unit_name || '',
              vendor_id: item.default_vendor_id || '',
              qnty: qty_val,
              price: item.default_price || 0,
              amount: String(default_val * qty_val),
              isFetchingTax: true
            };
            addedDemandItems.push(newItem);
          }
        });

        if (addedDemandItems.length > 0) {
          setTableItems(prev => [...prev, ...addedDemandItems]);
          addedDemandItems.forEach(item => {
            fetchTaxForRow(item.id, item, defaultGstInclusive);
          });
        }
      } else {
        toast.error(data?.Message || 'Failed to fetch active demands');
      }
    } catch (e) {
      toast.error('Failed to load demands');
    } finally {
      setIsFetchingDemands(false);
      setShowDemandPrompt(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject) {
      setShowWarning(true);
      return;
    }
    setItemSearch(e.target.value);
  };

  useEffect(() => {
    if (itemSearch.length === 0) {
      if (lastSearchedQuery.current !== '') {
        lastSearchedQuery.current = '';
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
      return;
    }

    if (!selectedProject) return;

    if (itemSearch.length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (itemSearch === lastSearchedQuery.current) return;

    const performSearch = async () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearching(true);

      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchItem?query_str=${encodeURIComponent(itemSearch)}&project_id=${selectedProject}`;

        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });

        const rawText = await res.text();
        let arr;
        try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
        const data = Array.isArray(arr) ? arr[0] : arr;

        if (data && String(data.Status) === '1' && data.items_data) {
          setSearchResults(data.items_data);
          setShowSearchDropdown(true);
          lastSearchedQuery.current = itemSearch;
        } else {
          setSearchResults([]);
          setShowSearchDropdown(true);
          lastSearchedQuery.current = itemSearch;
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [itemSearch, selectedProject]);

  const handleSelectItem = (item: any) => {
    // Prevent duplicate entries conditionally based on item_id
    if (tableItems.find(t => t.item_id === item.item_id)) {
      toast.error('Item already added');
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: selectedProject,
      item_id: item.item_id,
      item_name: item.item_name,
      unit_name: item.unit_name || '',
      vendor_id: item.default_vendor_id || '',
      qnty: 1,
      price: item.default_price || 0,
      amount: item.default_price || 0,
      isFetchingTax: true
    };

    setTableItems(prev => [...prev, newItem]);
    setItemSearch('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    lastSearchedQuery.current = '';

    fetchTaxForRow(newItem.id, newItem, defaultGstInclusive);
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setTableItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });

      const updatedRow = newItems.find(item => item.id === id);
      if (updatedRow) {
        if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
        timersRef.current[id] = setTimeout(() => {
          fetchTaxForRow(id, updatedRow, defaultGstInclusive);
        }, 600);
      }
      return newItems;
    });
  };

  const updateTableItem = (id: string, field: string, value: any) => {
    setTableItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeTableItem = (id: string) => {
    setTableItems(prev => prev.filter(item => item.id !== id));
  };

  const grandTotal = tableItems.reduce((acc, row) => acc + (parseFloat(row.amount || 0)), 0);

  if (!isOpen) return null;

  return (
    <>
      <WarningAlertModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        title="Project Required"
        content="Please select a Project before searching for an item."
      />

      <WarningAlertModal
        isOpen={showVendorRequiredWarning}
        onClose={() => setShowVendorRequiredWarning(false)}
        title="Vendor Required"
        content="Select a vendor first"
      />

      <WarningAlertModal
        isOpen={showProjectChangeWarning}
        onClose={() => {
          setShowProjectChangeWarning(false);
          setPendingProjectChange(null);
        }}
        title="Change Project?"
        content="Changing the project will remove all the selected items. Continue?"
        onConfirm={() => {
          if (pendingProjectChange) {
            setSelectedProject(pendingProjectChange);
            if (itemSearch) setItemSearch('');
            setTableItems([]);
            checkActiveDemands(pendingProjectChange);
          }
          setShowProjectChangeWarning(false);
          setPendingProjectChange(null);
        }}
      />

      <WarningAlertModal
        isOpen={showEscapeWarning}
        onClose={() => setShowEscapeWarning(false)}
        title="Unsaved Changes"
        content="Are you sure you want to close this form without saving?"
        onConfirm={() => {
          setShowEscapeWarning(false);
          onClose();
        }}
      />

      <SuccessConfirmationModal
        isOpen={showDemandPrompt}
        onClose={() => setShowDemandPrompt(false)}
        onConfirm={handleLoadDemands}
        isLoading={isFetchingDemands}
        title="Active Demands Located"
        content="Found active demands for this project. Load them automatically?"
      />

      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
        <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[900px] max-w-[95vw] max-h-[90vh]'
          }`}>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-blue-400">New Purchase</span>
              </h2>
              {enableBackDates === '1' && (
                <div className="flex items-center gap-2 bg-[#161a25]/60 px-3 py-1 rounded-lg border border-gray-600/50 shadow-inner">
                  <span className="text-[12px] text-gray-400 font-medium">Purchase Date:</span>
                  <input
                    type="date"
                    value={purchaseDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="bg-[#1b202c] border border-gray-600 rounded px-2.5 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer dark-bg-date-picker"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
                title={isMaximized ? "Restore Size" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col gap-6 relative">
            {isCheckingDemands && (
              <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-sm rounded-lg m-2">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-300 font-medium tracking-wide">Checking active demands...</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* Select Project */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-gray-300">Select Project <span className="text-red-400">*</span></label>
                <Select
                  options={projects?.map((p: any) => ({ value: String(p.id || p.project_id), label: p.project_code || p.project_name || p.name })) || []}
                  value={projects?.find(p => String(p.id || p.project_id) === selectedProject) ? { value: selectedProject, label: projects.find((p: any) => String(p.id || p.project_id) === selectedProject)?.project_code || projects.find((p: any) => String(p.id || p.project_id) === selectedProject)?.project_name || projects.find((p: any) => String(p.id || p.project_id) === selectedProject)?.name } : null}
                  onChange={(val: any) => {
                    const nextVal = val ? val.value : '';
                    if (tableItems.length > 0) {
                      setPendingProjectChange(nextVal);
                      setShowProjectChangeWarning(true);
                    } else {
                      setSelectedProject(nextVal);
                      if (itemSearch) setItemSearch('');
                      setTableItems([]);
                      if (nextVal) checkActiveDemands(nextVal);
                    }
                  }}
                  placeholder="Select Project..."
                  styles={{
                    control: (base, state) => ({ ...base, backgroundColor: '#161a25', borderColor: state.isFocused ? '#3b82f6' : '#4b5563', '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' }, minHeight: '38px', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                    menuPortal: base => ({ ...base, zIndex: 99999 }),
                    menu: base => ({ ...base, backgroundColor: '#161a25', border: '1px solid #4b5563', borderRadius: '4px' }),
                    option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#374151' : state.isFocused ? '#1f2937' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                    singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                    input: base => ({ ...base, color: '#fff' })
                  }}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
              </div>

              {/* Search Item */}
              <div className="flex flex-col gap-2" ref={searchContainerRef}>
                <label className="text-[13px] font-medium text-gray-300">Search Item <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={handleSearchChange}
                    placeholder="Type Item Name here..."
                    className="w-full bg-[#161a25] border border-gray-600 rounded pl-9 pr-8 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />

                  <div className="absolute right-2 top-2.5 flex items-center gap-2">
                    {isSearching && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                    {itemSearch && (
                      <button onClick={() => { setItemSearch(''); setSearchResults([]); setShowSearchDropdown(false); }} className="text-gray-400 hover:text-white transition-colors" title="Clear Search">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showSearchDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#191e2b] border border-gray-700 rounded shadow-2xl z-[150] max-h-[300px] overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-[13px] text-gray-400 text-center italic">No items found</div>
                      ) : (
                        <ul className="py-1">
                          {searchResults.map((result: any) => (
                            <li
                              key={result.item_id}
                              onClick={() => handleSelectItem(result)}
                              className="px-4 py-2 hover:bg-[#11141e] cursor-pointer text-[13px] text-gray-300 border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-white">{result.item_name}</span>
                                <span className="text-[11px] text-gray-500">{result.category_name} &bull; {result.unit_name}</span>
                              </div>
                              {result.default_vendor_name && <span className="text-[11px] px-2 py-0.5 bg-gray-800 rounded text-gray-400 border border-gray-700">{result.default_vendor_name}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 italic mt-0.5">Min. 3 characters</span>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-[#161a25] border border-gray-700 rounded-lg overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-[#1b202c] text-gray-400 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center uppercase tracking-wider">SL</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Item Details</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider min-w-[200px]">Vendor</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider w-32 border-l border-gray-700/50">Qnty</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider w-32 border-l border-gray-700/50">Unit Price</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider w-32 border-l border-gray-700/50">Amount</th>
                      <th className="px-4 py-3 font-semibold w-16 text-center uppercase tracking-wider">Rem.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {tableItems.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{row.item_name}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{row.unit_name}</div>
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            options={vendors?.map((v: any) => ({ value: String(v.id), label: v.vendor_name || v.name })) || []}
                            value={vendors?.find(v => String(v.id) === String(row.vendor_id)) ? { value: String(row.vendor_id), label: vendors.find((v: any) => String(v.id) === String(row.vendor_id))?.vendor_name || vendors.find((v: any) => String(v.id) === String(row.vendor_id))?.name } : null}
                            onChange={(val: any) => handleFieldChange(row.id, 'vendor_id', val ? val.value : '')}
                            placeholder="Select vendor..."
                            styles={{
                              control: (base) => ({ ...base, backgroundColor: '#191e2b', borderColor: '#374151', minHeight: '32px', borderRadius: '4px', color: '#fff', fontSize: '13px' }),
                              menuPortal: base => ({ ...base, zIndex: 99999 }),
                              menu: base => ({ ...base, backgroundColor: '#191e2b', border: '1px solid #4b5563', borderRadius: '4px' }),
                              option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#1f2937' : 'transparent', color: '#fff', fontSize: '13px' }),
                              singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                              input: base => ({ ...base, color: '#fff' })
                            }}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          />
                        </td>
                        <td className="px-4 py-2 border-l border-gray-700/50">
                          <input
                            type="number"
                            min="0"
                            value={row.qnty}
                            onChange={(e) => handleFieldChange(row.id, 'qnty', e.target.value)}
                            className="w-full bg-[#191e2b] border border-gray-600 rounded px-2 py-1.5 text-white text-center focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </td>
                        <td className="px-4 py-2 border-l border-gray-700/50">
                          <div className="relative">
                            <IndianRupee className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-2" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.price}
                              onChange={(e) => handleFieldChange(row.id, 'price', e.target.value)}
                              className="w-full bg-[#191e2b] border border-gray-600 rounded pl-7 pr-2 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 border-l border-gray-700/50 font-medium text-emerald-400 relative">
                          {row.isFetchingTax && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#161a25]/60 backdrop-blur-[1px]">
                              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {parseFloat(row.amount || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                if (row) {
                                  if (!row.vendor_id) {
                                    setShowVendorRequiredWarning(true);
                                    return;
                                  }
                                  setTaxationItem(row);
                                  setShowTaxationModal(true);
                                }
                              }}
                              className="text-gray-400 hover:text-blue-400 p-1.5 hover:bg-white/10 rounded transition-colors"
                              title="Taxation Configuration"
                            >
                              <Settings className="w-[18px] h-[18px]" />
                            </button>
                            <button onClick={() => removeTableItem(row.id)} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-colors" title="Remove Item">
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tableItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                            <Search className="w-8 h-8 opacity-20" />
                            <p>Search and select items to add to the Purchase order.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-[13px] text-gray-400">
                Total Items: <span className="text-white font-medium ml-1">{tableItems.length}</span>
              </div>
              <div className="text-[16px] font-bold text-white flex items-center gap-2 bg-[#161a25] px-4 py-1.5 rounded-lg border border-gray-700 shadow-inner">
                Grand Total:
                <span className="text-emerald-400 flex items-center">
                  <IndianRupee className="w-4 h-4 ml-2 mr-0.5" /> {grandTotal.toFixed(2)}
                </span>
              </div>
              {/* Hide Mark Complete checkbox for now */}
              {false && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-medium text-gray-300 hover:text-white transition-colors bg-[#161a25] px-3.5 py-1.5 rounded-lg border border-gray-700 shadow-sm ml-2">
                  <input
                    type="checkbox"
                    checked={isMarkComplete}
                    onChange={(e) => setIsMarkComplete(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800 focus:ring-2 cursor-pointer"
                  />
                  <span>Mark Complete</span>
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm">
                Close
              </button>
              <button
                onClick={() => {
                  if (tableItems.length === 0) {
                    toast.error('Please add at least one item before saving.');
                    return;
                  }
                  setShowSaveModal(true);
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2"
              >
                Initiate Purchase
              </button>
            </div>
          </div>

        </div>
      </div>

      <TaxationDetailsModal
        isOpen={showTaxationModal}
        onClose={() => setShowTaxationModal(false)}
        item={taxationItem}
        vendors={vendors}
        demands={demands}
        utilityTags={utilityTags}
        onApply={(updatedData) => {
          if (taxationItem) {
            setTableItems(prev => prev.map(r => r.id === taxationItem.id ? { ...r, ...updatedData } : r));
          }
        }}
      />

      <SaveProcurementModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        isSaving={isSavingProcurement}
        isMarkedComplete={isMarkComplete}
        onConfirm={async (saveData) => {
          setIsSavingProcurement(true);
          const toastId = toast.loading('Saving procurement...');
          try {
            // Build JSON
            const item_data = tableItems.map(row => {
              const taxInfo = row.taxData || {};
              return {
                item_id: String(row.item_id),
                vendor_id: String(row.vendor_id),
                demand_id: String(row.demand_id || ""),
                qnty: String(row.qnty),
                gst_rate: String(row.gst_rate || taxInfo.gst_rate || "0"),
                gst_amount: String(taxInfo.gst_amount || "0"),
                sgst_amount: String(taxInfo.sgst_amount || "0"),
                cgst_amount: String(taxInfo.cgst_amount || "0"),
                igst_amount: String(taxInfo.igst_amount || "0"),
                unit_price: String(row.price || "0"),
                total_price_inc_gst: String(taxInfo.final_amount || row.amount || "0"),
                total_price_exc_gst: String(taxInfo.base_price || "0"),
                tax_inc: String(row.tax_inc !== undefined ? row.tax_inc : defaultGstInclusive),
                invoice_uploaded: row.has_gst_invoice === '1' ? "1" : "0",
                invoice_file_string: row.invoice_file || "",
                tax_inv_no: row.invoice_number || "",
                utility_tag: String(row.utility_tag || ""),
                warehouse_id: String(row.warehouse_id || "")
              };
            });

            const purchaseJsonObj = { item_data };

            // Construct FormData
            const formData = new FormData();
            formData.append('project_id', selectedProject);
            formData.append('purchase_json', JSON.stringify(purchaseJsonObj));
            formData.append('purchase_status', saveData.status);

            const firstItemWithWh = tableItems.find(row => row.warehouse_id);
            const warehouseId = firstItemWithWh?.warehouse_id || '';
            formData.append('warehouse_id', String(warehouseId));

            if (saveData.has_gst_invoice === '1') {
              formData.append('has_tax_invoice', '1');
              if (saveData.invoice_file) formData.append('tax_invoice_file_name', saveData.invoice_file);
              if (saveData.invoice_number) formData.append('tax_invoice_no', saveData.invoice_number);
            } else {
              formData.append('has_tax_invoice', '0');
            }

            formData.append('verified', isMarkComplete ? '1' : '0');

            if (enableBackDates === '1' && purchaseDate) {
              const [yyyy, mm, dd] = purchaseDate.split('-');
              formData.append('purchase_date', `${dd}-${mm}-${yyyy}`);
            }

            const token = localStorage.getItem('at_ki8Xq1iV');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/savePurchase`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });

            const text = await res.text();
            let arr; try { arr = JSON.parse(text); } catch (x) { }
            const respData = arr && Array.isArray(arr) ? arr[0] : arr;

            if (respData && String(respData.Status) === '1') {
              toast.success(respData.Message || 'Procurement Done', { id: toastId });
              setShowSaveModal(false);
              onSuccess?.();
              onClose();
            } else {
              toast.error(respData?.Message || 'Failed to save procurement', { id: toastId });
            }
          } catch (err: any) {
            toast.error(err.message || 'Error occurred while saving', { id: toastId });
          } finally {
            setIsSavingProcurement(false);
          }
        }}
      />
    </>
  );
}
