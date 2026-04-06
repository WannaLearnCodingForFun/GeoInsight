import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

import { useAuth, type UserRole } from '@/src/auth/auth-provider';
import { auth } from '@/src/auth/firebase';

export default function AuthIndex() {
  const { user, completeOnboarding, signInWithGoogleIdToken, signInWithPhoneVerificationId } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('land_consultant');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canContinue = useMemo(() => name.trim().length >= 2, [name]);
  const canSendOtp = useMemo(() => normalizePhoneForFirebase(phone) !== null && !busy, [phone, busy]);
  const canVerifyOtp = useMemo(() => otp.trim().length >= 4 && !!verificationId && !busy, [otp, verificationId, busy]);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LANDROID</Text>
      <Text style={styles.subtitle}>AI-Powered Land Intelligence (Hackathon Prototype)</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Role (final in real app)</Text>
        <View style={styles.roleRow}>
          <RolePill
            label="Land Consultant"
            active={role === 'land_consultant'}
            onPress={() => setRole('land_consultant')}
          />
          <RolePill
            label="Landowner"
            active={role === 'landowner'}
            onPress={() => setRole('landowner')}
          />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Mobile (OTP)</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile or +91XXXXXXXXXX"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          disabled={!canSendOtp}
          style={[styles.secondaryBtn, !canSendOtp && styles.primaryBtnDisabled]}
          onPress={async () => {
            setBusy(true);
            try {
              const normalizedPhone = normalizePhoneForFirebase(phone);
              if (!normalizedPhone) {
                alert('Enter a valid phone number. Use 10 digits (India) or full E.164 format like +917200180792.');
                return;
              }
              // Expo + Firebase Phone Auth requires a reCAPTCHA flow on web; on native it's handled by Firebase.
              // We keep this hackathon-friendly: on web it will open the reCAPTCHA flow.
              // @ts-expect-error - RecaptchaVerifier is web-only.
              const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
              const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
              setVerificationId(confirmation.verificationId);
              alert('OTP sent. Enter it below.');
            } catch (e: any) {
              if ((e?.message ?? '').includes('invalid-phone-number')) {
                alert('Invalid phone format. Try +917200180792 (country code required).');
              } else {
                alert(e?.message ?? 'Failed to send OTP');
              }
            } finally {
              setBusy(false);
            }
          }}>
          <Text style={styles.secondaryBtnText}>Send OTP</Text>
        </Pressable>

        {verificationId ? (
          <>
            <Text style={[styles.label, { marginTop: 12 }]}>OTP</Text>
            <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" keyboardType="number-pad" style={styles.input} />
            <Pressable
              accessibilityRole="button"
              disabled={!canVerifyOtp}
              style={[styles.primaryBtn, !canVerifyOtp && styles.primaryBtnDisabled]}
              onPress={async () => {
                setBusy(true);
                try {
                  await signInWithPhoneVerificationId(verificationId, otp.trim());
                  const loc = await requestOneTimeLocation();
                  await completeOnboarding({ name, role, location: loc });
                  router.replace('/(tabs)');
                } catch (e: any) {
                  alert(e?.message ?? 'OTP verification failed');
                } finally {
                  setBusy(false);
                }
              }}>
              <Text style={styles.primaryBtnText}>Verify OTP & Continue</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={[styles.label, { marginTop: 12 }]}>Google Sign-In</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue || busy}
          style={[styles.secondaryBtn, (!canContinue || busy) && styles.primaryBtnDisabled]}
          onPress={async () => {
            setBusy(true);
            try {
              // Minimal hackathon flow: open Google sign-in in browser and accept an ID token from a test harness.
              // For production you’d use native Google sign-in + OAuth client ids.
              await WebBrowser.openBrowserAsync('https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid');
              alert('Configure Google Sign-In for your Firebase project, then wire ID token exchange here.');
              // If you already have an ID token, call:
              // await signInWithGoogleIdToken(idToken)
              // await completeOnboarding(...)
            } finally {
              setBusy(false);
            }
          }}>
          <Text style={styles.secondaryBtnText}>Continue with Google (Scaffold)</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Tokens are stored using SecureStore (Android Keystore) and never logged (FR-04). After login, onboarding saves
          name, role, and location (FR-03). API layer will attach bearer token for all requests (FR-05).
        </Text>
      </View>

      {/* web-only target for Firebase reCAPTCHA */}
      <View nativeID="recaptcha-container" />
    </View>
  );
}

function RolePill(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={[styles.pill, props.active ? styles.pillActive : styles.pillInactive]}>
      <Text style={[styles.pillText, props.active ? styles.pillTextActive : styles.pillTextInactive]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 64,
    backgroundColor: '#0B1220',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E6F4FF',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#A9C3D6',
  },
  card: {
    marginTop: 24,
    backgroundColor: '#101C33',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C2B4B',
  },
  label: {
    color: '#CFE5F5',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    marginTop: 8,
    backgroundColor: '#0B1220',
    color: '#E6F4FF',
    borderWidth: 1,
    borderColor: '#24385F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#1B4DFF',
    borderColor: '#1B4DFF',
  },
  pillInactive: {
    backgroundColor: '#0B1220',
    borderColor: '#24385F',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#CFE5F5',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#00C2A8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#06211D',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#0B1220',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24385F',
  },
  secondaryBtnText: {
    color: '#CFE5F5',
    fontSize: 15,
    fontWeight: '800',
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    color: '#8FB2C9',
    lineHeight: 16,
  },
});

async function requestOneTimeLocation(): Promise<{ lat: number; lng: number }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    // minimal fallback for hackathon demos
    return { lat: 12.9716, lng: 77.5946 };
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

function normalizePhoneForFirebase(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith('+')) {
    const ok = /^\+[1-9]\d{7,14}$/.test(v);
    return ok ? v : null;
  }
  // India-friendly shortcut: 10 digits -> +91xxxxxxxxxx
  const digits = v.replace(/\D/g, '');
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  return null;
}

