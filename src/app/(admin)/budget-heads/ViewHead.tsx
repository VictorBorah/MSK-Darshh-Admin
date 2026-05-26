import { X } from 'lucide-react';

interface ViewHeadProps {
  isOpen: boolean;
  onClose: () => void;
  headData: any | null;
}

export default function ViewHead({ isOpen, onClose, headData }: ViewHeadProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2536] border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-[#161a25]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">View Budget Head Data</h2>
            {headData && (
              <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-mono">
                Sequence ID {headData.id}
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
          {headData ? (
             <div className="space-y-6">
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Budget Head Name</label>
                   <div className="text-[15px] font-medium text-gray-200 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50">{headData.head}</div>
                </div>

                <div>
                   <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Default GST (%)</label>
                   <div className="text-[14px] text-gray-300 bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block min-w-[80px] text-center font-mono">
                      {headData.default_gst}%
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Process Vendor</label>
                     <div className="bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block font-semibold">
                        {String(headData.has_vendor) === "1" ? (
                           <span className="text-blue-400 text-[13px] tracking-wide">
                             Yes (Has Vendor)
                           </span>
                        ) : (
                           <span className="text-gray-400 text-[13px] tracking-wide">
                             No
                           </span>
                        )}
                     </div>
                  </div>

                  <div>
                     <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                     <div className="bg-[#11141e] px-4 py-2.5 rounded-md border border-gray-700/50 inline-block">
                        {String(headData.active) === "1" ? (
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
             </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p>Requested budget head data could not be loaded.</p>
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
