import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'clerk_session_token';
const TOKEN_EXPIRY_KEY = 'clerk_session_expiry';
const USER_ID_KEY = 'clerk_user_id';

const TOKEN_VALIDITY_DAYS = 7;
const TOKEN_REFRESH_THRESHOLD_DAYS = 7;

export interface StoredToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

export async function saveToken(token: string, userId: string, expiresAt: Date): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiresAt.toISOString());
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save authentication token');
  }
}

export async function getToken(): Promise<StoredToken | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const expiresAtStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);

    if (!token || !expiresAtStr || !userId) {
      return null;
    }

    return {
      token,
      expiresAt: new Date(expiresAtStr),
      userId,
    };
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    await SecureStore.getItemAsync(USER_ID_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
}

export async function isTokenExpired(): Promise<boolean> {
  const storedToken = await getToken();
  if (!storedToken) {
    return true;
  }
  return new Date() >= storedToken.expiresAt;
}

export async function isTokenNeedingRefresh(): Promise<boolean> {
  const storedToken = await getToken();
  if (!storedToken) {
    return true;
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (storedToken.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysUntilExpiry <= TOKEN_REFRESH_THRESHOLD_DAYS;
}

export async function getTokenAge(): Promise<number | null> {
  const storedToken = await getToken();
  if (!storedToken) {
    return null;
  }

  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - storedToken.expiresAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.abs(daysSinceCreation);
}

export async function hasValidToken(): Promise<boolean> {
  const storedToken = await getToken();
  if (!storedToken) {
    return false;
  }

  const now = new Date();
  return now < storedToken.expiresAt;
}

export async function getUserId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(USER_ID_KEY);
  } catch {
    return null;
  }
}