'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
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
  CircleDot
} from 'lucide-react';

export default function Sidebar() {
  const { menu } = useAuth();
  const pathname = usePathname();

  // Helper function to map a known slug to a specific Lucide icon
  const getIconForSlug = (slug: string, className: string = "w-4 h-4") => {
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
    
    // Active Item Styles
    if (isActive) {
      return (
        <Link 
          key={item.slug} 
          href={`/${item.slug}`} 
          className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500 transition-colors"
        >
          {getIconForSlug(item.slug)}
          {item.menu_item}
        </Link>
      );
    }

    // Inactive Item Styles
    return (
      <Link 
        key={item.slug} 
        href={`/${item.slug}`} 
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 text-gray-400 transition-colors"
      >
        {getIconForSlug(item.slug)}
        {item.menu_item}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-[#191e2b] border-r border-gray-800 flex flex-col h-screen shrink-0 text-gray-300">
      
      {/* Sidebar Header Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-800 h-16 shrink-0">
        <div className="bg-blue-600 rounded-md p-1.5 flex items-center justify-center shrink-0">
           <Box className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-100 leading-tight">DARSH</span>
          <span className="text-[10px] text-gray-400 font-medium">CONSTRUCTION MANAGEMENT</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 text-sm font-medium">
        
        {/* Root Dashboard Navigation */}
        <Link 
           href="/home" 
           className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
             pathname === '/home' 
              ? 'bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500' 
              : 'hover:bg-gray-800 text-gray-400'
           }`}
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        
        {/* Dynamic Category 1: Local */}
        {localMenu.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Local
            </div>
            {localMenu.map(renderMenuItem)}
          </>
        )}

        {/* Dynamic Category 2: Master */}
        {masterMenu.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Master
            </div>
            {masterMenu.map(renderMenuItem)}
          </>
        )}

      </div>
      
      {/* Footer Version */}
      <div className="p-4 text-xs text-gray-500 border-t border-gray-800 flex justify-between items-center bg-[#191e2b] mt-auto">
        <span>1.0.0</span>
      </div>
    </aside>
  );
}
