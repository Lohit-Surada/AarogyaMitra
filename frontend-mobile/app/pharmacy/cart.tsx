import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
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

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    inStock: boolean;
    stock: number;
  };
};

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getBackendUrl(`/api/pharmacy/cart?email=${userEmail}`));
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (productId: number, newQty: number) => {
    try {
      const response = await fetch(getBackendUrl('/api/pharmacy/cart/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          productId,
          quantity: newQty,
        }),
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const response = await fetch(
        getBackendUrl(`/api/pharmacy/cart/remove?email=${userEmail}&productId=${productId}`),
        { method: 'DELETE' }
      );
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'HEALTH10') {
      setAppliedCoupon('HEALTH10');
      setDiscountPercentage(10);
      Alert.alert('Coupon Applied', 'You saved 10% on your order!');
    } else if (code === 'WELCOME50') {
      setAppliedCoupon('WELCOME50');
      setDiscountPercentage(50);
      Alert.alert('Coupon Applied', 'You saved 50% on your order!');
    } else if (code === 'SUPP500') {
      setAppliedCoupon('SUPP500');
      setDiscountPercentage(0); // Free delivery coupon
      Alert.alert('Coupon Applied', 'Free delivery applied to your order!');
    } else {
      Alert.alert('Invalid Coupon', 'This coupon code does not exist.');
    }
    setCouponCode('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercentage(0);
  };

  // Price calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = (subtotal * discountPercentage) / 100;
  
  // Free delivery conditions
  let deliveryFee = 50;
  if (subtotal > 500 || appliedCoupon === 'SUPP500' || subtotal === 0) {
    deliveryFee = 0;
  }

  // 12% GST calculation on discounted subtotal
  const gst = (subtotal - discount) * 0.12;
  const total = subtotal - discount + deliveryFee + gst;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }
    // Check if any product is out of stock
    const outOfStockItems = cartItems.filter(item => !item.product.inStock);
    if (outOfStockItems.length > 0) {
      Alert.alert('Out of Stock Items', 'Some items in your cart are unavailable. Please remove them.');
      return;
    }

    router.push({
      pathname: '/pharmacy/checkout',
      params: {
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        gst: gst.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
      },
    });
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.product.imageUrl }} style={styles.productImg} />
      <View style={styles.cardDetails}>
        <ThemedText style={styles.productName} numberOfLines={1}>
          {item.product.name}
        </ThemedText>
        <ThemedText style={styles.productPrice}>₹{item.product.price.toFixed(2)}</ThemedText>

        <View style={styles.actionsRow}>
          {/* Quantity selector */}
          <View style={styles.qtyBox}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
              <Ionicons name="remove" size={16} color="#334155" />
            </Pressable>
            <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
              <Ionicons name="add" size={16} color="#334155" />
            </Pressable>
          </View>

          {/* Delete item */}
          <Pressable style={styles.deleteBtn} onPress={() => removeItem(item.product.id)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Shopping Cart</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={80} color="#cbd5e1" />
          <ThemedText style={styles.emptyText}>Your cart is empty</ThemedText>
          <Pressable style={styles.shopBtn} onPress={() => router.push('/pharmacy')}>
            <ThemedText style={styles.shopBtnText}>Shop Now</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={() => (
              <View style={styles.footerDetails}>
                {/* Coupon entry */}
                <View style={styles.couponContainer}>
                  {appliedCoupon ? (
                    <View style={styles.couponAppliedRow}>
                      <Ionicons name="pricetag" size={18} color="#10b981" />
                      <ThemedText style={styles.couponAppliedText}>
                        Coupon {appliedCoupon} Applied!
                      </ThemedText>
                      <Pressable onPress={removeCoupon}>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.couponInputRow}>
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Promo Code (HEALTH10, WELCOME50)"
                        placeholderTextColor="#94a3b8"
                        value={couponCode}
                        onChangeText={setCouponCode}
                        autoCapitalize="characters"
                      />
                      <Pressable style={styles.couponBtn} onPress={handleApplyCoupon}>
                        <ThemedText style={styles.couponBtnText}>Apply</ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Price summary */}
                <View style={styles.summaryCard}>
                  <ThemedText style={styles.summaryTitle}>Bill Details</ThemedText>
                  
                  <View style={styles.priceItem}>
                    <ThemedText style={styles.priceItemLabel}>Items Subtotal</ThemedText>
                    <ThemedText style={styles.priceItemValue}>₹{subtotal.toFixed(2)}</ThemedText>
                  </View>

                  {discount > 0 && (
                    <View style={styles.priceItem}>
                      <ThemedText style={[styles.priceItemLabel, { color: '#10b981' }]}>Discount</ThemedText>
                      <ThemedText style={[styles.priceItemValue, { color: '#10b981' }]}>- ₹{discount.toFixed(2)}</ThemedText>
                    </View>
                  )}

                  <View style={styles.priceItem}>
                    <ThemedText style={styles.priceItemLabel}>GST (12%)</ThemedText>
                    <ThemedText style={styles.priceItemValue}>₹{gst.toFixed(2)}</ThemedText>
                  </View>

                  <View style={styles.priceItem}>
                    <ThemedText style={styles.priceItemLabel}>Delivery Charges</ThemedText>
                    <ThemedText style={styles.priceItemValue}>
                      {deliveryFee === 0 ? (
                        <ThemedText style={{ color: '#10b981', fontWeight: 'bold' }}>FREE</ThemedText>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </ThemedText>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>Total Payable</ThemedText>
                    <ThemedText style={styles.totalValue}>₹{total.toFixed(2)}</ThemedText>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Checkout Bar */}
          <View style={styles.checkoutBar}>
            <View>
              <ThemedText style={styles.totalPayText}>₹{total.toFixed(2)}</ThemedText>
              <ThemedText style={styles.viewDetailsText}>View bill summary above</ThemedText>
            </View>
            <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
              <ThemedText style={styles.checkoutBtnText}>Checkout</ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
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
    fontSize: 16,
    marginBottom: 8,
  },
  shopBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  productImg: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  deleteBtn: {
    padding: 4,
  },
  footerDetails: {
    marginTop: 16,
  },
  couponContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 13,
    color: '#0f172a',
  },
  couponBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  couponBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  couponAppliedText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 14,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceItemLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  priceItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  checkoutBar: {
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
  totalPayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#64748b',
  },
  checkoutBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
