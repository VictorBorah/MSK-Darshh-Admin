'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Search,
  ChevronDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  Printer,
  Loader2,
  RefreshCw,
  Eye,
  IndianRupee,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import NewClientPayment from './NewClientPayment';
import ClientPaymentDetails from './ClientPaymentDetails';
import { generatePdfFromElement } from '@/utils/pdfGenerator';

interface ClientProject {
  project_id: string;
  project_name: string;
  project_code?: string;
  site_address?: string | null;
}

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  contract_amount?: string;
  client_mobile_1: string;
  client_mobile_2: string;
  client_email: string;
  added_on: string;
  projects_data?: ClientProject[];
}

interface PaymentRecord {
  payment_id: string;
  payment_date: string;
  project_name: string;
  project_id: string;
  payment_mode?: string;
  payment_mode_txt?: string;
  pay_mode?: string;
  amount: string | number;
  remarks?: string;
  transaction_number?: string;
  added_on?: string;
  txn_file?: string;
}

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export default function ClientPaymentModal({ isOpen, onClose, client }: ClientPaymentModalProps) {
  // Panel state
  const [isMaximized, setIsMaximized] = useState(false);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [enableBackDates, setEnableBackDates] = useState<string>('0');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Search/Filters states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPayMode, setSelectedPayMode] = useState<string>('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [payModeSearchQuery, setPayModeSearchQuery] = useState('');

  // Dropdown states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPayModeDropdownOpen, setIsPayModeDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Custom Date range states (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [applyDateRange, setApplyDateRange] = useState<boolean>(false);

  // Temp selections inside the calendar popup
  const [calMonth, setCalMonth] = useState<Date>(new Date(2026, 4)); // Default to May 2026 per mockup
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);

  // Double Overlays states
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  // DOM Refs for dropdown outside clicks
  const projectRef = useRef<HTMLDivElement>(null);
  const payModeRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const printTableRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (payModeRef.current && !payModeRef.current.contains(event.target as Node)) {
        setIsPayModeDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch session parameters (payment modes) on load
  useEffect(() => {
    if (isOpen) {
      const fetchAppConfig = async () => {
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const text = await res.text();
          let arr;
          try { arr = JSON.parse(text); } catch { return; }
          const data = Array.isArray(arr) ? arr[0] : arr;
          if (data && (String(data.Status) === '1' || data.Status === 1)) {
            setPaymentModes(data.paymentmodes_Arr || []);
            if (data.System_Data && data.System_Data.enableBackDates) {
              setEnableBackDates(String(data.System_Data.enableBackDates));
            }
          }
        } catch (e) {
          console.error('Failed to load session configurations', e);
        }
      };
      fetchAppConfig();
    }
  }, [isOpen]);

  // Helpers: date formatting & calendar range operations
  const convertInputToApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-'); // [YYYY, MM, DD]
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const formatDateToInputString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDisplayDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const generateDaysForMonth = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    // Pad previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Pad next month days
    const totalSlots = 42;
    const nextPad = totalSlots - days.length;
    for (let i = 1; i <= nextPad; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (isFutureDate(date)) return;

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
      setFromDate(formatDateToInputString(date));
      setToDate('');
    } else if (tempStart && !tempEnd) {
      if (date >= tempStart) {
        setTempEnd(date);
        setToDate(formatDateToInputString(date));
        setIsCalendarOpen(false); // choice finalized, close popover
      } else {
        setTempStart(date);
        setFromDate(formatDateToInputString(date));
      }
    }
  };

  // REST API Payments Fetching
  const fetchClientPayments = useCallback(async (page: number) => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';

      let url = `${baseUrl}admin/fetchClientPayments?client_id=${client.client_id}&pagenum=${page}`;

      if (selectedProjectId) {
        url += `&project_id=${selectedProjectId}`;
      }
      if (selectedPayMode) {
        url += `&pay_mode=${selectedPayMode}`;
      }
      if (applyDateRange) {
        if (fromDate) {
          url += `&from_date=${convertInputToApiDate(fromDate)}`;
        }
        if (toDate) {
          url += `&to_date=${convertInputToApiDate(toDate)}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Server connection error (HTTP ${response.status})`);
      }

      const rawText = await response.text();
      let arr;
      try {
        arr = JSON.parse(rawText);
      } catch (err) {
        throw new Error('Invalid JSON received from payments API');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Payments retrieved successfully', { id: 'payments-toast' });
        setPaymentsList(data.payment_data || []);

        // Sum total calculations
        if (data.total_amount !== undefined) {
          setTotalAmount(parseFloat(data.total_amount || '0'));
        } else {
          const calculated = (data.payment_data || []).reduce((acc: number, row: PaymentRecord) => {
            const amt = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount || '0');
            return acc + amt;
          }, 0);
          setTotalAmount(calculated);
        }

        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setTotalRows(total);
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
        setCurrentPage(page);
      } else {
        setPaymentsList([]);
        setTotalAmount(0);
        setTotalPages(1);
        toast.error(data?.Message || 'No payment records located', { id: 'payments-toast' });
      }
    } catch (error: any) {
      console.error('Fetch payments error:', error);
      toast.error(error.message || 'Error occurred fetching payments data', { id: 'payments-toast' });
      setPaymentsList([]);
      setTotalAmount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [client, selectedProjectId, selectedPayMode, fromDate, toDate, applyDateRange]);

  // Trigger loading list on filters or pagination adjustment
  useEffect(() => {
    if (isOpen && client) {
      fetchClientPayments(1);
    }
  }, [isOpen, client, selectedProjectId, selectedPayMode, applyDateRange, fromDate, toDate, fetchClientPayments]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchClientPayments(newPage);
    }
  };

  const handleReload = () => {
    fetchClientPayments(currentPage);
  };

  const handlePrintToPDF = async () => {
    if (!printTableRef.current || !client) return;
    const filename = `payments_ledger_${client.client_name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    await generatePdfFromElement(
      printTableRef.current,
      filename,
      `Zyn Construction Network - Client: ${client.client_name}`
    );
  };

  if (!isOpen || !client) return null;

  // Filter components lists
  const filteredProjects = client.projects_data
    ? client.projects_data.filter(p => p.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase()))
    : [];

  const filteredPayModes = paymentModes
    ? paymentModes.filter(m => m.mode.toLowerCase().includes(payModeSearchQuery.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[900px] max-w-[95vw] h-[85vh] max-h-[90vh]'
        }`}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
              Client Payments: <span className="text-blue-400 font-extrabold">{client.client_name}</span>
            </h2>
            <button
              onClick={handleReload}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Reload payments list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-white' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded cursor-pointer"
              title={isMaximized ? "Restore size" : "Maximize view"}
            >
              {isMaximized ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inner Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col gap-6 relative">

          {/* Loading Indicator Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-[2px]">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-300 font-semibold text-[13px] tracking-wide">Fetching Payments...</p>
            </div>
          )}

          {/* Filters Bar */}
          <div className="relative z-40 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-800/80 bg-[#181d2a]/95 shadow-xl backdrop-blur-md shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-grow">

              {/* Project Searchable Dropdown */}
              <div className="relative flex-grow lg:max-w-[200px]" ref={projectRef}>
                <div
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all"
                >
                  <span className="font-semibold text-[12.5px] truncate">
                    {selectedProjectId
                      ? (client.projects_data?.find(p => p.project_id === selectedProjectId)?.project_name || 'Select Project')
                      : 'Select Project'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isProjectDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-gray-800 bg-[#161a26] shadow-2xl p-2 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search project..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-[12.5px] rounded-lg border border-gray-800 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      autoFocus
                    />
                    <div className="space-y-1">
                      <div
                        onClick={() => {
                          setSelectedProjectId('');
                          setIsProjectDropdownOpen(false);
                          setProjectSearchQuery('');
                        }}
                        className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all ${selectedProjectId === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1f2536]'
                          }`}
                      >
                        All Projects
                      </div>
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((p) => (
                          <div
                            key={p.project_id}
                            onClick={() => {
                              setSelectedProjectId(p.project_id);
                              setIsProjectDropdownOpen(false);
                              setProjectSearchQuery('');
                            }}
                            className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all ${selectedProjectId === p.project_id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1f2536]'
                              }`}
                          >
                            <div className="truncate">{p.project_name}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-center py-2 text-[11px]">No projects found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Mode Searchable Dropdown */}
              <div className="relative flex-grow lg:max-w-[200px]" ref={payModeRef}>
                <div
                  onClick={() => setIsPayModeDropdownOpen(!isPayModeDropdownOpen)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all"
                >
                  <span className="font-semibold text-[12.5px] truncate">
                    {selectedPayMode
                      ? (paymentModes.find(m => String(m.id) === selectedPayMode)?.mode || 'Payment Mode')
                      : 'Payment Mode'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isPayModeDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isPayModeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-gray-800 bg-[#161a26] shadow-2xl p-2 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search mode..."
                      value={payModeSearchQuery}
                      onChange={(e) => setPayModeSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-[12.5px] rounded-lg border border-gray-800 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      autoFocus
                    />
                    <div className="space-y-1">
                      <div
                        onClick={() => {
                          setSelectedPayMode('');
                          setIsPayModeDropdownOpen(false);
                          setPayModeSearchQuery('');
                        }}
                        className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all ${selectedPayMode === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1f2536]'
                          }`}
                      >
                        All Modes
                      </div>
                      {filteredPayModes.length > 0 ? (
                        filteredPayModes.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedPayMode(String(m.id));
                              setIsPayModeDropdownOpen(false);
                              setPayModeSearchQuery('');
                            }}
                            className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all ${selectedPayMode === String(m.id) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1f2536]'
                              }`}
                          >
                            <div className="truncate">{m.mode}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-center py-2 text-[11px]">No payment modes found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Range Picker Popover */}
              <div className="relative flex-grow lg:max-w-[200px]" ref={calendarRef}>
                <div
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[12.5px] font-semibold text-gray-300 truncate max-w-[120px]">
                      {fromDate && toDate
                        ? `${formatDisplayDateString(fromDate)} to ${formatDisplayDateString(toDate)}`
                        : fromDate
                          ? `${formatDisplayDateString(fromDate)} to ...`
                          : 'Select dates...'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </div>

                {isCalendarOpen && (
                  <div className="absolute right-0 lg:left-0 mt-2 z-50 rounded-2xl border border-gray-800 bg-[#161a26] text-white shadow-2xl p-4 w-76">
                    <div className="flex items-center justify-between border-b border-gray-800/40 pb-3 mb-3">
                      <button
                        onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                        className="p-1 rounded border border-gray-800 hover:bg-gray-800/30 transition text-xs font-mono"
                      >
                        &larr;
                      </button>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {calMonth.toLocaleString('default', { month: 'long' })} {calMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                        className="p-1 rounded border border-gray-800 hover:bg-gray-800/30 transition text-xs font-mono"
                      >
                        &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 uppercase mb-2">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {generateDaysForMonth().map((day, idx) => {
                        const isFuture = isFutureDate(day.date);
                        const isSelected = tempStart && (
                          (tempStart.getTime() === day.date.getTime()) ||
                          (tempEnd && tempEnd.getTime() === day.date.getTime()) ||
                          (tempEnd && day.date > tempStart && day.date < tempEnd)
                        );
                        const isInBetween = tempStart && tempEnd && day.date > tempStart && day.date < tempEnd;

                        return (
                          <div
                            key={idx}
                            onClick={() => !isFuture && handleDateClick(day.date)}
                            className={`h-7 w-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${isFuture
                                ? 'text-gray-700 opacity-25 cursor-not-allowed bg-transparent'
                                : !day.isCurrentMonth
                                  ? 'text-gray-600 opacity-40 hover:bg-gray-800/40 cursor-pointer'
                                  : 'text-white hover:bg-gray-800 cursor-pointer'
                              } ${isSelected && !isFuture
                                ? 'bg-blue-600 text-white rounded-lg font-extrabold'
                                : isInBetween && !isFuture
                                  ? 'bg-blue-500/20 text-blue-400 rounded-lg'
                                  : ''
                              }`}
                          >
                            {day.date.getDate()}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800/40 flex justify-between items-center text-[10px]">
                      <button
                        onClick={() => {
                          setTempStart(null);
                          setTempEnd(null);
                          setFromDate('');
                          setToDate('');
                        }}
                        className="text-gray-400 hover:text-white underline cursor-pointer"
                      >
                        Clear
                      </button>
                      <span className="text-blue-500 font-extrabold truncate max-w-[130px]">
                        {tempStart ? formatDisplayDateString(formatDateToInputString(tempStart)) : ''} {tempEnd ? `to ${formatDisplayDateString(formatDateToInputString(tempEnd))}` : tempStart ? 'to ...' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Date Range Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 py-2">
                <input
                  type="checkbox"
                  checked={applyDateRange}
                  onChange={(e) => setApplyDateRange(e.target.checked)}
                  className="hidden"
                />
                {applyDateRange ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-500 shrink-0" />
                )}
                <span className="text-[12.5px] font-bold text-gray-300 whitespace-nowrap">
                  Apply Date Range
                </span>
              </label>

            </div>

            {/* +New Payment Button */}
            <button
              onClick={() => setIsNewPaymentOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-1.5 text-xs whitespace-nowrap"
            >
              + New Payment
            </button>
          </div>

          {/* Ledger Table Container inside print limits */}
          <div ref={printTableRef} className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-gray-400 font-medium bg-[#1f2536] border-b border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 w-12 text-center">SL</th>
                    <th className="px-5 py-4 w-32">DATE</th>
                    <th className="px-5 py-4">PROJECT</th>
                    <th className="px-5 py-4 w-40">PAY MODE</th>
                    <th className="px-5 py-4 w-20 text-center" data-html2canvas-ignore="true">FILE</th>
                    <th className="px-5 py-4 w-20 text-center" data-html2canvas-ignore="true">VIEW</th>
                    <th className="px-5 py-4 w-32 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#161a25] text-gray-300">
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500 text-xs italic">
                        No payments found matching selected filter options.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((payment, idx) => {
                      const num = (currentPage - 1) * 10 + (idx + 1);
                      const displayAmt = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount || '0');
                      return (
                        <tr
                          key={payment.payment_id || idx}
                          className="hover:bg-[#1f2536] transition-colors"
                        >
                          <td className="px-5 py-3.5 text-center text-gray-500 font-semibold">{num}</td>
                          <td className="px-5 py-3.5 font-mono text-[12.5px]">{payment.payment_date}</td>
                          <td className="px-5 py-3.5 text-white font-bold">{payment.project_name}</td>
                          <td className="px-5 py-3.5 font-semibold text-gray-400 uppercase text-[12px]">
                            {payment.payment_mode || payment.payment_mode_txt || payment.pay_mode || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center" data-html2canvas-ignore="true">
                            {payment.txn_file ? (
                              <a
                                href={payment.txn_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-600/10 rounded transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Download transaction receipt"
                              >
                                <Download className="w-4.5 h-4.5" />
                              </a>
                            ) : (
                              <button
                                disabled
                                className="p-1 text-gray-600 rounded inline-flex items-center justify-center cursor-not-allowed opacity-35"
                                title="No receipt document attached"
                              >
                                <Download className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center" data-html2canvas-ignore="true">
                            <button
                              onClick={() => setViewingPayment(payment)}
                              className="p-1 text-blue-400 hover:text-blue-200 hover:bg-blue-600/10 rounded transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="View voucher details"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-400 text-[13.5px]">
                            <div className="flex items-center justify-end gap-0.5">
                              <IndianRupee className="w-3.5 h-3.5" />
                              {displayAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-800 text-[12.5px] text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0" data-html2canvas-ignore="true">
              <span>Page {currentPage} of {totalPages} ({totalRows} Total rows fetched)</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Area */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-between items-center z-25">
          <div className="bg-emerald-950/60 text-emerald-400 px-4 py-2.5 rounded-lg font-bold border border-emerald-500/25 flex items-center shadow-inner gap-2 text-[14px]">
            <span>Total Amount:</span>
            <span className="flex items-center font-black">
              <IndianRupee className="w-4 h-4" />
              {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintToPDF}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-md"
            >
              <Printer className="w-4 h-4" /> PRINT TO PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-semibold border border-gray-700"
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>

      {/* Double Overlays */}
      <NewClientPayment
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        client={client}
        paymentModes={paymentModes}
        enableBackDates={enableBackDates}
        onSuccess={handleReload}
      />

      <ClientPaymentDetails
        isOpen={!!viewingPayment}
        onClose={() => setViewingPayment(null)}
        payment={viewingPayment}
        clientName={client.client_name}
      />

    </div>
  );
}
