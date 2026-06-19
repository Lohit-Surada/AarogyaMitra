import { Palette, Radius, Spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (params.returnUrl) {
        router.replace(params.returnUrl as any);
      } else {
        router.replace('/');
      }
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Logo & Brand */}
            <View style={styles.brandSection}>
              <View style={styles.logoCircle}>
                <Ionicons name="heart-half" size={36} color="#fff" />
              </View>
              <Text style={styles.brandName}>AarogyaMitra</Text>
              <Text style={styles.brandTagline}>Your Trusted Health Companion</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your health journey</Text>

              {/* Email Field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={emailFocused ? Palette.primary : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputRow, passwordFocused && styles.inputRowFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={passwordFocused ? Palette.primary : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Create Account</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: Spacing.lg,
  },
  fieldWrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
  },
  inputRowFocused: {
    borderColor: Palette.primary,
    backgroundColor: '#f0f9ff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 15,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
