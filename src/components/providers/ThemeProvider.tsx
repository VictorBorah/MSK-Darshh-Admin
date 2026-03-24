'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const savedTheme = localStorage.getItem('theme_preference') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply class to body
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    
    // Save preference
    localStorage.setItem('theme_preference', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const lightThemeCSS = `
    body.light-theme {
      --background: #f0f2f5 !important;
      --foreground: #000000 !important;
      background-color: #f0f2f5 !important;
      color: #000000 !important;
    }
    
    /* Global Base */
    body.light-theme .bg-\\[\\#11141e\\],
    body.light-theme .bg-slate-900,
    body.light-theme .bg-\\[\\#0c101a\\] {
      background-color: #f0f2f5 !important;
    }

    /* Modals & Panels */
    body.light-theme .bg-\\[\\#1c2130\\],
    body.light-theme .bg-\\[\\#191e2b\\],
    body.light-theme .bg-\\[\\#1f2536\\],
    body.light-theme .bg-\\[\\#161a25\\],
    body.light-theme .bg-\\[\\#252b3d\\],
    body.light-theme .bg-\\[\\#2a303d\\],
    body.light-theme .bg-\\[\\#323847\\],
    body.light-theme .bg-gray-800,
    body.light-theme .bg-gray-900 {
      background-color: #ffffff !important;
      border-color: #e5e7eb !important;
    }

    /* Inputs */
    body.light-theme .bg-\\[\\#eee0e0\\] {
      background-color: #f9fafb !important;
      border: 1px solid #d1d5db !important;
      color: #000000 !important;
    }

    /* Borders */
    body.light-theme .border-gray-800,
    body.light-theme .border-gray-700,
    body.light-theme .border-gray-600 {
      border-color: #e5e7eb !important;
    }

    /* Headings */
    body.light-theme h1,
    body.light-theme h2,
    body.light-theme h3,
    body.light-theme h4,
    body.light-theme h5 {
      color: #11141E !important;
    }

    /* Text */
    body.light-theme .text-white,
    body.light-theme .text-gray-200,
    body.light-theme .text-gray-300,
    body.light-theme .text-gray-400,
    body.light-theme .text-gray-500,
    body.light-theme .text-\\[\\#ccd6f6\\] {
      color: #2b303c !important;
    }

    /* Inputs Focus Color */
    body.light-theme input,
    body.light-theme select {
      color: #000000 !important;
    }

    /* Opacities & Modal Backgrounds */
    body.light-theme .bg-black\\/60 {
      background-color: rgba(255, 255, 255, 0.4) !important;
    }
    body.light-theme .bg-\\[\\#11141e\\]\\/50,
    body.light-theme .bg-\\[\\#191e2b\\]\\/50 {
      background-color: #f8fafc !important; /* Soft modal off-white */
    }

    /* Modal Inputs & Data ReadOnly Blocks */
    body.light-theme .bg-\\[\\#1e293b\\] {
      background-color: #ffffff !important;
      color: #11141e !important;
      border-color: #cbd5e1 !important;
    }
    body.light-theme .text-\\[\\#e2e8f0\\] {
      color: #11141e !important; /* Dark text for modal properties */
    }

    /* Standard Modal Button Controls (Cancel) */
    body.light-theme .bg-gray-700 {
      background-color: #4b5563 !important;
      color: #ffffff !important;
    }

    /* --- User Requested Refinements --- */
    
    /* 1) Brand Logo Title "ZYN" darker color */
    body.light-theme .text-gray-100 {
      color: #0f172a !important; /* Extra dark slate */
    }

    /* 2) Menu font color on mouse hover */
    body.light-theme .hover\\:text-white:hover {
      color: #2563eb !important; 
    }
    body.light-theme .hover\\:bg-gray-800:hover {
      background-color: #f1f5f9 !important;
    }

    /* 3) Info Boxes (Target SLA) green background / white text */
    body.light-theme .bg-emerald-900\\/20,
    body.light-theme .bg-emerald-600\\/20 {
      background-color: #059669 !important;
    }
    /* Bind white exclusively to nested info text so global emerald text can be dark */
    body.light-theme .bg-emerald-900\\/20 .text-emerald-400,
    body.light-theme .bg-emerald-600\\/20 .text-emerald-400 {
      color: #ffffff !important;
    }

    /* Status Blocks 'RUNNING' & Text Global Contrast */
    body.light-theme .text-emerald-400 {
      color: #047857 !important; /* Darker green */
    }
    body.light-theme .bg-emerald-500\\/20 {
      background-color: #d1fae5 !important;
      border-color: #a7f3d0 !important;
    }

    /* Modal Titles & HR Listed Pre-populated tags */
    body.light-theme .text-blue-200,
    body.light-theme .text-blue-300 {
      color: #1d4ed8 !important; /* Stronger dark blue */
    }
    body.light-theme .bg-blue-600\\/30 {
      background-color: #dbeafe !important; /* Kept light blue */
      border-color: #bfdbfe !important;
    }

    /* 4) Projects List Button Backgrounds Darker & White Text */
    body.light-theme .bg-blue-600\\/20 {
      background-color: #2563eb !important;
    }
    body.light-theme .bg-blue-600,
    body.light-theme .bg-\\[\\#2b6cb0\\] {
      color: #ffffff !important; /* Protect primary action and "Next/Finish Setup" buttons from white-inversion */
    }
    body.light-theme .text-blue-400 {
      color: #ffffff !important;
    }
    body.light-theme .bg-gray-700\\/50 {
      background-color: #4b5563 !important;
      color: #ffffff !important; /* Settings Button Exception */
    }
    body.light-theme .hover\\:bg-gray-600:hover {
      background-color: #374151 !important;
      color: #ffffff !important;
    }

    /* 5) Row Hover Colors in Projects List Table */
    body.light-theme .hover\\:bg-\\[\\#1f2536\\]:hover,
    body.light-theme .hover\\:bg-\\[\\#323847\\]:hover {
      background-color: #d3d3d3 !important;
    }

    /* 6) Start, Pause, Archive Actions Row Emphasized Background */
    body.light-theme .bg-transparent.border-gray-700 {
      background-color: #e5e7eb !important;
      color: #1f2937 !important;
      border-color: #d1d5db !important;
    }
    body.light-theme .hover\\:bg-\\[\\#252b3d\\]:hover {
      background-color: #d1d5db !important;
    }
  `;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {theme === 'light' && <style suppressHydrationWarning>{lightThemeCSS}</style>}
      <div 
        suppressHydrationWarning
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease-in' }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
