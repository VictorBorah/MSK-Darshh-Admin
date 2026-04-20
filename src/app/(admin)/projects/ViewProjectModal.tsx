'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Share2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';

const FormRow = ({ label, children, alignTop }: { label: string, children: React.ReactNode, alignTop?: boolean }) => (
  <div className={`flex items-${alignTop ? 'start' : 'center'} justify-between gap-3 mb-3 relative`}>
    <label className={`text-[13px] text-[#ccd6f6] w-[140px] shrink-0 font-medium ${alignTop ? 'pt-2' : ''}`}>{label}</label>
    <div className="flex-1 flex items-center gap-2.5 w-[calc(100%-140px)]">
      {children}
    </div>
  </div>
);

const ReadOnlyInput = ({ value, isTextarea = false }: { value: string, isTextarea?: boolean }) => {
  if (isTextarea) {
     return <textarea readOnly value={value} className="w-full bg-[#1e293b] border border-gray-700/50 text-[#e2e8f0] text-[13px] font-medium rounded-sm p-2.5 h-20 focus:outline-none resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] cursor-default" />
  }
  return <input type="text" readOnly value={value} className="w-full bg-[#1e293b] border border-gray-700/50 text-[#e2e8f0] text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] cursor-default" />
};

const HRList = ({ items }: { items?: string[] }) => {
  if (!items || items.length === 0) return <ReadOnlyInput value="" />;
  return (
    <div className="w-full bg-[#1e293b] border border-gray-700/50 text-[#e2e8f0] text-[12px] font-medium rounded-sm p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] min-h-[32px] flex flex-wrap gap-1.5 items-center cursor-default">
      {items.map((item, idx) => (
         <span key={idx} className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">{item}</span>
      ))}
    </div>
  );
};


