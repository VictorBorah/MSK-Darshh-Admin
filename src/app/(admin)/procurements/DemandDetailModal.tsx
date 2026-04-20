import { X, Maximize2, Minimize2, ClipboardList, Settings, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import WarningAlertModal from '../../../components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface DemandDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandNo: string | null;
  priorities: any[];
  onSuccess?: () => void;
}

export default function DemandDetailModal({ isOpen, onClose, demandNo, priorities, onSuccess }: DemandDetailModalProps) {
  useModalEscape(isOpen, onClose, 200);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demandsData, setDemandsData] = useState<any[]>([]);
  const [demandHelperTxt, setDemandHelperTxt] = useState('');
  const [itemCount, setItemCount] = useState('');

  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [configuringItem, setConfiguringItem] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isUpdatingDemand, setIsUpdatingDemand] = useState(false);
  const [configureTitle, setConfigureTitle] = useState('');
  const [configureComment, setConfigureComment] = useState('');
  const [configureQuantity, setConfigureQuantity] = useState('');
  const [configurePriority, setConfigurePriority] = useState('3');

  const [originalConfig, setOriginalConfig] = useState<any>({});
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [lastFetchedQuantity, setLastFetchedQuantity] = useState('');
  const [confirmUpdateAlert, setConfirmUpdateAlert] = useState(false);

  const handleOpenConfigure = async (item: any) => {
    setConfiguringItem(item);
    setIsLocked(item.is_locked === 'Yes');
    setConfigureQuantity(item.quantity || '');
    setConfigurePriority(item.priority_id || '3');
    setTitleManuallyEdited(false);
    setLastFetchedQuantity(String(item.quantity || ''));
    setIsConfigureOpen(true);

    const hasTitle = item.auto_title && item.auto_title.trim() !== '';
    const hasDesc = item.description && item.description.trim() !== '';

    if (!hasTitle || !hasDesc) {
      setIsAutoGenerating(true);
      setConfigureTitle('Generating title...');
      setConfigureComment('Generating comment...');

      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const params = new URLSearchParams();
        if (item.project_id) params.set('project_id', item.project_id);
        if (item.item_id) params.set('item_id', item.item_id);
        if (item.quantity) params.set('qnty', item.quantity);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/getAutogenDemandTitle?${params.toString()}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const [data] = await res.json();

        if (String(data.Status) === '1') {
          const generatedTitle = data.autogen_title || '';
          const finalTitle = hasTitle ? item.auto_title : generatedTitle;
          const finalDesc = hasDesc ? item.description : generatedTitle;
          setConfigureTitle(finalTitle);
          setConfigureComment(finalDesc);
          setOriginalConfig({ title: finalTitle, comment: finalDesc, quantity: String(item.quantity || ''), priority: String(item.priority_id || '3') });
        } else {
          const finalTitle = item.auto_title || item.item_name || '';
          const finalDesc = item.description || '';
          setConfigureTitle(finalTitle);
          setConfigureComment(finalDesc);
          setOriginalConfig({ title: finalTitle, comment: finalDesc, quantity: String(item.quantity || ''), priority: String(item.priority_id || '3') });
        }
      } catch (err: any) {
        console.error("Autogen failed:", err);
        const finalTitle = item.auto_title || item.item_name || '';
        const finalDesc = item.description || '';
        setConfigureTitle(finalTitle);
        setConfigureComment(finalDesc);
        setOriginalConfig({ title: finalTitle, comment: finalDesc, quantity: String(item.quantity || ''), priority: String(item.priority_id || '3') });
      } finally {
        setIsAutoGenerating(false);
      }
    } else {
      const finalTitle = item.auto_title || item.item_name || '';
      const finalDesc = item.description || '';
      setConfigureTitle(finalTitle);
      setConfigureComment(finalDesc);
      setOriginalConfig({ title: finalTitle, comment: finalDesc, quantity: String(item.quantity || ''), priority: String(item.priority_id || '3') });
    }
  };

  useEffect(() => {
    if (!isConfigureOpen || titleManuallyEdited || !configuringItem || isLocked) return;
    if (String(configureQuantity) === lastFetchedQuantity) return;
    if (!configureQuantity || String(configureQuantity).trim() === '') return;

    const timer = setTimeout(async () => {
      setIsAutoGenerating(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const params = new URLSearchParams();
        if (configuringItem.project_id) params.set('project_id', configuringItem.project_id);
        if (configuringItem.item_id) params.set('item_id', configuringItem.item_id);
        if (configureQuantity) params.set('qnty', configureQuantity);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/getAutogenDemandTitle?${params.toString()}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const [data] = await res.json();

        if (String(data.Status) === '1') {
          const generatedTitle = data.autogen_title || '';
          setConfigureTitle(generatedTitle);
          setConfigureComment(generatedTitle);
          setLastFetchedQuantity(String(configureQuantity));
        }
      } catch (err) {
        console.error("Autogen qty update failed:", err);
      } finally {
        setIsAutoGenerating(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [configureQuantity, isConfigureOpen, titleManuallyEdited, configuringItem, isLocked, lastFetchedQuantity]);

  const handleUpdateDemand = async () => {
    if (!configuringItem) return;
    
    if (!configureTitle.trim()) {
      toast.error('Demand title is required');
      return;
    }
    if (!configureComment.trim()) {
      toast.error('Demand comment is required');
      return;
    }
    if (!configureQuantity || String(configureQuantity).trim() === '') {
      toast.error('Quantity is required');
      return;
    }
    if (!configurePriority) {
      toast.error('Priority is required');
      return;
    }

    setIsUpdatingDemand(true);
    const toastId = toast.loading('Updating demand...');

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new URLSearchParams();
      payload.set('demand_id', String(configuringItem.demand_id || configuringItem.id || ''));
      payload.set('qnty', String(configureQuantity));
      payload.set('demand_title', configureTitle);
      payload.set('demand_description', configureComment);
      payload.set('priority', configurePriority);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/updateDemand`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch(e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (String(data.Status) === '1') {
        toast.success(data.Message || 'Demand Updated', { id: toastId });
        setIsConfigureOpen(false);
        fetchDetails();
        onSuccess?.();
      } else {
        toast.error(data.Message || 'Failed to update demand', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating demand', { id: toastId });
    } finally {
      setIsUpdatingDemand(false);
    }
  };

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleRemoveDemand = async (id: string) => {
    setRemovingId(id);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new URLSearchParams();
      payload.set('demand_id', id);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/removeDemand`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch(e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (String(data.Status) === '1' || data.Status === 1) {
        toast.success(data.Message || "Demand Removed");
        fetchDetails();
        onSuccess?.();
      } else {
        toast.error(data.Message || "Failed to remove demand");
      }
    } catch (err: any) {
      console.error('Remove Demand Error:', err);
      toast.error(err.message || 'An error occurred while removing');
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    if (isOpen && demandNo) {
      fetchDetails();
    } else {
      setDemandsData([]);
      setDemandHelperTxt('');
      setItemCount('');
    }
  }, [isOpen, demandNo]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchDemandDetail?demand_no=${demandNo}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch(e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (String(data.Status) === '1' || data.Status === 1) {
        toast.success(data.Message || "Demand details fetched successfully");
        setDemandsData(data.demands_data || []);
        setDemandHelperTxt(data.demand_helper_txt || '');
        setItemCount(data.item_count || '');
      } else {
        toast.error(data.Message || "Failed to fetch demand details");
        setDemandsData([]);
      }
    } catch (err: any) {
      console.error('Fetch Demand Detail Error:', err);
      toast.error(err.message || 'An error occurred while fetching details');
      setDemandsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all`}>
      <div 
        className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[900px] max-w-[95vw] max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <div className="flex items-center gap-6">
             <h2 className="text-[16px] text-white font-bold tracking-wide flex items-center gap-2">
               <ClipboardList className="w-5 h-5" /> Demand Details
               {demandHelperTxt && (
                 <span className="text-[13px] text-gray-300 font-normal ml-2">({demandHelperTxt})</span>
               )}
             </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
              title={isMaximized ? "Restore Size" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Body (Vertically scrolling section) */}
        <div className="flex-1 overflow-y-auto bg-[#232b3e] p-4 flex flex-col relative">
           {isLoading ? (
             <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-sm">
               <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
               <p className="text-gray-300 font-medium tracking-wide">Loading details...</p>
             </div>
           ) : (
             <table className="w-full text-[12px] text-left">
                <thead className="text-[12px] text-gray-900 font-bold uppercase bg-[#cdd5df]">
                  <tr>
                    <th className="px-4 py-3 border-r border-[#bac4cf] w-12 text-center">SL</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf]">DATE</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf]">PROJECT</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf]">ITEM</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf]">QNTY</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf]">PRIORITY</th>
                    <th className="px-4 py-3 border-r border-[#bac4cf] text-center w-24">MORE</th>
                    <th className="px-4 py-3 text-center w-24">REMOVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {demandsData.map((row, idx) => (
                    <tr key={row.demand_id || row.id} className={`transition-colors ${row.is_locked === 'Yes' ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-white/5'}`}>
                      <td className="px-4 py-3 text-white text-center font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 text-white">{row.demand_date || '-'}</td>
                      <td className="px-4 py-3 text-white">{row.project_name || '-'}</td>
                      <td className="px-4 py-3 text-white">{row.item_name || '-'}</td>
                      <td className="px-4 py-3 text-white">{row.quantity_txt || row.quantity || '-'}</td>
                      <td className="px-4 py-3 text-white text-xs">
                         <span className={`px-2 py-1 rounded-sm shadow border ${(row.priority_txt || '').toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : (row.priority_txt || '').toLowerCase() === 'medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                            {row.priority_txt || '-'}
                         </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => handleOpenConfigure(row)}
                          className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setConfirmRemoveId(String(row.demand_id || row.id))}
                          disabled={removingId === String(row.demand_id || row.id) || row.is_locked === 'Yes'}
                          title={row.is_locked === 'Yes' ? 'Demand Locked' : 'Remove'}
                          className="text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors p-1 rounded hover:bg-red-500/10 mx-auto block disabled:cursor-not-allowed"
                        >
                          {removingId === String(row.demand_id || row.id) ? (
                            <Loader2 className="w-[18px] h-[18px] animate-spin" />
                          ) : (
                            <Trash2 className="w-[18px] h-[18px]" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {demandsData.length === 0 && (
                    <tr>
                       <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No demands found.</td>
                    </tr>
                  )}
                </tbody>
             </table>
           )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1b202c] border-t border-gray-800 flex flex-col items-end gap-4 shrink-0">
           <div className="text-[12px] text-white font-normal tracking-wide">
              Total Items: <span className="ml-1">{itemCount || demandsData.length}</span>
           </div>
           <div className="flex items-center gap-3 w-full justify-end">
              <button 
                onClick={onClose}
                className="px-5 py-2 text-[14px] font-normal text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors shadow-sm min-w-[120px]"
              >
                Close
              </button>
           </div>
        </div>

        <WarningAlertModal 
           isOpen={confirmRemoveId !== null}
           onClose={() => setConfirmRemoveId(null)}
           onConfirm={() => {
              if (confirmRemoveId) {
                 handleRemoveDemand(confirmRemoveId);
                 setConfirmRemoveId(null);
              }
           }}
           title="Remove item?"
           content="This action cannot be reversed."
        />

        <WarningAlertModal 
           isOpen={confirmUpdateAlert}
           onClose={() => setConfirmUpdateAlert(false)}
           onConfirm={() => {
              setConfirmUpdateAlert(false);
              handleUpdateDemand();
           }}
           title="Update Demand?"
           content="Are you sure you want to update this demand record?"
        />

        {/* Configure Demand Modal */}
        {isConfigureOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[500px] max-w-[95vw]">
              <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653]">
                <h3 className="text-[15px] text-white font-bold tracking-wide flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  Configure Demand
                </h3>
                <button 
                  onClick={() => setIsConfigureOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-4 bg-[#1b202c]">
                 {configuringItem && (
                   <div className="text-[13px] text-gray-300 border-b border-gray-700/50 pb-3">
                     Configuring for <span className="font-semibold text-white">{configuringItem.item_name}</span>
                     <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-[11px]">Qty: {configuringItem.quantity}</span>
                   </div>
                 )}
                 <div>
                   <label className="flex items-center gap-2 text-[13px] font-medium text-gray-300 mb-1.5">
                     Demand Title
                     {isAutoGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                   </label>
                   <div className="relative">
                     <input
                       type="text"
                       value={configureTitle}
                       onChange={(e) => {
                         setConfigureTitle(e.target.value);
                         setTitleManuallyEdited(true);
                       }}
                       disabled={isLocked || isAutoGenerating}
                       placeholder="Enter demand title"
                       className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="flex items-center gap-2 text-[13px] font-medium text-gray-300 mb-1.5">
                     Demand Comment
                     {isAutoGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                   </label>
                   <textarea
                     value={configureComment}
                     onChange={(e) => {
                       setConfigureComment(e.target.value);
                       setTitleManuallyEdited(true);
                     }}
                     disabled={isLocked || isAutoGenerating}
                     maxLength={200}
                     placeholder="Enter demand comment"
                     rows={3}
                     className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-white text-[13px] block focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                   />
                   <div className="text-right text-[11px] text-gray-400 mt-1">
                     Remaining characters: {200 - (configureComment?.length || 0)}
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Item Quantity</label>
                     <input
                       type="number"
                       value={configureQuantity}
                       onChange={(e) => setConfigureQuantity(e.target.value)}
                       disabled={isLocked}
                       placeholder="Enter quantity"
                       className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-[7px] text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     />
                   </div>
                   <div>
                     <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Choose Priority</label>
                     <Select
                       options={priorities?.map((p: any) => ({ value: String(p.id), label: p.priority })) || []}
                       value={priorities?.find(p => String(p.id) === configurePriority) ? { value: configurePriority, label: priorities.find((p: any) => String(p.id) === configurePriority)?.priority } : null}
                       onChange={(val: any) => setConfigurePriority(val ? val.value : '3')}
                       isDisabled={isLocked}
                       placeholder="Select priority..."
                       styles={{
                         control: (base, state) => ({ ...base, backgroundColor: '#161a25', borderColor: state.isFocused ? '#3b82f6' : '#4b5563', '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' }, minHeight: '38px', borderRadius: '4px', fontWeight: 400, color: '#fff', boxShadow: 'none', cursor: 'pointer', fontSize: '13px' }),
                         menuPortal: base => ({ ...base, zIndex: 99999 }),
                         menu: base => ({ ...base, backgroundColor: '#161a25', border: '1px solid #4b5563', borderRadius: '4px' }),
                         option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#374151' : state.isFocused ? '#1f2937' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 400, fontSize: '13px' }),
                         singleValue: base => ({ ...base, color: '#fff', fontWeight: 400, fontSize: '13px' }),
                         placeholder: base => ({ ...base, color: '#9ca3af', fontWeight: 400, fontSize: '13px' }),
                         indicatorSeparator: () => ({ display: 'none' })
                       }}
                       menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                     />
                   </div>
                 </div>
              </div>
              
              <div className="px-6 py-4 bg-[#293653] border-t border-gray-700 flex items-center justify-end gap-3">
                 <button 
                   onClick={() => setIsConfigureOpen(false)}
                   className="px-4 py-2 text-[13px] font-medium text-white bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => setConfirmUpdateAlert(true)}
                   disabled={isLocked || isUpdatingDemand || isAutoGenerating || (configureTitle === originalConfig.title && configureComment === originalConfig.comment && String(configureQuantity) === originalConfig.quantity && String(configurePriority) === originalConfig.priority)}
                   title={isLocked ? "Demand Locked, cannot update" : "Update Demand"}
                   className="flex items-center gap-2 justify-center px-5 py-2 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isUpdatingDemand && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                   Update Demand
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
