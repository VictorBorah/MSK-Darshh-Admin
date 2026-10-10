'use client';

import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import {
  X,
  ArrowRightLeft,
  Warehouse,
  Boxes,
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';

interface StockRow {
  stock_id: string;
  project_id: string;
  warehouse_id: string;
  item_id: string;
  item_name: string;
  unit_id?: string;
  unit_name?: string;
  current_stock: string;
  low_level: string;
}

interface ProjectOption {
  project_id?: string;
  id?: string;
  project_name: string;
  project_code: string;
}

interface WarehouseOption {
  id: string;
  warehouse_name: string;
  default_warehouse?: string;
}

interface ItemOption {
  id: string;
  item_name: string;
}

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRow | null;
  projectsList: ProjectOption[];
  warehousesList: WarehouseOption[];
  itemsList: ItemOption[];
  onSuccess: () => void;
}

export default function TransferStockModal({
  isOpen,
  onClose,
  stock,
  projectsList,
  warehousesList,
  itemsList,
  onSuccess
}: TransferStockModalProps) {
  useModalEscape(isOpen, onClose, 210);

  // Form State
  const [destWarehouse, setDestWarehouse] = useState<{ value: string; label: string } | null>(null);
  const [destProject, setDestProject] = useState<{ value: string; label: string } | null>(null);
  const [qnty, setQnty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick lookup maps
  const projectsMap = useMemo(() => {
    const map = new Map<string, ProjectOption>();
    projectsList.forEach((p) => {
      const id = String(p.project_id || p.id);
      map.set(id, p);
    });
    return map;
  }, [projectsList]);

  const warehousesMap = useMemo(() => {
    const map = new Map<string, WarehouseOption>();
    warehousesList.forEach((w) => {
      map.set(String(w.id), w);
    });
    return map;
  }, [warehousesList]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDestWarehouse(null);
      setDestProject(null);
      setQnty('');
      setIsSubmitting(false);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const currentStockNum = Math.max(0, parseInt(stock.current_stock || '0', 10));
  const isZeroStock = currentStockNum <= 0;

  // Source labels
  const sourceProjObj = projectsMap.get(String(stock.project_id));
  const sourceProjectLabel = sourceProjObj
    ? sourceProjObj.project_code
      ? `${sourceProjObj.project_code} - ${sourceProjObj.project_name}`
      : sourceProjObj.project_name
    : `Project #${stock.project_id}`;

  const sourceWhObj = warehousesMap.get(String(stock.warehouse_id));
  const sourceWarehouseLabel = sourceWhObj ? sourceWhObj.warehouse_name : `Warehouse #${stock.warehouse_id}`;

  // Check if destination is identical to source
  const isDestinationSameAsSource =
    destWarehouse !== null &&
    destProject !== null &&
    String(destWarehouse.value) === String(stock.warehouse_id) &&
    String(destProject.value) === String(stock.project_id);

  // Quantity calculations
  const parsedQnty = parseInt(qnty, 10);
  const isQntyValidNumber = !isNaN(parsedQnty) && parsedQnty > 0;
  const isOverStock = isQntyValidNumber && parsedQnty > currentStockNum;
  const remainingStock = isQntyValidNumber && !isOverStock ? currentStockNum - parsedQnty : currentStockNum;

  // Handle quantity change with transfer cap
  const handleQntyChange = (val: string) => {
    if (val === '') {
      setQnty('');
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    if (num < 0) {
      setQnty('0');
      return;
    }

    // Transfer cap: if entered quantity exceeds current stock, clamp to current stock and notify
    if (num > currentStockNum) {
      setQnty(String(currentStockNum));
      toast(`Capped to maximum available stock (${currentStockNum} ${stock.unit_name || 'units'})`, {
        icon: '⚠️',
        style: {
          background: '#191e2b',
          color: '#f59e0b',
          border: '1px solid #f59e0b',
          fontSize: '12px'
        }
      });
      return;
    }

    setQnty(String(num));
  };

  const handleSetMaxQnty = () => {
    if (currentStockNum > 0) {
      setQnty(String(currentStockNum));
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isZeroStock) {
      toast.error('Zero stock available in source: Transfer cannot proceed');
      return;
    }

    if (!destWarehouse) {
      toast.error('Please select a destination warehouse');
      return;
    }

    if (!destProject) {
      toast.error('Please select a destination project');
      return;
    }

    if (isDestinationSameAsSource) {
      toast.error('Source and destination warehouse/project cannot be identical');
      return;
    }

    const qntyNum = parseInt(qnty, 10);
    if (!qnty || isNaN(qntyNum) || qntyNum <= 0) {
      toast.error('Please enter a valid transfer quantity greater than zero');
      return;
    }

    if (qntyNum > currentStockNum) {
      toast.error(`Transfer quantity cannot exceed current available stock of ${currentStockNum}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Transferring warehouse stock...');

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zynapi.xlabz.space/webservices/v1/';

      const formData = new FormData();
      formData.append('source_project_id', String(stock.project_id));
      formData.append('source_warehouse_id', String(stock.warehouse_id));
      formData.append('dest_project_id', String(destProject.value));
      formData.append('dest_warehouse_id', String(destWarehouse.value));
      formData.append('item_id', String(stock.item_id));
      formData.append('qnty', String(qntyNum));

      const res = await fetch(`${baseUrl}app/transferWarehouseStock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server connection error (HTTP ${res.status})`);
      }

      const rawText = await res.text();
      const cleanedText = rawText.replace(/[\u0000-\u001f]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });

      let arr;
      try {
        arr = JSON.parse(cleanedText);
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Warehouse stock transferred successfully', { id: toastId });
        onClose();
        onSuccess();
      } else {
        toast.error(data?.Message || 'Failed to transfer warehouse stock', { id: toastId });
      }
    } catch (err: any) {
      console.error('Transfer Warehouse Stock Error:', err);
      toast.error(err.message || 'An error occurred during transfer', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom styling for react-select components matching the dark theme
  const getSelectStyles = (isDisabled = false) => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: isDisabled ? '#0b0f19' : '#0d121c',
      borderColor: isDisabled ? '#1f293d' : '#27324b',
      boxShadow: 'none',
      minHeight: '38px',
      borderRadius: '8px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.8 : 1,
      '&:hover': {
        borderColor: isDisabled ? '#1f293d' : '#3b82f6'
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDisabled ? '#94a3b8' : '#f3f4f6',
      fontSize: '13px',
      fontWeight: '500'
    }),
    placeholder: (base: any) => ({ ...base, color: '#64748b', fontSize: '13px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#141a28',
      border: '1px solid #374151',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#1e293b' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      padding: '8px 12px'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDisabled ? '#475569' : '#9ca3af',
      padding: '0 8px'
    }),
    clearIndicator: (base: any) => ({ ...base, color: '#9ca3af', padding: '0 8px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 10px' }),
    input: (base: any) => ({ ...base, color: '#fff' })
  });

  const isFormValid =
    !isZeroStock &&
    destWarehouse !== null &&
    destProject !== null &&
    !isDestinationSameAsSource &&
    isQntyValidNumber &&
    !isOverStock &&
    !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-[#141a28] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex justify-between items-center bg-[#182032]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Transfer Stock</h2>
              <p className="text-xs text-gray-400">Transfer inventory between warehouses and projects</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Item Banner: Auto-selected and Populated (Disabled) */}
          <div className="bg-[#0e1320] border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Selected Item:
                </span>
              </div>
              {stock.unit_name && (
                <span className="text-[11px] font-semibold text-blue-300 bg-blue-900/30 border border-blue-800/40 px-2 py-0.5 rounded">
                  Unit: {stock.unit_name}
                </span>
              )}
            </div>

            <Select
              options={[
                {
                  value: String(stock.item_id),
                  label: stock.item_name
                }
              ]}
              value={{
                value: String(stock.item_id),
                label: stock.item_name
              }}
              isDisabled={true}
              styles={getSelectStyles(true)}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              isSearchable={false}
            />
          </div>

          {/* Zero Stock Warning if Applicable */}
          {isZeroStock && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Zero Stock Available:</strong> Current stock for this item in the source warehouse is 0{' '}
                {stock.unit_name || 'units'}. Stock transfer cannot be performed.
              </span>
            </div>
          )}

          {/* Two-Column Layout: Source Box & Destination Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SOURCE BOX (Read-Only / Disabled) */}
            <div className="bg-[#0e1320] border border-blue-900/30 rounded-xl p-4 flex flex-col gap-3.5 relative">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Source Location
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-gray-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">
                  Fixed
                </span>
              </div>

              {/* Source Warehouse Select (Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-gray-400">Warehouse</label>
                <Select
                  options={[{ value: String(stock.warehouse_id), label: sourceWarehouseLabel }]}
                  value={{ value: String(stock.warehouse_id), label: sourceWarehouseLabel }}
                  isDisabled={true}
                  styles={getSelectStyles(true)}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  isSearchable={false}
                />
              </div>

              {/* Source Project Select (Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-gray-400">Project</label>
                <Select
                  options={[{ value: String(stock.project_id), label: sourceProjectLabel }]}
                  value={{ value: String(stock.project_id), label: sourceProjectLabel }}
                  isDisabled={true}
                  styles={getSelectStyles(true)}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  isSearchable={false}
                />
              </div>

              {/* Current Available Stock Indicator */}
              <div className="mt-1 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Available Stock:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${isZeroStock
                    ? 'text-rose-400 bg-rose-950/30 border border-rose-900/30'
                    : 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30'
                    }`}
                >
                  {currentStockNum} {stock.unit_name || 'units'}
                </span>
              </div>
            </div>

            {/* DESTINATION BOX (Active Selectors) */}
            <div className="bg-[#0e1320] border border-emerald-900/30 rounded-xl p-4 flex flex-col gap-3.5 relative">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Destination Location
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                  Select
                </span>
              </div>

              {/* Destination Warehouse Searchable Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-gray-300">
                  Destination Warehouse <span className="text-rose-400">*</span>
                </label>
                <Select
                  options={warehousesList.map((w) => ({
                    value: String(w.id),
                    label: w.warehouse_name
                  }))}
                  value={destWarehouse}
                  onChange={(val) => setDestWarehouse(val)}
                  placeholder="Select Warehouse..."
                  styles={getSelectStyles(false)}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  isClearable
                  isSearchable
                  isDisabled={isSubmitting || isZeroStock}
                />
              </div>

              {/* Destination Project Searchable Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-gray-300">
                  Destination Project <span className="text-rose-400">*</span>
                </label>
                <Select
                  options={projectsList.map((p) => ({
                    value: String(p.project_id || p.id),
                    label: p.project_code ? `${p.project_code} - ${p.project_name}` : p.project_name
                  }))}
                  value={destProject}
                  onChange={(val) => setDestProject(val)}
                  placeholder="Select Project..."
                  styles={getSelectStyles(false)}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  isClearable
                  isSearchable
                  isDisabled={isSubmitting || isZeroStock}
                />
              </div>

              {/* Destination Note */}
              <div className="mt-1 pt-2.5 border-t border-gray-800/60 text-[11px] text-gray-400">
                {isDestinationSameAsSource ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Destination cannot match source
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Stock will be credited to this warehouse & project
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Quantity Box */}
          <div className="bg-[#0e1320] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="transfer-qnty" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Quantity to Transfer <span className="text-rose-400">*</span>
              </label>

              <button
                type="button"
                onClick={handleSetMaxQnty}
                disabled={isZeroStock || isSubmitting}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/40 px-2.5 py-0.5 rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Fill maximum available quantity"
              >
                MAX ({currentStockNum})
              </button>
            </div>

            <div className="relative">
              <input
                id="transfer-qnty"
                type="number"
                min="1"
                max={currentStockNum}
                value={qnty}
                onChange={(e) => handleQntyChange(e.target.value)}
                placeholder={`Enter quantity (max ${currentStockNum})...`}
                disabled={isZeroStock || isSubmitting}
                className="w-full bg-[#0d121c] border border-gray-700/80 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {stock.unit_name && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                  {stock.unit_name}
                </span>
              )}
            </div>

            {/* Live calculation balance */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/60">
              <div className="flex items-center gap-1.5">
                <span>Remaining in source after transfer:</span>
                <span
                  className={`font-mono font-bold ${remainingStock === 0 ? 'text-amber-400' : 'text-blue-300'
                    }`}
                >
                  {remainingStock} {stock.unit_name || 'units'}
                </span>
              </div>

              {isOverStock && (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Exceeds available stock
                </span>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isFormValid}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0070f3] hover:bg-blue-600 active:scale-95 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transfer Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
