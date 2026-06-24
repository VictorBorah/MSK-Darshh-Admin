import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, HelpCircle, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import WarningAlertModal from '../../../components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface SaveProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  isSaving?: boolean;
  isMarkedComplete?: boolean;
  projects: any[];
  projectId: string;
}

export default function SaveProcurementModal({ isOpen, onClose, onConfirm, isSaving = false, isMarkedComplete = false, projects, projectId }: SaveProcurementModalProps) {
  const [status, setStatus] = useState<string>('');

  const [hasGstInvoice, setHasGstInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedInvoiceFilename, setUploadedInvoiceFilename] = useState('');
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');

  const [showDeleteInvoiceWarning, setShowDeleteInvoiceWarning] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  const [showEscapeWarning, setShowEscapeWarning] = useState(false);
  useModalEscape(isOpen, () => setShowEscapeWarning(true), 400);

  const [scheduleSelectedStage, setScheduleSelectedStage] = useState<string | null>(null);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);
  const [stageSearchQuery, setStageSearchQuery] = useState('');
  const stageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('5');
      setHasGstInvoice(false);
      setInvoiceNumber('');
      setInvoiceFile(null);
      setIsUploading(false);
      setUploadedInvoiceFilename('');
      setUploadedInvoiceUrl('');
      setShowDeleteInvoiceWarning(false);
      setIsDeletingInvoice(false);
      setScheduleSelectedStage(null);
      setIsStageDropdownOpen(false);
      setStageSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setIsStageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProjectObj = projects?.find(p => String(p.id || p.project_id) === String(projectId));
  const stages = currentProjectObj?.stages_data || [];
  const filteredStages = stages.filter((s: any) => 
    s.stage_name.toLowerCase().includes(stageSearchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInvoiceFile(file);
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
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'File uploaded successfully');
        setUploadedInvoiceFilename(data.file_name);
        setUploadedInvoiceUrl(data.presigned_url);
      } else {
        toast.error(data?.Message || 'Failed to upload file');
        setInvoiceFile(null);
      }
    } catch (err) {
      console.error("Upload error", err);
      toast.error('An error occurred during file upload');
      setInvoiceFile(null);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFileDelete = async () => {
    if (!uploadedInvoiceFilename) return;
    setIsDeletingInvoice(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('filename', uploadedInvoiceFilename);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/deleteFile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'File Deleted');
        setInvoiceFile(null);
        setUploadedInvoiceFilename('');
        setUploadedInvoiceUrl('');
        setShowDeleteInvoiceWarning(false);
      } else {
        toast.error(data?.Message || 'Failed to delete file');
      }
    } catch (err) {
      console.error("Delete error", err);
      toast.error('An error occurred during file deletion');
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  const handleConfirm = () => {
    if (!status) {
      toast.error('Please select a payment status');
      return;
    }
    if (stages.length > 0 && !scheduleSelectedStage) {
      toast.error('Please select a stage');
      return;
    }
    if (hasGstInvoice && !uploadedInvoiceFilename) {
      toast.error('Please upload the GST invoice file');
      return;
    }

    const data = {
      status: status,
      has_gst_invoice: hasGstInvoice ? '1' : '0',
      invoice_number: invoiceNumber,
      invoice_file: uploadedInvoiceFilename,
      invoice_url: uploadedInvoiceUrl,
      stage_id: scheduleSelectedStage || ''
    };

    onConfirm(data);
  };

  const isFormDisabled = isSaving || isUploading || isDeletingInvoice;
  const preventConfirm = !status || (hasGstInvoice && !uploadedInvoiceFilename) || (stages.length > 0 && !scheduleSelectedStage);

  const statusOptions = [
    { value: '4', label: 'Ordered and Paid', isDisabled: true },
    { value: '5', label: 'Ordered without payment' }
  ];

  if (!isOpen) return null;

  return (
    <>
      <WarningAlertModal
        isOpen={showEscapeWarning}
        onClose={() => setShowEscapeWarning(false)}
        title="Discard Procurement Settings?"
        content="Are you sure you want to exit without finalizing? All progress will be lost."
        onConfirm={() => {
          setShowEscapeWarning(false);
          onClose();
        }}
      />
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col w-[550px] max-w-[95vw] rounded-xl animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] rounded-t-xl">
            <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Finalize Purchase Order
            </h2>
            <button onClick={onClose} disabled={isFormDisabled} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 bg-[#161a25] flex flex-col gap-6 relative">
            {isSaving && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#161a25]/60 backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-[13px] font-semibold text-white tracking-wide">Processing...</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-gray-300">Payment Status <span className="text-red-400">*</span></label>
              <Select
                options={statusOptions}
                value={statusOptions.find(o => o.value === status) || null}
                onChange={(val: any) => setStatus(val ? val.value : '')}
                isDisabled={isFormDisabled || isMarkedComplete}
                isOptionDisabled={(option: any) => !!option.isDisabled}
                placeholder="Select Status..."
                styles={{
                  control: (base, state) => ({ ...base, backgroundColor: '#1b202c', borderColor: state.isFocused ? '#3b82f6' : '#4b5563', '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' }, minHeight: '40px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                  menuPortal: base => ({ ...base, zIndex: 99999 }),
                  menu: base => ({ ...base, backgroundColor: '#1b202c', border: '1px solid #4b5563', borderRadius: '6px' }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isDisabled
                      ? '#131722'
                      : state.isSelected
                      ? '#374151'
                      : state.isFocused
                      ? '#1f2937'
                      : 'transparent',
                    color: state.isDisabled ? '#6b7280' : '#fff',
                    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                    fontSize: '13px'
                  }),
                  singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                  input: base => ({ ...base, color: '#fff' })
                }}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
            </div>

            {stages.length > 0 && (
              <div className="flex flex-col gap-2 relative" ref={stageDropdownRef}>
                <label className="text-[13px] font-medium text-gray-300">Select Stage <span className="text-red-400">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStageDropdownOpen(!isStageDropdownOpen);
                    }}
                    className="w-full bg-[#1b202c] text-white rounded-[6px] px-3.5 py-2.5 text-left font-normal text-[13px] flex items-center justify-between border border-[#4b5563] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span className={scheduleSelectedStage ? "text-white font-normal" : "text-gray-400 font-normal"}>
                      {stages.find((s: any) => String(s.stage_id) === String(scheduleSelectedStage))?.stage_name || "Select Stage..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 stroke-[2.5]" />
                  </button>
                  
                  {isStageDropdownOpen && (
                    <div className="absolute top-[42px] left-0 right-0 z-50 bg-[#1b202c] border border-gray-600 rounded shadow-2xl overflow-hidden flex flex-col max-h-60">
                      {/* Search input inside Stage select */}
                      <div className="p-2 border-b border-gray-700">
                        <input
                          type="text"
                          placeholder="Search stage..."
                          value={stageSearchQuery}
                          onChange={(e) => setStageSearchQuery(e.target.value)}
                          className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
                          autoFocus
                        />
                      </div>
                      
                      {/* Dropdown Options */}
                      <div className="overflow-y-auto max-h-40 divide-y divide-gray-700/50">
                        {filteredStages.length === 0 ? (
                          <div className="p-3 text-center text-xs text-gray-400 font-semibold">
                            No stages found
                          </div>
                        ) : (
                          filteredStages.map((s: any) => (
                            <button
                              key={s.stage_id}
                              type="button"
                              onClick={() => {
                                setScheduleSelectedStage(String(s.stage_id));
                                setIsStageDropdownOpen(false);
                                setStageSearchQuery('');
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-600/20 text-white ${
                                String(s.stage_id) === String(scheduleSelectedStage) ? "bg-blue-600/30 text-blue-400" : ""
                              }`}
                            >
                              {s.stage_name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="hidden bg-[#1b202c] p-4 border border-gray-700/80 rounded-lg flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={hasGstInvoice}
                    onChange={(e) => setHasGstInvoice(e.target.checked)}
                    disabled={isFormDisabled}
                    className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded bg-[#11141e] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5" title="Upload a GST Invoice covering the entire procurement">
                  Upload GST Invoice
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
                </span>
              </label>

              {hasGstInvoice && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-[#11141e] p-4 rounded-md border border-gray-700/50">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      disabled={isFormDisabled}
                      placeholder="Inv. Number..."
                      className="w-full bg-[#1b202c] border border-gray-600 rounded-md px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-gray-400">Click here to upload GST invoice</label>
                    {!uploadedInvoiceFilename ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          disabled={isFormDisabled}
                          className={`block w-full text-[12px] text-gray-400
                                        file:mr-4 file:py-2 file:px-4 
                                        file:rounded-md file:border-0 
                                        file:text-[12px] file:font-semibold 
                                        file:bg-gray-700 file:text-white 
                                        cursor-pointer ${(isUploading || isFormDisabled) ? 'opacity-50' : 'hover:file:bg-gray-600'}`}
                        />
                        {isUploading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin absolute right-2 top-0.5" />}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#1f2937] border border-gray-600 rounded-md p-2 mt-1">
                        <a href={uploadedInvoiceUrl} target="_blank" rel="noreferrer" className="text-[12px] text-blue-400 hover:text-blue-300 font-medium truncate block max-w-[85%] border-b border-transparent hover:border-blue-400/50 pb-0.5">
                          Click here to download and preview file
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowDeleteInvoiceWarning(true)}
                          disabled={isFormDisabled}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {hasGstInvoice && !uploadedInvoiceFilename && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 p-3 rounded-lg animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[12px] leading-relaxed">
                  You have checked the box to upload a GST invoice. Please upload the file before saving to proceed.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={isFormDisabled}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={preventConfirm || isFormDisabled}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2"
            >
              Confirm and Save
            </button>
          </div>
        </div>
      </div>

      <WarningAlertModal
        isOpen={showDeleteInvoiceWarning}
        onClose={() => setShowDeleteInvoiceWarning(false)}
        title="Remove Invoice?"
        content="Are you sure you want to delete this uploaded invoice file? This action cannot be undone."
        onConfirm={handleFileDelete}
        isLoading={isDeletingInvoice}
      />
    </>
  );
}