interface ViewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ViewProjectModal({ isOpen, onClose, projectId, projectName }: ViewProjectModalProps) {
  useModalEscape(isOpen, onClose, 200);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorError, setError] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDetails();
    } else {
      setProjectData(null);
    }
  }, [isOpen, projectId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchProjectDetails?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setProjectData(data.project_data);
      } else {
        setError(data.Message || 'Failed to load project details.');
      }
    } catch (e: any) {
      setError(e.message || 'Network connectivity error.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareText = (text: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title,
        text
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      toast.success(`${title} copied to clipboard!`);
    }
  };

  const handleShareLocation = (coords: string) => {
    if (!coords) return;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${coords}`;
    handleShareText(`Project Location Map Link: \n${mapLink}`, "Share Map Coordinates");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className={`bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-all duration-300 w-[1250px] max-w-[95vw] h-auto max-h-[90vh]`}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
          <div className="flex flex-col">
            <h2 className="text-[17px] text-white tracking-wide flex items-center gap-2">
               <span className="font-semibold">Project Details:</span> <span className="text-blue-200">{projectData?.project_name || projectName} ({projectData?.project_code || '---'})</span>
            </h2>
            <span className="text-[12px] text-gray-400 mt-1 font-medium">Project Sequence {projectId}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e]/50 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-[#ccd6f6]">Loading Project Specifications...</p>
             </div>
          ) : errorError ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[400px]">
                <p className="text-sm text-red-400 text-center">{errorError}</p>
             </div>
          ) : projectData && (
             <div className="animate-in slide-in-from-bottom-4 duration-300 mt-2">
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12">
                     {/* Column 1: Site Properties */}
                     <div className="flex flex-col">
                       <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">Site Properties</h3>

                       <FormRow label="Site Address">
                          <div className="flex w-full gap-2">
                            <div className="flex-1"><ReadOnlyInput value={projectData.site_address || ''} /></div>
                            <button onClick={() => handleShareText(projectData.site_address, `Address for ${projectData.project_name}`)} disabled={!projectData.site_address} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white disabled:opacity-50 h-8 px-2 rounded-sm flex items-center justify-center shrink-0 border border-blue-500/30 transition-colors" title="Share Address">
                               <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                       </FormRow>

                       <FormRow label="District">
                         <ReadOnlyInput value={projectData.district || ''} />
                       </FormRow>

                       <FormRow label="Site Coordinates">
                         <div className="flex w-full gap-2">
                            <div className="flex-1 overflow-hidden"><ReadOnlyInput value={projectData.site_coordinates || ''} /></div>
                            <button onClick={() => handleShareLocation(projectData.site_coordinates)} disabled={!projectData.site_coordinates} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white disabled:opacity-50 h-8 px-2 rounded-sm flex items-center justify-center shrink-0 border border-emerald-500/30 transition-colors" title="Share Location">
                               <MapPin className="w-4 h-4" />
                            </button>
                          </div>
                       </FormRow>

                       <FormRow label="Geofence JSON" alignTop>
                         <ReadOnlyInput value={projectData.geofence_json || ''} isTextarea={true} />
                       </FormRow>

                       <FormRow label="Start Date">
                         <ReadOnlyInput value={projectData.start_date || ''} />
                       </FormRow>

                       <FormRow label="End Date">
                         <ReadOnlyInput value={projectData.end_date || ''} />
                       </FormRow>

                       <FormRow label="Link Client">
                         <ReadOnlyInput value={projectData.client_name || ''} />
                       </FormRow>

                       <FormRow label="Define Stages">
                         <ReadOnlyInput value={projectData.stages_csv || ''} />
                       </FormRow>

                       <FormRow label="Current Stage">
                         <ReadOnlyInput value={projectData.current_stage || ''} />
                       </FormRow>


                     </div>

                     {/* Column 2: HR Management */}
                     <div className="flex flex-col">
                       <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">HR Management</h3>

                       <FormRow label="Linked Accountants" alignTop>
                         <HRList items={projectData.accountants_data} />
                       </FormRow>

                       <FormRow label="Linked Managers" alignTop>
                         <HRList items={projectData.managers_data} />
                       </FormRow>

                       <FormRow label="Linked Engineers" alignTop>
                         <HRList items={projectData.engineers_data} />
                       </FormRow>

                       <FormRow label="Linked Contractors" alignTop>
                         <HRList items={projectData.contractors_data} />
                       </FormRow>

                       <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 mt-8 tracking-wide border-b border-gray-700/50 pb-2">Site Financials</h3>

                       <FormRow label="Allocated Budget">
                         <ReadOnlyInput value={`₹ ${projectData.allocated_budget || '0.00'}`} />
                       </FormRow>

                       <FormRow label="Initial Expenses">
                         <ReadOnlyInput value={`₹ ${projectData.inital_expenditure || '0.00'}`} />
                       </FormRow>

                       <FormRow label="Progress">
                          <div className="w-full h-8 bg-[#1e293b] rounded-sm overflow-hidden flex items-center border border-gray-700/50 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                            <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${projectData.progress_percent || 0}%` }}></div>
                            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white drop-shadow-md">
                               {projectData.progress_percent || 0}%
                            </span>
                          </div>
                       </FormRow>

                       <FormRow label="Status">
                         <div className="w-full flex">
                           <span className={`px-4 py-1.5 rounded font-bold text-[12px] uppercase ${projectData.status === 'Running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700 text-gray-300 border border-gray-600'}`}>
                             {projectData.status || 'Archived'}
                           </span>
                         </div>
                       </FormRow>
                     </div>

                     {/* Column 3: HR Management (con't) */}
                     <div className="flex flex-col">
                       <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">HR Management</h3>

                       <FormRow label="Linked Supervisors" alignTop>
                         <HRList items={projectData.supervisors_data} />
                       </FormRow>

                       <FormRow label="Linked PMs" alignTop>
                         <HRList items={projectData.procurement_managers_data} />
                       </FormRow>

                       <FormRow label="Linked OMs" alignTop>
                         <HRList items={projectData.operation_managers_data} />
                       </FormRow>

                       <FormRow label="Linked Masons" alignTop>
                         <HRList items={projectData.masons_data} />
                       </FormRow>
                     </div>
                 </div>

             </div>
          )}
        </div>
      </div>
    </div>
  );
}
