import { useState, useEffect } from 'react';
import { X, Loader2, Maximize2, Minimize2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const handleSave = () => {
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

    onSave({
      ...expense,
      unit_price: rateVal.toFixed(2),
      qnty: qtyVal.toString(),
      payment_mode: paymentMode,
      payment_mode_txt: matchedPaymentModeText,
      total_amount: totalAmount
    });
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
          <h2 className="text-[15px] font-bold text-white tracking-wide uppercase flex items-center gap-2">
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
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-[#1b202c] border border-gray-600 rounded px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="">Select Payment Mode</option>
              {paymentModes?.map((mode: any) => (
                <option key={mode.id} value={String(mode.id)}>
                  {mode.mode}
                </option>
              ))}
            </select>
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
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
