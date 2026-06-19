import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadows } from '@/constants/theme';
import { syncOrderToRTDB } from '@/services/rtdbService';
import { clearCart, getCart } from '@/services/cartService';
import { getBackendUrl } from '@/utils/api';

export default function QRPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount: string;
    email: string;
    subtotal: string;
    discount: string;
    gst: string;
    deliveryFee: string;
    shippingAddress: string;
    latitude?: string;
    longitude?: string;
  }>();

  const {
    amount,
    email,
    subtotal,
    discount,
    gst,
    deliveryFee,
    shippingAddress,
    latitude,
    longitude,
  } = params;

  const [loadingQr, setLoadingQr] = useState(true);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch QR Code from Backend on mount
  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch(getBackendUrl('/api/payment/create-qr'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount ?? '0') }),
        });

        if (!res.ok) {
          throw new Error('Failed to generate QR Code');
        }

        const data = await res.json();
        setQrCodeId(data.id);
        setQrImageUrl(data.imageUrl);
      } catch (err: any) {
        Alert.alert('Error', err.message ?? 'Could not create QR code.', [
          { text: 'Go Back', onPress: () => router.back() }
        ]);
      } finally {
        setLoadingQr(false);
      }
    };

    fetchQr();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [amount]);

  // 2. Poll for payment status
  useEffect(() => {
    if (!qrCodeId || paymentDone) return;

    const pollPayment = async () => {
      try {
        const cartItems = await getCart();

        const res = await fetch(getBackendUrl('/api/payment/qr-complete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrCodeId,
            email,
            subtotal: parseFloat(subtotal ?? '0'),
            discount: parseFloat(discount ?? '0'),
            gst: parseFloat(gst ?? '0'),
            deliveryFee: parseFloat(deliveryFee ?? '0'),
            total: parseFloat(amount ?? '0'),
            shippingAddress,
            ...(latitude ? { latitude: parseFloat(latitude) } : {}),
            ...(longitude ? { longitude: parseFloat(longitude) } : {}),
            orderItems: cartItems,
          }),
        });

        if (!res.ok) return; // Keep polling if backend error

        const data = await res.json();

        if (data.paid && data.orderId) {
          // Stop polling
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Sync to Firebase RTDB for real-time order tracking
          const orderPayload = {
            id: data.orderId,
            orderStatus: 'PLACED',
            paymentMethod: 'RAZORPAY_QR',
            paymentStatus: 'PAID',
            total: parseFloat(amount ?? '0'),
            subtotal: parseFloat(subtotal ?? '0'),
            gst: parseFloat(gst ?? '0'),
            deliveryFee: parseFloat(deliveryFee ?? '0'),
            discount: parseFloat(discount ?? '0'),
            shippingAddress,
            createdAt: new Date().toISOString(),
            orderItems: cartItems,
            razorpayPaymentId: data.paymentId,
          };

          await syncOrderToRTDB(email ?? '', orderPayload);
          await clearCart();

          setSuccessOrderId(String(data.orderId));
          setPaymentDone(true);
        }
      } catch (err) {
        console.log('Polling error:', err);
      }
    };

    // Poll every 3 seconds
    pollingRef.current = setInterval(pollPayment, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [qrCodeId, paymentDone]);

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (paymentDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
          <Text style={styles.successSub}>Your order has been confirmed.</Text>

          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order ID</Text>
              <Text style={styles.receiptValue}>#{successOrderId}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount Paid</Text>
              <Text style={[styles.receiptValue, { color: '#059669', fontWeight: '800' }]}>
                ₹{parseFloat(amount ?? '0').toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.replace('/pharmacy/orders')}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={styles.trackBtnTxt}>Track My Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── QR Checkout ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="qr-code" size={16} color="#059669" />
          <Text style={styles.headerTitle}>UPI QR Payment</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>₹{parseFloat(amount ?? '0').toFixed(2)}</Text>

        <View style={styles.qrCard}>
          {loadingQr ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Palette.secondary} />
              <Text style={styles.loaderText}>Generating QR Code...</Text>
            </View>
          ) : qrImageUrl ? (
            <>
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
              <Text style={styles.scanText}>Scan with any UPI App</Text>
              <View style={styles.appsRow}>
                <Text style={styles.appName}>GPay</Text>
                <Text style={styles.appDot}>•</Text>
                <Text style={styles.appName}>PhonePe</Text>
                <Text style={styles.appDot}>•</Text>
                <Text style={styles.appName}>Paytm</Text>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>Could not load QR code</Text>
          )}
        </View>

        {!loadingQr && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={Palette.secondary} />
            <Text style={styles.waitingText}>Waiting for payment...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Palette.text },

  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
  },
  amountLabel: { fontSize: 15, color: '#64748B', fontWeight: '600' },
  amountValue: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginTop: 4, marginBottom: 24 },

  qrCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 320,
    ...Shadows.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  appsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  appDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },

  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    ...Shadows.sm,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },

  successContainer: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Shadows.lg,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#065F46', textAlign: 'center' },
  successSub: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 24,
    ...Shadows.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  receiptValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#D1FAE5' },
  trackBtn: {
    width: '100%',
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.md,
    ...Shadows.md,
  },
  trackBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
