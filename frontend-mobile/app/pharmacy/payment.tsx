import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';

type PaymentTab = 'online' | 'qr';
type PaymentStatus = 'idle' | 'loading' | 'pending' | 'success' | 'failed';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  // Order summary from checkout
  const totalAmount   = parseFloat((params.total as string)       || '0');
  const subtotal      = parseFloat((params.subtotal as string)    || '0');
  const discount      = parseFloat((params.discount as string)    || '0');
  const gst           = parseFloat((params.gst as string)         || '0');
  const deliveryFee   = parseFloat((params.deliveryFee as string) || '0');
  const shippingAddress = (params.shippingAddress as string) || '';
  const latitude  = params.latitude  ? parseFloat(params.latitude  as string) : null;
  const longitude = params.longitude ? parseFloat(params.longitude as string) : null;

  // Tab state
  const [activeTab, setActiveTab] = useState<PaymentTab>('online');

  // ─── Online Checkout State ───────────────────────────────────────────────
  const [onlineStatus, setOnlineStatus] = useState<PaymentStatus>('idle');
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // ─── QR Code State ───────────────────────────────────────────────────────
  const [qrStatus, setQrStatus]       = useState<PaymentStatus>('idle');
  const [qrCodeId, setQrCodeId]       = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl]   = useState<string | null>(null);
  const [qrCloseBy, setQrCloseBy]     = useState<number>(0);  // Unix timestamp
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);
  const [qrPaidOrder, setQrPaidOrder] = useState<any>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current)    clearInterval(countdownRef.current);
  };

  // ─── ONLINE CHECKOUT ─────────────────────────────────────────────────────

  const initiateOnlineCheckout = async () => {
    try {
      setOnlineStatus('loading');

      const response = await fetch(getBackendUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, email: userEmail }),
      });

      if (!response.ok) throw new Error('Failed to create Razorpay order');
      const data = await response.json();
      setRazorpayOrderId(data.id);

      const checkoutUrl =
        getBackendUrl('/api/payment/checkout-html') +
        `?orderId=${encodeURIComponent(data.id)}` +
        `&amount=${totalAmount}` +
        `&email=${encodeURIComponent(userEmail)}` +
        `&subtotal=${subtotal}` +
        `&discount=${discount}` +
        `&gst=${gst}` +
        `&deliveryFee=${deliveryFee}` +
        `&shippingAddress=${encodeURIComponent(shippingAddress)}` +
        (latitude  ? `&latitude=${latitude}`  : '') +
        (longitude ? `&longitude=${longitude}` : '');

      setOnlineStatus('pending');
      await WebBrowser.openBrowserAsync(checkoutUrl, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      // After browser closes, check if order was placed
      await checkOnlineOrderCompletion(data.id);
    } catch (err: any) {
      console.error('Online payment error:', err);
      Alert.alert('Payment Error', err?.message || 'Could not connect to payment gateway.');
      setOnlineStatus('failed');
    }
  };

  const checkOnlineOrderCompletion = async (orderIdToCheck: string) => {
    setOnlineStatus('loading');
    try {
      const response = await fetch(
        getBackendUrl(`/api/pharmacy/orders?email=${encodeURIComponent(userEmail)}`)
      );
      if (response.ok) {
        const orders = await response.json();
        const found = orders.find((o: any) => o.razorpayOrderId === orderIdToCheck);
        if (found) {
          setCreatedOrder(found);
          setOnlineStatus('success');
          return;
        }
      }
      setOnlineStatus('failed');
    } catch {
      setOnlineStatus('failed');
    }
  };

  // ─── QR CODE PAYMENT ─────────────────────────────────────────────────────

  const generateQrCode = async () => {
    try {
      clearAllTimers();
      setQrStatus('loading');
      setQrCodeId(null);
      setQrImageUrl(null);
      setQrPaidOrder(null);
      setQrSecondsLeft(900);

      const response = await fetch(getBackendUrl('/api/payment/create-qr'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('QR creation failed: ' + errText);
      }

      const data = await response.json();
      setQrCodeId(data.id);
      setQrImageUrl(data.imageUrl);
      setQrCloseBy(data.closeBy);
      setQrStatus('pending');

      // Start 15-minute countdown
      const expiry = data.closeBy;
      countdownRef.current = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = expiry - now;
        if (remaining <= 0) {
          setQrSecondsLeft(0);
          clearAllTimers();
          setQrStatus('failed');
        } else {
          setQrSecondsLeft(remaining);
        }
      }, 1000);

      // Poll every 5 seconds for payment
      startPollingQrPayment(data.id);
    } catch (err: any) {
      console.error('QR generation error:', err);
      Alert.alert('QR Code Error', err?.message || 'Could not generate payment QR code.');
      setQrStatus('failed');
    }
  };

  const startPollingQrPayment = (id: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(getBackendUrl('/api/payment/qr-complete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrCodeId: id,
            email: userEmail,
            subtotal,
            discount,
            gst,
            deliveryFee,
            total: totalAmount,
            shippingAddress,
            latitude,
            longitude,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.paid === true) {
            clearAllTimers();
            setQrPaidOrder(result.order);
            setQrStatus('success');
          }
        }
      } catch (err) {
        console.warn('QR poll error:', err);
      }
    }, 5000);
  };

  // Auto-generate QR when switching to QR tab
  useEffect(() => {
    if (activeTab === 'qr' && qrStatus === 'idle') {
      generateQrCode();
    }
    if (activeTab === 'online' && onlineStatus === 'idle') {
      initiateOnlineCheckout();
    }
  }, [activeTab]);

  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const orderSummaryCard = (
    <View style={styles.summaryCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="receipt-outline" size={18} color="#10b981" />
        <ThemedText style={styles.cardHeaderText}>Order Summary</ThemedText>
      </View>
      {[
        { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
        ...(discount > 0 ? [{ label: 'Discount', value: `-₹${discount.toFixed(2)}`, green: true }] : []),
        { label: 'GST (12%)', value: `₹${gst.toFixed(2)}` },
        { label: 'Delivery', value: `₹${deliveryFee.toFixed(2)}` },
      ].map(r => (
        <View key={r.label} style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, (r as any).green && { color: '#10b981' }]}>{r.label}</ThemedText>
          <ThemedText style={[styles.summaryValue, (r as any).green && { color: '#10b981' }]}>{r.value}</ThemedText>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <ThemedText style={styles.totalLabel}>Total</ThemedText>
        <ThemedText style={styles.totalValue}>₹{totalAmount.toFixed(2)}</ThemedText>
      </View>
    </View>
  );

  const successView = (order: any, paymentRef: string | null, isQr: boolean) => (
    <View style={styles.successCard}>
      <View style={styles.successIconWrap}>
        <Ionicons name="checkmark-circle" size={72} color="#10b981" />
      </View>
      <ThemedText style={styles.statusTitle}>Payment Successful! 🎉</ThemedText>
      <ThemedText style={styles.statusSubtitle}>
        Your order has been confirmed and is being processed.
      </ThemedText>
      {order && (
        <View style={styles.receiptBox}>
          <View style={styles.receiptRow}>
            <ThemedText style={styles.receiptLabel}>Order ID</ThemedText>
            <ThemedText style={styles.receiptVal}>#{order.id}</ThemedText>
          </View>
          <View style={styles.receiptRow}>
            <ThemedText style={styles.receiptLabel}>Amount Paid</ThemedText>
            <ThemedText style={[styles.receiptVal, { color: '#10b981' }]}>
              ₹{order.total?.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.receiptRow}>
            <ThemedText style={styles.receiptLabel}>Method</ThemedText>
            <ThemedText style={styles.receiptVal}>{isQr ? 'UPI QR Code' : 'Razorpay Online'}</ThemedText>
          </View>
          <View style={styles.receiptRow}>
            <ThemedText style={styles.receiptLabel}>Status</ThemedText>
            <View style={styles.paidBadge}>
              <ThemedText style={styles.paidBadgeText}>PAID</ThemedText>
            </View>
          </View>
        </View>
      )}
      <Pressable style={styles.primaryBtn} onPress={() => router.push('/pharmacy/orders')}>
        <Ionicons name="bag-check-outline" size={18} color="#fff" />
        <ThemedText style={styles.primaryBtnText}>Track My Order</ThemedText>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/pharmacy/')}>
        <ThemedText style={styles.secondaryBtnText}>Continue Shopping</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { clearAllTimers(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Secure Payment</ThemedText>
        <View style={styles.razorpayBadge}>
          <ThemedText style={styles.razorpayBadgeText}>by Razorpay</ThemedText>
        </View>
      </View>

      {/* ── Payment Mode Tabs ── */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'online' && styles.tabActive]}
          onPress={() => setActiveTab('online')}>
          <Ionicons
            name="card-outline"
            size={18}
            color={activeTab === 'online' ? '#10b981' : '#64748b'}
          />
          <ThemedText style={[styles.tabText, activeTab === 'online' && styles.tabTextActive]}>
            Online Checkout
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'qr' && styles.tabActive]}
          onPress={() => setActiveTab('qr')}>
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={activeTab === 'qr' ? '#10b981' : '#64748b'}
          />
          <ThemedText style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive]}>
            UPI QR Code
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {orderSummaryCard}

        {/* ────────────── ONLINE CHECKOUT TAB ────────────── */}
        {activeTab === 'online' && (
          <>
            {onlineStatus === 'idle' || onlineStatus === 'loading' || onlineStatus === 'pending' ? (
              <View style={styles.statusCard}>
                <ActivityIndicator size="large" color="#10b981" />
                <ThemedText style={styles.loadingText}>
                  {onlineStatus === 'pending'
                    ? 'Razorpay is open in your browser...'
                    : 'Connecting to Razorpay...'}
                </ThemedText>
                <ThemedText style={styles.loadingSubText}>
                  Complete the payment in the browser window
                </ThemedText>
                {onlineStatus === 'pending' && (
                  <Pressable
                    style={[styles.primaryBtn, { marginTop: 16 }]}
                    onPress={() => checkOnlineOrderCompletion(razorpayOrderId!)}>
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                    <ThemedText style={styles.primaryBtnText}>I have paid — Check Status</ThemedText>
                  </Pressable>
                )}
              </View>
            ) : onlineStatus === 'success' ? (
              successView(createdOrder, razorpayOrderId, false)
            ) : (
              <View style={styles.failedCard}>
                <View style={styles.failedIconWrap}>
                  <Ionicons name="close-circle" size={72} color="#ef4444" />
                </View>
                <ThemedText style={styles.statusTitle}>Payment Failed</ThemedText>
                <ThemedText style={styles.statusSubtitle}>
                  The transaction was cancelled or failed. Please try again.
                </ThemedText>
                <View style={styles.btnRow}>
                  <Pressable style={[styles.primaryBtn, styles.btnHalf]} onPress={initiateOnlineCheckout}>
                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                    <ThemedText style={styles.primaryBtnText}>Retry</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryBtn, styles.btnHalf, { marginTop: 0 }]}
                    onPress={() => router.back()}>
                    <ThemedText style={styles.secondaryBtnText}>Back</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Accepted methods */}
            {(onlineStatus === 'idle' || onlineStatus === 'loading' || onlineStatus === 'pending') && (
              <View style={styles.methodsCard}>
                <ThemedText style={styles.methodsTitle}>Accepted via Online Checkout</ThemedText>
                <View style={styles.methodsRow}>
                  {[
                    { icon: 'phone-portrait-outline' as const, label: 'UPI' },
                    { icon: 'card-outline'            as const, label: 'Cards' },
                    { icon: 'business-outline'        as const, label: 'Netbanking' },
                    { icon: 'wallet-outline'          as const, label: 'Wallets' },
                  ].map(m => (
                    <View key={m.label} style={styles.methodItem}>
                      <Ionicons name={m.icon} size={22} color="#3b82f6" />
                      <ThemedText style={styles.methodLabel}>{m.label}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ────────────── UPI QR CODE TAB ────────────── */}
        {activeTab === 'qr' && (
          <>
            {qrStatus === 'loading' && (
              <View style={styles.statusCard}>
                <ActivityIndicator size="large" color="#10b981" />
                <ThemedText style={styles.loadingText}>Generating UPI QR Code...</ThemedText>
                <ThemedText style={styles.loadingSubText}>This takes just a moment</ThemedText>
              </View>
            )}

            {qrStatus === 'pending' && qrImageUrl && (
              <>
                {/* QR Code Card */}
                <View style={styles.qrCard}>
                  {/* Timer Bar */}
                  <View style={styles.qrTimerRow}>
                    <View style={styles.qrTimerDot} />
                    <ThemedText style={styles.qrTimerText}>
                      Expires in{' '}
                      <ThemedText style={[
                        styles.qrTimerText,
                        styles.qrTimerBold,
                        qrSecondsLeft < 60 && { color: '#ef4444' },
                      ]}>
                        {formatTime(qrSecondsLeft)}
                      </ThemedText>
                    </ThemedText>
                    <View style={[styles.qrTimerDot, { backgroundColor: '#10b981' }]} />
                  </View>

                  {/* QR Image */}
                  <View style={styles.qrImageWrap}>
                    <Image
                      source={{ uri: qrImageUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    {/* Scanning pulse ring */}
                    <View style={styles.qrCornerTL} />
                    <View style={styles.qrCornerTR} />
                    <View style={styles.qrCornerBL} />
                    <View style={styles.qrCornerBR} />
                  </View>

                  {/* Amount */}
                  <View style={styles.qrAmountRow}>
                    <ThemedText style={styles.qrAmountLabel}>Pay exactly</ThemedText>
                    <ThemedText style={styles.qrAmountValue}>₹{totalAmount.toFixed(2)}</ThemedText>
                  </View>

                  {/* Waiting indicator */}
                  <View style={styles.qrWaitRow}>
                    <ActivityIndicator size="small" color="#10b981" />
                    <ThemedText style={styles.qrWaitText}>Waiting for payment...</ThemedText>
                  </View>

                  {/* Instructions */}
                  <View style={styles.qrInstructions}>
                    {[
                      '📱 Open Google Pay, PhonePe, Paytm or BHIM',
                      '📸 Tap "Scan QR" and point at this code',
                      `💳 Confirm payment of ₹${totalAmount.toFixed(2)}`,
                      '✅ Order will be placed automatically!',
                    ].map((step, i) => (
                      <View key={i} style={styles.instructionRow}>
                        <ThemedText style={styles.instructionText}>{step}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>

                {/* UPI Apps */}
                <View style={styles.upiAppsCard}>
                  <ThemedText style={styles.upiAppsTitle}>Scan with any UPI App</ThemedText>
                  <View style={styles.upiAppsRow}>
                    {[
                      { name: 'Google Pay',  color: '#4285f4', icon: 'logo-google'  as const },
                      { name: 'PhonePe',    color: '#5f259f', icon: 'phone-portrait-outline' as const },
                      { name: 'Paytm',      color: '#002970', icon: 'wallet-outline' as const },
                      { name: 'BHIM',       color: '#ef4444', icon: 'qr-code-outline' as const },
                    ].map(app => (
                      <View key={app.name} style={styles.upiApp}>
                        <View style={[styles.upiAppIcon, { backgroundColor: app.color + '15' }]}>
                          <Ionicons name={app.icon} size={22} color={app.color} />
                        </View>
                        <ThemedText style={styles.upiAppName}>{app.name}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Refresh & Manual check */}
                <View style={styles.qrActionRow}>
                  <Pressable style={styles.refreshBtn} onPress={generateQrCode}>
                    <Ionicons name="refresh-outline" size={18} color="#10b981" />
                    <ThemedText style={styles.refreshBtnText}>New QR Code</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.checkBtn}
                    onPress={async () => {
                      if (!qrCodeId) return;
                      const res = await fetch(getBackendUrl('/api/payment/qr-complete'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          qrCodeId,
                          email: userEmail,
                          subtotal, discount, gst, deliveryFee,
                          total: totalAmount,
                          shippingAddress, latitude, longitude,
                        }),
                      });
                      const result = await res.json();
                      if (result.paid) {
                        clearAllTimers();
                        setQrPaidOrder(result.order);
                        setQrStatus('success');
                      } else {
                        Alert.alert('Not Yet', 'Payment not detected yet. Please scan and complete the UPI payment.');
                      }
                    }}>
                    <Ionicons name="search-outline" size={18} color="#fff" />
                    <ThemedText style={styles.checkBtnText}>I've Paid — Check</ThemedText>
                  </Pressable>
                </View>
              </>
            )}

            {qrStatus === 'success' && successView(qrPaidOrder, qrCodeId, true)}

            {qrStatus === 'failed' && (
              <View style={styles.failedCard}>
                <View style={styles.failedIconWrap}>
                  <Ionicons name="time-outline" size={72} color="#f59e0b" />
                </View>
                <ThemedText style={styles.statusTitle}>QR Code Expired</ThemedText>
                <ThemedText style={styles.statusSubtitle}>
                  The QR code has expired or no payment was received.
                </ThemedText>
                <Pressable style={styles.primaryBtn} onPress={generateQrCode}>
                  <Ionicons name="qr-code-outline" size={18} color="#fff" />
                  <ThemedText style={styles.primaryBtnText}>Generate New QR Code</ThemedText>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
                  <ThemedText style={styles.secondaryBtnText}>Back to Checkout</ThemedText>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* Security footer */}
        <View style={styles.securityRow}>
          {[
            { icon: 'shield-checkmark' as const, label: '256-bit SSL' },
            { icon: 'lock-closed'      as const, label: 'PCI DSS' },
            { icon: 'card'             as const, label: 'Razorpay' },
          ].map(b => (
            <View key={b.label} style={styles.securityBadge}>
              <Ionicons name={b.icon} size={14} color="#059669" />
              <ThemedText style={styles.securityText}>{b.label}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  razorpayBadge: {
    backgroundColor: '#0c1a30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  razorpayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // ── Tabs ────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#10b981',
  },
  // ── Scroll ──────────────────────────────
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 14,
  },
  // ── Summary Card ────────────────────────
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
  },
  // ── Status / Loading ─────────────────────
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // ── Success ─────────────────────────────
  successCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successIconWrap: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 999,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: { fontSize: 12, color: '#64748b' },
  receiptVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  paidBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  // ── Failed ──────────────────────────────
  failedCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  failedIconWrap: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 999,
  },
  // ── Buttons ──────────────────────────────
  primaryBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    marginTop: 8,
  },
  secondaryBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  btnHalf: {
    flex: 1,
    width: undefined,
    marginTop: 0,
  },
  // ── Methods card ─────────────────────────
  methodsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  methodsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  methodItem: { alignItems: 'center', gap: 5 },
  methodLabel: { fontSize: 11, color: '#334155', fontWeight: '600' },
  // ── QR Card ──────────────────────────────
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  qrTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrTimerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  qrTimerText: {
    fontSize: 13,
    color: '#64748b',
  },
  qrTimerBold: {
    fontWeight: 'bold',
    color: '#334155',
  },
  qrImageWrap: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 8,
  },
  // QR corner decorators
  qrCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10b981',
    borderRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10b981',
    borderRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10b981',
    borderRadius: 4,
  },
  qrCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10b981',
    borderRadius: 4,
  },
  qrAmountRow: { alignItems: 'center', gap: 2 },
  qrAmountLabel: { fontSize: 12, color: '#64748b' },
  qrAmountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  qrWaitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  qrWaitText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  qrInstructions: {
    width: '100%',
    gap: 8,
  },
  instructionRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  // ── UPI Apps card ─────────────────────────
  upiAppsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  upiAppsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upiAppsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  upiApp: { alignItems: 'center', gap: 6 },
  upiAppIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiAppName: { fontSize: 10, color: '#475569', fontWeight: '600' },
  // ── QR Action Buttons ─────────────────────
  qrActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#ffffff',
  },
  refreshBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  checkBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 13,
  },
  checkBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // ── Security footer ──────────────────────
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  securityBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '600',
  },
});
