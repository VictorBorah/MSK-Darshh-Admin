import { useState, useEffect } from 'react';
import { X, Loader2, Maximize2, Minimize2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface EditAdditionalExpenseProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any; // { expense_id, item_name, unit_price, qnty, payment_mode, total_amount }
  paymentModes: any[];
  onSave: (updatedExpense: any) => void;
}

export default function EditAdditionalExpense({
  isOpen,
  onClose,
  expense,
  paymentModes,
  onSave
}: EditAdditionalExpenseProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [rate, setRate] = useState('');
  const [qnty, setQnty] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-populate values when modal opens or expense changes
  useEffect(() => {
    if (isOpen && expense) {
      setRate(String(expense.unit_price || ''));
      setQnty(String(expense.qnty || ''));
      setPaymentMode(String(expense.payment_mode || ''));
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const parsedRate = parseFloat(rate) || 0;
  const parsedQnty = parseFloat(qnty) || 0;
  const totalAmount = (parsedRate * parsedQnty).toFixed(2);

  const handleSave = async () => {
    const rateVal = parseFloat(rate);
    const qtyVal = parseFloat(qnty);

    if (isNaN(rateVal) || rateVal <= 0 || rate === '') {
      toast.error('Please enter a valid non-zero rate');
      return;
    }
    if (isNaN(qtyVal) || qtyVal <= 0 || qnty === '') {
      toast.error('Please enter a valid non-zero quantity');
      return;
    }
    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    const matchedPaymentModeText = paymentModes.find(m => String(m.id) === String(paymentMode))?.mode || 'N/A';
    const updatedData = {
      ...expense,
      unit_price: rateVal.toFixed(2),
      qnty: qtyVal.toString(),
      payment_mode: paymentMode,
      payment_mode_txt: matchedPaymentModeText,
      total_amount: totalAmount
    };

    // If it's a new unsaved expense, save it locally only
    if (expense.isNew || String(expense.expense_id).startsWith('new_')) {
      onSave(updatedData);
      toast.success("Expense updated locally", {
        style: {
          background: '#10b981',
          color: '#fff',
        }
      });
      return;
    }

    // Call update API
    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('expense_id', String(expense.expense_id));
      formData.append('unit_price', rateVal.toFixed(2));
      formData.append('qnty', qtyVal.toString());
      formData.append('total_amount', totalAmount);
      formData.append('payment_mode', paymentMode);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/updateAdditionalExpenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const rawText = await res.text();
      let responseObj;
      try {
        responseObj = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Invalid JSON response');
      }

      const data = Array.isArray(responseObj) ? responseObj[0] : responseObj;

      if (data && String(data.Status) === '1') {
        toast.success(data.Message || 'Expense Updated', {
          style: {
             background: '#10b981',
             color: '#fff',
          }
        });
        onSave(updatedData);
      } else {
        toast.error(data?.Message || 'Failed to update expense', {
          style: {
             background: '#ef4444',
             color: '#fff',
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to save expense details:', error);
      toast.error('An error occurred while updating the expense', {
        style: {
           background: '#ef4444',
           color: '#fff',
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-[500px] max-w-[95vw] rounded-xl shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[15px] font-bold text-white tracking-wide flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Edit Additional Expense
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Toggle Size"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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

        {/* Content */}
        <div className="p-6 bg-[#161a25] flex flex-col gap-5">
          {/* Item Name (Readonly) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Item Name</label>
            <div className="w-full bg-[#1b202c]/50 border border-gray-700/50 rounded px-3 py-2 text-[13px] text-gray-400 font-medium select-all break-words">
              {expense.item_name || 'N/A'}
            </div>
          </div>

          {/* Rate & Quantity in Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Rate (Unit Price)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1b202c] border border-gray-600 rounded px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={qnty}
                onChange={(e) => setQnty(e.target.value)}
                placeholder="1"
                className="w-full bg-[#1b202c] border border-gray-600 rounded px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Payment Mode</label>
            <Select
              options={paymentModes?.map((mode: any) => ({
                value: String(mode.id),
                label: mode.mode || ''
              })) || []}
              value={
                paymentMode
                  ? { value: paymentMode, label: paymentModes?.find((m: any) => String(m.id) === paymentMode)?.mode || 'Selected Mode' }
                  : null
              }
              onChange={(val: any) => {
                setPaymentMode(val ? val.value : '');
              }}
              placeholder="Select Payment Mode..."
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1b202c',
                  borderColor: '#4b5563',
                  minHeight: '38px',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '13px'
                }),
                menuPortal: base => ({ ...base, zIndex: 99999 }),
                menu: base => ({ ...base, backgroundColor: '#1b202c', border: '1px solid #4b5563', borderRadius: '4px' }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#1f2937' : 'transparent',
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

          {/* Total Box */}
          <div className="flex justify-between items-center bg-[#1b202c] p-4 rounded border border-gray-700/50 mt-1 select-none">
            <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Total Amount</span>
            <span className="text-[16px] text-emerald-400 font-bold">
              ₹ {totalAmount}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
