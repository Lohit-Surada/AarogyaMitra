import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../locales/i18n';

import { AuthProvider } from '@/lib/auth';
import '@/lib/firebase';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserActivity } from '@/hooks/useUserActivity';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Inner component that uses hooks after AuthProvider is mounted */
function AppShell({ children }: { children: React.ReactNode }) {
  useUserActivity(); // Tracks session, last-seen & analytics in RTDB
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AppShell>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              animation: 'default',
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              animation: 'default',
            }}
          />
          <Stack.Screen
            name="disease-prediction"
            options={{
              headerShown: false,
              animation: 'default',
            }}
          />
          <Stack.Screen
            name="chatbot"
            options={{
              headerShown: false,
              animation: 'default',
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="+not-found" options={{ animation: 'none' }} />

          {/* Disease Detection Screens */}
          <Stack.Screen name="disease/index" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="disease/camera" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="disease/result" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="disease/history" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="disease/[id]" options={{ headerShown: false, animation: 'none' }} />

          {/* Map Screens */}
          <Stack.Screen name="maps" options={{ headerShown: false, animation: 'none' }} />

          {/* Pharmacy Screens */}
          <Stack.Screen name="pharmacy/index" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/[id]" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/listing" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/cart" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/checkout" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/payment" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/orders" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="pharmacy/order/[id]" options={{ headerShown: false, animation: 'none' }} />

          {/* User Session & Auth Screens */}
          <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="auth/onboarding" options={{ headerShown: false, animation: 'none' }} />

          <Stack.Screen name="profile" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="about" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="support" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'none' }} />
          
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/profile"
            options={{
              headerShown: false,
              animation: 'none',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </AppShell>
    </AuthProvider>
  );
}
