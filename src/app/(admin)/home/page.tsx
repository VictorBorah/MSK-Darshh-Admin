import { CheckSquare, Square, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Home</h1>

      <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-6 mb-5 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-3 tracking-wide">
          ZYN Construction Management System
        </h2>
        <p className="text-[#ccd6f6] text-[15px] leading-relaxed max-w-4xl">
          An enterprise-grade, centralized cloud infrastructure explicitly engineered to orchestrate scaling site operations, real-time financial allocations, and comprehensive workforce logistics across distributed projects.
        </p>
        <div className="mt-5 bg-red-950/30 border border-red-500/30 rounded-md p-4 flex items-center gap-4 w-fit">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-[14px]">
              Current Status: <span className="font-medium text-red-400">Project progress is late by 2 Days</span>
            </span>
            <span className="text-white font-medium text-[13px] mt-1">
              Currently Working on: <span className="text-red-400 font-semibold">Payments Section</span>
            </span>
            <p className="text-gray-400 text-[11px] font-medium mt-2.5 flex items-center gap-1 border-t border-red-500/20 pt-2.5">
              Status Updated on: 26/04/2026 01:16 PM by <a href="https://www.victorborah.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 transition-colors">Dr. Einstein</a>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-emerald-400 font-semibold mb-2">Development Roadmap</h3>
          <p className="text-gray-400 text-sm mb-6">The Admin Home Dashboard modules will be architected structurally at a later date. Below is the active agile timeline pipelining for the entire system suite:</p>

          <ul className="space-y-4 text-[14px] text-[#ccd6f6]">
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">25 Feb - 01 March 2026: Design and build the Database Schema, the Mockup, and other Architectural Plans for the Admin Projects Management</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">01 March - 28 March 2026: Design and build the Admin Projects Management Flow</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">29 March - 02 April 2026: Design and build the Master Entries Management</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">02 April - 15 April 2026: Design and build the Procurements Section </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">15 April - 20 April 2026: Design and build the Payments Section </span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>20 April - 25 April 2026: Run Units Tests for Payments Module, GST and TDS calculations </span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>26 April - 28 April 2026: Design and build the Site Supervisor App</span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>28 April - 30 April 2026: Design and build the Other Staff App</span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>30 April - 03 May 2026: Design and build the Admin Dashboard & Settings Page</span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>03 May - 05 May 2026: Design and build the Admin Projects Management</span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>05 May - 10 May 2026: Design and build the Admin Reports Management</span>
            </li>
            <li className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <span>10 May - 15 May 2026: Make system ready for production deployment</span>
            </li>
          </ul>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-md p-4">
          <p className="text-emerald-400 font-medium text-[13px] flex items-center gap-2">
            Target SLA: The Project infrastructure will hit finalized production deployment pipelines by 15th May 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
