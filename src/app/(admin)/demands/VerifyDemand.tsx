'use client';

import { X, Maximize2, Minimize2, ClipboardList, Loader2, Check } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useModalEscape } from '@/hooks/useModalEscape';
import toast from 'react-hot-toast';

interface VerifyDemandProps {
  isOpen: boolean;
  onClose: () => void;
  demand: any;
  warehouses: any[];
  onSuccess?: () => void;
  isRecentLoading?: boolean;
}

export default function VerifyDemand({ isOpen, onClose, demand, warehouses, onSuccess, isRecentLoading = false }: VerifyDemandProps) {
  useModalEscape(isOpen, onClose, 200);

  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [stockLevel, setStockLevel] = useState<string>('0');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingStock, setIsFetchingStock] = useState<boolean>(false);
  const [editableQty, setEditableQty] = useState<string>('1');
  const [isUpdatingQty, setIsUpdatingQty] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && demand) {
      setEditableQty(String(demand.quantity || '0'));
    }
  }, [isOpen, demand]);

  const handleUpdateQuantity = async () => {
    const qtyNum = parseFloat(editableQty);
    if (!editableQty || isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    setIsUpdatingQty(true);
    const toastId = toast.loading('Updating quantity...');
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('demand_id', String(demand.demand_id || ''));
      formData.append('qnty', String(qtyNum));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/updateDemand`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to update demand quantity');
      }

      const text = await res.text();
      let arr;
      try {
        arr = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Quantity updated successfully', { id: toastId });
        demand.quantity = String(qtyNum);
        const unitPart = (demand.quantity_txt || '').split(' ').slice(1).join(' ');
        demand.quantity_txt = `${qtyNum} ${unitPart}`;
        onSuccess?.();
      } else {
        toast.error(data?.Message || 'Failed to update quantity', { id: toastId });
      }
    } catch (err: any) {
      console.error('Update Quantity Error:', err);
      toast.error(err.message || 'An error occurred during quantity update', { id: toastId });
    } finally {
      setIsUpdatingQty(false);
    }
  };

  const fetchWarehouseStockLevel = useCallback(async (warehouseId: string) => {
    if (!warehouseId || !demand?.item_id) {
      setStockLevel('0');
      return;
    }
    setIsFetchingStock(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchItemizedWarehouseStock?warehouse_id=${warehouseId}&item_id=${demand.item_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch warehouse stock');
      }

      const arr = await res.json();
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        setStockLevel(String(data.item_count ?? '0'));
      } else {
        setStockLevel('0');
        toast.error(data?.Message || 'Failed to fetch warehouse stock level');
      }
    } catch (err: any) {
      console.error('Fetch stock error:', err);
      setStockLevel('0');
      toast.error(err.message || 'Error fetching warehouse stock');
    } finally {
      setIsFetchingStock(false);
    }
  }, [demand?.item_id]);

  // Pre-select default warehouse if config is loaded
  useEffect(() => {
    if (isOpen && warehouses && warehouses.length > 0) {
      const defaultWh = warehouses.find((w: any) => String(w.default_warehouse).toLowerCase() === 'yes');
      const defaultWhId = defaultWh ? String(defaultWh.id) : (warehouses[0] ? String(warehouses[0].id) : '');
      setSelectedWarehouse(defaultWhId);
      if (defaultWhId) {
        fetchWarehouseStockLevel(defaultWhId);
      }
    } else if (!isOpen) {
      setSelectedWarehouse('');
      setStockLevel('0');
    }
  }, [isOpen, warehouses, fetchWarehouseStockLevel]);

  if (!isOpen || !demand) return null;

  const handleVerify = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Verifying demand...');
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('demand_id', String(demand.demand_id || ''));
      formData.append('comment', comment);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/verifyDemand`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to submit verification');
      }

      const text = await res.text();
      let arr;
      try {
        arr = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Demand verified successfully', { id: toastId });
        onSuccess?.();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to verify demand', { id: toastId });
      }
    } catch (err: any) {
      console.error('Verify Demand Error:', err);
      toast.error(err.message || 'An error occurred during verification', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 200 - comment.length;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`bg-[#1f2536] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[560px] max-w-[95vw]'
          }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161a25] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-bold text-white tracking-wide">
              Verify Demand
            </h2>
            {demand.project_code && (
              <span className="text-[13.5px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                {demand.project_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
              title={isMaximized ? "Restore Size" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-[#161a25] overflow-y-auto max-h-[80vh] flex-1 flex flex-col gap-5">

          {/* Peach Banner showing demand details */}
          <div className="bg-[#ffe8c6] border border-amber-500/20 text-[#6d4c1f] rounded-lg p-4 flex items-center gap-3 shadow-md shrink-0">
            <div className="bg-amber-100 p-2 rounded-md shadow-sm shrink-0">
              <ClipboardList className="w-6 h-6 text-[#a16207]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold truncate leading-snug">
                {demand.auto_title || `Demand for ${demand.item_name}`}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] text-[#854d0e] font-semibold">Quantity:</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={editableQty}
                  onChange={(e) => setEditableQty(e.target.value)}
                  disabled={isSubmitting || isUpdatingQty || demand.is_verified === 'Yes'}
                  className="w-20 bg-amber-50 text-[#6d4c1f] border border-amber-300 rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleUpdateQuantity}
                  disabled={isSubmitting || isUpdatingQty || demand.is_verified === 'Yes'}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-amber-700 hover:bg-amber-800 disabled:bg-amber-700/50 disabled:cursor-not-allowed rounded shadow transition-colors flex items-center gap-1 shrink-0"
                >
                  {isUpdatingQty && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  Update Quantity
                </button>
              </div>
            </div>
          </div>

          {/* Demand raised By section */}
          {demand.raised_by_staff_name && (
            <div className="flex flex-col gap-0.5 bg-[#1f2536] border border-gray-700/60 p-3 rounded-lg shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Demand raised By
              </span>
              <span className="text-[13px] text-white font-semibold">
                {demand.raised_by_staff_name}
                {demand.raised_by_usergroup_name && String(demand.raised_by_usergroup_name) !== 'false'
                  ? ` (${demand.raised_by_usergroup_name})`
                  : ''}
              </span>
            </div>
          )}

          {/* Grid Layout: Check stock Status & Stock Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ROW 1: AT SITE & SITE STOCK LEVEL */}
            {/* AT SITE readonly input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                AT SITE
              </label>
              <input
                type="text"
                readOnly
                value={demand.item_name || ''}
                className="w-full bg-[#1f2536] text-gray-300 border border-gray-600 rounded-lg px-3 py-[9px] text-[13px] focus:outline-none select-none cursor-not-allowed"
              />
            </div>

            {/* SITE STOCK LEVEL readonly input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                SITE STOCK LEVEL
              </label>
              <input
                type="text"
                readOnly
                value={demand.current_stock || '0'}
                className="w-full bg-[#d5f5f6] text-teal-950 border-none font-bold rounded-lg px-3 py-[9px] text-[13px] focus:outline-none select-none cursor-not-allowed shadow-inner"
              />
            </div>

            {/* ROW 2: CHECK WAREHOUSE STOCK & WAREHOUSE STOCK LEVEL */}
            {/* Warehouse select dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                CHECK WAREHOUSE STOCK
              </label>
              <Select
                options={[
                  { value: '', label: 'Select Warehouse' },
                  ...(warehouses?.map((w: any) => ({
                    value: String(w.id),
                    label: w.warehouse_name || ''
                  })) || [])
                ]}
                value={
                  selectedWarehouse
                    ? { value: selectedWarehouse, label: warehouses?.find((w: any) => String(w.id) === selectedWarehouse)?.warehouse_name || 'Selected Warehouse' }
                    : { value: '', label: 'Select Warehouse' }
                }
                onChange={(val: any) => {
                  const whId = val ? val.value : '';
                  setSelectedWarehouse(whId);
                  fetchWarehouseStockLevel(whId);
                }}
                placeholder="Select Warehouse..."
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#1f2536',
                    borderColor: '#4b5563',
                    minHeight: '38px',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#6b7280' }
                  }),
                  menuPortal: base => ({ ...base, zIndex: 99999 }),
                  menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #4b5563', borderRadius: '6px' }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#2d3a6c' : 'transparent',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }),
                  singleValue: base => ({ ...base, color: '#fff', fontSize: '13px' }),
                  input: base => ({ ...base, color: '#fff' })
                }}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
            </div>

            {/* Stock Level Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                WAREHOUSE STOCK LEVEL
              </label>
              <input
                type="text"
                readOnly
                value={isFetchingStock ? 'Fetching...' : stockLevel}
                className="w-full bg-[#d5f5f6] text-teal-950 border-none font-bold rounded-lg px-3 py-[9px] text-[13px] focus:outline-none select-none cursor-not-allowed shadow-inner"
                placeholder="0"
              />
            </div>

          </div>

          {/* Add a Comment Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
              ADD A COMMENT
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="Enter your comment here..."
              rows={4}
              className="w-full bg-[#1f2536] border border-gray-600 rounded-lg px-3.5 py-2.5 text-white text-[13px] block focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans"
            />
            <div className="text-left text-[11px] text-gray-500 mt-0.5">
              Remaining Charcters: {remainingChars}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#161a25] border-t border-gray-700/60 flex items-center justify-end gap-3 shrink-0">
          {demand.is_verified === 'Yes' && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[13px] font-bold mr-auto animate-in fade-in duration-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Already verified</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-bold text-white bg-[#a1470e] hover:bg-[#8f3e0c] active:scale-95 rounded-lg transition-all shadow"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isSubmitting || isUpdatingQty || isRecentLoading || demand.is_verified === 'Yes'}
            title={demand.is_verified === 'Yes' ? 'This demand is already verified' : 'Verify'}
            className="flex items-center gap-2 justify-center px-5 py-2 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Verify
          </button>
        </div>

      </div>
    </div>
  );
}
