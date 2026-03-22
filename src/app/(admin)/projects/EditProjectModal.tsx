'use client';
import { X, Pencil } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function EditProjectModal({ isOpen, onClose, projectId, projectName }: EditProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#1c2130] border border-gray-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative w-[700px] max-w-[95vw] overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700/50 flex justify-between items-center bg-[#1c2130]">
          <h2 className="text-[17px] font-semibold text-white tracking-wide flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-400" />
            Edit: {projectName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-transparent hover:bg-gray-800 p-1.5 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-gray-300">
          <p className="text-sm mb-4">Edit module for Project ID: <span className="font-bold text-white">{projectId}</span>.</p>
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 flex flex-col gap-2 font-mono text-xs">
             <p className="text-gray-400">Edit form under construction.</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors">Cancel</button>
            <button onClick={onClose} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
