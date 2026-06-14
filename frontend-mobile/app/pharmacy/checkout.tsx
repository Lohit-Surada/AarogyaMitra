import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';

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

  // Base summary values from Cart
  const baseSubtotal = parseFloat(params.subtotal as string || '0');
  const baseDiscount = parseFloat(params.discount as string || '0');
  const baseGst = parseFloat(params.gst as string || '0');
  const baseDeliveryFee = parseFloat(params.deliveryFee as string || '0');
  const baseTotal = parseFloat(params.total as string || '0');

  // Checkout choices
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  
  // Loading & UI Toggle
  const [loading, setLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // New Address Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateVal, setNewStateVal] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newLat, setNewLat] = useState<number>(12.9716); // Default Bangalore Lat
  const [newLng, setNewLng] = useState<number>(77.5946); // Default Bangalore Lng

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getBackendUrl(`/api/pharmacy/addresses?email=${userEmail}`));
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
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

  // Handle address addition
  const handleAddAddress = async () => {
    if (!newName || !newPhone || !newStreet || !newCity || !newStateVal || !newZip) {
      Alert.alert('Missing Fields', 'Please fill in all address details.');
      return;
    }

    try {
      const response = await fetch(getBackendUrl(`/api/pharmacy/addresses/add?email=${userEmail}`), {
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

      if (response.ok) {
        const added = await response.json();
        Alert.alert('Success', 'Address added successfully!');
        setShowAddAddress(false);
        fetchAddresses();
        setSelectedAddressId(added.id);
        // Clear fields
        setNewName('');
        setNewPhone('');
        setNewStreet('');
        setNewCity('');
        setNewStateVal('');
        setNewZip('');
      } else {
        Alert.alert('Error', 'Failed to add address.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getMockMapLocation = () => {
    // Simulate drop-pin from Google Maps
    const randomOffsetLat = (Math.random() - 0.5) * 0.02;
    const randomOffsetLng = (Math.random() - 0.5) * 0.02;
    setNewLat(12.9716 + randomOffsetLat);
    setNewLng(77.5946 + randomOffsetLng);
    Alert.alert('Google Maps Coordinates Set', 'Mock location pin dropped successfully.');
  };

  // Recalculations for delivery fee
  const activeDeliveryFee = deliverySpeed === 'express' ? baseDeliveryFee + 50 : baseDeliveryFee;
  const activeTotal = baseTotal + (deliverySpeed === 'express' ? 50 : 0);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please select or add a delivery address.');
      return;
    }

    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;

    const fullAddressString = `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.zipCode}. Phone: ${address.phone}`;

    if (paymentMethod === 'cod') {
      try {
        setPlacingOrder(true);
        const response = await fetch(getBackendUrl(`/api/pharmacy/orders/place-cod?email=${userEmail}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: fullAddressString,
            latitude: address.latitude,
            longitude: address.longitude,
            subtotal: baseSubtotal,
            discount: baseDiscount,
            gst: baseGst,
            deliveryFee: activeDeliveryFee,
            total: activeTotal,
          }),
        });

        if (response.ok) {
          Alert.alert('Order Confirmed', 'Your Cash On Delivery order has been successfully placed!', [
            { text: 'View Orders', onPress: () => router.push('/pharmacy/orders') },
          ]);
        } else {
          Alert.alert('Error', 'Could not complete checkout.');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Checkout Failed', 'Server connection error.');
      } finally {
        setPlacingOrder(false);
      }
    } else {
      // Proceed to Razorpay payment screen
      router.push({
        pathname: '/pharmacy/payment',
        params: {
          total: activeTotal.toString(),
          subtotal: baseSubtotal.toString(),
          discount: baseDiscount.toString(),
          gst: baseGst.toString(),
          deliveryFee: activeDeliveryFee.toString(),
          shippingAddress: fullAddressString,
          latitude: (address.latitude || '').toString(),
          longitude: (address.longitude || '').toString(),
        },
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Order Checkout</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shipping address block */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
            {!showAddAddress && (
              <Pressable onPress={() => setShowAddAddress(true)}>
                <ThemedText style={styles.addBtnText}>+ Add New</ThemedText>
              </Pressable>
            )}
          </View>

          {showAddAddress ? (
            <View style={styles.addressForm}>
              <TextInput
                style={styles.input}
                placeholder="Receiver Name"
                placeholderTextColor="#94a3b8"
                value={newName}
                onChangeText={setNewName}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#94a3b8"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Street address, building, house no."
                placeholderTextColor="#94a3b8"
                value={newStreet}
                onChangeText={setNewStreet}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="City"
                  placeholderTextColor="#94a3b8"
                  value={newCity}
                  onChangeText={setNewCity}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="State"
                  placeholderTextColor="#94a3b8"
                  value={newStateVal}
                  onChangeText={setNewStateVal}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor="#94a3b8"
                value={newZip}
                onChangeText={setNewZip}
                keyboardType="number-pad"
              />

              {/* Mock Google Maps Pick */}
              <Pressable style={styles.mapsPickBtn} onPress={getMockMapLocation}>
                <Ionicons name="map-outline" size={18} color="#3b82f6" />
                <ThemedText style={styles.mapsPickBtnText}>Locate via Google Maps (Mock)</ThemedText>
              </Pressable>
              {newLat && (
                <ThemedText style={styles.latLngInfo}>
                  GPS: {newLat.toFixed(5)}, {newLng.toFixed(5)}
                </ThemedText>
              )}

              <View style={styles.formActions}>
                <Pressable
                  style={[styles.formBtn, styles.formBtnCancel]}
                  onPress={() => setShowAddAddress(false)}>
                  <ThemedText style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.formBtn, styles.formBtnSave]} onPress={handleAddAddress}>
                  <ThemedText style={{ color: '#ffffff', fontWeight: 'bold' }}>Save Address</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : loading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : addresses.length === 0 ? (
            <ThemedText style={styles.noAddressText}>No saved addresses found. Please add one.</ThemedText>
          ) : (
            addresses.map(addr => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <Pressable
                  key={addr.id}
                  style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                  onPress={() => setSelectedAddressId(addr.id)}>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? '#10b981' : '#cbd5e1'}
                  />
                  <View style={styles.addressInfo}>
                    <ThemedText style={styles.addressName}>{addr.name}</ThemedText>
                    <ThemedText style={styles.addressLine}>
                      {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                    </ThemedText>
                    <ThemedText style={styles.addressPhone}>Phone: {addr.phone}</ThemedText>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Delivery Options */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Delivery Speed</ThemedText>
          <View style={styles.speedRow}>
            <Pressable
              style={[styles.speedOption, deliverySpeed === 'standard' && styles.speedOptionSelected]}
              onPress={() => setDeliverySpeed('standard')}>
              <Ionicons
                name="bicycle-outline"
                size={22}
                color={deliverySpeed === 'standard' ? '#10b981' : '#64748b'}
              />
              <ThemedText style={styles.speedName}>Standard</ThemedText>
              <ThemedText style={styles.speedSub}>2-3 Days | FREE</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.speedOption, deliverySpeed === 'express' && styles.speedOptionSelected]}
              onPress={() => setDeliverySpeed('express')}>
              <Ionicons
                name="flash-outline"
                size={22}
                color={deliverySpeed === 'express' ? '#10b981' : '#64748b'}
              />
              <ThemedText style={styles.speedName}>Express</ThemedText>
              <ThemedText style={styles.speedSub}>1 Day | + ₹50.00</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Payment mode choice */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>

          <Pressable
            style={[styles.payOption, paymentMethod === 'razorpay' && styles.payOptionSelected]}
            onPress={() => setPaymentMethod('razorpay')}>
            <Ionicons
              name="card-outline"
              size={22}
              color={paymentMethod === 'razorpay' ? '#10b981' : '#cbd5e1'}
            />
            <View style={styles.payTextInfo}>
              <ThemedText style={styles.payTitle}>Razorpay Online Payment</ThemedText>
              <ThemedText style={styles.paySub}>Cards, UPI, Wallets, Netbanking</ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.payOption, paymentMethod === 'cod' && styles.payOptionSelected]}
            onPress={() => setPaymentMethod('cod')}>
            <Ionicons
              name="wallet-outline"
              size={22}
              color={paymentMethod === 'cod' ? '#10b981' : '#cbd5e1'}
            />
            <View style={styles.payTextInfo}>
              <ThemedText style={styles.payTitle}>Cash On Delivery (COD)</ThemedText>
              <ThemedText style={styles.paySub}>Pay when medicine is delivered</ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Price summary block */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{baseSubtotal.toFixed(2)}</ThemedText>
          </View>
          {baseDiscount > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: '#10b981' }]}>Discount</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#10b981' }]}>- ₹{baseDiscount.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>GST (12%)</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{baseGst.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Delivery Charges</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{activeDeliveryFee.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total Payable</ThemedText>
            <ThemedText style={styles.totalValue}>₹{activeTotal.toFixed(2)}</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={styles.footerBar}>
        <View>
          <ThemedText style={styles.footerTotal}>₹{activeTotal.toFixed(2)}</ThemedText>
          <ThemedText style={styles.footerTotalLabel}>Grand Total</ThemedText>
        </View>
        <Pressable
          style={[styles.placeOrderBtn, placingOrder && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}>
          {placingOrder ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <ThemedText style={styles.placeOrderText}>
                {paymentMethod === 'razorpay' ? 'Proceed to Pay' : 'Place COD Order'}
              </ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  addBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  noAddressText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  addressItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  addressLine: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  addressForm: {
    gap: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  mapsPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  mapsPickBtnText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 13,
  },
  latLngInfo: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  formBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnCancel: {
    backgroundColor: '#ef444415',
  },
  formBtnSave: {
    backgroundColor: '#10b981',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 12,
  },
  speedOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  speedOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  speedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  speedSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  payOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  payTextInfo: {
    flex: 1,
  },
  payTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  paySub: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footerTotalLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  placeOrderBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  placeOrderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
