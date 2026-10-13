import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { UserProfile } from '../services/userSync';

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

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthenticated, isLoading, setLoading, login: storeLogin, logout: storeLogout } = useAuthStore();

  const [needsRefresh, setNeedsRefresh] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user profile from users table (by supabase user id)
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          storeLogin({
            id: session.user.id,
            email: session.user.email || '',
            display_name: profile.display_name || session.user.email?.split('@')[0] || 'Usuario',
            role: profile.role || 'usuario',
            building_id: profile.building_id || null,
            unit: profile.unit || null,
            created_at: profile.created_at,
          }, session.access_token);
        } else {
          // Fallback if no profile yet
          storeLogin({
            id: session.user.id,
            email: session.user.email || '',
            display_name: session.user.email?.split('@')[0] || 'Usuario',
            role: 'usuario',
            building_id: null,
            unit: null,
            created_at: new Date().toISOString(),
          }, session.access_token);
        }
      } else {
        storeLogout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [storeLogin, storeLogout, setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        throw new Error(authError.message || 'Error al iniciar sesión');
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        storeLogin({
          id: authData.user.id,
          email: authData.user.email || email,
          display_name: profile?.display_name || authData.user.email?.split('@')[0] || 'Usuario',
          role: profile?.role || 'usuario',
          building_id: profile?.building_id || null,
          unit: profile?.unit || null,
          created_at: profile?.created_at || new Date().toISOString(),
        }, authData.session?.access_token || '');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storeLogin, setLoading]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      storeLogout();
      router.replace('/splash' as any);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [storeLogout, router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        return false;
      }
      
      // Update stored token
      if (data.session?.access_token) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        
        storeLogin({
          id: data.session.user.id,
          email: data.session.user.email || '',
          display_name: profile?.display_name || data.session.user.email?.split('@')[0] || 'Usuario',
          role: profile?.role || 'usuario',
          building_id: profile?.building_id || null,
          unit: profile?.unit || null,
          created_at: profile?.created_at || new Date().toISOString(),
        }, data.session.access_token);
      }
      
      setNeedsRefresh(false);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, [storeLogin]);

  // Listen to auth state changes
  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        storeLogin({
          id: session.user.id,
          email: session.user.email || '',
          display_name: profile?.display_name || session.user.email?.split('@')[0] || 'Usuario',
          role: profile?.role || 'usuario',
          building_id: profile?.building_id || null,
          unit: profile?.unit || null,
          created_at: profile?.created_at || new Date().toISOString(),
        }, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        storeLogout();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth, storeLogin, storeLogout]);

  // Navigation guard
  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === undefined || segments[0] === 'splash' || segments[0] === 'login' || segments[0] === 'lock';

      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/splash' as any);
      } else if (isAuthenticated && inAuthGroup && segments[0] !== 'lock') {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isLoading, isAuthenticated, segments, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    needsRefresh,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;