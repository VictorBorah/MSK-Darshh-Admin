'use client';

import { X, Loader2, Maximize2, Minimize2, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import allPermissions from '../../../../all_permissons.json';


interface Permission {
  id: string;
  permisson_txt: string;
}

interface UserGroup {
  id: string;
  group_name: string;
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
    } else if (txt.includes('staff') || txt.includes('system') || txt.includes('attendance')) {
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

export default function ViewUserGroupModal({ isOpen, onClose, groupId, groupName }: any) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  
  const [name, setName] = useState('');
  const [revokeLogin, setRevokeLogin] = useState(false);

  const [usergroupsData, setUsergroupsData] = useState<UserGroup[]>([]);
  const [manageGroupsCsv, setManageGroupsCsv] = useState<string>('');
  const [typeKey, setTypeKey] = useState<string>('0');
  const [assignPortal, setAssignPortal] = useState<string>('2');

  // Reset state and fetch data when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedPerms([]);
      setIsMaximized(false);
      setPermissions([]);
      setName('');
      setRevokeLogin(false);
      setUsergroupsData([]);
      setManageGroupsCsv('');
      setTypeKey('0');
      setAssignPortal('2');
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
          
          const fetchedPerms: Permission[] = (configData && configData.permissions_master) || [];
          const mergedPerms = [...fetchedPerms];
          allPermissions.forEach((localPerm: any) => {
            if (!mergedPerms.some(p => String(p.id) === String(localPerm.id))) {
              mergedPerms.push({
                id: String(localPerm.id),
                permisson_txt: localPerm.permisson_txt
              });
            }
          });
          setPermissions(mergedPerms);

          if (configData && configData.usergroups_data) {
            setUsergroupsData(configData.usergroups_data);
          }

          // Fetch group specific info
          const groupRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchUserGroupInfo?group_id=${groupId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const groupText = await groupRes.text();
          let groupArr;
          try { groupArr = JSON.parse(groupText); } catch (e) { }
          const groupData = groupArr && Array.isArray(groupArr) ? groupArr[0] : groupArr;
          
          if (groupData && String(groupData.Status) === '1' && groupData.Data) {
             const dataObj = Array.isArray(groupData.Data) ? groupData.Data[0] : groupData.Data;
             
             setName(dataObj?.group_name || '');
             setRevokeLogin(String(dataObj?.login_revoked) === '1');
             setTypeKey(dataObj?.type_key != null ? String(dataObj.type_key) : '0');
             setManageGroupsCsv(dataObj?.managing_groups_csv || '');
             setAssignPortal(dataObj?.assigned_login != null ? String(dataObj.assigned_login) : '2');
             
             const perms = dataObj?.permissions || [];
             const checkedIds = perms.map((p: any) => Object.keys(p)[0]);
             setSelectedPerms(checkedIds);
          }
        } catch (error) {
          console.error("Failed to fetch data", error);
          toast.error("Failed to load user group details");
          setPermissions(allPermissions.map((p: any) => ({
            id: String(p.id),
            permisson_txt: p.permisson_txt
          })));
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1200px] max-w-[95vw] max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-white">View {groupName}</span>
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
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col gap-6 relative">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 mt-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-[13px] font-medium tracking-wide">Loading details...</p>
            </div>
          ) : (
            <>
              {/* Top Info Section */}
              <div className="bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1">Group Name</h3>
                  <p className="text-[15px] font-semibold text-white">{name || groupName}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1 sm:text-right">Assigned Portal</h3>
                    <div className="flex sm:justify-end">
                      {assignPortal === '1' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[12px] font-medium border border-blue-500/20">
                          Admin Panel
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[12px] font-medium border border-purple-500/20">
                          Staff Panel
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1 sm:text-right">Login Status</h3>
                    <div className="flex items-center gap-2 sm:justify-end">
                      {revokeLogin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[12px] font-medium border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[12px] font-medium border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Settings Section */}
              <div className="bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex flex-col sm:flex-row gap-8 shadow-sm">
                <div>
                  <h3 className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1">Group Type</h3>
                  <p className="text-[14px] font-medium text-gray-200">
                    {typeKey === '0' ? 'Regular Group' : typeKey === '1' ? 'Contractor Group' : typeKey === '2' ? 'Labourer Group' : 'Unknown'}
                  </p>
                </div>
                <div>
                  <h3 className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1">Managed Usergroups</h3>
                  <p className="text-[14px] font-medium text-gray-200">
                    {manageGroupsCsv 
                      ? usergroupsData.filter(g => manageGroupsCsv.split(',').includes(g.id)).map(g => g.group_name).join(', ') || 'None'
                      : 'None'}
                  </p>
                </div>
              </div>

              {/* Privileges Section */}
              <div className="bg-[#191e2b] border border-gray-700 rounded-lg p-5 flex flex-col min-h-[250px] h-fit shrink-0 shadow-sm">
                <div className="mb-6 pb-4 border-b border-gray-700/50">
                  <h3 className="text-[15px] font-semibold text-white tracking-wide">Assigned Privileges</h3>
                  <p className="text-[12px] text-gray-400 mt-1">Read-only view of access privileges for this user group.</p>
                </div>

                {permissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(groupPermissions(permissions)).map(([category, perms]) => (
                      <fieldset key={category} className="border border-gray-700/50 rounded-lg p-4 bg-[#161a25]/50 flex flex-col gap-3">
                        <legend className="text-[13px] font-semibold text-blue-400 px-2">{category}</legend>
                        {perms.map((perm) => (
                          <label key={perm.id} className={`flex items-start gap-3 group p-1.5 rounded-lg ${selectedPerms.includes(perm.id) ? 'opacity-100' : 'opacity-40'}`}>
                            <input 
                              type="checkbox"
                              checked={selectedPerms.includes(perm.id)}
                              readOnly
                              disabled
                              className="bg-[#161a25] border-gray-500 rounded h-4 w-4 accent-blue-500 mt-0.5 shrink-0 disabled:opacity-100"
                            />
                            <span className={`text-[13px] leading-tight font-medium ${selectedPerms.includes(perm.id) ? 'text-gray-200' : 'text-gray-500'}`}>
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
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
