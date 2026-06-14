package com.aarogyamitra.backend.service;

import com.razorpay.Payment;
import com.razorpay.QrCode;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            this.razorpayClient = new RazorpayClient(keyId, keySecret);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize RazorpayClient: " + e.getMessage(), e);
        }
    }

    /**
     * Create Razorpay Order (for standard checkout flow)
     * @param amount in INR
     * @param receiptId reference id
     * @return Razorpay Order JSON string
     */
    public String createRazorpayOrder(double amount, String receiptId) throws Exception {
        JSONObject orderRequest = new JSONObject();
        // Convert to paise (1 INR = 100 Paise)
        orderRequest.put("amount", (int) Math.round(amount * 100));
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", receiptId);

        com.razorpay.Order order = razorpayClient.orders.create(orderRequest);
        return order.toString();
    }

    /**
     * Verify payment HMAC signature from Razorpay callback
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Create a Razorpay UPI QR Code for payment.
     * The QR code is single-use, fixed-amount and expires in 15 minutes.
     *
     * @param amount     in INR
     * @param reference  a unique reference string (e.g. receipt ID)
     * @return Map containing: id, imageUrl, amount, closeBy (expiry Unix timestamp)
     */
    public Map<String, Object> createQrCode(double amount, String reference) throws Exception {
        long closeByTimestamp = (System.currentTimeMillis() / 1000L) + 900; // 15 minutes from now

        JSONObject qrRequest = new JSONObject();
        qrRequest.put("type", "upi_qr");
        qrRequest.put("name", "AarogyaMitra Pharmacy");
        qrRequest.put("usage", "single_use");
        qrRequest.put("fixed_amount", true);
        qrRequest.put("payment_amount", (int) Math.round(amount * 100)); // paise
        qrRequest.put("description", "Medicine Order - " + reference);
        qrRequest.put("close_by", closeByTimestamp);

        QrCode qrCode = razorpayClient.qrCode.create(qrRequest);

        Map<String, Object> result = new HashMap<>();
        result.put("id", qrCode.get("id").toString());
        result.put("imageUrl", qrCode.get("image_url").toString());
        result.put("amount", amount);
        result.put("closeBy", closeByTimestamp);
        return result;
    }

    /**
     * Check whether a Razorpay QR Code has received a payment.
     * Returns the first captured payment if one exists.
     *
     * @param qrCodeId  Razorpay QR code ID (e.g. "qr_xxxx")
     * @return Map with: paid (boolean), paymentId (String, nullable)
     */
    public Map<String, Object> checkQrPayment(String qrCodeId) throws Exception {
        JSONObject options = new JSONObject();
        options.put("count", 1);

        List<QrCode> payments = razorpayClient.qrCode.fetchAllPayments(qrCodeId, options);

        Map<String, Object> result = new HashMap<>();
        if (payments != null && !payments.isEmpty()) {
            QrCode payment = payments.get(0);
            String status = payment.get("status") != null ? payment.get("status").toString() : "";
            boolean captured = "captured".equalsIgnoreCase(status) || "authorized".equalsIgnoreCase(status);
            result.put("paid", captured);
            result.put("paymentId", captured ? payment.get("id").toString() : null);
            result.put("status", status);
        } else {
            result.put("paid", false);
            result.put("paymentId", null);
            result.put("status", "pending");
        }
        return result;
    }
}
