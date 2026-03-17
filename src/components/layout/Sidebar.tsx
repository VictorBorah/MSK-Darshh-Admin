'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLayoutState } from '@/components/providers/LayoutProvider';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  Box, 
  ShoppingCart,
  TrendingUp,
  Files,
  Blocks,
  FileMinus,
  Settings,
  CircleDot,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { menu } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useLayoutState();
  const pathname = usePathname();

  // Helper function to map a known slug to a specific Lucide icon
  const getIconForSlug = (slug: string, className: string = "w-4 h-4 shrink-0") => {
    switch(slug) {
      case 'dashboard': return <LayoutDashboard className={className} />;
      case 'projects': return <Box className={className} />;
      case 'staff': return <Users className={className} />;
      case 'procurements': return <ShoppingCart className={className} />;
      case 'payments': return <TrendingUp className={className} />;
      case 'supply-ledger': return <Files className={className} />;
      case 'stock-inventory': return <Blocks className={className} />;
      case 'item-categories': return <FileMinus className={className} />;
      case 'item-master': return <Box className={className} />;
      case 'vendor-master': return <Users className={className} />;
      case 'system-settings': return <Settings className={className} />;
      default: return <CircleDot className={className} />;
    }
  };

  // Split menus into categories
  const localMenu = menu.filter((item) => item.menu_type === "1");
  const masterMenu = menu.filter((item) => item.menu_type === "2");

  // Helper to render individual menu items dynamically
  const renderMenuItem = (item: {slug: string, menu_item: string, menu_type: string}) => {
    const isActive = pathname === `/${item.slug}`;
    
    // Active / Inactive Base Styles
    const baseClasses = "group relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full";
    const activeClasses = isActive 
      ? "bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500" 
      : "hover:bg-gray-800 text-gray-400";

    return (
      <Link 
        key={item.slug} 
        href={`/${item.slug}`} 
        onClick={() => setSidebarOpen(false)}
        className={`${baseClasses} ${activeClasses}`}
      >
        {getIconForSlug(item.slug)}
        <span className="md:hidden lg:inline truncate">{item.menu_item}</span>

        {/* Hover Tooltip (Only visible on md screens when width is w-16) */}
        <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1f2536] text-white text-xs rounded-md shadow-xl border border-gray-700 opacity-0 md:group-hover:opacity-100 lg:group-hover:opacity-0 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
          {item.menu_item}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen shrink-0 bg-[#191e2b] border-r border-gray-800 text-gray-300 transition-all duration-300 ease-in-out
          w-64 md:w-16 lg:w-64 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}
        `}
      >
        {/* Sidebar Header Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-800 h-16 shrink-0 relative">
          <div className="bg-blue-600 rounded-md p-1.5 flex items-center justify-center shrink-0">
             <Box className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col md:hidden lg:flex overflow-hidden">
            <span className="font-bold text-gray-100 leading-tight truncate">DARSH</span>
            <span className="text-[10px] text-gray-400 font-medium truncate">WORKSPACE</span>
          </div>

          {/* Close button strictly for mobile */}
          <button 
            className="md:hidden absolute right-4 text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 flex flex-col gap-1 text-sm font-medium">
          
          {/* Root Dashboard Navigation */}
          <Link 
             href="/home" 
             onClick={() => setSidebarOpen(false)}
             className={`group relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${
               pathname === '/home' 
                ? 'bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500' 
                : 'hover:bg-gray-800 text-gray-400'
             }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="md:hidden lg:inline truncate">Home</span>

            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1f2536] text-white text-xs rounded-md shadow-xl border border-gray-700 opacity-0 md:group-hover:opacity-100 lg:group-hover:opacity-0 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
              Home
            </div>
          </Link>
          
          {/* Dynamic Category 1: Local */}
          {localMenu.length > 0 && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider md:text-center lg:text-left">
                <span className="md:hidden lg:inline">Local</span>
                <span className="hidden md:inline lg:hidden text-gray-600">--</span>
              </div>
              {localMenu.map(renderMenuItem)}
            </>
          )}

          {/* Dynamic Category 2: Master */}
          {masterMenu.length > 0 && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider md:text-center lg:text-left">
                <span className="md:hidden lg:inline">Master</span>
                <span className="hidden md:inline lg:hidden text-gray-600">--</span>
              </div>
              {masterMenu.map(renderMenuItem)}
            </>
          )}

        </div>
        
        {/* Footer Version */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-800 flex justify-between items-center bg-[#191e2b] mt-auto md:justify-center lg:justify-between overflow-hidden">
          <span className="md:hidden lg:inline shrink-0">1.0.1</span>
        </div>
      </aside>
    </>
  );
}
