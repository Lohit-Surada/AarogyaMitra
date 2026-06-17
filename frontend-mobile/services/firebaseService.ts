import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { syncOrderToRTDB, sendNotification } from './rtdbService';

/**
 * Sanitizes an email address for use as a Firestore document ID.
 */
function sanitizeEmail(email: string): string {
  return email.replace(/\./g, '_').replace(/@/g, '_at_');
}

/**
 * Saves a completed pharmacy order to:
 *   1. Firebase Cloud Firestore (persistent history)
 *   2. Firebase Realtime Database (live order tracking + notifications)
 */
export async function saveOrderToFirebase(email: string, order: any): Promise<void> {
  if (!email || !order) return;

  const sanitizedEmail = sanitizeEmail(email);
  const orderId = order.id ? String(order.id) : `order_${Date.now()}`;

  // Flatten orderItems to avoid deep nested Java objects
  const flatItems = (order.orderItems || []).map((item: any) => ({
    productId: item.product?.id ?? item.productId ?? null,
    productName: item.product?.name ?? item.productName ?? 'Unknown',
    productImage: item.product?.imageUrl ?? item.productImage ?? '',
    quantity: item.quantity ?? 1,
    price: item.price ?? 0,
  }));

  const payload: Record<string, any> = {
    orderId,
    userEmail: email,
    paymentMethod: order.paymentMethod ?? 'COD',
    paymentStatus: order.paymentStatus ?? 'PENDING',
    orderStatus: order.orderStatus ?? 'PLACED',
    shippingAddress: order.shippingAddress ?? '',
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    gst: order.gst ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    total: order.total ?? 0,
    items: flatItems,
    itemCount: flatItems.length,
    createdAt: order.createdAt ?? new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  };

  // ── 1. Save to Firestore (persistent storage) ─────────────────────────────
  try {
    const userOrderRef = doc(
      collection(db, 'users', sanitizedEmail, 'pharmacy_orders'),
      orderId
    );
    await setDoc(userOrderRef, payload);

    const globalRef = doc(db, 'pharmacy_orders', orderId);
    await setDoc(globalRef, { ...payload, sanitizedUserEmail: sanitizedEmail });

    console.log(`[Firestore] ✅ Order #${orderId} saved`);
  } catch (error) {
    console.error('[Firestore] ❌ Failed to save order:', error);
  }

  // ── 2. Sync to Realtime Database (live tracking) ──────────────────────────
  try {
    await syncOrderToRTDB(email, { ...payload, orderItems: order.orderItems });
    console.log(`[RTDB] ✅ Order #${orderId} synced to live tracking`);
  } catch (error) {
    console.error('[RTDB] ❌ Failed to sync order:', error);
  }

  // ── 3. Send order confirmation notification ────────────────────────────────
  try {
    await sendNotification(email, {
      title: '✅ Order Confirmed!',
      message: `Your order #${orderId} has been placed. Total: ₹${payload.total.toFixed(2)}. Estimated delivery in 2–3 days.`,
      type: 'order',
      actionRoute: '/pharmacy/orders',
      data: { orderId, total: payload.total },
    });
  } catch (error) {
    console.error('[RTDB] ❌ Failed to send notification:', error);
  }
}
