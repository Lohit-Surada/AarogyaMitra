import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/lib/firebase';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, {
        displayName: fullName.trim(),
      });
      router.replace('/');
    } catch {
      setLoading(false);
      Alert.alert('Registration Failed', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sign up to get started
          </ThemedText>

          <View style={styles.formContainer}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: '#111827',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />

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

            <ThemedText style={styles.label}>Password</ThemedText>
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

            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: '#111827',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#111827' }]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText>Already have an account? </ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={{ color: '#111827', fontWeight: 'bold' }}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 24,
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
    marginBottom: 16,
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
