import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { realtimeDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { sanitizeEmail } from '@/services/rtdbService';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

type ProductDetails = {
  id: number;
  name: string;
  imageUrl: string;
  price?: number;
};

type OrderItem = {
  id?: number;
  product: ProductDetails;
  quantity: number;
  price?: number;
};

type Order = {
  id?: string;
  orderId?: string;
  createdAt: string;
  orderStatus: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  shippingAddress: string;
  orderItems: OrderItem[];
};

const StatusColors = {
  PLACED: { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline' as const },
  PROCESSING: { bg: '#DBEAFE', text: '#2563EB', icon: 'cog-outline' as const },
  SHIPPED: { bg: '#E0E7FF', text: '#4F46E5', icon: 'airplane-outline' as const },
  DELIVERED: { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle-outline' as const },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle-outline' as const },
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !id) return;
    const fetchOrder = async () => {
      try {
        const key = sanitizeEmail(user.email!);
        const snapshot = await get(ref(realtimeDb, `orders/${key}/${id}`));
        if (snapshot.exists()) {
          setOrder(snapshot.val());
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user, id]);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.secondary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Order Not Found</Text>
        <TouchableOpacity style={styles.backBtnSolid} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const config = StatusColors[order.orderStatus] || StatusColors.PLACED;
  const items = order.orderItems || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => (item.id || item.product?.id || index).toString()}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.topSection}>
              <Text style={styles.orderId}>Order #{order.id || order.orderId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: config.bg, marginTop: 12, alignSelf: 'flex-start' }]}>
                <Ionicons name={config.icon} size={16} color={config.text} style={{ marginRight: 6 }} />
                <Text style={[styles.statusTxt, { color: config.text, fontSize: 13 }]}>{order.orderStatus}</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.imgWrap}>
              <Image source={{ uri: item.product?.imageUrl || 'https://via.placeholder.com/60' }} style={styles.previewImg} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Product'}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                {item.product?.price && <Text style={styles.itemPrice}>₹{item.product.price.toFixed(2)}</Text>}
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.footerSection}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <View style={styles.shippingBox}>
              <Ionicons name="location-outline" size={20} color={Palette.textMuted} />
              <Text style={styles.shippingAddress}>{order.shippingAddress}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment Info</Text>
            <View style={styles.paymentBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>Method</Text>
                <Text style={styles.summaryVal}>{order.paymentMethod}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>Status</Text>
                <Text style={[styles.summaryVal, { color: order.paymentStatus === 'PAID' ? '#059669' : '#D97706' }]}>
                  {order.paymentStatus}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order Summary</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>Subtotal</Text>
                <Text style={styles.summaryVal}>₹{order.subtotal?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>GST</Text>
                <Text style={styles.summaryVal}>₹{order.gst?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>Delivery Fee</Text>
                <Text style={styles.summaryVal}>₹{order.deliveryFee?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLbl}>Total Amount</Text>
                <Text style={styles.totalVal}>₹{order.total?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },

  listContent: { padding: Spacing.md, paddingBottom: 40 },
  
  topSection: { backgroundColor: '#fff', padding: 20, borderRadius: Radius.lg, marginBottom: 24, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  orderId: { fontSize: 18, fontWeight: '800', color: Palette.text },
  orderDate: { fontSize: 14, color: Palette.textMuted, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.round },
  statusTxt: { fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: 12, marginLeft: 4 },
  
  itemRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Palette.border },
  imgWrap: { width: 60, height: 60, backgroundColor: '#F8FAFC', borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.border },
  previewImg: { width: 45, height: 45, resizeMode: 'contain' },
  itemName: { fontSize: 15, fontWeight: '600', color: Palette.text, lineHeight: 22 },
  itemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemQty: { fontSize: 13, color: Palette.textMuted },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Palette.text },

  footerSection: { marginTop: 24 },
  shippingBox: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.border },
  shippingAddress: { flex: 1, marginLeft: 12, fontSize: 14, color: Palette.text, lineHeight: 20 },

  paymentBox: { backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.border },
  summaryBox: { backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLbl: { fontSize: 14, color: Palette.textMuted },
  summaryVal: { fontSize: 14, fontWeight: '600', color: Palette.text },
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: 12 },
  totalLbl: { fontSize: 16, fontWeight: '700', color: Palette.text },
  totalVal: { fontSize: 18, fontWeight: '800', color: Palette.secondary },

  emptyTitle: { fontSize: 20, fontWeight: '700', color: Palette.text, marginTop: 16 },
  backBtnSolid: { marginTop: 24, backgroundColor: Palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
