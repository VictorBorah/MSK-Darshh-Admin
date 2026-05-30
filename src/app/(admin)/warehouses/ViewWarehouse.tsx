'use client';

import { X, Loader2, Warehouse, MapPin, Phone, User, Landmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import WarningAlertModal from '@/components/WarningAlertModal';

interface ViewWarehouseProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string | null;
  fallbackData?: any;
  onSuccess?: () => void;
}

export default function ViewWarehouse({ isOpen, onClose, warehouseId, fallbackData, onSuccess }: ViewWarehouseProps) {
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (fallbackData) {
        setWarehouseData(fallbackData);
      } else if (warehouseId) {
        const fetchWarehouse = async () => {
          setIsFetching(true);
          setWarehouseData(null);
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
              setWarehouseData(response.warehouse_data);
            } else {
              throw new Error(response?.Message || 'API error');
            }
          } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Error fetching warehouse data', { id: 'view-wh-toast' });
          } finally {
            setIsFetching(false);
          }
        };
        fetchWarehouse();
      }
    }
  }, [isOpen, warehouseId, fallbackData]);

  const handleSetDefault = () => {
    if (!warehouseId && !warehouseData?.id) {
      toast.error('No warehouse selected', { id: 'wh-default-toast' });
      return;
    }
    setIsWarningOpen(true);
  };

  const executeSetDefault = async () => {
    const id = warehouseData?.id || warehouseId;
    if (!id) {
      toast.error('No warehouse selected', { id: 'wh-default-toast' });
      return;
    }

    setIsSettingDefault(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zlabz.space/webservices/v1/';
      const endpoint = `${baseUrl}admin/setDefaultWarehouse`;

      const formData = new FormData();
      formData.append('warehouse_id', String(id));

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
        throw new Error('Invalid JSON response');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Set as default warehouse successfully', { id: 'wh-default-toast' });
        setIsWarningOpen(false);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to set default warehouse', { id: 'wh-default-toast' });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error setting default warehouse', { id: 'wh-default-toast' });
    } finally {
      setIsSettingDefault(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-3xl p-0 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-400" /> View Warehouse Profile
              </h2>
              {warehouseData && (
                <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-mono">
                  SYSTEM ID: {warehouseData.id}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[400px] scrollbar-thin">
            {isFetching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm tracking-wide">Fetching detailed warehouse...</p>
              </div>
            ) : warehouseData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Warehouse Name</label>
                    <div className="text-[15px] font-bold text-white bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-gray-500 shrink-0" />
                      {warehouseData.warehouse_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Store Keeper</label>
                    <div className="text-[13px] font-semibold text-gray-300 bg-[#11141e] px-3.5 py-2.5 rounded-md border border-gray-700/50 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500 shrink-0" />
                      {warehouseData.store_keeper_name || <span className="text-gray-600 italic">Not Assigned</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Keeper Mobile</label>
                    <div className="text-[13px] font-mono text-gray-300 bg-[#11141e] px-3.5 py-2.5 rounded-md border border-gray-700/50 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      {warehouseData.warehouse_mobile || <span className="text-gray-600 italic">Not Provided</span>}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Physical Address</label>
                    <div className="text-[13.5px] font-medium text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 min-h-[124px] flex gap-2 items-start">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap leading-relaxed">
                        {warehouseData.warehouse_address || <span className="text-gray-600 italic">No permanent address assigned for this warehouse facility.</span>}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Is Default</label>
                      <div className="bg-[#11141e] px-3.5 py-2.5 rounded-md border border-gray-700/50 flex items-center gap-1.5 w-full">
                        <Landmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className={`text-[12px] font-extrabold tracking-wide uppercase ${String(warehouseData.default_warehouse).toLowerCase() === 'yes' ? 'text-blue-400' : 'text-gray-400'}`}>
                          {warehouseData.default_warehouse || 'No'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status Indicator</label>
                      <div className="bg-[#11141e] px-3.5 py-2.5 rounded-md border border-gray-700/50 w-full flex items-center justify-center">
                        {String(warehouseData.active) === '1' || String(warehouseData.active).toLowerCase() === 'yes' ? (
                          <span className="text-emerald-400 text-[12px] font-bold tracking-wide flex items-center gap-2 uppercase">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-red-400 text-[12px] font-bold tracking-wide flex items-center gap-2 uppercase">
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            DISABLED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <p>Requested warehouse details could not be loaded.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-between items-center">
            <button
              onClick={handleSetDefault}
              type="button"
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-md transition-colors cursor-pointer uppercase tracking-wider"
            >
              Set Default Warehouse
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-transparent rounded-md transition-colors shadow-sm cursor-pointer font-bold"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      <WarningAlertModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="Set Default Warehouse"
        content="Set this as default warehouse?"
        onConfirm={executeSetDefault}
        isLoading={isSettingDefault}
      />
    </>
  );
}
