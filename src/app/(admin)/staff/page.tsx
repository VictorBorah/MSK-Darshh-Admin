'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Select from 'react-select';
import {
  Plus,
  RefreshCcw,
  Search,
  Eye,
  Settings,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  X,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import ViewStaffModal from './ViewStaffModal';
import SettingsStaffModal from './SettingsStaffModal';
import EditStaffModal from './EditStaffModal';
import NewStaffModal from './NewStaffModal';

const SUSPENSION_OPTIONS = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' }
];

const KYC_OPTIONS = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' }
];

const OFFICE_STAFF_OPTIONS = [
  { value: 'all', label: 'Show All' },
  { value: '1', label: 'Show Office Staff' }
];

export default function StaffPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Modals state
  const [viewStaffId, setViewStaffId] = useState<string | null>(null);
  const [settingsStaffId, setSettingsStaffId] = useState<string | null>(null);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form & Dropdown data
  const [usergroups, setUsergroups] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Filters State
  const [selectedUsergroup, setSelectedUsergroup] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedSuspension, setSelectedSuspension] = useState<any>(null);
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const [selectedOfficeStaff, setSelectedOfficeStaff] = useState<any>(null);

  // Table Data State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Selection state
  const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>([]);
  const [isPatching, setIsPatching] = useState(false);

  // Search Box
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  // Initial Boot: fetch config
  useEffect(() => {
    setIsMounted(true);
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { }
        data = Array.isArray(data) ? data[0] : data;

        if (data && String(data.Status) === '1') {
          if (data.usergroups_data) setUsergroups(data.usergroups_data);
          if (data.districts_data) setDistricts(data.districts_data);
        } else {
          toast.error(data?.Message || 'Failed to load system config');
        }
      } catch (err) {
        toast.error('Error fetching system config');
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Fetch Staff List
  const fetchStaffList = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const params = new URLSearchParams();
      params.append('pagenum', String(currentPage));
      if (selectedUsergroup) params.append('group_id', selectedUsergroup.value);
      if (selectedDistrict) params.append('district_id', selectedDistrict.value);
      if (selectedSuspension) params.append('suspended', selectedSuspension.value);
      if (selectedKYC) params.append('kyc_done', selectedKYC.value);
      if (selectedOfficeStaff && selectedOfficeStaff.value !== 'all') {
        params.append('office_staff', selectedOfficeStaff.value);
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchStaffList?${params.toString()}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        setStaffList(data.staff_data || []);

        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setTotalRows(total);
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
          setItemsPerPage(pageSize);
        } else {
          setTotalPages(1);
        }
      } else {
        throw new Error(data?.Message || 'Failed to load staff list');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error fetching staff list');
      setStaffList([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedUsergroup, selectedDistrict, selectedSuspension, selectedKYC, selectedOfficeStaff]);

  // Debounced refetch on filter change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!isShowingSearchResults) fetchStaffList();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStaffList, isShowingSearchResults]);

  // Add visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isShowingSearchResults) {
        fetchStaffList();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchStaffList, isShowingSearchResults]);

  // Debounced Search Effect
  useEffect(() => {
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (!token) return;

    if (searchQuery.length >= 3) {
      setIsSearching(true);
      setIsDropdownOpen(true);
      
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/searchStaff?query_str=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const text = await res.text();
          let arr;
          try { arr = JSON.parse(text); } catch (e) { }
          const data = arr && Array.isArray(arr) ? arr[0] : arr;

          if (data && String(data.Status) === '1' && (data.staff_data || data.Data)) {
            setSearchResults(data.staff_data || data.Data || []);
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
        fetchStaffList();
      }
    }
  }, [searchQuery, isShowingSearchResults, fetchStaffList]);

  // Handle selecting a specific search result
  const handleSelectSearchResult = (result: any) => {
    setStaffList([result]);
    setTotalRows(1);
    setTotalPages(1);
    setCurrentPage(1);
    setIsDropdownOpen(false);
    setIsShowingSearchResults(true);
    setSearchQuery(result.staff_name || result.userName || '');
  };


  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemsIds(staffList.map(i => String(i.staff_id)));
    } else {
      setSelectedItemsIds([]);
    }
  };

  const handleToggleIndividual = (id: string) => {
    setSelectedItemsIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const executePatch = async (isSuspended: '0' | '1') => {
    if (selectedItemsIds.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    setIsPatching(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');

      const payloadObj = {
        staff_data: selectedItemsIds.map(id => ({
          staff_id: id,
          is_suspended: isSuspended
        }))
      };

      const formData = new FormData();
      formData.append('json_data', JSON.stringify(payloadObj));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/patchStaff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Successfully updated staff status');
        setSelectedItemsIds([]);
        fetchStaffList();
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        throw new Error(data.Message || data.message || 'Failed to update staff status');
      } else {
        throw new Error(data?.Message || data?.message || 'Failed to update staff status');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error executing update');
    } finally {
      setIsPatching(false);
    }
  };

  const handleBulkSuspend = () => executePatch('1');
  const handleBulkUnsuspend = () => executePatch('0');

  // Common react-select styles for dark mode
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
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col">

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff</h1>
          <RefreshCcw
            onClick={fetchStaffList}
            className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`}
          />
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Staff
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center gap-4">

        <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-auto min-w-[210px] flex-1 lg:flex-none">
          <span className="text-[13px] font-medium text-gray-300 px-3 whitespace-nowrap">Select Usergroup</span>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <Select
            isLoading={isConfigLoading}
            options={usergroups.map(g => ({ value: g.id, label: g.group_name }))}
            value={selectedUsergroup}
            onChange={(val) => { setSelectedUsergroup(val); setCurrentPage(1); }}
            placeholder="Select usergroup ..."
            styles={selectStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="flex-1"
            isClearable
          />
        </div>

        <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-auto min-w-[180px] flex-1 lg:flex-none">
          <span className="text-[13px] font-medium text-gray-300 px-3 whitespace-nowrap">District</span>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <Select
            isLoading={isConfigLoading}
            options={districts.map(d => ({ value: d.id, label: d.district }))}
            value={selectedDistrict}
            onChange={(val) => { setSelectedDistrict(val); setCurrentPage(1); }}
            placeholder="Select district ..."
            styles={selectStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="flex-1"
            isClearable
          />
        </div>

        <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-auto min-w-[170px] flex-1 lg:flex-none">
          <span className="text-[13px] font-medium text-gray-300 px-3 whitespace-nowrap">Suspended</span>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <Select
            options={SUSPENSION_OPTIONS}
            value={selectedSuspension}
            onChange={(val) => { setSelectedSuspension(val); setCurrentPage(1); }}
            placeholder="Select option ..."
            styles={selectStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="flex-1"
            isClearable
          />
        </div>

        <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-auto min-w-[170px] flex-1 lg:flex-none">
          <span className="text-[13px] font-medium text-gray-300 px-3 whitespace-nowrap">KYC Done</span>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <Select
            options={KYC_OPTIONS}
            value={selectedKYC}
            onChange={(val) => { setSelectedKYC(val); setCurrentPage(1); }}
            placeholder="Select option ..."
            styles={selectStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="flex-1"
            isClearable
          />
        </div>

        <div className="flex items-center gap-2 border border-gray-700 rounded-md bg-[#11141e] px-1 h-10 w-full sm:w-auto min-w-[210px] flex-1 lg:flex-none">
          <span className="text-[13px] font-medium text-gray-300 px-3 whitespace-nowrap">Office Staff</span>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <Select
            options={OFFICE_STAFF_OPTIONS}
            value={selectedOfficeStaff}
            onChange={(val) => { setSelectedOfficeStaff(val); setCurrentPage(1); }}
            placeholder="Select option ..."
            styles={selectStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="flex-1"
            isClearable
          />
        </div>

      </div>

      {/* Action Buttons above table */}
      <div className="flex items-center gap-3 mb-4 relative z-20">
        <button
          onClick={handleBulkUnsuspend}
          disabled={isPatching || isLoading}
          className="flex items-center gap-1.5 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
        >
          <UserCheck className="w-4 h-4" /> Unsuspend
        </button>
        <button
          onClick={handleBulkSuspend}
          disabled={isPatching || isLoading}
          className="flex items-center gap-1.5 border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
        >
          <UserX className="w-4 h-4" /> Suspend
        </button>

        <div className="ml-auto flex items-center gap-4">
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
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setIsDropdownOpen(false); if (isShowingSearchResults) { setIsShowingSearchResults(false); fetchStaffList(); } }} className="text-gray-400 hover:text-white transition-colors" title="Clear Search">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {isDropdownOpen && searchQuery.length >= 3 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1b202c] border border-gray-700 rounded shadow-2xl z-[150] max-h-[300px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-gray-400 text-center italic">No matching staff found</div>
                  ) : (
                    <ul className="py-1">
                      {searchResults.map((result: any) => (
                        <li
                          key={result.staff_id}
                          className="px-4 py-2 hover:bg-[#11141e] cursor-pointer text-[13px] text-gray-300 border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{result.staff_name}</span>
                            <span className="text-[11px] text-gray-500">Mobile: {result.mobile_1 || result.mobile_2 || '-'}</span>
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
      </div>

      {/* Table */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[12px] text-gray-400 font-medium bg-[#1f2536] border-b border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600"
                    checked={staffList.length > 0 && selectedItemsIds.length === staffList.length}
                    onChange={handleToggleAll}
                  />
                </th>
                <th className="px-4 py-4 w-48">Name</th>
                <th className="px-4 py-4 w-32">Usergroup</th>
                <th className="px-4 py-4 w-32">Mobile</th>
                <th className="px-4 py-4 w-48">Email</th>
                <th className="px-4 py-4 w-40">Last Logged in</th>
                <th className="px-4 py-4 w-24">KYC Done</th>
                <th className="px-4 py-4 w-24">Is Suspended</th>
                <th className="px-4 py-4 w-24 text-center">View</th>
                <th className="px-4 py-4 w-24 text-center">Settings</th>
                <th className="px-4 py-4 w-24 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                    Loading Staff Database...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500">
                    No staff found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                staffList.map((staff: any) => {
                  const isSuspended = staff.is_suspended === 'Yes';
                  return (
                    <tr
                      key={staff.staff_id}
                      className={`transition-colors ${isSuspended ? 'bg-red-950/40 hover:bg-red-950/60' : 'hover:bg-[#1f2536]'}`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItemsIds.includes(String(staff.staff_id))}
                          onChange={() => handleToggleIndividual(String(staff.staff_id))}
                          className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-200">
                        <div className="flex items-center gap-2">
                          {isSuspended && (
                            <span title="User is in Suspended state" className="cursor-help flex items-center shrink-0">
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            </span>
                          )}
                          {staff.staff_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{staff.group_name || '-'}</td>
                      <td className="px-4 py-4 text-gray-400">{staff.mobile_1 || staff.mobile_2 || '-'}</td>
                      <td className="px-4 py-4 text-gray-400">{staff.authorized_email || '-'}</td>
                      <td className="px-4 py-4 text-gray-400">{staff.last_login || '-'}</td>
                      <td className="px-4 py-4 text-gray-300">{staff.kyc_approved || '-'}</td>
                      <td className="px-4 py-4 text-gray-300">{staff.is_suspended || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => setViewStaffId(String(staff.staff_id))} className="px-3 py-1.5 text-[11px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => setSettingsStaffId(String(staff.staff_id))} className="px-3 py-1.5 text-[11px] bg-gray-600/20 text-gray-300 hover:bg-gray-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap">
                          <Settings className="w-3 h-3" /> Settings
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => setEditStaffId(String(staff.staff_id))} className="px-3 py-1.5 text-[11px] bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap">
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
        <div className="p-4 border-t border-gray-800 text-[13px] text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
          <span>Page {currentPage} of {totalPages} ({totalRows} Total rows fetched)</span>
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

      <ViewStaffModal
        isOpen={viewStaffId !== null}
        onClose={() => setViewStaffId(null)}
        staffId={viewStaffId}
      />
      <SettingsStaffModal
        isOpen={settingsStaffId !== null}
        onClose={() => setSettingsStaffId(null)}
        staffId={settingsStaffId}
      />
      <EditStaffModal
        isOpen={editStaffId !== null}
        onClose={() => setEditStaffId(null)}
        staffId={editStaffId}
        onSuccess={() => fetchStaffList()}
      />
      <NewStaffModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => fetchStaffList()}
      />

    </div>
  );
}
