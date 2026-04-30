'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SystemLogPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markerValue, setMarkerValue] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  const fetchLogs = async (marker: number) => {
    const token = localStorage.getItem('at_ki8Xq1iV');
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !baseUrl) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}sys/fetch_system_log?marker_value=${marker}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      const logData = Array.isArray(data) ? data[0] : data;

      if (logData && (String(logData.Status) === '1' || String(logData.Status) === '0')) {
        const fetchedLogs = logData.log_data || [];
        if (Array.isArray(fetchedLogs) && fetchedLogs.length > 0) {
          setLogs([...fetchedLogs].reverse());
          setHasMoreLogs(true);
        } else {
          setLogs([]);
          setHasMoreLogs(false);
        }

        if (String(logData.Status) === '1') {
          toast.success(logData.Message || 'System log loaded');
        } else {
          toast.error(logData.Message || 'Failed to load some log details');
        }
      } else {
        toast.error('Failed to load system log');
        setLogs([]);
        setHasMoreLogs(false);
      }
    } catch (err) {
      toast.error('An error occurred while fetching system log');
      setLogs([]);
      setHasMoreLogs(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(markerValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerValue]);

  const handleLoadMore = () => {
    setMarkerValue(prev => prev + 100);
  };

  const handleGoBack = () => {
    if (markerValue >= 100) {
      setMarkerValue(prev => prev - 100);
    }
  };

  const handleReload = () => {
    if (markerValue === 0) {
      fetchLogs(0);
    } else {
      setMarkerValue(0);
    }
  };

  const handleClearLog = () => {
    // We will implement actual clear logic later.
    toast.success('Clear Log functionality will be implemented soon!');
  };

  const parseLogLine = (line: string, index: number) => {
    if (!line.trim()) return null;

    // Decode HTML entities
    let decoded = line
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    // Try to match standard format: [timestamp] logger.LEVEL: message
    const match = decoded.match(/^\[(.*?)\]\s+([\w-]+\.\w+):\s*(.*)$/);
    if (match) {
      const timestamp = match[1];
      const level = match[2];
      const rest = match[3];

      // Find JSON/UID at the end if any
      const uidMatch = rest.match(/(\s*\[\]\s*)?(\{.*\})$/);
      let message = rest;
      let uidObj = '';
      if (uidMatch) {
        message = rest.slice(0, rest.lastIndexOf(uidMatch[0] || ''));
        uidObj = (uidMatch[1] || '') + (uidMatch[2] || '');
      }

      const isError = level.toUpperCase().includes('ERROR') || level.toUpperCase().includes('CRITICAL');
      const isWarn = level.toUpperCase().includes('WARN');

      let levelColor = 'text-green-400';
      if (isError) levelColor = 'text-red-400';
      if (isWarn) levelColor = 'text-orange-400';

      return (
        <div key={index} className="font-mono text-[12px] leading-relaxed mb-1 break-words hover:bg-white/5 px-2 rounded py-0.5 transition-colors flex items-start">
          <span className="text-teal-400 mr-2 shrink-0">[{timestamp}]</span>
          <span className={`${levelColor} font-bold mr-2 shrink-0`}>{level}:</span>
          <span className="text-gray-300">{message}</span>
          {uidObj && <span className="text-yellow-400 ml-2">{uidObj}</span>}
        </div>
      );
    }

    // Fallback for non-standard lines
    return (
      <div key={index} className="font-mono text-[12px] text-gray-300 leading-relaxed mb-1 break-words hover:bg-white/5 px-2 rounded py-0.5 transition-colors">
        {decoded}
      </div>
    );
  };

  const renderPaginationButtons = () => (
    <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
      <button
        onClick={handleGoBack}
        disabled={markerValue === 0 || isLoading}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#2d3a6c] hover:bg-[#3b4b8a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded shadow-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Go back
      </button>
      <button
        onClick={handleLoadMore}
        disabled={!hasMoreLogs || isLoading}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#2d3a6c] hover:bg-[#3b4b8a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded shadow-sm transition-colors"
      >
        Load More..
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 relative min-h-full flex flex-col h-full">

      {/* Header */}
      <div className="mb-6 mt-2 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">System Log</h1>
          <p className="text-[13px] text-[#8b9bb4] font-medium tracking-wide">Real-time system activities and debugging information (recent first)</p>
        </div>
        <button
          onClick={handleReload}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-bold rounded shadow-sm transition-colors"
          title="Reload Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 flex-1 flex flex-col h-full">
        <div className="bg-[#1b202c] rounded-lg p-6 border border-gray-800 shadow-sm flex flex-col gap-4 flex-1 h-full min-h-0">

          <div className="w-full shrink-0 flex items-center justify-between relative">
            <div className="flex justify-between items-center w-full relative z-10">
              <h2 className="text-[14px] font-bold text-white">Application Logs</h2>
              
              {renderPaginationButtons()}

              <button
                onClick={handleClearLog}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-bold rounded shadow-sm transition-colors ml-auto"
              >
                <Trash className="w-4 h-4" />
                Clear System Log
              </button>
            </div>
          </div>
          
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent shrink-0" />

          {/* Log Viewer Terminal */}
          <div className="bg-[#0f131a] border border-gray-800 rounded-md p-4 flex-1 min-h-[400px] overflow-y-auto relative shadow-inner">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0f131a]/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-300 font-medium text-[13px] tracking-wide">Loading Logs...</p>
              </div>
            )}
            <div className="flex flex-col">
              {logs.length > 0 ? (
                logs.map((line, idx) => parseLogLine(line, idx))
              ) : (
                !isLoading && <div className="text-gray-500 font-mono text-[13px] text-center mt-10">No logs available.</div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 flex items-center relative pt-2">
            {renderPaginationButtons()}

            <button
              onClick={handleClearLog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-bold rounded shadow-sm transition-colors ml-auto"
            >
              <Trash className="w-4 h-4" />
              Clear System Log
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
