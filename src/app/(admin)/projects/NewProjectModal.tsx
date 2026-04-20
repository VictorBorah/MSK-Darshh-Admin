'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  X, Loader2, DollarSign, Layers, Grid, MapPin, HelpCircle, ChevronRight, Save
} from 'lucide-react';
import Select from 'react-select';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete, Libraries } from '@react-google-maps/api';
import dynamic from 'next/dynamic';
import { useModalEscape } from '@/hooks/useModalEscape';
import WarningAlertModal from '@/components/WarningAlertModal';

const GeofenceMap = dynamic(() => import('./GeofenceMap'), { ssr: false, loading: () => <div className="text-white">Loading Map...</div> });
const StagesModal = dynamic(() => import('./StagesModal'), { ssr: false, loading: () => <div className="text-white">Loading Stages...</div> });
const ExpensesModal = dynamic(() => import('./ExpensesModal'), { ssr: false, loading: () => <div className="text-white">Loading Expenses...</div> });

const GOOGLE_MAPS_LIBRARIES: Libraries = ['places'];

interface CoordinateMapProps {
  initialCoords: { lat: number, lng: number } | null;
  onSave: (coords: { lat: number, lng: number }) => void;
  onCancel: () => void;
}

const CoordinateMap = ({ initialCoords, onSave, onCancel }: CoordinateMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState<{ lat: number, lng: number } | null>(initialCoords);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [defaultCenter, setDefaultCenter] = useState<{ lat: number, lng: number }>({ lat: 26.7271, lng: 93.1353 }); // Biswanath Chariali approx default

  useEffect(() => {
    if (initialCoords || !isLoaded) return;

    const fallbackGeocode = (address: string, nextFallback?: string) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          setDefaultCenter({ lat: loc.lat(), lng: loc.lng() });
        } else if (nextFallback) {
          fallbackGeocode(nextFallback);
        }
      });
    };

    const tryFallbackSequence = () => {
      fallbackGeocode("Darsh Builders, Biswanath Charilai, Assam, India", "Biswanath Charilai, Assam, India");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDefaultCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error);
          tryFallbackSequence();
        },
        { timeout: 10000 }
      );
    } else {
      tryFallbackSequence();
    }
  }, [initialCoords, isLoaded]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  const onLoadAutocomplete = (ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPos({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(16);
      }
    }
  };

  return (
    <div className={`bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 flex flex-col items-center justify-center text-center w-[900px] max-w-[95vw]`}>
      <div className="w-full flex flex-col items-start text-left">
        <div className="flex items-center gap-2 mb-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-[17px] font-semibold text-white">Select Coordinates</h3>
          </div>
          {isLoaded && (
            <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
              <input
                type="text"
                placeholder="Search for a location..."
                className="w-[300px] h-9 bg-gray-800 border-none text-white text-[13px] rounded px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
            </Autocomplete>
          )}
        </div>

        <div className="w-full h-[500px] bg-gray-800 rounded-md overflow-hidden mb-6 border border-gray-700">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={markerPos || defaultCenter}
              zoom={markerPos ? 16 : 14}
              onClick={handleMapClick}
              options={{ streetViewControl: false, mapTypeControl: false }}
              onLoad={m => setMap(m)}
              onUnmount={() => setMap(null)}
            >
              {markerPos && <Marker position={markerPos} />}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Loading Google Maps...</div>
          )}
        </div>

        <div className="w-full flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 outline-none border border-gray-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm">
            Cancel
          </button>
          <button onClick={() => markerPos && onSave(markerPos)} disabled={!markerPos} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 outline-none border-none text-white font-medium text-sm rounded-md transition-colors shadow-sm">
            Set Coordinates
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Helper for input rows matching mockup spec
const FormRow = ({ label, helpText, children, alignTop }: { label: string, helpText?: string, children: React.ReactNode, alignTop?: boolean }) => (
  <div className={`flex items-${alignTop ? 'start' : 'center'} justify-between gap-3 mb-3 relative`}>
    <label className={`text-[13px] text-[#ccd6f6] w-[140px] shrink-0 font-medium ${alignTop ? 'pt-2' : ''}`}>{label}</label>
    <div className="flex-1 flex items-center gap-2.5">
      {children}
      {helpText ? (
        <div className="relative group flex items-center justify-center">
          <HelpCircle className="w-[14px] h-[14px] text-gray-400 shrink-0 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 w-[220px] p-2.5 bg-[#0f172a] border border-[#38bdf8] text-[#e2e8f0] text-[11px] font-medium rounded shadow-[0_0_12px_rgba(56,189,248,0.25)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] pointer-events-none leading-relaxed text-right">
            {helpText}
            <div className="absolute top-full right-1 -mt-px border-[5px] border-transparent border-t-[#38bdf8]"></div>
          </div>
        </div>
      ) : (
        <HelpCircle className="w-[14px] h-[14px] text-gray-400 shrink-0 cursor-help" />
      )}
    </div>
  </div>
);

