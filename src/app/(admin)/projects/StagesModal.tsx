'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, Trash2, GripVertical, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';

interface Stage {
  id: string;
  stage: string;
}

interface StagesModalProps {
  projectId: string;
  configStages: Stage[];
  initialStagesCsv: string;
  initialCurrentStage: string;
  onConfirm: (stagesCsv: string, currentStage: string, updatedConfigStages: Stage[]) => void;
  onCancel: () => void;
}

export default function StagesModal({ projectId, configStages, initialStagesCsv, initialCurrentStage, onConfirm, onCancel }: StagesModalProps) {
  useModalEscape(true, onCancel, 200);
  const [availableStages, setAvailableStages] = useState<Stage[]>(configStages || []);
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);
  const [currentStageId, setCurrentStageId] = useState<string>(initialCurrentStage || '');
  
  // Custom Add Stage Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [defaultGst, setDefaultGst] = useState('');

  // Sync initial setup
  useEffect(() => {
    setDefaultGst(localStorage.getItem('sys_default_gst') || '18.00');
    if (initialStagesCsv) {
      const ids = initialStagesCsv.split(',').map(id => id.trim());
      const loadedSelectedStages = ids.map(id => availableStages.find(s => String(s.id) === id)).filter(Boolean) as Stage[];
      setSelectedStages(loadedSelectedStages);
    }
  }, [initialStagesCsv, availableStages]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(selectedStages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedStages(items);
  };

  const handleSelectStage = (option: any) => {
    if (!option) return;
    const stage = availableStages.find(s => String(s.id) === String(option.value));
    if (stage) {
      setSelectedStages(prev => {
        if (prev.find(p => String(p.id) === String(stage.id))) return prev;
        return [...prev, stage];
      });
    }
  };

  const handleSetCurrent = (stageId: string) => {
    setCurrentStageId(stageId);
  };

  const handleRemoveStage = (stageId: string) => {
    setSelectedStages(prev => prev.filter(s => String(s.id) !== String(stageId)));
    if (String(currentStageId) === String(stageId)) setCurrentStageId('');
  };

  const handleConfirm = async () => {
    const csv = selectedStages.map(s => s.id).join(',');
    
    if (selectedStages.length === 0) {
      toast.error('Please add at least one stage.');
      return;
    }

    if (!currentStageId) {
      toast.error('Please click "Set Current" to select the current active stage.');
      return;
    }
    
    setIsConfirming(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('x_project_id', projectId);
      formData.append('current_stage', currentStageId);
      formData.append('stages_csv', csv);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveStagesConfig`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Stages Configuration Saved');
        onConfirm(csv, currentStageId, availableStages);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to save stages configuration');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server');
      }
    } catch (e: any) {
      toast.error('Network connectivity error. Unable to save stages configuration.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      toast.error('Please enter a stage name.');
      return;
    }
    setIsAddingStage(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('stage_name', newStageName);
      formData.append('project_id', projectId);
      formData.append('default_gst', defaultGst);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveStage`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Stage Added successfully!');
        
        let newStageId = data.stage_id;
        
        // Ensure available stages are fully updated if backend returns the rest map
        if (data.stages && Array.isArray(data.stages)) {
          setAvailableStages(data.stages);
        } else {
          setAvailableStages(prev => [...prev, { id: newStageId, stage: data.stage_name }]);
        }

        // Push new item natively to our selected pipeline 
        const newStage = { id: String(newStageId), stage: data.stage_name };
        setSelectedStages(prev => [...prev, newStage]);

        setNewStageName('');
        setIsAddModalOpen(false);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to add Stage. Try again.');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server');
      }
    } catch (e: any) {
      toast.error('Network connectivity error. Unable to perform HTTP POST.');
    } finally {
      setIsAddingStage(false);
    }
  };

  return (
    <div className="bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] w-[700px] max-w-[95vw] flex flex-col overflow-hidden relative">
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1c2130] z-20">
        <h2 className="text-[17px] font-semibold text-white tracking-wide">Define Stages</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 bg-[#f2e8e6] flex-1 flex flex-col z-10">
        <label className="text-[13px] text-gray-800 font-medium mb-1.5 block tracking-wide">Search for a stage</label>
        <Select 
           options={availableStages.map(s => ({ value: s.id, label: s.stage }))}
           onChange={handleSelectStage}
           value={null}
           placeholder="Select a stage..."
           className="mb-5"
           styles={{
             control: (base, state) => ({ ...base, minHeight: '38px', height: '38px', fontSize: '14px', boxShadow: 'none', borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' }),
             menuPortal: base => ({ ...base, zIndex: 9999 }),
             option: (base, state) => ({
               ...base,
               color: state.isSelected ? '#fff' : '#111827',
               backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : 'transparent',
               cursor: 'pointer'
             }),
             singleValue: (base) => ({
               ...base,
               color: '#111827'
             }),
             input: (base) => ({
               ...base,
               color: '#111827'
             })
           }}
           menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        />

        <div className="flex justify-between items-end mb-2.5">
          <label className="text-[14px] text-gray-800 font-medium">Drag and reorder stages</label>
          <button onClick={() => setIsAddModalOpen(true)} type="button" className="text-blue-600 hover:text-blue-800 hover:underline text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
            Want to add a new stage?
          </button>
        </div>

        <div className="bg-[#d1d5db] p-4 rounded-md min-h-[250px] shadow-inner max-h-[40vh] overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages-droppable">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2 min-h-[50px]">
                  {selectedStages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-8">Search to inject draggable stage endpoints...</div>
                  )}
                  {selectedStages.map((stage, index) => (
                    <Draggable key={String(stage.id)} draggableId={String(stage.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between bg-white rounded-md p-2.5 border ${snapshot.isDragging ? 'border-blue-400 shadow-lg ring-1 ring-blue-400 z-50' : 'border-gray-200 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing hover:text-gray-900 text-gray-400 p-1">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <span className="text-gray-800 text-[14px] font-medium">{stage.stage}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleSetCurrent(String(stage.id))}
                              className={`px-4 py-1.5 rounded-sm text-white text-[12px] font-semibold transition-colors shadow-sm min-w-[100px]
                                ${String(currentStageId) === String(stage.id) ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-[#a7f3d0] text-emerald-900 hover:bg-[#6ee7b7]'}`}
                            >
                              {String(currentStageId) === String(stage.id) ? 'Current' : 'Set Current'}
                            </button>
                            
                            <button onClick={() => handleRemoveStage(String(stage.id))} type="button" className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors outline-none">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#1c2130] flex justify-end gap-3 border-t border-gray-700/50 z-20">
        <button type="button" disabled={isConfirming} onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 outline-none border border-gray-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm disabled:opacity-50">
          Cancel
        </button>
        <button type="button" disabled={isConfirming} onClick={handleConfirm} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 outline-none border-none text-white font-medium text-sm rounded-md transition-colors shadow-sm min-w-[100px] flex items-center justify-center">
          {isConfirming ? <Loader2 className="w-4 h-4 animate-spin text-blue-200" /> : 'Confirm'}
        </button>
      </div>

      {isAddModalOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in zoom-in duration-200">
          <div className="bg-[#1c2130] border border-gray-700 shadow-2xl rounded-xl p-5 w-[350px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-[15px]">Add New Stage</h3>
              <button disabled={isAddingStage} onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white p-1 bg-transparent border-0"><X className="w-4 h-4" /></button>
            </div>
            <input 
              type="text" 
              placeholder="Stage Name"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStage()}
              autoFocus
              className="w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="mb-5 flex items-center justify-between">
              <label className="text-[12px] text-gray-300 font-medium">Default GST (%)</label>
              <input 
                type="number"
                placeholder="0.00"
                value={defaultGst}
                onChange={e => setDefaultGst(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStage()}
                className="w-[100px] bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div className="flex justify-end gap-2 text-sm">
              <button type="button" disabled={isAddingStage} onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 text-gray-300 hover:text-white transition-colors bg-transparent border-none outline-none">Cancel</button>
              <button type="button" disabled={isAddingStage} onClick={handleAddStage} className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 min-w-[90px] flex items-center justify-center transition-colors outline-none border-none shadow-sm">
                {isAddingStage ? <Loader2 className="w-4 h-4 animate-spin text-blue-200" /> : 'Add Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
