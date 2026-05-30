'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useModalEscape } from '@/hooks/useModalEscape';

interface SettingsStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
  onSuccess?: () => void;
}

export default function SettingsStaffModal({ isOpen, onClose, staffId, onSuccess }: SettingsStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  
  const [usergroups, setUsergroups] = useState<any[]>([]);
  const [selectedUsergroup, setSelectedUsergroup] = useState<any>(null);
  
  const [apiKey, setApiKey] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSuspended, setIsSuspended] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  
  const [isRegeneratingApi, setIsRegeneratingApi] = useState(false);
  const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);

  useModalEscape(isOpen, () => {
    onClose();
  }, 200);

  useEffect(() => {
    if (!isOpen || !staffId) {
      setApiKey('');
      setPin('');
      setPassword('');
      setIsSuspended(false);
      setKycDone(false);
      setSelectedUsergroup(null);
      setOriginalData({});
      setShowPassword(false);
    } else {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          
          const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const configText = await configRes.text();
          let configArr;
          try { configArr = JSON.parse(configText); } catch (e) { }
          const configData = configArr && Array.isArray(configArr) ? configArr[0] : configArr;
          
          let fetchedGroups: any[] = [];
          if (configData && String(configData.Status) === '1' && configData.usergroups_data) {
            fetchedGroups = configData.usergroups_data;
            setUsergroups(fetchedGroups);
          }

          const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchStaffDetails?staff_id=${staffId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const detailsText = await detailsRes.text();
          let detailsArr;
          try { detailsArr = JSON.parse(detailsText); } catch (e) { }
          const detailsData = detailsArr && Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

          if (detailsData && String(detailsData.Status) === '1' && detailsData.staff_data && detailsData.staff_data[0]) {
            const staff = detailsData.staff_data[0];
            
            setApiKey(staff.apiKey || '');
            setPin(staff.userPIN || '');
            setIsSuspended(staff.is_suspended === 'Yes');
            setKycDone(staff.kyc_approved === 'Yes');

            if (staff.group_id && fetchedGroups.length > 0) {
              const matched = fetchedGroups.find(g => String(g.id) === String(staff.group_id));
              if (matched) setSelectedUsergroup({ value: matched.id, label: matched.group_name });
            }

            setOriginalData({
              user_group: staff.group_id || '',
              apiKey: staff.apiKey || '',
              userPIN: staff.userPIN || '',
              is_suspended: staff.is_suspended === 'Yes' ? '1' : '0',
              kyc_approved: staff.kyc_approved === 'Yes' ? '1' : '0'
            });
          } else {
            toast.error(detailsData?.Message || 'Failed to fetch staff details');
          }
        } catch (error) {
          console.error("Failed to fetch settings data", error);
          toast.error("Failed to fetch settings data");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isOpen, staffId]);

  const handleRegenerate = async (flag: 1 | 2) => {
    const isApi = flag === 1;
    if (isApi) setIsRegeneratingApi(true); else setIsRegeneratingPin(true);
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('staff_id', staffId!);
      formData.append('key_flag', String(flag));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/regenerateCreds`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch(e) { }
      const data = Array.isArray(arr) ? arr[0] : arr;
      
      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Generated credentials successfully');
        if (isApi) setApiKey(data.creds || '');
        else setPin(data.creds || '');
      } else {
        if (res.ok) {
          toast.error(data?.Message || 'Failed to regenerate credentials');
        } else {
          toast.error('API Error: Failed to regenerate');
        }
      }
    } catch(e) {
      toast.error('An error occurred during regeneration');
    } finally {
      if (isApi) setIsRegeneratingApi(false); else setIsRegeneratingPin(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadObj: any = {};
      let changed = false;

      if (selectedUsergroup && String(selectedUsergroup.value) !== String(originalData.user_group)) {
        payloadObj.user_group = String(selectedUsergroup.value);
        changed = true;
      }
      if (apiKey !== originalData.apiKey) {
        payloadObj.apiKey = apiKey;
        changed = true;
      }
      if (pin !== originalData.userPIN) {
        payloadObj.userPIN = pin;
        changed = true;
      }
      const suspendedStr = isSuspended ? '1' : '0';
      if (suspendedStr !== originalData.is_suspended) {
        payloadObj.is_suspended = suspendedStr;
        changed = true;
      }
      const kycStr = kycDone ? '1' : '0';
      if (kycStr !== originalData.kyc_approved) {
        payloadObj.kyc_approved = kycStr;
        changed = true;
      }
      if (password.length > 0) {
        payloadObj.password = password;
        changed = true;
      }

      if (!changed) {
        toast.error('No changes made to save.');
        setIsSaving(false);
        return;
      }

      const jsonData = {
        staff_data: [payloadObj]
      };

      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('staff_id', staffId!);
      formData.append('json_data', JSON.stringify(jsonData));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveStaffSettings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) {}
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Settings updated successfully');
        if (typeof onSuccess === 'function') onSuccess();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to update settings');
      }
    } catch (e) {
      toast.error('An error occurred during save');
    } finally {
      setIsSaving(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-transparent' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    let text = 'Weak';
    let color = 'bg-red-500';
    if (score === 50 || score === 75) {
      text = 'Fair';
      color = 'bg-yellow-500';
    } else if (score === 100) {
      text = 'Strong password';
      color = 'bg-emerald-500';
    }
    return { score, text, color };
  };

  const pwdStrength = getPasswordStrength(password);
  
  // Save button is disabled if password is not empty AND score is less than 100
  const isSaveDisabled = password.length > 0 && pwdStrength.score < 100 || isSaving;

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#161a25',
      borderColor: state.isFocused ? '#3b82f6' : '#374151',
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#4b5563' },
      boxShadow: 'none',
      minHeight: '38px',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#2d3a6c' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px'
    }),
    singleValue: (base: any) => ({ ...base, color: '#e5e7eb', fontSize: '13px' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '13px' }),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1f2536] border border-gray-700 rounded-xl shadow-2xl w-full max-w-[800px] flex flex-col relative overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#232b3e] shrink-0">
          <h2 className="text-[16px] font-bold text-white tracking-wide flex items-center gap-2">
             Staff Settings
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-[#161a25] flex-1 relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-[#161a25]/90 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <span className="text-gray-400 text-sm">Loading settings...</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="space-y-1 w-full max-w-[380px]">
                <label className="text-[12px] font-medium text-gray-400">Select Usergroup</label>
                <Select
                  options={usergroups.map(g => ({ value: g.id, label: g.group_name }))}
                  value={selectedUsergroup}
                  onChange={setSelectedUsergroup}
                  placeholder="Select usergroup ..."
                  styles={selectStyles}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  isClearable
                />
              </div>

              <div className="space-y-4 pt-4">
                {/* API Key */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-white">API Key</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={apiKey} 
                      readOnly 
                      className="w-full max-w-[380px] bg-[#11141e] border border-gray-700 rounded px-3 py-2 text-[13px] text-gray-400 outline-none cursor-not-allowed"
                    />
                    <button 
                      onClick={() => handleRegenerate(1)}
                      disabled={isRegeneratingApi}
                      className="text-[13px] text-blue-400 hover:text-blue-300 font-medium transition-colors whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRegeneratingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* PIN */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-white">PIN</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={pin} 
                      readOnly 
                      className="w-full max-w-[380px] bg-[#11141e] border border-gray-700 rounded px-3 py-2 text-[13px] text-gray-400 outline-none cursor-not-allowed"
                    />
                    <button 
                      onClick={() => handleRegenerate(2)}
                      disabled={isRegeneratingPin}
                      className="text-[13px] text-blue-400 hover:text-blue-300 font-medium transition-colors whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRegeneratingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1 pt-2">
                  <label className="text-[12px] font-medium text-white">Password</label>
                  <div className="flex items-start gap-3">
                    <div className="w-full max-w-[380px] flex flex-col gap-2">
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          className="w-full bg-[#11141e] border border-gray-700 focus:border-blue-500 rounded px-3 py-2 pr-10 text-[13px] text-white outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-300 ${pwdStrength.color}`} 
                          style={{ width: `${pwdStrength.score}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                        Must contain at least 6 characters, one uppercase letter, one number, and one special character.
                      </p>
                    </div>
                    {password && (
                      <span className={`text-[12px] font-medium mt-2 ${pwdStrength.color.replace('bg-', 'text-')}`}>
                        {pwdStrength.text}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column */}
            <div className="w-full md:w-[180px] shrink-0 flex flex-col gap-6 md:pt-[76px]">
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white">Suspend user?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isSuspended} onChange={(e) => setIsSuspended(e.target.checked)} />
                  <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 flex items-center justify-between px-1">
                     <span className={`text-[10px] font-bold text-white z-0 absolute right-1.5 ${isSuspended ? 'opacity-0' : 'opacity-100'}`}>No</span>
                     <span className={`text-[10px] font-bold text-white z-0 absolute left-1.5 ${isSuspended ? 'opacity-100' : 'opacity-0'}`}>Yes</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white">KYC Done?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={kycDone} onChange={(e) => setKycDone(e.target.checked)} />
                  <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 flex items-center justify-between px-1">
                     <span className={`text-[10px] font-bold text-white z-0 absolute right-1.5 ${kycDone ? 'opacity-0' : 'opacity-100'}`}>No</span>
                     <span className={`text-[10px] font-bold text-white z-0 absolute left-1.5 ${kycDone ? 'opacity-100' : 'opacity-0'}`}>Yes</span>
                  </div>
                </label>
              </div>

            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 bg-[#232b3e] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="px-6 py-2 text-[13px] font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
