import { X } from 'lucide-react';

interface BudgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

export default function BudgetConfigModal({ isOpen, onClose, projectId, projectName }: BudgetConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-all duration-300 w-[1000px] max-w-[95vw] min-h-[500px]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
          <div className="flex flex-col">
            <h2 className="text-[17px] text-white tracking-wide flex items-center gap-2">
              <span className="font-semibold border-r border-gray-600 pr-3 mr-1">Budget Configuration</span> 
              <span className="text-purple-300 font-bold">{projectName || 'Unnamed Project'}</span>
            </h2>
            <span className="text-[12px] text-gray-500 mt-1 font-medium">Sequence ID: {projectId} / Modifying Project Financials</span>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white outline-none transition-colors bg-transparent border-0 hover:bg-gray-800 p-1.5 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Placeholder Content Layout */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#1c2130] flex flex-col items-center justify-center">
            <div className="max-w-md text-center p-8 border border-gray-700/50 bg-[#161a25] rounded-xl shadow-inner">
               <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-purple-500/20">
                 <span className="text-purple-400 font-bold text-2xl">₹</span>
               </div>
               <h3 className="text-lg font-semibold text-white mb-3 tracking-wide">Financial Controls Awaiting</h3>
               <p className="text-sm text-gray-400 leading-relaxed">
                 The Budget Configuration module architecture is currently being established. You will soon be able to distribute the primary project budget across custom funding silos, configure micro-triggers, and analyze fiscal tracking curves right here.
               </p>
            </div>
        </div>

      </div>
    </div>
  );
}
