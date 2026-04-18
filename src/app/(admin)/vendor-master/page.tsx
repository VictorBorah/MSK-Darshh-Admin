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
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ViewVendorModal from './ViewVendorModal';
import EditVendorModal from './EditVendorModal';

export default function VendorMasterPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPatching, setIsPatching] = useState(false);

  // Modals
  const [viewVendorId, setViewVendorId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState<string | null>(null);

  // Selection & Confirmation
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, payload: any } | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filterStatus, setFilterStatus] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
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
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchVendor?query_str=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        });

        const rawText = await res.text();
        let arr;
        try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON'); }
        const data = Array.isArray(arr) ? arr[0] : arr;

        if (data && String(data.Status) === "1") {
          setSearchResults(data.vendor_data || []);
          setShowSearchDropdown(true);
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
        if (searchAbortControllerRef.current === abortController) {
          setIsSearching(false);
        }
      }
    };

    const debounceTimer = setTimeout(performSearch, 400);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [searchQuery]);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const queryParams = new URLSearchParams();
      queryParams.append('pagenum', String(currentPage));
      if (filterStatus) queryParams.append('status', filterStatus);

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchVendorList?${queryParams.toString()}`;

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

        if (data.vendor_data && Array.isArray(data.vendor_data)) {
          setVendors(data.vendor_data);
        } else {
          setVendors([]);
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
      toast.error(e.message || 'Error fetching vendors');
      setVendors([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVendorIds(vendors.map(v => String(v.vendor_id)));
    } else {
      setSelectedVendorIds([]);
    }
  };

  const handleToggleIndividual = (id: string) => {
    setSelectedVendorIds(prev =>
      prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (selectedVendorIds.length === 0) {
      toast.error('Please select at least one vendor first');
      e.target.value = '';
      return;
    }

    const statusText = e.target.options[e.target.selectedIndex].text;

    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} ?`,
      payload: {
        ids_csv: selectedVendorIds.join(','),
        status: newStatus
      }
    });

    e.target.value = '';
  };

  const handleStatusToggleRequest = (vendor: any) => {
    const currentStatus = String(vendor.status);
    const newStatus = currentStatus === "1" ? "0" : "1";
    const statusText = newStatus === "1" ? "Enable" : "Disable";

    setConfirmDialog({
      isOpen: true,
      title: `Change Status to ${statusText} ?`,
      payload: {
        ids_csv: String(vendor.vendor_id),
        status: newStatus
      }
    });
  };

  const handleSelectSearchResult = async (vendorId: string, vendorName: string) => {
    setShowSearchDropdown(false);
    setSearchQuery(vendorName);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getVendorDetails?vendor_id=${vendorId}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1" && response.vendor_data) {
        setVendors([response.vendor_data]);
        setTotalPages(1);
        setCurrentPage(1);
        toast.success(response.Message || 'Vendor details fetched');
      } else {
        toast.error(response.Message || 'Failed to fetch vendor details');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network Error');
    } finally {
      setIsLoading(false);
    }
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

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/patchVendorInfo`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === "1" || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Vendor info updated');
        setSelectedVendorIds([]);
        setConfirmDialog(null);
        fetchVendors();
      } else if (data && (String(data.Status) === "0" || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to update vendor status');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server');
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
        <h1 className="text-xl font-bold text-white">Vendor Master</h1>
        <RefreshCcw
          onClick={fetchVendors}
          className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`}
        />
      </div>

      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">

        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b] shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Vendor List
          </h2>
          <div className="flex flex-col relative" ref={searchContainerRef}>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="w-4 h-4 absolute left-3 top-[17px] -translate-y-1/2 text-blue-500 animate-spin" />
              ) : (
                <Search className="w-4 h-4 absolute left-3 top-[17px] -translate-y-1/2 text-gray-500" />
              )}
              <input
                type="text"
                placeholder="Search Vendors..."
                value={searchQuery}
                onFocus={() => { if (searchQuery.length >= 3 && searchResults.length > 0) setShowSearchDropdown(true); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val === '') {
                    fetchVendors();
                  }
                }}
                className="bg-[#11141e] border border-gray-700 rounded-md pl-9 pr-9 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
              />
              {searchQuery && (
                <X
                  className="w-4 h-4 absolute right-3 top-[17px] -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => { setSearchQuery(''); fetchVendors(); }}
                />
              )}
            </div>
            <p className="text-[10px] text-gray-500/70 mt-1 ml-1 font-medium tracking-wide">Minimum 4 characters</p>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-[39px] left-0 right-0 bg-[#1f2536] border border-gray-600 rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto overflow-x-hidden">
                <ul className="py-1">
                  {searchResults.map((result: any, idx: number) => (
                    <li
                      key={`${result.vendor_id}-${idx}`}
                      onClick={() => handleSelectSearchResult(result.vendor_id, result.vendor_name)}
                      className="px-4 py-2.5 hover:bg-[#11141e] cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{result.vendor_name}</span>
                        {result.vendor_mobile && <span className="text-[11px] text-gray-500 mt-0.5">Mobile: {result.vendor_mobile}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            onClick={() => { setEditVendorId(null); setIsEditModalOpen(true); }}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Vendor
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
                    checked={vendors.length > 0 && selectedVendorIds.length === vendors.length}
                    onChange={handleToggleAll}
                  />
                </th>
                <th className="px-4 py-3.5 tracking-wider">Vendor Name</th>
                <th className="px-4 py-3.5 tracking-wider">Address</th>
                <th className="px-4 py-3.5 tracking-wider">Mobile</th>
                <th className="px-4 py-3.5 tracking-wider">GST</th>
                <th className="px-4 py-3.5 w-24 text-center tracking-wider">Status</th>
                <th className="px-4 py-3.5 w-20 text-center tracking-wider">View</th>
                <th className="px-4 py-3.5 w-20 text-center tracking-wider">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                    Loading Vendor Database...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No vendors found matching criteria.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor: any) => (
                  <VendorRow
                    key={vendor.vendor_id}
                    vendor={vendor}
                    isSelected={selectedVendorIds.includes(String(vendor.vendor_id))}
                    onToggle={() => handleToggleIndividual(String(vendor.vendor_id))}
                    onRequestStatusToggle={() => handleStatusToggleRequest(vendor)}
                    onRequestView={() => setViewVendorId(String(vendor.vendor_id))}
                    onRequestEdit={() => { setEditVendorId(String(vendor.vendor_id)); setIsEditModalOpen(true); }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
          <span>Page {currentPage} of {totalPages} ({vendors.length} rows loaded on current page)</span>
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

      <ViewVendorModal
        isOpen={viewVendorId !== null}
        onClose={() => setViewVendorId(null)}
        vendorId={viewVendorId}
      />

      <EditVendorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vendorId={editVendorId}
        onSuccess={fetchVendors}
      />
    </div>
  );
}

function VendorRow({
  vendor,
  isSelected,
  onToggle,
  onRequestStatusToggle,
  onRequestView,
  onRequestEdit
}: {
  vendor: any,
  isSelected: boolean,
  onToggle: () => void,
  onRequestStatusToggle: () => void,
  onRequestView: () => void,
  onRequestEdit: () => void
}) {
  const isStatusActive = String(vendor.status) === "1";

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
        {vendor.vendor_name || '-'}
      </td>
      <td className="px-4 py-3.5 text-[#e2e8f0]">
        {vendor.vendor_address || '-'}
      </td>
      <td className="px-4 py-3.5 font-mono text-[13px] text-gray-400">
        {vendor.vendor_mobile || '-'}
      </td>
      <td className="px-4 py-3.5 font-mono text-[13px] text-gray-400">
        {vendor.vendor_gst || '-'}
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
