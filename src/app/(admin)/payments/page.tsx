'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Maximize2, Minimize2, Settings, Calendar, IndianRupee, RefreshCcw, Loader2, ShoppingCart, ClipboardList, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import MakePaymentDemandModal from './MakePaymentDemandModal';
import PaymentDemandDetailModal from './PaymentDemandDetailModal';
import MakePaymentModal from './MakePaymentModal';
import ViewPaymentModal from './ViewPaymentModal';

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
    displayValue = selectedOption.name || selectedOption.status || selectedOption.vendor_name || selectedOption.project_name || selectedOption.item_name || selectedOption.mode || '';
  }

  const filteredOptions = options.filter(opt => {
    const name = String(opt.name || opt.status || opt.vendor_name || opt.project_name || opt.item_name || opt.mode || '').toLowerCase();
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
                const optName = opt.name || opt.status || opt.vendor_name || opt.project_name || opt.item_name || opt.mode;
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

export default function PaymentsPage() {
  const [maximizedColumn, setMaximizedColumn] = useState<'payments' | 'demands' | null>(null);
  const [showMakeDemandModal, setShowMakeDemandModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDemandNo, setSelectedDemandNo] = useState<string | null>(null);
  const [viewPaymentId, setViewPaymentId] = useState<string | null>(null);
  const [showDemandsTab, setShowDemandsTab] = useState(true);

  // Loading State for preloader
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Lookups mapped from sys/fetch_system_config
  const [paymentModesOptions, setPaymentModesOptions] = useState<any[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<any[]>([]);
  const [itemsOptions, setItemsOptions] = useState<any[]>([]);
  const [paymentStatusOptions, setPaymentStatusOptions] = useState<any[]>([]);
  const [demandStatusOptions, setDemandStatusOptions] = useState<any[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Payments Form & Data state
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [payPage, setPayPage] = useState(1);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const [payDateFrom, setPayDateFrom] = useState(thirtyDaysAgoStr);
  const [payDateTo, setPayDateTo] = useState(todayStr);
  const [payStatus, setPayStatus] = useState('');
  const [payProject, setPayProject] = useState('');
  const [payMode, setPayMode] = useState('');

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
      setPaymentModesOptions(configData.payment_modes || []);
      setProjectsOptions(configData.projects_data || []);
      setItemsOptions(configData.items_data || []);
      
      setPaymentStatusOptions([
         { id: '1', status: 'PAID' },
         { id: '2', status: 'UNPAID' }
      ]);
      setDemandStatusOptions([
         { id: '1', status: 'PAID' },
         { id: '2', status: 'UNPAID' }
      ]);
      setPriorityOptions(configData.priority_data || []);
      return { success: true, message: configData.Message };
    } else {
      return { success: false, message: configData.Message || 'System config error' };
    }
  };

  const fetchPaymentsData = async (token: string, passedPage = payPage, passedProj = payProject, passedStatus = payStatus, passedMode = payMode, passedDateFrom = payDateFrom, passedDateTo = payDateTo) => {
    const params = new URLSearchParams();
    params.set('pagenum', String(passedPage));
    params.set('is_material', '0'); // Specific to payments endpoint
    if (passedProj) params.set('project_id', passedProj);
    if (passedStatus) params.set('status', passedStatus);
    if (passedDateFrom) {
      const [yyyy, mm, dd] = passedDateFrom.split('-');
      params.set('date_from', `${dd}-${mm}-${yyyy}`);
    }
    if (passedDateTo) {
      const [yyyy, mm, dd] = passedDateTo.split('-');
      params.set('date_to', `${dd}-${mm}-${yyyy}`);
    }
    if (passedMode) params.set('pay_mode', passedMode);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/fetchPayments?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch payments');
    const data = await res.json();
    const pData = Array.isArray(data) ? data[0] : data;

    if (String(pData.Status) === '1') {
      setPaymentsList(pData.payments_data || []);
      const total = parseInt(pData.total_rows || "0", 10);
      const pageSize = parseInt(pData.pagination_size || "10", 10);
      setPayTotalPages(total && pageSize ? Math.ceil(total / pageSize) : 1);
      return { success: true, message: pData.Message };
    } else {
      return { success: false, message: pData.Message || 'Payments fetch error' };
    }
  };

  const fetchDemandsData = async (token: string, passedPage = demPage, passedProj = demProject, passedStatus = demStatus, passedItem = demItem, passedDateFrom = demDateFrom, passedDateTo = demDateTo) => {
    const params = new URLSearchParams();
    params.set('pagenum', String(passedPage));
    params.set('is_material', '0'); // Specific to non-material demands
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkShowDemands();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initial Load Context
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('at_ki8Xq1iV');
      if (!token) return;
      setIsInitialLoading(true);
      try {
        const [configResult, payResult, demResult] = await Promise.all([
          fetchSystemConfig(token),
          fetchPaymentsData(token, 1),
          fetchDemandsData(token, 1)
        ]);
        if (!configResult.success) toast.error(configResult.message);
        if (!payResult.success) toast.error(payResult.message);
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

  // Sync Independent Payments Table
  useEffect(() => {
    if (isInitialLoading) return;
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (token) fetchPaymentsData(token, payPage, payProject, payStatus, payMode, payDateFrom, payDateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPage, payProject, payStatus, payDateFrom, payDateTo, payMode]);

  // Sync Independent Demands Table
  useEffect(() => {
    if (isInitialLoading) return;
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (token) fetchDemandsData(token, demPage, demProject, demStatus, demItem, demDateFrom, demDateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demPage, demProject, demStatus, demDateFrom, demDateTo, demItem]);

  const renderPaymentsPanel = () => {
    const isExpanded = maximizedColumn === 'payments';
    return (
      <div className={`flex flex-col bg-[#232b3e] border border-gray-800 rounded shadow-lg overflow-hidden transition-all ${isExpanded ? 'fixed inset-0 z-[100] m-4 md:m-8' : (showDemandsTab ? 'w-full min-[1200px]:w-1/2 h-[600px] min-[1200px]:h-auto' : 'w-full flex-1')
        }`}>
        <div className="bg-[#293653] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white tracking-wide flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payments
            </h2>
            <button onClick={() => setShowPaymentModal(true)} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded font-medium px-3 py-1.5 text-[12px] transition-colors gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const token = localStorage.getItem('at_ki8Xq1iV');
                if (!token) return;
                const toastId = toast.loading('Refreshing payments...');
                try {
                  const res = await fetchPaymentsData(token);
                  if (res.success) toast.success(res.message || 'Payments refreshed', { id: toastId });
                  else toast.error(res.message || 'Error refreshing payments', { id: toastId });
                } catch (err: any) {
                  toast.error(err.message, { id: toastId });
                }
              }}
              className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMaximizedColumn(isExpanded ? null : 'payments')}
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
                  value={payDateFrom}
                  onChange={(e) => setPayDateFrom(e.target.value)}
                  title="From Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  max={todayStr}
                  value={payDateTo}
                  onChange={(e) => setPayDateTo(e.target.value)}
                  title="To Date"
                  className="w-[115px] bg-[#8ba0ba] border-none rounded py-1px px-1.5 text-[12px] text-gray-900 min-h-[31.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                />
              </div>
            </div>
            <SearchableSelectPlaceholder label="Select Status" options={paymentStatusOptions} value={payStatus} onChange={setPayStatus} />
            <SearchableSelectPlaceholder label="Select Project" options={projectsOptions} value={payProject} onChange={setPayProject} />
            <SearchableSelectPlaceholder label="Select Mode" options={paymentModesOptions} value={payMode} onChange={setPayMode} />
          </div>
        </div>

        <div className="overflow-x-auto flex-1 bg-[#232b3e] p-4 flex flex-col">
          <table className="w-full text-[12px] text-left">
            <thead className="text-[12px] text-gray-900 font-bold uppercase bg-[#cdd5df]">
              <tr>
                <th className="px-4 py-3 border-r border-[#bac4cf] w-12 text-center">SL</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">DATE</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">PROJECT</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">MODE</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">AMOUNT</th>
                <th className="px-4 py-3 border-r border-[#bac4cf]">STATUS</th>
                <th className="px-4 py-3 text-center w-16">MORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paymentsList.map((row, idx) => {
                 const statusText = (row.payment_status || '').toUpperCase();
                 const isPaid = statusText === 'PAID';
                 const isUnpaid = statusText === 'UNPAID' || statusText === 'UN PAID';
                 
                 return (
                  <tr key={row.payment_id || row.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white text-center font-medium">{(payPage - 1) * 10 + idx + 1}</td>
                    <td className="px-4 py-3 text-white">{row.payment_date || '-'}</td>
                    <td className="px-4 py-3 text-white">{row.project_name || '-'}</td>
                    <td className="px-4 py-3 text-white">{row.payment_mode_txt || '-'}</td>
                    <td className="px-4 py-3 text-white font-semibold">₹{row.amount || '-'}</td>
                    <td className={`px-4 py-3 font-semibold ${isPaid ? 'text-green-400' : isUnpaid ? 'text-red-400' : 'text-white'}`}>
                      {row.payment_status || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewPaymentId(String(row.payment_id || row.id))}
                        className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                 );
              })}
              {paymentsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">Page {payPage} of {payTotalPages}</div>
            <div className="flex gap-2">
              <button
                disabled={payPage <= 1}
                onClick={() => setPayPage(p => p - 1)}
                className="px-3 py-1 bg-[#1b202c] rounded text-white text-xs hover:bg-gray-700 disabled:opacity-50"
              >Prev</button>
              <button
                disabled={payPage >= payTotalPages}
                onClick={() => setPayPage(p => p + 1)}
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
                <th className="px-4 py-3 border-r border-[#bac4cf]">AMOUNT</th>
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
                  <td className="px-4 py-3 text-white font-semibold">₹{row.payment_amount || '-'}</td>
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
        {(!maximizedColumn || maximizedColumn === 'payments') && renderPaymentsPanel()}
        {(!maximizedColumn || maximizedColumn === 'demands') && showDemandsTab && renderDemandsPanel()}
      </div>

      <MakePaymentDemandModal
        isOpen={showMakeDemandModal}
        onClose={() => setShowMakeDemandModal(false)}
        projects={projectsOptions}
        priorities={priorityOptions}
        onSuccess={() => {
          const token = localStorage.getItem('at_ki8Xq1iV');
          if (token) {
            fetchDemandsData(token);
          }
        }}
      />

      <PaymentDemandDetailModal
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

      <MakePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        projects={projectsOptions}
        paymentModes={paymentModesOptions}
        demands={demandsList}
        onSuccess={() => {
          const token = localStorage.getItem('at_ki8Xq1iV');
          if (token) fetchPaymentsData(token);
        }}
      />

      <ViewPaymentModal
        isOpen={!!viewPaymentId}
        paymentId={viewPaymentId}
        onClose={() => setViewPaymentId(null)}
        paymentModes={paymentModesOptions}
      />
    </div>
  );
}
