'use client';

import { X, Loader2, Maximize2, Minimize2, Image as ImageIcon, Save, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import WarningAlertModal from '../../../components/WarningAlertModal';
import { useModalEscape } from '@/hooks/useModalEscape';

export default function NewStaffModal({ isOpen, onClose, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSubmittingStep1, setIsSubmittingStep1] = useState(false);
  
  // Config Data
  const [usergroups, setUsergroups] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [genders, setGenders] = useState<any[]>([]);
  const [bloodgroups, setBloodgroups] = useState<any[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<any[]>([]);
  const [paymentCategories, setPaymentCategories] = useState<any[]>([]);

  // Step 1 Form State
  const [selectedUsergroup, setSelectedUsergroup] = useState<any>(null);
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState<string | null>(null);

  // Step 2 Form State (Dummy/Placeholder for now)
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<any>(null);
  const [selectedBloodgroup, setSelectedBloodgroup] = useState<any>(null);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<any>(null);
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [authorizedEmail, setAuthorizedEmail] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyMobile, setEmergencyMobile] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [voterNo, setVoterNo] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [pincode, setPincode] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [kycComplete, setKycComplete] = useState(false);
  const [contractAmount, setContractAmount] = useState('');
  const [emailError, setEmailError] = useState('');
  const [dob, setDob] = useState('');
  const [isOfficeStaff, setIsOfficeStaff] = useState(false);

  const maxDobDateStr = (() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  })();

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [validationResults, setValidationResults] = useState<string[]>([]);
  const [allOk, setAllOk] = useState("0");

  const [showExitWarning, setShowExitWarning] = useState(false);

  // File Upload States
  const [files, setFiles] = useState<{
    profile: string | null;
    aadhar: string | null;
    pan: string | null;
    voter: string | null;
  }>({
    profile: null,
    aadhar: null,
    pan: null,
    voter: null,
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    profile: string | null;
    aadhar: string | null;
    pan: string | null;
    voter: string | null;
  }>({
    profile: null,
    aadhar: null,
    pan: null,
    voter: null,
  });

  const fileInputRefs = {
    profile: useRef<HTMLInputElement>(null),
    aadhar: useRef<HTMLInputElement>(null),
    pan: useRef<HTMLInputElement>(null),
    voter: useRef<HTMLInputElement>(null),
  };

  // Handle escape key
  useModalEscape(isOpen, () => {
    handleCloseRequest();
  }, 200);

  // Reset state and fetch config when modal opens
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setStaffName('');
      setSelectedUsergroup(null);
      setStaffId(null);
      setIsMaximized(false);
      setFiles({ profile: null, aadhar: null, pan: null, voter: null });
      setSelectedDistrict(null);
      setSelectedGender(null);
      setSelectedBloodgroup(null);
      setSelectedMaritalStatus(null);
      setSelectedPaymentCategory(null);
      setUsername('');
      setAuthorizedEmail('');
      setMobile1('');
      setPermanentAddress('');
      setEmergencyMobile('');
      setEmergencyContact('');
      setAadhaarNo('');
      setPanNo('');
      setVoterNo('');
      setFatherName('');
      setMotherName('');
      setPincode('');
      setMobile2('');
      setContractAmount('');
      setKycComplete(false);
      setEmailError('');
      setDob('');
      setIsOfficeStaff(false);
      setShowValidationModal(false);
      setIsValidating(false);
      setIsSaving(false);
      setValidationResults([]);
      setAllOk("0");
      setUploadedFiles({ profile: null, aadhar: null, pan: null, voter: null });
    } else {
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
          
          if (data && String(data.Status) === '1') {
            if (data.usergroups_data) setUsergroups(data.usergroups_data);
            if (data.districts_data) setDistricts(data.districts_data);
            if (data.gender_data) setGenders(data.gender_data);
            if (data.bloodgroup_data) setBloodgroups(data.bloodgroup_data);
            if (data.marital_data) setMaritalStatuses(data.marital_data);
          }

          const appRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const appText = await appRes.text();
          let appArr;
          try { appArr = JSON.parse(appText); } catch (e) { }
          const appData = appArr && Array.isArray(appArr) ? appArr[0] : appArr;
          
          if (appData && String(appData.Status) === '1' && appData.item_categories_data) {
            setPaymentCategories(appData.item_categories_data.filter((c: any) => c.is_material === "0"));
          }
        } catch (error) {
          console.error("Failed to fetch config", error);
        } finally {
          setIsLoadingConfig(false);
        }
      };
      
      fetchConfig();
    }
  }, [isOpen]);

  const handleCloseRequest = () => {
    if (staffName.trim() || selectedUsergroup || staffId) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const confirmExit = () => {
    setShowExitWarning(false);
    onClose();
  };

  const handleStep1Submit = async () => {
    if (!selectedUsergroup) {
      toast.error('Please select a Usergroup');
      return;
    }
    if (!staffName.trim()) {
      toast.error('Please enter Full Name');
      return;
    }

    setIsSubmittingStep1(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('group_id', selectedUsergroup.value);
      formData.append('staff_name', staffName.trim());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/addNewStaff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Staff created successfully');
        setStaffId(data.staff_id || 'dummy_id');
        setStep(2);
        onSuccess?.();
      } else {
        toast.error(data?.Message || data?.message || 'Failed to create staff');
      }
    } catch (e: any) {
      toast.error('An error occurred while creating staff');
    } finally {
      setIsSubmittingStep1(false);
    }
  };

  const isValidPan = (pan: string) => {
    if (!pan) return true;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    return panRegex.test(pan);
  };

  const isValidAadhaar = (aadhaar: string) => {
    if (!aadhaar) return true;
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar);
  };

  const handleValidateStep2 = async () => {
    if (!staffName.trim()) { toast.error("Full Name is mandatory"); return; }
    if (!username.trim()) { toast.error("Username is mandatory"); return; }
    if (!authorizedEmail.trim()) { toast.error("Authorized Email is mandatory"); return; }
    if (!mobile1.trim()) { toast.error("Mobile 1 is mandatory"); return; }
    if (!permanentAddress.trim()) { toast.error("Permanent Address is mandatory"); return; }
    if (!emergencyMobile.trim()) { toast.error("Emergency mobile no. is mandatory"); return; }
    if (!emergencyContact.trim()) { toast.error("Emergency contact person is mandatory"); return; }
    if (!selectedBloodgroup) { toast.error("Blood Group is mandatory"); return; }
    if (!selectedGender) { toast.error("Gender is mandatory"); return; }

    if (panNo && !isValidPan(panNo)) { toast.error("Invalid PAN number"); return; }
    if (aadhaarNo && !isValidAadhaar(aadhaarNo)) { toast.error("Invalid AADHAR number"); return; }

    setShowValidationModal(true);
    setIsValidating(true);

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('staff_id', staffId || '');
      
      const payload: any = {};
      if (authorizedEmail) payload.auth_email = authorizedEmail;
      if (mobile1) payload.mobile_1 = mobile1;
      if (panNo) payload.pan_no = panNo;
      if (aadhaarNo) payload.aadhaar_no = aadhaarNo;
      if (voterNo) payload.voter_no = voterNo;
      
      formData.append('data_json', JSON.stringify({ staff_data: [payload] }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/validateStaffData`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Validation successful');
        setValidationResults(data.msg_array || []);
        setAllOk(String(data.all_ok));
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        if (res.ok) {
          toast.error(data.Message || 'Validation failed');
          setValidationResults(data.msg_array || []);
          setAllOk(String(data.all_ok));
        } else {
          toast.error(data.Message || 'Validation failed');
        }
      } else {
        toast.error('Unexpected response from validation API');
      }
    } catch (e: any) {
      toast.error('An error occurred during validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      
      const payload: any = {
        staff_id: staffId || '',
        full_name: staffName,
      };

      if (selectedDistrict) payload.district_id = selectedDistrict.value;
      if (selectedGender) payload.sex = selectedGender.value;
      if (selectedBloodgroup) payload.blood_group = selectedBloodgroup.value;
      if (selectedMaritalStatus) payload.marital_status = selectedMaritalStatus.value;
      if (selectedPaymentCategory) payload.payment_category = selectedPaymentCategory.value;
      if (contractAmount) payload.contract_amount = contractAmount;
      
      if (username) payload.username = username;
      if (authorizedEmail) payload.auth_email = authorizedEmail;
      if (mobile1) payload.mobile_1 = mobile1;
      if (permanentAddress) payload.address = permanentAddress;
      if (emergencyMobile) payload.emergency_mobile = emergencyMobile;
      if (emergencyContact) payload.emergency_contact = emergencyContact;
      if (aadhaarNo) payload.aadhaar_no = aadhaarNo;
      if (panNo) payload.pan_no = panNo;
      if (voterNo) payload.voter_no = voterNo;
      if (fatherName) payload.father_name = fatherName;
      if (motherName) payload.mother_name = motherName;
      if (pincode) payload.pincode = pincode;
      if (mobile2) payload.mobile_2 = mobile2;
      payload.kyc_approved = kycComplete ? "1" : "0";

      if (dob) {
        const [year, month, day] = dob.split('-');
        payload.dob = `${day}-${month}-${year}`;
      } else {
        payload.dob = '';
      }
      payload.office_staff = isOfficeStaff ? "1" : "0";

      if (uploadedFiles.profile) payload.profile_photo_file = uploadedFiles.profile;
      if (uploadedFiles.pan) payload.pan_file = uploadedFiles.pan;
      if (uploadedFiles.voter) payload.voter_file = uploadedFiles.voter;
      if (uploadedFiles.aadhar) payload.aadhaar_file = uploadedFiles.aadhar;

      formData.append('json_data', JSON.stringify({ staff_data: [payload] }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/patchStaff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch (e) { }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Staff updated successfully');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to update staff');
      }
    } catch (e: any) {
      toast.error('An error occurred during save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      setIsUploadingFile(true);
      const toastId = toast.loading('Uploading file...');
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const formData = new FormData();
        formData.append('my_file', file);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/uploadFile`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const text = await res.text();
        let arr;
        try { arr = JSON.parse(text); } catch (err) { }
        const data = Array.isArray(arr) ? arr[0] : arr;
        
        if (data && (String(data.Status) === '1' || data.Status === 1)) {
          toast.success(data.Message || 'File uploaded', { id: toastId });
          setUploadedFiles(prev => ({ ...prev, [type]: data.file_name }));
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setFiles(prev => ({ ...prev, [type]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        } else {
          toast.error(data?.Message || 'Upload failed', { id: toastId });
          if (fileInputRefs[type].current) fileInputRefs[type].current!.value = '';
        }
      } catch (err) {
        toast.error('Error uploading file', { id: toastId });
        if (fileInputRefs[type].current) fileInputRefs[type].current!.value = '';
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  const removeFile = async (type: keyof typeof files) => {
    const filename = uploadedFiles[type];
    if (filename) {
      const toastId = toast.loading('Deleting file...');
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const formData = new FormData();
        formData.append('filename', filename);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}files/deleteFile`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const text = await res.text();
        let arr;
        try { arr = JSON.parse(text); } catch (err) { }
        const data = Array.isArray(arr) ? arr[0] : arr;
        
        if (data && (String(data.Status) === '1' || data.Status === 1)) {
          toast.success(data.Message || 'File Deleted', { id: toastId });
          setFiles(prev => ({ ...prev, [type]: null }));
          setUploadedFiles(prev => ({ ...prev, [type]: null }));
          if (fileInputRefs[type].current) {
            fileInputRefs[type].current!.value = '';
          }
        } else {
          toast.error(data?.Message || 'Delete failed', { id: toastId });
        }
      } catch (err) {
        toast.error('Error deleting file', { id: toastId });
      }
    } else {
      setFiles(prev => ({ ...prev, [type]: null }));
      setUploadedFiles(prev => ({ ...prev, [type]: null }));
      if (fileInputRefs[type].current) {
        fileInputRefs[type].current!.value = '';
      }
    }
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#161a25',
      borderColor: state.isFocused ? '#3b82f6' : '#4b5563',
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#6b7280' },
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
    <>
      <WarningAlertModal
        isOpen={showExitWarning}
        onClose={() => setShowExitWarning(false)}
        title="Warning"
        content="Do want to exit? All data will be lost!"
        onConfirm={confirmExit}
      />

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
        {step === 1 ? (
          // Step 1 Modal (Small)
          <div className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[500px] max-w-[95vw]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
              <h2 className="text-lg font-bold text-white">New Staff</h2>
            </div>

            {/* Body */}
            <div className="p-6 bg-[#11141e] flex flex-col gap-5 relative min-h-[200px]">
              {isLoadingConfig && (
                <div className="absolute inset-0 z-10 bg-[#11141e]/80 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <span className="text-gray-400 text-sm">Loading config...</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-300">Select Usergroup <span className="text-red-400">*</span></label>
                <Select
                  options={usergroups.map(g => ({ value: g.id, label: g.group_name }))}
                  value={selectedUsergroup}
                  onChange={setSelectedUsergroup}
                  placeholder="Select usergroup ..."
                  styles={selectStyles}
                  className="w-full"
                  isClearable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-300">Full Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#161a25] border border-gray-600 rounded px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
              <button 
                onClick={handleCloseRequest}
                className="px-6 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded text-[13px] font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStep1Submit}
                disabled={isSubmittingStep1}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[13px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isSubmittingStep1 ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
              </button>
            </div>
          </div>
        ) : (
          // Step 2 Modal (Large)
          <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1200px] max-w-[95vw] max-h-[90vh] min-h-[650px]'}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
              <h2 className="text-lg font-bold text-white">New Staff</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded"
                  title={isMaximized ? "Restore Size" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleCloseRequest} 
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] flex flex-col lg:flex-row gap-8">
              
              {/* Left Side (Form Grid) */}
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 content-start mb-4">
                  
                  {/* Row 1: Full Name, Usergroup, Username */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Usergroup</label>
                    <input type="text" value={selectedUsergroup?.label || ''} disabled className="w-full bg-[#161a25]/50 border border-gray-800 rounded px-3 py-1.5 text-[13px] text-gray-500 cursor-not-allowed outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Username <span className="text-red-400">*</span></label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  {/* Row 2: Father Name, Mother Name, Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Father Name</label>
                    <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Mother Name</label>
                    <input type="text" value={motherName} onChange={e => setMotherName(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob} 
                      max={maxDobDateStr} 
                      onChange={e => setDob(e.target.value)} 
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none cursor-pointer light-bg-date-picker" 
                    />
                  </div>

                  {/* Row 3: Gender, Marital Status, Blood Group */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Gender <span className="text-red-400">*</span></label>
                    <Select
                      options={genders.map(g => ({ value: g.id, label: g.gender_txt }))}
                      value={selectedGender}
                      onChange={setSelectedGender}
                      styles={selectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Marital Status</label>
                    <Select
                      options={maritalStatuses.map(m => ({ value: m.id, label: m.status_txt }))}
                      value={selectedMaritalStatus}
                      onChange={setSelectedMaritalStatus}
                      styles={selectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Blood Group <span className="text-red-400">*</span></label>
                    <Select
                      options={bloodgroups.map(b => ({ value: b.id, label: b.blood_group }))}
                      value={selectedBloodgroup}
                      onChange={setSelectedBloodgroup}
                      styles={selectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>

                  {/* Row 4: Mobile 1, Mobile 2, Authorized Email */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Mobile 1 <span className="text-red-400">*</span></label>
                    <input type="text" value={mobile1} onChange={e => setMobile1(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Mobile 2</label>
                    <input type="text" value={mobile2} onChange={e => setMobile2(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Authorized Email <span className="text-red-400">*</span></label>
                    <input 
                      type="email" 
                      value={authorizedEmail} 
                      onChange={e => {
                        setAuthorizedEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }} 
                      onBlur={() => {
                        if (authorizedEmail && !authorizedEmail.toLowerCase().endsWith('@gmail.com')) {
                          setEmailError('Only Google Accounts allowed');
                        }
                      }}
                      className={`w-full bg-[#161a25] border ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'} rounded px-3 py-1.5 text-[13px] text-white outline-none`} 
                    />
                    {emailError && <span className="text-red-500 text-[11px] block mt-1">{emailError}</span>}
                  </div>

                  {/* Row 5 & 6: Select District, Pincode, Permanent Address (row-span-2) */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Select District</label>
                    <Select
                      options={districts.map(d => ({ value: d.id, label: d.district }))}
                      value={selectedDistrict}
                      onChange={setSelectedDistrict}
                      styles={selectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Pincode</label>
                    <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1 row-span-2">
                    <label className="text-[12px] text-gray-400">Permanent Address <span className="text-red-400">*</span></label>
                    <textarea value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-2 text-[13px] text-white focus:border-blue-500 outline-none resize-none h-[88px]" />
                  </div>

                  {/* Row 6 continued: PAN Number, AADHAR Number */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">PAN Number</label>
                    <input type="text" value={panNo} onChange={e => setPanNo(e.target.value)} className={`w-full bg-[#161a25] border ${panNo && !isValidPan(panNo) ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'} rounded px-3 py-1.5 text-[13px] text-white outline-none uppercase`} />
                    {panNo && !isValidPan(panNo) && <span className="text-red-500 text-[11px]">Invalid PAN format (e.g. ABCDE1234F)</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">AADHAR Number</label>
                    <input type="text" value={aadhaarNo} onChange={e => setAadhaarNo(e.target.value)} className={`w-full bg-[#161a25] border ${aadhaarNo && !isValidAadhaar(aadhaarNo) ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'} rounded px-3 py-1.5 text-[13px] text-white outline-none`} />
                    {aadhaarNo && !isValidAadhaar(aadhaarNo) && <span className="text-red-500 text-[11px]">Must be a valid 12 digit number</span>}
                  </div>

                  {/* Row 7: Voter Number (EPIC), Payment Category, Contract Amount */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Voter Number (EPIC)</label>
                    <input type="text" value={voterNo} onChange={e => setVoterNo(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Payment Category</label>
                    <Select
                      options={paymentCategories.map(c => ({ value: c.master_category_id, label: c.master_category_name }))}
                      value={selectedPaymentCategory}
                      onChange={setSelectedPaymentCategory}
                      styles={selectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Contract Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
                      <input type="text" value={contractAmount} onChange={e => setContractAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-[#161a25] border border-gray-700 rounded pl-7 pr-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>

                  {/* Row 8: Emergency Contact Person, Emergency Mobile No., Is Office Staff (Checkbox) */}
                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Emergency contact person <span className="text-red-400">*</span></label>
                    <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] text-gray-400">Emergency mobile no. <span className="text-red-400">*</span></label>
                    <input type="text" value={emergencyMobile} onChange={e => setEmergencyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-[#161a25] border border-gray-700 rounded px-3 py-1.5 text-[13px] text-white focus:border-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1 flex items-end h-[34px]">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={isOfficeStaff} onChange={e => setIsOfficeStaff(e.target.checked)} className="bg-[#161a25] border-gray-500 rounded cursor-pointer h-4 w-4 accent-blue-500" />
                      <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Is Office Staff</span>
                    </label>
                  </div>

                  {/* Row 9: Mark KYC Complete (Checkbox) */}
                  <div className="space-y-1 flex items-end h-[34px]">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={kycComplete} onChange={e => setKycComplete(e.target.checked)} className="bg-[#161a25] border-gray-500 rounded cursor-pointer h-4 w-4 accent-blue-500" />
                      <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">Mark KYC Complete</span>
                    </label>
                  </div>

                </div>
                <p className="text-[11px] italic text-gray-500 mt-auto pt-4 border-t border-gray-800/50">Fields marked in <span className="text-red-400">*</span> are mandatory</p>
              </div>

              {/* Right Side (Files) */}
              <div className="w-full lg:w-[320px] bg-[#1c2230] border border-gray-700/50 rounded-lg p-5 shrink-0">
                <h3 className="text-[13px] font-medium text-gray-300 mb-4">Files</h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  {[
                    { key: 'profile', label: 'Upload Profile Picture' },
                    { key: 'aadhar', label: 'Upload AADHAR' },
                    { key: 'pan', label: 'Upload PAN' },
                    { key: 'voter', label: 'Upload Voter' },
                  ].map((item) => (
                    <div key={item.key} className="flex flex-col gap-2">
                      <div 
                        className="aspect-video bg-[#11141e] border-2 border-dashed border-gray-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors relative overflow-hidden group"
                        onClick={() => !files[item.key as keyof typeof files] && fileInputRefs[item.key as keyof typeof files].current?.click()}
                      >
                        {files[item.key as keyof typeof files] ? (
                          <>
                            <img src={files[item.key as keyof typeof files]!} alt={item.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">Change</span>
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-600 group-hover:text-gray-400 transition-colors" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          ref={fileInputRefs[item.key as keyof typeof files]}
                          className="hidden"
                          onChange={(e) => handleFileChange(item.key as keyof typeof files, e)}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] text-gray-400 text-center">{item.label}</span>
                        {files[item.key as keyof typeof files] && (
                          <button 
                            onClick={() => removeFile(item.key as keyof typeof files)}
                            className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove Media
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
              <button 
                onClick={handleCloseRequest}
                disabled={isUploadingFile}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleValidateStep2}
                disabled={isUploadingFile || !!emailError}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {/* Validation Modal Overlay */}
        {showValidationModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1f2536] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[400px] max-w-[95vw]">
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653]">
                <h2 className="text-[15px] font-bold text-white">Validation Status</h2>
                <button 
                  onClick={() => setShowValidationModal(false)} 
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  disabled={isValidating}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 bg-[#11141e] flex flex-col items-center justify-center min-h-[150px]">
                {isValidating ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                    <span className="text-gray-300 text-[13px]">Validating, please wait..</span>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-3">
                    {validationResults.map((msg, idx) => {
                      const isOk = msg.toLowerCase().endsWith('is ok');
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          {isOk ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                          <span className={`text-[13px] ${isOk ? 'text-green-500' : 'text-red-500'}`}>{msg}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3">
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className="px-5 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-[13px] font-medium transition-colors"
                  disabled={isValidating}
                >
                  Close
                </button>
                <button 
                  onClick={handleFinalSave}
                  disabled={isValidating || allOk !== "1" || isSaving}
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[13px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
