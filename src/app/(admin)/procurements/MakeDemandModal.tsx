import { X, Maximize2, Minimize2, ClipboardList, Settings } from 'lucide-react';
import { useState } from 'react';
import Select from 'react-select';

interface MakeDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
}

export default function MakeDemandModal({ isOpen, onClose, projects }: MakeDemandModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [separateDemands, setSeparateDemands] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  // Dummy data as requested
  const [itemsList] = useState([
    { id: '1', name: 'AC Concrete Brick', unit: 'Pcs', qnty: 500 },
    { id: '2', name: 'Cement', unit: 'Bags', qnty: 20 },
  ]);

  if (!isOpen) return null;

  const totalItems = itemsList.reduce((sum, item) => sum + item.qnty, 0);

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all`}>
      <div 
        className={`bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized ? 'w-full h-full fixed inset-0 m-0 rounded-none' : 'w-[900px] max-w-[95vw] max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <div className="flex items-center gap-6">
             <h2 className="text-[16px] text-white font-bold tracking-wide flex items-center gap-2">
               <ClipboardList className="w-5 h-5" /> New Demand
             </h2>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input 
                 type="checkbox" 
                 checked={separateDemands}
                 onChange={(e) => setSeparateDemands(e.target.checked)}
                 className="w-4 h-4 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-1 cursor-pointer transition-all"
               />
               <span className="text-[12px] text-gray-300 font-normal group-hover:text-white transition-colors">Make separate demands</span>
             </label>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
              title={isMaximized ? "Restore Size" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1.5 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Controls Row */}
        <div className="px-6 py-4 bg-[#1b202c] border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center shrink-0">
          <div className="flex items-center gap-4">
             <label className="text-[13px] font-normal text-white whitespace-nowrap">Select Project</label>
             <div className="flex-1">
               <Select
                 options={projects.map((p: any) => ({ value: String(p.id), label: p.project_name }))}
                 onChange={(val: any) => setSelectedProject(val ? val.value : null)}
                 value={projects.find(p => String(p.id) === selectedProject) ? { value: selectedProject, label: projects.find((p: any) => String(p.id) === selectedProject)?.project_name } : null}
                 placeholder="Select a project..."
                 styles={{
                   control: (base, state) => ({ ...base, backgroundColor: '#cdd5df', borderColor: 'transparent', minHeight: '38px', borderRadius: '2px', fontWeight: 400, color: '#111', boxShadow: 'none', cursor: 'pointer', fontSize: '12px' }),
                   menuPortal: base => ({ ...base, zIndex: 99999 }),
                   menu: base => ({ ...base, backgroundColor: '#cdd5df', border: '1px solid #bac4cf', borderRadius: '4px' }),
                   option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#a8b6c8' : state.isFocused ? '#bac4cf' : 'transparent', color: '#111', cursor: 'pointer', fontWeight: 400, fontSize: '12px' }),
                   singleValue: base => ({ ...base, color: '#111', fontWeight: 400, fontSize: '12px' }),
                   placeholder: base => ({ ...base, color: '#555', fontWeight: 400, fontSize: '12px' }),
                   indicatorSeparator: () => ({ display: 'none' })
                 }}
                 menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
               />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <label className="text-[13px] font-normal text-white whitespace-nowrap">Search an Item</label>
             <div className="flex-1 relative">
               <input 
                 type="text"
                 value={itemSearch}
                 onChange={(e) => setItemSearch(e.target.value)}
                 placeholder="Type an item .."
                 className="w-full bg-[#cdd5df] border-none rounded-[2px] h-[38px] px-3 text-[12px] font-normal text-gray-900 placeholder:text-gray-500 placeholder:italic focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
               />
               {itemSearch && (
                 <button 
                   onClick={() => setItemSearch('')}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black p-0.5"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* Table Body (Vertically scrolling section) */}
        <div className="flex-1 overflow-y-auto bg-[#232b3e] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
           <table className="w-full text-left">
              <thead className="text-[14px] text-white font-bold uppercase bg-[#3f4a60] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3.5 w-16">SL</th>
                  <th className="px-6 py-3.5 flex-1">ITEM</th>
                  <th className="px-6 py-3.5 w-32">UNIT</th>
                  <th className="px-6 py-3.5 w-32">REQ. QNTY</th>
                  <th className="px-6 py-3.5 w-32 text-center">CONFIGURE</th>
                  <th className="px-6 py-3.5 w-24 text-center">REMOVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {itemsList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-normal text-[12px]">{idx + 1}</td>
                    <td className="px-6 py-4 text-white font-normal text-[12px] truncate">{item.name}</td>
                    <td className="px-6 py-4 text-white font-normal text-[12px]">{item.unit}</td>
                    <td className="px-6 py-4 text-white font-normal text-[12px]">{item.qnty}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-300 hover:text-white transition-colors p-1 rounded hover:bg-white/10 mx-auto block">
                        <Settings className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 mx-auto block">
                        <X className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1b202c] border-t border-gray-800 flex flex-col items-end gap-4 shrink-0">
           <div className="text-[12px] text-white font-normal tracking-wide">
              Total Items: <span className="ml-1">{totalItems}</span>
           </div>
           <div className="flex items-center gap-3 w-full justify-end">
              <button 
                onClick={onClose}
                className="px-5 py-2 text-[14px] font-normal text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm min-w-[120px]"
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 text-[14px] font-normal text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm min-w-[150px]"
              >
                Confirm Demand
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
