import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/lib/auth';
import '@/lib/firebase';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
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
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="disease-prediction"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="chatbot"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="maps"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animationEnabled: false,
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
              headerShown: true,
            }}
          />
          {/* Pharmacy Module */}
          <Stack.Screen
            name="pharmacy/index"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/[id]"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/listing"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/cart"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/checkout"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/payment"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/orders"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="pharmacy/profile"
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
