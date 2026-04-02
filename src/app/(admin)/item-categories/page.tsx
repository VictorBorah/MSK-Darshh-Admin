'use client';

import { 
  Search,
  Plus,
  RefreshCcw,
  List,
  Eye,
  Pencil,
  Loader2,
  Filter,
  AlertTriangle,
  X
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ViewCategoryModal from './ViewCategoryModal';
import EditCategoryModal from './EditCategoryModal';

export default function ItemCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPatching, setIsPatching] = useState(false);

  // Modals
  const [viewCategoryId, setViewCategoryId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Selection & Confirmation
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, payload: any} | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [filterStatus, setFilterStatus] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const lastSearchedQuery = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const queryParams = new URLSearchParams();
      queryParams.append('pagenum', String(currentPage));
      if (filterStatus) queryParams.append('status', filterStatus);
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemCategories?${queryParams.toString()}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON server response'); }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        
        if (data.item_categories_data && Array.isArray(data.item_categories_data)) {
          setCategories(data.item_categories_data);
        } else {
          setCategories([]);
        }
        
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
          setItemsPerPage(pageSize);
        } else {
          setTotalPages(1);
        }
      } else {
        throw new Error(data?.Message || 'API Error');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error fetching categories');
      setCategories([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      if (lastSearchedQuery.current !== '') {
         lastSearchedQuery.current = '';
         setSearchResults([]);
         setShowSearchDropdown(false);
         fetchCategories();
      }
      return;
    }

    if (searchQuery.length < 4) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (searchQuery === lastSearchedQuery.current) {
       return; 
    }

    const performSearch = async () => {
       if (abortControllerRef.current) {
          abortControllerRef.current.abort();
       }
       const controller = new AbortController();
       abortControllerRef.current = controller;
       
       setIsSearching(true);
       
       try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchItemCategory?query_str=${encodeURIComponent(searchQuery)}`;
         
         const res = await fetch(endpoint, {
           method: 'GET',
           headers: { 'Authorization': `Bearer ${token}` },
           signal: controller.signal
         });
         
         const rawText = await res.text();
         let arr;
         try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
         const data = Array.isArray(arr) ? arr[0] : arr;
         
         if (data && String(data.Status) === '1' && data.items_data) {
           setSearchResults(data.items_data);
           setShowSearchDropdown(true);
           lastSearchedQuery.current = searchQuery;
         } else {
           setSearchResults([]);
           setShowSearchDropdown(false);
         }
       } catch (err: any) {
         if (err.name !== 'AbortError') {
           console.error('Search error:', err);
           setSearchResults([]);
         }
       } finally {
         if (abortControllerRef.current === controller) {
            setIsSearching(false);
         }
       }
    };
    
    const timeoutId = setTimeout(() => {
       performSearch();
    }, 300);
    
    return () => clearTimeout(timeoutId);

  }, [searchQuery, fetchCategories]);

  const handleSelectSearchResult = async (selectedItem: any) => {
    setShowSearchDropdown(false);
    setIsLoading(true);
    setSearchQuery(selectedItem.master_category_name);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemCategory?master_category_id=${selectedItem.master_category_id}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && String(data.Status) === '1' && data.category_data) {
        setCategories([data.category_data]);
        setTotalPages(1);
      } else {
        toast.error(data?.Message || 'Failed to fetch category details');
        setCategories([]);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Network Error fetching category data');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setFilterStatus('');
    setCurrentPage(1);
    setSelectedCategoryIds([]);
    setSearchQuery('');
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategoryIds(categories.map(c => String(c.master_category_id)));
    } else {
      setSelectedCategoryIds([]);
    }
  };

  const handleToggleIndividual = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus) return;
    
    if (selectedCategoryIds.length === 0) {
      toast.error('Please select at least one category first');
      e.target.value = '';
      return;
    }
    
    const statusText = e.target.options[e.target.selectedIndex].text;
    
    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} ?`,
      payload: {
        ids_csv: selectedCategoryIds.join(','),
        status: newStatus
      }
    });
    
    e.target.value = '';
  };

  const handleStatusToggleRequest = (cat: any) => {
    const currentStatus = String(cat.status);
    const newStatus = currentStatus === "1" ? "0" : "1";
    const statusText = newStatus === "1" ? "Enable" : "Disable";
    
    setConfirmDialog({
       isOpen: true,
       title: `Change Status to ${statusText} ?`,
       payload: {
         ids_csv: String(cat.master_category_id),
         status: newStatus
       }
    });
  };

  const executePatch = async () => {
    if (!confirmDialog || !confirmDialog.payload) return;
    setIsPatching(true);
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      Object.entries(confirmDialog.payload).forEach(([key, value]) => {
         formData.append(key, String(value));
      });
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/patchItemCategory`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && String(data.Status) === "1") {
        toast.success(data.Message || 'Category status successfully updated');
        setSelectedCategoryIds([]);
        setConfirmDialog(null);
        fetchCategories();
      } else {
         throw new Error(data?.Message || 'Failed to update category status');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error processing request');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full">
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-orange-400">
               <AlertTriangle className="w-6 h-6" />
               <h3 className="text-lg font-bold text-white tracking-wide">Confirm Action</h3>
            </div>
            <p className="text-gray-300 font-medium mb-8 text-[15px]">{confirmDialog.title}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                disabled={isPatching}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
              >
                No, Cancel
              </button>
              <button 
                onClick={executePatch}
                disabled={isPatching}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isPatching && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white">Item Categories</h1>
        <RefreshCcw 
           onClick={fetchCategories} 
           className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`} 
        />
      </div>

      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b] shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Categories List
          </h2>
          <div className="relative" ref={searchContainerRef}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 absolute left-3 top-[17px] -translate-y-1/2 text-blue-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4 absolute left-3 top-[17px] -translate-y-1/2 text-gray-500" />
            )}
            <input 
              type="text" 
              placeholder="Search Categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#11141e] border border-gray-700 rounded-md pl-9 pr-9 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            />
            {searchQuery && (
              <X 
                className="w-4 h-4 absolute right-3 top-[17px] -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 transition-colors" 
                onClick={() => setSearchQuery('')}
              />
            )}
            {showSearchDropdown && searchResults.length > 0 && (
              <ul className="absolute top-full mt-1 w-full bg-[#1f2536] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-50 py-1">
                {searchResults.map((cat: any, idx: number) => (
                  <li 
                    key={idx}
                    className="px-3 py-2 text-sm text-gray-300 hover:bg-[#283145] hover:text-white cursor-pointer transition-colors"
                    onClick={() => handleSelectSearchResult(cat)}
                  >
                    {cat.master_category_name}
                  </li>
                ))}
              </ul>
            )}
            <div className="text-[10px] text-gray-500 mt-1 pl-1">Minimum 4 characters</div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center bg-[#191e2b] gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            
            <div className="flex items-center bg-[#1f2536] border border-gray-700 p-1 rounded-md overflow-hidden">
              <span className="text-[12px] text-gray-400 font-medium pl-2 pr-2 uppercase tracking-wider">With Selected:</span>
              <select 
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 w-[130px] cursor-pointer"
                onChange={handleBulkStatusChange}
              >
                <option value="">Status: Active</option>
                <option value="1">Enable</option>
                <option value="0">Disable</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#1f2536] border border-gray-700 p-1 rounded-md">
              <div className="flex items-center pl-2 pr-1 text-gray-400">
                 <Filter className="w-3.5 h-3.5 mr-1.5" />
                 <span className="text-[12px] font-medium uppercase tracking-wider">Filters:</span>
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500"
              >
                <option value="">Status: All</option>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            
          </div>
          
          <button 
             onClick={() => { setEditCategoryId(null); setIsEditModalOpen(true); }}
             className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        <div className="overflow-x-auto flex-1 h-0 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
             <thead className="text-[11px] text-gray-400 font-semibold uppercase bg-[#191e2b] border-b border-gray-800 sticky top-0 z-10">
               <tr>
                 <th className="px-5 py-3.5 w-10">
                   <input 
                     type="checkbox" 
                     className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600"
                     checked={categories.length > 0 && selectedCategoryIds.length === categories.length}
                     onChange={handleToggleAll}
                   />
                 </th>
                 <th className="px-4 py-3.5">Category Name</th>
                 <th className="px-4 py-3.5">Description</th>
                 <th className="px-4 py-3.5 w-24 text-center">Status</th>
                 <th className="px-4 py-3.5 w-20 text-center">View</th>
                 <th className="px-4 py-3.5 w-20 text-center">Edit</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-800 bg-[#161a25]">
               {isLoading ? (
                 <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                      Loading Categories Database...
                    </td>
                 </tr>
               ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No categories found matching criteria.
                    </td>
                  </tr>
               ) : (
                  categories.map((cat: any) => (
                    <CategoryRow 
                      key={cat.master_category_id}
                      category={cat}
                      isSelected={selectedCategoryIds.includes(String(cat.master_category_id))}
                      onToggle={() => handleToggleIndividual(String(cat.master_category_id))}
                      onRequestStatusToggle={() => handleStatusToggleRequest(cat)}
                      onRequestView={() => setViewCategoryId(String(cat.master_category_id))}
                      onRequestEdit={() => { setEditCategoryId(String(cat.master_category_id)); setIsEditModalOpen(true); }}
                    />
                  ))
               )}
             </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
            <span>Page {currentPage} of {totalPages} ({categories.length} rows loaded on current page)</span>
            <div className="flex items-center gap-4">
                <div className="flex items-center space-x-1">
                   <button 
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1 || isLoading}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Prev
                   </button>
                   <button 
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage >= totalPages || isLoading}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Next
                   </button>
                </div>
            </div>
        </div>
      </div>

      <ViewCategoryModal 
         isOpen={viewCategoryId !== null}
         onClose={() => setViewCategoryId(null)}
         categoryId={viewCategoryId}
      />

      <EditCategoryModal 
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         categoryId={editCategoryId}
         onSuccess={fetchCategories}
      />
    </div>
  );
}

function CategoryRow({ 
  category, 
  isSelected, 
  onToggle, 
  onRequestStatusToggle,
  onRequestView,
  onRequestEdit
}: { 
  category: any, 
  isSelected: boolean, 
  onToggle: () => void, 
  onRequestStatusToggle: () => void,
  onRequestView: () => void,
  onRequestEdit: () => void
}) {
  const isStatusActive = String(category.status) === "1"; 
  
  return (
    <tr className="hover:bg-[#1f2536] transition-colors group">
      <td className="px-5 py-3.5">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggle}
          className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" 
        />
      </td>
      <td className="px-4 py-3.5 font-bold tracking-wide text-gray-300">
        {category.master_category_name}
      </td>
      <td className="px-4 py-3.5 font-medium text-[#e2e8f0]">
        {category.description || '-'}
      </td>
      <td className="px-4 py-3.5 text-center">
         <label className="relative inline-flex items-center cursor-pointer">
           <input 
             type="checkbox" 
             className="sr-only peer" 
             checked={isStatusActive}
             onChange={onRequestStatusToggle}
           />
           <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
         </label>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button onClick={onRequestView} className="px-2.5 py-1.5 text-[11px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button onClick={onRequestEdit} className="px-2.5 py-1.5 text-[11px] bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
