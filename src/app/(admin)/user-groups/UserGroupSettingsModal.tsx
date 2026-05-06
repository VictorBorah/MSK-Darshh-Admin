'use client';

import { X, Save, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function UserGroupSettingsModal({ isOpen, onClose, groupId, groupName, onSuccess }: any) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [revokeLogin, setRevokeLogin] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setRevokeLogin(false);
      setIsMaximized(false);
    } else if (groupId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
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

  const handleSaveSettings = async () => {
    if (!groupId) return;
    if (!name.trim()) {
      toast.error("Group Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('group_id', String(groupId));
      formData.append('groupname', name.trim());
      formData.append('revoke_login', revokeLogin ? "1" : "0");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/updateGroupSettings`, {
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
          toast.success(data.Message || "Usergroup updated");
          onSuccess?.();
          onClose();
        } else {
          toast.error(data.Message || "Failed to update settings");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[500px] max-w-[95vw] max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-white">Settings: {groupName}</span>
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
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-[13px] font-medium tracking-wide">Loading details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-300">Group Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={name}
                    maxLength={200}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Finance Team" 
                    className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="text-[11px] text-gray-500 text-right">
                    Remaining characters: {200 - name.length}
                  </div>
                </div>
                
                <label className="flex items-center gap-3 p-3 bg-[#161a25] border border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 transition-colors group">
                  <input 
                    type="checkbox" 
                    checked={revokeLogin}
                    onChange={(e) => setRevokeLogin(e.target.checked)}
                    className="bg-[#11141e] border-gray-500 rounded cursor-pointer h-4 w-4 accent-red-500 shrink-0" 
                  />
                  <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors">Revoke Login</span>
                </label>
              </div>
            )}
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
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}
