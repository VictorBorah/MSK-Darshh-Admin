import { X, Maximize2, Minimize2, ClipboardList, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';
import WarningAlertModal from '../../../components/WarningAlertModal';

interface MakeDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  priorities: any[];
  onSuccess?: () => void;
}

export default function MakeDemandModal({ isOpen, onClose, projects, priorities, onSuccess }: MakeDemandModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [separateDemands, setSeparateDemands] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  
  const [showWarning, setShowWarning] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningContent, setWarningContent] = useState('');

  const [pendingProjectChange, setPendingProjectChange] = useState<string | null>(null);

  const [itemsList, setItemsList] = useState<any[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const lastSearchedQuery = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [configuringItem, setConfiguringItem] = useState<any>(null);
  const [configureTitle, setConfigureTitle] = useState('');
  const [configureComment, setConfigureComment] = useState('');
  const [configurePriority, setConfigurePriority] = useState('3');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  useModalEscape(isOpen, () => setShowExitConfirm(true), 200);

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
    if (itemSearch.length === 0) {
      if (lastSearchedQuery.current !== '') {
         lastSearchedQuery.current = '';
         setSearchResults([]);
         setShowSearchDropdown(false);
      }
      return;
    }

    if (!selectedProject) return;

    if (itemSearch.length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (itemSearch === lastSearchedQuery.current) return; 

    const performSearch = async () => {
       if (abortControllerRef.current) abortControllerRef.current.abort();
       
       const controller = new AbortController();
       abortControllerRef.current = controller;
       
       setIsSearching(true);
       
       try {
         const token = localStorage.getItem('at_ki8Xq1iV');
         const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchItem?query_str=${encodeURIComponent(itemSearch)}&project_id=${selectedProject}`;
         
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
           lastSearchedQuery.current = itemSearch;
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
  }, [itemSearch, selectedProject]);

  const handleSelectSearchResult = (result: any) => {
    setShowSearchDropdown(false);
    setItemSearch('');
    lastSearchedQuery.current = '';
    
    const existingIdx = itemsList.findIndex(item => String(item.id) === String(result.item_id));
    if (existingIdx !== -1) {
       const newList = [...itemsList];
       newList[existingIdx].qnty += 1;
       setItemsList(newList);
    } else {
       setItemsList([...itemsList, {
         id: String(result.item_id),
         name: result.item_name,
         unit: result.unit_name || '-',
         qnty: 1,
         priority: '3'
       }]);
    }
  };

  const handleUpdateQuantity = (id: string, val: string) => {
    const num = parseInt(val, 10);
    const newItems = [...itemsList];
    const idx = newItems.findIndex(i => String(i.id) === id);
    if (idx !== -1) {
       newItems[idx].qnty = isNaN(num) ? '' : num;
       setItemsList(newItems);
    }
  };

  const handleOpenConfigure = async (item: any) => {
    if (!selectedProject) {
      setWarningTitle("Project Required");
      setWarningContent("Please select a project first.");
      setShowWarning(true);
      return;
    }
    
    setConfiguringItem(item);
    setConfigureTitle(item.title || '');
    setConfigureComment(item.comment || '');
    setConfigurePriority(item.priority || '3');
    setIsConfigureOpen(true);
    setIsAutoGenerating(true);
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getAutogenDemandTitle?project_id=${selectedProject}&item_id=${item.id}&qnty=${item.qnty}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch(e) { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && data.autogen_title) {
         setConfigureTitle(data.autogen_title);
         setConfigureComment(data.autogen_title);
      }
    } catch (err) {
      console.error('Failed to get autogen title:', err);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleSaveConfigure = () => {
    if (configuringItem) {
      const newItems = [...itemsList];
      const idx = newItems.findIndex(i => String(i.id) === String(configuringItem.id));
      if (idx !== -1) {
         newItems[idx].title = configureTitle;
         newItems[idx].comment = configureComment;
         newItems[idx].priority = configurePriority;
         setItemsList(newItems);
      }
    }
    setIsConfigureOpen(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleConfirmDemand = async () => {
    if (!selectedProject) {
      setWarningTitle("Project Required");
      setWarningContent("Please select a project before confirming the demand.");
      setShowWarning(true);
      return;
    }

    if (itemsList.length === 0) {
      setWarningTitle("No Items");
      setWarningContent("Please add at least one item to the demand.");
      setShowWarning(true);
      return;
    }

    const demandJson = itemsList.map(item => ({
      item_id: String(item.id),
      qnty: String(item.qnty),
      demand_title: item.title || "",
      demand_description: item.comment || "",
      priority: String(item.priority || "3")
    }));

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new URLSearchParams();
      payload.set('project_id', selectedProject);
      payload.set('seg_flag', separateDemands ? '1' : '0');
      payload.set('demand_json', JSON.stringify(demandJson));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/saveDemand`, {
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

      if (String(data.Status) === "1") {
        toast.success(data.Message || "Demand Created");
        if (onSuccess) onSuccess();
        onClose();
        
        // Reset state after success
        setItemsList([]);
        setSelectedProject(null);
        setSeparateDemands(false);
      } else {
        toast.error(data.Message || "Failed to create demand");
      }
    } catch (err: any) {
      console.error('Save Demand Error:', err);
      toast.error(err.message || 'An error occurred while saving the demand');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalItems = itemsList.reduce((sum, item) => sum + (Number(item.qnty) || 0), 0);

  return (
    <>
      <WarningAlertModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard Demand Details?"
        content="Are you sure you want to exit without saving? All progress will be lost."
        onConfirm={() => {
           setShowExitConfirm(false);
           onClose();
        }}
      />
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
               <ClipboardList className="w-5 h-5" /> New Demand
             </h2>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input 
                 type="checkbox" 
                 checked={separateDemands}
                 onChange={(e) => setSeparateDemands(e.target.checked)}
                 className="w-4 h-4 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-1 cursor-pointer transition-all"
               />
               <span className="text-[12px] text-gray-300 font-normal group-hover:text-white transition-colors">Make separate demands</span>
             </label>
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

        {/* Top Controls Row */}
        <div className="px-6 pt-4 pb-7 bg-[#1b202c] border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center shrink-0">
          <div className="flex items-center gap-4">
             <label className="text-[13px] font-normal text-white whitespace-nowrap">Select Project</label>
             <div className="flex-1">
               <Select
                 options={projects.map((p: any) => ({ value: String(p.id || p.project_id), label: p.project_code || p.project_name }))}
                 onChange={(val: any) => {
                    const newProject = val ? val.value : null;
                    if (newProject === selectedProject) return;
                    
                    if (itemsList.length > 0) {
                      setPendingProjectChange(newProject);
                    } else {
                      setSelectedProject(newProject);
                    }
                 }}
                 value={projects.find(p => String(p.id || p.project_id) === selectedProject) ? { value: selectedProject, label: projects.find((p: any) => String(p.id || p.project_id) === selectedProject)?.project_code || projects.find((p: any) => String(p.id || p.project_id) === selectedProject)?.project_name } : null}
                 placeholder="Select a project..."
                 styles={{
                   control: (base, state) => ({ ...base, backgroundColor: '#cdd5df', borderColor: 'transparent', minHeight: '38px', borderRadius: '2px', fontWeight: 400, color: '#111', boxShadow: 'none', cursor: 'pointer', fontSize: '12px' }),
                   menuPortal: base => ({ ...base, zIndex: 99999 }),
                   menu: base => ({ ...base, backgroundColor: '#cdd5df', border: '1px solid #bac4cf', borderRadius: '4px' }),
                   option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#a8b6c8' : state.isFocused ? '#bac4cf' : 'transparent', color: '#111', cursor: 'pointer', fontWeight: 400, fontSize: '12px' }),
                   singleValue: base => ({ ...base, color: '#111', fontWeight: 400, fontSize: '12px' }),
                   placeholder: base => ({ ...base, color: '#555', fontWeight: 400, fontSize: '12px' }),
                   indicatorSeparator: () => ({ display: 'none' })
                 }}
                 menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
               />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <label className="text-[13px] font-normal text-white whitespace-nowrap">Search an Item</label>
             <div className="flex-1 relative" ref={searchContainerRef}>
               {isSearching && (
                 <Loader2 className="w-4 h-4 absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 animate-spin z-10" />
               )}
               <input 
                 type="text"
                 value={itemSearch}
                 onChange={(e) => setItemSearch(e.target.value)}
                 onFocus={(e) => {
                   if (!selectedProject) {
                     e.target.blur();
                     setWarningTitle("Project Selection Required");
                     setWarningContent("Please select a project before searching for an item.");
                     setShowWarning(true);
                   } else if (itemSearch.length >= 3 && searchResults.length > 0) {
                     setShowSearchDropdown(true);
                   }
                 }}
                 placeholder="Type an item .."
                 className="w-full bg-[#cdd5df] border-none rounded-[2px] h-[38px] px-3 text-[12px] font-normal text-gray-900 placeholder:text-gray-500 placeholder:italic focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
               />
               {itemSearch && (
                 <button 
                   onClick={() => setItemSearch('')}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black p-0.5 z-10"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}
               <p className="text-[10px] text-gray-500/70 mt-1 ml-1 font-medium tracking-wide absolute top-full left-0">Min. 3 Characters</p>
               
               {showSearchDropdown && searchResults.length > 0 && (
                 <div className="absolute top-[38px] left-0 right-0 bg-[#cdd5df] border border-[#bac4cf] rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto">
                   <ul className="py-1">
                     {searchResults.map((result) => (
                       <li 
                         key={result.item_id}
                         onClick={() => handleSelectSearchResult(result)}
                         className="px-3 py-2 text-sm text-gray-900 hover:bg-[#a8b6c8] cursor-pointer transition-colors border-b border-[#bac4cf] last:border-0"
                       >
                         <div className="font-semibold truncate text-[13px]">{result.item_name}</div>
                         <div className="text-[11px] text-gray-600 mt-0.5 font-mono">{result.item_code}</div>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
               {showSearchDropdown && itemSearch.length >= 3 && searchResults.length === 0 && !isSearching && (
                 <div className="absolute top-[38px] left-0 right-0 bg-[#cdd5df] border border-[#bac4cf] rounded-md shadow-xl z-50 p-3 text-center text-sm text-gray-600 font-medium">
                   No items found
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Table Body (Vertically scrolling section) */}
        <div className="flex-1 overflow-y-auto bg-[#232b3e] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
           <table className="w-full text-left">
              <thead className="text-[14px] text-white font-bold uppercase bg-[#3f4a60] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-2.5 w-16">SL</th>
                  <th className="px-6 py-2.5 flex-1">ITEM</th>
                  <th className="px-6 py-2.5 w-32">REQ. QNTY</th>
                  <th className="px-6 py-2.5 w-32">UNIT</th>
                  <th className="px-6 py-2.5 w-32 text-center">CONFIGURE</th>
                  <th className="px-6 py-2.5 w-24 text-center">REMOVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {itemsList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-normal text-[12px]">{idx + 1}</td>
                    <td className="px-6 py-4 text-white font-normal text-[12px] truncate">{item.name}</td>
                    <td className="px-6 py-4 text-white font-normal text-[12px]">
                      <input 
                         type="number" 
                         value={item.qnty} 
                         onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                         className="w-20 bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white text-[12px] font-medium outline-none transition-colors"
                         min="1"
                      />
                    </td>
                    <td className="px-6 py-4 text-white font-normal text-[12px]">{item.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenConfigure(item)}
                        className="text-gray-300 hover:text-white transition-colors p-1 rounded hover:bg-white/10 mx-auto block"
                        title="Configure Demand"
                      >
                        <Settings className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          setItemsList(itemsList.filter(i => String(i.id) !== String(item.id)));
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 mx-auto block"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1b202c] border-t border-gray-800 flex flex-col items-end gap-4 shrink-0">
           <div className="text-[12px] text-white font-normal tracking-wide">
              Total Items: <span className="ml-1">{totalItems}</span>
           </div>
           <div className="flex items-center gap-3 w-full justify-end">
              <button 
                onClick={onClose}
                className="px-5 py-2 text-[14px] font-normal text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm min-w-[120px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDemand}
                disabled={isSaving || itemsList.length === 0 || itemsList.some(item => !item.qnty || Number(item.qnty) <= 0)}
                className="flex items-center justify-center gap-2 px-6 py-2 text-[14px] font-normal text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Demand
              </button>
           </div>
        </div>

        <WarningAlertModal 
           isOpen={showWarning}
           onClose={() => setShowWarning(false)}
           title={warningTitle}
           content={warningContent}
        />
        
        <WarningAlertModal 
           isOpen={pendingProjectChange !== null}
           onClose={() => setPendingProjectChange(null)}
           onConfirm={() => {
              setSelectedProject(pendingProjectChange);
              setPendingProjectChange(null);
           }}
           title="Change Project?"
           content="You are about to change the essential reference project for this demand. Do you want to proceed?"
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
                     Configuring for <span className="font-semibold text-white">{configuringItem.name}</span>
                     <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-[11px]">Qty: {configuringItem.qnty}</span>
                   </div>
                 )}
                 <div>
                   <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Demand Title</label>
                   <div className="relative">
                     <input
                       type="text"
                       value={configureTitle}
                       onChange={(e) => setConfigureTitle(e.target.value)}
                       placeholder="Enter demand title"
                       disabled={isAutoGenerating}
                       className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                     />
                     {isAutoGenerating && (
                       <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                     )}
                   </div>
                 </div>
                 <div>
                   <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Demand Comment</label>
                   <textarea
                     value={configureComment}
                     onChange={(e) => setConfigureComment(e.target.value)}
                     maxLength={200}
                     placeholder="Enter demand comment"
                     disabled={isAutoGenerating}
                     rows={3}
                     className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-white text-[13px] block focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 resize-none font-sans"
                   />
                   <div className="text-right text-[11px] text-gray-400 mt-1">
                     Remaining characters: {200 - (configureComment?.length || 0)}
                   </div>
                 </div>
                 <div>
                   <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Choose Priority</label>
                   <Select
                     options={priorities.map((p: any) => ({ value: String(p.id), label: p.priority }))}
                     value={priorities.find(p => String(p.id) === configurePriority) ? { value: configurePriority, label: priorities.find((p: any) => String(p.id) === configurePriority)?.priority } : null}
                     onChange={(val: any) => setConfigurePriority(val ? val.value : '3')}
                     placeholder="Select priority..."
                     isDisabled={isAutoGenerating}
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
              
              <div className="px-6 py-4 bg-[#293653] border-t border-gray-700 flex items-center justify-end gap-3">
                 <button 
                   onClick={() => setIsConfigureOpen(false)}
                   className="px-4 py-2 text-[13px] font-medium text-white bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleSaveConfigure}
                   disabled={isAutoGenerating}
                   className="px-5 py-2 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Save Configuration
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
