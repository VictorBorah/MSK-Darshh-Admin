import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ViewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string | null;
}

export default function ViewVendorModal({ isOpen, onClose, vendorId }: ViewVendorModalProps) {
  const [vendorData, setVendorData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen && vendorId) {
      const fetchVendorDetails = async () => {
        setIsFetching(true);
        setVendorData(null);
        try {
          const token = localStorage.getItem('at_ki8Xq1iV');
          const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/getVendorDetails?vendor_id=${vendorId}`;
          const res = await fetch(endpoint, {
             method: 'GET',
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          const response = Array.isArray(data) ? data[0] : data;
          
          if (String(response.Status) === "1" && response.vendor_data) {
             setVendorData(response.vendor_data);
             // toast.success(response.Message || 'Detail fetched'); (optional, maybe keep it silent on success like category)
          } else {
             toast.error(response.Message || 'Failed to fetch vendor details');
          }
        } catch (e) {
           console.error(e);
           toast.error('Network Error fetching vendor data');
        } finally {
           setIsFetching(false);
        }
      };
      fetchVendorDetails();
    }
  }, [isOpen, vendorId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">View Vendor Data</h2>
            {vendorId && (
              <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-mono">
                Sequence ID {vendorId}
              </p>
            )}
          </div>
          <button 
             onClick={onClose} 
             className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <p className="text-sm tracking-wide">Fetching detailed record...</p>
            </div>
          ) : vendorData ? (
             <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div className="md:col-span-2">
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Vendor Name</label>
                   <div className="text-[15px] font-medium text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{vendorData.vendor_name}</div>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Address</label>
                   <div className="text-[14px] text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 min-h-[60px] whitespace-pre-wrap">
                      {vendorData.vendor_address || <span className="text-gray-600 italic">No address provided.</span>}
                   </div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile</label>
                   <div className="text-[14px] font-mono text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{vendorData.vendor_mobile || '-'}</div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                   <div className="text-[14px] font-mono text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{vendorData.vendor_email || '-'}</div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">GST Number</label>
                   <div className="text-[14px] font-mono text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{vendorData.vendor_gst || '-'}</div>
                </div>
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                   <div className="bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block w-full">
                      {String(vendorData.status) === "1" ? (
                         <span className="text-emerald-400 text-[13px] font-bold tracking-wide flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                           </span>
                           ACTIVE
                         </span>
                      ) : (
                         <span className="text-red-400 text-[13px] font-bold tracking-wide flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                           </span>
                           DISABLED
                         </span>
                      )}
                   </div>
                </div>
             </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p>Requested vendor data could not be loaded.</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors shadow-sm"
            >
              Close Window
            </button>
        </div>

      </div>
    </div>
  );
}
