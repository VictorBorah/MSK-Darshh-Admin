import { useState, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, Loader2, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentItemDetailsModal from './PaymentItemDetailsModal';
import PaymentDemandConnection from './PaymentDemandConnection';

interface ViewPaymentModalProps {
  isOpen: boolean;
  paymentId: string | null;
  onClose: () => void;
  paymentModes: any[];
}

export default function ViewPaymentModal({ isOpen, paymentId, onClose, paymentModes }: ViewPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [itemData, setItemData] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isConnectDemandOpen, setIsConnectDemandOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!paymentId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}payments/fetchPaymentDetails?payment_id=${paymentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setPaymentDetails(data.payment_data || null);
        setItemData(data.item_data || []);
      } else {
        toast.error(data?.Message || 'Failed to fetch payment details');
        onClose();
      }
    } catch (err: any) {
      toast.error('An error occurred while fetching details');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, onClose]);

  useEffect(() => {
    if (!isOpen || !paymentId) {
      setPaymentDetails(null);
      setItemData([]);
      setSelectedItem(null);
      setIsItemModalOpen(false);
      return;
    }

    fetchDetails();
  }, [isOpen, paymentId, fetchDetails]);

  const handlePrintVoucher = () => {
    // Left empty for future functionalities
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1050px] max-w-[95vw] h-[80vh] max-h-[90vh] rounded-xl'}`}>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[210] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-[2px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300 font-medium text-[13px] tracking-wide">Loading payment details...</p>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
            Payment Details
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white transition-colors outline-none p-1 hover:bg-white/10 rounded"
              title={isMaximized ? "Restore Size" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors block"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-[#161a25] flex flex-col relative">

          {/* Details Bar */}
          {paymentDetails && (
            <div className="bg-[#293653]/60 px-6 py-5 border-b border-gray-700/80 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <div className="flex flex-col gap-1.5">
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">Payment ID:</span>
                  <span className="text-white font-bold tracking-wide">#{paymentDetails.payment_id || 'N/A'}</span>
                </div>
                <div className="text-[12px] text-gray-300 font-medium mb-1">
                  {paymentDetails.payment_description || 'N/A'}
                </div>
                <div className="text-[12px] mt-1">
                  <span className="text-gray-300 font-medium mr-1.5">Done By:</span>
                  <span className="text-blue-400 font-medium tracking-wide">{paymentDetails.payment_done_by_staff_name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:items-end">
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">Project Name:</span>
                  <span className="text-white font-bold tracking-wide">{paymentDetails.project_name || 'N/A'}</span>
                </div>
                <div className="text-[12px] mt-1">
                  <span className="text-gray-300 font-medium mr-1.5">Payment Date:</span>
                  <span className="text-white font-bold tracking-wide">{paymentDetails.payment_date || 'N/A'}</span>
                </div>
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">Fulfilled Date:</span>
                  <span className="text-emerald-400 font-bold tracking-wide">{paymentDetails.fulfil_date || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-6 flex flex-col gap-4">
            <h3 className="text-[14px] font-bold text-gray-300 tracking-wide uppercase shrink-0">Payment Items</h3>

            <div className="flex-1 bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-[100%]">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-[#cdd5df] text-gray-900 sticky top-0 z-10 shadow-sm border-b border-gray-600">
                    <tr className="text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-3 py-2 text-center border-r border-[#bac4cf] w-12">SL</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf]">ITEM DETAILS</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf]">MODE</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf]">VOUCHER NO</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf] text-center w-16">QNTY</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf] text-right">TOTAL BASE</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf] text-right">TDS RATE</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf] text-right">TDS AMOUNT</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf] text-right">GROSS AMOUNT</th>
                      <th className="px-3 py-2 text-center w-20">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {itemData.map((row, idx) => {
                      return (
                        <tr key={row.item_id || idx} className="hover:bg-white/5 transition-colors text-[12px]">
                          <td className="px-3 py-3 text-center text-gray-400 font-medium border-r border-gray-700/30 align-top mt-0.5">{idx + 1}</td>
                          <td className="px-3 py-3 text-white font-medium border-r border-gray-700/30 align-top break-words max-w-[200px]">
                            <div className="text-blue-300 mb-0.5">{row.item_name || 'N/A'}</div>
                            <div className="text-[11px] text-gray-400 font-normal italic leading-relaxed line-clamp-2" title={row.purchase_title}>{row.purchase_title || 'No Title'}</div>
                            <div className="mt-1 text-[10px] uppercase text-gray-500 font-semibold">{row.budget_head_name || ''}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-300 font-medium border-r border-gray-700/30 align-top">{row.payment_mode_txt || '-'}</td>
                          <td className="px-3 py-3 text-gray-300 font-medium border-r border-gray-700/30 align-top break-words max-w-[140px]">{row.voucher_number || '-'}</td>
                          <td className="px-3 py-3 text-center text-white font-bold border-r border-gray-700/30 align-top">{row.qnty || '0'}</td>
                          <td className="px-3 py-3 text-right text-gray-300 font-medium border-r border-gray-700/30 align-top whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-500 mr-0.5" />{parseFloat(row.amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-3 py-3 text-right text-orange-400/90 font-medium border-r border-gray-700/30 align-top whitespace-nowrap">
                            {row.tds_option === '-1' ? 'N/A' : `${row.tds_rate}%`}
                          </td>
                          <td className="px-3 py-3 text-right text-orange-400 font-medium border-r border-gray-700/30 align-top whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-orange-500/70 mr-0.5" />{parseFloat(row.tds_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-400 font-bold border-r border-gray-700/30 align-top whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-[14px] h-[14px] mr-px" />{parseFloat(row.gross_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-3 py-3 text-center align-top">
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); setSelectedItem(row); setIsItemModalOpen(true); }}
                              className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold tracking-wide transition-colors"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      );
                    })}

                    {itemData.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-gray-500 text-[13px]">
                          No items found for this payment record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Grand Total Value */}
        <div className="px-6 pb-4 pt-2 shrink-0 flex justify-end bg-[#161a25]">
          <div className="flex items-center gap-6 bg-[#232b3e] border border-gray-700 flex-shrink-0 rounded px-6 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold tracking-wide uppercase text-[11px]">Total TDS:</span>
              <span className="text-orange-400 font-bold text-[14px] flex items-center">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                {parseFloat(paymentDetails?.total_tds || 0).toFixed(2)}
              </span>
            </div>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold tracking-wide uppercase text-[12px]">Grand Total:</span>
              <span className="text-emerald-400 font-black text-xl flex items-center tracking-wide">
                <IndianRupee className="w-5 h-5 mr-0.5 stroke-[2.5]" />
                {parseFloat(paymentDetails?.total_gross_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Close
          </button>
          <button
            onClick={handlePrintVoucher}
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 border border-purple-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm focus:outline-none"
          >
            Print Voucher
          </button>
        </div>

      </div>

      <PaymentItemDetailsModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemRow={selectedItem}
        onDemandAction={(row) => {
          setIsItemModalOpen(false);
          setIsConnectDemandOpen(true);
        }}
      />

      <PaymentDemandConnection
        isOpen={isConnectDemandOpen}
        onClose={() => setIsConnectDemandOpen(false)}
        onSuccess={() => {
          setIsConnectDemandOpen(false);
          fetchDetails();
        }}
        paymentId={paymentId}
        paymentDetailId={selectedItem?.payment_details_id || null}
        oldDemandId={selectedItem?.connected_demand_info?.demand_id || selectedItem?.demand_id || null}
      />
    </div>
  );
}
