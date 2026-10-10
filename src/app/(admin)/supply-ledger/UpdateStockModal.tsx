'use client';

import { useState, useEffect } from 'react';
import { X, Edit3, Loader2, ArrowDownLeft, ArrowUpRight, Boxes, Warehouse, Layers } from 'lucide-react';
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

interface UpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRow | null;
  projectName?: string;
  warehouseName?: string;
  onSuccess: () => void;
}

export default function UpdateStockModal({
  isOpen,
  onClose,
  stock,
  projectName = '',
  warehouseName = '',
  onSuccess
}: UpdateStockModalProps) {
  useModalEscape(isOpen, onClose, 200);

  const [actionType, setActionType] = useState<'in' | 'out'>('in');
  const [qnty, setQnty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when modal opens with a new stock item
  useEffect(() => {
    if (isOpen) {
      setActionType('in');
      setQnty('');
      setIsSubmitting(false);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const currentStockNum = parseFloat(stock.current_stock || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qntyNum = parseInt(qnty, 10);
    if (!qnty || isNaN(qntyNum) || qntyNum <= 0) {
      toast.error('Please enter a valid quantity greater than zero');
      return;
    }

    if (actionType === 'out' && qntyNum > currentStockNum) {
      toast.error(
        `Insufficient stock: Cannot remove ${qntyNum} ${stock.unit_name || 'units'} (Current stock is ${currentStockNum})`
      );
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Updating warehouse stock...');

    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zynapi.xlabz.space/webservices/v1/';

      const formData = new FormData();
      formData.append('project_id', String(stock.project_id));
      formData.append('warehouse_id', String(stock.warehouse_id));
      formData.append('item_id', String(stock.item_id));
      formData.append('qnty', String(qntyNum));
      formData.append('type', actionType);

      const res = await fetch(`${baseUrl}app/updateWarehouseStock`, {
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
        toast.success(data.Message || 'Warehouse stock updated successfully', { id: toastId });
        onClose();
        onSuccess();
      } else {
        toast.error(data?.Message || 'Failed to update warehouse stock', { id: toastId });
      }
    } catch (err: any) {
      console.error('Update Warehouse Stock Error:', err);
      toast.error(err.message || 'An error occurred while updating stock', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-[#141a28] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex justify-between items-center bg-[#182032]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Update Warehouse Stock</h2>
              <p className="text-xs text-gray-400">Adjust stock levels in warehouse supply ledger</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Description Box */}
          <div className="bg-[#0e1320] border border-gray-800/90 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
            <div className="flex items-start justify-between gap-2 border-b border-gray-800/60 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Boxes className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Name:</span>
                <span className="text-sm font-bold text-white truncate" title={stock.item_name}>
                  {stock.item_name}
                </span>
              </div>

              {stock.unit_name && (
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded shrink-0">
                  Unit: {stock.unit_name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Warehouse className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="text-gray-400">Warehouse:</span>
                <span className="font-semibold text-gray-200 truncate" title={warehouseName}>
                  {warehouseName || `Warehouse #${stock.warehouse_id}`}
                </span>
              </div>

              {projectName && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-gray-400">Project:</span>
                  <span className="font-semibold text-gray-200 truncate">{projectName}</span>
                </div>
              )}
            </div>

            {/* Current Stock Banner */}
            <div className="mt-1 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Current Stock on Hand:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {stock.current_stock} {stock.unit_name || ''}
              </span>
            </div>
          </div>

          {/* Form Element 1: Action (Select [In/Out]) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Action:</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('in')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  actionType === 'in'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-[#0e1320] border-gray-700/70 text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Stock IN (Receive)</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('out')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  actionType === 'out'
                    ? 'bg-rose-500/15 border-rose-500/60 text-rose-300 ring-2 ring-rose-500/30'
                    : 'bg-[#0e1320] border-gray-700/70 text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Stock OUT (Dispatch)</span>
              </button>
            </div>
          </div>

          {/* Form Element 2: New Qnty Input Box */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="adjust-qnty-input" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                New Qnty:
              </label>
              <span className="text-[11px] text-gray-500">Amount of quantity to adjust</span>
            </div>

            <div className="relative">
              <input
                id="adjust-qnty-input"
                type="number"
                min="1"
                step="1"
                required
                value={qnty}
                onChange={(e) => setQnty(e.target.value)}
                placeholder="Enter quantity to adjust..."
                disabled={isSubmitting}
                className="w-full bg-[#0e1320] border border-gray-700 rounded-xl pl-4 pr-14 py-2.5 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {stock.unit_name && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none bg-[#141a28] px-1 rounded">
                  {stock.unit_name}
                </span>
              )}
            </div>

            {/* Calculated Preview */}
            {qnty && !isNaN(parseInt(qnty, 10)) && parseInt(qnty, 10) > 0 && (
              <div className="text-[11.5px] text-gray-400 flex items-center justify-between px-1 mt-0.5">
                <span>Calculated New Closing Stock:</span>
                <span
                  className={`font-mono font-bold ${
                    actionType === 'out' && parseInt(qnty, 10) > currentStockNum
                      ? 'text-rose-400'
                      : 'text-blue-300'
                  }`}
                >
                  {actionType === 'in'
                    ? currentStockNum + parseInt(qnty, 10)
                    : currentStockNum - parseInt(qnty, 10)}{' '}
                  {stock.unit_name || ''}
                </span>
              </div>
            )}
          </div>

          {/* Modal Footer / Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/80 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#0e1320] hover:bg-gray-800/60 border border-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !qnty}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-emerald-600/50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all duration-150"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating Stock...
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
