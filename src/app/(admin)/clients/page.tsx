'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  RefreshCcw,
  Loader2,
  X,
  Eye,
  Settings,
  Pencil,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ViewClientModal from './ViewClient';
import EditClientModal from './EditClient';

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  client_mobile_1: string;
  client_mobile_2: string;
  client_email: string;
  added_on: string;
}

export default function ClientsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Client Profile State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Edit Client Profile State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  // Onboarding Wizard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Form Data
  const [clientName, setClientName] = useState('');
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  // Step 2 Form Data
  const [email, setEmail] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Clients List from API
  const fetchClientsList = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchClients?pagenum=${page}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        setClientList(data.client_data || []);
        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        setTotalRows(total);
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
      } else {
        throw new Error(data?.Message || 'Failed to load clients list');
      }
    } catch (e: unknown) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : 'Error fetching clients list';
      toast.error(errMsg);
      setClientList([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchClientsList(currentPage);
    }
  }, [currentPage, isMounted, fetchClientsList]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenOnboarding = () => {
    setClientName('');
    setCreatedClientId(null);
    setEmail('');
    setMobile1('');
    setMobile2('');
    setAddress('');
    setOnboardingStep(1);
    setIsModalOpen(true);
  };

  // Onboarding Step 1 Submission
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Client Name is mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('client_name', clientName.trim());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/addClient`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Client created successfully');
        setCreatedClientId(data.client_id);
        setOnboardingStep(2);
      } else {
        toast.error(data?.Message || 'Failed to create client');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error occurred while creating client';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Onboarding Step 2 Submission
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile1.trim()) {
      toast.error('Mobile 1 is mandatory');
      return;
    }
    if (!address.trim()) {
      toast.error('Address is mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = {
        client_id: createdClientId || '',
        client_name: clientName.trim(),
        email: email.trim(),
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim(),
        address: address.trim()
      };

      const formData = new FormData();
      formData.append('json_data', JSON.stringify([payload]));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/patchClient`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Client details updated');
        setIsModalOpen(false);
        fetchClientsList(currentPage);
      } else {
        toast.error(data?.Message || 'Failed to update client details');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error occurred while updating client details';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounced Search Effect for Clients
  useEffect(() => {
    const token = localStorage.getItem('at_ki8Xq1iV');
    if (!token) return;

    if (searchQuery.length >= 3) {
      setIsSearching(true);
      setIsDropdownOpen(true);

      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/searchClient?query_str=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const text = await res.text();
          let arr;
          try { arr = JSON.parse(text); } catch { }
          const data = arr && Array.isArray(arr) ? arr[0] : arr;

          if (data && (String(data.Status) === '1' || data.Status === 1)) {
            setSearchResults(data.client_data || data.Data || []);
            if (data.Message) {
              toast.success(data.Message);
            }
          } else {
            setSearchResults([]);
            if (data && (String(data.Status) === '0' || data.Status === 0) && data.Message) {
              toast.error(data.Message);
            } else {
              toast.error(data?.Message || 'Failed to search clients');
            }
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
          toast.error('Error occurred while searching clients');
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
        fetchClientsList(currentPage);
      }
    }
  }, [searchQuery, isShowingSearchResults, currentPage, fetchClientsList]);

  // Handle selecting a specific search suggestion result
  const handleSelectSearchResult = (result: Client) => {
    setClientList([result]);
    setTotalRows(1);
    setTotalPages(1);
    setCurrentPage(1);
    setIsDropdownOpen(false);
    setIsShowingSearchResults(true);
    setSearchQuery(result.client_name || '');
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Title & Onboarding Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Clients
          </h1>
          <RefreshCcw
            onClick={() => fetchClientsList(currentPage)}
            className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`}
          />
        </div>
        <button 
          onClick={handleOpenOnboarding}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      {/* Control Bar (Search Box Aligned to Right) */}
      <div className="flex items-center justify-end mb-4 relative z-30">
        <div className="flex flex-col items-end">
          <div className="relative">
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
                  <button 
                    onClick={() => { 
                      setSearchQuery(''); 
                      setSearchResults([]); 
                      setIsDropdownOpen(false); 
                      if (isShowingSearchResults) { 
                        setIsShowingSearchResults(false); 
                        fetchClientsList(currentPage); 
                      } 
                    }} 
                    className="text-gray-400 hover:text-white transition-colors" 
                    title="Clear Search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {isDropdownOpen && searchQuery.length >= 3 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1b202c] border border-gray-700 rounded shadow-2xl z-[150] max-h-[300px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-gray-400 text-center italic">No matching clients found</div>
                  ) : (
                    <ul className="py-1 text-left">
                      {searchResults.map((result: Client) => (
                        <li
                          key={result.client_id}
                          className="px-4 py-2 hover:bg-[#11141e] cursor-pointer text-[13px] text-gray-300 border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{result.client_name}</span>
                            <span className="text-[11px] text-gray-500">Mobile: {result.client_mobile_1 || '-'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-[10px] text-gray-500 italic mt-1.5 mr-1 pl-1">Min. 3 characters</div>
        </div>
      </div>

      {/* Data Directory Table */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[12px] text-gray-400 font-medium bg-[#1f2536] border-b border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-48">Name</th>
                <th className="px-6 py-4 w-32">Mobile</th>
                <th className="px-6 py-4 w-48">Email</th>
                <th className="px-6 py-4 w-64">Address</th>
                <th className="px-6 py-4 w-24 text-center">View</th>
                <th className="px-6 py-4 w-24 text-center">Settings</th>
                <th className="px-6 py-4 w-24 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                    Loading Clients Directory...
                  </td>
                </tr>
              ) : clientList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No clients found matching the search criteria.
                  </td>
                </tr>
              ) : (
                clientList.map((client) => (
                  <tr
                    key={client.client_id}
                    className="hover:bg-[#1f2536] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {client.client_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {client.client_mobile_1 || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {client.client_email || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 truncate max-w-xs">
                      {client.client_address || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setViewingClient(client); setIsViewOpen(true); }}
                        className="px-3 py-1.5 text-[11px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toast.success(`Configuration settings opened for client: ${client.client_name}`)}
                        className="px-3 py-1.5 text-[11px] bg-gray-600/20 text-gray-300 hover:bg-gray-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap"
                      >
                        <Settings className="w-3 h-3" /> Settings
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setEditingClient(client); setIsEditOpen(true); }}
                        className="px-3 py-1.5 text-[11px] bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-gray-800 text-[13px] text-gray-500 flex justify-between items-center bg-[#191e2b] shrink-0">
          <span>Page {currentPage} of {totalPages} ({totalRows} Total rows fetched)</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 hidden sm:flex">
              <select value={10} disabled className="bg-[#11141e] border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none cursor-not-allowed">
                <option value={10}>10 items per page</option>
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Prev
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Step Onboarding Modal Wizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          {onboardingStep === 1 ? (
            /* Step 1 Modal: Onboard Client Name */
            <form 
              onSubmit={handleStep1Submit}
              className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[460px] max-w-[95vw] animate-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
                <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" /> New Client - Step 1
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 bg-[#11141e] flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-300 block">
                    Client Name <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Manoj Gupta"
                    className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-[13px] font-semibold transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[90px]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2 Modal: Profiling Details */
            <form 
              onSubmit={handleStep2Submit}
              className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[600px] max-w-[95vw] animate-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
                <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" /> New Client - Step 2
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 bg-[#11141e] flex flex-col gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
                
                {/* Client Name (Readonly) */}
                <div className="space-y-1">
                  <label className="text-[12px] text-gray-400 block font-semibold">Client Name</label>
                  <input 
                    type="text" 
                    value={clientName}
                    readOnly
                    className="w-full bg-[#1c2230] border border-gray-700 rounded-lg px-3.5 py-2.5 text-[13px] text-gray-400 outline-none cursor-not-allowed select-none"
                  />
                </div>

                {/* Email Address (Optional) */}
                <div className="space-y-1">
                  <label className="text-[12px] text-gray-400 block font-semibold">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. client@domain.com"
                    className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Mobiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile 1 (Mandatory) */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400 block font-semibold">
                      Mobile 1 <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="number" 
                      value={mobile1}
                      onChange={(e) => setMobile1(e.target.value)}
                      placeholder="e.g. 9954871105"
                      className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Mobile 2 (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400 block font-semibold">Mobile 2</label>
                    <input 
                      type="number" 
                      value={mobile2}
                      onChange={(e) => setMobile2(e.target.value)}
                      placeholder="e.g. 4512021478"
                      className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Permanent Address (Mandatory) */}
                <div className="space-y-1">
                  <label className="text-[12px] text-gray-400 block font-semibold">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Biswanath Chariali, Tezpur"
                    rows={3}
                    className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Fields marked in * are mandatory
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-[13px] font-semibold transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Client"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* View Client Details Modal */}
      <ViewClientModal 
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setViewingClient(null); }}
        client={viewingClient}
      />

      {/* Edit Client Profile Modal */}
      <EditClientModal 
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingClient(null); }}
        client={editingClient}
        onSuccess={() => fetchClientsList(currentPage)}
      />

    </div>
  );
}
