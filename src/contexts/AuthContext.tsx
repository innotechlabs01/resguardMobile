import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { clearToken, getUserId } from '../services/tokenStorage';
import { getUserProfile, UserProfile } from '../services/userSync';
import { registerForPushNotifications } from '../services/pushNotifications';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsRefresh: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const uid = data.user?.id;
    if (!uid) throw new Error('No user');
    const profile = await getUserProfile(uid);
    setUser(profile);
    registerForPushNotifications(uid).catch(console.error);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    await clearToken();
    setUser(null);
    setNeedsRefresh(false);
    router.replace('/splash' as any);
  }, [router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const { data } = await supabase.auth.refreshSession();
    return !!data.session;
  }, []);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === undefined;
    if (!isLoading) {
      if (!user && inAuthGroup) router.replace('/splash' as any);
      else if (user && inAuthGroup) router.replace('/(tabs)' as any);
    }
  }, [segments, user, isLoading, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsRefresh,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
export default AuthContext;
