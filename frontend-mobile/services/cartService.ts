import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, realtimeDb } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';
import { sanitizeEmail } from './rtdbService';

const GUEST_CART_KEY = 'GUEST_CART';

export type GuestProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;

  stock: number;
};

export type CartItem = {
  id?: number;
  product: GuestProduct;
  quantity: number;
};

export async function getCart(): Promise<CartItem[]> {
  const user = auth.currentUser;
  if (user && user.email) {
    try {
      const emailKey = sanitizeEmail(user.email);
      const cartRef = ref(realtimeDb, `carts/${emailKey}`);
      const snap = await get(cartRef);
      if (snap.exists()) {
        const data = snap.val();
        return Array.isArray(data) ? data : Object.values(data);
      }
    } catch (e) {
      console.error('Failed to fetch authenticated cart from Firebase', e);
    }
    return [];
  } else {
    const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
    return guestCartStr ? JSON.parse(guestCartStr) : [];
  }
}

export async function addToCart(productId: number, quantity: number, productDetails: GuestProduct): Promise<void> {
  const user = auth.currentUser;
  const cart = await getCart();
  const existingIndex = cart.findIndex(item => item.product.id === productId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product: productDetails, quantity });
  }

  if (user && user.email) {
    const emailKey = sanitizeEmail(user.email);
    await set(ref(realtimeDb, `carts/${emailKey}`), cart);
  } else {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  }
}

export async function updateCartQuantity(productId: number, quantity: number): Promise<void> {
  const user = auth.currentUser;
  const cart = await getCart();
  const existingIndex = cart.findIndex(item => item.product.id === productId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity = quantity;
    if (user && user.email) {
      const emailKey = sanitizeEmail(user.email);
      await set(ref(realtimeDb, `carts/${emailKey}`), cart);
    } else {
      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  }
}

export async function removeFromCart(productId: number): Promise<void> {
  const user = auth.currentUser;
  const cart = await getCart();
  const filteredCart = cart.filter(item => item.product.id !== productId);
  
  if (user && user.email) {
    const emailKey = sanitizeEmail(user.email);
    await set(ref(realtimeDb, `carts/${emailKey}`), filteredCart);
  } else {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(filteredCart));
  }
}

export async function clearCart(): Promise<void> {
  const user = auth.currentUser;
  if (user && user.email) {
    const emailKey = sanitizeEmail(user.email);
    await set(ref(realtimeDb, `carts/${emailKey}`), null);
  } else {
    await AsyncStorage.removeItem(GUEST_CART_KEY);
  }
}

export async function mergeGuestCartWithBackend(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
  if (guestCartStr) {
    const guestCart: CartItem[] = JSON.parse(guestCartStr);
    if (guestCart.length > 0) {
      // Fetch existing authenticated cart
      const emailKey = sanitizeEmail(user.email);
      const cartRef = ref(realtimeDb, `carts/${emailKey}`);
      const snap = await get(cartRef);
      
      let mergedCart: CartItem[] = [];
      if (snap.exists()) {
        const data = snap.val();
        mergedCart = Array.isArray(data) ? data : Object.values(data);
      }

      // Merge
      for (const guestItem of guestCart) {
        const existingIndex = mergedCart.findIndex(item => item.product.id === guestItem.product.id);
        if (existingIndex >= 0) {
          mergedCart[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      }

      await set(cartRef, mergedCart);
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    }
  }
}
