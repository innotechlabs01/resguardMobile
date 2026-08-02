import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { clerkAuth, ClerkUser } from '../services/clerkAuth';
import { saveToken, clearToken, getToken, getUserId, isTokenExpired, isTokenNeedingRefresh, hasValidToken } from '../services/tokenStorage';
import { syncClerkUserToSupabase, getUserProfile, UserProfile } from '../services/userSync';

interface AuthContextType {
  user: UserProfile | null;
  clerkUser: ClerkUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsRefresh: boolean;
  login: (clerkUser: any) => Promise<void>;
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
  
  const { isSignedIn, isLoaded: clerkLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUserData, isLoaded: userLoaded } = useClerkUser();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [clerkUser, setClerkUser] = useState<ClerkUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const login = useCallback(async (clerkUserData: any) => {
    try {
      const token = await clerkUserData.getToken();
      const userId = clerkUserData.id;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await saveToken(token, userId, expiresAt);

      const userData: ClerkUser = {
        id: clerkUserData.id,
        email: clerkUserData.primaryEmailAddress?.emailAddress || '',
        fullName: clerkUserData.fullName || '',
        firstName: clerkUserData.firstName || '',
        lastName: clerkUserData.lastName || '',
        buildingId: clerkUserData.publicMetadata?.buildingId as string,
        role: clerkUserData.publicMetadata?.role as string,
        unit: clerkUserData.publicMetadata?.unit as string,
      };

      setClerkUser(userData);

      await syncClerkUserToSupabase({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        buildingId: userData.buildingId,
        role: userData.role,
        unit: userData.unit,
      });

      const profile = await getUserProfile(userId);
      setUser(profile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearToken();
      await clerkSignOut();
      setUser(null);
      setClerkUser(null);
      setNeedsRefresh(false);
      router.replace('/splash' as any);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [clerkSignOut, router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await clerkAuth.refreshToken();
      if (refreshed) {
        setNeedsRefresh(false);
      }
      return refreshed;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    if (!clerkLoaded || !userLoaded) {
      return;
    }

    try {
      const validToken = await hasValidToken();
      
      if (isSignedIn && validToken) {
        const needsRefreshVal = await isTokenNeedingRefresh();
        setNeedsRefresh(needsRefreshVal);

        const storedUserId = await getUserId();
        if (storedUserId) {
          const profile = await getUserProfile(storedUserId);
          setUser(profile);
        }
      } else {
        setUser(null);
        setNeedsRefresh(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkLoaded, userLoaded]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isSignedIn && clerkUserData) {
      login(clerkUserData).catch(console.error);
    }
  }, [isSignedIn, clerkUserData]);

  useEffect(() => {
    const inAuthGroup = segments[0] === undefined;
    
    if (!isLoading && clerkLoaded && userLoaded) {
      if (!isSignedIn && inAuthGroup) {
        router.replace('/splash' as any);
      } else if (isSignedIn && inAuthGroup) {
        router.replace('/(tabs)' as any);
      }
    }
  }, [segments, isSignedIn, isLoading, clerkLoaded, userLoaded]);

  const value: AuthContextType = {
    user,
    clerkUser,
    isLoading,
    isAuthenticated: !!(isSignedIn && !!user),
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