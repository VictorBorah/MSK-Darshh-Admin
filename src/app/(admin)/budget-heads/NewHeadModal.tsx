import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface NewHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewHeadModal({ isOpen, onClose, onSuccess }: NewHeadModalProps) {
  const [headName, setHeadName] = useState('');
  const [defaultGst, setDefaultGst] = useState('0.00');
  const [hasVendor, setHasVendor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHeadName('');
      setDefaultGst(localStorage.getItem('sys_default_gst') || '0.00');
      setHasVendor(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headName.trim()) {
      toast.error('Budget Head Name is mandatory');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      payload.append('head_name', headName.trim());
      payload.append('default_gst', parseFloat(defaultGst || '0').toFixed(2));
      payload.append('has_vendor', hasVendor ? '1' : '0');

      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveHead`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });

      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
      const response = Array.isArray(arr) ? arr[0] : arr;

      if (response && (String(response.Status) === '1' || response.Status === 1)) {
        toast.success(response.Message || response.message || 'Budget Head successfully created');
        if (onSuccess) onSuccess();
        onClose();
      } else if (response && (String(response.Status) === '0' || response.Status === 0)) {
        toast.error(response.Message || response.message || 'Action failed');
      } else {
        toast.error(response?.Message || response?.message || 'Oops, something went wrong!');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Network error communicating with endpoint.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Add New Budget Head
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1">
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Budget Head Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                autoFocus
                placeholder="Enter budget head name"
                className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={isSaving}
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Default GST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={defaultGst}
                onChange={(e) => setDefaultGst(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#11141e] border border-gray-700 rounded-md px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between border border-gray-700 p-3 rounded-md">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-gray-300 uppercase tracking-wide">Process Vendor</span>
                <span className="text-[11px] text-gray-500">Enable if this budget head expects vendor association</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={hasVendor}
                  onChange={(e) => setHasVendor(e.target.checked)}
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
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
              Save Head
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
