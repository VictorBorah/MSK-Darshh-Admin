'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Calendar, RefreshCw, CheckSquare, Square, ChevronDown, HardHat, Package, CalendarDays, IndianRupee, CreditCard, Landmark, CheckCircle, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth, Project } from '@/components/providers/AuthProvider';

// 1. Define explicit TypeScript interfaces for strict Type safety
interface BreakupItem {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface DashboardData {
  project_info: {
    project_id?: string;
    project_name?: string;
    project_code?: string;
    site_address?: string;
    district_id?: string;
    district_name?: string;
    client_id?: string;
    client_name?: string;
    client_mobile?: string;
    client_email?: string;
    site_coordinates?: string;
    current_stage_id?: string;
    current_stage?: string;
    max_budget?: string;
    contract_amount?: string;
    budget_trigger?: string;
    start_date?: string;
    target_date?: string;
    elapsed_days?: string;
  };
  card_statistics: {
    total_purchases?: string;
    total_payments?: string;
    total_staff?: string;
    total_workers?: string;
    total_stock_items?: string;
    elapsed_days?: string;
  };
  pie_data?: {
    status?: string;
    data?: {
      total_expenditure?: number;
      breakup?: BreakupItem[];
    };
  };
  barchart_data?: {
    status?: string;
    data?: {
      labels: string[];
      datasets: Array<{
        label: string;
        values: number[];
        colors: string[];
      }>;
    };
  };
}

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Consume projects, default project metadata from AuthContext
  const { projects, defaultProject, isLoadingAppData } = useAuth();

