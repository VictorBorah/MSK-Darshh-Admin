'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square,
  ChevronDown,
  Search,
  Upload,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import WarningAlertModal from '@/components/WarningAlertModal';

interface ClientProject {
  project_id: string;
  project_name: string;
  project_code?: string;
  site_address?: string | null;
}

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  projects_data?: ClientProject[];
}

interface NewClientPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  paymentModes: any[];
  enableBackDates: string;
  onSuccess: () => void;
}

export default function NewClientPayment({ 
  isOpen, 
  onClose, 
  client, 
  paymentModes, 
  enableBackDates, 
  onSuccess 
}: NewClientPaymentProps) {
  // Inputs state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPayModeId, setSelectedPayModeId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showInUI, setShowInUI] = useState(true);

  // Search queries for custom searchable dropdowns
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [payModeSearchQuery, setPayModeSearchQuery] = useState('');

  // Dropdown open states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPayModeDropdownOpen, setIsPayModeDropdownOpen] = useState(false);

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Warning overlays state
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // DOM Refs for dropdown outside click handling
  const projectRef = useRef<HTMLDivElement>(null);
  const payModeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (payModeRef.current && !payModeRef.current.contains(event.target as Node)) {
        setIsPayModeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset inputs when modal is closed/opened
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId('');
      setAmount('');
      setSelectedPayModeId('');
      setPayDate(new Date().toISOString().split('T')[0]);
      setShowInUI(true);
      setProjectSearchQuery('');
      setPayModeSearchQuery('');
      setIsProjectDropdownOpen(false);
      setIsPayModeDropdownOpen(false);
      setUploadedFilename('');
      setUploadedUrl('');
      setIsUploading(false);
      setIsSaving(false);
      setShowDeleteWarning(false);
      setIsDeletingFile(false);
    }
  }, [isOpen]);

  const convertInputToApiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-'); // [YYYY, MM, DD]
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('my_file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/uploadFile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'File uploaded successfully', { id: 'upload-toast' });
        setUploadedFilename(data.file_name);
        setUploadedUrl(data.presigned_url || data.file_url || '');
      } else {
        toast.error(data?.Message || 'Failed to upload file', { id: 'upload-toast' });
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('An error occurred during file upload', { id: 'upload-toast' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // File Deletion Handler
  const handleFileDelete = async () => {
    if (!uploadedFilename) return;
    setIsDeletingFile(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('filename', uploadedFilename);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/deleteFile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'File deleted successfully', { id: 'delete-toast' });
        setUploadedFilename('');
        setUploadedUrl('');
        setShowDeleteWarning(false);
      } else {
        toast.error(data?.Message || 'Failed to delete file', { id: 'delete-toast' });
      }
    } catch (err) {
      console.error('File delete error:', err);
      toast.error('An error occurred during file deletion', { id: 'delete-toast' });
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Save Payment Form Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!selectedPayModeId) {
      toast.error('Please select a payment mode');
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('project_id', selectedProjectId);
      formData.append('client_id', client.client_id);
      formData.append('pay_mode', selectedPayModeId);
      formData.append('amount', amount);

      if (uploadedFilename) {
        formData.append('filename', uploadedFilename);
      }

      if (enableBackDates === '1' && payDate) {
        formData.append('pay_date', convertInputToApiDate(payDate));
      }

      // If "Show in UI" is checked, hidden should be 1, else 0
      formData.append('hidden', showInUI ? '1' : '0');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveClientPayment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Payment Added successfully', { id: 'save-toast' });
        onSuccess(); // reload parent payments ledger
        onClose(); // close modal
      } else {
        toast.error(data?.Message || 'Failed to save payment', { id: 'save-toast' });
      }
    } catch (err) {
      console.error('Save payment error:', err);
      toast.error('An error occurred while saving the payment', { id: 'save-toast' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Search filtering lists
  const filteredProjects = client.projects_data
    ? client.projects_data.filter(p => (p.project_code || p.project_name).toLowerCase().includes(projectSearchQuery.toLowerCase()))
    : [];

  const filteredPayModes = paymentModes
    ? paymentModes.filter(m => m.mode.toLowerCase().includes(payModeSearchQuery.toLowerCase()))
    : [];

  return (
    <>
      <WarningAlertModal 
        isOpen={showDeleteWarning}
        onClose={() => setShowDeleteWarning(false)}
        title="Delete Uploaded File?"
        content="Are you sure you want to delete this transaction document? This action cannot be undone."
        onConfirm={handleFileDelete}
        isLoading={isDeletingFile}
      />

      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <form 
          onSubmit={handleSave}
          className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[550px] max-w-[95vw] animate-in zoom-in-95 duration-200"
        >
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
            <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
              <PlusCircle className="w-5 h-5 text-blue-400" /> New Payment
            </h2>
            <span className="text-[13px] font-extrabold text-blue-300 font-mono tracking-tight bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-500/20">
              {client.client_name}
            </span>
          </div>

          {/* Form Content Body (mockup matching layout) */}
          <div className="p-6 bg-[#11141e] flex flex-col gap-5 text-gray-300 max-h-[70vh] overflow-y-auto">
            
            {/* Project Selection Searchable Select */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-[13px] font-bold text-gray-400 md:w-32 shrink-0">
                Select Project <span className="text-red-400">*</span>
              </label>
              <div className="relative flex-grow" ref={projectRef}>
                <div
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-700 bg-[#161a25] text-white hover:border-gray-600 cursor-pointer select-none transition-all text-[13px]"
                >
                  <span className="truncate">
                    {selectedProjectId 
                      ? (client.projects_data?.find(p => p.project_id === selectedProjectId)?.project_code || client.projects_data?.find(p => p.project_id === selectedProjectId)?.project_name || 'Select Project')
                      : 'Select Project'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isProjectDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-[260] rounded-xl border border-gray-800 bg-[#1b202c] shadow-2xl p-2 max-h-52 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search project..."
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] rounded-md border border-gray-700 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-0.5">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((p) => (
                          <div
                            key={p.project_id}
                            onClick={() => {
                              setSelectedProjectId(p.project_id);
                              setIsProjectDropdownOpen(false);
                              setProjectSearchQuery('');
                            }}
                            className={`px-3 py-2 rounded-md text-[12.5px] font-semibold cursor-pointer transition-all ${
                              selectedProjectId === p.project_id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#11141e]'
                            }`}
                          >
                            <div className="truncate">{p.project_code || p.project_name}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-3 text-[11px] italic">No projects found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amount input */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-[13px] font-bold text-gray-400 md:w-32 shrink-0">
                Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter transaction amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-grow bg-[#161a25] border border-gray-700 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Pay Mode Searchable Select */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-[13px] font-bold text-gray-400 md:w-32 shrink-0">
                Pay Modes <span className="text-red-400">*</span>
              </label>
              <div className="relative flex-grow" ref={payModeRef}>
                <div
                  onClick={() => setIsPayModeDropdownOpen(!isPayModeDropdownOpen)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-700 bg-[#161a25] text-white hover:border-gray-600 cursor-pointer select-none transition-all text-[13px]"
                >
                  <span className="truncate">
                    {selectedPayModeId 
                      ? (paymentModes.find(m => String(m.id) === selectedPayModeId)?.mode || 'Select Paymode')
                      : 'Select Paymode'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isPayModeDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isPayModeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-[260] rounded-xl border border-gray-800 bg-[#1b202c] shadow-2xl p-2 max-h-52 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search payment mode..."
                        value={payModeSearchQuery}
                        onChange={(e) => setPayModeSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] rounded-md border border-gray-700 bg-[#111522] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-0.5">
                      {filteredPayModes.length > 0 ? (
                        filteredPayModes.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedPayModeId(String(m.id));
                              setIsPayModeDropdownOpen(false);
                              setPayModeSearchQuery('');
                            }}
                            className={`px-3 py-2 rounded-md text-[12.5px] font-semibold cursor-pointer transition-all ${
                              selectedPayModeId === String(m.id) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#11141e]'
                            }`}
                          >
                            <div className="truncate">{m.mode}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-3 text-[11px] italic">No payment modes found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Date picker (conditional based on enableBackDates == "1") */}
            {enableBackDates === '1' && (
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <label className="text-[13px] font-bold text-gray-400 md:w-32 shrink-0 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-200" /> Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  max={new Date().toISOString().split('T')[0]} // block future dates
                  onChange={(e) => setPayDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className="flex-grow bg-[#161a25] border border-gray-700 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer dark-bg-date-picker"
                  required
                />
              </div>
            )}

            {/* Transaction File Upload picker */}
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <label className="text-[13px] font-bold text-gray-400 md:w-32 shrink-0 pt-2.5">
                Txn. File
              </label>
              <div className="flex-grow flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="new-txn-file-input"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />

                {!uploadedFilename ? (
                  <label 
                    htmlFor="new-txn-file-input" 
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-700 bg-[#161a25] hover:bg-[#1c2230] cursor-pointer hover:border-gray-500 transition-all text-[13px] text-gray-400 select-none shadow-inner"
                  >
                    <span className="flex items-center gap-1.5">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          Uploading transaction receipt...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          Click to upload receipt...
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-600 font-semibold uppercase">MAX 2MB</span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-lg border border-emerald-500/20 bg-[#0f2e22]/50 text-[13px] text-emerald-400 shadow-md">
                    <span className="truncate font-semibold tracking-tight max-w-[280px]" title={uploadedFilename}>
                      {uploadedFilename}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteWarning(true)} 
                      className="text-red-400 hover:text-red-200 transition-colors p-1 hover:bg-white/5 rounded cursor-pointer"
                      title="Remove uploaded document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Show in UI checkbox */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="md:w-32 shrink-0"></div>
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={showInUI}
                  onChange={(e) => setShowInUI(e.target.checked)}
                  className="hidden"
                />
                {showInUI ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-500 shrink-0" />
                )}
                <span className="text-[13px] font-bold text-gray-300">
                  Show in UI
                </span>
              </label>
            </div>

          </div>

          {/* Action buttons footer */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="px-8 py-2.5 bg-[#4c2415] hover:bg-[#68301b] border border-orange-700/30 text-orange-300 rounded-lg text-xs font-bold transition-colors select-none"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              disabled={isSaving || isUploading}
              className="px-8 py-2.5 bg-[#1853db] hover:bg-[#2563eb] text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow select-none"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              SAVE
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
