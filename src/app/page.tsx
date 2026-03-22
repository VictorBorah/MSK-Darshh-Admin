'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  X, 
  XCircle, 
  CheckCircle 
} from 'lucide-react';
import CryptoJS from 'crypto-js';

// Import Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const API_ENDPOINT = `${process.env.NEXT_PUBLIC_API_BASE_URL}access/getAdminAccessToken`;

export default function Login() {
  const router = useRouter();
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('Signing you in...');
  const [modalSubText, setModalSubText] = useState('');
  const [modalStatus, setModalStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const showModal = (
    text: string, 
    status: 'loading' | 'success' | 'error' = 'loading', 
    subText: string = ''
  ) => {
    setModalText(text);
    setModalStatus(status);
    setModalSubText(subText);
    setModalVisible(true);
  };

  // Mount Effect: Automatically bypass Login if session tokens exist
  useEffect(() => {
    const token1 = localStorage.getItem('u_x6yEui0t');
    const token2 = localStorage.getItem('g_3b7z1kw');
    const token3 = localStorage.getItem('at_ki8Xq1iV');

    if (token1 && token2 && token3) {
      showModal('You are already logged in', 'success', 'Redirecting..');
      
      // Auto redirect after allowing user to see the success message
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    }
  }, [router]);

  const closeModal = () => {
    setModalVisible(false);
  };

  const processApiResponse = async (response: Response, displayUser: string) => {
    const rawText = await response.text();
    let dataArr;
    
    try {
        dataArr = JSON.parse(rawText);
    } catch(e) {
        throw new Error("Invalid server response format.");
    }

    const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;

    if (response.ok && data && data.Status === 1) {
        // 1. Temporarily store credentials for the upcoming check
        const profileId = data.Profile_ID;
        const usrGrp = data.Usr_Grp;
        const accessToken = data.Access_Token;

        // 2. Validate session by fetching app data via Bearer token immediately
        try {
           showModal(`Securing session...`, 'loading');
           const validationEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`;
           const validationResponse = await fetch(validationEndpoint, {
             method: 'GET',
             headers: {
               'Authorization': `Bearer ${accessToken}`
             }
           });

           if (!validationResponse.ok) throw new Error("Backend validation failed");
           
           const valRaw = await validationResponse.text();
           const valArr = JSON.parse(valRaw);
           const valData = Array.isArray(valArr) ? valArr[0] : valArr;

           if (valData && String(valData.Status) === "1") {
               // 3. Official Save
               localStorage.setItem('u_x6yEui0t', profileId);
               localStorage.setItem('g_3b7z1kw', usrGrp);
               localStorage.setItem('at_ki8Xq1iV', accessToken);

               if(valData.User_Data && valData.User_Data.length > 0 && valData.User_Data[0].projects_csv) {
                  localStorage.setItem('p_v7Ykz3ui9x', valData.User_Data[0].projects_csv);
               }

               showModal(`Welcome back, ${displayUser}!`, 'success', 'Redirecting You..');
               setTimeout(() => { 
                 router.push('/home'); 
               }, 1500);

           } else {
             throw new Error("Session verification declined by host.");
           }

        } catch (validationErr) {
           throw new Error("Could not initialize secure session. Please try again.");
        }

    } else {
        throw new Error(data.Message || 'Server rejected authentication.');
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showModal("Please enter both your email/mobile and password.", "error");
      return;
    }

    showModal('Authenticating credentials...', 'loading');

    try {
      // SECURITY WARNING: Storing an encryption key in NEXT_PUBLIC exposes it to the browser client.
      // Anyone intercepting the client bundle can reverse-engineer the encryption payload.
      // Consider migrating this logic to a Next.js API Route (Server Action) to keep the key private.
      const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "";
      const payloadStr = '{"Mob":"' + email + '","Pwd":"' + password + '"}';
      const ciphertext = CryptoJS.AES.encrypt(payloadStr, key);
      const cipherString = ciphertext.toString();

      const formData = new FormData();
      formData.append('auth_type', 'credentials');
      formData.append('token', cipherString);

      const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          body: formData
      });

      await processApiResponse(response, email.split('@')[0] || 'User');

    } catch (error: any) {
        console.error("Credentials Auth Error:", error);
        showModal(error.message || "Authentication failed.", "error");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      showModal('Verifying with server...', 'loading');

      const formData = new FormData();
      formData.append('auth_type', 'google');
      formData.append('idtoken', idToken);
      
      const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          body: formData
      });

      await processApiResponse(response, user.displayName || user.email || 'User');

    } catch (error: any) {
        console.error("Google Auth Error:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
            showModal(error.message || "Authentication failed.", "error");
        }
    }
  };

  return (
    <div className="bg-[#1a202c] text-gray-300 font-sans text-sm h-screen flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center justify-center mb-8 gap-3">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/20">
             <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-white text-2xl tracking-tight">ZYN</h1>
            <span className="text-xs text-gray-400 uppercase tracking-wider">CONSTRUCTIONS MANAGEMENT NETWORK</span>
          </div>
        </div>

        <div className="bg-[#171923] border border-gray-800 rounded-lg shadow-2xl overflow-hidden p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>
          
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">Email / Mobile Number</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@darshh.com" 
                  className="w-full bg-[#1a202c] border border-gray-700 text-gray-300 text-sm rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-gray-400">Password</label>
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#1a202c] border border-gray-700 text-gray-300 text-sm rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md flex justify-center items-center gap-2 transition-colors shadow-sm">
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4">
            <hr className="w-full border-gray-800" />
            <span className="text-xs text-gray-500 whitespace-nowrap">Or continue with</span>
            <hr className="w-full border-gray-800" />
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin} 
              type="button"
              className="w-full px-4 py-2.5 bg-[#1a202c] border border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium rounded-md flex justify-center items-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-600">
          &copy; 2026 ZYN All rights reserved. Version 1.0.1
        </div>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-[#171923] border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center gap-4 shadow-xl transform transition-transform duration-300 relative w-80 h-52 max-w-[90vw]">
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors focus:outline-none" 
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            {modalStatus === 'loading' && <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
            {modalStatus === 'success' && <CheckCircle className="w-10 h-10 text-[#38b2ac]" />}
            {modalStatus === 'error' && <XCircle className="w-10 h-10 text-red-500" />}

            <div className="flex flex-col items-center gap-1">
              <p className="text-white font-medium text-base text-center leading-tight">
                {modalText}
              </p>
              {modalSubText && (
                <p className="text-gray-400 text-sm text-center">
                  {modalSubText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