  // Dashboard API and Active state management
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isReportsLoading, setIsReportsLoading] = useState<boolean>(false);
  const [showWarningBanner, setShowWarningBanner] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Date Range state
  const [dateRangeStr, setDateRangeStr] = useState('22-05-2026 to 29-05-2026');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [applyDaterange, setApplyDaterange] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date(2026, 4)); // May 2026
  const [tempStart, setTempStart] = useState<Date | null>(new Date(2026, 4, 22));
  const [tempEnd, setTempEnd] = useState<Date | null>(new Date(2026, 4, 29));
  const dateRef = useRef<HTMLDivElement>(null);

  // Close search & date picker popovers on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dismiss Toast auto-timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync Default Project on Initial Load
  useEffect(() => {
    if (!isLoadingAppData && projects) {
      const hasDefaultProject = defaultProject && String(defaultProject) !== "0" && String(defaultProject).trim() !== "";

      if (!hasDefaultProject && !activeProject) {
        setShowWarningBanner(true);
        setIsReportsLoading(false);
      } else if (hasDefaultProject && !activeProject) {
        // Find default project from loaded projects
        const matched = projects.find((p: Project) => String(p.project_id) === String(defaultProject));
        if (matched) {
          setActiveProject(matched);
          setShowWarningBanner(false);
        } else {
          setShowWarningBanner(true);
        }
      }
    }
  }, [isLoadingAppData, defaultProject, projects, activeProject]);

  // REST API Reports Data Fetching
  const fetchDashboardReportData = useCallback(async (projId: string) => {
    if (!projId) return;
    setIsReportsLoading(true);

    const getFormattedDate = (d: Date | null) => {
      if (!d) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const fromDate = applyDaterange && tempStart ? getFormattedDate(tempStart) : '';
    const toDate = applyDaterange && tempEnd ? getFormattedDate(tempEnd) : '';

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const url = `${baseUrl}reports/fetchDashboardData?project_id=${projId}&from_date=${fromDate}&to_date=${toDate}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('API server returned connection error');
      }

      const rawText = await res.text();
      let resDataArr;
      try {
        resDataArr = JSON.parse(rawText);
      } catch {
        throw new Error('Response payload parsing failed');
      }

      const resData = Array.isArray(resDataArr) ? resDataArr[0] : resDataArr;

      if (resData) {
        const isSuccess = String(resData.Status) === "1";

        setToast({
          message: resData.Message || (isSuccess ? 'Dashboard statistics updated' : 'Reports fetch error'),
          type: isSuccess ? 'success' : 'error'
        });

        if (isSuccess && resData.dashboard_data) {
          setDashboardData(resData.dashboard_data);
        } else {
          setDashboardData(null);
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error("Dashboard Fetch Error:", err);
      setToast({
        message: err.message || 'Network connection failed. Could not reach server.',
        type: 'error'
      });
      setDashboardData(null);
    } finally {
      setIsReportsLoading(false);
    }
  }, [applyDaterange, tempStart, tempEnd]);

  // Re-fetch reports automatically on Project or Date filters toggling
  useEffect(() => {
    if (activeProject && activeProject.project_id) {
      fetchDashboardReportData(activeProject.project_id);
    }
  }, [activeProject, fetchDashboardReportData]);

  // Reload Manual Control
  const handleReload = () => {
    if (activeProject && activeProject.project_id) {
      fetchDashboardReportData(activeProject.project_id);
    } else {
      setToast({
        message: 'Please select a project first to reload reports',
        type: 'error'
      });
    }
  };

  // Reset Manual Control
  const handleReset = () => {
    setApplyDaterange(false);

    const startDefault = new Date(2026, 4, 22);
    const endDefault = new Date(2026, 4, 29);
    setTempStart(startDefault);
    setTempEnd(endDefault);
    setDateRangeStr('22-05-2026 to 29-05-2026');
    setCalMonth(new Date(2026, 4));

    const hasDefaultProject = defaultProject && String(defaultProject) !== "0" && String(defaultProject).trim() !== "";
    if (hasDefaultProject && projects) {
      const matched = projects.find((p: Project) => String(p.project_id) === String(defaultProject));
      if (matched) {
        setActiveProject(matched);
        setShowWarningBanner(false);
        // Force refresh directly if already active to bypass React state dependency check latency
        if (activeProject && String(activeProject.project_id) === String(matched.project_id)) {
          setIsReportsLoading(true);
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
          const token = localStorage.getItem('at_ki8Xq1iV');
          fetch(`${baseUrl}reports/fetchDashboardData?project_id=${matched.project_id}&from_date=&to_date=`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then(res => res.json())
            .then(resDataArr => {
              const resData = Array.isArray(resDataArr) ? resDataArr[0] : resDataArr;
              if (resData && String(resData.Status) === "1" && resData.dashboard_data) {
                setDashboardData(resData.dashboard_data);
              }
              setIsReportsLoading(false);
            })
            .catch(() => setIsReportsLoading(false));
        }
      } else {
        setActiveProject(null);
        setShowWarningBanner(true);
        setDashboardData(null);
      }
    } else {
      setActiveProject(null);
      setShowWarningBanner(true);
      setDashboardData(null);
    }

    setToast({
      message: 'Dashboard settings reset to initial state',
      type: 'success'
    });
  };

  // Filter project list based on search query from live API projects
  const filteredProjects = projects ? projects.filter((p: Project) =>
    (p.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.site_address || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Integrated Calendar Grid Generator
  const generateDaysForMonth = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    // Pad with previous month's ending days
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

    // Pad with next month's beginning days
    const totalSlots = 42; // standard 6 rows
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
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date >= tempStart) {
        setTempEnd(date);

        const fmtStart = formatDate(tempStart);
        const fmtEnd = formatDate(date);
        setDateRangeStr(`${fmtStart} to ${fmtEnd}`);
        setIsDateOpen(false);
      } else {
        setTempStart(date);
      }
    }
  };

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isSelectedRange = (date: Date) => {
    if (!tempStart) return false;
    if (tempStart.getTime() === date.getTime()) return true;
    if (tempEnd && tempEnd.getTime() === date.getTime()) return true;
    if (tempEnd && date > tempStart && date < tempEnd) return true;
    return false;
  };

  const isBetweenRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    return date > tempStart && date < tempEnd;
  };

  // Safe dashboard statistics extraction with placeholders
  const info = dashboardData?.project_info || {};
  const stats = dashboardData?.card_statistics || {};

  // Donut SVG Calculations (Radius = 65)
  const pieRadius = 65;
  const pieCircumference = 2 * Math.PI * pieRadius;

  // Extract and calculate dynamic Pie data percentages from API breakup list
  const breakupArray = dashboardData?.pie_data?.data?.breakup || [];
  const matObj = breakupArray.find((item: BreakupItem) => item.category === 'Material');
  const nonMatObj = breakupArray.find((item: BreakupItem) =>
    item.category.includes('Non Material') ||
    item.category.includes('Non-Material') ||
    item.category === 'Non Material'
  );

  const matPercentage = matObj ? Number(matObj.percentage) : 0;
  const nonMatPercentage = nonMatObj ? Number(nonMatObj.percentage) : 0;

  const matDashArray = `${(matPercentage / 100) * pieCircumference} ${pieCircumference}`;
  const nonMatDashOffset = -((matPercentage / 100) * pieCircumference);

  // Dynamic Bar Chart Mappings
  const barRaw = dashboardData?.barchart_data?.data || { labels: [], datasets: [{ values: [], colors: [] }] };
  const mappedBarData = (barRaw.labels || []).map((label: string, index: number) => ({
    label: label,
    value: barRaw.datasets?.[0]?.values?.[index] || 0,
    color: barRaw.datasets?.[0]?.colors?.[index] || '#3b82f6'
  }));

  // Border and container UI designs based on theme configurations
  const mainBorderClass = isDark
    ? 'border border-gray-800/80 bg-[#161a25]/95 shadow-xl backdrop-blur-md rounded-xl p-[1px] bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-emerald-500/15'
    : 'border border-gray-200 bg-white shadow-md rounded-xl p-[1px]';

  const cardInnerClass = isDark
    ? 'bg-[#121620] h-full w-full rounded-xl p-6 flex flex-col justify-between transition-all duration-300'
    : 'bg-[#ffffff] h-full w-full rounded-xl p-6 flex flex-col justify-between transition-all duration-300';

  const infoGradientClass = isDark
    ? 'bg-gradient-to-br from-[#121727] via-[#0f121d] to-[#0c0e18] border border-blue-500/20 text-[#ccd6f6]'
    : 'bg-[#ffffff] border border-gray-200 text-gray-800';

  // 5. Full Screen Sync Loader for initial app validations
  if (isLoadingAppData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e121e] text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-[14px] font-semibold text-gray-400">Loading App Configuration...</span>
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-8 min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>

      {/* Warning Alert Banner for unset default project */}
      {showWarningBanner && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-center gap-3.5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[14.5px] font-bold text-amber-300">Default Project Not Set</span>
            <span className="text-[13px] text-gray-300 mt-0.5">Please select a Project from the dropdown first to view real-time operations, telemetry, and financial analysis.</span>
          </div>
        </div>
      )}

      {/* Custom sliding glassmorphism toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/80 border-rose-500/30 text-rose-400'
            }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="text-[13.5px] font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header Bar containing controls */}
      <div className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8 p-4 rounded-xl border ${isDark ? 'bg-[#181d2a]/90 border-gray-800/70 shadow-lg' : 'bg-white border-gray-200/80 shadow-sm'
        }`}>

        {/* Left Side: Dynamic Selector & Datepicker */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-grow max-w-4xl">

          {/* Searchable Dropdown Selector */}
          <div className="relative flex-grow md:max-w-xs" ref={searchRef}>
            <div
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border cursor-pointer select-none transition-all ${isDark
                  ? 'bg-[#111522] border-gray-800 text-white hover:border-gray-700'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Search className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <span className="font-semibold text-[14px] truncate">
                  {activeProject ? activeProject.project_name : 'Select a Project...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isSearchOpen ? 'rotate-180' : ''}`} />
            </div>

            {isSearchOpen && (
              <div className={`absolute left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl p-2 max-h-72 overflow-y-auto ${isDark ? 'bg-[#161a26] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                <input
                  type="text"
                  placeholder="Search project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-3 py-2 text-[13px] rounded-lg border mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-[#111522] border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  autoFocus
                />
                <div className="space-y-1">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p: Project) => (
                      <div
                        key={p.project_id}
                        onClick={() => {
                          setActiveProject(p);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setShowWarningBanner(false);
                        }}
                        className={`px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${activeProject?.project_id === p.project_id
                            ? 'bg-blue-600 text-white'
                            : isDark ? 'text-gray-300 hover:bg-[#1f2536]' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <div className="font-semibold truncate">{p.project_name}</div>
                        <div className={`text-[11px] mt-0.5 ${activeProject?.project_id === p.project_id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {p.site_address}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4 text-[12px]">No projects found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Integrated Date Range Picker Dropdown */}
          <div className="relative flex-grow md:max-w-[400px] md:min-w-[360px]" ref={dateRef}>
            <div className="flex items-center gap-3">

              <div
                onClick={() => setIsDateOpen(!isDateOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border cursor-pointer select-none transition-all flex-grow ${isDark
                    ? 'bg-[#111522] border-gray-800 text-white hover:border-gray-700'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2 overflow-hidden shrink-0">
                  <Calendar className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <span className="text-[13px] font-bold text-gray-400 hidden sm:inline whitespace-nowrap">Date Range:</span>
                  <span className={`text-[13.5px] font-mono font-bold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {dateRangeStr}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isDateOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Apply checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 py-2">
                <input
                  type="checkbox"
                  checked={applyDaterange}
                  onChange={(e) => setApplyDaterange(e.target.checked)}
                  className="hidden"
                />
                {applyDaterange ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-[13px] font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Apply Daterange</span>
              </label>

            </div>

            {/* Float Date Range Calendar Dropdown */}
            {isDateOpen && (
              <div className={`absolute left-0 mt-2 z-50 rounded-2xl border shadow-2xl p-4 w-78 md:w-84 ${isDark ? 'bg-[#161a26] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                }`}>
                <div className="flex items-center justify-between border-b border-gray-800/40 pb-3 mb-3">
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                    className="p-1.5 rounded-lg border border-gray-800/60 hover:bg-gray-800/30 transition text-[13px]"
                  >
                    &larr;
                  </button>
                  <span className="text-[14px] font-extrabold uppercase tracking-wide">
                    {calMonth.toLocaleString('default', { month: 'long' })} {calMonth.getFullYear()}
                  </span>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                    className="p-1.5 rounded-lg border border-gray-800/60 hover:bg-gray-800/30 transition text-[13px]"
                  >
                    &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateDaysForMonth().map((day, idx) => {
                    const isSelected = isSelectedRange(day.date);
                    const isInBetween = isBetweenRange(day.date);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDateClick(day.date)}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-bold cursor-pointer transition-all ${!day.isCurrentMonth ? 'text-gray-600 opacity-40' : ''
                          } ${isSelected
                            ? 'bg-blue-600 text-white rounded-lg shadow-md font-extrabold'
                            : isInBetween
                              ? 'bg-blue-500/20 text-blue-400 rounded-lg'
                              : isDark ? 'hover:bg-gray-800/60' : 'hover:bg-slate-100'
                          }`}
                      >
                        {day.date.getDate()}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                  <span className="text-gray-400 font-medium">Selected Period</span>
                  <span className="text-blue-500 font-extrabold">
                    {tempStart ? formatDate(tempStart) : ''} {tempEnd ? `to ${formatDate(tempEnd)}` : '...'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Reload & Reset dashboard controls */}
        <div className="flex items-center gap-3 self-end xl:self-auto">

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isReportsLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-[13px] cursor-pointer transition-all hover:scale-[1.02] ${isReportsLoading ? 'opacity-70' : ''
              } ${isDark
                ? 'bg-[#181d2a]/80 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-700 shadow-sm'
              }`}
          >
            <RotateCcw className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Reset</span>
          </button>

          {/* Reload Button */}
          <button
            onClick={handleReload}
            disabled={isReportsLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-[13px] cursor-pointer transition-all hover:scale-[1.02] ${isReportsLoading ? 'opacity-70' : ''
              } ${isDark
                ? 'bg-[#181d2a] border-gray-800 text-blue-400 hover:border-gray-700 hover:text-blue-300'
                : 'bg-slate-50 border-slate-200 text-blue-600 hover:border-slate-300 hover:text-blue-700 shadow-sm'
              }`}
          >
            {isReportsLoading ? (
              <Loader2 className="w-4.5 h-4.5 text-blue-500 animate-spin shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            <span>Reload</span>
          </button>

        </div>

      </div>

      {/* 2. 6 Large metrics cards row */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 xl:gap-5 mb-8 transition-all duration-500 ${isReportsLoading ? 'opacity-40 translate-y-2' : 'opacity-100'
        }`}>

        {/* Metric 1: Total Purchases */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Total Purchases</span>
              <IndianRupee className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none flex items-center gap-0.5">
                <span className="text-xl xl:text-2xl text-gray-400 font-normal">₹</span>{stats.total_purchases || '0.00'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Live Material costs</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Payments */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Payments</span>
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none flex items-center gap-0.5">
                <span className="text-xl xl:text-2xl text-gray-400 font-normal">₹</span>{stats.total_payments || '0.00'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Allocated funds</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Office Staff */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Office Staff</span>
              <Landmark className="w-5 h-5 text-purple-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none">
                {stats.total_staff || '0'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Active management</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Workers */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Workers</span>
              <HardHat className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none">
                {stats.total_workers || '0'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">On-site workforce</span>
            </div>
          </div>
        </div>

        {/* Metric 5: Items */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Items</span>
              <Package className="w-5 h-5 text-teal-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none">
                {stats.total_stock_items || '0'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Stock catalog count</span>
            </div>
          </div>
        </div>

        {/* Metric 6: Days */}
        <div className={mainBorderClass}>
          <div className={cardInnerClass}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Days</span>
              <CalendarDays className="w-5 h-5 text-rose-500" />
            </div>
            <div className="mt-1">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight font-mono text-white leading-none">
                {stats.elapsed_days || '0'}
              </h2>
              <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Calendar elapsed</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Grid area containing Project Information, Pie Chart, and Bar Chart */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-8 transition-all duration-500 ${isReportsLoading ? 'opacity-40 translate-y-3' : 'opacity-100'
        }`}>

        {/* Project Information Details - Span 6 */}
        <div className="lg:col-span-6 flex flex-col">
          <div className={`${mainBorderClass} h-full flex flex-col`}>
            <div className={`${cardInnerClass} flex-grow flex flex-col p-6`}>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/40">
                <Landmark className="w-5 h-5 text-blue-500" />
                <h3 className="text-blue-500 font-black text-[16px] uppercase tracking-wider">Project Information</h3>
              </div>

              <div className={`rounded-xl p-5 flex-grow shadow-inner ${infoGradientClass}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Left Column: Identity, Location, GPS & Client Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">Project Identity</h4>
                      <p className="text-[15px] font-black text-blue-400 mt-1">{info.project_name || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">Location</h4>
                        <p className="text-[13px] font-bold text-white mt-0.5">{info.site_address || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">District</h4>
                        <p className="text-[13px] font-bold text-white mt-0.5">{info.district_name || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">GPS Coordinates</h4>
                      <p className="text-[11.5px] font-semibold text-gray-300 font-mono mt-0.5 select-all break-all bg-black/30 p-2 rounded-lg leading-relaxed">
                        {info.site_coordinates || 'N/A'}
                      </p>
                    </div>

                    <div className="border-t border-gray-800/30 pt-3">
                      <h4 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">Client Details</h4>
                      <div className="space-y-1.5 text-[12.5px]">
                        <p className="font-bold flex items-center justify-between text-white">
                          <span className="text-gray-400 font-medium">Name:</span> {info.client_name || 'N/A'}
                        </p>
                        <p className="font-bold flex items-center justify-between text-white">
                          <span className="text-gray-400 font-medium">Mobile:</span> {info.client_mobile || 'N/A'}
                        </p>
                        <p className="font-bold flex items-center justify-between text-white">
                          <span className="text-gray-400 font-medium">Email:</span> {info.client_email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Stage, Financials, and Timeline */}
                  <div className="space-y-4">
                    <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3">
                      <h4 className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider">Current Active Stage</h4>
                      <p className="text-[13.5px] font-black text-emerald-400 mt-1 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                        {info.current_stage || 'N/A'}
                      </p>
                    </div>

                    <div className="border-t border-gray-800/30 pt-3 space-y-2 text-[12.5px]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Contract Amount</span>
                        <span className="font-bold font-mono text-white">₹{info.contract_amount || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Total Expenditure</span>
                        <span className="font-bold font-mono text-white">₹{dashboardData?.pie_data?.data?.total_expenditure || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Allocated Budget</span>
                        <span className="font-bold font-mono text-white">₹{info.max_budget || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Trigger Threshold</span>
                        <span className="font-bold font-mono text-rose-400">₹{info.budget_trigger || '0.00'}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-800/30 pt-3 grid grid-cols-2 gap-4 text-[12.5px]">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase">Start Date</h4>
                        <p className="font-bold text-white mt-0.5 font-mono">{info.start_date || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase">Elapsed Days</h4>
                        <p className="font-bold text-white mt-0.5 font-mono">{info.elapsed_days || '0'} Days</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-800/30 pt-3 flex justify-between items-center text-[12.5px]">
                      <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Target Deadline</span>
                      <span className="font-bold font-mono text-white">{info.target_date || 'N/A'}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Expenses Breakup Pie Chart - Span 3 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className={`${mainBorderClass} h-full flex flex-col`}>
            <div className={`${cardInnerClass} flex-grow flex flex-col p-6 items-center justify-between`}>

              <div className="w-full flex items-center gap-3 mb-4 pb-3 border-b border-gray-800/40">
                <Landmark className="w-5 h-5 text-blue-500" />
                <h3 className="text-blue-500 font-black text-[15px] uppercase tracking-wider">Expenses Breakup</h3>
              </div>

              {/* Responsive SVG Pie Chart Component */}
              <div className="relative w-full aspect-square max-w-[170px] flex items-center justify-center my-2">
                <svg width="145" height="145" viewBox="0 0 200 200" className="transform -rotate-90">
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>

                  {/* Segment 1: Material */}
                  <circle
                    cx="100"
                    cy="100"
                    r={pieRadius}
                    fill="transparent"
                    stroke="url(#blueGrad)"
                    strokeWidth="45"
                    strokeDasharray={matDashArray}
                    className="transition-all duration-1000 ease-out hover:opacity-90 cursor-pointer"
                  />

                  {/* Segment 2: Non-Material */}
                  <circle
                    cx="100"
                    cy="100"
                    r={pieRadius}
                    fill="transparent"
                    stroke="url(#orangeGrad)"
                    strokeWidth="45"
                    strokeDasharray={`${(nonMatPercentage / 100) * pieCircumference} ${pieCircumference}`}
                    strokeDashoffset={nonMatDashOffset}
                    className="transition-all duration-1000 ease-out hover:opacity-90 cursor-pointer"
                  />
                </svg>

                {/* Percentage Labels mapped inside chart center visually */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter">
                    {matPercentage}%
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-blue-400 tracking-widest mt-0.5">
                    Material
                  </span>
                </div>
              </div>

              {/* Chart Legends */}
              <div className="w-full space-y-2">

                <div className={`p-2.5 rounded-lg flex items-center justify-between border ${isDark ? 'bg-black/20 border-gray-800/40' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shrink-0"></span>
                    <span className={`text-[11.5px] font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Material</span>
                  </div>
                  <span className="font-mono font-black text-[13px] text-white">
                    {matPercentage}%
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg flex items-center justify-between border ${isDark ? 'bg-black/20 border-gray-800/40' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-lg shrink-0"></span>
                    <span className={`text-[11.5px] font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Non-Material</span>
                  </div>
                  <span className="font-mono font-black text-[13px] text-white">
                    {nonMatPercentage}%
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Budget Breakup Bar Chart - Span 3 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className={`${mainBorderClass} h-full flex flex-col`}>
            <div className={`${cardInnerClass} flex-grow flex flex-col p-6 justify-between`}>

              <div className="w-full flex items-center gap-3 mb-4 pb-3 border-b border-gray-800/40">
                <Landmark className="w-5 h-5 text-blue-500" />
                <h3 className="text-blue-500 font-black text-[15px] uppercase tracking-wider">Budget Breakup</h3>
              </div>

              {/* Bar Chart Container */}
              <div className="relative w-full flex-grow flex flex-col justify-end min-h-[130px] px-1 py-2">

                {/* Horizontal grid ticks */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none opacity-10">
                  <div className="w-full border-t border-white border-dashed text-[8px] font-mono text-gray-500 pt-0.5">100%</div>
                  <div className="w-full border-t border-white border-dashed text-[8px] font-mono text-gray-500 pt-0.5">50%</div>
                  <div className="w-full border-t border-white"></div>
                </div>

                {/* Bars flex list */}
                <div className="relative z-10 w-full h-full flex items-end justify-between gap-1.5 animate-in fade-in duration-500">
                  {mappedBarData.length > 0 ? (
                    mappedBarData.map((bar: BarItem, idx: number) => (
                      <div
                        key={idx}
                        className="flex-grow flex flex-col items-center group cursor-pointer"
                      >
                        <div className="relative w-full flex justify-center items-end h-[100px]">

                          {/* Bar Segment */}
                          <div
                            style={{ height: `${bar.value}%`, backgroundColor: bar.color }}
                            className="w-full rounded-t-[3px] transition-all duration-1000 ease-out group-hover:brightness-110 shadow-lg"
                          />

                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                            <span className="px-2 py-1 bg-slate-900 border border-gray-800 rounded-md text-[10px] font-mono font-bold text-white shadow-xl">
                              {bar.value}%
                            </span>
                            <span className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-gray-800 rotate-45 -mt-1"></span>
                          </div>

                        </div>

                        {/* Bar label */}
                        <span className="text-[8.5px] font-bold text-gray-400 mt-2.5 text-center truncate w-full tracking-tighter">
                          {bar.label}
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-8 text-[11px] w-full">No active allocations</div>
                  )}
                </div>

              </div>

              {/* Under-bar analytics summary */}
              <div className={`p-2.5 rounded-lg border mt-3 ${isDark ? 'bg-black/20 border-gray-800/40' : 'bg-slate-50 border-slate-100'
                }`}>
                <p className="text-[10.5px] font-medium text-gray-400 leading-normal text-center">
                  Expenditure values relative to budget heads.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
