import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';
import WarningAlertModal from '@/components/WarningAlertModal';

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string | null;
  onSuccess?: () => void;
}

export default function EditVendorModal({ isOpen, onClose, vendorId, onSuccess }: EditVendorModalProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  useModalEscape(isOpen, () => setShowExitConfirm(true), 200);

  const [vendorName, setVendorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!vendorId) {
        setVendorName('');
        setMobileNumber('');
        setAddress('');
        setGstNumber('');
        setEmail('');
      } else {
        const fetchVendorDetails = async () => {
          setIsFetching(true);
          try {
            const token = localStorage.getItem('at_ki8Xq1iV');
            const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getVendorDetails?vendor_id=${vendorId}`;
            const res = await fetch(endpoint, {
               method: 'GET',
               headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const response = Array.isArray(data) ? data[0] : data;
            
            if (String(response.Status) === "1" && response.vendor_data) {
               setVendorName(response.vendor_data.vendor_name || '');
               setMobileNumber(response.vendor_data.vendor_mobile || '');
               setAddress(response.vendor_data.vendor_address || '');
               setGstNumber(response.vendor_data.vendor_gst || '');
               setEmail(response.vendor_data.vendor_email || '');
            } else {
               toast.error(response.Message || 'Failed to fetch vendor details for editing');
               onClose();
            }
          } catch (e) {
             console.error(e);
             toast.error('Network Error fetching vendor data');
             onClose();
          } finally {
             setIsFetching(false);
          }
        };
        fetchVendorDetails();
      }
    }
  }, [isOpen, vendorId, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast.error('Vendor Name is mandatory');
      return;
    }
    if (!mobileNumber.trim()) {
      toast.error('Mobile Number is mandatory');
      return;
    }

    if (mobileNumber.trim().length !== 10) {
      toast.error('Mobile Number must be exactly 10 digits');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      
      let endpoint = '';

      if (vendorId) {
        payload.append('ids_csv', vendorId);
        payload.append('vendor_name', vendorName);
        payload.append('vendor_mobile', mobileNumber);
        if (address) payload.append('vendor_address', address);
        if (gstNumber) payload.append('vendor_gst', gstNumber);
        if (email) payload.append('vendor_email', email);
        endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/patchVendorInfo`;
      } else {
        payload.append('vendor_name', vendorName);
        payload.append('vendor_mobile', mobileNumber);
        if (address) payload.append('vendor_address', address);
        if (gstNumber) payload.append('vendor_gst', gstNumber);
        if (email) payload.append('vendor_email', email);
        endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}admin/addVendor`;
      }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });

      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1" || response.Status === 1) {
        toast.success(response.Message || response.message || (vendorId ? 'Vendor Updated' : 'Vendor Added'));
        if (onSuccess) onSuccess();
        onClose();
      } else if (String(response.Status) === "0" || response.Status === 0) {
        toast.error(response.Message || response.message || 'Action failed');
      } else {
        toast.error(response?.Message || response?.message || 'Unexpected response from server');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error communicating with endpoint.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <WarningAlertModal 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard Vendor Details?"
        content="Are you sure you want to exit without saving? All progress will be lost."
        onConfirm={() => {
           setShowExitConfirm(false);
           onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
          
          <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {vendorId ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <button 
              onClick={() => setShowExitConfirm(true)} 
              disabled={isSaving}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-1 relative">
            {isFetching && (
              <div className="absolute inset-0 z-10 bg-[#1f2536]/80 backdrop-blur-sm flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm tracking-wide">Loading vendor data...</p>
              </div>
            )}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-700">
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  autoFocus
                  placeholder="Enter vendor name"
                  className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isSaving || isFetching}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    disabled={isSaving || isFetching}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    disabled={isSaving || isFetching}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  GST Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST number"
                  className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase"
                  disabled={isSaving || isFetching}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter physical address"
                  rows={3}
                  className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  disabled={isSaving || isFetching}
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                disabled={isSaving}
                className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {vendorId ? 'Update Vendor' : 'Add Vendor'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}
