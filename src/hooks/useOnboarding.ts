import { useState, useEffect } from 'react';
import { getSetting, setSetting, deleteSetting, createUser, getUserByEmail, getUserByUsername, getUserByPassword } from '../lib/database';
import { router } from 'expo-router';

const SESSION_TOKEN_KEY = 'session_token';
const SESSION_CREATED_AT_KEY = 'session_created_at';
const CURRENT_USER_EMAIL_KEY = 'current_user_email';

export const useOnboarding = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const [status, token, email] = await Promise.all([
        getSetting('onboarding_complete'),
        getSetting(SESSION_TOKEN_KEY),
        getSetting(CURRENT_USER_EMAIL_KEY),
      ]);
      setIsOnboarded(status === 'true');
      setHasActiveSession(Boolean(token && email));
    } catch {
      setIsOnboarded(false);
      setHasActiveSession(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    await setSetting('onboarding_complete', 'true');
    setIsOnboarded(true);
  };

  const createSessionToken = () =>
    `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

  const createSession = async (email: string) => {
    await Promise.all([
      setSetting(CURRENT_USER_EMAIL_KEY, email),
      setSetting(SESSION_TOKEN_KEY, createSessionToken()),
      setSetting(SESSION_CREATED_AT_KEY, new Date().toISOString()),
    ]);
    setHasActiveSession(true);
  };

  const signUp = async (email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const existingEmail = await getUserByEmail(email);
      if (existingEmail) {
        return { success: false, error: 'Email already exists' };
      }

      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return { success: false, error: 'Username already taken' };
      }

      await createUser(email, username, password);
      await completeOnboarding();
      await createSession(email);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to create account' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'No account found with this email' };
      }

      const isValidPassword = await getUserByPassword(email, password);
      if (!isValidPassword) {
        return { success: false, error: 'Incorrect password' };
      }

      await completeOnboarding();
      await createSession(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to sign in' };
    }
  };

  const signOut = async () => {
    await Promise.all([
      deleteSetting(SESSION_TOKEN_KEY),
      deleteSetting(SESSION_CREATED_AT_KEY),
      deleteSetting(CURRENT_USER_EMAIL_KEY),
    ]);
    setHasActiveSession(false);
    router.replace('/(onboarding)/signin');
  };

  const getCurrentUserEmail = async (): Promise<string | null> => {
    const [token, email] = await Promise.all([
      getSetting(SESSION_TOKEN_KEY),
      getSetting(CURRENT_USER_EMAIL_KEY),
    ]);
    if (!token || !email) return null;
    return email;
  };

  return {
    isOnboarded,
    hasActiveSession,
    isLoading,
    completeOnboarding,
    signUp,
    signIn,
    signOut,
    getCurrentUserEmail,
  };
};
