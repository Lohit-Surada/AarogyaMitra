import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  productImage: string;
};

type Order = {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  items: OrderItem[];
};

const StatusColors = {
  PENDING: { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline' as const },
  PROCESSING: { bg: '#DBEAFE', text: '#2563EB', icon: 'cog-outline' as const },
  SHIPPED: { bg: '#E0E7FF', text: '#4F46E5', icon: 'airplane-outline' as const },
  DELIVERED: { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle-outline' as const },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle-outline' as const },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(getBackendUrl(`/api/pharmacy/orders?email=${userEmail}`));
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const config = StatusColors[item.status] || StatusColors.PENDING;
    const firstItem = item.items[0];
    const moreItemsCount = item.items.length - 1;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={14} color={config.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusTxt, { color: config.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          {firstItem && (
            <View style={styles.itemPreview}>
              <View style={styles.imgWrap}>
                <Image source={{ uri: firstItem.productImage }} style={styles.previewImg} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.previewName} numberOfLines={2}>{firstItem.productName}</Text>
                <Text style={styles.previewQty}>Qty: {firstItem.quantity}</Text>
              </View>
            </View>
          )}

          {moreItemsCount > 0 && (
            <Text style={styles.moreTxt}>+ {moreItemsCount} more item{moreItemsCount > 1 ? 's' : ''}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLbl}>Total Amount</Text>
            <Text style={styles.totalVal}>₹{item.total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.detailBtn}>
            <Text style={styles.detailBtnTxt}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Palette.secondary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>You haven't placed any pharmacy orders.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/pharmacy')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, marginBottom: 16, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 },
  orderId: { fontSize: 15, fontWeight: '700', color: Palette.text },
  orderDate: { fontSize: 12, color: Palette.textMuted, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.round },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: Palette.border },

  cardBody: { padding: 16 },
  itemPreview: { flexDirection: 'row', alignItems: 'center' },
  imgWrap: { width: 50, height: 50, backgroundColor: '#F8FAFC', borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.border },
  previewImg: { width: 40, height: 40, resizeMode: 'contain' },
  previewName: { fontSize: 14, fontWeight: '600', color: Palette.text, lineHeight: 20 },
  previewQty: { fontSize: 12, color: Palette.textMuted, marginTop: 4 },
  moreTxt: { fontSize: 13, fontWeight: '600', color: Palette.primary, marginTop: 12, paddingLeft: 62 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg },
  totalLbl: { fontSize: 12, color: Palette.textMuted },
  totalVal: { fontSize: 16, fontWeight: '800', color: Palette.text },
  detailBtn: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Palette.secondary, borderRadius: Radius.md },
  detailBtnTxt: { fontSize: 13, fontWeight: '700', color: Palette.secondary },

  emptyTitle: { fontSize: 20, fontWeight: '700', color: Palette.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Palette.textMuted, marginTop: 8, textAlign: 'center' },
  shopBtn: { marginTop: 24, backgroundColor: Palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
