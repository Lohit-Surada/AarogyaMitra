import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { saveOrderToFirebase } from '@/services/firebaseService';
import { syncOrderToRTDB, sanitizeEmail } from '@/services/rtdbService';
import { getCart, clearCart, CartItem } from '@/services/cartService';
import { getBackendUrl } from '@/utils/api';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, set, push } from 'firebase/database';

type Address = {
  id: number;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
};

type PlacedOrder = {
  id: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  shippingAddress: string;
  createdAt: string;
  orderItems?: any[];
};

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const userEmail = user?.email ?? '';

  const baseSubtotal = parseFloat((params.subtotal as string) || '0');
  const baseDiscount = parseFloat((params.discount as string) || '0');
  const baseGst = parseFloat((params.gst as string) || '0');
  const baseDeliveryFee = parseFloat((params.deliveryFee as string) || '0');
  const baseTotal = parseFloat((params.total as string) || '0');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');

  const [loading, setLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Compliance & Checkout State
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [legalConsent, setLegalConsent] = useState(false);

  // Success modal state
  const [successVisible, setSuccessVisible] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  // New address inputs
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateVal, setNewStateVal] = useState('');
  const [newZip, setNewZip] = useState('');

  // ── Auth guard ────────────────────────────────────────────────────────────
  // If user is not logged in, redirect them to login
  useEffect(() => {
    if (!authLoading && !user) {
      Alert.alert(
        'Login Required',
        'Please sign in to proceed with checkout.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          {
            text: 'Sign In',
            onPress: () =>
              router.replace({
                pathname: '/login',
                params: { returnUrl: '/pharmacy/cart' },
              }),
          },
        ],
        { cancelable: false }
      );
    }
  }, [user, authLoading]);

  const activeDeliveryFee = deliverySpeed === 'express' ? baseDeliveryFee + 50 : baseDeliveryFee;
  const activeTotal = baseTotal + (deliverySpeed === 'express' ? 50 : 0);

  const fetchAddresses = useCallback(async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const emailKey = sanitizeEmail(userEmail);
      const snap = await get(ref(realtimeDb, `users/${emailKey}/addresses`));
      if (snap.exists()) {
        const data = snap.val();
        const addrList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setAddresses(addrList);
        if (addrList.length > 0) setSelectedAddressId(addrList[0].id);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddAddress = async () => {
    if (!newName || !newPhone || !newStreet || !newCity || !newStateVal || !newZip) {
      return Alert.alert('Missing Fields', 'Please fill in all address details.');
    }
    try {
      const emailKey = sanitizeEmail(userEmail);
      const newAddrRef = push(ref(realtimeDb, `users/${emailKey}/addresses`));
      const payload = {
        name: newName,
        phone: newPhone,
        addressLine: newStreet,
        city: newCity,
        state: newStateVal,
        zipCode: newZip,
        latitude: 12.9716,
        longitude: 77.5946,
      };
      await set(newAddrRef, payload);
      
      setShowAddAddress(false);
      fetchAddresses();
      setSelectedAddressId(newAddrRef.key as any);
      setNewName(''); setNewPhone(''); setNewStreet('');
      setNewCity(''); setNewStateVal(''); setNewZip('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      return Alert.alert('Login Required', 'Please sign in first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.replace({ pathname: '/login', params: { returnUrl: '/pharmacy/cart' } }) },
      ]);
    }
    if (!selectedAddressId) return Alert.alert('Select Address', 'Please select a delivery address.');
    if (!legalConsent) return Alert.alert('Consent Required', 'You must agree to our Terms, Privacy Policy, and Refund Policy to proceed.');
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;

    const fullAddr = `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.zipCode}. Ph: ${address.phone}`;

    try {
      setPlacingOrder(true);
      
      const cartItems = await getCart();
      if (cartItems.length === 0) {
        setPlacingOrder(false);
        return Alert.alert('Cart Empty', 'You have no items in your cart to place an order.');
      }

      const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      if (paymentMethod === 'cod') {
        // --- COD Flow: Place order via backend ---
        const cartItems = await getCart();
        if (cartItems.length === 0) {
          setPlacingOrder(false);
          return Alert.alert('Cart Empty', 'You have no items in your cart to place an order.');
        }

        const token = user ? await (user as any).getIdToken?.() : null;
        const codRes = await fetch(getBackendUrl('/api/pharmacy/orders/cod'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            shippingAddress: fullAddr,
            subtotal: baseSubtotal,
            discount: baseDiscount,
            gst: baseGst,
            deliveryFee: activeDeliveryFee,
            total: activeTotal,
            latitude: address.latitude ?? null,
            longitude: address.longitude ?? null,
            orderItems: cartItems,
          }),
        });

        let savedOrder: PlacedOrder;
        if (codRes.ok) {
          savedOrder = await codRes.json();
        } else {
          // Fallback: create a local order object if backend fails
          savedOrder = {
            id: orderId as any,
            orderStatus: 'PLACED',
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            total: activeTotal,
            subtotal: baseSubtotal,
            gst: baseGst,
            deliveryFee: activeDeliveryFee,
            shippingAddress: fullAddr,
            createdAt: new Date().toISOString(),
            orderItems: cartItems,
          };
        }

        const rtdbPayload = {
          ...savedOrder,
          id: String(savedOrder.id ?? orderId),
          orderStatus: 'PLACED',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          total: activeTotal,
          subtotal: baseSubtotal,
          gst: baseGst,
          deliveryFee: activeDeliveryFee,
          shippingAddress: fullAddr,
          createdAt: new Date().toISOString(),
          orderItems: cartItems,
        };
        await syncOrderToRTDB(userEmail, rtdbPayload);
        await clearCart();
        setPlacedOrder(savedOrder);
        setSuccessVisible(true);
        setPlacingOrder(false);
      } else {
        // --- Real Razorpay WebView Flow ---
        // First create a Razorpay order on the backend, then open the payment screen
        let createOrderRes: Response;
        try {
          createOrderRes = await fetch(
            getBackendUrl('/api/payment/create-order'),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: activeTotal, email: userEmail }),
            }
          );
        } catch (networkErr: any) {
          throw new Error(
            'Cannot reach the payment server. Please check your internet connection and try again.'
          );
        }

        if (!createOrderRes.ok) {
          let errDetail = '';
          try { errDetail = await createOrderRes.text(); } catch {}
          if (createOrderRes.status === 500) {
            throw new Error(
              'Payment service is not configured on the server.\n\nIf you are the admin, please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your Render environment variables.'
            );
          }
          throw new Error(`Payment server error (${createOrderRes.status}): ${errDetail || 'Unknown error'}`);
        }

        const razorpayOrder = await createOrderRes.json();

        setPlacingOrder(false);

        // Navigate to the payment WebView screen with all needed params
        router.push({
          pathname: '/pharmacy/payment',
          params: {
            razorpayOrderId: razorpayOrder.id,
            amount: String(activeTotal),
            email: userEmail,
            subtotal: String(baseSubtotal),
            discount: String(baseDiscount),
            gst: String(baseGst),
            deliveryFee: String(activeDeliveryFee),
            shippingAddress: fullAddr,
            latitude: String(address.latitude ?? ''),
            longitude: String(address.longitude ?? ''),
          },
        });
      }
    } catch (error: any) {
      const message = error?.message ?? 'Could not complete checkout. Please try again.';
      Alert.alert('Checkout Failed', message);
      setPlacingOrder(false);
    }
  };

  // ── Success Modal ─────────────────────────────────────────────────────────
  const renderSuccessModal = () => (
    <Modal visible={successVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          {/* Check icon */}
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>

          <Text style={styles.successTitle}>Order Confirmed! 🎉</Text>
          <Text style={styles.successSub}>Your order has been placed successfully.</Text>

          {placedOrder && (
            <View style={styles.orderDetailBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>#{placedOrder.id}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>Cash on Delivery</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeTxt}>{placedOrder.orderStatus}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <Text style={styles.detailValue}>₹{(placedOrder.subtotal ?? baseSubtotal).toFixed(2)}</Text>
              </View>
              {baseDiscount > 0 && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: '#10B981' }]}>Discount</Text>
                    <Text style={[styles.detailValue, { color: '#10B981' }]}>-₹{baseDiscount.toFixed(2)}</Text>
                  </View>
                </>
              )}
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Taxes (GST)</Text>
                <Text style={styles.detailValue}>₹{(placedOrder.gst ?? baseGst).toFixed(2)}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery</Text>
                <Text style={styles.detailValue}>₹{(placedOrder.deliveryFee ?? activeDeliveryFee).toFixed(2)}</Text>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: '#D1FAE5' }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { fontWeight: '800', fontSize: 15, color: '#065F46' }]}>Total Paid</Text>
                <Text style={[styles.detailValue, { fontWeight: '800', fontSize: 16, color: '#059669' }]}>
                  ₹{(placedOrder.total ?? activeTotal).toFixed(2)}
                </Text>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.addressTxt} numberOfLines={3}>
                  {placedOrder.shippingAddress ?? fullOrderAddress()}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => {
              setSuccessVisible(false);
              router.replace('/pharmacy/orders');
            }}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={styles.trackBtnTxt}>Track My Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shopMoreBtn}
            onPress={() => {
              setSuccessVisible(false);
              router.replace('/pharmacy');
            }}
          >
            <Text style={styles.shopMoreTxt}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const fullOrderAddress = () => {
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return '';
    return `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.zipCode}`;
  };

  if (!user) return null; // Wait for auth guard alert

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderSuccessModal()}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📦 Delivery Address</Text>
            {!showAddAddress && (
              <TouchableOpacity onPress={() => setShowAddAddress(true)}>
                <Text style={styles.addTxt}>+ Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddAddress ? (
            <View style={styles.formWrap}>
              <TextInput style={styles.input} placeholder="Receiver Name" placeholderTextColor="#94a3b8" value={newName} onChangeText={setNewName} />
              <TextInput style={styles.input} placeholder="Mobile Number" placeholderTextColor="#94a3b8" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Street Address" placeholderTextColor="#94a3b8" value={newStreet} onChangeText={setNewStreet} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" placeholderTextColor="#94a3b8" value={newCity} onChangeText={setNewCity} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" placeholderTextColor="#94a3b8" value={newStateVal} onChangeText={setNewStateVal} />
              </View>
              <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor="#94a3b8" value={newZip} onChangeText={setNewZip} keyboardType="numeric" />
              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => setShowAddAddress(false)}>
                  <Text style={{ color: Palette.danger, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.formBtn, { backgroundColor: Palette.secondary }]} onPress={handleAddAddress}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : loading ? (
            <ActivityIndicator size="small" color={Palette.secondary} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyAddr}>
              <Ionicons name="location-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTxt}>No saved addresses. Add one above.</Text>
            </View>
          ) : (
            addresses.map(addr => {
              const isSel = selectedAddressId === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addrBox, isSel && styles.addrBoxSel]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <Ionicons
                    name={isSel ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSel ? Palette.secondary : Palette.textMuted}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.addrName}>{addr.name}</Text>
                    <Text style={styles.addrSub}>{addr.addressLine}, {addr.city}, {addr.state} – {addr.zipCode}</Text>
                    <Text style={styles.addrSub}>📞 {addr.phone}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Delivery Speed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚚 Delivery Speed</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.speedBox, deliverySpeed === 'standard' && styles.speedBoxSel]}
              onPress={() => setDeliverySpeed('standard')}
            >
              <Ionicons name="bicycle" size={24} color={deliverySpeed === 'standard' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>Standard</Text>
              <Text style={styles.speedSub}>2–3 Days · Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.speedBox, deliverySpeed === 'express' && styles.speedBoxSel]}
              onPress={() => setDeliverySpeed('express')}
            >
              <Ionicons name="flash" size={24} color={deliverySpeed === 'express' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>Express</Text>
              <Text style={styles.speedSub}>1 Day · +₹50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Payment Method</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.speedBox, paymentMethod === 'cod' && styles.speedBoxSel]}
              onPress={() => setPaymentMethod('cod')}
            >
              <Ionicons name="cash" size={24} color={paymentMethod === 'cod' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>COD</Text>
              <Text style={styles.speedSub}>Cash on Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.speedBox, paymentMethod === 'razorpay' && styles.speedBoxSel]}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <Ionicons name="card" size={24} color={paymentMethod === 'razorpay' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>Online</Text>
              <Text style={styles.speedSub}>UPI & Cards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Consent */}
        <View style={[styles.card, { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 }]}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'flex-start', paddingRight: 20 }}
            onPress={() => setLegalConsent(!legalConsent)}
          >
            <Ionicons 
              name={legalConsent ? "checkbox" : "square-outline"} 
              size={22} 
              color={legalConsent ? Palette.primary : Palette.textMuted} 
              style={{ marginTop: 2 }}
            />
            <Text style={{ marginLeft: 10, fontSize: 13, color: Palette.text, lineHeight: 18 }}>
              I agree to the <Text style={{ color: Palette.primary, fontWeight: '600' }} onPress={() => router.push({ pathname: '/legal', params: { type: 'terms' } })}>Terms & Conditions</Text>, <Text style={{ color: Palette.primary, fontWeight: '600' }} onPress={() => router.push({ pathname: '/legal', params: { type: 'privacy' } })}>Privacy Policy</Text>, and <Text style={{ color: Palette.primary, fontWeight: '600' }} onPress={() => router.push({ pathname: '/legal', params: { type: 'refund' } })}>Refund Policy</Text>.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLbl}>Subtotal</Text><Text style={styles.summaryVal}>₹{baseSubtotal.toFixed(2)}</Text></View>
          {baseDiscount > 0 && <View style={styles.summaryRow}><Text style={[styles.summaryLbl, { color: '#10B981' }]}>Discount</Text><Text style={[styles.summaryVal, { color: '#10B981' }]}>-₹{baseDiscount.toFixed(2)}</Text></View>}
          <View style={styles.summaryRow}><Text style={styles.summaryLbl}>Taxes (GST)</Text><Text style={styles.summaryVal}>₹{baseGst.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLbl}>Delivery</Text><Text style={styles.summaryVal}>₹{activeDeliveryFee.toFixed(2)}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLbl, { fontWeight: '800', fontSize: 15, color: Palette.text }]}>Total</Text>
            <Text style={[styles.summaryVal, { fontWeight: '800', fontSize: 17, color: Palette.secondary }]}>₹{activeTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footLbl}>Total to Pay</Text>
          <Text style={styles.footVal}>₹{activeTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.buyBtn} onPress={handlePlaceOrder} disabled={placingOrder}>
          {placingOrder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buyBtnTxt}>Confirm Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },

  scroll: { padding: Spacing.md, paddingBottom: 120, gap: 16 },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Palette.text, marginBottom: 12 },
  addTxt: { fontSize: 13, fontWeight: '700', color: Palette.secondary },

  formWrap: { gap: 10 },
  input: { backgroundColor: '#F8FAFC', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Palette.text, borderWidth: 1, borderColor: Palette.border },
  row: { flexDirection: 'row', gap: 10 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  formBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },

  emptyAddr: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyTxt: { textAlign: 'center', color: Palette.textMuted, fontSize: 13 },
  addrBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1.5, borderColor: Palette.border, borderRadius: Radius.md, marginBottom: 10 },
  addrBoxSel: { borderColor: Palette.secondary, backgroundColor: '#F0FDF4' },
  addrName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  addrSub: { fontSize: 13, color: Palette.textMuted, marginTop: 2 },

  speedBox: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1.5, borderColor: Palette.border, borderRadius: Radius.md, gap: 6 },
  speedBoxSel: { borderColor: Palette.secondary, backgroundColor: '#F0FDF4' },
  speedName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  speedSub: { fontSize: 12, color: Palette.textMuted },

  payName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  paySub: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLbl: { fontSize: 14, color: Palette.textMuted },
  summaryVal: { fontSize: 14, fontWeight: '600', color: Palette.text },
  summaryDivider: { height: 1, backgroundColor: Palette.border, marginVertical: 10 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: Palette.border, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 16,
  },
  footLbl: { fontSize: 12, color: Palette.textMuted },
  footVal: { fontSize: 22, fontWeight: '800', color: Palette.text },
  buyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.secondary, paddingHorizontal: 22, paddingVertical: 14, borderRadius: Radius.md, gap: 8 },
  buyBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Success Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...Shadows.lg,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#065F46', textAlign: 'center' },
  successSub: { fontSize: 14, color: '#047857', marginTop: 6, marginBottom: 20, textAlign: 'center' },

  orderDetailBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  detailDivider: { height: 1, backgroundColor: '#D1FAE5', marginVertical: 2 },

  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  addressTxt: { fontSize: 12, color: '#64748B', flex: 1, lineHeight: 18 },

  trackBtn: {
    width: '100%',
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginBottom: 10,
  },
  trackBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  shopMoreBtn: { paddingVertical: 10 },
  shopMoreTxt: { color: Palette.secondary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
