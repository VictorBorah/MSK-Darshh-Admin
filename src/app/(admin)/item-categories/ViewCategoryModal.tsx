import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ViewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
}

export default function ViewCategoryModal({ isOpen, onClose, categoryId }: ViewCategoryModalProps) {
  const [categoryData, setCategoryData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen && categoryId) {
      const fetchCategory = async () => {
        setIsFetching(true);
        setCategoryData(null);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemCategory?master_category_id=${categoryId}`;
          const res = await fetch(endpoint, {
             method: 'GET',
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          const response = Array.isArray(data) ? data[0] : data;
          
          if (String(response.Status) === "1" && response.category_data) {
             setCategoryData(response.category_data);
          } else {
             toast.error(response.Message || 'Failed to fetch category details');
          }
        } catch (e) {
           console.error(e);
           toast.error('Network Error fetching category data');
        } finally {
           setIsFetching(false);
        }
      };
      fetchCategory();
    }
  }, [isOpen, categoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">View Category Data</h2>
            {categoryData && (
              <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-mono">
                Sequence ID {categoryData.master_category_id}
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

        <div className="p-6">
          {isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <p className="text-sm tracking-wide">Fetching detailed record...</p>
            </div>
          ) : categoryData ? (
             <div className="space-y-6">
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Category Name</label>
                   <div className="text-[15px] font-medium text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{categoryData.master_category_name}</div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
                   <div className="text-[14px] text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 min-h-[80px] whitespace-pre-wrap">
                      {categoryData.description || <span className="text-gray-600 italic">No description provided for this category.</span>}
                   </div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Construction Material</label>
                   <div className="text-[14px] text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block min-w-[80px] text-center font-semibold">
                      {String(categoryData.is_material) === "1" ? 'Yes' : 'No'}
                   </div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                   <div className="bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block">
                      {String(categoryData.status) === "1" ? (
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
              <p>Requested category data could not be loaded.</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors shadow-sm"
            >
              Close Window
            </button>
        </div>

      </div>
    </div>
  );
}
