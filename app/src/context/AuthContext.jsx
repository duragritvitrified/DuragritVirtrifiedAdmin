import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

// =====================================================================
// DuraGrit Vitrified - Mobile Field App Authentication Context
// Authenticates strictly against live registered Users & Vendors
// =====================================================================

const AuthContext = createContext();

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export const getAppSessionKey = () => {
  if (typeof window !== 'undefined') {
    const port = String(window.location.port || '');
    if (port === '3001') {
      return 'duragrit_admin_session_port3001';
    }
    if (port === '3002') {
      return 'duragrit_vendor_session_port3002';
    }
    const params = new URLSearchParams(window.location.search);
    const app = params.get('app') || params.get('mode');
    if (app === 'admin') {
      return 'duragrit_admin_session_port3001';
    }
    return 'duragrit_vendor_session_port3002';
  }
  return 'duragrit_vendor_session_port3002';
};

// Clean purge of any legacy keys so old sessions never leak into new ports
try {
  localStorage.removeItem('duragrit_session');
  localStorage.removeItem('duragrit_session_v2');
  localStorage.removeItem('duragrit_mobile_session');
  localStorage.removeItem('duragrit_mobile_session_v3');
  localStorage.removeItem('duragrit_mobile_session_v4');
  localStorage.removeItem('duragrit_mobile_session_v5');
  localStorage.removeItem('duragrit_admin_mobile_session_v6');
  localStorage.removeItem('duragrit_vendor_mobile_session_v6');
} catch (_) {}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const key = getAppSessionKey();
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.isAuthenticated && parsed?.loginTimestamp) {
          const elapsed = Date.now() - parsed.loginTimestamp;
          if (elapsed < EIGHT_HOURS_MS) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return null;
  });
  const [sessionRemaining, setSessionRemaining] = useState(() => {
    try {
      const key = getAppSessionKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.loginTimestamp) {
          const elapsed = Date.now() - parsed.loginTimestamp;
          return Math.max(0, EIGHT_HOURS_MS - elapsed);
        }
      }
    } catch (_) {}
    return EIGHT_HOURS_MS;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [supabaseOnline] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (currentUser?.isAuthenticated) {
      const key = getAppSessionKey();
      localStorage.setItem(key, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.isAuthenticated) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - currentUser.loginTimestamp;
      const left = Math.max(0, EIGHT_HOURS_MS - elapsed);
      setSessionRemaining(left);
      if (left === 0) logout();
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.loginTimestamp]);

  const sendOTP = useCallback(async (mobile) => {
    if (!supabaseOnline) {
      return { success: false, message: 'Supabase not configured. Connect credentials to enable OTP.' };
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const phone = mobile.startsWith('+') ? mobile : `+91${mobile.replace(/\D/g, '').slice(-10)}`;
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        setAuthError(error.message);
        return { success: false, message: error.message };
      }
      return { success: true, phone };
    } finally {
      setAuthLoading(false);
    }
  }, [supabaseOnline]);

  const verifyOTP = useCallback(async (mobile, token) => {
    if (!supabaseOnline) {
      return { success: false, message: 'Supabase not configured.' };
    }
    setAuthLoading(true);
    try {
      const phone = mobile.startsWith('+') ? mobile : `+91${mobile.replace(/\D/g, '').slice(-10)}`;
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) {
        setAuthError(error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } finally {
      setAuthLoading(false);
    }
  }, [supabaseOnline]);

  const loginUser = useCallback((userData) => {
    const rawId = String(userData?.id || userData?.vendorId || Date.now());
    const session = {
      ...userData,
      id: rawId,
      userId: rawId.startsWith('USR-') || rawId.startsWith('VND-') || rawId.startsWith('usr-') ? rawId : `USR-${rawId}`,
      supabaseId: userData?.supabaseId || null,
      isAuthenticated: true,
      loginTimestamp: Date.now(),
      authMode: userData?.supabaseId ? 'supabase-synced' : 'local',
    };
    setCurrentUser(session);
    try {
      const key = getAppSessionKey();
      localStorage.setItem(key, JSON.stringify(session));
    } catch (_) {}
    return { success: true, user: session };
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    setCurrentUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) {
        try {
          const key = getAppSessionKey();
          localStorage.setItem(key, JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    if (supabaseOnline && currentUser?.authMode === 'supabase') {
      try { await supabase.auth.signOut(); } catch (_) {}
    }
    setCurrentUser(null);
    try {
      const key = getAppSessionKey();
      localStorage.removeItem(key);
      localStorage.removeItem('duragrit_admin_session_port3001');
      localStorage.removeItem('duragrit_vendor_session_port3002');
      localStorage.removeItem('duragrit_mobile_session_v5');
      localStorage.removeItem('duragrit_admin_mobile_session_v6');
      localStorage.removeItem('duragrit_vendor_mobile_session_v6');
    } catch (_) {}
  }, [supabaseOnline, currentUser?.authMode]);

  const formatSessionTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        authLoading,
        authError,
        supabaseOnline,
        loginUser,
        sendOTP,
        verifyOTP,
        logout,
        sessionRemaining,
        sessionFormatted: formatSessionTime(sessionRemaining),
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
