'use client';

import {
  Plus, 
  RefreshCcw,
  List,
  Search,
  Eye,
  Pencil,
  Settings,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Loader2,
  XCircle
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import NewUserGroupModal from './NewUserGroupModal';
import ViewUserGroupModal from './ViewUserGroupModal';
import UserGroupSettingsModal from './UserGroupSettingsModal';
import EditUserGroupModal from './EditUserGroupModal';

export default function UserGroupsPage() {
  const router = useRouter();

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<{type: 'view'|'settings'|'edit', id: string, name: string} | null>(null);

  // Table Data state
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const currentPageRef = useRef(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  // The actual sync function that loads fetchAppData
  const syncAppData = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
    } catch (err) {
      console.error('Failed to sync app data:', err);
    }
  }, []);

  // Fetch specific table data
  const fetchTableData = useCallback(async (passedPage = currentPageRef.current) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      if (!token) {
        toast.error('Authentication required');
        router.push('/');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchUserGroups?pagenum=${passedPage}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) {}
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setGroups(data.Data || []);
        setTotalRows(Number(data.total_rows) || 0);
        setItemsPerPage(Number(data.pagination_size) || 10);
        setTotalPages(Math.ceil((Number(data.total_rows) || 0) / (Number(data.pagination_size) || 10)) || 1);
        setCurrentPage(passedPage);
        currentPageRef.current = passedPage;
      } else {
        toast.error(data?.Message || 'Failed to fetch user groups');
        setGroups([]);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error fetching user groups');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initial Load & Focus Event
  useEffect(() => {
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (!token) {
      router.push('/');
      return;
    }

    // Load data initially
    fetchTableData(1);
    syncAppData(token);

    // Setup Visibility Change Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAppData(token);
        fetchTableData(currentPageRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTableData, syncAppData, router]);

  // Debounced Search Effect
  useEffect(() => {
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (!token) return;

    if (searchQuery.length >= 3) {
      setIsSearching(true);
      setIsDropdownOpen(true);
      
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/searchUsergroup?query_str=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const text = await res.text();
          let arr;
          try { arr = JSON.parse(text); } catch (e) { }
          const data = arr && Array.isArray(arr) ? arr[0] : arr;

          if (data && String(data.Status) === '1' && data.Data) {
            setSearchResults(data.Data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
      // If user cleared the search query and we were currently viewing a search result, restore table
      if (searchQuery === '' && isShowingSearchResults) {
        setIsShowingSearchResults(false);
        fetchTableData(1);
      }
    }
  }, [searchQuery, isShowingSearchResults, fetchTableData]);

  // Handle selecting a specific search result
  const handleSelectSearchResult = (result: any) => {
    setGroups([result]);
    setTotalRows(1);
    setTotalPages(1);
    setCurrentPage(1);
    currentPageRef.current = 1;
    setIsDropdownOpen(false);
    setIsShowingSearchResults(true);
    setSearchQuery(result.group_name);
  };

  const togglePermission = (groupId: string, permissionId: string) => {
    toast.success(`Toggled permission ${permissionId} for group ${groupId} (Dummy)`);
  };

  const PERMISSION_COLS = ['1', '19', '12', '13', '25', '24', '17'];

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white">Usergroups</h1>
        <RefreshCcw 
           onClick={() => fetchTableData(currentPageRef.current)} 
           className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`} 
        />
      </div>
      
      {/* Main Table Container */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* Container Header and Search */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b]">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Usergroups
          </h2>
          <div className="relative hidden sm:block">
            <div className="relative z-10">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.length >= 3) setIsDropdownOpen(true); }}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="bg-[#11141e] border border-gray-700 rounded-md pl-9 pr-10 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 placeholder:text-gray-500"
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setIsDropdownOpen(false); if (isShowingSearchResults) { setIsShowingSearchResults(false); fetchTableData(1); } }} className="text-gray-400 hover:text-white transition-colors" title="Clear Search">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {isDropdownOpen && searchQuery.length >= 3 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1b202c] border border-gray-700 rounded shadow-2xl z-[150] max-h-[300px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-gray-400 text-center italic">No matching usergroups found</div>
                  ) : (
                    <ul className="py-1">
                      {searchResults.map((result: any) => (
                        <li
                          key={result.group_id}
                          className="px-4 py-2 hover:bg-[#11141e] cursor-pointer text-[13px] text-gray-300 border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{result.group_name}</span>
                            <span className="text-[11px] text-gray-500">Permissions: {result.permissions?.length || 0}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="text-[10px] text-gray-500 italic mt-1.5 mb-1 pl-1">Min. 3 characters</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#191e2b]">
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <UserCheck className="w-3.5 h-3.5 text-green-500" /> Activate
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <UserMinus className="w-3.5 h-3.5 text-orange-400" /> Deactivate
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
             <button 
               onClick={() => setIsNewModalOpen(true)}
               className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2"
             >
               <Plus className="w-4 h-4" /> New Group
             </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left whitespace-nowrap">
            <thead className="text-[10px] text-gray-400 font-semibold uppercase bg-[#191e2b] border-b border-gray-800">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input type="checkbox" className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600" />
                </th>
                <th className="px-4 py-4 w-48">NAME</th>
                <th className="px-4 py-4 text-center">VIEW PROJECT</th>
                <th className="px-4 py-4 text-center">EDIT PROJECT</th>
                <th className="px-4 py-4 text-center">MAKE DEMANDS</th>
                <th className="px-4 py-4 text-center">VERIFY DEMANDS</th>
                <th className="px-4 py-4 text-center">MAKE PURCHASES</th>
                <th className="px-4 py-4 text-center">VERIFY PURCHASES</th>
                <th className="px-4 py-4 text-center">MAKE PAYMENTS</th>
                <th className="px-4 py-4 text-center w-24">VIEW</th>
                <th className="px-4 py-4 text-center w-28">SETTINGS</th>
                <th className="px-4 py-4 text-center w-24">EDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                   <td colSpan={12} className="py-12 text-center text-gray-500 text-sm">
                     <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-3" />
                     Loading Usergroups...
                   </td>
                </tr>
              ) : groups.length === 0 ? (
                 <tr>
                   <td colSpan={12} className="py-12 text-center text-gray-500 text-sm">
                     No user groups found.
                   </td>
                 </tr>
              ) : (
                 groups.map((group: any) => {
                   const isRevoked = String(group.login_revoked) === '1'; // Assuming '1' means revoked based on UserGroupSettingsModal
                   const noPermissions = !group.permissions || group.permissions.length === 0;

                   let rowBg = "hover:bg-[#1f2536]";
                   if (isRevoked) {
                     rowBg = "bg-red-900/20 hover:bg-red-900/40";
                   } else if (noPermissions) {
                     rowBg = "bg-yellow-900/30 hover:bg-yellow-900/40";
                   }

                   return (
                   <tr key={group.group_id} className={`${rowBg} transition-colors group`}>
                     <td className="px-5 py-4">
                       <input type="checkbox" className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" />
                     </td>
                     <td className="px-4 py-4 font-medium text-white text-[13px]">
                       <div className="flex items-center gap-2">
                         {isRevoked && (
                           <span title="Login has been revoked for this usergroup" className="cursor-help flex items-center shrink-0">
                             <AlertTriangle className="w-4 h-4 text-yellow-500" />
                           </span>
                         )}
                         {!isRevoked && noPermissions && (
                           <span title="No permissions defined for this usergroup" className="cursor-help flex items-center shrink-0">
                             <AlertTriangle className="w-4 h-4 text-yellow-500" />
                           </span>
                         )}
                         {group.group_name}
                       </div>
                     </td>
                     
                     {/* The 7 Permission Checkboxes */}
                     {PERMISSION_COLS.map((permId) => {
                       const hasPerm = group.permissions?.some((p: any) => Object.keys(p)[0] === permId);
                       return (
                         <td key={permId} className="px-4 py-4 text-center">
                           <input 
                             type="checkbox" 
                             checked={hasPerm || false}
                             onChange={() => togglePermission(group.group_id, permId)}
                             className="bg-transparent border-gray-500 rounded cursor-pointer h-3.5 w-3.5 accent-blue-500 opacity-80 hover:opacity-100 transition-opacity" 
                           />
                         </td>
                       );
                     })}

                     {/* Action Buttons */}
                     <td className="px-4 py-4 text-center">
                       <button onClick={() => setActiveModal({type: 'view', id: group.group_id, name: group.group_name})} className="px-3 py-1.5 text-[10px] bg-[#1a2c4e] text-blue-400 hover:bg-blue-600 hover:text-white rounded border border-blue-500/20 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                         <Eye className="w-3 h-3" /> View
                       </button>
                     </td>
                     <td className="px-4 py-4 text-center">
                       <button onClick={() => setActiveModal({type: 'settings', id: group.group_id, name: group.group_name})} className="px-3 py-1.5 text-[10px] bg-[#2a2f3a] text-gray-300 hover:bg-gray-600 hover:text-white rounded border border-gray-600/30 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                         <Settings className="w-3 h-3" /> Settings
                       </button>
                     </td>
                     <td className="px-4 py-4 text-center">
                       <button onClick={() => setActiveModal({type: 'edit', id: group.group_id, name: group.group_name})} className="px-3 py-1.5 text-[10px] bg-[#1a3a2e] text-emerald-400 hover:bg-emerald-600 hover:text-white rounded border border-emerald-500/20 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                         <Pencil className="w-3 h-3" /> Edit
                       </button>
                     </td>
                   </tr>
                   );
                 })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b]">
            <span>Page {currentPage} of {totalPages} ({totalRows} Total rows fetched)</span>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <select value={itemsPerPage} disabled className="bg-[#11141e] border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500 cursor-not-allowed hidden sm:block">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="hidden sm:inline">items per page</span>
                </div>
                <div className="flex items-center space-x-1">
                   <button 
                     onClick={() => fetchTableData(currentPage - 1)}
                     disabled={currentPage <= 1}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Prev
                   </button>
                   <button 
                     onClick={() => fetchTableData(currentPage + 1)}
                     disabled={currentPage >= totalPages}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Next
                   </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Modals */}
      <NewUserGroupModal 
        isOpen={isNewModalOpen} 
        onClose={() => {
          setIsNewModalOpen(false);
          fetchTableData(currentPageRef.current);
        }} 
        onSuccess={() => fetchTableData(1)}
      />
      <ViewUserGroupModal 
        isOpen={activeModal?.type === 'view'} 
        onClose={() => setActiveModal(null)} 
        groupId={activeModal?.id} 
        groupName={activeModal?.name} 
      />
      <UserGroupSettingsModal 
        isOpen={activeModal?.type === 'settings'} 
        onClose={() => setActiveModal(null)} 
        groupId={activeModal?.id} 
        groupName={activeModal?.name} 
        onSuccess={() => fetchTableData(currentPageRef.current)}
      />
      <EditUserGroupModal 
        isOpen={activeModal?.type === 'edit'} 
        onClose={() => setActiveModal(null)} 
        groupId={activeModal?.id} 
        groupName={activeModal?.name} 
        onSuccess={() => fetchTableData(currentPageRef.current)}
      />
      
    </div>
  );
}
