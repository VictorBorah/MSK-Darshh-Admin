'use client';

import { 
  Play, 
  Pause, 
  IndianRupee, 
  Search,
  Plus,
  RefreshCcw,
  List,
  LineChart,
  Eye,
  Pencil,
  Settings,
  Archive,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import NewProjectModal from '@/app/(admin)/projects/NewProjectModal';
import ViewProjectModal from '@/app/(admin)/projects/ViewProjectModal';
import SettingsProjectModal from '@/app/(admin)/projects/SettingsProjectModal';
import EditProjectModal from '@/app/(admin)/projects/EditProjectModal';
import BudgetConfigModal from '@/app/(admin)/projects/BudgetConfigModal';

export default function Home() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Data Flow State
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Action Modal Triggers
  const [activeModal, setActiveModal] = useState<{type: 'view'|'settings'|'edit'|'budget', id: string, name: string} | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}admin/fetchAdminProjectList`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const rawText = await res.text();
      let arr;
      try {
        arr = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Invalid JSON server response');
      }

      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && String(data.Status) === '1') {
        const total = parseInt(data.total_rows || "0", 10);
        const pageSize = parseInt(data.pagination_size || "10", 10);
        
        if (data.project_data && Array.isArray(data.project_data)) {
          setProjects(data.project_data);
        } else {
          setProjects([]);
        }
        
        // Calculate Pagination context 
        if (total && pageSize) {
          setTotalPages(Math.ceil(total / pageSize));
          setItemsPerPage(pageSize);
        } else {
          setTotalPages(1);
        }
        
        toast.success(data.Message || 'Projects loaded successfully');
      } else {
        throw new Error(data?.Message || 'API Error');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error fetching projects');
      setProjects([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full">
      
      
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white">Projects list</h1>
        <RefreshCcw 
           onClick={fetchProjects} 
           className={`w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors ${isLoading ? 'animate-spin text-white' : ''}`} 
        />
      </div>
      
      <div className="bg-[#191e2b] border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header and Search */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#191e2b]">
          <h2 className="text-[15px] font-semibold flex items-center gap-2 text-white tracking-wide">
            <List className="w-4 h-4 text-gray-400" />
            Projects
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#11141e] border border-gray-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#191e2b]">
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <Play className="w-3.5 h-3.5 text-green-500 fill-green-500/20" /> Start
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <Pause className="w-3 h-3 text-orange-400 fill-orange-400" /> Pause
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <Archive className="w-3.5 h-3.5 text-blue-400" /> Archive
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
             <button 
               onClick={() => setIsNewProjectModalOpen(true)}
               className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-4 py-1.5 text-sm transition-colors gap-2"
             >
               <Plus className="w-4 h-4" /> New Project
             </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-400 font-semibold uppercase bg-[#191e2b] border-b border-gray-800">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600" />
                </th>
                <th className="px-4 py-3.5 w-48">Name</th>
                <th className="px-4 py-3.5 w-24 hidden lg:table-cell">Code</th>
                <th className="px-4 py-3.5 w-24">Status</th>
                <th className="px-4 py-3.5 w-32">Actions</th>
                <th className="px-4 py-3.5 w-32 hidden lg:table-cell">Client</th>
                <th className="px-4 py-3.5 w-32">Progress</th>
                <th className="px-4 py-3.5 w-20 text-center">View</th>
                <th className="px-4 py-3.5 w-24 text-center">Settings</th>
                <th className="px-4 py-3.5 w-20 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              {isLoading ? (
                <tr>
                   <td colSpan={10} className="py-12 text-center text-gray-500">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                     Loading Projects...
                   </td>
                </tr>
              ) : projects.length === 0 ? (
                 <tr>
                   <td colSpan={10} className="py-12 text-center text-gray-500">
                     No projects found matching the criteria.
                   </td>
                 </tr>
              ) : (
                 projects.map((project: any) => (
                   <TableRow 
                     key={project.project_id}
                     id={project.project_id}
                     name={project.project_name}
                     code={project.project_code}
                     status={project.status}
                     client={project.client_name || '-'}
                     progress={project.progress_percent}
                     statusColor={String(project.status).toLowerCase() === 'running' ? 'green' : 'cyan'}
                     setupComplete={project.setup_complete}
                     onAction={(type: 'view'|'settings'|'edit'|'budget') => setActiveModal({ type, id: String(project.project_id), name: project.project_name })}
                   />
                 ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */ }
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b]">
            <span>Page {currentPage} of {totalPages} ({projects.length} Total rows fetched)</span>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <select value={itemsPerPage} disabled className="bg-[#11141e] border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500 cursor-not-allowed hidden sm:block">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="hidden sm:inline">items per page</span>
                </div>
                <div className="flex items-center space-x-1">
                   <button 
                     disabled={currentPage === 1}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Prev
                   </button>
                   <button 
                     disabled={currentPage >= totalPages}
                     className="px-3 py-1.5 border border-gray-700 rounded bg-[#1f2536] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Next
                   </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Component Modals */}
      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
        onSuccess={fetchProjects}
      />
      <ViewProjectModal 
        isOpen={activeModal?.type === 'view'} 
        onClose={() => setActiveModal(null)} 
        projectId={activeModal?.id || ''} 
        projectName={activeModal?.name || ''} 
      />
      <SettingsProjectModal 
        isOpen={activeModal?.type === 'settings'} 
        onClose={() => setActiveModal(null)} 
        projectId={activeModal?.id || ''} 
        projectName={activeModal?.name || ''} 
      />
      <EditProjectModal 
        isOpen={activeModal?.type === 'edit'} 
        onClose={() => setActiveModal(null)} 
        projectId={activeModal?.id || ''} 
        projectName={activeModal?.name || ''} 
        onSuccess={() => fetchProjects()}
      />
      <BudgetConfigModal 
        isOpen={activeModal?.type === 'budget'} 
        onClose={() => setActiveModal(null)} 
        projectId={activeModal?.id || ''} 
        projectName={activeModal?.name || ''} 
      />
    </div>
  );
}

function TableRow({ 
  id,
  name, 
  code, 
  status, 
  client,
  progress,
  statusColor = "emerald",
  setupComplete,
  onAction
}: any) {
  const isSetupIncomplete = String(setupComplete) === '0';

  return (
    <tr className={`${isSetupIncomplete ? 'bg-[#2a303d] hover:bg-[#323847]' : 'hover:bg-[#1f2536]'} transition-colors group`}>
      <td className="px-5 py-3.5">
        <input type="checkbox" className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" />
      </td>
      <td className="px-4 py-3.5 font-medium text-blue-500 hover:text-blue-400 cursor-pointer">
        <div className="flex items-center gap-2">
           {name}
           {isSetupIncomplete && (
             <span title="Setup Incomplete">
               <AlertTriangle className="w-4 h-4 text-orange-500" />
             </span>
           )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">{code}</td>
      <td className="px-4 py-3.5">
        <span className={`px-2 py-1 text-[10px] font-bold tracking-wider ${statusColor === 'green' ? 'text-green-500 border border-green-500/30' : 'text-[#00BFA5] border border-[#00BFA5]/30'} bg-transparent rounded shadow-sm`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3 text-gray-500">
          <span title="Graph"><LineChart className="w-3.5 h-3.5 hover:text-blue-400 cursor-pointer transition-colors" /></span>
          <span title="Pause"><Pause className="w-3.5 h-3.5 hover:text-orange-400 cursor-pointer transition-colors" /></span>
          <span title="View" onClick={() => onAction('view')}><Eye className="w-3.5 h-3.5 hover:text-emerald-400 cursor-pointer transition-colors" /></span>
          <span title="Edit" onClick={() => onAction('edit')}><Pencil className="w-3.5 h-3.5 hover:text-yellow-400 cursor-pointer transition-colors" /></span>
          <span title="Budget Config" onClick={() => onAction('budget')}><IndianRupee className="w-3.5 h-3.5 hover:text-purple-400 cursor-pointer transition-colors" /></span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">{client}</td>
      <td className="px-4 py-3.5 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs">{progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button onClick={() => onAction('view')} className="px-2 py-1 text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Eye className="w-2.5 h-2.5" /> View
        </button>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button onClick={() => onAction('settings')} className="px-2 py-1 text-[10px] bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Settings className="w-2.5 h-2.5" /> Settings
        </button>
      </td>
      <td className="px-4 py-3.5 text-center">
        <button onClick={() => onAction('edit')} className="px-2 py-1 text-[10px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Pencil className="w-2.5 h-2.5" /> Edit
        </button>
      </td>
    </tr>
  );
}
