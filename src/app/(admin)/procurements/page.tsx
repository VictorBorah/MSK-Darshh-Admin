'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Maximize2, Minimize2, Settings, Calendar, IndianRupee, RefreshCcw, Loader2, ShoppingCart, ClipboardList, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import MakeDemandModal from './MakeDemandModal';
import DemandDetailModal from './DemandDetailModal';
import PurchaseModal from './PurchaseModal';
import ViewPurchaseModal from './ViewPurchaseModal';

const SearchableSelectPlaceholder = ({
  label,
  placeholder,
  options = [],
  value = '',
  onChange
}: {
  label: string;
  placeholder?: string;
  options?: any[];
  value?: string;
  onChange?: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchWord, setSearchWord] = useState('');

  // Find the selected option to display if closed, else display search string
  const selectedOption = options.find(o => String(o.id) === String(value));
  let displayValue = '';
  if (isOpen) {
    displayValue = searchWord;
  } else if (selectedOption) {
    displayValue = selectedOption.name || selectedOption.status || selectedOption.vendor_name || selectedOption.project_name || selectedOption.item_name || '';
  }

  const filteredOptions = options.filter(opt => {
    const name = String(opt.name || opt.status || opt.vendor_name || opt.project_name || opt.item_name || '').toLowerCase();
    return name.includes(searchWord.toLowerCase());
  });

  return (
    <div className="flex items-center justify-between gap-3 relative">
      <label className="text-[13px] font-medium text-white whitespace-nowrap">{label}</label>
      <div className="relative w-40">
        <input
          type="text"
          placeholder={placeholder || `Search...`}
          value={displayValue}
          onChange={(e) => {
            setSearchWord(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (!e.target.value) onChange?.(''); // clear when empty
          }}
          onFocus={() => { setIsOpen(true); setSearchWord(''); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full bg-[#8ba0ba] border-none rounded py-1.5 px-3 text-[13px] text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-full bg-[#191e2b] border border-gray-700 rounded-md shadow-xl z-50 py-1 max-h-40 overflow-y-auto">
            <div
              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-[#11141e] hover:text-white cursor-pointer transition-colors"
              onClick={() => { onChange?.(''); setIsOpen(false); }}
            >
              -- Clear Selection --
            </div>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-1.5 text-xs text-gray-500">No results found</div>
            ) : (
              filteredOptions.map(opt => {
                const optName = opt.name || opt.status || opt.vendor_name || opt.project_name || opt.item_name;
                return (
                  <div
                    key={opt.id}
                    className="px-3 py-1.5 text-xs text-gray-300 hover:bg-[#11141e] hover:text-white cursor-pointer transition-colors"
                    onClick={() => { onChange?.(String(opt.id)); setIsOpen(false); }}
                  >
                    {optName}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProcurementsPage() {
  const [maximizedColumn, setMaximizedColumn] = useState<'procurements' | 'demands' | null>(null);
  const [showMakeDemandModal, setShowMakeDemandModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedDemandNo, setSelectedDemandNo] = useState<string | null>(null);
  const [viewProcurementId, setViewProcurementId] = useState<string | null>(null);
  const [showDemandsTab, setShowDemandsTab] = useState(true);

  // Loading State for preloader
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Lookups mapped from sys/fetch_system_config
  const [vendorsOptions, setVendorsOptions] = useState<any[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<any[]>([]);
  const [itemsOptions, setItemsOptions] = useState<any[]>([]);
  const [procStatusOptions, setProcStatusOptions] = useState<any[]>([]);
  const [demandStatusOptions, setDemandStatusOptions] = useState<any[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Procurements Form & Data state
  const [procurementsList, setProcurementsList] = useState<any[]>([]);
  const [procPage, setProcPage] = useState(1);
  const [procTotalPages, setProcTotalPages] = useState(1);
  const [procDateFrom, setProcDateFrom] = useState(thirtyDaysAgoStr);
  const [procDateTo, setProcDateTo] = useState(todayStr);
  const [procStatus, setProcStatus] = useState('');
  const [procProject, setProcProject] = useState('');
  const [procVendor, setProcVendor] = useState('');

  // Demands Form & Data state
  const [demandsList, setDemandsList] = useState<any[]>([]);
  const [demPage, setDemPage] = useState(1);
  const [demTotalPages, setDemTotalPages] = useState(1);
  const [demDateFrom, setDemDateFrom] = useState(thirtyDaysAgoStr);
  const [demDateTo, setDemDateTo] = useState(todayStr);
  const [demStatus, setDemStatus] = useState('');
  const [demProject, setDemProject] = useState('');
  const [demItem, setDemItem] = useState('');

  const fetchSystemConfig = async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch system config');
    const data = await res.json();
    const configData = Array.isArray(data) ? data[0] : data;

    if (String(configData.Status) === '1') {
      setVendorsOptions(configData.vendors || []);
      setProjectsOptions(configData.projects_data || []);
      setItemsOptions(configData.items_data || []);
      setProcStatusOptions(configData.procurement_status_options || []);
      setDemandStatusOptions(configData.demands_status_options || []);
      setPriorityOptions(configData.priority_data || []);
      return { success: true, message: configData.Message };
    } else {
      return { success: false, message: configData.Message || 'System config error' };
    }
  };

  const fetchProcurementsData = async (token: string, passedPage = procPage, passedProj = procProject, passedStatus = procStatus, passedVendor = procVendor, passedDateFrom = procDateFrom, passedDateTo = procDateTo) => {
    const params = new URLSearchParams();
    params.set('pagenum', String(passedPage));
    if (passedProj) params.set('project_id', passedProj);
    if (passedStatus) params.set('status', passedStatus);
    if (passedDateFrom) {
      const [yyyy, mm, dd] = passedDateFrom.split('-');
      params.set('purchase_date_from', `${dd}-${mm}-${yyyy}`);
    }
    if (passedDateTo) {
      const [yyyy, mm, dd] = passedDateTo.split('-');
      params.set('purchase_date_to', `${dd}-${mm}-${yyyy}`);
    }
    if (passedVendor) params.set('vendor_id', passedVendor);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchprocurements?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch procurements');
    const data = await res.json();
    const pData = Array.isArray(data) ? data[0] : data;

    if (String(pData.Status) === '1') {
      setProcurementsList(pData.procurements_data || []);
      const total = parseInt(pData.total_rows || "0", 10);
      const pageSize = parseInt(pData.pagination_size || "10", 10);
      setProcTotalPages(total && pageSize ? Math.ceil(total / pageSize) : 1);
      return { success: true, message: pData.Message };
    } else {
      return { success: false, message: pData.Message || 'Procurements fetch error' };
    }
  };

  const fetchDemandsData = async (token: string, passedPage = demPage, passedProj = demProject, passedStatus = demStatus, passedItem = demItem, passedDateFrom = demDateFrom, passedDateTo = demDateTo) => {
    const params = new URLSearchParams();
    params.set('pagenum', String(passedPage));
    if (passedProj) params.set('project_id', passedProj);
    if (passedStatus) params.set('status', passedStatus);
    if (passedDateFrom) {
      const [yyyy, mm, dd] = passedDateFrom.split('-');
      params.set('demand_date_from', `${dd}-${mm}-${yyyy}`);
    }
    if (passedDateTo) {
      const [yyyy, mm, dd] = passedDateTo.split('-');
      params.set('demand_date_to', `${dd}-${mm}-${yyyy}`);
    }
    if (passedItem) params.set('item_id', passedItem);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemands?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch demands');
    const data = await res.json();
    const dData = Array.isArray(data) ? data[0] : data;

    if (String(dData.Status) === '1') {
      setDemandsList(dData.demands_data || []);
      const total = parseInt(dData.total_rows || "0", 10);
      const pageSize = parseInt(dData.pagination_size || "10", 10);
      setDemTotalPages(total && pageSize ? Math.ceil(total / pageSize) : 1);
      return { success: true, message: dData.Message };
    } else {
      return { success: false, message: dData.Message || 'Demands fetch error' };
    }
  };

  // Fetch System Settings on Focus
  useEffect(() => {
    const checkShowDemands = async () => {
      const token = localStorage.getItem('at_ki8Xq1iV');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const arr = Array.isArray(data) ? data[0] : data;
        if (arr && arr.System_Data && arr.System_Data.showDemandsInAdmin !== undefined) {
          setShowDemandsTab(String(arr.System_Data.showDemandsInAdmin) === '1');
        }
      } catch (err) {
        console.error('Failed to fetch AppData for demands tab:', err);
      }
    };

    checkShowDemands();

    const handleFocus = () => checkShowDemands();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Initial Load Context
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('at_ki8Xq1iV');
      if (!token) return;
      setIsInitialLoading(true);
      try {
        const [configResult, procResult, demResult] = await Promise.all([
          fetchSystemConfig(token),
          fetchProcurementsData(token, 1),
          fetchDemandsData(token, 1)
        ]);
        if (!configResult.success) toast.error(configResult.message);
        if (!procResult.success) toast.error(procResult.message);
        if (!demResult.success) toast.error(demResult.message);
      } catch (err: any) {
        toast.error(err.message || 'Error occurred starting up dashboard');
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync Independent Procurements Table
  useEffect(() => {
    if (isInitialLoading) return;
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (token) fetchProcurementsData(token, procPage, procProject, procStatus, procVendor, procDateFrom, procDateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procPage, procProject, procStatus, procDateFrom, procDateTo, procVendor]);

  // Sync Independent Demands Table
  useEffect(() => {
    if (isInitialLoading) return;
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (token) fetchDemandsData(token, demPage, demProject, demStatus, demItem, demDateFrom, demDateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demPage, demProject, demStatus, demDateFrom, demDateTo, demItem]);

  const renderProcurementsPanel = () => {
    const isExpanded = maximizedColumn === 'procurements';
    return (
      <div className={`flex flex-col bg-[#232b3e] border border-gray-800 rounded shadow-lg overflow-hidden transition-all ${isExpanded ? 'fixed inset-0 z-[100] m-4 md:m-8' : (showDemandsTab ? 'w-full min-[1200px]:w-1/2 h-[600px] min-[1200px]:h-auto' : 'w-full flex-1')
        }`}>
        <div className="bg-[#293653] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white tracking-wide flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              Procurements
            </h2>
            <button onClick={() => setShowPurchaseModal(true)} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded font-medium px-3 py-1.5 text-[12px] transition-colors gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[12px] font-bold flex items-center gap-1.5">
              Purchased Today: <IndianRupee className="w-3.5 h-3.5" /> 124560.00
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const token = localStorage.getItem('at_ki8Xq1iV');
                if (!token) return;
                const toastId = toast.loading('Refreshing procurements...');
                try {
                  const res = await fetchProcurementsData(token);
                  if (res.success) toast.success(res.message || 'Procurements refreshed', { id: toastId });
                  else toast.error(res.message || 'Error refreshing procurements', { id: toastId });
                } catch (err: any) {
                  toast.error(err.message, { id: toastId });
                }
              }}
              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMaximizedColumn(isExpanded ? null : 'procurements')}
              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#1b202c]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[13px] font-medium text-white whitespace-nowrap">Dates</label>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <input
                  type="date"
                  max={todayStr}
                  value={procDateFrom}
                  onChange={(e) => setProcDateFrom(e.target.value)}
                  title="From Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  max={todayStr}
                  value={procDateTo}
                  onChange={(e) => setProcDateTo(e.target.value)}
                  title="To Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
              </div>
            </div>
            <SearchableSelectPlaceholder label="Select Status" options={procStatusOptions} value={procStatus} onChange={setProcStatus} />
            <SearchableSelectPlaceholder label="Select Project" options={projectsOptions} value={procProject} onChange={setProcProject} />
            <SearchableSelectPlaceholder label="Select Vendor" options={vendorsOptions} value={procVendor} onChange={setProcVendor} />
          </div>
        </div>

        <div className="overflow-x-auto flex-1 bg-[#232b3e] p-4 flex flex-col">
          <table className="w-full text-[12px] text-left">
            <thead className="text-[12px] text-gray-900 font-bold uppercase bg-[#cdd5df]">
              <tr>
                <th className="px-4 py-3 border-r border-[#bac4cf] w-12 text-center">SL</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">DATE</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">PROJECT</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">STATUS</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">VENDOR</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">AMOUNT</th>
                <th className="px-4 py-3 text-center border-r border-[#bac4cf] w-16">PRINT</th>
                <th className="px-4 py-3 text-center w-16">MORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {procurementsList.map((row, idx) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white text-center font-medium">{(procPage - 1) * 10 + idx + 1}</td>
                  <td className="px-4 py-3 text-white">{row.purchase_date || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.project_name || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.procurement_txt || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.vendor_name || '-'}</td>
                  <td className="px-4 py-3 text-white font-semibold">₹{row.total_purchase_value || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      disabled={String(row.invoice_ready) !== '1'}
                      className="text-gray-300 hover:text-blue-400 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-300"
                      title={String(row.invoice_ready) === '1' ? 'Print Invoice' : 'Invoice Not Ready'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setViewProcurementId(String(row.id))}
                      className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {procurementsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No procurements found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">Page {procPage} of {procTotalPages}</div>
            <div className="flex gap-2">
              <button
                disabled={procPage <= 1}
                onClick={() => setProcPage(p => p - 1)}
                className="px-3 py-1 bg-[#1b202c] rounded text-white text-xs hover:bg-gray-700 disabled:opacity-50"
              >Prev</button>
              <button
                disabled={procPage >= procTotalPages}
                onClick={() => setProcPage(p => p + 1)}
                className="px-3 py-1 bg-[#1b202c] rounded text-white text-xs hover:bg-gray-700 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDemandsPanel = () => {
    const isExpanded = maximizedColumn === 'demands';
    return (
      <div className={`flex flex-col bg-[#232b3e] border border-gray-800 rounded shadow-lg overflow-hidden transition-all ${isExpanded ? 'fixed inset-0 z-[100] m-4 md:m-8' : 'w-full min-[1200px]:w-1/2 h-[600px] min-[1200px]:h-auto'
        }`}>
        <div className="bg-[#293653] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white tracking-wide flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-400" />
              Demands
            </h2>
            <button onClick={() => setShowMakeDemandModal(true)} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded font-medium px-3 py-1.5 text-[12px] transition-colors gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <div className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[12px] font-bold flex items-center gap-1.5">
              Demands Today: 45
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const token = localStorage.getItem('at_ki8Xq1iV');
                if (!token) return;
                const toastId = toast.loading('Refreshing demands...');
                try {
                  const res = await fetchDemandsData(token);
                  if (res.success) toast.success(res.message || 'Demands refreshed', { id: toastId });
                  else toast.error(res.message || 'Error refreshing demands', { id: toastId });
                } catch (err: any) {
                  toast.error(err.message, { id: toastId });
                }
              }}
              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMaximizedColumn(isExpanded ? null : 'demands')}
              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#1b202c]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[13px] font-medium text-white whitespace-nowrap">Dates</label>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <input
                  type="date"
                  max={todayStr}
                  value={demDateFrom}
                  onChange={(e) => setDemDateFrom(e.target.value)}
                  title="From Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  max={todayStr}
                  value={demDateTo}
                  onChange={(e) => setDemDateTo(e.target.value)}
                  title="To Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
              </div>
            </div>
            <SearchableSelectPlaceholder label="Select Status" options={demandStatusOptions} value={demStatus} onChange={setDemStatus} />
            <SearchableSelectPlaceholder label="Select Project" options={projectsOptions} value={demProject} onChange={setDemProject} />
            <SearchableSelectPlaceholder label="Select Item" options={itemsOptions} value={demItem} onChange={setDemItem} />
          </div>
        </div>

        <div className="overflow-x-auto flex-1 bg-[#232b3e] p-4 flex flex-col">
          <table className="w-full text-[12px] text-left">
            <thead className="text-[12px] text-gray-900 font-bold uppercase bg-[#cdd5df]">
              <tr>
                <th className="px-4 py-3 border-r border-[#bac4cf] w-12 text-center">SL</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">DATE</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">PROJECT</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">ITEM</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">QNTY</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">PRIORITY</th>
                <th className="px-4 py-3 text-center w-24">MORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {demandsList.map((row, idx) => (
                <tr key={row.demand_id || row.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white text-center font-medium">{(demPage - 1) * 10 + idx + 1}</td>
                  <td className="px-4 py-3 text-white">{row.demand_date || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.project_name || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.item_name || '-'}</td>
                  <td className="px-4 py-3 text-white">{row.quantity_txt || row.quantity || '-'}</td>
                  <td className="px-4 py-3 text-white text-xs">
                    <span className={`px-2 py-1 rounded-sm shadow border ${(row.priority_txt || '').toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : (row.priority_txt || '').toLowerCase() === 'medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {row.priority_txt || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedDemandNo(String(row.demand_no))}
                      className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {demandsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No demands found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">Page {demPage} of {demTotalPages}</div>
            <div className="flex gap-2">
              <button
                disabled={demPage <= 1}
                onClick={() => setDemPage(p => p - 1)}
                className="px-3 py-1 bg-[#1b202c] rounded text-white text-xs hover:bg-gray-700 disabled:opacity-50"
              >Prev</button>
              <button
                disabled={demPage >= demTotalPages}
                onClick={() => setDemPage(p => p + 1)}
                className="px-3 py-1 bg-[#1b202c] rounded text-white text-xs hover:bg-gray-700 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full relative">
      {isInitialLoading && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-sm rounded-lg border border-gray-800 m-6">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-300 font-medium tracking-wide">Loading Data...</p>
        </div>
      )}
      <div className={`flex flex-col min-[1200px]:flex-row items-stretch gap-6 ${(!showDemandsTab || maximizedColumn) ? 'h-[calc(100vh-140px)]' : 'h-auto min-[1200px]:h-[calc(100vh-140px)]'} ${maximizedColumn ? 'overflow-hidden' : ''}`}>
        {(!maximizedColumn || maximizedColumn === 'procurements') && renderProcurementsPanel()}
        {(!maximizedColumn || maximizedColumn === 'demands') && showDemandsTab && renderDemandsPanel()}
      </div>

      <MakeDemandModal
        isOpen={showMakeDemandModal}
        onClose={() => setShowMakeDemandModal(false)}
        projects={projectsOptions}
        priorities={priorityOptions}
        onSuccess={() => {
          const token = localStorage.getItem('at_ki8Xq1iV');
          if (token) {
            // You can use fetchAllData() or just fetchDemandsData. 
            // We'll call fetchDemandsData to specifically reload the demands table.
            fetchDemandsData(token);
          }
        }}
      />

      <DemandDetailModal
        isOpen={selectedDemandNo !== null}
        onClose={() => setSelectedDemandNo(null)}
        demandNo={selectedDemandNo}
        priorities={priorityOptions}
        onSuccess={() => {
          const token = localStorage.getItem('at_ki8Xq1iV');
          if (token) {
            fetchDemandsData(token, demPage, demProject, demStatus, demItem, demDateFrom, demDateTo);
          }
        }}
      />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        projects={projectsOptions}
        vendors={vendorsOptions}
        demands={demandsList}
        onSuccess={() => {
          const token = localStorage.getItem('at_ki8Xq1iV');
          if (token) fetchProcurementsData(token);
        }}
      />

      <ViewPurchaseModal
        isOpen={!!viewProcurementId}
        procurementId={viewProcurementId}
        onClose={() => setViewProcurementId(null)}
        vendors={vendorsOptions}
      />
    </div>
  );
}
