'use client';

import { useState } from 'react';
import { CheckSquare, Square, CheckCircle, AlertTriangle, Rocket, ChevronDown, ChevronRight } from 'lucide-react';

export default function Home() {
  const [showCompleted, setShowCompleted] = useState(false);

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
              Current Status: <span className="font-medium text-red-400">Project progress is late by 5 Days</span>
            </span>
            <span className="text-white font-medium text-[13px] mt-1">
              Currently Working on: <span className="text-red-400 font-semibold">Deploying to Production Cloud</span>
            </span>
            <p className="text-gray-400 text-[11px] font-medium mt-2.5 flex items-center gap-1 border-t border-red-500/20 pt-2.5">
              Status Updated on: 01/07/2026 09:50 AM by <a href="https://www.victorborah.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 transition-colors">Dr. Einstein</a>
            </p>
          </div>
        </div>

        <div className="mt-5 bg-blue-950/20 border border-blue-500/30 rounded-md p-5 max-w-4xl">
          <div className="flex items-center gap-3 mb-4 border-b border-blue-500/20 pb-3">
            <Rocket className="w-5 h-5 text-blue-400" />
            <h3 className="text-blue-400 font-bold text-[15px]">Production Cloud Deployment Checklist</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Provision Domains for API Web Services and Frontend Application</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Configure Linux Droplet Server on DigitalOcean Cloud</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Set up Shared Hosting Environment on Hostinger for Frontend App</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Deploy and Secure Decentralized Database Cluster on DigitalOcean</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Reconfigure GitHub CI/CD Pipelines with New Host Secrets</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Initialize Cloud Object Storage for File Management</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Verify Global DNS Propagation and Routing</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Issue and Bind SSL/TLS Certificates (HTTPS) for all domains</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 line-through">Inject Production Environment Variables and API Credentials</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#ccd6f6]">
              <Square className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <span>Execute Final Production Deployment and Perform Sanity Checks</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-emerald-400 font-semibold mb-2">Development Roadmap</h3>
          <p className="text-gray-400 text-sm mb-6">The Admin Home Dashboard modules will be architected structurally at a later date. Below is the active agile timeline pipelining for the entire system suite:</p>

          <div className="flex flex-col gap-4">
            {/* Completed Milestones Collapsible Box */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-950/20">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between p-4 bg-[#1b202c]/40 hover:bg-[#1b202c]/70 transition-colors text-emerald-400 font-bold text-[13px] uppercase tracking-wider focus:outline-none"
              >
                <div className="flex items-center gap-2.5">
                  {showCompleted ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Completed Milestones (11 items)</span>
                </div>
                <span className="text-xs text-gray-500 font-bold">
                  {showCompleted ? 'Hide List' : 'Show List'}
                </span>
              </button>

              {showCompleted && (
                <ul className="p-4 border-t border-gray-800 space-y-4 text-[14px] text-[#ccd6f6] bg-[#161a25]/20 animate-in fade-in slide-in-from-top-1 duration-200">
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
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">20 April - 25 April 2026: Run Units Tests for Payments Module, GST and TDS calculations </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">26 April - 28 April 2026: Design and build the Site Supervisor App</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">28 April - 10 May 2026: Design and build the Staff PWA App</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">17 May - 19 May 2026: Deploy to Production (Digital Ocean Cloud)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">20 May - 24 May 2026: Design and build the Admin Dashboard & Settings Page</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400 line-through">24 May - 25 May 2026: Connect all the dots for the Admin Projects Management</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Active Roadmap Items */}
            <ul className="space-y-4 text-[14px] text-[#ccd6f6] mt-2">
              <li className="flex items-start gap-3">
                <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <span>25 May - 30 May 2026: Design and build the Notifications & Admin Reporting Engine</span>
              </li>
              <li className="flex items-start gap-3">
                <Square className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <span>30 May - 05 June 2026: Finish App with final production deployment</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-md p-4">
          <p className="text-emerald-400 font-medium text-[13px] flex items-center gap-2">
            Target SLA: The Project infrastructure will hit finalized production deployment pipelines by 20th May 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
