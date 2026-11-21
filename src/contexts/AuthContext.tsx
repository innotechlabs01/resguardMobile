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

  const hydrateUserProfile = useCallback(async (authUser: { id: string; email?: string | null }): Promise<UserProfile> => {
    const email = (authUser.email || '').trim().toLowerCase();
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    let buildingId: string | null = profile?.building_id || null;
    let buildingName: string | null = null;
    let isTenant = false;
    let resolvedUnit: string | null =
      typeof profile?.unit === 'string' && profile.unit.trim() ? profile.unit.trim() : null;

    let resident: { unit?: string | null; is_tenant?: boolean | null; building_id?: string | null } | null = null;

    const { data: residentByUserId } = await supabase
      .from('residents')
      .select('unit, is_tenant, building_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (residentByUserId) {
      resident = residentByUserId;
    } else if (email) {
      let residentQuery = supabase
        .from('residents')
        .select('unit, is_tenant, building_id')
        .eq('email', email);
      if (buildingId) {
        residentQuery = residentQuery.eq('building_id', buildingId);
      }
      const { data: residentByEmail } = await residentQuery.maybeSingle();
      resident = residentByEmail;
    }

    if (resident) {
      if (!resolvedUnit && typeof resident.unit === 'string' && resident.unit.trim()) {
        resolvedUnit = resident.unit.trim();
      }
      if (!buildingId && resident.building_id) {
        buildingId = resident.building_id;
      }
      if (resident.is_tenant) {
        isTenant = true;
      }
    }

    if (email && (!isTenant || !resolvedUnit)) {
      let tenantQuery = supabase
        .from('tenants')
        .select('id, unit, building_id')
        .eq('email', email)
        .eq('status', 'active');
      if (buildingId) {
        tenantQuery = tenantQuery.eq('building_id', buildingId);
      }
      const { data: tenant } = await tenantQuery.maybeSingle();
      if (tenant) {
        isTenant = true;
        if (!resolvedUnit && typeof tenant.unit === 'string' && tenant.unit.trim()) {
          resolvedUnit = tenant.unit.trim();
        }
        if (!buildingId && tenant.building_id) {
          buildingId = tenant.building_id;
        }
      }
    }

    if (buildingId) {
      const { data: building } = await supabase
        .from('buildings')
        .select('name')
        .eq('id', buildingId)
        .maybeSingle();
      buildingName = building?.name || null;
    }

    const resolvedName =
      profile?.name ||
      profile?.display_name ||
      authUser.email?.split('@')[0] ||
      'Usuario';

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: resolvedName,
      display_name: resolvedName,
      role: profile?.role || 'usuario',
      building_id: buildingId,
      building_name: buildingName,
      unit: resolvedUnit,
      is_tenant: isTenant,
      created_at: profile?.created_at || new Date().toISOString(),
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const hydrated = await hydrateUserProfile(session.user);
        storeLogin(hydrated, session.access_token);
      } else {
        storeLogout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [hydrateUserProfile, storeLogin, storeLogout, setLoading]);

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
        const hydrated = await hydrateUserProfile(authData.user);
        storeLogin(hydrated, authData.session?.access_token || '');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [hydrateUserProfile, storeLogin, setLoading]);

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
        const hydrated = await hydrateUserProfile(data.session.user);
        storeLogin(hydrated, data.session.access_token);
      }
      
      setNeedsRefresh(false);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, [hydrateUserProfile, storeLogin]);

  // Listen to auth state changes
  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const hydrated = await hydrateUserProfile(session.user);
        storeLogin(hydrated, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        storeLogout();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth, hydrateUserProfile, storeLogin, storeLogout]);

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