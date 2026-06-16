import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

type PaymentTab = 'online' | 'qr';
type PaymentStatus = 'idle' | 'loading' | 'pending' | 'success' | 'failed';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const totalAmount = parseFloat((params.total as string) || '0');
  const subtotal = parseFloat((params.subtotal as string) || '0');
  const discount = parseFloat((params.discount as string) || '0');
  const gst = parseFloat((params.gst as string) || '0');
  const deliveryFee = parseFloat((params.deliveryFee as string) || '0');
  const shippingAddress = (params.shippingAddress as string) || '';
  const latitude = params.latitude ? parseFloat(params.latitude as string) : null;
  const longitude = params.longitude ? parseFloat(params.longitude as string) : null;

  const [activeTab, setActiveTab] = useState<PaymentTab>('online');

  const [onlineStatus, setOnlineStatus] = useState<PaymentStatus>('idle');
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const [qrStatus, setQrStatus] = useState<PaymentStatus>('idle');
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);
  const [qrPaidOrder, setQrPaidOrder] = useState<any>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      Alert.alert('Auth Required', 'Please log in.');
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const initiateOnlineCheckout = async () => {
    try {
      setOnlineStatus('loading');
      const res = await fetch(getBackendUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, email: userEmail }),
      });
      if (!res.ok) throw new Error('Razorpay failed');
      const data = await res.json();
      setRazorpayOrderId(data.id);

      const url = getBackendUrl('/api/payment/checkout-html') +
        `?orderId=${data.id}&amount=${totalAmount}&email=${userEmail}&subtotal=${subtotal}&discount=${discount}&gst=${gst}&deliveryFee=${deliveryFee}&shippingAddress=${shippingAddress}` +
        (latitude ? `&latitude=${latitude}` : '') +
        (longitude ? `&longitude=${longitude}` : '');

      setOnlineStatus('pending');
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
      checkOnlineOrderCompletion(data.id);
    } catch (e) {
      setOnlineStatus('failed');
    }
  };

  const checkOnlineOrderCompletion = async (id: string) => {
    setOnlineStatus('loading');
    try {
      const res = await fetch(getBackendUrl(`/api/pharmacy/orders?email=${userEmail}`));
      if (res.ok) {
        const orders = await res.json();
        const found = orders.find((o: any) => o.razorpayOrderId === id);
        if (found) {
          setCreatedOrder(found);
          return setOnlineStatus('success');
        }
      }
      setOnlineStatus('failed');
    } catch {
      setOnlineStatus('failed');
    }
  };

  const generateQrCode = async () => {
    try {
      clearAllTimers();
      setQrStatus('loading');
      setQrSecondsLeft(900);

      const res = await fetch(getBackendUrl('/api/payment/create-qr'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!res.ok) throw new Error('QR failed');
      const data = await res.json();
      setQrCodeId(data.id);
      setQrImageUrl(data.imageUrl);
      setQrStatus('pending');

      const expiry = data.closeBy;
      countdownRef.current = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const rem = expiry - now;
        if (rem <= 0) {
          setQrSecondsLeft(0);
          clearAllTimers();
          setQrStatus('failed');
        } else {
          setQrSecondsLeft(rem);
        }
      }, 1000);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(getBackendUrl('/api/payment/qr-complete'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrCodeId: data.id, email: userEmail, subtotal, discount, gst, deliveryFee, total: totalAmount, shippingAddress, latitude, longitude
            }),
          });
          if (checkRes.ok) {
            const resJson = await checkRes.json();
            if (resJson.paid) {
              clearAllTimers();
              setQrPaidOrder(resJson.order);
              setQrStatus('success');
            }
          }
        } catch {}
      }, 5000);
    } catch (e) {
      setQrStatus('failed');
    }
  };

  useEffect(() => {
    if (activeTab === 'qr' && qrStatus === 'idle') generateQrCode();
    if (activeTab === 'online' && onlineStatus === 'idle') initiateOnlineCheckout();
  }, [activeTab]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (authLoading) return <View style={styles.centered}><ActivityIndicator color={Palette.secondary} size="large" /></View>;

  const renderSuccess = (order: any, isQr: boolean) => (
    <View style={styles.successCard}>
      <View style={styles.successIconBox}><Ionicons name="checkmark-circle" size={60} color="#059669" /></View>
      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successSub}>Your order has been confirmed.</Text>
      {order && (
        <View style={styles.receipt}>
          <View style={styles.receiptRow}><Text style={styles.receiptLbl}>Order ID</Text><Text style={styles.receiptVal}>#{order.id}</Text></View>
          <View style={styles.receiptRow}><Text style={styles.receiptLbl}>Paid</Text><Text style={[styles.receiptVal, { color: '#059669' }]}>₹{order.total?.toFixed(2)}</Text></View>
          <View style={styles.receiptRow}><Text style={styles.receiptLbl}>Method</Text><Text style={styles.receiptVal}>{isQr ? 'UPI QR' : 'Razorpay'}</Text></View>
        </View>
      )}
      <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/pharmacy/orders')}>
        <Text style={styles.btnPrimaryTxt}>Track Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { clearAllTimers(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'online' && styles.tabActive]} onPress={() => setActiveTab('online')}>
          <Text style={[styles.tabTxt, activeTab === 'online' && styles.tabTxtActive]}>Online Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'qr' && styles.tabActive]} onPress={() => setActiveTab('qr')}>
          <Text style={[styles.tabTxt, activeTab === 'qr' && styles.tabTxtActive]}>UPI QR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLbl}>Subtotal</Text><Text style={styles.summaryVal}>₹{subtotal.toFixed(2)}</Text></View>
          {discount > 0 && <View style={styles.summaryRow}><Text style={[styles.summaryLbl, { color: '#10B981' }]}>Discount</Text><Text style={[styles.summaryVal, { color: '#10B981' }]}>-₹{discount.toFixed(2)}</Text></View>}
          <View style={styles.summaryRow}><Text style={styles.summaryLbl}>Taxes</Text><Text style={styles.summaryVal}>₹{gst.toFixed(2)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.totalLbl}>Total Payable</Text><Text style={styles.totalVal}>₹{totalAmount.toFixed(2)}</Text></View>
        </View>

        {activeTab === 'online' && (
          <View style={{ marginTop: 20 }}>
            {['idle', 'loading', 'pending'].includes(onlineStatus) ? (
              <View style={styles.statusBox}>
                <ActivityIndicator color={Palette.secondary} size="large" />
                <Text style={styles.statusTxt}>{onlineStatus === 'pending' ? 'Complete payment in browser' : 'Connecting to Razorpay...'}</Text>
                {onlineStatus === 'pending' && (
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => checkOnlineOrderCompletion(razorpayOrderId!)}>
                    <Text style={styles.btnPrimaryTxt}>Check Status</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : onlineStatus === 'success' ? renderSuccess(createdOrder, false) : (
              <View style={styles.statusBox}>
                <Ionicons name="close-circle" size={48} color={Palette.danger} />
                <Text style={styles.statusTxt}>Payment Failed</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={initiateOnlineCheckout}><Text style={styles.btnPrimaryTxt}>Retry</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'qr' && (
          <View style={{ marginTop: 20 }}>
            {qrStatus === 'loading' ? (
               <View style={styles.statusBox}><ActivityIndicator color={Palette.secondary} size="large" /><Text style={styles.statusTxt}>Generating QR...</Text></View>
            ) : qrStatus === 'pending' ? (
              <View style={styles.qrCard}>
                <Text style={styles.qrTimer}>Expires in {formatTime(qrSecondsLeft)}</Text>
                <View style={styles.qrImgBox}><Image source={{ uri: qrImageUrl! }} style={styles.qrImg} /></View>
                <Text style={styles.qrAmount}>Pay exactly ₹{totalAmount.toFixed(2)}</Text>
                <ActivityIndicator color={Palette.secondary} style={{ marginTop: 20 }} />
                <Text style={styles.qrWaitTxt}>Awaiting Payment...</Text>
              </View>
            ) : qrStatus === 'success' ? renderSuccess(qrPaidOrder, true) : (
              <View style={styles.statusBox}>
                <Ionicons name="time" size={48} color={Palette.danger} />
                <Text style={styles.statusTxt}>QR Expired or Failed</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={generateQrCode}><Text style={styles.btnPrimaryTxt}>Generate New</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Palette.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Palette.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Palette.secondary },
  tabTxt: { fontSize: 15, fontWeight: '600', color: Palette.textMuted },
  tabTxtActive: { color: Palette.secondary },

  content: { padding: Spacing.md, paddingBottom: 60 },
  summaryCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLbl: { fontSize: 14, color: Palette.textMuted },
  summaryVal: { fontSize: 14, fontWeight: '600', color: Palette.text },
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: 12 },
  totalLbl: { fontSize: 16, fontWeight: '700', color: Palette.text },
  totalVal: { fontSize: 18, fontWeight: '800', color: Palette.secondary },

  statusBox: { backgroundColor: '#fff', padding: 30, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: Palette.border, gap: 16 },
  statusTxt: { fontSize: 16, fontWeight: '600', color: Palette.text },
  btnPrimary: { backgroundColor: Palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md, width: '100%', alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  qrCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  qrTimer: { fontSize: 15, fontWeight: '700', color: Palette.danger, marginBottom: 20 },
  qrImgBox: { padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, ...Shadows.md },
  qrImg: { width: 200, height: 200 },
  qrAmount: { fontSize: 20, fontWeight: '800', color: Palette.text, marginTop: 20 },
  qrWaitTxt: { fontSize: 14, color: Palette.textMuted, marginTop: 10 },

  successCard: { backgroundColor: '#ECFDF5', padding: 24, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
  successIconBox: { marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 14, color: '#047857', marginTop: 4, marginBottom: 20 },
  receipt: { width: '100%', backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, gap: 10, marginBottom: 20 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLbl: { fontSize: 13, color: Palette.textMuted },
  receiptVal: { fontSize: 13, fontWeight: '700', color: Palette.text },
});
