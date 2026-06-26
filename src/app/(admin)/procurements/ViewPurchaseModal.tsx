import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Loader2, IndianRupee, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import ConnectDemandModal from './ConnectDemandModal';
import WarningAlertModal from '@/components/WarningAlertModal';

interface ViewPurchaseModalProps {
  isOpen: boolean;
  procurementId: string | null;
  onClose: () => void;
  vendors: any[];
  onSuccess?: () => void;
}

export default function ViewPurchaseModal({ isOpen, procurementId, onClose, vendors, onSuccess }: ViewPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [itemData, setItemData] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isConnectDemandOpen, setIsConnectDemandOpen] = useState(false);
  const [isUpdateEnabled, setIsUpdateEnabled] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchDetails = async () => {
    if (!procurementId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/fetchPurchaseDetails?procurement_id=${procurementId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        setPurchaseDetails(data.purchase_details || null);
        const items = data.item_data || [];
        setItemData(items);
        if (selectedItem) {
          const updatedItem = items.find((i: any) => String(i.purchase_id) === String(selectedItem.purchase_id));
          if (updatedItem) {
            setSelectedItem(updatedItem);
          }
        }
      } else {
        toast.error(data?.Message || 'Failed to fetch purchase details');
        onClose();
      }
    } catch (err: any) {
      toast.error('An error occurred while fetching details');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !procurementId) {
      setPurchaseDetails(null);
      setItemData([]);
      setSelectedItem(null);
      setIsItemModalOpen(false);
      setIsConnectDemandOpen(false);
      setIsUpdateEnabled(false);
      return;
    }

    fetchDetails();
  }, [isOpen, procurementId, onClose]);

  const handleMarkAsComplete = () => {
    setIsWarningModalOpen(true);
  };

  const confirmMarkAsComplete = async () => {
    if (!procurementId) return;
    setIsCompleting(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const formData = new FormData();
      formData.append('procurement_id', procurementId);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/markPurchaseComplete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr; try { arr = JSON.parse(text); } catch (x) { }
      const data = arr && Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1')) {
        toast.success(data.Message || 'Procurement marked closed');
        setIsWarningModalOpen(false);
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to mark as complete');
      }
    } catch (err: any) {
      toast.error('An error occurred while marking as complete');
    } finally {
      setIsCompleting(false);
      setIsWarningModalOpen(false);
    }
  };

  const handleUpdate = () => {
    // Left empty for future implementation
  };

  const handlePrintVoucher = () => {
    // Left empty for future functionalties
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[1000px] max-w-[95vw] h-[80vh] max-h-[90vh] rounded-xl'
        }`}>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[210] flex flex-col items-center justify-center bg-[#11141e]/80 backdrop-blur-[2px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300 font-medium text-[13px] tracking-wide">Loading procurement details...</p>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[14px] font-bold text-white flex items-center gap-2 tracking-wide uppercase">
            Purchase Details
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAsComplete}
              disabled={true}
              className="hidden px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-[12px] transition-colors shadow-sm"
              style={{ display: 'none' }}
            >
              Mark as complete
            </button>
            <div className="w-px h-5 bg-gray-600 mx-1"></div>
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

        <div className="flex-1 overflow-hidden p-0 bg-[#161a25] flex flex-col relative">

          {/* Details Bar */}
          {purchaseDetails && (
            <div className="bg-[#293653]/60 px-6 py-5 border-b border-gray-700/80 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <div className="flex flex-col gap-1.5">
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">Voucher No:</span>
                  <span className="text-white font-bold tracking-wide">{purchaseDetails.voucher_number || 'N/A'}</span>
                </div>
                <div className="text-[12px] text-gray-300 font-medium mb-1">
                  {purchaseDetails.description || 'N/A'}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[12px]">
                  {purchaseDetails.voucher_file_url && purchaseDetails.voucher_file_url !== '#' ? (
                    <a href={purchaseDetails.voucher_file_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors hover:underline font-medium border-r border-gray-600 pr-3">
                      Download Voucher
                    </a>
                  ) : (
                    <span className="text-gray-500 font-medium border-r border-gray-600 pr-3 line-through decoration-gray-500/50 cursor-not-allowed">Download Voucher</span>
                  )}

                  {purchaseDetails.gst_invoice_file_uri && purchaseDetails.gst_invoice_file_uri !== '#' ? (
                    <a href={purchaseDetails.gst_invoice_file_uri} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors hover:underline font-medium">
                      Download GST Invoice
                    </a>
                  ) : (
                    <span className="text-gray-500 font-medium line-through decoration-gray-500/50 cursor-not-allowed">Download GST Invoice</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:items-end">
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">Project Name:</span>
                  <span className="text-white font-bold tracking-wide">{purchaseDetails.project_name || 'N/A'}</span>
                </div>
                <div className="text-[12px]">
                  <span className="text-gray-300 font-medium mr-1.5">District:</span>
                  <span className="text-white font-bold tracking-wide">{purchaseDetails.district_name || 'N/A'}</span>
                </div>
                <div className="text-[12px] mt-1.5">
                  <span className="text-gray-300 font-medium mr-1.5">Purchase date:</span>
                  <span className="text-white font-bold tracking-wide">{purchaseDetails.purchase_date || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
            <h3 className="text-[14px] font-bold text-gray-300 tracking-wide uppercase shrink-0">Purchased Items</h3>

            <div className="flex-1 bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-[100%]">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-[#cdd5df] text-gray-900 sticky top-0 z-10 shadow-sm border-b border-gray-600">
                    <tr className="text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-2 py-2 text-center border-r border-[#bac4cf] w-10">SL</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf]">ITEM DETAILS</th>
                      <th className="px-3 py-2 border-r border-[#bac4cf]">VENDOR</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-center w-12">QNTY</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">UNIT PRICE</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">TOTAL AMOUNT</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">GST AMOUNT</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">SGST</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">CGST</th>
                      <th className="px-2 py-2 border-r border-[#bac4cf] text-right">IGST</th>
                      <th className="px-2 py-2 text-center w-20">VIEW DETAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {itemData.map((row, idx) => {
                      const vendorObj = vendors?.find(v => String(v.id) === String(row.vendor_id));
                      const vendorName = vendorObj?.vendor_name || vendorObj?.name || `Vendor #${row.vendor_id}`;
                      const isVerified = row.is_verified === 'Yes' || row.is_verified === '1';
                      const isUnverified = row.is_verified === 'No' || row.is_verified === '0';

                      return (
                        <tr
                          key={row.purchase_id || idx}
                          title={isVerified ? "Approved Purchase" : isUnverified ? "Unapproved Purchase" : ""}
                          className={`transition-colors text-[12px] ${isVerified
                            ? 'bg-green-950/40 hover:bg-green-950/50 text-emerald-100 border-y border-emerald-500/20'
                            : isUnverified
                              ? 'bg-yellow-950/30 hover:bg-yellow-950/40 text-amber-100 border-y border-yellow-500/10'
                              : 'hover:bg-white/5'
                            }`}
                        >
                          <td className="px-2 py-2 text-center text-gray-400 font-medium border-r border-gray-700/30">{idx + 1}</td>
                          <td className="px-3 py-2 text-white font-medium border-r border-gray-700/30 break-words whitespace-normal max-w-[150px]">
                            <div className="flex items-center gap-1.5">
                              <span>{row.item_name || `Item #${row.item_id}`}</span>
                              {isVerified ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 font-bold" />
                              ) : isUnverified ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-300 font-medium border-r border-gray-700/30 break-words whitespace-normal max-w-[150px]">{vendorName}</td>
                          <td className="px-2 py-2 text-center text-gray-300 font-medium border-r border-gray-700/30">{row.qnty || '0'}</td>
                          <td className="px-2 py-2 text-right text-white font-medium border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-500 mr-0.5" />{parseFloat(row.unit_price || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-right text-emerald-400 font-bold border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-[14px] h-[14px] mr-px" />{parseFloat(row.amount_inc_gst || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-right text-orange-400 font-medium border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-orange-500/70 mr-0.5" />{parseFloat(row.gst_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-right text-gray-300 font-medium border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-500 mr-0.5" />{parseFloat(row.sgst_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-right text-gray-300 font-medium border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-500 mr-0.5" />{parseFloat(row.cgst_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-right text-gray-300 font-medium border-r border-gray-700/30 whitespace-nowrap">
                            <div className="flex items-center justify-end"><IndianRupee className="w-3 h-3 text-gray-500 mr-0.5" />{parseFloat(row.igst_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
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
                          No items found for this purchase record.
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
          <div className="flex flex-col gap-2 bg-[#232b3e] border border-gray-700 rounded px-6 py-4 shadow-sm w-[320px]">
            {/* Main Items Grand Total */}
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-gray-400 font-bold tracking-wide uppercase">Items Total:</span>
              <span className="text-emerald-400 font-bold flex items-center">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5 stroke-[2]" />
                {itemData.reduce((sum, item) => sum + parseFloat(item.amount_inc_gst || 0), 0).toFixed(2)}
              </span>
            </div>

            {/* Additional Expenses Grand Total */}
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-gray-400 font-bold tracking-wide uppercase">Additional Expenses:</span>
              <span className="text-amber-400 font-bold flex items-center">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5 stroke-[2]" />
                {itemData.reduce((sum, item) => {
                  const expenses = item.additional_expenses || [];
                  const itemExpensesSum = expenses.reduce((s: number, exp: any) => s + (parseFloat(exp.total_amount) || 0), 0);
                  return sum + itemExpensesSum;
                }, 0).toFixed(2)}
              </span>
            </div>

            {/* Separator line */}
            <div className="border-t border-gray-700 my-1.5" />

            {/* Final Combined Total */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-black tracking-wide uppercase text-[12px]">Net Payable:</span>
              <span className="text-emerald-400 font-black text-lg flex items-center tracking-wide">
                <IndianRupee className="w-[18px] h-[18px] mr-0.5 stroke-[2.5]" />
                {(
                  itemData.reduce((sum, item) => sum + parseFloat(item.amount_inc_gst || 0), 0) +
                  itemData.reduce((sum, item) => {
                    const expenses = item.additional_expenses || [];
                    const itemExpensesSum = expenses.reduce((s: number, exp: any) => s + (parseFloat(exp.total_amount) || 0), 0);
                    return sum + itemExpensesSum;
                  }, 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 border border-red-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm"
          >
            Close
          </button>
          <button
            onClick={handlePrintVoucher}
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 border border-purple-600 text-white rounded font-medium text-[13px] transition-colors shadow-sm focus:outline-none"
          >
            Print Voucher
          </button>
          <button
            onClick={handleUpdate}
            disabled={!isUpdateEnabled || purchaseDetails?.is_closed !== 'No'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm flex items-center gap-2 focus:outline-none"
          >
            Update
          </button>
        </div>

      </div>

      <PurchaseDetailsModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemRow={selectedItem}
        voucherNumber={purchaseDetails?.voucher_number}
        projectId={purchaseDetails?.project_id}
        onDemandAction={(row) => {
          setIsItemModalOpen(false);
          setIsConnectDemandOpen(true);
        }}
        isClosed={purchaseDetails?.is_closed !== 'No'}
        onSuccess={() => {
          setIsItemModalOpen(false);
          fetchDetails();
          onSuccess?.();
        }}
        onRefresh={fetchDetails}
      />

      <ConnectDemandModal
        isOpen={isConnectDemandOpen}
        onClose={() => setIsConnectDemandOpen(false)}
        onSuccess={() => {
          setIsConnectDemandOpen(false);
          // Optional: triggering a refresh or just closing it
        }}
        purchaseId={selectedItem?.id || selectedItem?.purchase_id || null}
        oldDemandId={selectedItem?.connected_demand_info?.demand_id || selectedItem?.connected_demand_id || null}
        isClosed={purchaseDetails?.is_closed !== 'No'}
      />

      <WarningAlertModal
        isOpen={isWarningModalOpen}
        onClose={() => !isCompleting && setIsWarningModalOpen(false)}
        title="Confirm Action"
        content="Mark as Complete? This action cannot be reversed."
        onConfirm={confirmMarkAsComplete}
        isLoading={isCompleting}
      />
    </div>
  );
}
