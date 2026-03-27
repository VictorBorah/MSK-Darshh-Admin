'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BudgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface SelectedItem {
  item_id: string;
  item_name: string;
  amount: string;
}

export default function BudgetConfigModal({ isOpen, onClose, projectId, projectName }: BudgetConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [cfgData, setCfgData] = useState<any>(null);
  
  const [selectedBudgetHead, setSelectedBudgetHead] = useState<any>(null);
  const [selectedItemsList, setSelectedItemsList] = useState<SelectedItem[]>([]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Add New Item Modal States
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemData, setAddItemData] = useState({ category_id: '', item_name: '', item_code: '', default_gst: '' });
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Add New Head Modal States
  const [showAddHeadModal, setShowAddHeadModal] = useState(false);
  const [addHeadName, setAddHeadName] = useState('');
  const [addHeadGst, setAddHeadGst] = useState('');
  const [isAddingHead, setIsAddingHead] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchData();
    } else {
      setProjectData(null);
      setCfgData(null);
      setSelectedItemsList([]);
      setSelectedBudgetHead(null);
      setActiveStageId(null);
      setShowAddItemModal(false);
      
      const defaultGstValue = localStorage.getItem('sys_default_gst') || '18.00';
      setAddItemData({ category_id: '', item_name: '', item_code: '', default_gst: defaultGstValue });
      setShowAddHeadModal(false);
      setAddHeadName('');
      setAddHeadGst(defaultGstValue);
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resDetails, resCfg] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchProjectDetails?project_id=${projectId}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`, { headers })
      ]);

      const [detailsArr, cfgArr] = await Promise.all([
        resDetails.text().then(t => JSON.parse(t)),
        resCfg.text().then(t => JSON.parse(t))
      ]);

      const pData = Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;
      const cData = Array.isArray(cfgArr) ? cfgArr[0] : cfgArr;

      if (pData && String(pData.Status) === '1' && cData && String(cData.Status) === '1') {
        setProjectData(pData.project_data);
        setCfgData(cData);
      } else {
        toast.error('Failed to load project or configuration data.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error while fetching configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (option: any) => {
    if (!option) return;
    const itemMatch = cfgData?.items_data?.find((i: any) => String(i.id) === String(option.value));
    if (itemMatch) {
      setSelectedItemsList(prev => {
        if (prev.find(p => String(p.item_id) === String(itemMatch.id))) return prev;
        return [...prev, { item_id: String(itemMatch.id), item_name: itemMatch.item_name, amount: '' }];
      });
    }
  };

  const handleAmountChange = (itemId: string, val: string) => {
    setSelectedItemsList(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, amount: val };
      return item;
    }));
  };

  const handleItemRemove = (itemId: string) => {
    setSelectedItemsList(prev => prev.filter(i => i.item_id !== itemId));
  };

  const handleSaveItemParams = async () => {
    if (!addItemData.category_id || !addItemData.item_name || !addItemData.item_code) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }
    setIsAddingItem(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('category_id', addItemData.category_id);
      formData.append('item_name', addItemData.item_name);
      formData.append('item_code', addItemData.item_code);
      formData.append('default_gst', addItemData.default_gst);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveItem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === '1') {
        toast.success(response.Message || 'Item Added Successfully');
        if (response.items_data) {
          setCfgData((prev: any) => ({ ...prev, items_data: response.items_data }));
        }
        if (response.item_id && response.item_name) {
          setSelectedItemsList(prev => {
             if (prev.find(p => String(p.item_id) === String(response.item_id))) return prev;
             return [...prev, { item_id: String(response.item_id), item_name: response.item_name, amount: '' }];
           });
        }
        setShowAddItemModal(false);
        setAddItemData({ category_id: '', item_name: '', item_code: '', default_gst: localStorage.getItem('sys_default_gst') || '18.00' });
      } else {
        toast.error('Oops, something went wrong!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network failure connecting to remote endpoint.');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleSaveHeadParams = async () => {
    if (!addHeadName.trim()) {
      toast.error('Please enter a budget head name.');
      return;
    }
    setIsAddingHead(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('head_name', addHeadName);
      formData.append('default_gst', addHeadGst);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveHead`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === '1') {
        toast.success(response.Message || 'Head Added Successfully');
        if (response.heads_Arr) {
          setCfgData((prev: any) => ({ ...prev, budget_heads_array: response.heads_Arr }));
        }
        if (response.head_id && response.head_name) {
          setSelectedBudgetHead({ value: String(response.head_id), label: response.head_name });
        }
        setShowAddHeadModal(false);
        setAddHeadName('');
        setAddHeadGst(localStorage.getItem('sys_default_gst') || '18.00');
      } else {
        toast.error(response.Message || 'Oops, something went wrong!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network failure connecting to remote endpoint.');
    } finally {
      setIsAddingHead(false);
    }
  };

  if (!isOpen) return null;

  const stagesData = projectData?.stages_data || [];
  const budgetHeads = cfgData?.budget_heads_array || [];
  const itemsData = cfgData?.items_data || [];

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-all duration-300 w-[1250px] max-w-[95vw] h-auto max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
          <div className="flex flex-col">
            <h2 className="text-[17px] text-white tracking-wide flex items-center gap-2">
              <span className="font-semibold">Budget Configuration:</span> 
              <span className="text-blue-200">{projectName || projectData?.project_name || 'Unnamed Project'}</span>
            </h2>
            <span className="text-[12px] text-gray-500 mt-1 font-medium">Sequence ID: {projectId} / Modifying Project Financials</span>
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
              <p className="text-sm text-[#ccd6f6]">Compiling Core Financial Frameworks...</p>
            </div>
          ) : (!projectData || !cfgData) ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[400px]">
              <p className="text-sm text-red-400 text-center">Failed to initialize data blocks.</p>
            </div>
          ) : (
            <div className="flex gap-8 h-full animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Left Column: Stages Tracking */}
              <div className="w-[320px] shrink-0 flex flex-col border-r border-gray-700/50 pr-6 pl-2">
                <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">Project Stages Tracking</h3>
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[60vh] pl-1 py-1 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {stagesData.map((stage: any, idx: number) => {
                    const isComplete = String(stage.status) === "1";
                    const isActive = activeStageId === stage.stage_id;
                    const displayName = stage.stage_name.length > 20 ? stage.stage_name.substring(0, 18) + '...' : stage.stage_name;
                    return (
                      <div key={stage.stage_id} className={`p-2.5 rounded-md border ${isActive ? 'bg-[#2a3143] border-blue-400 shadow-md transform scale-[1.02]' : isComplete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1e293b] border-gray-700/50'} flex items-center justify-between transition-all duration-200`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-500/20 text-blue-400' : isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                             {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                           </div>
                           <div className="flex flex-col min-w-0 pr-2" title={stage.stage_name}>
                             <span className={`text-[13px] font-semibold truncate ${isActive ? 'text-blue-300' : isComplete ? 'text-emerald-400' : 'text-[#e2e8f0]'}`}>{displayName}</span>
                             <span className="text-[10px] text-gray-500 font-medium tracking-wide">VECTOR {stage.stage_id}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => setActiveStageId(stage.stage_id)}
                          title={`Configure Budget for ${stage.stage_name}`}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ml-2 ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-inner' : isComplete ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                        >
                          {isActive ? 'Active' : 'Configure'}
                        </button>
                      </div>
                    );
                  })}
                  {stagesData.length === 0 && (
                     <p className="text-gray-500 text-sm italic">No stages explicitly mapped.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Budget Setup */}
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">
                  Dynamic Configuration Matrix {activeStageId && <span className="text-white ml-2">- Stage {activeStageId}</span>}
                </h3>
                
                {!activeStageId ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 border border-dashed border-gray-700/50 rounded-xl m-4 bg-[#161a25]">
                     <p className="text-sm text-[#ccd6f6] font-medium">Select a Stage from the left panel to configure its structural financials.</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                           <label className="text-[13px] text-[#ccd6f6] font-medium tracking-wide">Select Item</label>
                           <button onClick={() => setShowAddItemModal(true)} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-transparent border-none outline-none">
                             + Add New Item
                           </button>
                        </div>
                        <Select 
                          options={itemsData.map((i: any) => ({ value: String(i.id), label: i.item_name }))}
                          onChange={handleItemSelect}
                          value={null}
                          placeholder="Select an item.."
                          styles={{
                            control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '38px', boxShadow: 'none' }),
                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                            menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                            option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                            singleValue: base => ({ ...base, color: '#e2e8f0' }),
                            input: base => ({ ...base, color: '#e2e8f0' })
                          }}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                           <label className="text-[13px] text-[#ccd6f6] font-medium tracking-wide">Select Budget Head</label>
                           <button onClick={() => setShowAddHeadModal(true)} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-transparent border-none outline-none">
                             + Add New Head
                           </button>
                        </div>
                        <Select 
                          options={budgetHeads.map((h: any) => ({ value: String(h.id), label: h.head }))}
                          value={selectedBudgetHead}
                          onChange={(val) => setSelectedBudgetHead(val)}
                          placeholder="Select budget head..."
                          styles={{
                            control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '38px', boxShadow: 'none' }),
                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                            menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                            option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                            singleValue: base => ({ ...base, color: '#e2e8f0' }),
                            input: base => ({ ...base, color: '#e2e8f0' })
                          }}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        />
                      </div>
                    </div>

                    {/* Items Injection Scroll Container */}
                    <div className="bg-[#191e2b] border border-gray-700/50 p-4 rounded-md min-h-[50px] shadow-inner max-h-[40vh] overflow-y-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-gray-600 flex-1">
                      <div className="flex justify-between items-center mb-2 px-1 border-b border-gray-700/50 pb-2">
                         <span className="text-[12px] text-gray-400 font-semibold tracking-wide uppercase">Active Item</span>
                         <span className="text-[12px] text-gray-400 font-semibold tracking-wide uppercase">Financial Allotment</span>
                      </div>

                      {selectedItemsList.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-6 opacity-50 h-full">
                           <FileText className="w-8 h-8 text-gray-500 mb-3" />
                           <span className="text-[13px] text-gray-400 text-center px-4">Search and select items above to compile dynamic fiscal nodes...</span>
                         </div>
                      )}

                      {selectedItemsList.map((item) => (
                        <div key={item.item_id} className="flex items-center justify-between gap-3 bg-[#1e293b] p-3 rounded-md border border-gray-700 hover:border-gray-600 transition-colors shadow-sm">
                          <div className="flex flex-col flex-1 min-w-0 pr-4">
                            <span className="text-[#e2e8f0] font-medium text-[13px] truncate" title={item.item_name}>{item.item_name}</span>
                            <span className="text-gray-500 text-[10px] font-bold">NODE {item.item_id}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
                               <input 
                                 type="number" 
                                 min="0"
                                 value={item.amount}
                                 onChange={(e) => handleAmountChange(item.item_id, e.target.value)}
                                 placeholder="0.00"
                                 className="w-[140px] bg-[#11141e] border border-gray-700 text-[#e2e8f0] text-[13px] font-medium rounded pl-7 pr-3 h-8 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                               />
                             </div>
                             <button 
                               onClick={() => handleItemRemove(item.item_id)} 
                               className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                               title="Remove Item"
                             >
                               <X className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-700/50 bg-[#1c2130] flex justify-end gap-3 z-20">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors duration-200">
            Cancel
          </button>
          <button onClick={() => toast('Compiling global Configuration Engine Array...')} className="px-5 py-2 text-sm font-semibold bg-[#2563eb] hover:bg-blue-600 text-white rounded transition-colors duration-200 shadow-sm border border-blue-500/50">
            Save Config
          </button>
        </div>

      </div>

      {/* ADD ITEM MODAL OVERLAY */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c2130] w-[450px] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
             {isAddingItem && (
                <div className="absolute inset-0 bg-[#1c2130]/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                   <p className="text-sm text-blue-300 font-medium tracking-wide animate-pulse">Pushing New Logic Block...</p>
                </div>
             )}
             <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
               <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide">Add New Item</h2>
               <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 flex flex-col gap-5 bg-[#161a25]">
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Select Category <span className="text-red-400">*</span></label>
                 <Select 
                   options={(cfgData?.item_categories_data || []).map((c: any) => ({ value: String(c.master_category_id), label: c.master_category_name }))}
                   onChange={(val: any) => setAddItemData({...addItemData, category_id: val ? val.value : ''})}
                   placeholder="Select master category..."
                   styles={{
                     control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '40px', boxShadow: 'none' }),
                     menuPortal: base => ({ ...base, zIndex: 99999 }),
                     menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                     option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                     singleValue: base => ({ ...base, color: '#e2e8f0' }),
                     input: base => ({ ...base, color: '#e2e8f0' })
                   }}
                   menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                 />
               </div>
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Item Name <span className="text-red-400">*</span></label>
                 <input 
                   type="text" 
                   value={addItemData.item_name}
                   onChange={(e) => setAddItemData({...addItemData, item_name: e.target.value})}
                   className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-10 px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                   placeholder="E.g. Steel Fe500"
                 />
               </div>
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Item Code <span className="text-red-400">*</span></label>
                 <input 
                   type="text" 
                   value={addItemData.item_code}
                   onChange={(e) => setAddItemData({...addItemData, item_code: e.target.value})}
                   className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-10 px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                   placeholder="E.g. ST-500"
                 />
               </div>
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Default GST (%) <span className="text-red-400">*</span></label>
                 <input 
                   type="number" 
                   value={addItemData.default_gst}
                   onChange={(e) => setAddItemData({...addItemData, default_gst: e.target.value})}
                   className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-10 px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                   placeholder="18.00"
                 />
               </div>
             </div>
             <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3">
               <button 
                 onClick={() => setShowAddItemModal(false)}
                 className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSaveItemParams}
                 className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-sm"
               >
                 Add Item
               </button>
             </div>
          </div>
        </div>
      )}

      {/* ADD HEAD MODAL OVERLAY */}
      {showAddHeadModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c2130] w-[450px] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
             {isAddingHead && (
                <div className="absolute inset-0 bg-[#1c2130]/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                   <p className="text-sm text-blue-300 font-medium tracking-wide animate-pulse">Pushing New Head...</p>
                </div>
             )}
             <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
               <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide">Add New Head</h2>
               <button onClick={() => setShowAddHeadModal(false)} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 flex flex-col gap-5 bg-[#161a25]">
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Budget Head Name <span className="text-red-400">*</span></label>
                 <input 
                   type="text" 
                   value={addHeadName}
                   onChange={(e) => setAddHeadName(e.target.value)}
                   className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-10 px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                   placeholder="E.g. Engineering Block"
                 />
               </div>
               <div>
                 <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Default GST (%) <span className="text-red-400">*</span></label>
                 <input 
                   type="number" 
                   value={addHeadGst}
                   onChange={(e) => setAddHeadGst(e.target.value)}
                   className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-10 px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                   placeholder="18.00"
                 />
               </div>
             </div>
             <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3">
               <button 
                 onClick={() => setShowAddHeadModal(false)}
                 className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSaveHeadParams}
                 className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-sm"
               >
                 Add Head
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
