import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { saveToken, clearToken, getToken, getUserId } from './tokenStorage';

const CLERK_KEY = Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const TOKEN_VALIDITY_DAYS = 7;
const TOKEN_REFRESH_DAYS = 8;

export interface ClerkUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  buildingId?: string;
  role?: string;
  unit?: string;
}

class ClerkAuthService {
  private clerkKey: string;

  constructor() {
    this.clerkKey = CLERK_KEY || '';
    if (!this.clerkKey) {
      console.warn('Clerk publishable key not configured');
    }
  }

  getPublishableKey(): string {
    return this.clerkKey;
  }

  async signIn(email: string, password: string): Promise<ClerkUser> {
    throw new Error('Use ClerkSignIn component for authentication');
  }

  async signOut(): Promise<void> {
    try {
      await clearToken();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async getCurrentUser(): Promise<ClerkUser | null> {
    try {
      const userId = await getUserId();
      if (!userId) {
        return null;
      }

      const storedToken = await getToken();
      if (!storedToken) {
        return null;
      }

      return {
        id: userId,
        email: '',
        fullName: '',
        firstName: '',
        lastName: '',
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        return null;
      }

      const now = new Date();
      if (now >= storedToken.expiresAt) {
        await clearToken();
        return null;
      }

      return storedToken.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        return false;
      }

      const now = new Date();
      return now < storedToken.expiresAt;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        return false;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + TOKEN_REFRESH_DAYS);

      await saveToken(storedToken.token, storedToken.userId, expiryDate);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async isTokenExpired(): Promise<boolean> {
    const storedToken = await getToken();
    if (!storedToken) {
      return true;
    }
    return new Date() >= storedToken.expiresAt;
  }

  async isTokenNeedingRefresh(): Promise<boolean> {
    const storedToken = await getToken();
    if (!storedToken) {
      return true;
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (storedToken.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilExpiry <= TOKEN_VALIDITY_DAYS;
  }

  async getTokenAge(): Promise<number> {
    const storedToken = await getToken();
    if (!storedToken) {
      return -1;
    }

    const now = new Date();
    const daysSinceExpiry = Math.floor(
      (now.getTime() - storedToken.expiresAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.abs(daysSinceExpiry);
  }

  handleSessionExpired(): void {
    clearToken();
  }
}

export const clerkAuth = new ClerkAuthService();
export default clerkAuth;