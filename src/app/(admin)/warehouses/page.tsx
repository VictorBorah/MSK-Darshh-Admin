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
  X,
  AlertTriangle,
  Warehouse
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import ViewWarehouse from './ViewWarehouse';
import EditWarehouse from './EditWarehouse';
import NewWarehouse from './NewWarehouse';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPatching, setIsPatching] = useState(false);

  // Confirmation Dialogue Overlay state
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, payload: any} | null>(null);

  // Modals state
  const [viewWarehouseId, setViewWarehouseId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editWarehouseId, setEditWarehouseId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('');

  // API Call to fetch warehouses
  const fetchWarehouses = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      let endpoint = `${baseUrl}admin/fetchWarehouses?pagenum=${page}`;

      if (filterStatus !== '') {
        endpoint += `&status=${filterStatus}`;
      }

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
      } catch (err) {
        throw new Error('Invalid JSON received from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      // Workaround for backend mapping Status to "0" when status=0 is queried
      const isSuccess = data && (
        String(data.Status) === '1' || 
        data.Status === 1 || 
        (String(data.Status) === '0' && Array.isArray(data.warehouse_data))
      );

      if (isSuccess) {
        toast.success(data.Message || 'Warehouses fetched successfully', { id: 'fetch-wh-toast' });
        
        if (data.warehouse_data && Array.isArray(data.warehouse_data)) {
          setWarehouses(data.warehouse_data);
        } else {
          setWarehouses([]);
        }

        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setTotalRows(total);
        setItemsPerPage(pageSize);
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
        setCurrentPage(page);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || 'Failed to fetch warehouses', { id: 'fetch-wh-toast' });
        setWarehouses([]);
        setTotalPages(1);
      } else {
        throw new Error(data?.Message || 'API format error');
      }
    } catch (e: any) {
      console.error('Fetch warehouses error:', e);
      toast.error(e.message || 'Error fetching warehouses', { id: 'fetch-wh-toast' });
      setWarehouses([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const lastSearchedQuery = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Outside Click handler for search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic search recommend hook
  useEffect(() => {
    if (searchQuery.length === 0) {
      if (lastSearchedQuery.current !== '') {
         lastSearchedQuery.current = '';
         setSearchResults([]);
         setShowSearchDropdown(false);
         fetchWarehouses(1);
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
         const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
         const endpoint = `${baseUrl}admin/searchWarehouse?query_str=${encodeURIComponent(searchQuery)}`;
         
         const res = await fetch(endpoint, {
           method: 'GET',
           headers: { 'Authorization': `Bearer ${token}` },
           signal: controller.signal
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
         const data = Array.isArray(arr) ? arr[0] : arr;
         
         if (data && (String(data.Status) === '1' || data.Status === 1) && data.warehouse_data && Array.isArray(data.warehouse_data)) {
           setSearchResults(data.warehouse_data);
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
  }, [searchQuery, fetchWarehouses]);

  const handleSelectSearchResult = (selectedWarehouse: any) => {
    setShowSearchDropdown(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setSearchQuery(selectedWarehouse.warehouse_name);
    lastSearchedQuery.current = selectedWarehouse.warehouse_name;
    
    setSelectedIds([]);
    setWarehouses([selectedWarehouse]);
    setTotalPages(1);
    setCurrentPage(1);
    
    toast.success(selectedWarehouse.warehouse_name + ' loaded successfully', { id: 'search-wh-toast' });
  };

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reload action
  useEffect(() => {
    fetchWarehouses(1);
  }, [fetchWarehouses, filterStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchWarehouses(newPage);
    }
  };

  const handleReload = () => {
    fetchWarehouses(currentPage);
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(warehouses.map(w => String(w.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleIndividual = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(whId => whId !== id) : [...prev, id]
    );
  };

  // Details data locator helper
  const getWarehouseObj = (id: string | null) => {
    if (!id) return undefined;
    return warehouses.find(w => String(w.id) === id);
  };

  // HTTP POST execute status patch request caller
  const executePatch = async () => {
    if (!confirmDialog || !confirmDialog.payload) return;
    setIsPatching(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const endpoint = `${baseUrl}admin/patchWarehouse`;

      const formData = new FormData();
      formData.append('ids_csv', confirmDialog.payload.ids_csv);
      formData.append('warehouse_status', confirmDialog.payload.warehouse_status);

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
        toast.success(data.Message || 'Warehouse status updated successfully', { id: 'patch-wh-toast' });
        setSelectedIds([]);
        setConfirmDialog(null);
        fetchWarehouses(currentPage);
      } else {
        toast.error(data?.Message || 'Failed to update warehouse status', { id: 'patch-wh-toast' });
      }
    } catch (e: any) {
      console.error('Patch warehouse error:', e);
      toast.error(e.message || 'Error updating status', { id: 'patch-wh-toast' });
    } finally {
      setIsPatching(false);
    }
  };

  // Switch Row level Toggle
  const handleStatusToggleRequest = (warehouse: any) => {
    const isStatusActive = String(warehouse.active) === '1' || String(warehouse.active).toLowerCase() === 'yes';
    const newStatus = isStatusActive ? '0' : '1';
    const statusText = newStatus === '1' ? 'Enable' : 'Disable';

    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} for warehouse "${warehouse.warehouse_name}"?`,
      payload: {
        ids_csv: String(warehouse.id),
        warehouse_status: newStatus
      }
    });
  };

  // Bulk selected change handler
  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (selectedIds.length === 0) {
      toast.error('Please select at least one warehouse first');
      e.target.value = '';
      return;
    }

    const statusText = newStatus === '1' ? 'Enable' : 'Disable';

    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} for ${selectedIds.length} selected record(s)?`,
      payload: {
        ids_csv: selectedIds.join(','),
        warehouse_status: newStatus
      }
    });

    e.target.value = '';
  };

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-blue-400" /> Warehouses
        </h1>
        <RefreshCcw 
           onClick={handleReload} 
           className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`} 
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 h-0">
        
        {/* Card Title Sub-Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b] shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Warehouse List
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
                placeholder="Search Warehouses..." 
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
            <div className="text-[10px] text-gray-500 mt-1 ml-1">Minimum 3 Characters</div>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-[38px] left-0 right-0 bg-[#1f2536] border border-gray-600 rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto overflow-x-hidden">
                <ul className="py-1">
                  {searchResults.map((result) => (
                    <li 
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="px-3 py-2 text-sm text-gray-300 hover:bg-blue-600/20 hover:text-white cursor-pointer transition-colors border-b border-gray-700/50 last:border-0"
                    >
                      <div className="font-medium truncate">{result.warehouse_name}</div>
                      {result.warehouse_address && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{result.warehouse_address}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showSearchDropdown && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-[38px] left-0 right-0 bg-[#1f2536] border border-gray-600 rounded-md shadow-xl z-50 p-3 text-center text-sm text-gray-400">
                No warehouses found
              </div>
            )}
          </div>
        </div>

        {/* Action Panel Filters */}
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center bg-[#191e2b] gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            
            {/* Bulk Actions */}
            <div className="flex items-center bg-[#1f2536] border border-gray-700 p-1 rounded-md overflow-hidden">
              <span className="text-[12px] text-gray-400 font-medium pl-2 pr-2 uppercase tracking-wider">With Selected:</span>
              <select 
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 w-[130px] cursor-pointer"
                onChange={handleBulkStatusChange}
                defaultValue=""
              >
                <option value="" disabled>Status: Active</option>
                <option value="1">Enable</option>
                <option value="0">Disable</option>
              </select>
            </div>

            {/* Filter Section */}
            <div className="flex items-center gap-2 bg-[#1f2536] border border-gray-700 p-1 rounded-md">
              <div className="flex items-center pl-2 pr-1 text-gray-400">
                 <Filter className="w-3.5 h-3.5 mr-1.5" />
                 <span className="text-[12px] font-medium uppercase tracking-wider">Filters:</span>
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="bg-[#11141e] border border-gray-700 rounded text-[13px] text-gray-300 px-2 py-1 outline-none focus:border-gray-500 cursor-pointer"
              >
                <option value="">Status: All</option>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            
          </div>
          
          {/* New Warehouse Trigger button */}
          <button 
             onClick={() => setIsNewModalOpen(true)}
             className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Warehouse
          </button>
        </div>

        {/* Table Body Area */}
        <div className="overflow-x-auto flex-1 h-0 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
             <thead className="text-[11px] text-gray-400 font-semibold uppercase bg-[#191e2b] border-b border-gray-800 sticky top-0 z-10">
               <tr>
                 <th className="px-5 py-3.5 w-10">
                   <input 
                     type="checkbox" 
                     className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600"
                     checked={warehouses.length > 0 && selectedIds.length === warehouses.length}
                     onChange={handleToggleAll}
                   />
                 </th>
                 <th className="px-4 py-3.5">Warehouse</th>
                 <th className="px-4 py-3.5">Address</th>
                 <th className="px-4 py-3.5 w-32 text-center">Default</th>
                 <th className="px-4 py-3.5 w-24 text-center">Status</th>
                 <th className="px-4 py-3.5 w-20 text-center">View</th>
                 <th className="px-4 py-3.5 w-20 text-center">Edit</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-800 bg-[#161a25]">
               {isLoading ? (
                  <tr>
                     <td colSpan={7} className="py-12 text-center text-gray-500">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                       Loading Warehouses Database...
                     </td>
                  </tr>
               ) : warehouses.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                       No warehouses located matching parameters.
                     </td>
                  </tr>
               ) : (
                  warehouses.map((wh: any) => {
                     const isStatusActive = String(wh.active) === '1' || String(wh.active).toLowerCase() === 'yes';
                     const isDefault = String(wh.default_warehouse).toLowerCase() === 'yes';
                     return (
                       <tr key={wh.id} className="hover:bg-[#1f2536] transition-colors group">
                         <td className="px-5 py-3.5">
                           <input 
                             type="checkbox" 
                             checked={selectedIds.includes(String(wh.id))}
                             onChange={() => handleToggleIndividual(String(wh.id))}
                             className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" 
                           />
                         </td>
                         <td className="px-4 py-3.5 font-bold tracking-wide text-gray-300">
                           {wh.warehouse_name}
                         </td>
                         <td className="px-4 py-3.5 font-medium text-[#cbd5e1] max-w-[300px] truncate" title={wh.warehouse_address}>
                           {wh.warehouse_address || '-'}
                         </td>
                         <td className="px-4 py-3.5 text-center text-xs font-bold text-gray-400">
                           {isDefault ? (
                             <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Yes</span>
                           ) : 'No'}
                         </td>
                         <td className="px-4 py-3.5 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isStatusActive}
                                onChange={() => handleStatusToggleRequest(wh)}
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 opacity-90"></div>
                            </label>
                         </td>
                         <td className="px-4 py-3.5 text-center">
                           <button 
                             onClick={() => setViewWarehouseId(String(wh.id))} 
                             className="px-2.5 py-1.5 text-[11px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                             title="View warehouse details"
                           >
                             <Eye className="w-3.5 h-3.5" />
                           </button>
                         </td>
                         <td className="px-4 py-3.5 text-center">
                           <button 
                             onClick={() => { setEditWarehouseId(String(wh.id)); setIsEditModalOpen(true); }} 
                             className="px-2.5 py-1.5 text-[11px] bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                             title="Edit warehouse configurations"
                           >
                             <Pencil className="w-3.5 h-3.5" />
                           </button>
                         </td>
                       </tr>
                     );
                  })
               )}
             </tbody>
          </table>
        </div>

        {/* Card Pagination Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
            <span>Page {currentPage} of {totalPages} ({warehouses.length} rows loaded on current page)</span>
            <div className="flex items-center gap-4">
                <div className="flex items-center space-x-1">
                   <button 
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1 || isLoading}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-semibold"
                   >
                     Prev
                   </button>
                   <button 
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage >= totalPages || isLoading}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-semibold"
                   >
                     Next
                   </button>
                </div>
            </div>
        </div>

      </div>

      {/* Confirmation Dialog Overlay */}
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
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                No, Cancel
              </button>
              <button 
                onClick={executePatch}
                disabled={isPatching}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer font-bold"
              >
                {isPatching && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      <ViewWarehouse 
         isOpen={viewWarehouseId !== null}
         onClose={() => setViewWarehouseId(null)}
         warehouseId={viewWarehouseId}
         fallbackData={getWarehouseObj(viewWarehouseId)}
         onSuccess={handleReload}
      />

      <EditWarehouse 
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         warehouseId={editWarehouseId}
         fallbackData={getWarehouseObj(editWarehouseId)}
         onSuccess={handleReload}
      />

      <NewWarehouse 
         isOpen={isNewModalOpen}
         onClose={() => setIsNewModalOpen(false)}
         onSuccess={handleReload}
      />

    </div>
  );
}
