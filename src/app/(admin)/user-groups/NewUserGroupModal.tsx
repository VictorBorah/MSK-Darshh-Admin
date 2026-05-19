'use client';

import { X, Loader2, Save, Maximize2, Minimize2, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import WarningAlertModal from '../../../components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

interface Permission {
  id: string;
  permisson_txt: string;
}

const groupPermissions = (perms: Permission[]) => {
  const groups: Record<string, Permission[]> = {
    'Project & Site Info': [],
    'Financials & Expenses': [],
    'Procurement & Inventory': [],
    'Staff & Administration': [],
    'Other': []
  };

  perms.forEach(perm => {
    const txt = perm.permisson_txt.toLowerCase();
    if (txt.includes('project') || txt.includes('site') || txt.includes('blueprint') || txt.includes('legal') || txt.includes('geofence')) {
      if (txt.includes('budget') || txt.includes('expenses') || txt.includes('ledger') || txt.includes('payment') || txt.includes('salaries')) {
        groups['Financials & Expenses'].push(perm);
      } else {
        groups['Project & Site Info'].push(perm);
      }
    } else if (txt.includes('payment') || txt.includes('salaries') || txt.includes('budget') || txt.includes('expenses') || txt.includes('ledger') || txt.includes('initial entries')) {
      groups['Financials & Expenses'].push(perm);
    } else if (txt.includes('demand') || txt.includes('purchase') || txt.includes('delivery') || txt.includes('dispense')) {
      groups['Procurement & Inventory'].push(perm);
    } else if (txt.includes('staff') || txt.includes('system')) {
      groups['Staff & Administration'].push(perm);
    } else {
      groups['Other'].push(perm);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
};

interface UserGroup {
  id: string;
  group_name: string;
}

export default function NewUserGroupModal({ isOpen, onClose, onSuccess }: any) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [usergroupsData, setUsergroupsData] = useState<UserGroup[]>([]);
  const [selectedManageGroups, setSelectedManageGroups] = useState<string[]>([]);
  const [typeKey, setTypeKey] = useState('0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  
  const [showMasterWarning, setShowMasterWarning] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [tempMasterChecked, setTempMasterChecked] = useState(false);

  // Handle escape key
  useModalEscape(isOpen, () => {
    if (groupId) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  }, 200);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setGroupId(null);
      setSelectedPerms([]);
      setIsMaximized(false);
      setTypeKey('0');
      setSelectedManageGroups([]);
      setIsDropdownOpen(false);
    } else {
      // Fetch system config when modal opens
      const fetchConfig = async () => {
        setIsLoadingConfig(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const text = await res.text();
          let arr;
          try { arr = JSON.parse(text); } catch (e) { }
          const data = arr && Array.isArray(arr) ? arr[0] : arr;
          
          if (data && data.permissions_master) {
            setPermissions(data.permissions_master);
          }
          if (data && data.usergroups_data) {
            setUsergroupsData(data.usergroups_data);
          }
        } catch (error) {
          console.error("Failed to fetch permissions", error);
          toast.error("Failed to load permissions configuration");
        } finally {
          setIsLoadingConfig(false);
        }
      };
      
      fetchConfig();
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a Usergroup name");
      return;
    }
    
    if (selectedManageGroups.length === 0) {
      toast.error("Please select at least one usergroup to manage");
      return;
    }
    
    setIsCreating(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('group_name', groupName.trim());
      formData.append('type_key', typeKey);
      formData.append('groups_csv', selectedManageGroups.join(','));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveNewUsergroup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;
      
      if (data) {
        if (String(data.Status) === '1') {
          toast.success(data.Message || "Usergroup Created");
          setGroupId(data.group_id);
        } else {
          toast.error(data.Message || "Failed to create user group");
        }
      }
    } catch (error) {
      toast.error("An error occurred while creating the group");
    } finally {
      setIsCreating(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) 
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  const handleMasterCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setTempMasterChecked(isChecked);
    if (isChecked) {
      setShowMasterWarning(true);
    } else {
      setSelectedPerms([]);
    }
  };

  const confirmMasterWarning = () => {
    setSelectedPerms(permissions.map(p => p.id));
    setShowMasterWarning(false);
  };

  const cancelMasterWarning = () => {
    setShowMasterWarning(false);
  };

  const handleSaveGroup = async () => {
    if (!groupId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('group_id', groupId);
      formData.append('permissions_csv', selectedPerms.join(','));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/patchUserGroupPermissions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;
      
      if (data) {
        if (String(data.Status) === '1') {
          toast.success(data.Message || "Permissions updated");
          onSuccess?.();
          onClose();
        } else {
          toast.error(data.Message || "Failed to update permissions");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (groupId) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const confirmExit = () => {
    setShowExitWarning(false);
    onClose();
  };

  if (!isOpen) return null;

  const allSelected = permissions.length > 0 && selectedPerms.length === permissions.length;

  return (
    <>
      <WarningAlertModal
        isOpen={showMasterWarning}
        onClose={cancelMasterWarning}
        title="Assign All Privileges"
        content="Are you sure you want to assign all privileges as this might be risky?"
        onConfirm={confirmMasterWarning}
      />
      
      <WarningAlertModal
        isOpen={showExitWarning}
        onClose={() => setShowExitWarning(false)}
        title="Incomplete Usergroup"
        content="Do you want to exit? This would make this usergroup incomplete!"
        onConfirm={confirmExit}
      />

      {/* Modal 1: Create Group (Smaller) */}
      {!groupId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col relative transition-all duration-300 w-[600px] max-w-[95vw]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0 rounded-t-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-white">New User Group</span>
              </h2>
              <button 
                onClick={handleClose} 
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-[#11141e] flex flex-col gap-6 relative overflow-visible">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-300">Usergroup name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    disabled={isCreating}
                    placeholder="e.g., Finance Team" 
                    className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="groupType"
                      value="0"
                      checked={typeKey === '0'}
                      onChange={(e) => setTypeKey(e.target.value)}
                      disabled={isCreating}
                      className="bg-[#161a25] border-gray-500 cursor-pointer h-4 w-4 accent-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Is a regular group</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="groupType"
                      value="1"
                      checked={typeKey === '1'}
                      onChange={(e) => setTypeKey(e.target.value)}
                      disabled={isCreating}
                      className="bg-[#161a25] border-gray-500 cursor-pointer h-4 w-4 accent-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Is a contractor group</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="groupType"
                      value="2"
                      checked={typeKey === '2'}
                      onChange={(e) => setTypeKey(e.target.value)}
                      disabled={isCreating}
                      className="bg-[#161a25] border-gray-500 cursor-pointer h-4 w-4 accent-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Is a labourer group</span>
                  </label>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[13px] font-medium text-gray-300">Usergroups to manage</label>
                  <div className="relative w-full" ref={dropdownRef}>
                    <div 
                      className={`bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-[13px] text-white flex items-center justify-between transition-colors ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`}
                      onClick={() => {
                        if (!isCreating) setIsDropdownOpen(!isDropdownOpen);
                      }}
                    >
                      <div className="truncate pr-4">
                        {selectedManageGroups.length > 0 
                          ? usergroupsData.filter(g => selectedManageGroups.includes(g.id)).map(g => g.group_name).join(', ')
                          : <span className="text-gray-500">Select usergroup ...</span>}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#232b3e] border border-gray-700 rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-50 py-1">
                        {usergroupsData.length === 0 ? (
                          <div className="px-3 py-2 text-[13px] text-gray-400 italic">No usergroups available</div>
                        ) : (
                          usergroupsData.map(group => {
                            const isSelected = selectedManageGroups.includes(group.id);
                            return (
                              <div 
                                key={group.id}
                                className="px-3 py-2 hover:bg-[#2a3449] cursor-pointer flex items-center justify-between group/item"
                                onClick={() => {
                                  setSelectedManageGroups(prev => 
                                    isSelected 
                                      ? prev.filter(id => id !== group.id)
                                      : [...prev, group.id]
                                  );
                                }}
                              >
                                <span className={`text-[13px] ${isSelected ? 'text-white' : 'text-gray-300 group-hover/item:text-white'}`}>
                                  {group.group_name}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center justify-center gap-2 min-w-[100px]"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Group"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 2: Assign Privileges (Larger) */}
      {groupId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1200px] max-w-[95vw] max-h-[90vh]'}`}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-white">Assign Privileges: {groupName}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
                  title={isMaximized ? "Restore Size" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleClose} 
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col gap-6 relative">
              <div className="relative bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex flex-col min-h-[400px] h-fit shrink-0 shadow-sm">
                
                {isLoadingConfig ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 mt-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-[13px] font-medium tracking-wide">Loading privileges...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                      <h3 className="text-[15px] font-semibold text-white tracking-wide">Select Privileges</h3>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={allSelected}
                          onChange={handleMasterCheckboxChange}
                          className="bg-[#161a25] border-gray-500 rounded cursor-pointer h-4 w-4 accent-blue-500"
                        />
                        <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors">Select All Privileges</span>
                      </label>
                    </div>

                    {permissions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(groupPermissions(permissions)).map(([category, perms]) => (
                          <fieldset key={category} className="border border-gray-700/50 rounded-lg p-4 bg-[#161a25]/50 flex flex-col gap-3">
                            <legend className="text-[13px] font-semibold text-blue-400 px-2">{category}</legend>
                            {perms.map((perm) => (
                              <label key={perm.id} className="flex items-start gap-3 cursor-pointer group p-1.5 hover:bg-[#232b3e] rounded-lg transition-colors border border-transparent hover:border-gray-700/50">
                                <input 
                                  type="checkbox"
                                  checked={selectedPerms.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="bg-[#161a25] border-gray-500 rounded cursor-pointer h-4 w-4 accent-blue-500 mt-0.5 shrink-0"
                                />
                                <span className="text-[13px] text-gray-300 group-hover:text-white leading-tight font-medium">
                                  {perm.permisson_txt}
                                </span>
                              </label>
                            ))}
                          </fieldset>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-[13px] mt-10 italic">
                        No privileges configuration found.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3">
              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
              >
                Close
              </button>
              <button 
                onClick={handleSaveGroup}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
