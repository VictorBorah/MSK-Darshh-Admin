'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, MenuItem } from '@/components/providers/AuthProvider';
import { useLayoutState } from '@/components/providers/LayoutProvider';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  Box, 
  ShoppingCart,
  IndianRupee,
  Files,
  Blocks,
  FileMinus,
  Settings,
  CircleDot,
  Clock,
  X,
  LayoutList,
  ListChecks,
  UserCheck,
  ClipboardList,
  Camera,
  Tag,
  Warehouse,
  ChevronDown
} from 'lucide-react';

export default function Sidebar() {
  const { menu, user, frontendVersion } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useLayoutState();
  const pathname = usePathname();

  // Helper function to map a known slug to a specific Lucide icon
  const getIconForSlug = (slug: string, className: string = "w-4 h-4 shrink-0") => {
    switch(slug) {
      case 'dashboard': return <LayoutDashboard className={className} />;
      case 'projects': return <Box className={className} />;
      case 'staff-members': return <Users className={className} />;
      case 'procurements': return <ShoppingCart className={className} />;
      case 'payments': return <IndianRupee className={className} />;
      case 'supply-ledger': return <Files className={className} />;
      case 'stock-inventory': return <Blocks className={className} />;
      case 'item-categories': return <FileMinus className={className} />;
      case 'item-master': return <Box className={className} />;
      case 'vendor-master': return <Users className={className} />;
      case 'system-settings': return <Settings className={className} />;
      case 'sys-log': return <Clock className={className} />;
      case 'user-groups': return <Users className={className} />;
      case 'menu-config': return <LayoutList className={className} />;
      case 'demands': return <ListChecks className={className} />;
      case 'clients': return <UserCheck className={className} />;
      case 'budget-heads': return <ClipboardList className={className} />;
      case 'gps-photos': return <Camera className={className} />;
      case 'utility-tags': return <Tag className={className} />;
      case 'warehouses': return <Warehouse className={className} />;
      default: return <CircleDot className={className} />;
    }
  };

  // Helper to safely sort menu items by order_id ascending
  const sortMenuByOrder = (a: MenuItem, b: MenuItem) => {
    const orderA = a.order_id !== undefined && a.order_id !== null ? parseInt(String(a.order_id), 10) : 9999;
    const orderB = b.order_id !== undefined && b.order_id !== null ? parseInt(String(b.order_id), 10) : 9999;
    return orderA - orderB;
  };

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Auto-expand group if a child item is currently active
  useEffect(() => {
    if (!menu || menu.length === 0) return;
    
    const activeItem = menu.find(item => {
      if (String(item.is_submenu_item) === "1" && item.parent_id) {
        const slug = String(item.slug) === 'staff' ? 'staff-members' : String(item.slug);
        return pathname === `/${slug}`;
      }
      return false;
    });

    if (activeItem && activeItem.parent_id) {
      setExpandedGroup(String(activeItem.parent_id));
    }
  }, [pathname, menu]);

  const handleGroupClick = (parentId: string) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setExpandedGroup(parentId);
    } else {
      setExpandedGroup(prev => (prev === parentId ? null : parentId));
    }
  };

  const getIconForGroup = (groupLabel: string, className: string = "w-4 h-4 shrink-0") => {
    switch(groupLabel.toLowerCase()) {
      case 'financial': return <IndianRupee className={className} />;
      case 'inventory': return <Warehouse className={className} />;
      case 'privileges': return <UserCheck className={className} />;
      case 'utility': return <Tag className={className} />;
      default: return <CircleDot className={className} />;
    }
  };

  type RenderableItem = 
    | { type: 'item'; data: MenuItem }
    | { type: 'group'; parentId: string; label: string; items: MenuItem[] };

  const buildRenderableMenu = (sortedItems: MenuItem[]): RenderableItem[] => {
    const result: RenderableItem[] = [];
    const seenGroups = new Set<string>();
    
    const groupItemsMap: Record<string, MenuItem[]> = {};
    const groupLabelMap: Record<string, string> = {};
    
    sortedItems.forEach(item => {
      if (String(item.is_submenu_item) === "1" && item.parent_id) {
        const parentId = String(item.parent_id);
        if (!groupItemsMap[parentId]) {
          groupItemsMap[parentId] = [];
          groupLabelMap[parentId] = String(item.parent_group) || `Group ${parentId}`;
        }
        groupItemsMap[parentId].push(item);
      }
    });
    
    sortedItems.forEach(item => {
      if (String(item.is_submenu_item) === "1" && item.parent_id) {
        const parentId = String(item.parent_id);
        if (!seenGroups.has(parentId)) {
          seenGroups.add(parentId);
          result.push({
            type: 'group',
            parentId,
            label: groupLabelMap[parentId],
            items: groupItemsMap[parentId]
          });
        }
      } else {
        result.push({
          type: 'item',
          data: item
        });
      }
    });
    
    return result;
  };

  // Split menus into categories and sort them by order_id ascending
  const sortedLocal = menu
    .filter((item) => String(item.menu_type) === "1")
    .sort(sortMenuByOrder);

  const sortedMaster = menu
    .filter((item) => String(item.menu_type) === "2")
    .sort(sortMenuByOrder);

  const localRenderable = buildRenderableMenu(sortedLocal);
  const masterRenderable = buildRenderableMenu(sortedMaster);

  // Helper to render individual menu items dynamically
  const renderMenuItem = (item: MenuItem) => {
    const slug = String(item.slug) === 'staff' ? 'staff-members' : String(item.slug);
    const isActive = pathname === `/${slug}`;
    
    // Active / Inactive Base Styles
    const baseClasses = "group relative flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors w-full";
    const activeClasses = isActive 
      ? "bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500" 
      : "hover:bg-gray-800 text-gray-400";

    return (
      <Link 
        key={slug} 
        href={`/${slug}`} 
        onClick={() => setSidebarOpen(false)}
        className={`${baseClasses} ${activeClasses}`}
      >
        {getIconForSlug(slug)}
        <span className={`truncate ${sidebarOpen ? '' : 'md:hidden'}`}>{String(item.menu_item)}</span>

        {/* Hover Tooltip */}
        <div className={`absolute left-full ml-4 px-2.5 py-1.5 bg-[#1f2536] text-white text-xs rounded-md shadow-xl border border-gray-700 opacity-0 ${sidebarOpen ? '' : 'md:group-hover:opacity-100'} pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap`}>
          {String(item.menu_item)}
        </div>
      </Link>
    );
  };

  const renderMenuGroup = (parentId: string, label: string, items: MenuItem[]) => {
    const isExpanded = expandedGroup === parentId && sidebarOpen;
    const isAnyChildActive = items.some(item => {
      const slug = String(item.slug) === 'staff' ? 'staff-members' : String(item.slug);
      return pathname === `/${slug}`;
    });

    return (
      <div key={`group-${parentId}`} className="flex flex-col w-full">
        {/* Group Header Button */}
        <button
          onClick={() => handleGroupClick(parentId)}
          className={`group relative flex items-center justify-between px-3 py-1.5 rounded-md transition-colors w-full text-left text-gray-400 hover:bg-gray-800 hover:text-gray-200 cursor-pointer ${
            isAnyChildActive ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            {getIconForGroup(label)}
            <span className={`truncate ${sidebarOpen ? '' : 'md:hidden'}`}>{label}</span>
          </div>

          <div className={`flex items-center shrink-0 ${sidebarOpen ? '' : 'md:hidden'}`}>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
          </div>

          {/* Hover Tooltip */}
          <div className={`absolute left-full ml-4 px-2.5 py-1.5 bg-[#1f2536] text-white text-xs rounded-md shadow-xl border border-gray-700 opacity-0 ${sidebarOpen ? '' : 'md:group-hover:opacity-100'} pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap`}>
            {label}
          </div>
        </button>

        {/* Nested Child Items */}
        {isExpanded && (
          <div className="mt-1 pl-4 flex flex-col gap-1 border-l border-gray-800/80 ml-5 transition-all duration-200">
            {items.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  const renderRenderableItem = (item: RenderableItem) => {
    if (item.type === 'item') {
      return renderMenuItem(item.data);
    } else {
      return renderMenuGroup(item.parentId, item.label, item.items);
    }
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen shrink-0 bg-gradient-to-t from-teal-900/40 via-[#191e2b] to-[#191e2b] border-r border-gray-800 text-gray-300 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[260px] translate-x-0 md:relative' : 'w-[260px] md:w-16 -translate-x-full md:translate-x-0 md:relative'}
        `}
      >
        {/* Sidebar Header Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-800 h-16 shrink-0 relative">
          <div className="bg-blue-600 rounded-md p-1.5 flex items-center justify-center shrink-0">
             <Box className="w-5 h-5 text-white" />
          </div>
          <div className={`flex flex-col overflow-hidden ${sidebarOpen ? '' : 'md:hidden'}`}>
            <span className="font-bold text-gray-100 leading-tight truncate">ZYN</span>
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 flex flex-col gap-1 text-[13px] font-medium">
          
          {/* Root Dashboard Navigation */}
          <Link 
             href="/home" 
             onClick={() => setSidebarOpen(false)}
             className={`group relative flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors w-full ${
               pathname === '/home' 
                ? 'bg-[#2d3a6c]/40 text-blue-400 border-l-2 border-blue-500' 
                : 'hover:bg-gray-800 text-gray-400'
             }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className={`truncate ${sidebarOpen ? '' : 'md:hidden'}`}>Home</span>

            <div className={`absolute left-full ml-4 px-2.5 py-1.5 bg-[#1f2536] text-white text-xs rounded-md shadow-xl border border-gray-700 opacity-0 ${sidebarOpen ? '' : 'md:group-hover:opacity-100'} pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap`}>
              Home
            </div>
          </Link>
          
          {/* Menu Skeleton Loader */}
          {!user && (
            <div className="mt-4 flex flex-col gap-3 px-3">
              <div className={`h-3 bg-gray-800 rounded animate-pulse mb-1 ${sidebarOpen ? 'w-12' : 'w-8 md:mx-auto'}`}></div>
              <div className="h-8 w-full bg-gray-800/60 rounded animate-pulse"></div>
              <div className="h-8 w-full bg-gray-800/60 rounded animate-pulse"></div>
              <div className="h-8 w-full bg-gray-800/60 rounded animate-pulse"></div>
              
              <div className={`mt-4 h-3 bg-gray-800 rounded animate-pulse mb-1 ${sidebarOpen ? 'w-16' : 'w-8 md:mx-auto'}`}></div>
              <div className="h-8 w-full bg-gray-800/60 rounded animate-pulse"></div>
              <div className="h-8 w-full bg-gray-800/60 rounded animate-pulse"></div>
            </div>
          )}

          {/* Dynamic Category 1: Local */}
          {user && localRenderable.length > 0 && (
            <>
              <div className={`mt-3 mb-1.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${sidebarOpen ? 'text-left' : 'md:text-center text-left'}`}>
                <span className={`${sidebarOpen ? '' : 'md:hidden'}`}>Local</span>
                <span className={`hidden ${sidebarOpen ? '' : 'md:inline'} text-gray-600`}>--</span>
              </div>
              {localRenderable.map(renderRenderableItem)}
            </>
          )}

          {/* Dynamic Category 2: Master */}
          {user && masterRenderable.length > 0 && (
            <>
              <div className={`mt-3 mb-1.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${sidebarOpen ? 'text-left' : 'md:text-center text-left'}`}>
                <span className={`${sidebarOpen ? '' : 'md:hidden'}`}>Master</span>
                <span className={`hidden ${sidebarOpen ? '' : 'md:inline'} text-gray-600`}>--</span>
              </div>
              {masterRenderable.map(renderRenderableItem)}
            </>
          )}

        </div>
        
        {/* Gradient Separator */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-teal-500/30 to-transparent mt-auto shrink-0" />
        
        {/* Footer Version */}
        <div className={`p-4 text-xs text-teal-400/80 flex items-center bg-transparent overflow-hidden ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <span className={`shrink-0 ${sidebarOpen ? '' : 'md:hidden'}`}>Version {frontendVersion || '1.0.1'}</span>
        </div>
      </aside>
    </>
  );
}
