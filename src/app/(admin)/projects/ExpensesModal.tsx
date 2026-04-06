'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, Trash2, GripVertical, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BudgetHead {
  id: string;
  head: string;
}

interface ExpenseItem {
  head_id: string;
  name: string;
  value: string;
}

interface ExpensesModalProps {
  projectId: string;
  configHeads: BudgetHead[];
  initialExpensesJson: string;
  onConfirm: (totalExpense: string, expensesJson: string, updatedHeads: BudgetHead[]) => void;
  onCancel: () => void;
}

export default function ExpensesModal({ projectId, configHeads, initialExpensesJson, onConfirm, onCancel }: ExpensesModalProps) {
  const [availableHeads, setAvailableHeads] = useState<BudgetHead[]>(configHeads || []);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [isAddingHead, setIsAddingHead] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [defaultGst, setDefaultGst] = useState('');

  // Sync initial setup
  useEffect(() => {
    setDefaultGst(localStorage.getItem('sys_default_gst') || '18.00');
    try {
      if (initialExpensesJson && initialExpensesJson !== '[]') {
        const parsed = JSON.parse(initialExpensesJson);
        if (Array.isArray(parsed)) {
          const loaded = parsed.map((item: any) => {
             const headMatch = availableHeads.find(h => String(h.id) === String(item.head_id));
             return {
               head_id: String(item.head_id),
               value: item.value || '',
               name: headMatch ? headMatch.head : 'Unknown Head'
             };
          });
          setExpenseItems(loaded);
        }
      }
    } catch (e) {
      console.error('Error parsing expenses JSON:', e);
    }
  }, [initialExpensesJson, availableHeads]);

  useEffect(() => {
     const total = expenseItems.reduce((acc, curr) => {
        const val = parseFloat(curr.value);
        return acc + (!isNaN(val) ? val : 0);
     }, 0);
     setTotalExpense(total);
  }, [expenseItems]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(expenseItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setExpenseItems(items);
  };

  const handleSelectHead = (option: any) => {
    if (!option) return;
    const headModel = availableHeads.find(h => String(h.id) === String(option.value));
    if (headModel) {
      setExpenseItems(prev => {
        if (prev.find(p => String(p.head_id) === String(headModel.id))) return prev;
        return [...prev, { head_id: String(headModel.id), name: headModel.head, value: '' }];
      });
    }
  };

  const handleRemoveItem = (headId: string) => {
    setExpenseItems(prev => prev.filter(s => String(s.head_id) !== String(headId)));
  };

  const handleChangeAmount = (headId: string, newValue: string) => {
    setExpenseItems(prev => prev.map(item => {
      if (String(item.head_id) === String(headId)) {
        return { ...item, value: newValue };
      }
      return item;
    }));
  };

  const handleConfirm = async () => {
    const finalTotal = totalExpense.toFixed(2);
    
    if (!projectId) {
      toast.error('Project ID is critically missing. Please save base details.');
      return;
    }
    
    if (expenseItems.length === 0) {
      toast.error('Please configure at least one budget head.');
      return;
    }

    const hasEmpty = expenseItems.some(i => i.value.trim() === '' || isNaN(parseFloat(i.value)));
    if (hasEmpty) {
       toast.error('Please ensure all selected budget heads have a valid numeric amount entered.');
       return;
    }

    const jsonPayload = expenseItems.map(item => ({ head_id: item.head_id, value: parseFloat(item.value).toFixed(2) }));
    const jsonString = JSON.stringify(jsonPayload);

    setIsConfirming(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('initial_total_expense', finalTotal);
      formData.append('expenses_json', jsonString);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveExpensesConfig`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Expenses Config saved');
        onConfirm(finalTotal, jsonString, availableHeads);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to save expenses configuration');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server');
      }
    } catch (e: any) {
      toast.error('Network connectivity error. Unable to perform HTTP POST.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAddHead = async () => {
    if (!newHeadName.trim()) {
      toast.error('Please enter a head name.');
      return;
    }
    setIsAddingHead(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('head_name', newHeadName);
      formData.append('default_gst', defaultGst);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveHead`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Head Added successfully!');
        
        let newHeadId = data.head_id;
        
        if (data.heads_Arr && Array.isArray(data.heads_Arr)) {
          setAvailableHeads(data.heads_Arr);
        } else {
          setAvailableHeads(prev => [...prev, { id: newHeadId, head: data.head_name }]);
        }

        const newHead = { head_id: String(newHeadId), name: data.head_name, value: '' };
        setExpenseItems(prev => [...prev, newHead]);

        setNewHeadName('');
        setIsAddModalOpen(false);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to add Head.');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server');
      }
    } catch (e: any) {
      toast.error('Network connectivity error.');
    } finally {
      setIsAddingHead(false);
    }
  };

  return (
    <div className="bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] w-[750px] max-w-[95vw] flex flex-col overflow-hidden relative">
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1c2130] z-20">
        <h2 className="text-[17px] font-semibold text-white tracking-wide">Define Initial Expenses</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 bg-[#f2e8e6] flex-1 flex flex-col z-10">
        <label className="text-[13px] text-gray-800 font-medium mb-1.5 block tracking-wide">Search for a budget head</label>
        <Select 
           options={availableHeads.map(h => ({ value: h.id, label: h.head }))}
           onChange={handleSelectHead}
           value={null}
           placeholder="Select a budget head..."
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
             singleValue: (base) => ({ ...base, color: '#111827' }),
             input: (base) => ({ ...base, color: '#111827' })
           }}
           menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        />

        <div className="flex justify-end mb-4 mt-[-10px]">
          <button onClick={() => setIsAddModalOpen(true)} type="button" className="text-blue-600 hover:text-blue-800 hover:underline text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
            Want to add a new head?
          </button>
        </div>

        <div className="flex justify-between items-center mb-2.5 pr-2">
           <label className="text-[14px] text-gray-800 font-medium">Drag and reorder expenses</label>
           <label className="text-[14px] text-gray-800 font-medium whitespace-nowrap hidden sm:block">Enter expense amount</label>
        </div>

        <div className="bg-[#d1d5db] p-4 rounded-md min-h-[250px] shadow-inner max-h-[40vh] overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="expenses-droppable">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2 min-h-[50px]">
                  {expenseItems.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-8">Search to add budget heads...</div>
                  )}
                  {expenseItems.map((item, index) => (
                    <Draggable key={String(item.head_id)} draggableId={String(item.head_id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between bg-white rounded-md p-2 border ${snapshot.isDragging ? 'border-blue-400 shadow-lg ring-1 ring-blue-400 z-50' : 'border-gray-200 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing hover:text-gray-900 text-gray-400 p-1">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <span className="text-gray-800 text-[14px] font-medium truncate shrink-0 max-w-[200px] xl:max-w-xs">{item.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input 
                               type="number" 
                               value={item.value} 
                               onChange={e => handleChangeAmount(item.head_id, e.target.value)}
                               placeholder="0.00"
                               className="bg-[#e5e7eb] border border-gray-300 text-gray-900 text-[14px] font-semibold rounded-sm px-3 h-[34px] w-[150px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-right no-spinners"
                            />
                            
                            <button onClick={() => handleRemoveItem(String(item.head_id))} type="button" className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors outline-none shrink-0 border border-transparent hover:border-red-200">
                              <Trash2 className="w-[18px] h-[18px]" />
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
        
        <div className="mt-4 flex justify-end items-center mr-2">
            <span className="text-[14px] text-gray-700">Total Initial Expense: </span>
            <span className="text-[15px] text-gray-900 font-bold ml-2">Rs. {totalExpense.toFixed(2)}</span>
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
              <h3 className="text-white font-medium text-[15px]">Add New Head</h3>
              <button disabled={isAddingHead} onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white p-1 bg-transparent border-0"><X className="w-4 h-4" /></button>
            </div>
            <input 
              type="text" 
              placeholder="Head Name"
              value={newHeadName}
              onChange={e => setNewHeadName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddHead()}
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
                onKeyDown={e => e.key === 'Enter' && handleAddHead()}
                className="w-[100px] bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div className="flex justify-end gap-2 text-sm">
              <button type="button" disabled={isAddingHead} onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 text-gray-300 hover:text-white transition-colors bg-transparent border-none outline-none">Cancel</button>
              <button type="button" disabled={isAddingHead} onClick={handleAddHead} className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 min-w-[90px] flex items-center justify-center transition-colors outline-none border-none shadow-sm">
                {isAddingHead ? <Loader2 className="w-4 h-4 animate-spin text-blue-200" /> : 'Add Head'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
