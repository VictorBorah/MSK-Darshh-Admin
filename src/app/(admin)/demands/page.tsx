'use client';

import React from 'react';

export default function DemandsPage() {
  return (
    <div className="p-6 text-gray-300 bg-[#11141e] min-h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Demands</h1>
      </div>

      <div className="bg-[#191e2b] border border-gray-800 rounded-xl p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-3">
            Demands Module Coming Soon
          </h2>
          <p className="text-sm text-gray-400">
            This page is currently under construction. Future updates will include a comprehensive module to track, manage, and process demands across all projects.
          </p>
        </div>
      </div>
    </div>
  );
}
