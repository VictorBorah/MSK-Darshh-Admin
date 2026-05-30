'use client';

import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface EditWarehouseProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string | null;
  fallbackData?: any;
  onSuccess: () => void;
}

export default function EditWarehouse({ isOpen, onClose, warehouseId, fallbackData, onSuccess }: EditWarehouseProps) {
  const [warehouseName, setWarehouseName] = useState('');
  const [storeKeeper, setStoreKeeper] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [statusToggle, setStatusToggle] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!warehouseId) {
        setWarehouseName('');
        setStoreKeeper('');
        setMobile('');
        setAddress('');
        setStatusToggle(true);
      } else if (fallbackData) {
        setWarehouseName(fallbackData.warehouse_name || '');
        setStoreKeeper(fallbackData.store_keeper_name || '');
        setMobile(fallbackData.warehouse_mobile || '');
        setAddress(fallbackData.warehouse_address || '');
        setStatusToggle(
          String(fallbackData.active) === '1' || 
          String(fallbackData.active).toLowerCase() === 'yes'
        );
      } else {
        // Fallback fetch if not provided in row list
        const fetchWarehouse = async () => {
          setIsFetching(true);
          try {
            const token = localStorage.getItem('at_ki8Xq1iV');
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
            const endpoint = `${baseUrl}admin/fetchWarehouseDetails?warehouse_id=${warehouseId}`;
            
            const res = await fetch(endpoint, {
               method: 'GET',
               headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
              throw new Error(`Server connection error (HTTP ${res.status})`);
            }
            
            const rawText = await res.text();
            let arr;
            try {
              arr = JSON.parse(rawText);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
            const response = Array.isArray(arr) ? arr[0] : arr;
            
            if (response && (String(response.Status) === "1" || response.Status === 1) && response.warehouse_data) {
               const wh = response.warehouse_data;
               setWarehouseName(wh.warehouse_name || '');
               setStoreKeeper(wh.store_keeper_name || '');
               setMobile(wh.warehouse_mobile || '');
               setAddress(wh.warehouse_address || '');
               setStatusToggle(String(wh.active) === '1');
            } else {
               throw new Error(response?.Message || 'API error');
            }
          } catch (e: any) {
             console.error(e);
             toast.error(e.message || 'Error fetching warehouse data', { id: 'edit-wh-toast' });
          } finally {
             setIsFetching(false);
          }
        };
        fetchWarehouse();
      }
    }
  }, [isOpen, warehouseId, fallbackData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName.trim()) {
      toast.error('Warehouse Name is mandatory');
      return;
    }

    if (mobile && !/^\d{10}$/.test(mobile)) {
      toast.error('Store Keeper Mobile must be a valid 10-digit number');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const endpoint = `${baseUrl}admin/patchWarehouse`;

      const formData = new FormData();
      formData.append('ids_csv', String(warehouseId));
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
        throw new Error('Invalid JSON received from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Warehouse updated successfully', { id: 'edit-wh-toast' });
        onSuccess();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to update warehouse', { id: 'edit-wh-toast' });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error saving warehouse configurations', { id: 'edit-wh-toast' });
    } finally {
      setIsSaving(false);
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
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-3xl p-0 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Edit Warehouse Configurations
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1">
          <div className="p-6 space-y-5">
            {isFetching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                 <p className="text-sm tracking-wide">Fetching detailed warehouse...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Warehouse Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={warehouseName}
                      onChange={(e) => setWarehouseName(e.target.value)}
                      placeholder="Enter warehouse name"
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-semibold"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Store Keeper Name
                    </label>
                    <input
                      type="text"
                      value={storeKeeper}
                      onChange={(e) => setStoreKeeper(e.target.value)}
                      placeholder="Enter store keeper name"
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-medium text-[#cbd5e1]"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Store Keeper Mobile
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Enter 10-digit mobile"
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono tracking-wide"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter physical address location"
                      rows={5}
                      maxLength={200}
                      className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-medium text-[#cbd5e1] h-[124px]"
                      disabled={isSaving}
                    />
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className={`font-semibold ${address.length >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
                        Remaining characters: {200 - address.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border border-gray-700 p-3 rounded-md bg-[#161a25]/50">
                    <span className="text-[13px] font-medium text-gray-400 uppercase tracking-wide">Active Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={statusToggle}
                        onChange={(e) => setStatusToggle(e.target.checked)}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFetching}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 gap-2 cursor-pointer font-bold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Configurations
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
