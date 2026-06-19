import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadows } from '@/constants/theme';
import { syncOrderToRTDB } from '@/services/rtdbService';
import { clearCart, getCart } from '@/services/cartService';
import { getBackendUrl } from '@/utils/api';

/**
 * PaymentScreen — Razorpay WebView Checkout
 *
 * Loaded by checkout.tsx after a Razorpay order is created on the backend.
 * Renders the backend's /api/payment/checkout-html page inside a WebView,
 * which opens the Razorpay JS checkout modal automatically.
 *
 * Success flow:
 *   Backend callback → /api/payment/callback → we intercept the URL,
 *   verify via backend, sync order to RTDB, clear cart, and show success UI.
 *
 * Cancel/dismiss flow:
 *   /api/payment/cancel-page → we intercept and navigate the user back.
 */

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    razorpayOrderId: string;
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
    razorpayOrderId,
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

  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const processingRef = useRef(false);

  // ── Build Local Checkout HTML (Forcing UPI Method) ───────────────────────────
  const customHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
            body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { color: #64748b; margin-top: 20px; font-size: 16px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="loader"></div>
        <p>Loading Razorpay (UPI Forced)...</p>
        <script>
            var options = {
                "key": "rzp_test_T0U3c5oC3H4Vut",
                "amount": ${Math.round(parseFloat(amount ?? '0') * 100)},
                "currency": "INR",
                "name": "AarogyaMitra",
                "description": "Medicine Order Checkout",
                "order_id": "${razorpayOrderId ?? ''}",
                "prefill": {
                    "email": "${email ?? ''}",
                    "method": "upi"
                },
                "config": {
                    "display": {
                        "blocks": {
                            "upi": {
                                "name": "Pay with UPI",
                                "instruments": [
                                    { "method": "upi" }
                                ]
                            }
                        },
                        "sequence": ["block.upi"],
                        "preferences": {
                            "show_default_blocks": true
                        }
                    }
                },
                "theme": { "color": "#10b981" },
                "handler": function (response) {
                    var redirectUrl = "http://dummy/api/payment/callback?razorpayPaymentId=" + encodeURIComponent(response.razorpay_payment_id) + "&razorpaySignature=" + encodeURIComponent(response.razorpay_signature);
                    window.location.href = redirectUrl;
                },
                "modal": {
                    "ondismiss": function() {
                        window.location.href = "http://dummy/api/payment/cancel-page";
                    }
                }
            };
            var rzp = new Razorpay(options);
            window.onload = function() { rzp.open(); };
        </script>
    </body>
    </html>
  `;

  // ── Block WebView from loading callback/cancel — handle them ourselves ────────
  // onShouldStartLoadWithRequest fires BEFORE the page loads (iOS-reliable).
  // We return false to prevent the WebView from hitting the backend endpoints
  // that place orders — we do that ourselves via /verify.
  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const url: string = request.url ?? '';

    if (url.includes('/api/payment/cancel-page')) {
      // Don't let WebView load the cancel page — handle it ourselves
      if (!processingRef.current) {
        processingRef.current = true;
        Alert.alert(
          'Payment Cancelled',
          'Your payment was cancelled. You can try again from the checkout page.',
          [{ text: 'Go Back', onPress: () => { processingRef.current = false; router.back(); } }]
        );
      }
      return false; // block WebView
    }

    if (url.includes('/api/payment/callback')) {
      // Block the WebView from calling /callback (which places the order server-side).
      // We'll call /verify ourselves below to place it exactly once.
      if (!processingRef.current) {
        handlePaymentSuccess(url);
      }
      return false; // block WebView
    }

    return true; // allow all other URLs
  };

  // ── Fallback: also intercept via onNavigationStateChange (Android backup) ─────
  const handleNavigationChange = (navState: WebViewNavigation) => {
    const url = navState.url ?? '';

    if (url.includes('/api/payment/cancel-page') && !processingRef.current) {
      processingRef.current = true;
      Alert.alert(
        'Payment Cancelled',
        'Your payment was cancelled. You can try again from the checkout page.',
        [{ text: 'Go Back', onPress: () => { processingRef.current = false; router.back(); } }]
      );
      return;
    }

    if (url.includes('/api/payment/callback') && !processingRef.current) {
      handlePaymentSuccess(url);
    }
  };

  // ── Core payment success handler — called once regardless of intercept path ───
  const handlePaymentSuccess = async (callbackUrl: string) => {
    processingRef.current = true;
    try {
      // Parse razorpay params from the redirect URL
      const urlObj = new URL(callbackUrl);
      const razorpayPaymentId = urlObj.searchParams.get('razorpayPaymentId') ?? '';
      const razorpaySignature = urlObj.searchParams.get('razorpaySignature') ?? '';

      // Fetch cart items early to send to backend for fallback SQL syncing
      const cartItems = await getCart();

      // Call /verify — this places the order in the backend DB exactly ONCE
      // (we never let the WebView hit /callback, so there's no double-placement)
      const verifyRes = await fetch(getBackendUrl('/api/payment/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
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

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error(verifyData.message ?? 'Payment verification failed');
      }

      // Sync to Firebase RTDB for real-time order tracking
      const orderPayload = {
        id: verifyData.order?.id ?? razorpayOrderId,
        orderStatus: 'PLACED',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        total: parseFloat(amount ?? '0'),
        subtotal: parseFloat(subtotal ?? '0'),
        gst: parseFloat(gst ?? '0'),
        deliveryFee: parseFloat(deliveryFee ?? '0'),
        discount: parseFloat(discount ?? '0'),
        shippingAddress,
        createdAt: new Date().toISOString(),
        orderItems: cartItems,
        razorpayOrderId,
        razorpayPaymentId,
      };

      await syncOrderToRTDB(email ?? '', orderPayload);
      await clearCart();

      setSuccessOrderId(String(verifyData.order?.id ?? razorpayOrderId));
      setPaymentDone(true);
    } catch (err: any) {
      processingRef.current = false;
      Alert.alert(
        'Verification Failed',
        err?.message ?? 'Could not verify your payment. Please contact support.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  // ── Development Only: Simulate Success ────────────────────────────────────────
  const simulateSuccess = () => {
    // The backend PaymentController.java accepts "sandbox_sig" to bypass signature validation
    const dummyUrl = `http://dummy/api/payment/callback?razorpayPaymentId=pay_sandbox_${Date.now()}&razorpaySignature=sandbox_sig`;
    handlePaymentSuccess(dummyUrl);
  };

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (paymentDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ecfdf5" />
        <View style={styles.successContainer}>
          {/* Animated check circle */}
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>

          <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
          <Text style={styles.successSub}>Your order has been confirmed and is being processed.</Text>

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
            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Mode</Text>
              <View style={styles.badge}>
                <Ionicons name="card" size={12} color="#059669" />
                <Text style={styles.badgeTxt}>Razorpay</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Delivery To</Text>
              <Text style={[styles.receiptValue, { flex: 1, textAlign: 'right', fontSize: 11 }]} numberOfLines={2}>
                {shippingAddress}
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

          <TouchableOpacity
            style={styles.shopMoreBtn}
            onPress={() => router.replace('/pharmacy')}
          >
            <Text style={styles.shopMoreTxt}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── WebView Checkout ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cancel Payment?',
              'Are you sure you want to cancel this payment?',
              [
                { text: 'Continue Payment', style: 'cancel' },
                { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
              ]
            );
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="lock-closed" size={14} color="#059669" />
          <Text style={styles.headerTitle}>Secure Payment</Text>
        </View>
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByTxt}>via Razorpay</Text>
        </View>
      </View>

      {/* Amount Banner */}
      <View style={styles.amountBanner}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>₹{parseFloat(amount ?? '0').toFixed(2)}</Text>
      </View>

      {/* DEV ONLY: Test Payment Bypasser */}
      {__DEV__ && (
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: '#10B981',
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
          onPress={simulateSuccess}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            🛠️ Developer: Bypass Payment (Success)
          </Text>
        </TouchableOpacity>
      )}

      {/* WebView */}
      <View style={{ flex: 1, position: 'relative' }}>
        {!webViewError ? (
          <WebView
            source={{ html: customHtml }}
            originWhitelist={['*']}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={() => {
              setWebViewLoading(false);
              setWebViewError(true);
            }}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onNavigationStateChange={handleNavigationChange}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            style={styles.webView}
            renderLoading={() => (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={Palette.secondary} />
                <Text style={styles.loaderText}>Loading Razorpay...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="wifi-outline" size={56} color="#CBD5E1" />
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorSub}>
              Could not reach the payment server.{'\n'}Please check your internet connection.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setWebViewError(false)}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay loader while page first loads */}
        {webViewLoading && !webViewError && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={Palette.secondary} />
            <Text style={styles.loaderText}>Opening Razorpay Checkout...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Palette.text },
  poweredBy: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  poweredByTxt: { fontSize: 11, fontWeight: '700', color: '#059669' },

  // Amount banner
  amountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  amountLabel: { fontSize: 13, color: '#047857', fontWeight: '600' },
  amountValue: { fontSize: 20, fontWeight: '800', color: '#065F46' },

  // WebView
  webView: { flex: 1 },

  // Loading overlay
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  loaderText: { fontSize: 14, color: '#64748B', fontWeight: '600' },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  errorSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: 8,
  },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Success screen ────────────────────────────────────────────────────────────
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
    lineHeight: 20,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#059669' },

  trackBtn: {
    width: '100%',
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.md,
    marginBottom: 12,
    ...Shadows.md,
  },
  trackBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  shopMoreBtn: { paddingVertical: 10 },
  shopMoreTxt: { color: Palette.secondary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
