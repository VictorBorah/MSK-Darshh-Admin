import { useState, useEffect } from 'react';
import { X, Link2, Loader2, Link as LinkIcon } from 'lucide-react';
import { useModalEscape } from '@/hooks/useModalEscape';
import toast from 'react-hot-toast';

interface PaymentDemandConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentId: string | null;
  paymentDetailId: string | null;
  oldDemandId: string | null;
}

export default function PaymentDemandConnection({ isOpen, onClose, onSuccess, paymentId, paymentDetailId, oldDemandId }: PaymentDemandConnectionProps) {
  useModalEscape(isOpen, onClose, 400);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demandsData, setDemandsData] = useState<any[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      setSelectedDemandId(null);
      fetchDemands();
    } else {
      setDemandsData([]);
      setSelectedDemandId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentId]);

  const fetchDemands = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/fetchAvailablePaymentDemands?payment_id=${paymentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (e) {}
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        setDemandsData(data.demands_data || []);
      } else {
        toast.error(data?.Message || 'Failed to fetch available demands');
        setDemandsData([]);
      }
    } catch (err) {
      toast.error('An error occurred while fetching available demands');
      setDemandsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDemandId) {
      toast.error('Please select a demand first');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('payment_detail_id', paymentDetailId || '');
      formData.append('old_demand_id', oldDemandId && oldDemandId !== '0' && oldDemandId !== '' ? oldDemandId : '0');
      formData.append('new_demand_id', selectedDemandId);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/changePaymentDemandConnection`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (e) {}
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Demand connection updated');
        onSuccess();
      } else {
        toast.error(data?.Message || 'Failed to update demand connection');
      }
    } catch (err) {
      toast.error('An error occurred while updating demand connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col w-[800px] max-w-[95vw] h-[80vh] max-h-[80vh] rounded-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Loading Overlay */}
        {(isLoading || isSubmitting) && (
          <div className="absolute inset-0 z-[410] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-[2px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300 font-medium text-[13px] tracking-wide">
              {isSubmitting ? 'Updating Connection...' : 'Fetching Demands...'}
            </p>
          </div>
        )}

        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            Update Payment Demand Connection
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-[#161a25] flex flex-col flex-1 overflow-hidden">
          {demandsData.length > 0 ? (
            <div className="flex flex-col gap-3 h-full">
              <h3 className="text-[13px] font-semibold text-white border-b border-gray-700/50 pb-2 flex items-center gap-2 shrink-0">
                <LinkIcon className="w-4 h-4 text-blue-400" /> Select a demand to connect
              </h3>
              <div className="bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-[13px] text-left">
                    <thead className="bg-[#232b3e] text-gray-400 border-b border-gray-700 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold w-12 text-center">SEL</th>
                        <th className="px-4 py-2.5 font-semibold">Demand Details</th>
                        <th className="px-4 py-2.5 font-semibold">Target Item</th>
                        <th className="px-4 py-2.5 font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {demandsData.map((dRow) => {
                        const isConnected = String(dRow.is_connected) === '1';
                        
                        return (
                          <tr
                            key={dRow.demand_id}
                            title={isConnected ? "This demand is already connected" : undefined}
                            className={`transition-colors ${isConnected ? 'opacity-60 cursor-not-allowed bg-gray-900/40' : 'hover:bg-white/5 cursor-pointer'} ${selectedDemandId === String(dRow.demand_id) ? 'bg-blue-500/10' : ''}`}
                            onClick={() => {
                              if (!isConnected) setSelectedDemandId(String(dRow.demand_id));
                            }}
                          >
                            <td className="px-4 py-3 text-center align-top mt-1">
                              <input
                                type="radio"
                                name="connect_demand_radio"
                                checked={selectedDemandId === String(dRow.demand_id)}
                                disabled={isConnected}
                                readOnly
                                className={`w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-900 relative top-1 ${isConnected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-white break-words">{dRow.project_name || 'N/A'}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">#{dRow.demand_no} &bull; {dRow.demand_date}</div>
                              <div className="mt-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${String(dRow.priority_id) === '1' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  String(dRow.priority_id) === '2' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                  }`}>
                                  {dRow.priority_txt || 'Low'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-300 align-top">
                              <div className="font-medium text-blue-300 break-words max-w-[150px]">{dRow.item_name}</div>
                              {dRow.auto_title && <div className="text-[11px] text-gray-500 italic mt-1 line-clamp-2 max-w-[150px]">{dRow.auto_title}</div>}
                            </td>
                            <td className="px-4 py-3 text-white font-medium align-top">{dRow.quantity_txt || dRow.quantity || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full bg-[#1b202c] border border-gray-700/50 border-dashed rounded-lg text-gray-500">
              <LinkIcon className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-[13px]">No available demands found</p>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDemandId || isSubmitting || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Confirm Connection
          </button>
        </div>
      </div>
    </div>
  );
}
