import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/lib/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
    } catch {
      setLoading(false);
      Alert.alert('Login Failed', 'Invalid credentials or unable to sign in.');
    }
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in to your account
        </ThemedText>

        <View style={styles.formContainer}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: '#111827',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <ThemedText style={[styles.label, { marginTop: 16 }]}>
            Password
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: '#111827',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
              },
            ]}
            placeholder="Enter your password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#111827' }]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Sign In</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText>Do not have an account? </ThemedText>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <ThemedText style={{ color: '#111827', fontWeight: 'bold' }}>
                  Sign Up
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  content: {
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.6,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    alignItems: 'center',
  },
});
