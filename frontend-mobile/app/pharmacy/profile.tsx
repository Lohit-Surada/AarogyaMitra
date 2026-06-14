import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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

type Order = {
  id: number;
  razorpayOrderId?: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

export default function PharmacyProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New Address Inputs
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');

  // Toggles
  const [notifications, setNotifications] = useState(true);

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const [addrRes, orderRes] = await Promise.all([
        fetch(getBackendUrl(`/api/pharmacy/addresses?email=${userEmail}`)),
        fetch(getBackendUrl(`/api/pharmacy/orders?email=${userEmail}`)),
      ]);

      if (addrRes.ok) {
        setAddresses(await addrRes.json());
      }
      if (orderRes.ok) {
        setOrders(await orderRes.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleAddAddress = async () => {
    if (!name || !phone || !street || !city || !stateVal || !zip) {
      Alert.alert('Missing Fields', 'Please complete all address details.');
      return;
    }

    try {
      const response = await fetch(getBackendUrl(`/api/pharmacy/addresses/add?email=${userEmail}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          addressLine: street,
          city,
          state: stateVal,
          zipCode: zip,
          latitude: 12.9716, // Mock Default Bangalore Coordinates
          longitude: 77.5946,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Delivery address added successfully.');
        setShowForm(false);
        fetchProfileData();
        // Clear
        setName('');
        setPhone('');
        setStreet('');
        setCity('');
        setStateVal('');
        setZip('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              getBackendUrl(`/api/pharmacy/addresses/delete/${id}?email=${userEmail}`),
              { method: 'DELETE' }
            );
            if (response.ok) {
              fetchProfileData();
            }
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Pharmacy Settings</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#ffffff" />
          </View>
          <View>
            <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>
            <ThemedText style={styles.userType}>AarogyaMitra Premium Patient</ThemedText>
          </View>
        </View>

        {/* Saved Addresses Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Saved Addresses</ThemedText>
            {!showForm && (
              <Pressable onPress={() => setShowForm(true)}>
                <ThemedText style={styles.actionLink}>+ Add New</ThemedText>
              </Pressable>
            )}
          </View>

          {showForm && (
            <View style={styles.addressForm}>
              <TextInput style={styles.input} placeholder="Recipient Name" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#94a3b8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Street Address / House No." placeholderTextColor="#94a3b8" value={street} onChangeText={setStreet} />
              <View style={styles.formRow}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" placeholderTextColor="#94a3b8" value={city} onChangeText={setCity} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" placeholderTextColor="#94a3b8" value={stateVal} onChangeText={setStateVal} />
              </View>
              <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor="#94a3b8" value={zip} onChangeText={setZip} keyboardType="number-pad" />
              <View style={styles.formActions}>
                <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={() => setShowForm(false)}>
                  <ThemedText style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.formBtn, styles.saveBtn]} onPress={handleAddAddress}>
                  <ThemedText style={{ color: '#ffffff', fontWeight: 'bold' }}>Save</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : addresses.length === 0 ? (
            <ThemedText style={styles.emptyText}>No saved addresses found.</ThemedText>
          ) : (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.addrName}>{addr.name}</ThemedText>
                  <ThemedText style={styles.addrLine}>
                    {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                  </ThemedText>
                  <ThemedText style={styles.addrPhone}>Phone: {addr.phone}</ThemedText>
                </View>
                <Pressable onPress={() => handleDeleteAddress(addr.id)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Payment History Log */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Payment & Transactions History</ThemedText>
          {loading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : orders.length === 0 ? (
            <ThemedText style={styles.emptyText}>No transaction records found.</ThemedText>
          ) : (
            orders.map(order => (
              <View key={order.id} style={styles.transactionItem}>
                <View>
                  <ThemedText style={styles.txId}>TXN ID: #{order.id}</ThemedText>
                  <ThemedText style={styles.txDate}>
                    {new Date(order.createdAt).toLocaleDateString()} • {order.paymentMethod}
                  </ThemedText>
                  {order.razorpayOrderId && (
                    <ThemedText style={styles.razorpayRef}>Ref: {order.razorpayOrderId}</ThemedText>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={styles.txPrice}>₹{order.total.toFixed(2)}</ThemedText>
                  <ThemedText style={[styles.txStatus, { color: order.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b' }]}>
                    {order.paymentStatus}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Toggles */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          <View style={styles.prefRow}>
            <View>
              <ThemedText style={styles.prefTitle}>Delivery Alerts</ThemedText>
              <ThemedText style={styles.prefSub}>Get SMS and push alerts on dispatch</ThemedText>
            </View>
            <Pressable onPress={() => setNotifications(!notifications)}>
              <Ionicons
                name={notifications ? 'toggle' : 'toggle-outline'}
                size={40}
                color={notifications ? '#10b981' : '#cbd5e1'}
              />
            </Pressable>
          </View>
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
    gap: 16,
  },
  userCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userType: {
    color: '#94a3b8',
    fontSize: 12,
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
  actionLink: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  addrName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  addrLine: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addrPhone: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  addressForm: {
    gap: 10,
    marginBottom: 16,
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
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  formBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: '#ef444415',
  },
  saveBtn: {
    backgroundColor: '#10b981',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  txId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  txDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  razorpayRef: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  txPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  txStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  prefSub: {
    fontSize: 11,
    color: '#64748b',
  },
});
