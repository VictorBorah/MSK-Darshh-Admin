'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType>({ 
  sidebarOpen: false, 
  setSidebarOpen: () => {},
  toggleSidebar: () => {}
});

export const useLayoutState = () => useContext(LayoutContext);

export default function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState) {
      setSidebarOpen(savedState === 'true');
    }
  }, []);

  const handleSetSidebarOpen = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
    localStorage.setItem('sidebarOpen', String(isOpen));
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', String(newState));
      return newState;
    });
  }

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen: handleSetSidebarOpen, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
}
