import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
  };
};

type Order = {
  id: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string; // PLACED, SHIPPED, DELIVERED, CANCELLED
  subtotal: number;
  discount: number;
  gst: number;
  deliveryFee: number;
  total: number;
  shippingAddress: string;
  createdAt: string;
  orderItems: OrderItem[];
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getBackendUrl(`/api/pharmacy/orders?email=${userEmail}`));
      if (response.ok) {
        const data = await response.json();
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

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                getBackendUrl(`/api/pharmacy/orders/cancel/${orderId}?email=${userEmail}`),
                { method: 'POST' }
              );
              if (response.ok) {
                Alert.alert('Cancelled', 'Your order was successfully cancelled.');
                fetchOrders();
              } else {
                Alert.alert('Error', 'Failed to cancel order.');
              }
            } catch (error) {
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleReorder = async (order: Order) => {
    try {
      setLoading(true);
      // Sequentially add items back to cart
      for (const item of order.orderItems) {
        await fetch(getBackendUrl('/api/pharmacy/cart/add'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            productId: item.product.id,
            quantity: item.quantity,
          }),
        });
      }
      Alert.alert('Reorder Success', 'All items added to cart successfully!', [
        { text: 'Go to Cart', onPress: () => router.push('/pharmacy/cart') },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add items to cart.');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'current') {
      return order.orderStatus === 'PLACED' || order.orderStatus === 'SHIPPED';
    } else {
      return order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED';
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return '#3b82f6';
      case 'SHIPPED': return '#f59e0b';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderOrderTracker = (status: string) => {
    const steps = ['PLACED', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(status === 'CANCELLED' ? 'PLACED' : status);

    return (
      <View style={styles.trackerContainer}>
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex && status !== 'CANCELLED';
          const isCurrent = idx === currentIndex && status !== 'CANCELLED';

          return (
            <View key={step} style={styles.trackerStepWrap}>
              <View style={[
                styles.stepCircle,
                isCompleted && styles.stepCircleCompleted,
                isCurrent && styles.stepCircleCurrent
              ]}>
                <Ionicons
                  name={isCompleted ? 'checkmark' : 'ellipse'}
                  size={12}
                  color={isCompleted ? '#ffffff' : '#cbd5e1'}
                />
              </View>
              <ThemedText style={[styles.stepLabel, isCompleted && styles.stepLabelCompleted]}>
                {step}
              </ThemedText>
              {idx < steps.length - 1 && (
                <View style={[styles.stepLine, idx < currentIndex && styles.stepLineCompleted]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isTracking = trackingOrderId === item.id;
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <ThemedText style={styles.orderId}>Order #{item.id}</ThemedText>
            <ThemedText style={styles.orderDate}>{formattedDate}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '15' }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
              {item.orderStatus}
            </ThemedText>
          </View>
        </View>

        {/* Item Summaries */}
        <View style={styles.itemsBlock}>
          {item.orderItems.map((oi, idx) => (
            <View key={oi.id || idx} style={styles.itemRow}>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {oi.product.name}
              </ThemedText>
              <ThemedText style={styles.itemQtyPrice}>
                {oi.quantity}x • ₹{oi.price.toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.totalRow}>
          <View>
            <ThemedText style={styles.payMethodText}>Paid via {item.paymentMethod}</ThemedText>
            <ThemedText style={styles.itemCountText}>{item.orderItems.length} items</ThemedText>
          </View>
          <ThemedText style={styles.totalPrice}>₹{item.total.toFixed(2)}</ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          {item.orderStatus === 'PLACED' && (
            <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleCancelOrder(item.id)}>
              <ThemedText style={styles.cancelBtnText}>Cancel Order</ThemedText>
            </Pressable>
          )}

          {item.orderStatus !== 'CANCELLED' && (
            <Pressable
              style={[styles.actionBtn, styles.trackBtn, isTracking && styles.trackBtnActive]}
              onPress={() => setTrackingOrderId(prev => (prev === item.id ? null : item.id))}>
              <Ionicons name="location-outline" size={14} color={isTracking ? '#ffffff' : '#10b981'} />
              <ThemedText style={[styles.trackBtnText, isTracking && styles.trackBtnTextActive]}>
                {isTracking ? 'Close Map Track' : 'Track Order'}
              </ThemedText>
            </Pressable>
          )}

          {(item.orderStatus === 'DELIVERED' || item.orderStatus === 'CANCELLED') && (
            <Pressable style={[styles.actionBtn, styles.reorderBtn]} onPress={() => handleReorder(item)}>
              <Ionicons name="refresh-outline" size={14} color="#ffffff" />
              <ThemedText style={styles.reorderBtnText}>Reorder</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Embedded Tracking Pipeline */}
        {isTracking && renderOrderTracker(item.orderStatus)}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'current' && styles.tabActive]}
          onPress={() => setActiveTab('current')}>
          <ThemedText style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
            Active
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}>
          <ThemedText style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
          <ThemedText style={styles.emptyText}>No orders found</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsBlock: {
    marginTop: 14,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    marginRight: 12,
  },
  itemQtyPrice: {
    fontSize: 13,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payMethodText: {
    fontSize: 12,
    color: '#64748b',
  },
  itemCountText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: '#ef444410',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackBtn: {
    backgroundColor: '#10b98110',
  },
  trackBtnActive: {
    backgroundColor: '#10b981',
  },
  trackBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackBtnTextActive: {
    color: '#ffffff',
  },
  reorderBtn: {
    backgroundColor: '#10b981',
  },
  reorderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
  },
  trackerStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginLeft: 6,
    zIndex: 2,
  },
  stepLabelCompleted: {
    color: '#0f172a',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#e2e8f0',
    position: 'absolute',
    left: 20,
    right: -10,
    top: 9,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
});
