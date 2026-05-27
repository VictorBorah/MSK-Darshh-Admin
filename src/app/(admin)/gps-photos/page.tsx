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
  AlertCircle 
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
  
  // Date states (formatted as YYYY-MM-DD for native input inputs)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Gallery state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pagenum, setPagenum] = useState<number>(1);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState<boolean>(false);

  // Popovers & UI
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
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

  // Helper: Convert YYYY-MM-DD native date string to API expected DD-MM-YYYY
  const convertInputToApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-'); // [YYYY, MM, DD]
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Helper: Get today's date in YYYY-MM-DD format to disable future dates
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
      if (fromDate) {
        url += `&from_date=${convertInputToApiDate(fromDate)}`;
      }
      if (toDate) {
        url += `&to_date=${convertInputToApiDate(toDate)}`;
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
      let resDataArr;
      try {
        resDataArr = JSON.parse(rawText);
      } catch {
        throw new Error('Response payload parsing failed');
      }

      const resData = Array.isArray(resDataArr) ? resDataArr[0] : resDataArr;

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
  }, [selectedProject, selectedStageId, fromDate, toDate]);

  // Load photos immediately on project selection or filter changes
  useEffect(() => {
    if (selectedProject) {
      fetchPhotos(1, false);
    }
  }, [selectedProject, selectedStageId, fromDate, toDate, fetchPhotos]);

  // Change project handler
  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    const projectStages = project.stages_data || [];
    setStages(projectStages);
    setSelectedStageId('');
    setPhotos([]);
    setTotalRows(0);
    setIsProjectDropdownOpen(false);
    setSearchQuery('');
  };

  // Lightbox Button Actions
  const handleMarkAsRead = (photo: Photo) => {
    // API Call verification logic
    setToast({
      message: `Photo "${photo.file_name}" marked as read successfully!`,
      type: 'success'
    });
    setActivePhoto(null);
  };

  const handleDelete = (photo: Photo) => {
    // API Call verification logic
    setToast({
      message: `Photo "${photo.file_name}" deleted successfully!`,
      type: 'success'
    });
    // Remove from local array to display responsive immediate update
    setPhotos(prev => prev.filter(p => p.photo_id !== photo.photo_id));
    setTotalRows(prev => Math.max(0, prev - 1));
    setActivePhoto(null);
  };

  // Filter projects list for dropdown search
  const filteredProjects = projects ? projects.filter((p: any) =>
    (p.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.site_address || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

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

      {/* Top Filter & Control Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 mb-8 rounded-xl border border-gray-800/80 bg-[#181d2a]/95 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-grow max-w-6xl">
          
          {/* Custom Searchable Project Select Dropdown */}
          <div className="relative flex-grow lg:max-w-xs" ref={searchRef}>
            <div
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white hover:border-gray-700 cursor-pointer select-none transition-all"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Search className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-[13.5px] truncate">
                  {selectedProject ? selectedProject.project_name : 'Search project...'}
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
                        <div className="font-semibold truncate">{p.project_name}</div>
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

          {/* Stage Dropdown Select */}
          <div className="relative flex-grow lg:max-w-xs">
            <select
              value={selectedStageId}
              disabled={!selectedProject}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-[13.5px] font-medium transition-all"
            >
              <option value="">Select Stage</option>
              {stages.map((stage) => (
                <option key={stage.stage_id} value={stage.stage_id}>
                  {stage.stage_name}
                </option>
              ))}
            </select>
          </div>

          {/* Premium Date Range Pickers (Disabled future dates) */}
          <div className="flex items-center gap-2 bg-[#111522] border border-gray-800 rounded-lg px-3 py-1.5 flex-grow lg:max-w-md w-full">
            <Calendar className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span className="text-[11px] font-extrabold text-gray-500 uppercase whitespace-nowrap">Date Range</span>
            <input
              type="date"
              value={fromDate}
              max={getTodayDateString()}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={!selectedProject}
              className="bg-transparent text-white text-[13px] font-mono focus:outline-none w-full disabled:opacity-40"
            />
            <span className="text-gray-600 font-bold px-0.5">-</span>
            <input
              type="date"
              value={toDate}
              max={getTodayDateString()}
              onChange={(e) => setToDate(e.target.value)}
              disabled={!selectedProject}
              className="bg-transparent text-white text-[13px] font-mono focus:outline-none w-full disabled:opacity-40"
            />
          </div>

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
