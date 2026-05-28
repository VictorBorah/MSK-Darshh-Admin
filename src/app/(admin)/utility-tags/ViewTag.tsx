'use client';

import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ViewTagProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: string | null;
  fallbackData?: any;
}

export default function ViewTag({ isOpen, onClose, tagId, fallbackData }: ViewTagProps) {
  const [tagData, setTagData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (fallbackData) {
        setTagData(fallbackData);
      } else if (tagId) {
        const fetchTag = async () => {
          setIsFetching(true);
          setTagData(null);
          try {
            const token = localStorage.getItem('at_ki8Xq1iV');
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
            const endpoint = `${baseUrl}admin/fetchUtilityTag?tag_id=${tagId}`;
            
            const res = await fetch(endpoint, {
               method: 'GET',
               headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
              throw new Error(`Server connection error (HTTP ${res.status})`);
            }
            
            const rawText = await res.text();
            let arr;
            try {
              arr = JSON.parse(rawText);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
            const response = Array.isArray(arr) ? arr[0] : arr;
            
            if (response && (String(response.Status) === "1" || response.Status === 1) && response.tag_data) {
               toast.success(response.Message || 'Tag details retrieved successfully', { id: 'view-tag-toast' });
               setTagData(response.tag_data);
            } else if (response && (String(response.Status) === "0" || response.Status === 0)) {
               toast.error(response.Message || 'Failed to fetch tag details', { id: 'view-tag-toast' });
            } else {
               throw new Error(response?.Message || 'API error');
            }
          } catch (e: any) {
             console.error(e);
             toast.error(e.message || 'Error fetching tag data', { id: 'view-tag-toast' });
          } finally {
             setIsFetching(false);
          }
        };
        fetchTag();
      }
    }
  }, [isOpen, tagId, fallbackData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">View Utility Tag</h2>
            {tagData && (
              <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-mono">
                Tag ID {tagData.tag_id}
              </p>
            )}
          </div>
          <button 
             onClick={onClose} 
             className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <p className="text-sm tracking-wide">Fetching detailed tag...</p>
            </div>
          ) : tagData ? (
             <div className="space-y-6">
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Utility Tag Name</label>
                   <div className="text-[15px] font-medium text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{tagData.utility_tag}</div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
                   <div className="text-[14px] text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 min-h-[80px] whitespace-pre-wrap">
                      {tagData.description_txt || <span className="text-gray-600 italic">No description provided for this tag.</span>}
                   </div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                   <div className="bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block">
                      {String(tagData.active).toLowerCase() === "yes" || String(tagData.active) === "1" ? (
                         <span className="text-emerald-400 text-[13px] font-bold tracking-wide flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                           </span>
                           ACTIVE
                         </span>
                      ) : (
                         <span className="text-red-400 text-[13px] font-bold tracking-wide flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                           </span>
                           DISABLED
                         </span>
                      )}
                   </div>
                </div>
             </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p>Requested tag data could not be loaded.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors shadow-sm cursor-pointer font-semibold"
            >
              Close Window
            </button>
        </div>

      </div>
    </div>
  );
}
