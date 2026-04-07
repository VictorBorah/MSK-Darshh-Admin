'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  X, Loader2, DollarSign, Layers, Grid, MapPin, HelpCircle, ChevronRight, Save
} from 'lucide-react';
import Select from 'react-select';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete, Libraries } from '@react-google-maps/api';
import dynamic from 'next/dynamic';

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
  const [defaultCenter, setDefaultCenter] = useState<{ lat: number, lng: number }>({ lat: 26.7271, lng: 93.1353 });

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
          console.warn('Geolocation denied:', error);
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
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[17px] font-semibold text-white">Select Coordinates</h3>
          </div>
          {isLoaded && (
            <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
              <input
                type="text"
                placeholder="Search for a location..."
                className="w-[300px] h-9 bg-gray-800 border-none text-white text-[13px] rounded px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
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
          <button onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none">
            Cancel
          </button>
          <button onClick={() => markerPos && onSave(markerPos)} disabled={!markerPos} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none border-none">
            Set Coordinates
          </button>
        </div>
      </div>
    </div>
  );
};

const FormRow = ({ label, helpText, children, alignTop }: { label: string, helpText?: string, children: React.ReactNode, alignTop?: boolean }) => (
  <div className={`flex items-${alignTop ? 'start' : 'center'} justify-between gap-3 mb-3 relative`}>
    <label className={`text-[13px] text-[#ccd6f6] w-[140px] shrink-0 font-medium ${alignTop ? 'pt-2' : ''}`}>{label}</label>
    <div className="flex-1 flex items-center gap-2.5">
      {children}
      {helpText ? (
        <div className="relative group flex items-center justify-center">
          <HelpCircle className="w-[14px] h-[14px] text-gray-400 shrink-0 cursor-help hover:text-emerald-400 transition-colors" />
          <div className="absolute right-0 bottom-full mb-2 w-[220px] p-2.5 bg-[#0f172a] border border-emerald-500/50 text-[#e2e8f0] text-[11px] font-medium rounded shadow-[0_0_12px_rgba(16,185,129,0.2)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] pointer-events-none leading-relaxed text-right">
            {helpText}
            <div className="absolute top-full right-1 -mt-px border-[5px] border-transparent border-t-emerald-500/50"></div>
          </div>
        </div>
      ) : (
        <HelpCircle className="w-[14px] h-[14px] text-gray-400 shrink-0 cursor-help" />
      )}
    </div>
  </div>
);

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    background: '#eee0e0',
    border: state.isFocused ? '2px solid #10b981' : 'none',
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
    backgroundColor: '#10b981',
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
      backgroundColor: '#059669',
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
    backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'transparent',
    color: state.isSelected ? '#fff' : '#111827',
    cursor: 'pointer',
    padding: '8px 12px'
  })
};

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

