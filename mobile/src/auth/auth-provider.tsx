import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  PhoneAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';

import { auth } from './firebase';

export type UserRole = 'land_consultant' | 'landowner';

export type AuthedUser = {
  id: string;
  name: string;
  role: UserRole;
  location?: { lat: number; lng: number };
};

type AuthContextValue = {
  user: AuthedUser | null;
  firebaseUser: FirebaseUser | null;
  bearerToken: string | null;
  completeOnboarding: (params: { name: string; role: UserRole; location: { lat: number; lng: number } }) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signInWithPhoneVerificationId: (verificationId: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const KEYS = {
  onboarding: 'landroid_onboarding_v1',
  bearer: 'landroid_bearer_v1',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      setFirebaseUser(fu);
      if (!fu) {
        setUser(null);
        setBearerToken(null);
        return;
      }

      const saved = await safeGet(KEYS.onboarding);
      const parsed = saved ? (JSON.parse(saved) as Omit<AuthedUser, 'id'>) : null;
      if (parsed) {
        setUser({ id: fu.uid, ...parsed });
      } else {
        setUser({ id: fu.uid, name: '', role: 'landowner' });
      }

      // For hackathon prototype: use Firebase ID token as bearer token.
      // (Backend should verify it; we keep it in SecureStore and never log it.)
      const idToken = await fu.getIdToken();
      await safeSet(KEYS.bearer, idToken);
      setBearerToken(idToken);
    });
    return unsub;
  }, []);

  const completeOnboarding = useCallback(
    async (params: { name: string; role: UserRole; location: { lat: number; lng: number } }) => {
      // Role is final (FR-03): once stored, we do not expose a role-change action.
      const payload = { name: params.name.trim(), role: params.role, location: params.location };
      await safeSet(KEYS.onboarding, JSON.stringify(payload));
      if (firebaseUser) setUser({ id: firebaseUser.uid, ...payload });
    },
    [firebaseUser]
  );

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    const cred = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, cred);
  }, []);

  const signInWithPhoneVerificationId = useCallback(async (verificationId: string, otp: string) => {
    const cred = PhoneAuthProvider.credential(verificationId, otp);
    await signInWithCredential(auth, cred);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await safeDelete(KEYS.onboarding);
    await safeDelete(KEYS.bearer);
    setUser(null);
    setFirebaseUser(null);
    setBearerToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      bearerToken,
      completeOnboarding,
      signInWithGoogleIdToken,
      signInWithPhoneVerificationId,
      signOut,
    }),
    [user, firebaseUser, bearerToken, completeOnboarding, signInWithGoogleIdToken, signInWithPhoneVerificationId, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function safeSet(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Avoid crashing auth flow on storage edge cases.
  }
}

async function safeGet(key: string) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeDelete(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

