import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/theme';

/**
 * This screen is kept for compatibility but Razorpay has been removed.
 * Any navigation to /pharmacy/payment is redirected to the checkout page.
 */
export default function PaymentScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to checkout since Razorpay is no longer used
    router.replace('/pharmacy/checkout');
  }, []);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Palette.secondary} />
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 16 },
  text: { fontSize: 14, color: '#64748B' },
});