export default function EditProjectModal({ isOpen, onClose, projectId, projectName, onSuccess }: EditProjectModalProps) {
  const [configData, setConfigData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');

  const [siteAddress, setSiteAddress] = useState('');
  const [siteCoordinates, setSiteCoordinates] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [clientId, setClientId] = useState('');

  const [accountantId, setAccountantId] = useState<string[]>([]);
  const [engineerId, setEngineerId] = useState<string[]>([]);
  const [contractorId, setContractorId] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState<string[]>([]);
  const [pmId, setPmId] = useState<string[]>([]);
  const [omId, setOmId] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string[]>([]);
  const [masonId, setMasonId] = useState<string[]>([]);
  const [vendorId, setVendorId] = useState<string[]>([]);

  const [allocatedBudget, setAllocatedBudget] = useState('');
  const [budgetTrigger, setBudgetTrigger] = useState('');
  const [geofenceData, setGeofenceData] = useState('');
  const [stagesCsv, setStagesCsv] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [initialTotalExpense, setInitialTotalExpense] = useState('0.00');
  const [expensesJson, setExpensesJson] = useState('[]');
  const [originalProjectCode, setOriginalProjectCode] = useState('');

  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [savingDetails, setSavingDetails] = useState(false);
  const [errorField, setErrorField] = useState<string>('');

  useEffect(() => {
    if (isOpen && projectId) {
      setSaveError('');
      setShowExitConfirm(false);
      fetchAggregatedData();
    } else {
      setConfigData(null);
    }
  }, [isOpen, projectId]);

  const mapHrIds = (names: string[], dict: any[]) => {
    if (!names || !dict || !Array.isArray(names)) return [];
    return names.map(n => dict.find((i: any) => i.name === n)?.id).filter(Boolean).map(String);
  };

  const fetchAggregatedData = async () => {
    setLoadingConfig(true);
    setConfigError('');
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      
      const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const arr1 = JSON.parse(await res1.text());
      const cData = Array.isArray(arr1) ? arr1[0] : arr1;
      if (!cData || String(cData.Status) !== '1') throw new Error(cData?.Message || 'Failed to load configuration data.');
      setConfigData(cData);

      const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchProjectDetails?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const arr2 = JSON.parse(await res2.text());
      const pData = Array.isArray(arr2) ? arr2[0] : arr2;

      if (pData && String(pData.Status) === '1') {
        const pd = pData.project_data;
        
        setSiteAddress(pd.site_address || '');
        setSiteCoordinates(pd.site_coordinates || '');
        setGeofenceData(pd.geofence_json || '');
        setOriginalProjectCode(pd.project_code || '---');

        const dMatch = cData.districts?.find((d: any) => d.district === pd.district);
        if (dMatch) setDistrictId(String(dMatch.id));

        const cMatch = cData.clients?.find((c: any) => c.client_name === pd.client_name);
        if (cMatch) setClientId(String(cMatch.id));

        if (pd.start_date) {
          const tempDate = pd.start_date.split('-');
          if (tempDate.length === 3) setStartDate(`${tempDate[2]}-${tempDate[1]}-${tempDate[0]}`);
        }

        setStagesCsv(pd.stages_csv || '');
        setCurrentStage(pd.current_stage || '');
        setAllocatedBudget(pd.allocated_budget || '');
        setInitialTotalExpense(pd.inital_expenditure || '0.00');
        setExpensesJson(pd.expenses_json || '[]');

        setAccountantId(mapHrIds(pd.accountants_data, cData.hr_array?.accountants));
        setManagerId(mapHrIds(pd.managers_data, cData.hr_array?.managers));
        setEngineerId(mapHrIds(pd.engineers_data, cData.hr_array?.engineers));
        setContractorId(mapHrIds(pd.contractors_data, cData.hr_array?.contractors));
        setSupervisorId(mapHrIds(pd.supervisors_data, cData.hr_array?.supervisors));
        setPmId(mapHrIds(pd.procurement_managers_data, cData.hr_array?.procurement_managers));
        setOmId(mapHrIds(pd.operation_managers_data || pd.operation_data, cData.hr_array?.operation_managers));
        setMasonId(mapHrIds(pd.masons_data, cData.hr_array?.masons));
        
        let vIds: string[] = [];
        let rawVendors = pd.vendors_data || [];
        if (typeof rawVendors === 'string') rawVendors = rawVendors.split(',');
        if (Array.isArray(rawVendors)) {
           vIds = rawVendors.map((v: any) => {
              if (typeof v === 'string') {
                 const cleanV = v.trim().toLowerCase();
                 const vById = cData.vendors?.find((cv: any) => String(cv.id).trim() === v.trim());
                 if (vById) return String(vById.id);
                 const vByName = cData.vendors?.find((cv: any) => cv.vendor_name?.trim().toLowerCase() === cleanV);
                 if (vByName) return String(vByName.id);
                 return v.trim(); // Fallback to the raw string if not found in dictionary
              } else if (typeof v === 'object' && v) {
                 return String(v.id || v.vendor_id || v.vendor_name || '');
              }
              return '';
           }).filter(Boolean);
        }
        setVendorId(vIds);

      } else {
        throw new Error(pData?.Message || 'Failed to load specific project data.');
      }

    } catch (e: any) {
      setConfigError(e.message || 'Network connectivity error.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const [saveError, setSaveError] = useState('');

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
      
      formData.append('pm_csv', pmId.join(','));
      formData.append('sc_csv', contractorId.join(','));
      formData.append('om_csv', omId.join(','));
      formData.append('masons_csv', masonId.join(','));
      formData.append('vendors_csv', vendorId.join(','));

      formData.append('budget_amount', allocatedBudget);
      formData.append('trigger_amount', budgetTrigger || '0');

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
        toast.success(data.Message || data.message || 'Project details updated efficiently.');
        if (onSuccess) onSuccess();
        onClose();
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || data.message || 'Failed to update project details.');
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
    let clean = value.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
    }
    setter(clean);
  };

  if (!isOpen) return null;

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
  vendorId.forEach(id => {
    if (!vendorOptions.find((o: any) => o.value === id)) {
      vendorOptions.push({ value: id, label: id }); // Fallback UI option for missing configs
    }
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
        <div className={`bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-all duration-300 w-[1250px] max-w-[95vw]`}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
            <div className="flex flex-col">
              <h2 className="text-[17px] text-white tracking-wide flex items-center gap-2">
                <span className="font-semibold border-r border-gray-600 pr-3 mr-1">Edit Project</span> 
                <span className="text-emerald-300 font-bold">{projectName}</span>
                <span className="text-gray-400">({originalProjectCode})</span>
              </h2>
              <span className="text-[12px] text-gray-500 mt-1 font-medium">Project Sequence ID: {projectId} / Modifying Live Record</span>
            </div>

            <button onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-white outline-none transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-[#1c2130]">
            {loadingConfig ? (
              <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm text-[#ccd6f6]">Pulling Project Snapshot & Configurations...</p>
              </div>
            ) : configError ? (
              <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <p className="text-sm text-red-400 text-center bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">{configError}</p>
                <button onClick={fetchAggregatedData} className="px-4 py-2 mt-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition">Retry Request</button>
              </div>
            ) : (
              <form onSubmit={handleFinalSubmit} className="animate-in slide-in-from-bottom-4 duration-300">
                <input type="hidden" name="x_project_id" value={projectId} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 min-h-[500px]">

                  {/* Column 1: Site Properties */}
                  <div className="flex flex-col">
                    <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">Site Properties</h3>

                    <FormRow label="Site Address" helpText="Address of your site">
                      <input type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'siteAddress' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-emerald-500'}`} autoComplete="off" />
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
                        <input type="text" readOnly value={siteCoordinates} placeholder="Click to edit Map Location" className="w-full bg-[#eee0e0] cursor-pointer text-emerald-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </FormRow>

                    <FormRow label="Define Geofence" helpText="GPS Geofence to monitor activity" alignTop>
                      <div className={`w-full flex flex-col items-end ${errorField === 'geofenceData' ? 'ring-2 ring-red-500 rounded-sm' : ''}`}>
                        <textarea
                          readOnly
                          value={geofenceData}
                          className="w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm p-2.5 h-20 focus:outline-none mb-1.5 resize-none font-mono"
                        />
                        <span onClick={() => setActiveSubModal('Geofence')} className="text-emerald-400 font-medium text-[13px] cursor-pointer hover:underline">Revise Geofence</span>
                      </div>
                    </FormRow>

                    <FormRow label="Start Date" helpText="Date of commencement of construction">
                      <input type="date" value={startDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setStartDate(e.target.value)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none cursor-pointer ${errorField === 'startDate' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-emerald-500'}`} />
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
                        <input type="text" readOnly value={stagesCsv} placeholder="Click to adjust Stages" className="w-full bg-[#eee0e0] cursor-pointer text-emerald-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </FormRow>

                    <FormRow label="Current Stage" helpText="Automatically calculated based on stage progression">
                      <input type="text" readOnly value={currentStage} className="w-full bg-[#7d828f] border-none text-white text-[13px] font-medium rounded-sm px-2.5 h-8 cursor-not-allowed opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" />
                    </FormRow>
                  </div>


                  {/* Column 2: HR Management */}
                  <div className="flex flex-col">
                    <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">HR Management</h3>

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
                    <h3 className="text-[#8cd1ff] font-medium text-[15px] mb-6 tracking-wide border-b border-gray-700/50 pb-2">Site Financials</h3>

                    <FormRow label="Allocated Budget" helpText="Maximum Budget in Rupees allocated for this project, in rupees">
                      <input type="text" value={allocatedBudget} onChange={(e) => handleDecimalInput(e.target.value, setAllocatedBudget)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'allocatedBudget' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-emerald-500'}`} autoComplete="off" />
                    </FormRow>

                    <FormRow label="Budget Trigger" helpText="A notification will be sent to you when this project consumes this amount of financial value of your budget, in rupees">
                      <input type="text" value={budgetTrigger} onChange={(e) => handleDecimalInput(e.target.value, setBudgetTrigger)} className={`w-full bg-[#eee0e0] border-none text-gray-900 text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none ${errorField === 'budgetTrigger' ? 'ring-2 ring-red-500 bg-red-100' : 'focus:ring-2 focus:ring-emerald-500'}`} autoComplete="off" />
                    </FormRow>

                    <FormRow label="Define Expenses" helpText="Define how much you have already spent on this project, in rupees">
                      <div className="w-full cursor-pointer" onClick={() => setActiveSubModal('Expenses')}>
                        <input type="text" readOnly value={`Rs. ${initialTotalExpense}`} placeholder="Click to adjust Expenses" className="w-full bg-[#eee0e0] cursor-pointer text-emerald-600 border-none text-[13px] font-medium rounded-sm px-2.5 h-8 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </FormRow>

                    <FormRow label="Initial Expenses" helpText="This will automatically be set when you define your inital expenses on this project, in rupees">
                      <input type="text" readOnly value={`₹ ${initialTotalExpense}`} className="w-full bg-[#7d828f] border-none text-white font-bold text-[13px] rounded-sm px-2.5 h-8 cursor-not-allowed opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" />
                    </FormRow>

                    {/* Submit Button */}
                    <div className="absolute bottom-4 right-0 mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingDetails}
                        className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-semibold rounded-md shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 min-w-[170px]"
                      >
                        {savingDetails ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Update Project</>}
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            )}
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
                  setSiteCoordinates(`${coords.lat},${coords.lng}`);
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
                 initialExpensesJson={expensesJson}
                 configHeads={configData?.budget_heads_array || []}
                 onConfirm={(total, cfgJson, updatedHeads) => {
                   setInitialTotalExpense(total);
                   setExpensesJson(cfgJson);
                   if (configData) setConfigData({ ...configData, budget_heads_array: updatedHeads });
                   setActiveSubModal(null);
                 }}
                 onCancel={() => setActiveSubModal(null)}
               />
            ) : null}
          </div>
        )}

        {/* Exit Confirm Context Overlay */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1c2130] border border-gray-700 rounded-xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
               <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
                 <X className="w-6 h-6 text-red-400" />
               </div>
               <h3 className="text-white text-lg font-semibold mb-2 tracking-wide">Cancel Edits?</h3>
               <p className="text-gray-400 text-sm mb-6 leading-relaxed">Do you want to discard your edits and exit without updating the project details?</p>
               <div className="flex gap-3 w-full">
                  <button onClick={() => setShowExitConfirm(false)} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700">No, Keep Editing</button>
                  <button onClick={() => { setShowExitConfirm(false); onClose(); }} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors border border-transparent shadow-lg shadow-red-900/20">Yes, Exit</button>
               </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
