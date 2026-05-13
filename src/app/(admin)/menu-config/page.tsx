'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Loader2, GripVertical, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import WarningAlertModal from '../../../components/WarningAlertModal';

const STATIC_ITEMS = [
  "Dashboard",
  "Projects",
  "Demands",
  "Deliveries",
  "Purchases",
  "Settings",
  "Payments",
  "My Profile",
  "Admin Reports",
  "Expenses Ledger",
  "Supply Ledger"
];

// Helper to generate a stable ID for drag and drop
const createItem = (label: string) => ({ id: `item-${label.toLowerCase().replace(/\s+/g, '-')}`, label });

export default function MenuConfigPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [usergroups, setUsergroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [availableItems, setAvailableItems] = useState<{ id: string, label: string }[]>([]);
  const [assignedItems, setAssignedItems] = useState<{ id: string, label: string }[]>([]);

  // Prevent SSR issues with DragDropContext
  useEffect(() => {
    setIsMounted(true);
    // Initialize available items by default
    setAvailableItems(STATIC_ITEMS.map(createItem));
  }, []);

  // Fetch usergroups on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { }
        data = Array.isArray(data) ? data[0] : data;

        if (data && String(data.Status) === '1') {
          if (data.usergroups_data) {
            setUsergroups(data.usergroups_data);
          }
        } else {
          toast.error(data?.Message || 'Failed to load system config');
        }
      } catch (err) {
        toast.error('Error fetching usergroups');
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchConfig();
  }, []);

  // Fetch menu config when usergroup changes
  useEffect(() => {
    if (!selectedGroup) {
      setAvailableItems(STATIC_ITEMS.map(createItem));
      setAssignedItems([]);
      return;
    }

    const fetchMenu = async () => {
      setIsLoadingMenu(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchMenuConfig?group_id=${selectedGroup.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { }
        data = Array.isArray(data) ? data[0] : data;

        if (data && String(data.Status) === '1') {
          const menuData = data.menu_data || [];

          // Filter to only include the static items we care about
          const fetchedAssignedLabels = menuData
            .map((item: any) => item.menu_item)
            .filter((label: string) => STATIC_ITEMS.includes(label));

          const assigned = fetchedAssignedLabels.map(createItem);
          const available = STATIC_ITEMS
            .filter(label => !fetchedAssignedLabels.includes(label))
            .map(createItem);

          setAssignedItems(assigned);
          setAvailableItems(available);
          toast.success(data.Message || 'Menu config loaded');
        } else {
          setAssignedItems([]);
          setAvailableItems(STATIC_ITEMS.map(createItem));
          toast.error(data?.Message || 'Failed to load menu config');
        }
      } catch (err) {
        toast.error('Error fetching menu configuration');
        setAssignedItems([]);
        setAvailableItems(STATIC_ITEMS.map(createItem));
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenu();
  }, [selectedGroup]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      const items = source.droppableId === 'available' ? Array.from(availableItems) : Array.from(assignedItems);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      if (source.droppableId === 'available') {
        setAvailableItems(items);
      } else {
        setAssignedItems(items);
      }
    } else {
      // Moving between lists
      const sourceList = source.droppableId === 'available' ? Array.from(availableItems) : Array.from(assignedItems);
      const destList = destination.droppableId === 'available' ? Array.from(availableItems) : Array.from(assignedItems);

      const [movedItem] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'available') {
        setAvailableItems(sourceList);
        setAssignedItems(destList);
      } else {
        setAssignedItems(sourceList);
        setAvailableItems(destList);
      }
    }
  };

  const getSlugForMenuItem = (label: string) => {
    switch (label) {
      case 'Dashboard': return 'dashboard';
      case 'Projects': return 'projects';
      case 'Demands': return 'demands';
      case 'Deliveries': return 'deliveries';
      case 'Purchases': return 'procurements';
      case 'Payments': return 'payments';
      case 'Settings': return 'settings';
      case 'My Profile': return 'my-profile';
      case 'Admin Reports': return 'admin-reports';
      case 'Expenses Ledger': return 'expenses-ledger';
      case 'Supply Ledger': return 'supply-ledger';
      default: return label.toLowerCase();
    }
  };

  const handleSave = async () => {
    if (!selectedGroup) {
      setShowWarningModal(true);
      return;
    }

    const menu_data = assignedItems.map((item, index) => ({
      menu_item: item.label,
      slug: getSlugForMenuItem(item.label),
      order_id: String(index + 1)
    }));

    const payload = {
      menu_data
    };

    const formData = new FormData();
    formData.append('group_id', selectedGroup.value);
    formData.append('menu_json', JSON.stringify(payload));

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/updateMenuConfig`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { }
      data = Array.isArray(data) ? data[0] : data;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'Menu saved');
      } else {
        toast.error(data?.Message || 'Failed to save menu configuration');
      }
    } catch (err) {
      toast.error('Error saving menu configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col">
      <h1 className="text-xl font-bold text-white mb-6">Menu Config</h1>

      {/* Top Banner Control */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-[13px] font-medium text-gray-300 shrink-0 sm:w-32">Select Usergroup</label>
          <div className="w-full sm:w-80">
            <Select
              isLoading={isLoadingGroups}
              options={usergroups.map(g => ({ value: g.id, label: g.group_name }))}
              value={selectedGroup}
              onChange={setSelectedGroup}
              placeholder="Select Usergroup.."
              styles={{
                control: (base, state) => ({ ...base, backgroundColor: '#11141e', borderColor: state.isFocused ? '#3b82f6' : '#374151', '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' }, minHeight: '38px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                menu: base => ({ ...base, backgroundColor: '#191e2b', border: '1px solid #374151', borderRadius: '6px' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#2d3a6c' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px' }),
                singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                input: base => ({ ...base, color: '#fff' }),
                placeholder: base => ({ ...base, color: '#6b7280' })
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>
        </div>
      </div>

      {/* Main Drag and Drop Area */}
      <div
        className="relative"
        title={!selectedGroup ? "Select Usergroup First" : undefined}
      >
        {!selectedGroup && (
          <div
            className="absolute inset-0 z-20 cursor-not-allowed"
            onClick={() => setShowWarningModal(true)}
          />
        )}
        <div className={`transition-opacity duration-300 ${!selectedGroup ? 'opacity-50' : 'opacity-100'}`}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative flex-1 min-h-[600px]">
              {isLoadingMenu && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#11141e]/60 backdrop-blur-sm rounded-xl">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-gray-300 font-medium tracking-wide">Loading Configuration...</p>
                </div>
              )}

              {/* Left Pane - Available */}
              <div className="bg-[#191e2b] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-sm max-h-[700px]">
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <Droppable droppableId="available">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[100px] flex flex-col gap-3 rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                      >
                        {availableItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                                className={`flex items-center gap-4 bg-[#e5e7eb] text-gray-900 rounded-[8px] px-4 py-3 shadow transition-transform ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500' : ''}`}
                              >
                                <GripVertical className="w-5 h-5 text-gray-500 shrink-0" />
                                <span className="font-bold text-[14px] tracking-wide">{item.label}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Right Pane - Assigned */}
              <div className="bg-[#2d3a6c] border border-[#2d3a6c] rounded-xl overflow-hidden flex flex-col shadow-sm max-h-[700px]">
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <Droppable droppableId="assigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] flex flex-col gap-3 rounded-md transition-colors p-2 -m-2 ${snapshot.isDraggingOver ? 'bg-white/10' : 'bg-transparent'}`}
                      >
                        {assignedItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                                className={`flex items-center gap-4 bg-[#e5e7eb] text-gray-900 rounded-[8px] px-4 py-3 shadow transition-transform ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-blue-500' : ''}`}
                              >
                                <GripVertical className="w-5 h-5 text-gray-500 shrink-0" />
                                <span className="font-bold text-[14px] tracking-wide">{item.label}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Footer Save Button */}
      <div className="mt-8 mb-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || !selectedGroup}
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-10 rounded-lg shadow transition-colors text-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <WarningAlertModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Action Not Allowed"
        content="Please select a usergroup first before modifying the menu configuration."
      />

    </div>
  );
}
