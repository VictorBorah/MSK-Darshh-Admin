'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, RefreshCcw, Loader2, ClipboardList, Settings, X, Calendar, Search, RotateCcw, ChevronDown, ChevronUp, Lock, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useAuth } from '@/components/providers/AuthProvider';
import MakeDemandModal from './MakeDemandModal';
import DemandDetailModal from './DemandDetailModal';
import VerifyDemand from './VerifyDemand';

interface DemandRow {
  demand_id: string;
  demand_no: string;
  demand_date: string;
  project_id: string;
  project_name: string;
  item_id: string;
  item_name: string;
  quantity: string;
  quantity_txt: string;
  priority_id: string;
  priority_txt: string;
  is_locked?: string | number;
  is_verified?: string;
  verified_text?: string;
}

export default function DemandsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const hasInitializedProject = useRef(false);

  // Consume projects, default project metadata from AuthContext
  const { projects, defaultProject, isLoadingAppData } = useAuth();

  // Active Selected Project (matches dashboard/page.tsx pattern)
  const [activeProject, setActiveProject] = useState<any>(null);

  // Modals state
  const [showMakeDemandModal, setShowMakeDemandModal] = useState(false);
  const [selectedDemandNo, setSelectedDemandNo] = useState<string | null>(null);

  // Lookups fetched from sys/fetch_system_config
  const [itemsOptions, setItemsOptions] = useState<any[]>([]);
  const [demandStatusOptions, setDemandStatusOptions] = useState<any[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<any[]>([]);

  // Filter States
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [demDateFrom, setDemDateFrom] = useState(thirtyDaysAgoStr);
  const [demDateTo, setDemDateTo] = useState(todayStr);
  const [applyDaterange, setApplyDaterange] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Table Data State
  const [demandsList, setDemandsList] = useState<DemandRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Recent Demands State
  const [recentDemands, setRecentDemands] = useState<any[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [displayLevels, setDisplayLevels] = useState<'my' | 'all'>('my');
  const [recentTotalPages, setRecentTotalPages] = useState(1);
  const [recentTotalRows, setRecentTotalRows] = useState(0);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [selectedVerifyDemand, setSelectedVerifyDemand] = useState<any | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showRecentDemandsSetting, setShowRecentDemandsSetting] = useState(false);
  const [enableDefaultProjectLoadingSetting, setEnableDefaultProjectLoadingSetting] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Lookups / config
  useEffect(() => {
    if (!isMounted) return;
    const fetchConfig = async () => {
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
        const data = JSON.parse(cleanedText);
        const configData = Array.isArray(data) ? data[0] : data;

        if (configData && String(configData.Status) === '1') {
          if (configData.items_data) setItemsOptions(configData.items_data);
          if (configData.demands_status_options) setDemandStatusOptions(configData.demands_status_options);
          if (configData.priority_data) setPriorityOptions(configData.priority_data);
          if (configData.warehouse_data) setWarehouses(configData.warehouse_data);

          // Parse app_settings for showRecentDemands
          const appSettings = Array.isArray(configData.app_settings) ? configData.app_settings[0] : configData.app_settings;
          if (appSettings) {
            setShowRecentDemandsSetting(String(appSettings.showRecentDemands) === '1');
            setEnableDefaultProjectLoadingSetting(String(appSettings.enableDefaultProjectLoading) === '1');
          }
        }
      } catch (err) {
        console.error('Error loading config:', err);
      }
    };
    fetchConfig();
  }, [isMounted]);

  // Sync Default Project on Initial Load (copied from dashboard/page.tsx)
  useEffect(() => {
    if (hasInitializedProject.current) return;
    if (enableDefaultProjectLoadingSetting === null) return; // Wait for config settings to resolve

    if (enableDefaultProjectLoadingSetting === true) {
      if (!isLoadingAppData && projects && projects.length > 0) {
        const hasDefaultProject = defaultProject && String(defaultProject) !== "0" && String(defaultProject).trim() !== "";

        if (hasDefaultProject) {
          const matched = projects.find((p: any) => String(p.project_id) === String(defaultProject));
          if (matched) {
            setActiveProject(matched);
          }
        }
      }
    } else {
      setActiveProject(null); // Keep activeProject null to display all projects
    }
    hasInitializedProject.current = true;
  }, [isLoadingAppData, defaultProject, projects, enableDefaultProjectLoadingSetting]);

  // Fetch Demands Data from API
  const fetchDemandsData = useCallback(async () => {
    if (!isMounted) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      params.set('pagenum', String(currentPage));

      if (activeProject) {
        params.set('project_id', String(activeProject.project_id || activeProject.id));
      }
      if (selectedStatus) {
        params.set('status', String(selectedStatus.value));
      }
      if (selectedItem) {
        params.set('item_id', String(selectedItem.value));
      }
      if (applyDaterange) {
        if (demDateFrom) {
          const [yyyy, mm, dd] = demDateFrom.split('-');
          params.set('demand_date_from', `${dd}-${mm}-${yyyy}`);
        }
        if (demDateTo) {
          const [yyyy, mm, dd] = demDateTo.split('-');
          params.set('demand_date_to', `${dd}-${mm}-${yyyy}`);
        }
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemands?${params.toString()}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch demands');
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        setDemandsList(data.demands_data || []);
        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setTotalRows(total);
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
      } else {
        setDemandsList([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error fetching demands list');
      setDemandsList([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [isMounted, currentPage, activeProject, selectedStatus, selectedItem, applyDaterange, demDateFrom, demDateTo]);

  // Trigger demands fetch when dependency states change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDemandsData();
    }, 200);
    return () => clearTimeout(handler);
  }, [fetchDemandsData]);

  // Clear and reset recent demands when project changes or display level filter changes
  useEffect(() => {
    setRecentDemands([]);
    setRecentPage(1);
  }, [activeProject, displayLevels]);

  // Fetch Recent Demands
  const fetchRecentDemandsData = useCallback(async (pageToFetch = recentPage, append = false) => {
    if (!isMounted) return;
    setIsRecentLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      params.set('pagenum', String(pageToFetch));

      if (activeProject) {
        params.set('project_id', String(activeProject.project_id || activeProject.id));
      }
      params.set('display_levels', displayLevels);

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemizedDemands?${params.toString()}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch itemized demands');
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        const fetchedList = data.demands_data || [];
        if (append) {
          setRecentDemands(prev => {
            const combined = [...prev, ...fetchedList];
            // Remove duplicates just in case
            const uniqueMap = new Map();
            combined.forEach(item => uniqueMap.set(item.demand_id || item.demand_no || Math.random(), item));
            return Array.from(uniqueMap.values());
          });
        } else {
          setRecentDemands(fetchedList);
        }
        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setRecentTotalRows(total);
        if (total && pageSize) {
          setRecentTotalPages(Math.ceil(total / pageSize));
        } else {
          setRecentTotalPages(1);
        }
      } else {
        if (!append) setRecentDemands([]);
        setRecentTotalPages(1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error fetching recent demands list');
      if (!append) setRecentDemands([]);
      setRecentTotalPages(1);
    } finally {
      setIsRecentLoading(false);
    }
  }, [isMounted, activeProject, recentPage, displayLevels]);

  // Trigger recent demands fetch when page changes or activeProject changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecentDemandsData(recentPage, recentPage > 1);
    }, 200);
    return () => clearTimeout(handler);
  }, [fetchRecentDemandsData, recentPage]);

  // Sync selectedVerifyDemand with updated data in recentDemands list
  useEffect(() => {
    if (selectedVerifyDemand) {
      const updated = recentDemands.find(d => String(d.demand_id) === String(selectedVerifyDemand.demand_id));
      if (updated) {
        if (
          updated.quantity !== selectedVerifyDemand.quantity || 
          updated.quantity_txt !== selectedVerifyDemand.quantity_txt ||
          updated.is_verified !== selectedVerifyDemand.is_verified
        ) {
          setSelectedVerifyDemand(updated);
        }
      }
    }
  }, [recentDemands, selectedVerifyDemand]);

  const handleLoadMoreRecent = () => {
    if (recentPage < recentTotalPages && !isRecentLoading) {
      setRecentPage(prev => prev + 1);
    }
  };

  const handleDemandActionSuccess = useCallback(() => {
    fetchDemandsData();
    setRecentPage(1);
    fetchRecentDemandsData(1, false);
  }, [fetchDemandsData, fetchRecentDemandsData]);

  // Reset Control
  const handleReset = () => {
    setApplyDaterange(false);
    setDemDateFrom(thirtyDaysAgoStr);
    setDemDateTo(todayStr);
    setSelectedStatus(null);
    setSelectedItem(null);
    setShowMoreFilters(false);
    setCurrentPage(1);
    setRecentPage(1); // Reset recent demands page

    const hasDefaultProject = defaultProject && String(defaultProject) !== "0" && String(defaultProject).trim() !== "";
    if (enableDefaultProjectLoadingSetting && hasDefaultProject && projects) {
      const matched = projects.find((p: any) => String(p.project_id) === String(defaultProject));
      if (matched) {
        setActiveProject(matched);
      }
    } else {
      setActiveProject(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // React Select Common Styling
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      minHeight: '34px',
      cursor: 'pointer'
    }),
    singleValue: (base: any) => ({ ...base, color: '#e5e7eb', fontSize: '13px' }),
    placeholder: (base: any) => ({ ...base, color: '#6b7280', fontSize: '13px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#2d3a6c' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({ ...base, color: '#6b7280', padding: '0 4px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px' })
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Title Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Demands
          </h1>
          <RefreshCcw
            onClick={fetchDemandsData}
            className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`}
          />
        </div>
        <button 
          onClick={() => setShowMakeDemandModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Demand
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col gap-4">
        
        {/* Row 1: Project Dropdown, Date Range Pickers, Reset & Reload Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center flex-wrap gap-4">
            {/* Project Select Dropdown */}
            <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-[280px]">
              <span className="text-[13px] font-medium text-gray-400 px-3 whitespace-nowrap">Project</span>
              <div className="h-5 w-[1px] bg-gray-700"></div>
              <Select
                options={[
                  { value: '', label: 'All Projects' },
                  ...(projects ? projects.map((p: any) => ({ value: String(p.project_id), label: p.project_code || p.project_name })) : [])
                ]}
                value={
                  activeProject
                    ? { value: String(activeProject.project_id), label: activeProject.project_code || activeProject.project_name }
                    : { value: '', label: 'All Projects' }
                }
                onChange={(val: any) => {
                  const matched = projects ? projects.find((p: any) => String(p.project_id) === String(val?.value)) : null;
                  setActiveProject(matched);
                  setCurrentPage(1);
                  setRecentPage(1);
                }}
                placeholder="All Projects..."
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="flex-1"
                isClearable
              />
            </div>

            {/* Date Range Picker Controls */}
            <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-3 h-10 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">Date Range:</span>
              <input
                type="date"
                value={demDateFrom}
                onChange={(e) => { setDemDateFrom(e.target.value); setCurrentPage(1); }}
                onClick={(e) => e.currentTarget.showPicker()}
                className="bg-transparent border-none text-[12px] text-gray-300 focus:outline-none cursor-pointer w-28"
              />
              <span className="text-gray-600 text-xs">to</span>
              <input
                type="date"
                value={demDateTo}
                onChange={(e) => { setDemDateTo(e.target.value); setCurrentPage(1); }}
                onClick={(e) => e.currentTarget.showPicker()}
                className="bg-transparent border-none text-[12px] text-gray-300 focus:outline-none cursor-pointer w-28"
              />
            </div>

            {/* Apply Daterange Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={applyDaterange}
                onChange={(e) => { setApplyDaterange(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 rounded border-gray-700 bg-transparent text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[13px] text-gray-400 group-hover:text-white transition-colors">Apply Daterange</span>
            </label>

            {/* More Filters Toggle Button */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer select-none bg-transparent hover:bg-blue-500/10 border border-blue-500/20 animate-pulse-subtle"
            >
              More Filters
              {showMoreFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Reset & Reload buttons matching mockup */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors bg-[#11141e] hover:bg-[#1a1e29]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button 
              onClick={fetchDemandsData}
              className="flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors bg-[#11141e] hover:bg-[#1a1e29]"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>

        </div>

        {/* Row 2: Added Missing Filters (Item & Status) - Conditional Toggled */}
        {showMoreFilters && (
          <div className="flex flex-wrap items-center gap-4 border-t border-gray-800/60 pt-4 animate-in slide-in-from-top-2 duration-200">
          
          {/* Item Filter */}
          <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-[240px]">
            <span className="text-[13px] font-medium text-gray-400 px-3 whitespace-nowrap">Item</span>
            <div className="h-5 w-[1px] bg-gray-700"></div>
            <Select
              options={itemsOptions.map(i => ({ value: i.id, label: i.item_name }))}
              value={selectedItem}
              onChange={(val) => { setSelectedItem(val); setCurrentPage(1); }}
              placeholder="Select Item..."
              styles={selectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              className="flex-1"
              isClearable
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-[240px]">
            <span className="text-[13px] font-medium text-gray-400 px-3 whitespace-nowrap">Status</span>
            <div className="h-5 w-[1px] bg-gray-700"></div>
            <Select
              options={demandStatusOptions.map(s => ({ value: s.id, label: s.status }))}
              value={selectedStatus}
              onChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
              placeholder="Select Status..."
              styles={selectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              className="flex-1"
              isClearable
            />
          </div>
        </div>
      )}

      </div>

      {/* Two Column Grid Layout (Left: Demands list Table; Right: Recent Demands Panel) */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6 flex-1 min-h-0">
        
        {/* Left Column Panel: Main Demands Table (2/3 Width if recent panel is visible, otherwise w-full) */}
        <div className={`bg-[#191e2b] border border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 ${
          showRecentDemandsSetting ? 'lg:w-2/3' : 'w-full'
        }`}>
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[12px] text-gray-400 font-medium bg-[#1f2536] border-b border-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4 w-16">SL</th>
                  <th className="px-5 py-4">DATE</th>
                  <th className="px-5 py-4">PROJECT</th>
                  <th className="px-5 py-4">ITEM</th>
                  <th className="px-5 py-4">QNTY</th>
                  <th className="px-5 py-4">PRIORITY</th>
                  <th className="px-5 py-4 text-center w-24">MORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-[#161a25]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                      Loading Demands...
                    </td>
                  </tr>
                ) : demandsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                      No demands found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  demandsList.map((row, idx) => {
                    const isLocked = String(row.is_locked) === '1' || row.is_locked === 1;
                    const isVerified = String(row.is_verified).toLowerCase() === 'yes';
                    return (
                      <tr 
                        key={row.demand_id || row.demand_no} 
                        title={isVerified ? "Verified Demand Set" : "Un-Verified Demand Set"}
                        className={`transition-colors ${
                          isVerified 
                            ? 'bg-green-950/40 hover:bg-green-950/50 text-emerald-100 border-y border-emerald-500/20' 
                            : isLocked 
                              ? 'bg-red-950/40 hover:bg-red-950/50' 
                              : 'hover:bg-[#1f2536]'
                        }`}
                      >
                        <td className="px-5 py-4 font-medium text-gray-400">
                          {(currentPage - 1) * 10 + idx + 1}
                        </td>
                        <td className="px-5 py-4 text-gray-200">
                          <div className="flex items-center gap-1.5">
                            {row.demand_date || '-'}
                            {isLocked && (
                              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">
                          {row.project_name || '-'}
                        </td>
                        <td className="px-5 py-4 text-gray-300 truncate max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{row.item_name || '-'}</span>
                            {isVerified ? (
                              <span className="px-1 py-0.5 border border-emerald-500/35 text-[9px] font-bold text-emerald-400 rounded bg-emerald-500/5 select-none shrink-0" title="Verified">V</span>
                            ) : (
                              <span className="px-1 py-0.5 border border-amber-500/35 text-[9px] font-bold text-amber-500 rounded bg-amber-500/5 select-none shrink-0" title="Un-Verified">UV</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">
                          {row.quantity_txt || row.quantity || '-'}
                        </td>
                        <td className="px-5 py-4 text-left">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                            (row.priority_txt || '').toLowerCase() === 'high' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : (row.priority_txt || '').toLowerCase() === 'medium' 
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {row.priority_txt || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button 
                            onClick={() => setSelectedDemandNo(row.demand_no)}
                            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                            title="Configure / Details"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-4 border-t border-gray-800 text-[13px] text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
            <span>Page {currentPage} of {totalPages} ({totalRows} Total demands fetched)</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              >
                Prev
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              >
                Next
              </button>
            </div>
          </div>

        </div>

        {/* Right Column Panel: Recent Demands Dynamic Cards (1/3 Width) */}
        {showRecentDemandsSetting && (
          <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm flex flex-col w-full lg:w-1/3 shrink-0 overflow-hidden h-[450px] lg:h-auto lg:max-h-[calc(100vh-260px)]">
            
            {/* Panel Header */}
            <div className="px-5 py-4 bg-[#232b3e] border-b border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Demands
                </h3>
                <RefreshCcw
                  onClick={() => {
                    setRecentPage(1);
                    fetchRecentDemandsData(1, false);
                  }}
                  className={`w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-white transition-colors ${isRecentLoading ? 'animate-spin text-white' : ''}`}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Display:</span>
                <select
                  value={displayLevels}
                  onChange={(e) => setDisplayLevels(e.target.value as 'my' | 'all')}
                  className="bg-[#11141e] border border-gray-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="my">My Level</option>
                  <option value="all">All Levels</option>
                </select>
              </div>
            </div>

            {/* Dynamic Card List */}
            <div className="p-2 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {isRecentLoading && recentDemands.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  <span className="text-xs">Loading demands...</span>
                </div>
              ) : recentDemands.length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic text-xs">
                  No recent demands found.
                </div>
              ) : (
                recentDemands.map((item) => {
                  const isVerified = item.is_verified === 'Yes';
                  const tagText = item.verified_text || (isVerified ? 'Verified' : 'Un-Verified');
                  
                  let tagClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  const lowerTag = tagText.toLowerCase();
                  if (isVerified || lowerTag === 'verified') {
                    tagClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                  } else if (lowerTag === 'un-verified') {
                    tagClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
                  } else if (lowerTag.includes('paid') || lowerTag.includes('order')) {
                    tagClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  }

                  return (
                    <div 
                      key={item.demand_id || item.demand_no}
                      onClick={() => setSelectedVerifyDemand(item)}
                      className={`p-2 flex items-center justify-between gap-2 shadow-sm shrink-0 rounded-lg cursor-pointer transition-colors ${
                        isVerified 
                          ? 'bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-100' 
                          : 'bg-[#1f2536] hover:bg-[#232b3e] border border-gray-800/80'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isVerified && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span 
                            className="text-[11px] font-semibold text-white truncate max-w-[100px] xl:max-w-[130px]" 
                            title={`${item.item_name} ${item.quantity_txt || item.quantity}`}
                          >
                            {item.item_name} {item.quantity_txt || item.quantity}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          {item.demand_date || '-'}
                        </span>
                      </div>
                      <span className={`px-1 py-0.5 rounded text-[8px] font-bold shrink-0 ${tagClass}`}>
                        {tagText}
                      </span>
                    </div>
                  );
                })
              )}

              {isRecentLoading && recentDemands.length > 0 && (
                <div className="py-2 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-blue-500" />
                </div>
              )}
            </div>

            {/* Panel Footer: Load More button */}
            {recentPage < recentTotalPages && (
              <div className="p-4 border-t border-gray-800 bg-[#232b3e] flex justify-center shrink-0">
                <button 
                  onClick={handleLoadMoreRecent}
                  disabled={isRecentLoading}
                  className="w-full bg-[#1f2536] hover:bg-white/5 border border-gray-700 hover:border-gray-600 text-gray-300 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Load More
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Make Demand Modal */}
      <MakeDemandModal
        isOpen={showMakeDemandModal}
        onClose={() => setShowMakeDemandModal(false)}
        projects={projects ? projects.map((p: any) => ({ id: String(p.project_id), project_name: p.project_code || p.project_name, project_code: p.project_code || p.project_name, stages_data: p.stages_data })) : []}
        priorities={priorityOptions}
        onSuccess={handleDemandActionSuccess}
      />

      {/* Demand Detail Modal */}
      <DemandDetailModal
        isOpen={selectedDemandNo !== null}
        onClose={() => setSelectedDemandNo(null)}
        demandNo={selectedDemandNo}
        priorities={priorityOptions}
        warehouses={warehouses}
        onSuccess={handleDemandActionSuccess}
      />

      {/* Verify Demand Modal */}
      <VerifyDemand
        isOpen={selectedVerifyDemand !== null}
        onClose={() => setSelectedVerifyDemand(null)}
        demand={
          selectedVerifyDemand
            ? {
                ...selectedVerifyDemand,
                project_code:
                  selectedVerifyDemand.project_code ||
                  projects?.find((p: any) => String(p.project_id) === String(selectedVerifyDemand.project_id))?.project_code ||
                  ''
              }
            : null
        }
        warehouses={warehouses}
        isRecentLoading={isRecentLoading}
        onSuccess={handleDemandActionSuccess}
      />


    </div>
  );
}
