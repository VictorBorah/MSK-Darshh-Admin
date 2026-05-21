import { X, Loader2, Printer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useModalEscape } from '@/hooks/useModalEscape';
import toast from 'react-hot-toast';
import { generatePdfFromElement } from '@/utils/pdfGenerator';

interface ViewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string | null;
}

export default function ViewVendorModal({ isOpen, onClose, vendorId }: ViewVendorModalProps) {
  useModalEscape(isOpen, onClose, 200);
  const [vendorData, setVendorData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!vendorData) return;
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const footerText = `ZYN Construction network, ${dateStr} System generated information`;
    const filename = `Vendor_Information_${vendorData.vendor_name?.replace(/\s+/g, '_') || 'Profile'}.pdf`;
    generatePdfFromElement(printRef.current, filename, footerText);
  };

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

        {/* Hidden Printable A4 Layout */}
        {vendorData && (
          <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none opacity-0 -z-50">
            <div ref={printRef} className="w-[800px] p-10 bg-white text-black font-sans box-border relative flex flex-col gap-6" data-html2canvas-ignore="false">
              
              {/* Header / Title */}
              <div className="text-center border-b-2 border-black pb-4 mb-2">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Vendor Information</h1>
                <p className="text-sm font-medium">Profile Overview</p>
              </div>

              {/* Core Details */}
              <div className="flex flex-col gap-2 pt-1">
                <h2 className="text-xl font-bold uppercase tracking-wide">{vendorData.vendor_name}</h2>
                <div className="text-sm flex flex-col gap-1 mt-2">
                  <p><strong>Vendor ID:</strong> {vendorId || 'N/A'}</p>
                  <p><strong>Status:</strong> {String(vendorData.status) === "1" ? "Active" : "Disabled"}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Contact Details</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                  <p><strong>Mobile:</strong> {vendorData.vendor_mobile || 'N/A'}</p>
                  <p><strong>Email Address:</strong> {vendorData.vendor_email || 'N/A'}</p>
                  <div className="col-span-2">
                    <p><strong>Address:</strong> {vendorData.vendor_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Business Details</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mt-1">
                  <p><strong>GST Number:</strong> {vendorData.vendor_gst || 'N/A'}</p>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="p-5 border-t border-gray-700 bg-[#161a25] flex justify-end gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isFetching || !vendorData}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#293653] hover:bg-[#324368] border border-gray-600 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-transparent rounded-md transition-colors shadow-sm"
            >
              Close Window
            </button>
        </div>

      </div>
    </div>
  );
}