// react-select custom styling mapped to the specific user aesthetics
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    background: '#eee0e0',
    border: state.isFocused ? '2px solid #3b82f6' : 'none',
    boxShadow: 'none',
    minHeight: '32px',
    height: 'auto',
    borderRadius: '0.125rem',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#111827',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 10px',
    height: 'auto',
    minHeight: '32px',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: 'auto',
    minHeight: '32px',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#111827',
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: '#3b82f6',
    borderRadius: '2px',
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: 'white',
    padding: '2px 6px',
    fontSize: '12px'
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'white',
    ':hover': {
      backgroundColor: '#2563eb',
      color: 'white',
    },
  }),
  input: (base: any) => ({
    ...base,
    color: '#111827',
    margin: '0',
    padding: '0',
    height: 'auto',
    minHeight: '32px'
  }),
  menu: (base: any) => ({
    ...base,
    background: '#fff',
    borderRadius: '0.125rem',
    fontSize: '13px',
    zIndex: 9999
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#bfdbfe' : 'transparent',
    color: state.isSelected ? '#fff' : '#111827',
    cursor: 'pointer',
    padding: '8px 12px'
  })
};

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  // Config State
  const [configData, setConfigData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');
  
  useModalEscape(isOpen, () => setShowExitConfirm(true), 200);

  // Wizard Stage Tracker (1 = Basic Info, 2 = Advanced Config)
  const [step, setStep] = useState(1);

  // Form State (Step 1)
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Results from Step 1 (Retained for Step 2)
  const [projectId, setProjectId] = useState('');

  // Form State (Step 2 Columns)
  // Column 1
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCoordinates, setSiteCoordinates] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [clientId, setClientId] = useState('');

  // Column 2
  const [accountantId, setAccountantId] = useState<string[]>([]);
  const [engineerId, setEngineerId] = useState<string[]>([]);
  const [contractorId, setContractorId] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState<string[]>([]);
  const [pmId, setPmId] = useState<string[]>([]);
  const [omId, setOmId] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string[]>([]);
  const [masonId, setMasonId] = useState<string[]>([]);
  const [vendorId, setVendorId] = useState<string[]>([]);

  // Column 3
  const [allocatedBudget, setAllocatedBudget] = useState('');
  const [budgetTrigger, setBudgetTrigger] = useState('');
  const [geofenceData, setGeofenceData] = useState('');
  const [stagesCsv, setStagesCsv] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [initialTotalExpense, setInitialTotalExpense] = useState('0.00');
  const [expensesJson, setExpensesJson] = useState('[]');

  // Sub-modal Overlay State
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setProjectName('');
      setProjectCode('');
      setProjectId('');
      setSaveError('');
      setSiteAddress('');
      setSiteCoordinates('');
      setDistrictId('');
      setStartDate('');
      setClientId('');
      setAccountantId([]);
      setEngineerId([]);
      setContractorId([]);
      setSupervisorId([]);
      setPmId([]);
      setOmId([]);
      setManagerId([]);
      setMasonId([]);
      setVendorId([]);
      setAllocatedBudget('');
      setBudgetTrigger('');
      setGeofenceData('');
      setStagesCsv('');
      setCurrentStage('');
      setInitialTotalExpense('0.00');
      setExpensesJson('[]');
      setShowExitConfirm(false);
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    setConfigError('');
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setConfigData(data);
      } else {
        setConfigError(data.Message || 'Failed to load configuration data.');
      }
    } catch (e: any) {
      setConfigError(e.message || 'Network connectivity error.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectCode) {
      setSaveError('Please fill in both fields.');
      return;
    }
    setSaveError('');
    setSavingBasicInfo(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('project_name', projectName);
      formData.append('project_code', projectCode);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveProjectBasicInfo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Basic project info saved successfully.');
        setProjectId(data.project_id);
        setProjectName(data.project_name || projectName);
        setProjectCode(data.project_code || projectCode);
        setStep(2);
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        const errorMsg = data.Message || data.message || 'Failed to save basic project info.';
        setSaveError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = data?.Message || data?.message || 'Unexpected response from server.';
        setSaveError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (e: any) {
      setSaveError(e.message || 'Network validation error.');
    } finally {
      setSavingBasicInfo(false);
    }
  };

  const [savingDetails, setSavingDetails] = useState(false);
  const [errorField, setErrorField] = useState<string>('');

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorField('');

    if (!siteAddress) { toast.error("Site Address is mandatory."); setErrorField('siteAddress'); return; }
    if (!districtId) { toast.error("Please select a District."); setErrorField('districtId'); return; }
    if (!siteCoordinates) { toast.error("Site Coordinates must be provided."); setErrorField('siteCoordinates'); return; }
    if (!geofenceData) { toast.error("Please configure the site Geofence boundaries."); setErrorField('geofenceData'); return; }
    if (!startDate) { toast.error("A Start Date is required."); setErrorField('startDate'); return; }
    if (!clientId) { toast.error("You must Link a Client to this project."); setErrorField('clientId'); return; }
    if (accountantId.length === 0) { toast.error("Please assign at least one Accountant."); setErrorField('accountantId'); return; }
    if (managerId.length === 0) { toast.error("Please assign at least one Manager."); setErrorField('managerId'); return; }
    if (engineerId.length === 0) { toast.error("Please assign at least one Engineer."); setErrorField('engineerId'); return; }
    if (supervisorId.length === 0) { toast.error("Please assign at least one Supervisor."); setErrorField('supervisorId'); return; }
    if (!allocatedBudget) { toast.error("Please specify an Allocated Budget."); setErrorField('allocatedBudget'); return; }
    if (!budgetTrigger) { toast.error("Please define a Budget Trigger amount."); setErrorField('budgetTrigger'); return; }

    setSavingDetails(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('site_address', siteAddress);
      formData.append('district_id', districtId);
      formData.append('site_coordinates', siteCoordinates);
      formData.append('geofence_json', geofenceData);
      
      const [year, month, day] = startDate.split('-');
      formData.append('start_date', `${day}-${month}-${year}`);

      formData.append('client_id', clientId);
      formData.append('sa_csv', accountantId.join(','));
      formData.append('sm_csv', managerId.join(','));
      formData.append('se_csv', engineerId.join(','));
      formData.append('ss_csv', supervisorId.join(','));
      
      if (pmId.length > 0) formData.append('pm_csv', pmId.join(','));
      if (contractorId.length > 0) formData.append('sc_csv', contractorId.join(','));
      if (omId.length > 0) formData.append('om_csv', omId.join(','));
      if (masonId.length > 0) formData.append('masons_csv', masonId.join(','));
      if (vendorId.length > 0) formData.append('vendors_csv', vendorId.join(','));

      formData.append('budget_amount', allocatedBudget);
      formData.append('trigger_amount', budgetTrigger);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/updateProjectDetails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const arr = JSON.parse(await res.text());
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || data.message || 'Project details saved efficiently.');
        if (onSuccess) onSuccess();
        onClose();
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to save advanced project details.');
      } else {
        toast.error(data?.Message || data?.message || 'Unexpected response from server.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network executing error occurred.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDecimalInput = (value: string, setter: (val: string) => void) => {
    let clean = value.replace(/[^0-9.]/g, ''); // strip non-numerics mapped to UI requests
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
    }
    setter(clean);
  };

  if (!isOpen) return null;

  // React Select Dictionary Maps
  const districtOptions = configData?.districts?.map((d: any) => ({ value: String(d.id), label: d.district })) || [];
  const clientOptions = configData?.clients?.map((c: any) => ({ value: String(c.id), label: c.client_name })) || [];
  const accountantOptions = configData?.hr_array?.accountants?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const engineerOptions = configData?.hr_array?.engineers?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const contractorOptions = configData?.hr_array?.contractors?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const supervisorOptions = configData?.hr_array?.supervisors?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const pmOptions = configData?.hr_array?.procurement_managers?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const omOptions = configData?.hr_array?.operation_managers?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const managerOptions = configData?.hr_array?.managers?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const masonOptions = configData?.hr_array?.masons?.map((h: any) => ({ value: String(h.id), label: h.name })) || [];
  const vendorOptions = configData?.vendors?.map((v: any) => ({ value: String(v.id), label: v.vendor_name })) || [];

  return (
    <>
      <WarningAlertModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard Project Details?"
        content="Are you sure you want to exit without saving? All progress will be lost."
        onConfirm={() => {
           setShowExitConfirm(false);
           onClose();
        }}
      />
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">

        {/* Main Modal Shell (Adapts size based on step) */}
        <div className={`bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-all duration-300 ${step === 1 ? 'w-[450px] max-w-[95vw]' : 'w-[1250px] max-w-[95vw]'}`}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
            {step === 1 ? (
              <h2 className="text-[17px] font-semibold text-white tracking-wide">
                New Project
              </h2>
            ) : (
              <div className="flex flex-col">
                <h2 className="text-[17px] text-white tracking-wide flex items-center gap-2">
                  <span className="font-semibold">Project Details:</span> <span className="text-blue-200">{projectName} ({projectCode})</span>
                </h2>
                <span className="text-[12px] text-gray-400 mt-1 font-medium">Project Sequence {projectId}</span>
              </div>
            )}

            <button onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-white transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-[#1c2130]">
            {loadingConfig ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-[#ccd6f6]">Loading Configuration Data...</p>
              </div>
            ) : configError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <p className="text-sm text-red-400 text-center">{configError}</p>
              </div>
            ) : (
              <>
                {/* STAGE 1 : Basic Project Information */}
                {step === 1 && (
                  <form onSubmit={handleSaveBasicInfo} className="animate-in slide-in-from-right-8 duration-300">
                    <div className="space-y-6">
                      <FormRow label="Project Name">
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                          required
                        />
                      </FormRow>
                      <FormRow label="Project Code">
                        <input
                          type="text"
                          value={projectCode}
                          onChange={(e) => setProjectCode(e.target.value)}
                          className="w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                          autoComplete="off"
                          required
                        />
                      </FormRow>
                    </div>

                    {saveError && <p className="text-xs text-red-400 font-medium mt-4 text-center">{saveError}</p>}

                    <div className="pt-8 flex justify-center">
                      <button
                        type="submit"
                        disabled={savingBasicInfo}
                        className="px-6 h-9 bg-[#2b6cb0] hover:bg-[#3182ce] text-white text-[13px] font-medium rounded-md transition-colors min-w-[120px] flex justify-center items-center gap-1.5"
                      >
                        {savingBasicInfo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </form>
                )}

                {/* STAGE 2 : Advanced Configuration Grid */}
                {step === 2 && (
                  <form onSubmit={handleFinalSubmit} className="animate-in slide-in-from-right-8 duration-300">
                    <input type="hidden" name="x_project_id" value={projectId} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12">

                      {/* Column 1: Site Properties */}
                      <div className="flex flex-col">
                        <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide">Site Properties</h3>

                        <FormRow label="Site Address" helpText="Address of your site">
                          <input type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'siteAddress' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-blue-500'}`} autoComplete="off" />
                        </FormRow>

                        <FormRow label="Select District" helpText="District in Assam where your site is located">
                          <div className={`w-full ${errorField === 'districtId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              options={districtOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={districtOptions.find((o: any) => o.value === districtId) || null}
                              onChange={(v: any) => setDistrictId(v?.value || '')}
                              placeholder="Select district..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Site Coordinates" helpText="GPS Coordinates for navigation">
                          <div className={`w-full ${errorField === 'siteCoordinates' ? 'ring-2 ring-red-500 rounded-sm' : ''}`} onClick={() => setActiveSubModal('Coordinates')}>
                            <input type="text" readOnly value={siteCoordinates} placeholder="Click to open Window" className="w-full bg-[#eee0e0] cursor-pointer text-blue-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none" />
                          </div>
                        </FormRow>

                        <FormRow label="Define Geofence" helpText="GPS Geofence to monitor activity" alignTop>
                          <div className={`w-full flex flex-col items-end ${errorField === 'geofenceData' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <textarea
                              readOnly
                              value={geofenceData}
                              className="w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm p-2.5 h-20 focus:outline-none mb-1.5 resize-none font-mono"
                            />
                            <span onClick={() => setActiveSubModal('Geofence')} className="text-blue-400 text-[13px] cursor-pointer hover:underline">Configure Geofence</span>
                          </div>
                        </FormRow>

                        <FormRow label="Start Date" helpText="Date of commencement of construction">
                          <input type="date" value={startDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setStartDate(e.target.value)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none cursor-pointer ${errorField === 'startDate' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-blue-500'}`} />
                        </FormRow>

                        <FormRow label="Link Client" helpText="Link this project to your client">
                          <div className={`w-full ${errorField === 'clientId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              options={clientOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={clientOptions.find((o: any) => o.value === clientId) || null}
                              onChange={(v: any) => setClientId(v?.value || '')}
                              placeholder="Select client..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Define Stages" helpText="Configure stages for your project">
                          <div className="w-full" onClick={() => setActiveSubModal('Stages')}>
                            <input type="text" readOnly value={stagesCsv} placeholder="Click to open Stages Window" className="w-full bg-[#eee0e0] cursor-pointer text-blue-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none" />
                          </div>
                        </FormRow>

                        <FormRow label="Current Stage" helpText="Will be automatically set once your stages are defined">
                          <input type="text" readOnly value={currentStage} className="w-full bg-[#7d828f] border-none text-white text-[13px] font-medium rounded-sm px-2.5 h-8 cursor-not-allowed opacity-90" />
                        </FormRow>
                      </div>


                      {/* Column 2: HR Management */}
                      <div className="flex flex-col">
                        <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide">HR Management</h3>

                        <FormRow label="Link Accountant" helpText="Assign an Accountant for this project">
                          <div className={`w-full ${errorField === 'accountantId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              isMulti
                              options={accountantOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={accountantOptions.filter((o: any) => accountantId.includes(o.value))}
                              onChange={(v: any) => setAccountantId(v ? v.map((item: any) => item.value) : [])}
                              placeholder="Select accountant..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Link Managers" helpText="Assign Managers for this project">
                          <div className={`w-full ${errorField === 'managerId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              isMulti
                              options={managerOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={managerOptions.filter((o: any) => managerId.includes(o.value))}
                              onChange={(v: any) => setManagerId(v ? v.map((item: any) => item.value) : [])}
                              placeholder="Select managers..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Link Engineer" helpText="Assign an Engineer for this project">
                          <div className={`w-full ${errorField === 'engineerId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              isMulti
                              options={engineerOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={engineerOptions.filter((o: any) => engineerId.includes(o.value))}
                              onChange={(v: any) => setEngineerId(v ? v.map((item: any) => item.value) : [])}
                              placeholder="Select engineer..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Link Contractors" helpText="Assign Contractors for this project">
                          <Select
                              isMulti
                              options={contractorOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={contractorOptions.filter((o: any) => contractorId.includes(o.value))}
                              onChange={(v: any) => setContractorId(v ? v.map((item: any) => item.value) : [])}
                              placeholder="Select contractors..."
                              isClearable
                          />
                        </FormRow>

                        <FormRow label="Link Supervisor" helpText="Assign a Supervisor for this project">
                          <div className={`w-full ${errorField === 'supervisorId' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                            <Select
                              isMulti
                              options={supervisorOptions}
                              styles={customSelectStyles}
                              className="w-full text-[13px]"
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              value={supervisorOptions.filter((o: any) => supervisorId.includes(o.value))}
                              onChange={(v: any) => setSupervisorId(v ? v.map((item: any) => item.value) : [])}
                              placeholder="Select supervisor..."
                              isClearable
                            />
                          </div>
                        </FormRow>

                        <FormRow label="Link PM" helpText="Assign a Procurement Manager for this project">
                          <Select
                            isMulti
                            options={pmOptions}
                            styles={customSelectStyles}
                            className="w-full text-[13px]"
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            value={pmOptions.filter((o: any) => pmId.includes(o.value))}
                            onChange={(v: any) => setPmId(v ? v.map((item: any) => item.value) : [])}
                            placeholder="Select PM..."
                            isClearable
                          />
                        </FormRow>

                        <FormRow label="Link OM" helpText="Assign a Operations Manager for this project">
                          <Select
                            isMulti
                            options={omOptions}
                            styles={customSelectStyles}
                            className="w-full text-[13px]"
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            value={omOptions.filter((o: any) => omId.includes(o.value))}
                            onChange={(v: any) => setOmId(v ? v.map((item: any) => item.value) : [])}
                            placeholder="Select OM..."
                            isClearable
                          />
                        </FormRow>

                        <FormRow label="Link Masons" helpText="Assign Masons for this project">
                          <Select
                            isMulti
                            options={masonOptions}
                            styles={customSelectStyles}
                            className="w-full text-[13px]"
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            value={masonOptions.filter((o: any) => masonId.includes(o.value))}
                            onChange={(v: any) => setMasonId(v ? v.map((item: any) => item.value) : [])}
                            placeholder="Select masons..."
                            isClearable
                          />
                        </FormRow>

                        <FormRow label="Select Vendors" helpText="Assign Vendors for this project">
                          <Select
                            isMulti
                            options={vendorOptions}
                            styles={customSelectStyles}
                            className="w-full text-[13px]"
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            value={vendorOptions.filter((o: any) => vendorId.includes(o.value))}
                            onChange={(v: any) => setVendorId(v ? v.map((item: any) => item.value) : [])}
                            placeholder="Select vendors..."
                            isClearable
                          />
                        </FormRow>
                      </div>


                      {/* Column 3: Site Financials */}
                      <div className="flex flex-col relative h-full">
                        <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide">Site Financials</h3>

                        <FormRow label="Allocated Budget" helpText="Maximum Budget in Rupees allocated for this project, in rupees">
                          <input type="text" value={allocatedBudget} onChange={(e) => handleDecimalInput(e.target.value, setAllocatedBudget)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'allocatedBudget' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-blue-500'}`} autoComplete="off" />
                        </FormRow>

                        <FormRow label="Budget Trigger" helpText="A notification will be sent to you when this project consumes this amount of financial value of your budget, in rupees">
                          <input type="text" value={budgetTrigger} onChange={(e) => handleDecimalInput(e.target.value, setBudgetTrigger)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'budgetTrigger' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-blue-500'}`} autoComplete="off" />
                        </FormRow>

                        <FormRow label="Define Expenses" helpText="Define how much you have already spent on this project, in rupees">
                          <div className="w-full cursor-pointer" onClick={() => setActiveSubModal('Expenses')}>
                            <input type="text" readOnly value={`Rs. ${initialTotalExpense}`} placeholder="Click to open Window" className="w-full bg-[#eee0e0] cursor-pointer text-blue-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none" />
                          </div>
                        </FormRow>

                        <FormRow label="Initial Expenses" helpText="This will automatically be set when you define your inital expenses on this project, in rupees">
                          {/* Read-Only Gray Box */}
                          <input type="text" readOnly className="w-full bg-[#7d828f] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 cursor-not-allowed opacity-90" />
                        </FormRow>

                        {/* Finish Setup Button */}
                        <div className="absolute bottom-0 right-0 mt-8 flex justify-end">
                          <button
                            type="submit"
                            disabled={savingDetails}
                            className="px-6 h-9 bg-[#2b6cb0] hover:bg-[#3182ce] text-white text-[13px] font-medium rounded-md shadow-lg transition-colors flex items-center justify-center gap-2 min-w-[130px]"
                          >
                            {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Finish Setup</>}
                          </button>
                        </div>
                      </div>

                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Modal Overlay Engine (Rendered directly above the parent modal via z-index padding) */}
      {activeSubModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          {activeSubModal === 'Coordinates' ? (
            <CoordinateMap
              initialCoords={siteCoordinates ? {
                lat: parseFloat(siteCoordinates.split(',')[0]),
                lng: parseFloat(siteCoordinates.split(',')[1])
              } : null}
              onSave={(coords) => {
                setSiteCoordinates(`${coords.lat}, ${coords.lng}`);
                setActiveSubModal(null);
              }}
              onCancel={() => setActiveSubModal(null)}
            />
          ) : activeSubModal === 'Geofence' ? (
            <GeofenceMap
              initialGeofence={geofenceData}
              onSave={(geojson) => {
                setGeofenceData(JSON.stringify(geojson, null, 2));
                setActiveSubModal(null);
              }}
              onCancel={() => setActiveSubModal(null)}
            />
          ) : activeSubModal === 'Stages' ? (
            <StagesModal 
              projectId={projectId}
              configStages={configData?.stages || []}
              initialStagesCsv={stagesCsv}
              initialCurrentStage={currentStage}
              onConfirm={(csv, current, updatedStages) => {
                setStagesCsv(csv);
                setCurrentStage(current);
                if (configData) setConfigData({ ...configData, stages: updatedStages });
                setActiveSubModal(null);
              }}
              onCancel={() => setActiveSubModal(null)}
            />
          ) : activeSubModal === 'Expenses' ? (
            <ExpensesModal 
              projectId={projectId}
              configHeads={configData?.budget_heads_array || []}
              initialExpensesJson={expensesJson}
              onConfirm={(total, jsonStr, updatedHeads) => {
                setInitialTotalExpense(total);
                setExpensesJson(jsonStr);
                if (configData) setConfigData({ ...configData, budget_heads_array: updatedHeads });
                setActiveSubModal(null);
              }}
              onCancel={() => setActiveSubModal(null)}
            />
          ) : (
            <div className="bg-[#1c2130] border border-gray-700/50 rounded-xl shadow-2xl p-6 w-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                {activeSubModal === 'Geofence' && <Grid className="w-6 h-6 text-blue-400" />}
                {activeSubModal === 'Stages' && <Layers className="w-6 h-6 text-emerald-400" />}
                {activeSubModal === 'Expenses' && <DollarSign className="w-6 h-6 text-purple-400" />}
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">{activeSubModal} Data</h3>
              <p className="text-[#ccd6f6] text-sm mb-8 leading-relaxed">System payload awaiting input parameters for {activeSubModal.toLowerCase()} definition.</p>
              <button onClick={() => setActiveSubModal(null)} className="px-8 py-2 bg-gray-700 hover:bg-gray-600 outline-none border border-gray-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm">
                Close window
              </button>
            </div>
          )}
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1c2130] border border-gray-700 rounded-xl shadow-2xl p-6 w-[420px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Exit Setup?</h3>
            <p className="text-[#ccd6f6] text-[14px] mb-8">Do you want to exit without completing the setup?</p>
            <div className="flex gap-3 w-full justify-center">
              <button 
                onClick={() => setShowExitConfirm(false)} 
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium text-[13px] rounded-md transition-colors shadow-sm"
              >
                No, Keep Editing
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }} 
                className="flex-1 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-medium text-[13px] rounded-md transition-colors shadow-sm"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
