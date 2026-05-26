'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export interface Project {
  project_id: string;
  project_name: string;
  site_coordinates?: string;
  site_address?: string;
  start_date?: string;
  status?: string;
  geofence_ready?: string;
  geofence_json?: unknown;
}

export interface MenuItem {
  menu_type: string | number | boolean;
  menu_item: string | boolean;
  slug: string | boolean;
  order_id?: string | number;
}

interface AuthContextType {
  user: {
    displayName: string;
    groupName: string;
  } | null;
  menu: MenuItem[];
  frontendVersion: string | null;
  projects: Project[];
  defaultProject: string | null;
  isLoadingAppData: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  menu: [], 
  frontendVersion: null, 
  projects: [], 
  defaultProject: null, 
  isLoadingAppData: true, 
  logout: () => {} 
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ displayName: string; groupName: string } | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [frontendVersion, setFrontendVersion] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [defaultProject, setDefaultProject] = useState<string | null>(null);
  const [isLoadingAppData, setIsLoadingAppData] = useState<boolean>(true);
  const [isLoggedOutModal, setIsLoggedOutModal] = useState(false);

  // Core logout function
  const triggerLogout = useCallback(() => {
    setIsLoggedOutModal(true);
    localStorage.removeItem('u_x6yEui0t');
    localStorage.removeItem('g_3b7z1kw');
    localStorage.removeItem('at_ki8Xq1iV');
    localStorage.removeItem('p_v7Ykz3ui9x');
    
    // Auto redirect after allowing user to process the message
    setTimeout(() => {
      setIsLoggedOutModal(false);
      router.push('/');
    }, 2500);
  }, [router]);

  // Core session validation function
  const validateSession = useCallback(async () => {
    // 1. Check if tokens exist
    const token1 = localStorage.getItem('u_x6yEui0t');
    const token2 = localStorage.getItem('g_3b7z1kw');
    const token3 = localStorage.getItem('at_ki8Xq1iV');

    if (!token1 || !token2 || !token3) {
      setIsLoadingAppData(false);
      triggerLogout();
      return;
    }

    // 2. Refresh Remote Session
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token3}`
        }
      });

      if (!response.ok) {
        setIsLoadingAppData(false);
        triggerLogout();
        return;
      }

      const rawText = await response.text();
      let dataArr;
      try {
          dataArr = JSON.parse(rawText);
      } catch {
         setIsLoadingAppData(false);
         triggerLogout();
         return;
      }

      const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;

      if (data && String(data.Status) === "1" && data.User_Data && data.User_Data.length > 0) {
        const userData = data.User_Data[0];
        
        // Update valid user state
        setUser({
          displayName: userData.display_name || "User",
          groupName: userData.grp_name || "Role"
        });

        // Update valid menu state
        if (data.Menu_Data && Array.isArray(data.Menu_Data)) {
          setMenu(data.Menu_Data);
        } else {
          setMenu([]);
        }

        // Set Frontend Version
        if (data.System_Data && data.System_Data.frontendVersion) {
          setFrontendVersion(data.System_Data.frontendVersion);
        }

        // Set Projects & Default Project ID
        if (data.My_Projects && Array.isArray(data.My_Projects)) {
          setProjects(data.My_Projects);
        } else {
          setProjects([]);
        }

        if (data.System_Data && data.System_Data.default_project) {
          setDefaultProject(String(data.System_Data.default_project));
        } else {
          setDefaultProject(null);
        }

        setIsLoadingAppData(false);

        // Store CSV requirement globally
        if(userData.projects_csv) {
          localStorage.setItem('p_v7Ykz3ui9x', userData.projects_csv);
        }
        
        // Store Default GST
        if(data.System_Data && data.System_Data.default_gst) {
          localStorage.setItem('sys_default_gst', data.System_Data.default_gst);
        }

      } else {
        setIsLoadingAppData(false);
        triggerLogout();
      }

    } catch (error) {
       console.error("Session Validation Error:", error);
       setIsLoadingAppData(false);
       triggerLogout();
    }
  }, [triggerLogout]);

  useEffect(() => {
    // Engage Auth guard on all protected routes (anything that isn't the / root login component)
    if (pathname && pathname !== '/') {
      
      // 1. Check local storage synchronously to catch unauthorized users immediately
      const token1 = localStorage.getItem('u_x6yEui0t');
      const token2 = localStorage.getItem('g_3b7z1kw');
      const token3 = localStorage.getItem('at_ki8Xq1iV');

      if (!token1 || !token2 || !token3) {
        setTimeout(() => triggerLogout(), 0);
        return;
      }

      // 2. Add an explicit mount delay for the remote validation to allow the backend 
      // database replicas to sync the new access token. (Fixes immediate logout lag issue)
      const mountTimer = setTimeout(() => {
        validateSession();
      }, 2500);

      // 3. Check on every document visibility change (regaining tab focus)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          validateSession();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        clearTimeout(mountTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [pathname, validateSession, triggerLogout]);

  return (
    <AuthContext.Provider value={{ user, menu, frontendVersion, projects, defaultProject, isLoadingAppData, logout: triggerLogout }}>
      {children}
      
      {/* Global Logout Modal Overlay */}
      {isLoggedOutModal && (
         <div className="fixed inset-0 bg-[#0a0a0a]/80 z-[9999] flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300">
          <div className="bg-[#191e2b] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-5 shadow-2xl relative w-[350px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-white font-bold text-xl tracking-wide">
                Oops! You are logged out
              </h2>
              <p className="text-gray-400 text-sm">
                You can re-login to continue. Redirecting...
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
