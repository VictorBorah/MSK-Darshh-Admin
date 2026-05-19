'use client';

import { X, Loader2, Save, Maximize2, Minimize2, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  permisson_txt: string;
}

interface UserGroup {
  id: string;
  group_name: string;
}

export default function EditUserGroupModal({ isOpen, onClose, groupId, groupName, onSuccess }: any) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  
  const [usergroupsData, setUsergroupsData] = useState<UserGroup[]>([]);
  const [selectedManageGroups, setSelectedManageGroups] = useState<string[]>([]);
  const [typeKey, setTypeKey] = useState('0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  
  // Reset state and fetch data when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedPerms([]);
      setIsMaximized(false);
      setPermissions([]);
      setTypeKey('0');
      setSelectedManageGroups([]);
      setIsDropdownOpen(false);
    } else if (groupId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          
          // Fetch master permissions
          const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const configText = await configRes.text();
          let configArr;
          try { configArr = JSON.parse(configText); } catch (e) { }
          const configData = configArr && Array.isArray(configArr) ? configArr[0] : configArr;
          
          if (configData && configData.permissions_master) {
            setPermissions(configData.permissions_master);
          }
          if (configData && configData.usergroups_data) {
            setUsergroupsData(configData.usergroups_data);
          }

          // Fetch group specific info to know which permissions are checked
          const groupRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchUserGroupInfo?group_id=${groupId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const groupText = await groupRes.text();
          let groupArr;
          try { groupArr = JSON.parse(groupText); } catch (e) { }
          const groupData = groupArr && Array.isArray(groupArr) ? groupArr[0] : groupArr;
          
          if (groupData && String(groupData.Status) === '1' && groupData.Data) {
             const dataObj = Array.isArray(groupData.Data) ? groupData.Data[0] : groupData.Data;
             const perms = dataObj?.permissions || [];
             const checkedIds = perms.map((p: any) => Object.keys(p)[0]);
             setSelectedPerms(checkedIds);
             
             setTypeKey(dataObj?.type_key != null ? String(dataObj.type_key) : '0');
             const manageCsv = dataObj?.managing_groups_csv;
             if (manageCsv) {
               setSelectedManageGroups(manageCsv.split(',').filter(Boolean));
             } else {
               setSelectedManageGroups([]);
             }
          }
        } catch (error) {
          console.error("Failed to fetch data", error);
          toast.error("Failed to load user group details");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isOpen, groupId]);

  const togglePermission = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) 
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  const handleUpdateGroup = async () => {
    if (!groupId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('group_id', String(groupId));
      formData.append('type_key', typeKey);
      formData.append('groups_csv', selectedManageGroups.join(','));
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
          toast.success(data.Message || "Permissions updated successfully");
          onSuccess?.();
          onClose();
        } else {
          toast.error(data.Message || "Failed to update permissions");
        }
      }
    } catch (error) {
      toast.error("An error occurred while updating the group");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[900px] max-w-[95vw] max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-white">Edit {groupName}</span>
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
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col gap-6 relative overflow-visible">
          
          <div className="bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex flex-col gap-4 shadow-sm relative z-20">
            <h3 className="text-[15px] font-semibold text-white tracking-wide mb-2">Group Settings</h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="groupType"
                  value="0"
                  checked={typeKey === '0'}
                  onChange={(e) => setTypeKey(e.target.value)}
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                  className="bg-[#161a25] border-gray-500 cursor-pointer h-4 w-4 accent-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Is a labourer group</span>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="text-[13px] font-medium text-gray-300 w-[140px] shrink-0">Usergroups to manage</label>
              <div className="relative w-full sm:w-[400px]" ref={dropdownRef}>
                <div 
                  className={`bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-[13px] text-white flex items-center justify-between transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`}
                  onClick={() => {
                    if (!isSaving) setIsDropdownOpen(!isDropdownOpen);
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

          {/* Middle Section: Checkboxes Container */}
          <div className="bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex-1 flex flex-col min-h-[250px] shadow-sm">
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 mt-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-[13px] font-medium tracking-wide">Loading privileges...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 pb-4 border-b border-gray-700/50">
                  <h3 className="text-[15px] font-semibold text-white tracking-wide">Select Privileges</h3>
                  <p className="text-[12px] text-gray-400 mt-1">Modify access privileges for this user group.</p>
                </div>

                {permissions.length > 0 ? (
                  <div className="columns-1 md:columns-3 gap-8">
                    {permissions.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 cursor-pointer group p-1.5 hover:bg-[#232b3e] rounded-lg transition-colors border border-transparent hover:border-gray-700/50 mb-3 break-inside-avoid">
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
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdateGroup}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Group
          </button>
        </div>

      </div>
    </div>
  );
}
