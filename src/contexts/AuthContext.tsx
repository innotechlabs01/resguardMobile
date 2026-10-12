import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { getUserProfile, UserProfile } from '../services/userSync';
import { registerForPushNotifications } from '../services/pushNotifications';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const uid = data.user?.id;
    if (!uid) throw new Error('No user');
    const profile = await getUserProfile(uid);
    if (!profile) {
      await supabase.auth.signOut();
      setUser(null);
      throw new Error('Tu cuenta no tiene perfil asociado. Contacta al administrador de tu edificio.');
    }
    setUser(profile);
    registerForPushNotifications(uid).catch(console.error);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/splash' as any);
  }, [router]);

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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // checkAuth already loads the initial session; only react to changes.
      if (event === 'INITIAL_SESSION') return;
      // Defer Supabase calls out of the listener to avoid deadlocks.
      setTimeout(async () => {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === undefined;
    if (!isLoading) {
      if (!user && inAuthGroup) router.replace('/splash' as any);
      else if (user && inAuthGroup) router.replace('/(app)/tabs' as any);
    }
  }, [segments, user, isLoading, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
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
