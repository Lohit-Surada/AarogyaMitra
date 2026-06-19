import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';
import { addToCart } from '@/services/cartService';
import { Palette, Spacing, Radius, Shadows, HEADER_PADDING_TOP } from '@/constants/theme';
import { trackProductView, logEvent } from '@/services/rtdbService';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  ratings: number;
  reviewCount: number;
  description: string;
  uses: string;
  sideEffects: string;
  manufacturer: string;
  stock: number;
  inStock: boolean;
};

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'uses' | 'sides'>('desc');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (id) fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (!loading && product) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, product]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(getBackendUrl(`/api/pharmacy/products/${id}`));
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);

      // Track product view in RTDB
      trackProductView(data.id);
      logEvent('product_view', userEmail !== 'guest@aarogyamitra.com' ? userEmail : undefined, {
        productId: data.id,
        productName: data.name,
        category: data.category,
      });

      const simRes = await fetch(
        getBackendUrl(`/api/pharmacy/products?category=${encodeURIComponent(data.category)}&size=5`)
      );
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilar((simData.content || []).filter((p: Product) => p.id !== data.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (checkoutImmediately = false) => {
    if (!product) return;
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    if (product.category === 'Medicines' && !prescriptionUploaded) {
      Alert.alert(
        'Prescription Required',
        'Please upload your prescription for this medicine.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mock Upload',
            onPress: () => {
              setPrescriptionUploaded(true);
              Alert.alert('Success', 'Prescription validated.');
            },
          },
        ]
      );
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity, {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        inStock: product.inStock,
        stock: product.stock,
      });

      if (checkoutImmediately) {
        router.push('/pharmacy/cart');
      } else {
        Alert.alert('Added', `${quantity}x ${product.name} added to cart.`, [
          { text: 'View Cart', onPress: () => router.push('/pharmacy/cart') },
          { text: 'Keep Shopping', style: 'cancel' },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.secondary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Palette.textMuted }}>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 10 }}>
          <Text style={{ color: Palette.secondary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
        <TouchableOpacity onPress={() => setIsWishlisted(!isWishlisted)} style={styles.headerBtn}>
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={isWishlisted ? Palette.danger : Palette.text}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageBlock}>
          <Image source={{ uri: product.imageUrl }} style={styles.mainImage} />
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{product.category}</Text>
            </View>
            <View style={[styles.stockBadge, !product.inStock && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.stockText, !product.inStock && { color: Palette.danger }]}>
                {product.inStock ? `In Stock: ${product.stock}` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={styles.prodName}>{product.name}</Text>
          <Text style={styles.mfrText}>By {product.manufacturer}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{product.price.toFixed(2)}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingVal}>{product.ratings}</Text>
              <Text style={styles.ratingCount}>({product.reviewCount})</Text>
            </View>
          </View>
        </View>

        {product.category === 'Medicines' && (
          <View style={styles.rxCard}>
            <View style={styles.rxHeader}>
              <Ionicons name="document-text" size={22} color="#059669" />
              <View>
                <Text style={styles.rxTitle}>Prescription Required</Text>
                <Text style={styles.rxSub}>Please provide a valid Rx</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.rxBtn, prescriptionUploaded && styles.rxBtnDone]}
              onPress={() => setPrescriptionUploaded(true)}
            >
              <Ionicons
                name={prescriptionUploaded ? 'checkmark-circle' : 'cloud-upload'}
                size={18}
                color={prescriptionUploaded ? '#fff' : '#059669'}
              />
              <Text style={[styles.rxBtnText, prescriptionUploaded && { color: '#fff' }]}>
                {prescriptionUploaded ? 'Rx Verified' : 'Upload Rx (Mock)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['desc', 'uses', 'sides'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'desc' ? 'Overview' : tab === 'uses' ? 'Uses' : 'Side Effects'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabContent}>
          {activeTab === 'desc' && <Text style={styles.bodyText}>{product.description}</Text>}
          {activeTab === 'uses' && <Text style={styles.bodyText}>{product.uses}</Text>}
          {activeTab === 'sides' && <Text style={styles.bodyText}>{product.sideEffects}</Text>}
        </View>

        {similar.length > 0 && (
          <View style={styles.similarBlock}>
            <Text style={styles.sectionTitle}>Similar Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 12 }}>
              {similar.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.simCard}
                  onPress={() => router.push(`/pharmacy/${item.id}`)}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.simImg} />
                  <Text style={styles.simName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.simPrice}>₹{item.price.toFixed(0)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.qtyBox}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={18} color={Palette.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}>
            <Ionicons name="add" size={18} color={Palette.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnCart]}
            onPress={() => handleAddToCart(false)}
            disabled={addingToCart}
          >
            <Text style={styles.btnCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnBuy]}
            onPress={() => handleAddToCart(true)}
            disabled={addingToCart}
          >
            {addingToCart ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnBuyText}>Buy Now</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },

  scrollContent: { paddingBottom: 100 },

  imageBlock: {
    width: '100%',
    height: 280,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  mainImage: { width: '70%', height: '80%', resizeMode: 'contain' },

  infoBlock: { padding: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  catText: { fontSize: 11, fontWeight: '700', color: '#047857', textTransform: 'uppercase' },
  stockBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  stockText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  
  prodName: { fontSize: 22, fontWeight: '800', color: Palette.text, lineHeight: 28 },
  mfrText: { fontSize: 13, color: Palette.textMuted, marginTop: 4 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  priceText: { fontSize: 28, fontWeight: '800', color: Palette.secondary },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 4,
  },
  ratingVal: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  ratingCount: { fontSize: 12, color: '#B45309' },

  rxCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rxTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  rxSub: { fontSize: 11, color: '#047857' },
  rxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#059669',
  },
  rxBtnDone: { backgroundColor: '#059669' },
  rxBtnText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabBtnActive: { backgroundColor: '#fff', ...Shadows.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: Palette.textMuted },
  tabTextActive: { color: Palette.secondary },
  tabContent: { padding: Spacing.md },
  bodyText: { fontSize: 14, lineHeight: 22, color: '#475569' },

  similarBlock: { marginTop: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Palette.text, marginHorizontal: Spacing.md, marginBottom: 12 },
  simCard: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
  },
  simImg: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 8 },
  simName: { fontSize: 12, fontWeight: '700', color: Palette.text, textAlign: 'center' },
  simPrice: { fontSize: 13, fontWeight: '800', color: Palette.secondary, marginTop: 4 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 4,
    gap: 12,
  },
  qtyBtn: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  qtyText: { fontSize: 16, fontWeight: '700', color: Palette.text },
  
  actionBtns: { flex: 1, flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  btnCart: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' },
  btnCartText: { fontSize: 14, fontWeight: '700', color: '#0284C7' },
  btnBuy: { backgroundColor: Palette.secondary },
  btnBuyText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
