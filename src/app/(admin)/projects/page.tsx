'use client';

import { 
  Play, 
  Square, 
  XCircle, 
  RefreshCw, 
  Pause, 
  Trash2, 
  FileText, 
  Info, 
  Activity, 
  SquareTerminal, 
  User,
  Shield,
  Search,
  Plus,
  RefreshCcw,
  List
} from 'lucide-react';
import { useState } from 'react';
import NewProjectModal from '@/app/(admin)/projects/NewProjectModal';

export default function Home() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white">Projects list</h1>
        <RefreshCcw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
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
              <Square className="w-3.5 h-3.5 text-gray-400" /> Stop
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <XCircle className="w-3.5 h-3.5 text-red-500" /> Kill
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Restart
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <Pause className="w-3 h-3 text-orange-400 fill-orange-400" /> Pause
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] bg-transparent border border-gray-700 rounded-lg hover:bg-[#252b3d] text-gray-300 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-500" /> Remove
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
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">State</th>
                <th className="px-4 py-3.5">Quick Actions</th>
                <th className="px-4 py-3.5">Stack</th>
                <th className="px-4 py-3.5">Image</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5">Published Ports</th>
                <th className="px-4 py-3.5">Ownership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-[#161a25]">
              <TableRow 
                name="atlas"
                state="RUNNING"
                stack="atlas"
                image="keinstien/atlas:latest"
                created="2025-09-18 15:15:18"
                ip="-"
                ports="-"
                ownership="Public"
              />
              <TableRow 
                name="dockpeek"
                state="RUNNING"
                stack="dockpeek"
                image="ghcr.io/dockpeek/do..."
                created="2025-09-23 23:05:44"
                ip="192.168.128.2"
                ports="3420:8080"
                hasLinks
              />
              <TableRow 
                name="heimdall"
                state="RUNNING"
                stack="heimdall"
                image="linuxserver/heimdall:..."
                created="2025-09-23 23:05:17"
                ip="192.168.224.2"
                ports="8443:443, 8088:80"
                hasLinks
              />
              <TableRow 
                name="homeassistant"
                state="RUNNING"
                stack="homeassistant"
                image="ghcr.io/home-assist..."
                created="2025-09-23 23:06:11"
                ip="-"
                ports="-"
                ownership="Public"
              />
              <TableRow 
                name="Karakeep-CHROME"
                state="RUNNING"
                stack="karakeep"
                image="gcr.io/zenika-hub/al..."
                created="2025-09-08 11:12:31"
                ip="192.168.144.2"
                ports="-"
                ownership="Administrator"
                isAdmin
              />
               <TableRow 
                name="Karakeep-MEILI"
                state="RUNNING"
                stack="karakeep"
                image="getmeili/meilisearch:..."
                created="2025-09-08 11:12:31"
                ip="192.168.144.3"
                ports="-"
                ownership="Public"
              />
              <TableRow 
                name="Karakeep-WEB"
                state="HEALTHY"
                stack="karakeep"
                image="1aa231caa19f"
                created="2025-09-08 11:12:31"
                ip="192.168.144.4"
                ports="3022:3000"
                hasLinks
                stateColor="green"
              />
              <TableRow 
                name="mariadb"
                state="RUNNING"
                stack="mariadb-standalone"
                image="c14f2faa3568"
                created="2025-05-28 18:22:27"
                ip="172.27.0.2"
                ports="3306:3306"
                hasLinks
              />
              <TableRow 
                name="pinchflat"
                state="HEALTHY"
                stack="pinchflat"
                image="ghcr.io/kieraneglin/p..."
                created="2025-09-09 13:32:08"
                ip="192.168.16.2"
                ports="8945:8945"
                hasLinks
                stateColor="green"
              />
              <TableRow 
                name="portainer"
                state="RUNNING"
                stack="-"
                image="2a1f1b992b45"
                created="2025-05-12 12:04:33"
                ip="172.17.0.2"
                ports="9000:9000, 9443:9443"
                hasLinks
                ownership="Administrator"
                isAdmin
              />
               <TableRow 
                name="repliqate"
                state="RUNNING"
                stack="repliqate"
                image="b5f8786b6822"
                created="2025-09-08 19:35:49"
                ip="192.168.240.2"
                ports="-"
              />
              <TableRow 
                name="scanservjs"
                state="RUNNING"
                stack="-"
                image="0961fbfcfd90"
                created="2025-05-21 14:37:20"
                ip="-"
                ports="-"
              />
            </tbody>
          </table>
        </div>
        
        {/* Footer */ }
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center bg-[#191e2b]">
            <span>Showing 1-12 of 12 items</span>
            <div className="flex items-center gap-2">
                <select className="bg-[#11141e] border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                </select>
                <span>items per page</span>
            </div>
        </div>
      </div>
      
      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
      />
    </div>
  );
}

function TableRow({ 
  name, 
  state, 
  stack, 
  image, 
  created, 
  ip, 
  ports, 
  ownership = "Public",
  isAdmin = false,
  hasLinks = false,
  stateColor = "emerald"
}: any) {
  return (
    <tr className="hover:bg-[#1f2536] transition-colors group">
      <td className="px-5 py-3.5">
        <input type="checkbox" className="bg-transparent border-gray-600 rounded cursor-pointer h-3.5 w-3.5 accent-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" />
      </td>
      <td className="px-4 py-3.5 font-medium text-blue-500 hover:text-blue-400 cursor-pointer">{name}</td>
      <td className="px-4 py-3.5">
        <span className={`px-2 py-1 text-[10px] font-bold tracking-wider ${stateColor === 'green' ? 'text-green-500 border border-green-500/30' : 'text-[#00BFA5] border border-[#00BFA5]/30'} bg-transparent rounded shadow-sm`}>
          {state}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2 text-gray-500">
          <FileText className="w-3.5 h-3.5 hover:text-gray-300 cursor-pointer transition-colors" />
          <Info className="w-3.5 h-3.5 hover:text-gray-300 cursor-pointer transition-colors" />
          <Activity className="w-3.5 h-3.5 hover:text-gray-300 cursor-pointer transition-colors" />
          <SquareTerminal className="w-3.5 h-3.5 hover:text-gray-300 cursor-pointer transition-colors" />
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-400">{stack}</td>
      <td className="px-4 py-3.5 text-gray-400">{image}</td>
      <td className="px-4 py-3.5 text-gray-400">{created}</td>
      <td className="px-4 py-3.5 text-gray-400">{ip}</td>
      <td className="px-4 py-3.5">
        {hasLinks ? (
          <span className="text-blue-500 hover:text-blue-400 cursor-pointer">{ports}</span>
        ) : (
          <span className="text-gray-500">{ports}</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          {ownership}
        </div>
      </td>
    </tr>
  );
}
