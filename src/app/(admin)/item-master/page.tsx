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
import NewItemModal from './NewItemModal';
import ViewItemModal from './ViewItemModal';
import EditItemModal from './EditItemModal';

export default function MasterItemsPage() {
  // Data Flow State
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCatsLoading, setIsCatsLoading] = useState(false);
  const [isPatching, setIsPatching] = useState(false);

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // Selection & Modal States
  const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, payload: any} | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch Categories for Filters
  const fetchCategories = useCallback(async () => {
    setIsCatsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        if (data.item_categories_data && Array.isArray(data.item_categories_data)) {
          setCategories(data.item_categories_data);
        }
      }
    } catch (e: any) {
      console.error('Error fetching categories:', e);
    } finally {
      setIsCatsLoading(false);
    }
  }, []);

  // Fetch Items Data
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      
      const queryParams = new URLSearchParams();
      queryParams.append('pagenum', String(currentPage));
      if (filterCategory) queryParams.append('category', filterCategory);
      if (filterStatus) queryParams.append('status', filterStatus);
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemList?${queryParams.toString()}`;
      
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
        
        if (data.items_data && Array.isArray(data.items_data)) {
          setItems(data.items_data);
        } else {
          setItems([]);
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
      toast.error(e.message || 'Error fetching items');
      setItems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterCategory, filterStatus]);
  
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

  useEffect(() => {
    if (searchQuery.length === 0) {
      if (lastSearchedQuery.current !== '') {
         lastSearchedQuery.current = '';
         setSearchResults([]);
         setShowSearchDropdown(false);
         fetchItems();
      }
      return;
    }

    if (searchQuery.length < 3) {
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
         const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchItem?query_str=${encodeURIComponent(searchQuery)}`;
         
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

  }, [searchQuery, fetchItems]);

  const handleSelectSearchResult = async (selectedItem: any) => {
    setShowSearchDropdown(false);
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getItemDetails?item_id=${selectedItem.item_id}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && (String(data.Status) === '1' || data.Status === 1) && data.item_data) {
        setItems([data.item_data]);
        setTotalPages(1);
        toast.success(data.Message || data.message || 'Item details fetched');
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        throw new Error(data.Message || data.message || 'Failed to fetch item details');
      } else {
        throw new Error(data?.Message || data?.message || 'Failed to fetch item details');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error fetching item details');
    } finally {
      setIsLoading(false);
    }
  };



  // Initial Boot
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reactor hook for specific dependencies
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setCurrentPage(1);
    setSelectedItemsIds([]);
  };

  // Selection Handlers
  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemsIds(items.map(i => String(i.item_id)));
    } else {
      setSelectedItemsIds([]);
    }
  };

  const handleToggleIndividual = (itemId: string) => {
    setSelectedItemsIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Patch Operations Handlers
  const handleBulkCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    if (!newCategoryId) return;
    
    if (selectedItemsIds.length === 0) {
      toast.error('Please select at least one item first');
      e.target.value = '';
      return;
    }
    
    const categoryName = e.target.options[e.target.selectedIndex].text;
    
    setConfirmDialog({
      isOpen: true,
      title: `Change Category to ${categoryName} ?`,
      payload: {
        items_csv: selectedItemsIds.join(','),
        category: newCategoryId
      }
    });
    
    e.target.value = '';
  };

  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus) return;
    
    if (selectedItemsIds.length === 0) {
      toast.error('Please select at least one item first');
      e.target.value = '';
      return;
    }
    
    const statusText = e.target.options[e.target.selectedIndex].text;
    
    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} ?`,
      payload: {
        items_csv: selectedItemsIds.join(','),
        status: newStatus
      }
    });
    
    e.target.value = '';
  };

  const handleStatusToggleRequest = (item: any) => {
    const currentStatus = String(item.status);
    const newStatus = currentStatus === "1" ? "0" : "1";
    const statusText = newStatus === "1" ? "Enable" : "Disable";
    
    setConfirmDialog({
       isOpen: true,
       title: `Change Status to ${statusText} ?`,
       payload: {
         items_csv: String(item.item_id),
         status: newStatus
       }
    });
  };

  // Execution API
  const executePatch = async () => {
    if (!confirmDialog || !confirmDialog.payload) return;
    setIsPatching(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      Object.entries(confirmDialog.payload).forEach(([key, value]) => {
         formData.append(key, String(value));
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/patchItem`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Successfully updated items');
        setSelectedItemsIds([]);
        setConfirmDialog(null);
        fetchItems();
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
         throw new Error(data.Message || data.message || 'Failed to update items');
      } else {
         throw new Error(data?.Message || data?.message || 'Failed to update items');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error executing update');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full">
      
      {/* Confirmation Modal Overlay */}
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
        <h1 className="text-xl font-bold text-white">Item Master</h1>
        <RefreshCcw 
           onClick={fetchItems} 
           className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`} 
        />
      </div>
      
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        
        {/* Header and Search */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b] shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Items List
          </h2>
          <div className="flex flex-col relative" ref={searchContainerRef}>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              ) : (
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              )}
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onFocus={() => { if (searchQuery.length >= 3 && searchResults.length > 0) setShowSearchDropdown(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#11141e] border border-gray-700 rounded-md pl-9 pr-9 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
              />
              {searchQuery && (
                <X 
                  className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 transition-colors" 
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>
            <p className="text-[10px] text-gray-500/70 mt-1 ml-1 font-medium tracking-wide">Minimum 4 characters</p>
            
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-[38px] left-0 right-0 bg-[#1f2536] border border-gray-600 rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto overflow-x-hidden">
                <ul className="py-1">
                  {searchResults.map((result) => (
                    <li 
                      key={result.item_id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="px-3 py-2 text-sm text-gray-300 hover:bg-blue-600/20 hover:text-white cursor-pointer transition-colors border-b border-gray-700/50 last:border-0"
                    >
                      <div className="font-medium truncate">{result.item_name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono">{result.item_code}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showSearchDropdown && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-[38px] left-0 right-0 bg-[#1f2536] border border-gray-600 rounded-md shadow-xl z-50 p-3 text-center text-sm text-gray-400">
                No items found
              </div>
            )}
          </div>
        </div>

        {/* Actions & Filters Bar */}
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center bg-[#191e2b] gap-4 shrink-0">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* With Selected Action */}
            <div className="flex items-center bg-[#1f2536] border border-gray-700 p-1 rounded-md overflow-hidden">
              <span className="text-[12px] text-gray-400 font-medium pl-2 pr-2 uppercase tracking-wider">With Selected:</span>
              <select 
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 w-[160px] cursor-pointer"
                onChange={handleBulkCategoryChange}
              >
                <option value="">Change Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.master_category_id} value={cat.master_category_id}>
                    {cat.master_category_name}
                  </option>
                ))}
              </select>
              
              <div className="mx-2 h-5 w-[1px] bg-gray-700/80"></div>
              
              <select 
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 w-[130px] cursor-pointer"
                onChange={handleBulkStatusChange}
              >
                <option value="">Status: Active</option>
                <option value="1">Enable</option>
                <option value="0">Disable</option>
              </select>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-[#1f2536] border border-gray-700 p-1 rounded-md">
              <div className="flex items-center pl-2 pr-1 text-gray-400">
                 <Filter className="w-3.5 h-3.5 mr-1.5" />
                 <span className="text-[12px] font-medium uppercase tracking-wider">Filters:</span>
              </div>
              
              <select 
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 min-w-[140px]"
              >
                <option value="">Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.master_category_id} value={cat.master_category_id}>
                    {cat.master_category_name}
                  </option>
                ))}
              </select>

              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500"
              >
                <option value="">Status</option>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => setIsNewItemModalOpen(true)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1 h-0 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-400 font-semibold uppercase bg-[#191e2b] border-b border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input 
                    type="checkbox" 
                    className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600"
                    checked={items.length > 0 && selectedItemsIds.length === items.length}
                    onChange={handleToggleAll}
                  />
                </th>
                <th className="px-4 py-3.5 w-24">Item Code</th>
                <th className="px-4 py-3.5 w-64">Item Name</th>
                <th className="px-4 py-3.5 w-48">Category</th>
                <th className="px-4 py-3.5 w-24 text-center">Default GST</th>
                <th className="px-4 py-3.5 w-32 hidden lg:table-cell">Date Added</th>
                <th className="px-4 py-3.5 w-24 text-center">Status</th>
                <th className="px-4 py-3.5 w-20 text-center">View</th>
                <th className="px-4 py-3.5 w-20 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                   <td colSpan={9} className="py-12 text-center text-gray-500">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                     Loading Items Database...
                   </td>
                </tr>
              ) : items.length === 0 ? (
                 <tr>
                   <td colSpan={9} className="py-12 text-center text-gray-500">
                     No items found matching the selected criteria.
                   </td>
                 </tr>
              ) : (
                 items.map((item: any) => (
                   <TableRow 
                     key={item.item_id}
                     item={item}
                     isSelected={selectedItemsIds.includes(String(item.item_id))}
                     onToggle={() => handleToggleIndividual(String(item.item_id))}
                     onRequestStatusToggle={() => handleStatusToggleRequest(item)}
                     onRequestView={() => setViewItemId(String(item.item_id))}
                     onRequestEdit={() => setEditItemId(String(item.item_id))}
                   />
                 ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
            <span>Page {currentPage} of {totalPages} ({items.length} rows loaded on current page)</span>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 hidden sm:flex">
                    <select value={itemsPerPage} disabled className="bg-[#11141e] border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none cursor-not-allowed">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>items per page</span>
                </div>
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

      <NewItemModal 
        isOpen={isNewItemModalOpen} 
        onClose={() => setIsNewItemModalOpen(false)} 
        onSuccess={fetchItems}
      />

      <ViewItemModal 
         isOpen={viewItemId !== null}
         onClose={() => setViewItemId(null)}
         itemId={viewItemId}
      />

      <EditItemModal 
         isOpen={editItemId !== null}
         onClose={() => setEditItemId(null)}
         itemId={editItemId}
         onSuccess={fetchItems}
      />
    </div>
  );
}

function TableRow({ 
  item, 
  isSelected, 
  onToggle, 
  onRequestStatusToggle,
  onRequestView,
  onRequestEdit
}: { 
  item: any, 
  isSelected: boolean, 
  onToggle: () => void, 
  onRequestStatusToggle: () => void,
  onRequestView: () => void,
  onRequestEdit: () => void
}) {
  // Using generic mock data for fields that might be missing in API payload.
  const isStatusActive = String(item.status) === "1"; 
  const dateAdded = item.created_at ? item.created_at.split(' ')[0] : '-'; 
  
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
        {item.item_code}
      </td>
      <td className="px-4 py-3.5 font-medium text-[#e2e8f0]">
        <div className="flex flex-col">
          <span>{item.item_name}</span>
          {item.unit_name && <span className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase font-bold">Unit: {item.unit_name}</span>}
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-400">
         <span className="px-2 py-1 text-[11px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded shadow-sm">
           {item.category_name || '-'}
         </span>
      </td>
      <td className="px-4 py-3.5 text-center text-gray-400">
         {item.default_gst}%
      </td>
      <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
         {dateAdded}
      </td>
      <td className="px-4 py-3.5 text-center">
         {/* Toggle Switch Component Structure */}
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
