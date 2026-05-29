'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Search, 
  Calendar, 
  RefreshCw, 
  Check, 
  Trash2, 
  X, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface Photo {
  photo_id: string;
  file_name: string;
  photo_url: string;
  stage_id: string;
  stage_name: string;
  upload_date: string;
  file_description: string;
}

interface Stage {
  stage_id: string;
  stage_name: string;
  active: string;
}

export default function GpsPhotos() {
  // Consume projects, default project from AuthContext
  const { projects, defaultProject, isLoadingAppData } = useAuth();

  // Selected state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  
  // Date states (formatted as YYYY-MM-DD for native matching)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Gallery state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pagenum, setPagenum] = useState<number>(1);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState<boolean>(false);

  // Popovers & UI Search states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState<boolean>(false);
  const [isDateOpen, setIsDateOpen] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageSearchQuery, setStageSearchQuery] = useState<string>('');
  
  const [calMonth, setCalMonth] = useState<Date>(new Date(2026, 4)); // Initialize to May 2026 as per mockup
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  
  const [applyDateRange, setApplyDateRange] = useState<boolean>(false);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const projectSearchRef = useRef<HTMLDivElement>(null);
  const stageSearchRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectSearchRef.current && !projectSearchRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (stageSearchRef.current && !stageSearchRef.current.contains(event.target as Node)) {
        setIsStageDropdownOpen(false);
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
    if (!isLoadingAppData && projects && projects.length > 0) {
      const hasDefaultProject = defaultProject && String(defaultProject) !== "0" && String(defaultProject).trim() !== "";
      
      if (hasDefaultProject && !selectedProject) {
        const matched = projects.find((p: any) => String(p.project_id) === String(defaultProject));
        if (matched) {
          setSelectedProject(matched);
          const projectStages = (matched as any).stages_data || [];
          setStages(projectStages);
        }
      }
    }
  }, [isLoadingAppData, defaultProject, projects, selectedProject]);

  // Helper: Convert YYYY-MM-DD date string to API expected DD-MM-YYYY
  const convertInputToApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-'); // [YYYY, MM, DD]
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Helper: Convert Date object to YYYY-MM-DD string
  const formatDateToInputString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: Convert YYYY-MM-DD input date string to display DD-MM-YYYY
  const formatDisplayDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Helper: Check if a date is in the future to disable it
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Generate day slots for current active calendar month view (standard 6-row / 42-slot grid)
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

  // Date picker selection handler
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
        setIsDateOpen(false); // Close calendar range popover when choice is fully made
      } else {
        setTempStart(date);
        setFromDate(formatDateToInputString(date));
      }
    }
  };

  // REST API Gallery Fetching
  const fetchPhotos = useCallback(async (page: number, append: boolean = false) => {
    if (!selectedProject) return;
    
    const projectId = selectedProject.project_id;
    if (!projectId) return;

    if (append) {
      setIsLoadMoreLoading(true);
    } else {
      setIsLoadingPhotos(true);
    }

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      
      // Construct API endpoint URL with query parameters
      let url = `${baseUrl}app/fetchGpsPhotos?project_id=${projectId}&pagenum=${page}`;
      
      if (selectedStageId) {
        url += `&stage_id=${selectedStageId}`;
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Connection error (HTTP ${response.status})`);
      }

      const rawText = await response.text();
      
      // 1. Handle completely empty response body
      if (!rawText || rawText.trim() === '') {
        if (!append) {
          setPhotos([]);
          setTotalRows(0);
        }
        setToast({
          message: 'No photos found for this selection',
          type: 'success'
        });
        return;
      }

      let resDataArr;
      try {
        const cleanText = rawText.trim();
        // Check if the response is double-JSON-encoded by the backend (starts and ends with quotes)
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          const unescapedStr = JSON.parse(cleanText);
          resDataArr = typeof unescapedStr === 'string' ? JSON.parse(unescapedStr) : unescapedStr;
        } else {
          resDataArr = JSON.parse(cleanText);
        }
      } catch (err) {
        // Fallback: If it's a double-encoded string with escaped quotes or slashes that standard JSON.parse fails on,
        // we manually unescape it and attempt to parse it.
        try {
          let manualText = rawText.trim();
          if (manualText.startsWith('"') && manualText.endsWith('"')) {
            manualText = manualText.substring(1, manualText.length - 1);
          }
          // Replace escaped quotes \" with "
          manualText = manualText.replaceAll('\\"', '"');
          // Replace escaped slashes \/ with /
          manualText = manualText.replaceAll('\\/', '/');
          // Replace escaped backslashes \\ with \
          manualText = manualText.replaceAll('\\\\', '\\');
          
          resDataArr = JSON.parse(manualText);
        } catch (manualErr) {
          console.warn("Failed to parse JSON response:", rawText, manualErr);
          if (!append) {
            setPhotos([]);
            setTotalRows(0);
          }
          setToast({
            message: 'Failed to process server response',
            type: 'error'
          });
          return;
        }
      }

      // 2. Handle parsed array check
      const resData = Array.isArray(resDataArr) 
        ? (resDataArr.length > 0 ? resDataArr[0] : null) 
        : resDataArr;

      if (!resData) {
        if (!append) {
          setPhotos([]);
          setTotalRows(0);
        }
        setToast({
          message: 'No photos available',
          type: 'success'
        });
        return;
      }

      if (resData) {
        const isSuccess = String(resData.Status) === "1" || resData.Status === 1;

        setToast({
          message: resData.Message || (isSuccess ? 'GPS Photos fetched successfully' : 'Failed to retrieve photos'),
          type: isSuccess ? 'success' : 'error'
        });

        if (isSuccess && resData.photo_data && Array.isArray(resData.photo_data)) {
          if (append) {
            setPhotos(prev => {
              const existingIds = new Set(prev.map(p => p.photo_id));
              const newPhotos = resData.photo_data.filter((p: Photo) => !existingIds.has(p.photo_id));
              return [...prev, ...newPhotos];
            });
          } else {
            setPhotos(resData.photo_data);
          }
          
          if (resData.total_rows !== undefined) {
            setTotalRows(parseInt(String(resData.total_rows), 10) || 0);
          }
          setPagenum(page);
        } else {
          if (!append) {
            setPhotos([]);
            setTotalRows(0);
          }
        }
      }
    } catch (error: any) {
      console.error("GPS Photos Fetch Error:", error);
      setToast({
        message: error.message || 'Server connection failed',
        type: 'error'
      });
      if (!append) {
        setPhotos([]);
        setTotalRows(0);
      }
    } finally {
      setIsLoadingPhotos(false);
      setIsLoadMoreLoading(false);
    }
  }, [selectedProject, selectedStageId, fromDate, toDate, applyDateRange]);

  // Load photos immediately on project selection or filter changes
  useEffect(() => {
    if (selectedProject) {
      fetchPhotos(1, false);
    }
  }, [selectedProject, selectedStageId, fromDate, toDate, applyDateRange, fetchPhotos]);

  // Change project handler
  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    const projectStages = project.stages_data || [];
    setStages(projectStages);
    
    // Reset stages, dates, and gallery values on project switch
    setSelectedStageId('');
    setFromDate('');
    setToDate('');
    setApplyDateRange(false);
    setTempStart(null);
    setTempEnd(null);
    setPhotos([]);
    setTotalRows(0);
    setIsProjectDropdownOpen(false);
    setSearchQuery('');
  };

  // Lightbox Button Actions
  const handleMarkAsRead = (photo: Photo) => {
    setToast({
      message: `Photo "${photo.file_name}" marked as read successfully!`,
      type: 'success'
    });
    setActivePhoto(null);
  };

  const handleDelete = (photo: Photo) => {
    setToast({
      message: `Photo "${photo.file_name}" deleted successfully!`,
      type: 'success'
    });
    // Update local grid immediately
    setPhotos(prev => prev.filter(p => p.photo_id !== photo.photo_id));
    setTotalRows(prev => Math.max(0, prev - 1));
    setActivePhoto(null);
  };

  // Filter lists for dropdown search boxes
  const filteredProjects = projects ? projects.filter((p: any) =>
    (p.project_code || p.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.site_address || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredStages = stages.filter((stage) =>
    (stage.stage_name || '').toLowerCase().includes(stageSearchQuery.toLowerCase())
  );

  if (isLoadingAppData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e121e] text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <span className="text-[14px] font-semibold text-gray-400">Loading App Configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-[#0f2e22]/90 border-emerald-500/40 text-emerald-400'
              : 'bg-[#3b1218]/90 border-rose-500/40 text-rose-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="text-[13.5px] font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb path */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 select-none">
        <span>Local</span>
        <span>/</span>
        <span className="text-gray-200 font-medium">GPS Photos</span>
      </div>

      {/* Top Filter & Control Panel - absolute z-[45] added to elevate above photos grid layout */}
      <div className="relative z-[45] flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 mb-8 rounded-xl border border-gray-800/80 bg-[#181d2a]/95 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-grow max-w-6xl">
          
          {/* Custom Searchable Project Select Dropdown */}
          <div className="relative flex-grow lg:max-w-xs" ref={projectSearchRef}>
            <div
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Search className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-[13.5px] truncate">
                  {selectedProject ? (selectedProject.project_code || selectedProject.project_name) : 'Search project...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isProjectDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-gray-800 bg-[#161a26] shadow-2xl p-2 max-h-72 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-800 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  autoFocus
                />
                <div className="space-y-1">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p: any) => (
                      <div
                        key={p.project_id}
                        onClick={() => handleProjectSelect(p)}
                        className={`px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
                          selectedProject?.project_id === p.project_id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-[#1f2536]'
                        }`}
                      >
                        <div className="font-semibold truncate">{p.project_code || p.project_name}</div>
                        <div className={`text-[11px] mt-0.5 ${selectedProject?.project_id === p.project_id ? 'text-blue-100' : 'text-gray-400'}`}>
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

          {/* Custom Searchable Stage Select Dropdown */}
          <div className="relative flex-grow lg:max-w-xs" ref={stageSearchRef}>
            <div
              onClick={() => selectedProject && setIsStageDropdownOpen(!isStageDropdownOpen)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all ${
                !selectedProject ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="font-semibold text-[13.5px] truncate">
                  {selectedStageId 
                    ? (stages.find(s => String(s.stage_id) === String(selectedStageId))?.stage_name || 'Select Stage') 
                    : 'Select Stage'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isStageDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isStageDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-gray-800 bg-[#161a26] shadow-2xl p-2 max-h-72 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search stage..."
                  value={stageSearchQuery}
                  onChange={(e) => setStageSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-800 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  autoFocus
                />
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      setSelectedStageId('');
                      setIsStageDropdownOpen(false);
                      setStageSearchQuery('');
                    }}
                    className={`px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
                      selectedStageId === ''
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-[#1f2536]'
                    }`}
                  >
                    All Stages
                  </div>
                  {filteredStages.length > 0 ? (
                    filteredStages.map((stage) => (
                      <div
                        key={stage.stage_id}
                        onClick={() => {
                          setSelectedStageId(stage.stage_id);
                          setIsStageDropdownOpen(false);
                          setStageSearchQuery('');
                        }}
                        className={`px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
                          String(selectedStageId) === String(stage.stage_id)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-[#1f2536]'
                        }`}
                      >
                        <div className="font-semibold truncate">{stage.stage_name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4 text-[12px]">No stages found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Premium Date Range Picker Dropdown (future dates disabled) */}
          <div className="relative flex-grow lg:max-w-xs" ref={dateRef}>
            <div
              onClick={() => selectedProject && setIsDateOpen(!isDateOpen)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all ${
                !selectedProject ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Calendar className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <span className="text-[13px] font-bold text-gray-400 whitespace-nowrap">Date Range:</span>
                <span className="text-[13px] font-mono text-white whitespace-nowrap truncate max-w-[120px]">
                  {fromDate && toDate 
                    ? `${formatDisplayDateString(fromDate)} to ${formatDisplayDateString(toDate)}` 
                    : fromDate 
                      ? `${formatDisplayDateString(fromDate)} to ...`
                      : 'Select range...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isDateOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDateOpen && (
              <div className="absolute left-0 mt-2 z-50 rounded-2xl border border-gray-800 bg-[#161a26] text-white shadow-2xl p-4 w-78 md:w-84">
                <div className="flex items-center justify-between border-b border-gray-800/40 pb-3 mb-3">
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                    className="p-1.5 rounded-lg border border-gray-800 hover:bg-gray-800/30 transition text-[13px]"
                  >
                    &larr;
                  </button>
                  <span className="text-[13px] font-extrabold uppercase tracking-wide">
                    {calMonth.toLocaleString('default', { month: 'long' })} {calMonth.getFullYear()}
                  </span>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                    className="p-1.5 rounded-lg border border-gray-800 hover:bg-gray-800/30 transition text-[13px]"
                  >
                    &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
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
                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                          isFuture 
                            ? 'text-gray-600 opacity-20 cursor-not-allowed bg-transparent' 
                            : !day.isCurrentMonth 
                              ? 'text-gray-600 opacity-40 hover:bg-gray-800/40 cursor-pointer' 
                              : 'text-white hover:bg-gray-800 cursor-pointer'
                        } ${
                          isSelected && !isFuture
                            ? 'bg-blue-600 text-white rounded-lg shadow-md font-extrabold'
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

                <div className="mt-4 pt-3 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                  <button 
                    onClick={() => {
                      setTempStart(null);
                      setTempEnd(null);
                      setFromDate('');
                      setToDate('');
                    }}
                    className="text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                  <span className="text-blue-500 font-extrabold text-right truncate max-w-[140px]">
                    {tempStart ? formatDisplayDateString(formatDateToInputString(tempStart)) : ''} {tempEnd ? `to ${formatDisplayDateString(formatDateToInputString(tempEnd))}` : tempStart ? 'to ...' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Apply Date Range Checkbox */}
          <label className={`flex items-center gap-2 cursor-pointer select-none shrink-0 py-2 ${
            !selectedProject ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
          }`}>
            <input
              type="checkbox"
              checked={applyDateRange}
              disabled={!selectedProject}
              onChange={(e) => setApplyDateRange(e.target.checked)}
              className="hidden"
            />
            {applyDateRange ? (
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <span className="text-[13.5px] font-bold text-gray-300 whitespace-nowrap">
              Apply Date Range
            </span>
          </label>

        </div>

        {/* Reload button control */}
        <div className="flex items-center gap-3 self-end xl:self-auto">
          <button
            onClick={() => fetchPhotos(1, false)}
            disabled={isLoadingPhotos || !selectedProject}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-blue-400 hover:text-blue-300 hover:bg-[#1a2035] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-[13px]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingPhotos ? 'animate-spin' : ''}`} />
            <span>Reload Photos</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedProject ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#191e2b]/40 border border-gray-800/80 rounded-2xl p-8 text-center">
          <Camera className="w-16 h-16 text-gray-500 animate-pulse mb-4" />
          <h3 className="text-lg font-bold text-gray-300">No Project Selected</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Please search and select a project from the dropdown above to fetch and view associated GPS photos and site progress stages.
          </p>
        </div>
      ) : isLoadingPhotos && photos.length === 0 ? (
        /* Dynamic Skeleton Loader */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-[#191e2b] border border-gray-800 rounded-xl overflow-hidden animate-pulse">
              <div className="bg-gray-800/70 aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#191e2b]/40 border border-gray-800/80 rounded-2xl p-8 text-center">
          <Camera className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-md font-bold text-gray-400">No Photos Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            We couldn't find any GPS photos matching your active criteria. Try adjusting dates or selecting another stage.
          </p>
        </div>
      ) : (
        /* Image Gallery Grid - Responsive col count mapping */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {photos.map((photo) => (
              <div 
                key={photo.photo_id}
                onClick={() => setActivePhoto(photo)}
                className="group bg-[#191e2b] border border-gray-800/80 hover:border-blue-500/40 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center shrink-0">
                  <img
                    src={photo.photo_url}
                    alt={photo.file_name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-[#111522]/90 backdrop-blur-sm border border-gray-800/80 px-2 py-0.5 rounded text-[9.5px] font-bold text-blue-400 uppercase tracking-wide">
                    {photo.stage_name}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[9px] font-mono text-gray-300">
                    {photo.upload_date}
                  </div>
                </div>
                <div className="p-3.5 flex-grow flex flex-col justify-between">
                  <h4 className="text-[12.5px] font-bold text-gray-200 truncate" title={photo.file_name}>
                    {photo.file_name}
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate mt-1" title={photo.file_description}>
                    {photo.file_description || 'No description'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Centered Pagination Button */}
          {photos.length < totalRows && (
            <div className="flex justify-center mt-12 pb-8">
              <button
                onClick={() => fetchPhotos(pagenum + 1, true)}
                disabled={isLoadMoreLoading}
                className="px-6 py-2.5 rounded-lg border border-gray-800 bg-[#1e2536] hover:bg-[#252f46] text-gray-200 hover:text-white transition disabled:opacity-50 font-bold text-[13.5px] shadow-lg flex items-center gap-2 hover:scale-[1.02]"
              >
                {isLoadMoreLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Loading More...</span>
                  </>
                ) : (
                  <span>Load More ..</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Popover Zoom Modal */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#191e2b] border border-gray-800 rounded-2xl max-w-5xl w-full flex flex-col md:flex-row shadow-2xl overflow-hidden max-h-[90vh]">
            
            {/* Corner Close Button */}
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-[#111522]/80 hover:bg-red-600 rounded-full border border-gray-800 text-gray-300 hover:text-white transition shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Box: Image Frame */}
            <div className="flex-grow bg-black flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
              <img
                src={activePhoto.photo_url}
                alt={activePhoto.file_name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>

            {/* Right Box: Info & Actions Sidebar */}
            <div className="w-full md:w-80 bg-[#121622] p-6 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/40">
                  <span className="bg-blue-900/40 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    {activePhoto.stage_name}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {activePhoto.upload_date}
                  </span>
                </div>

                <div>
                  <h3 className="text-[14.5px] font-bold text-gray-100 font-mono break-all leading-snug">
                    {activePhoto.file_name}
                  </h3>
                  <span className="text-[10px] text-gray-500 block mt-1">Photo ID: {activePhoto.photo_id}</span>
                </div>

                <div className="border-t border-gray-800/60 pt-4">
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Description</h4>
                  <p className="text-[13px] text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">
                    {activePhoto.file_description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Action Stack */}
              <div className="space-y-3 pt-6 border-t border-gray-800/60 mt-6 md:mt-0">
                <button
                  onClick={() => handleMarkAsRead(activePhoto)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-bold text-[13px] shadow-md hover:scale-[1.01]"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as read</span>
                </button>
                
                <button
                  onClick={() => handleDelete(activePhoto)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition font-bold text-[13px] shadow-md hover:scale-[1.01]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                
                <button
                  onClick={() => setActivePhoto(null)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition font-bold text-[13px] shadow-sm hover:scale-[1.01]"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
