import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Maximize2, Minimize2, UserCircle, FileImage, ShieldCheck, Mail, Phone, MapPin, Building2, User, UserSquare2, PhoneCall, CheckCircle2, XCircle, Printer, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';
import { generatePdfFromElement } from '@/utils/pdfGenerator';

interface ViewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
}

export default function ViewStaffModal({ isOpen, onClose, staffId }: ViewStaffModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const footerText = `ZYN Construction network, ${dateStr} System generated information`;
    const filename = `Staff_Information_${displayData.staffName?.replace(/\s+/g, '_') || 'Profile'}.pdf`;
    generatePdfFromElement(printRef.current, filename, footerText);
  };

  // Staff Details State
  const [staffData, setStaffData] = useState<any>(null);

  // Mapped display fields
  const [displayData, setDisplayData] = useState<Record<string, any>>({});

  // Image Base64 State for Print
  const [base64Dp, setBase64Dp] = useState<string | null>(null);
  const [dpError, setDpError] = useState(false);

  useEffect(() => {
    if (displayData.files?.dp_file) {
      const fetchImage = async () => {
        try {
          const response = await fetch(displayData.files.dp_file);
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setBase64Dp(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          // Silently handle CORS or network failures for the proxy fetch
          // to prevent Next.js from throwing a red error overlay in dev mode.
          setDpError(true);
        }
      };
      fetchImage();
    } else {
      setBase64Dp(null);
      setDpError(false);
    }
  }, [displayData.files?.dp_file]);

  useModalEscape(isOpen, () => {
    onClose();
  }, 200);

  useEffect(() => {
    if (!isOpen || !staffId) {
      setIsMaximized(false);
      setStaffData(null);
      setDisplayData({});
    } else {
      const fetchData = async () => {
        setIsLoadingDetails(true);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');

          // 1. Fetch Config
          const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const configText = await configRes.text();
          let configArr;
          try { configArr = JSON.parse(configText); } catch (e) { }
          const configData = configArr && Array.isArray(configArr) ? configArr[0] : configArr;

          let fetchedDistricts: any[] = [];
          let fetchedGenders: any[] = [];
          let fetchedBloodgroups: any[] = [];
          let fetchedMaritalStatuses: any[] = [];

          if (configData && String(configData.Status) === '1') {
            if (configData.districts_data) fetchedDistricts = configData.districts_data;
            if (configData.gender_data) fetchedGenders = configData.gender_data;
            if (configData.bloodgroup_data) fetchedBloodgroups = configData.bloodgroup_data;
            if (configData.marital_data) fetchedMaritalStatuses = configData.marital_data;
          }

          // 2. Fetch Details
          const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchStaffDetails?staff_id=${staffId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const detailsText = await detailsRes.text();
          let detailsArr;
          try { detailsArr = JSON.parse(detailsText); } catch (e) { }
          const detailsData = detailsArr && Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

          if (detailsData && String(detailsData.Status) === '1' && detailsData.staff_data && detailsData.staff_data[0]) {
            const staff = detailsData.staff_data[0];
            setStaffData(staff);

            // Mapping for display
            const getMatched = (arr: any[], id: any, valKey: string) => {
              const matched = arr.find(item => String(item.id) === String(id));
              return matched ? matched[valKey] : null;
            };

            setDisplayData({
              groupName: staff.group_name,
              staffName: staff.staff_name,
              username: staff.userName,
              authorizedEmail: staff.authorized_email,
              mobile1: staff.mobile_1,
              mobile2: staff.mobile_2,
              emergencyMobile: staff.emergency_mobile_no,
              emergencyContact: staff.emergency_contact_person,
              panNo: staff.pan_no,
              aadhaarNo: staff.aadhaar_no,
              voterNo: staff.voter_no,
              address: staff.address,
              pincode: staff.pincode,
              kycComplete: staff.kyc_approved === 'Yes',
              lastLogin: staff.last_login,
              fatherName: staff.father_name,
              motherName: staff.mother_name,
              isSuspended: staff.is_suspended === 'Yes',
              accountActivated: staff.account_activated === 'Yes',
              district: getMatched(fetchedDistricts, staff.district_id, 'district'),
              gender: getMatched(fetchedGenders, staff.gender_id, 'gender_txt'),
              maritalStatus: getMatched(fetchedMaritalStatuses, staff.marital_status_id, 'status_txt'),
              bloodGroup: getMatched(fetchedBloodgroups, staff.blood_group, 'blood_group'),
              paymentCategory: (staff.payment_category_id && String(staff.payment_category_id) !== "0" && String(staff.payment_category_id) !== "") ? staff.payment_category_txt : '-',
              contractAmount: staff.contract_amount ? `₹ ${staff.contract_amount}` : '-',
              officeStaff: staff.office_staff,
              dob: staff.dob,
              cKey: staff.cKey,
              files: staff.files && staff.files[0] ? staff.files[0] : null
            });

          } else {
            toast.error(detailsData?.Message || 'Failed to fetch staff details');
            onClose();
          }

        } catch (error) {
          console.error("Failed to fetch data", error);
          toast.error("Failed to fetch staff details");
          onClose();
        } finally {
          setIsLoadingDetails(false);
        }
      };

      fetchData();
    }
  }, [isOpen, staffId]);

  if (!isOpen) return null;

  const Field = ({ label, value, icon: Icon, important = false }: any) => (
    <div className="flex items-start gap-2">
      {Icon && <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${value ? 'text-emerald-500' : 'text-gray-600'}`} />}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase truncate">{label}</span>
        <span className={`text-[13px] break-words ${value ? (important ? 'text-white font-medium' : 'text-gray-300') : 'text-gray-600 italic'}`}>
          {value || 'Not Provided'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1050px] max-w-[95vw] max-h-[90vh] min-h-[600px]'}`}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-400" /> Staff Profile
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded"
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
        <div className="flex-1 overflow-y-auto p-6 bg-[#11141e] relative">
          {isLoadingDetails ? (
            <div className="absolute inset-0 z-10 bg-[#11141e]/90 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <span className="text-gray-400 text-sm">Loading staff profile...</span>
            </div>
          ) : (
            displayData && (
              <div className="flex flex-col gap-6">
                {String(displayData.cKey) === '0' && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 flex items-center gap-3.5 shadow-md relative overflow-hidden shrink-0 animate-fade-in">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 animate-pulse"></div>
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-amber-300 uppercase tracking-wide">Test User Account</span>
                      <p className="text-xs text-gray-400">This profile is flagged as a test account. Actions and data modifications associated with this profile are for testing and validation purposes only.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">

                  {/* Left Side (Profile Overview & Fields) */}
                  <div className="flex-1 flex flex-col gap-6">

                    {/* Top Profile Card */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gradient-to-br from-[#1c2230] to-[#161a25] border border-gray-700/50 rounded-xl shadow-inner">
                      <div className="w-24 h-24 rounded-full border-4 border-[#293653] overflow-hidden shrink-0 bg-[#11141e] flex items-center justify-center shadow-lg">
                        {displayData.files?.dp_file ? (
                          <img src={displayData.files.dp_file} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-gray-600" />
                        )}
                      </div>
                      <div className="flex flex-col items-center sm:items-start flex-1 w-full text-center sm:text-left gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-white">{displayData.staffName}</h3>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                              {displayData.groupName || 'No Group Assigned'}
                            </span>
                            {displayData.kycComplete && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" /> KYC Verified
                              </span>
                            )}
                            {displayData.isSuspended && (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                                Suspended
                              </span>
                            )}
                            {String(displayData.cKey) === '0' && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-400" /> TEST USER
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-2">
                          <span className="flex items-center gap-1.5 text-[13px] text-gray-400">
                            <Mail className="w-3.5 h-3.5" /> {displayData.authorizedEmail || 'No Email'}
                          </span>
                          <span className="flex items-center gap-1.5 text-[13px] text-gray-400">
                            <Phone className="w-3.5 h-3.5" /> {displayData.mobile1 || 'No Phone'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid Block */}
                    <div className="p-5 bg-[#1c2230]/50 border border-gray-700/50 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-y-5 gap-x-4">
                      <Field label="Username" value={displayData.username} icon={UserSquare2} important />
                      <Field label="Payment Category" value={displayData.paymentCategory} icon={UserSquare2} />
                      <Field label="Contract Amount" value={displayData.contractAmount} icon={UserSquare2} />
                      <Field label="Gender" value={displayData.gender} icon={User} />
                      <Field label="Blood Group" value={displayData.bloodGroup} icon={User} />

                      <Field label="Marital Status" value={displayData.maritalStatus} icon={User} />
                      <Field label="Mobile 1" value={displayData.mobile1} icon={Phone} />
                      <Field label="Mobile 2" value={displayData.mobile2} icon={Phone} />

                      <Field label="Father Name" value={displayData.fatherName} icon={User} />
                      <Field label="Mother Name" value={displayData.motherName} icon={User} />
                      <Field label="AADHAR Number" value={displayData.aadhaarNo} important icon={ShieldCheck} />

                      <Field label="PAN Number" value={displayData.panNo} important icon={ShieldCheck} />
                      <Field label="Voter / EPIC" value={displayData.voterNo} icon={ShieldCheck} />
                      <Field label="Date of Birth" value={displayData.dob} icon={User} />
                      <Field label="Office Staff" value={displayData.officeStaff} icon={User} />

                      <Field label="Emergency Contact" value={displayData.emergencyContact} icon={PhoneCall} />
                      <Field label="Emergency Mobile" value={displayData.emergencyMobile} icon={PhoneCall} />
                    </div>

                    {/* Address Section */}
                    <div className="flex flex-col gap-3 p-4 bg-[#1c2230]/50 border border-gray-700/50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-[13px] font-semibold uppercase tracking-wider">Location & Address</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Permanent Address</span>
                          <p className="text-[13px] text-gray-300 bg-[#161a25]/50 p-3 rounded-lg border border-gray-800/50 h-[72px] overflow-y-auto custom-scrollbar">
                            {displayData.address || <span className="text-gray-600 italic">Not Provided</span>}
                          </p>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="block text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">District</span>
                            <span className="text-[13px] text-white font-medium block">{displayData.district || <span className="text-gray-600 italic">Not Provided</span>}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Pincode</span>
                            <span className="text-[13px] text-white font-medium block">{displayData.pincode || <span className="text-gray-600 italic">Not Provided</span>}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Side (Files & Status Overview) */}
                  <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">

                    {/* Account Status Card */}
                    <div className="bg-[#1c2230] border border-gray-700/50 rounded-xl p-5 shadow-lg">
                      <h3 className="text-[13px] font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" /> Account Status
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-400">KYC Status</span>
                          {displayData.kycComplete ? (
                            <span className="flex items-center gap-1 text-[12px] text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[12px] text-red-400"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-400">Activation</span>
                          {displayData.accountActivated ? (
                            <span className="flex items-center gap-1 text-[12px] text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[12px] text-gray-500"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-400">Suspended</span>
                          {displayData.isSuspended ? (
                            <span className="flex items-center gap-1 text-[12px] text-red-400"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[12px] text-gray-500"><XCircle className="w-3.5 h-3.5" /> No</span>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-700/50 mt-1">
                          <span className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1">Last Login</span>
                          <span className="text-[13px] text-white">{displayData.lastLogin || 'Never logged in'}</span>
                        </div>
                      </div>
                    </div>

                    {/* KYC Documents */}
                    <div className="bg-[#1c2230] border border-gray-700/50 rounded-xl p-5 shadow-lg">
                      <h3 className="text-[13px] font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-emerald-400" /> Documents
                      </h3>
                      <div className="grid grid-cols-2 gap-4">

                        {[
                          { key: 'dp_file', label: 'Profile' },
                          { key: 'aadhar_file', label: 'AADHAR' },
                          { key: 'pan_file', label: 'PAN' },
                          { key: 'voter_file', label: 'Voter' },
                        ].map((doc) => {
                          const url = displayData.files?.[doc.key];
                          return (
                            <div key={doc.key} className="flex flex-col gap-2">
                              <div className="aspect-video bg-[#11141e] border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden group">
                                {url ? (
                                  <div className="relative w-full h-full">
                                    <img src={url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center backdrop-blur-[1px]">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-[11px] font-medium border border-white/20 transition-colors cursor-pointer text-center min-w-[80px]"
                                      >
                                        View Full
                                      </a>
                                      <a
                                        href={url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer text-center min-w-[80px]"
                                      >
                                        <Download className="w-3 h-3" /> Download
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                    <FileImage className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400 text-center uppercase tracking-wider">{doc.label}</span>
                            </div>
                          );
                        })}

                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )
          )}
        </div>

        {/* Hidden Printable A4 Layout */}
        <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none opacity-0 -z-50">
          <div ref={printRef} className="w-[800px] p-10 bg-white text-black font-sans box-border relative flex flex-col gap-6" data-html2canvas-ignore="false">

            {/* Header / Title */}
            <div className="text-center border-b-2 border-black pb-4 mb-2">
              <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Staff Information</h1>
              <p className="text-sm font-medium">Profile Overview</p>
            </div>

            {/* Top Profile Section */}
            <div className="flex gap-8 items-start">
              {/* Profile Image - if available */}
              <div className="w-[120px] h-[120px] shrink-0 border border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden rounded-md text-gray-400">
                {base64Dp ? (
                  <img src={base64Dp} alt="Profile" className="w-full h-full object-cover" />
                ) : (displayData.files?.dp_file && !dpError) ? (
                  <span className="text-sm">Loading...</span>
                ) : (
                  <UserCircle className="w-16 h-16" strokeWidth={1.5} />
                )}
              </div>

              {/* Core Details */}
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <h2 className="text-xl font-bold uppercase tracking-wide">{displayData.staffName}</h2>
                <div className="text-sm flex flex-col gap-1 mt-2">
                  <p><strong>Designation / Group:</strong> {displayData.groupName || 'No Group Assigned'}</p>
                  <p><strong>Status:</strong> {displayData.isSuspended ? 'Suspended' : 'Active'} | <strong>KYC:</strong> {displayData.kycComplete ? 'Verified' : 'Pending'} | <strong>Account:</strong> {displayData.accountActivated ? 'Activated' : 'Inactive'}</p>
                  <p><strong>Username:</strong> {displayData.username || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Categorized Information */}

            {/* 1. Contact & Location */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Contact & Location</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                <p><strong>Email:</strong> {displayData.authorizedEmail || 'N/A'}</p>
                <p><strong>Mobile 1:</strong> {displayData.mobile1 || 'N/A'}</p>
                <p><strong>Mobile 2:</strong> {displayData.mobile2 || 'N/A'}</p>
                <p><strong>District:</strong> {displayData.district || 'N/A'}</p>
                <div className="col-span-2">
                  <p><strong>Permanent Address:</strong> {displayData.address || 'N/A'}</p>
                </div>
                <p><strong>Pincode:</strong> {displayData.pincode || 'N/A'}</p>
              </div>
            </div>

            {/* 2. Personal & Bio */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Personal Details</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                <p><strong>Gender:</strong> {displayData.gender || 'N/A'}</p>
                <p><strong>Blood Group:</strong> {displayData.bloodGroup || 'N/A'}</p>
                <p><strong>Marital Status:</strong> {displayData.maritalStatus || 'N/A'}</p>
                <p><strong>Father's Name:</strong> {displayData.fatherName || 'N/A'}</p>
                <p><strong>Mother's Name:</strong> {displayData.motherName || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> {displayData.dob || 'N/A'}</p>
                <p><strong>Is Office Staff:</strong> {displayData.officeStaff || 'N/A'}</p>
              </div>
            </div>

            {/* 3. Identity & Documents */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Identity Information</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                <p><strong>AADHAR Number:</strong> {displayData.aadhaarNo || 'N/A'}</p>
                <p><strong>PAN Number:</strong> {displayData.panNo || 'N/A'}</p>
                <p><strong>Voter / EPIC:</strong> {displayData.voterNo || 'N/A'}</p>
              </div>
            </div>

            {/* 4. Employment & Emergency */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Employment & Emergency</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                <p><strong>Payment Category:</strong> {displayData.paymentCategory || '-'}</p>
                <p><strong>Contract Amount:</strong> {displayData.contractAmount || '-'}</p>
                <p><strong>Emergency Contact Person:</strong> {displayData.emergencyContact || 'N/A'}</p>
                <p><strong>Emergency Mobile:</strong> {displayData.emergencyMobile || 'N/A'}</p>
              </div>
            </div>

            {/* 5. System Data */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-1">System Record</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                <p><strong>Staff ID:</strong> {staffId || 'N/A'}</p>
                <p><strong>Last Login:</strong> {displayData.lastLogin || 'Never logged in'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#293653] hover:bg-[#324368] border border-gray-600 rounded transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors shadow-sm"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
