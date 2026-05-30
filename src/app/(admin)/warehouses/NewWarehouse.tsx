'use client';

import { X, Loader2, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface NewWarehouseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewWarehouse({ isOpen, onClose, onSuccess }: NewWarehouseProps) {
  // Wizard Step: 1 = Name Creation, 2 = Detail Configuration
  const [step, setStep] = useState<1 | 2>(1);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);

  // Form Inputs State
  const [warehouseName, setWarehouseName] = useState('');
  const [storeKeeper, setStoreKeeper] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [statusToggle, setStatusToggle] = useState(true);

  // Loading States
  const [isSubmittingStep1, setIsSubmittingStep1] = useState(false);
  const [isSubmittingStep2, setIsSubmittingStep2] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setWarehouseId(null);
      setWarehouseName('');
      setStoreKeeper('');
      setMobile('');
      setAddress('');
      setStatusToggle(true);
    }
  }, [isOpen]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName.trim()) {
      toast.error('Warehouse Name is mandatory');
      return;
    }

    setIsSubmittingStep1(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const endpoint = `${baseUrl}admin/addWarehouse`;

      const formData = new FormData();
      formData.append('warehouse_name', warehouseName.trim());

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server connection error (HTTP ${res.status})`);
      }

      const rawText = await res.text();
      let arr;
      try {
        arr = JSON.parse(rawText);
      } catch (err) {
        throw new Error('Invalid JSON response from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Warehouse Added Successfully', { id: 'new-wh-toast' });
        if (data.warehouse_id) {
          setWarehouseId(String(data.warehouse_id));
          setStep(2);
        } else {
          throw new Error('Server did not return a valid warehouse ID');
        }
      } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
        toast.error(data.Message || 'Failed to add warehouse name', { id: 'new-wh-toast' });
      } else {
        throw new Error(data?.Message || 'Unknown response structure');
      }
    } catch (error: any) {
      console.error('Step 1 Submission Error:', error);
      toast.error(error.message || 'Error creating warehouse', { id: 'new-wh-toast' });
    } finally {
      setIsSubmittingStep1(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error('Invalid Warehouse ID. Please restart the process.');
      return;
    }

    // Validation
    if (mobile && !/^\d{10}$/.test(mobile)) {
      toast.error('Store Keeper Mobile must be a valid 10-digit number');
      return;
    }

    setIsSubmittingStep2(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const endpoint = `${baseUrl}admin/patchWarehouse`;

      const formData = new FormData();
      formData.append('ids_csv', warehouseId);
      formData.append('warehouse_name', warehouseName.trim());
      formData.append('store_keeper', storeKeeper.trim());
      formData.append('mobile', mobile.trim());
      formData.append('address', address.trim());
      formData.append('warehouse_status', statusToggle ? '1' : '0');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server connection error (HTTP ${res.status})`);
      }

      const rawText = await res.text();
      let arr;
      try {
        arr = JSON.parse(rawText);
      } catch (err) {
        throw new Error('Invalid JSON response from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Warehouse details updated successfully', { id: 'new-wh-toast' });
        onSuccess();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to configure warehouse details', { id: 'new-wh-toast' });
      }
    } catch (error: any) {
      console.error('Step 2 Submission Error:', error);
      toast.error(error.message || 'Error updating warehouse configurations', { id: 'new-wh-toast' });
    } finally {
      setIsSubmittingStep2(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Numbers only
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full p-0 overflow-hidden flex flex-col transition-all duration-300 ${step === 2 ? 'max-w-3xl' : 'max-w-lg'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">New Warehouse Registration</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${step === 1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'}`}>
                Step {step} of 2: {step === 1 ? 'Initialization' : 'Configuration'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmittingStep1 || isSubmittingStep2}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="flex flex-col flex-1">
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  autoFocus
                  placeholder="Warehouse name (e.g. Pabhoi Warehouse)"
                  className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-semibold"
                  disabled={isSubmittingStep1}
                />

              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmittingStep1}
                className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingStep1}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center min-w-[125px] disabled:opacity-50 gap-2 cursor-pointer font-bold"
              >
                {isSubmittingStep1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Initialize <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="flex flex-col flex-1">
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin">

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300 font-medium">
                  Initialized with ID: <span className="font-mono font-bold bg-[#11141e] px-1.5 py-0.5 rounded text-white">{warehouseId}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
                      Warehouse Name
                    </label>
                    <input
                      type="text"
                      value={warehouseName}
                      readOnly
                      disabled
                      className="w-full bg-[#11141e]/50 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-500 outline-none cursor-not-allowed font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Store Keeper Name
                    </label>
                    <input
                      type="text"
                      value={storeKeeper}
                      onChange={(e) => setStoreKeeper(e.target.value)}
                      placeholder="Enter keeper name"
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-medium text-[#cbd5e1]"
                      disabled={isSubmittingStep2}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Store Keeper Mobile
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono tracking-wide"
                      disabled={isSubmittingStep2}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter warehouse physical location address"
                      rows={5}
                      maxLength={200}
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-medium text-[#cbd5e1] h-[124px]"
                      disabled={isSubmittingStep2}
                    />
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className={`font-semibold ${address.length >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
                        Remaining: {200 - address.length} / 200 chars
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border border-gray-700 p-3 rounded-md bg-[#161a25]/50">
                    <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wide">Default Active Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={statusToggle}
                        onChange={(e) => setStatusToggle(e.target.checked)}
                        disabled={isSubmittingStep2}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50 font-bold"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmittingStep2}
                className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmittingStep2}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center justify-center min-w-[125px] disabled:opacity-50 gap-2 cursor-pointer font-bold"
              >
                {isSubmittingStep2 ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Details'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
