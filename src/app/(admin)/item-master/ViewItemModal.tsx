import { useState, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
}

export default function ViewItemModal({ isOpen, onClose, itemId }: ViewItemModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [itemData, setItemData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchItemDetails(itemId);
    } else {
      setItemData(null);
    }
  }, [isOpen, itemId]);

  const fetchItemDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getItemDetails?item_id=${id}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const rawText = await res.text();
      let arr;
      try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON server response'); }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Item details fetched successfully');
        if (data.item_data && Array.isArray(data.item_data) && data.item_data.length > 0) {
          setItemData(data.item_data[0]);
        } else if (data.item_data && !Array.isArray(data.item_data)) {
          setItemData(data.item_data);
        } else {
          setItemData(data.item_data);
        }
      } else {
        toast.error(data?.Message || 'API Error');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error fetching item details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1f2536] border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161a25]">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white tracking-wide">Item Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Fetching item details...</p>
            </div>
          ) : itemData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Code</span>
                <span className="text-gray-200 font-medium">{itemData.item_code || '-'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</span>
                <span className="text-gray-200 font-medium">{itemData.item_name || '-'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                <span className="text-gray-200 font-medium">{itemData.category_name || '-'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Vendor</span>
                <span className="text-gray-200 font-medium">{itemData.default_vendor_name || '-'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2 md:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default GST</span>
                <span className="text-gray-200 font-medium">{itemData.default_gst || '0'}%</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</span>
                <span className="text-gray-200 font-medium">{itemData.unit_name || '-'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Construction Material</span>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded self-start ${String(itemData.is_material) === "1" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>
                  {String(itemData.is_material) === "1" ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded self-start ${String(itemData.status) === "1" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {String(itemData.status) === "1" ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No item details available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#161a25] flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
