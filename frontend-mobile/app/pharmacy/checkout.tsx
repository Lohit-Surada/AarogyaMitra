import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getBackendUrl } from '@/utils/api';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

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

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const baseSubtotal = parseFloat((params.subtotal as string) || '0');
  const baseDiscount = parseFloat((params.discount as string) || '0');
  const baseGst = parseFloat((params.gst as string) || '0');
  const baseDeliveryFee = parseFloat((params.deliveryFee as string) || '0');
  const baseTotal = parseFloat((params.total as string) || '0');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const [loading, setLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateVal, setNewStateVal] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newLat, setNewLat] = useState<number>(12.9716);
  const [newLng, setNewLng] = useState<number>(77.5946);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(getBackendUrl(`/api/pharmacy/addresses?email=${userEmail}`));
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) setSelectedAddressId(data[0].id);
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
      const res = await fetch(getBackendUrl(`/api/pharmacy/addresses/add?email=${userEmail}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          addressLine: newStreet,
          city: newCity,
          state: newStateVal,
          zipCode: newZip,
          latitude: newLat,
          longitude: newLng,
        }),
      });

      if (res.ok) {
        const added = await res.json();
        setShowAddAddress(false);
        fetchAddresses();
        setSelectedAddressId(added.id);
        setNewName(''); setNewPhone(''); setNewStreet('');
        setNewCity(''); setNewStateVal(''); setNewZip('');
      } else {
        Alert.alert('Error', 'Failed to add address.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeDeliveryFee = deliverySpeed === 'express' ? baseDeliveryFee + 50 : baseDeliveryFee;
  const activeTotal = baseTotal + (deliverySpeed === 'express' ? 50 : 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      return Alert.alert('Auth Required', 'Please log in to continue.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push({ pathname: '/login', params: { returnUrl: '/pharmacy/checkout' } }) },
      ]);
    }
    if (!selectedAddressId) return Alert.alert('Address Required', 'Select a delivery address.');

    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;
    const fullAddr = `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.zipCode}. Ph: ${address.phone}`;

    if (paymentMethod === 'cod') {
      try {
        setPlacingOrder(true);
        const res = await fetch(getBackendUrl(`/api/pharmacy/orders/place-cod?email=${userEmail}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: fullAddr,
            latitude: address.latitude,
            longitude: address.longitude,
            subtotal: baseSubtotal,
            discount: baseDiscount,
            gst: baseGst,
            deliveryFee: activeDeliveryFee,
            total: activeTotal,
          }),
        });
        if (res.ok) {
          Alert.alert('Order Confirmed', 'Your COD order has been placed successfully!', [
            { text: 'View Orders', onPress: () => router.push('/pharmacy/orders') },
          ]);
        } else {
          Alert.alert('Error', 'Could not complete checkout.');
        }
      } catch (error) {
        Alert.alert('Error', 'Server connection error.');
      } finally {
        setPlacingOrder(false);
      }
    } else {
      router.push({
        pathname: '/pharmacy/payment',
        params: {
          total: activeTotal.toString(),
          subtotal: baseSubtotal.toString(),
          discount: baseDiscount.toString(),
          gst: baseGst.toString(),
          deliveryFee: activeDeliveryFee.toString(),
          shippingAddress: fullAddr,
          latitude: (address.latitude || '').toString(),
          longitude: (address.longitude || '').toString(),
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.cardTitle}>Delivery Address</Text>
            {!showAddAddress && (
              <TouchableOpacity onPress={() => setShowAddAddress(true)}>
                <Text style={styles.addTxt}>+ Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddAddress ? (
            <View style={styles.formWrap}>
              <TextInput style={styles.input} placeholder="Receiver Name" value={newName} onChangeText={setNewName} />
              <TextInput style={styles.input} placeholder="Mobile Number" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Street Address" value={newStreet} onChangeText={setNewStreet} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" value={newCity} onChangeText={setNewCity} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" value={newStateVal} onChangeText={setNewStateVal} />
              </View>
              <TextInput style={styles.input} placeholder="Pincode" value={newZip} onChangeText={setNewZip} keyboardType="numeric" />
              <TouchableOpacity style={styles.gpsBtn} onPress={() => { setNewLat(12.97 + Math.random() * 0.02); setNewLng(77.59 + Math.random() * 0.02); Alert.alert('Mock GPS', 'Location captured.'); }}>
                <Ionicons name="location" size={16} color={Palette.primary} />
                <Text style={styles.gpsTxt}>Use Current Location (Mock)</Text>
              </TouchableOpacity>
              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => setShowAddAddress(false)}>
                  <Text style={{ color: Palette.danger, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.formBtn, { backgroundColor: Palette.secondary }]} onPress={handleAddAddress}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : loading ? (
            <ActivityIndicator size="small" color={Palette.secondary} />
          ) : addresses.length === 0 ? (
            <Text style={styles.emptyTxt}>No saved addresses.</Text>
          ) : (
            addresses.map(addr => {
              const isSel = selectedAddressId === addr.id;
              return (
                <TouchableOpacity key={addr.id} style={[styles.addrBox, isSel && styles.addrBoxSel]} onPress={() => setSelectedAddressId(addr.id)}>
                  <Ionicons name={isSel ? "radio-button-on" : "radio-button-off"} size={22} color={isSel ? Palette.secondary : Palette.textMuted} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.addrName}>{addr.name}</Text>
                    <Text style={styles.addrSub}>{addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}</Text>
                    <Text style={styles.addrSub}>Ph: {addr.phone}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Delivery Speed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Speed</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.speedBox, deliverySpeed === 'standard' && styles.speedBoxSel]} onPress={() => setDeliverySpeed('standard')}>
              <Ionicons name="bicycle" size={24} color={deliverySpeed === 'standard' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>Standard</Text>
              <Text style={styles.speedSub}>2-3 Days | Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.speedBox, deliverySpeed === 'express' && styles.speedBoxSel]} onPress={() => setDeliverySpeed('express')}>
              <Ionicons name="flash" size={24} color={deliverySpeed === 'express' ? Palette.secondary : Palette.textMuted} />
              <Text style={styles.speedName}>Express</Text>
              <Text style={styles.speedSub}>1 Day | +₹50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <TouchableOpacity style={[styles.payBox, paymentMethod === 'razorpay' && styles.payBoxSel]} onPress={() => setPaymentMethod('razorpay')}>
            <Ionicons name="card" size={24} color={paymentMethod === 'razorpay' ? Palette.secondary : Palette.textMuted} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.payName}>Online Payment</Text>
              <Text style={styles.paySub}>Cards, UPI, Netbanking (Razorpay)</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.payBox, paymentMethod === 'cod' && styles.payBoxSel]} onPress={() => setPaymentMethod('cod')}>
            <Ionicons name="wallet" size={24} color={paymentMethod === 'cod' ? Palette.secondary : Palette.textMuted} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.payName}>Cash on Delivery</Text>
              <Text style={styles.paySub}>Pay when delivered</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footLbl}>Total to Pay</Text>
          <Text style={styles.footVal}>₹{activeTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.buyBtn} onPress={handlePlaceOrder} disabled={placingOrder}>
          {placingOrder ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.buyBtnTxt}>{paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Pay'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  
  scroll: { padding: Spacing.md, paddingBottom: 100, gap: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: 10 },
  addTxt: { fontSize: 13, fontWeight: '700', color: Palette.secondary },
  
  formWrap: { gap: 10 },
  input: { backgroundColor: '#F8FAFC', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Palette.text, borderWidth: 1, borderColor: Palette.border },
  row: { flexDirection: 'row', gap: 10 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#E0F2FE', borderRadius: Radius.md, gap: 6 },
  gpsTxt: { fontSize: 13, fontWeight: '700', color: Palette.primary },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  formBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
  
  emptyTxt: { textAlign: 'center', color: Palette.textMuted, fontSize: 14, marginVertical: 10 },
  addrBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1.5, borderColor: Palette.border, borderRadius: Radius.md, marginBottom: 10 },
  addrBoxSel: { borderColor: Palette.secondary, backgroundColor: '#F0FDF4' },
  addrName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  addrSub: { fontSize: 13, color: Palette.textMuted, marginTop: 2 },
  
  speedBox: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1.5, borderColor: Palette.border, borderRadius: Radius.md, gap: 6 },
  speedBoxSel: { borderColor: Palette.secondary, backgroundColor: '#F0FDF4' },
  speedName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  speedSub: { fontSize: 12, color: Palette.textMuted },
  
  payBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1.5, borderColor: Palette.border, borderRadius: Radius.md, marginBottom: 10 },
  payBoxSel: { borderColor: Palette.secondary, backgroundColor: '#F0FDF4' },
  payName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  paySub: { fontSize: 12, color: Palette.textMuted },
  
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: Palette.border, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16,
  },
  footLbl: { fontSize: 12, color: Palette.textMuted },
  footVal: { fontSize: 22, fontWeight: '800', color: Palette.text },
  buyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.secondary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: Radius.md, gap: 8 },
  buyBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
