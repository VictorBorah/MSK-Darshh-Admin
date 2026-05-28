'use client';

import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface EditTagProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: string | null;
  fallbackData?: any;
  onSuccess?: () => void;
}

export default function EditTag({ isOpen, onClose, tagId, fallbackData, onSuccess }: EditTagProps) {
  const [tagName, setTagName] = useState('');
  const [description, setDescription] = useState('');
  const [statusToggle, setStatusToggle] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!tagId) {
        setTagName('');
        setDescription('');
        setStatusToggle(true);
      } else if (fallbackData) {
        setTagName(fallbackData.utility_tag || '');
        setDescription(fallbackData.description_txt || '');
        setStatusToggle(
          String(fallbackData.active).toLowerCase() === "yes" || 
          String(fallbackData.active) === "1"
        );
      } else {
        const fetchTag = async () => {
          setIsFetching(true);
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
               setTagName(response.tag_data.utility_tag || '');
               setDescription(response.tag_data.description_txt || '');
               setStatusToggle(
                 String(response.tag_data.active).toLowerCase() === "yes" || 
                 String(response.tag_data.active) === "1"
               );
            } else if (response && (String(response.Status) === "0" || response.Status === 0)) {
               toast.error(response.Message || 'Failed to fetch tag details', { id: 'edit-tag-toast' });
            } else {
               throw new Error(response?.Message || 'API error');
            }
          } catch (e: any) {
             console.error(e);
             toast.error(e.message || 'Error fetching tag data', { id: 'edit-tag-toast' });
          } finally {
             setIsFetching(false);
          }
        };
        fetchTag();
      }
    }
  }, [isOpen, tagId, fallbackData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      toast.error('Utility Tag Name is mandatory');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      
      let endpoint = '';
      const formData = new FormData();
      if (tagId) {
        endpoint = `${baseUrl}admin/patchUtilityTags`;
        formData.append('tags_csv', String(tagId));
        formData.append('status', statusToggle ? '1' : '0');
        formData.append('tag_name', tagName);
        formData.append('description', description);
      } else {
        endpoint = `${baseUrl}admin/saveUtilityTag`;
        formData.append('tag_name', tagName);
        formData.append('description', description);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server connection error (HTTP ${res.status})`);
      }

      const rawText = await res.text();
      let arr;
      try {
        arr = JSON.parse(rawText);
      } catch (err) {
        throw new Error('Invalid JSON received from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || (tagId ? 'Utility Tag updated successfully' : 'Utility Tag Created'), { id: 'edit-tag-toast' });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to update utility tag status', { id: 'edit-tag-toast' });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error saving tag configurations', { id: 'edit-tag-toast' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {tagId ? 'Edit Utility Tag' : 'Add New Tag'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1">
          <div className="p-6 space-y-5">
            {isFetching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                 <p className="text-sm tracking-wide">Fetching detailed tag...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Utility Tag Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    autoFocus
                    placeholder="Enter utility tag name"
                    className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-semibold"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description (optional)"
                    rows={3}
                    maxLength={200}
                    className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-medium text-[#cbd5e1]"
                    disabled={isSaving}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className={`text-[11.5px] font-semibold ${description.length >= 200 ? 'text-red-500' : 'text-gray-400'}`}>
                      Remaining characters: {200 - description.length}
                    </span>
                  </div>
                </div>

                {tagId && (
                  <div className="flex items-center justify-between border border-gray-700 p-3 rounded-md mt-4">
                    <span className="text-[13px] font-medium text-gray-400 uppercase tracking-wide">Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={statusToggle}
                        onChange={(e) => setStatusToggle(e.target.checked)}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50"></div>
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFetching}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 gap-2 cursor-pointer font-bold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {tagId ? 'Update Tag' : 'Add Tag'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
