import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { Palette, Spacing, Radius, Shadows, HEADER_PADDING_TOP } from '@/constants/theme';

import { getCart, updateCartQuantity, removeFromCart, CartItem as ServiceCartItem } from '@/services/cartService';

type CartItem = ServiceCartItem;

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (productId: number, newQty: number) => {
    try {
      await updateCartQuantity(productId, newQty);
      fetchCart();
    } catch (error) {
      console.error(error);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await removeFromCart(productId);
      fetchCart();
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
      setDiscountPercentage(0);
      Alert.alert('Coupon Applied', 'Free delivery applied!');
    } else if (code === 'TEST1') {
      setAppliedCoupon('TEST1');
      setDiscountPercentage(0);
      Alert.alert('Test Mode', 'Total set to exactly ₹1.00 for payment testing!');
    } else {
      Alert.alert('Invalid Coupon', 'This coupon code does not exist.');
    }
    setCouponCode('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercentage(0);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  let discount = (subtotal * discountPercentage) / 100;
  
  let deliveryFee = 50;
  if (subtotal > 500 || appliedCoupon === 'SUPP500' || subtotal === 0 || appliedCoupon === 'TEST1') deliveryFee = 0;

  let gst = (subtotal - discount) * 0.12;
  
  // If TEST1 is applied, force the total to be exactly 1, and offset it using the discount
  if (appliedCoupon === 'TEST1' && subtotal > 0) {
    gst = 0;
    deliveryFee = 0;
    discount = subtotal - 1; 
  }

  const total = subtotal - discount + deliveryFee + gst;

  const handleCheckout = () => {
    if (cartItems.length === 0) return Alert.alert('Empty Cart', 'Add items to checkout.');
    const outOfStock = cartItems.filter(item => !item.product.inStock);
    if (outOfStock.length > 0) return Alert.alert('Out of Stock', 'Remove unavailable items to proceed.');

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

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.product.imageUrl }} style={styles.cartImg} />
      <View style={styles.cartBody}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.product.id)} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={Palette.danger} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemCat}>{item.product.category}</Text>
        
        {!item.product.inStock && (
          <Text style={styles.outOfStockTxt}>Out of Stock</Text>
        )}

        <View style={styles.cartFooter}>
          <Text style={styles.itemPrice}>₹{item.product.price.toFixed(0)}</Text>
          
          <View style={styles.qtyBox}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
              <Ionicons name="remove" size={14} color={Palette.text} />
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
              <Ionicons name="add" size={14} color={Palette.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Palette.secondary} />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/pharmacy')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Animated.FlatList
            style={{ opacity: fadeAnim }}
            data={cartItems}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : item.product.id.toString() + '-' + index)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={styles.footerDetails}>
                {/* Coupon */}
                <View style={styles.couponBox}>
                  {appliedCoupon ? (
                    <View style={styles.couponApplied}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="pricetag" size={18} color="#10B981" />
                        <Text style={styles.couponAppliedTxt}>'{appliedCoupon}' applied!</Text>
                      </View>
                      <TouchableOpacity onPress={removeCoupon}>
                        <Ionicons name="close-circle" size={20} color={Palette.danger} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.couponInputRow}>
                      <Ionicons name="ticket-outline" size={20} color={Palette.primary} />
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Enter Promo Code"
                        placeholderTextColor={Palette.textMuted}
                        value={couponCode}
                        onChangeText={setCouponCode}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon}>
                        <Text style={styles.couponBtnTxt}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Bill Summary */}
                <View style={styles.billCard}>
                  <Text style={styles.billTitle}>Bill Summary</Text>
                  
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billVal}>₹{subtotal.toFixed(2)}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: '#10B981' }]}>Discount</Text>
                      <Text style={[styles.billVal, { color: '#10B981' }]}>- ₹{discount.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Taxes & GST (12%)</Text>
                    <Text style={styles.billVal}>₹{gst.toFixed(2)}</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery Fee</Text>
                    <Text style={[styles.billVal, deliveryFee === 0 && { color: '#10B981' }]}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>To Pay</Text>
                    <Text style={styles.totalVal}>₹{total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            }
          />

          {/* Checkout Bar */}
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.barTotalLabel}>Total Amount</Text>
              <Text style={styles.barTotalVal}>₹{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.8}>
              <Text style={styles.checkoutBtnTxt}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },

  emptyTitle: { fontSize: 20, fontWeight: '700', color: Palette.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Palette.textMuted, marginTop: 8, textAlign: 'center' },
  shopBtn: {
    marginTop: 24,
    backgroundColor: Palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  listContent: { padding: Spacing.md, paddingBottom: 100 },

  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.sm,
  },
  cartImg: { width: 70, height: 70, resizeMode: 'contain', borderRadius: Radius.sm, backgroundColor: '#F8FAFC' },
  cartBody: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: Palette.text, paddingRight: 20 },
  itemCat: { fontSize: 11, color: Palette.textMuted, marginTop: 2 },
  outOfStockTxt: { fontSize: 11, color: Palette.danger, fontWeight: '600', marginTop: 4 },
  
  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: Palette.text },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: Radius.md, padding: 3, gap: 10 },
  qtyBtn: { width: 26, height: 26, backgroundColor: '#fff', borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  qtyVal: { fontSize: 14, fontWeight: '700', color: Palette.text },

  footerDetails: { marginTop: Spacing.md },

  couponBox: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  couponInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponInput: { flex: 1, fontSize: 14, color: Palette.text, paddingVertical: 8 },
  couponBtn: { backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  couponBtnTxt: { color: Palette.primary, fontWeight: '700', fontSize: 13 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  couponAppliedTxt: { color: '#10B981', fontWeight: '700', fontSize: 14 },

  billCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.sm,
  },
  billTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: 13, color: '#64748B' },
  billVal: { fontSize: 13, fontWeight: '600', color: Palette.text },
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Palette.text },
  totalVal: { fontSize: 18, fontWeight: '800', color: Palette.secondary },

  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  barTotalLabel: { fontSize: 12, color: Palette.textMuted },
  barTotalVal: { fontSize: 20, fontWeight: '800', color: Palette.text },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  checkoutBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
