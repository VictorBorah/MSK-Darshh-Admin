'use client';

import { Home, Bell, User, ChevronDown, LogOut, UserCircle, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLayoutState } from '@/components/providers/LayoutProvider';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayoutState();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-gray-800 bg-[#161a25] flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button 
          onClick={toggleSidebar}
          className="p-1 mr-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="hover:text-gray-200 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span>/</span>
        <span className="hover:text-gray-200 cursor-pointer transition-colors">local</span>
        <span>/</span>
        <span className="text-gray-200 font-medium">Projects</span>
      </div>

      <div className="flex items-center gap-5 relative">
        <button className="text-gray-400 hover:text-white relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#161a25]"></span>
        </button>

        {/* User Flyout Menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 hover:bg-gray-800/50 p-1.5 pr-2 rounded-lg transition-colors border border-transparent hover:border-gray-800"
          >
            <div className="bg-[#2d3a6c] p-1.5 rounded-md">
               <User className="w-4 h-4 text-blue-200" />
            </div>
            
            <div className="flex flex-col items-start gap-0">
               <span className="text-sm font-medium text-gray-200 leading-tight">
                 {user ? user.displayName : 'Loading...'}
               </span>
               <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                 {user ? user.groupName : 'User Role'}
               </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ml-1 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1f2536] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              
              {/* Header inside flyout */}
              <div className="px-4 py-3 border-b border-gray-800 mb-2">
                <p className="text-sm font-medium text-white">{user?.displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.groupName}</p>
              </div>

              {/* Action Links */}
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2d3a6c]/30 hover:pl-5 transition-all"
              >
                <UserCircle className="w-4 h-4 text-gray-400" />
                My Profile
              </button>

              <div className="my-1.5 border-t border-gray-800/60"></div>

              <button 
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:pl-5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
