package com.aarogyamitra.backend.controller;

import com.aarogyamitra.backend.model.CartItem;
import com.aarogyamitra.backend.model.Order;
import com.aarogyamitra.backend.service.PaymentService;
import com.aarogyamitra.backend.service.PharmacyService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aarogyamitra.backend.model.Product;
import com.aarogyamitra.backend.repository.ProductRepository;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final PharmacyService pharmacyService;
    private final ProductRepository productRepository;

    @Value("${razorpay.key.id}")
    private String keyId;

    public PaymentController(PaymentService paymentService, PharmacyService pharmacyService, ProductRepository productRepository) {
        this.paymentService = paymentService;
        this.pharmacyService = pharmacyService;
        this.productRepository = productRepository;
    }

    /**
     * Seed a ₹1 test product — public endpoint (under /api/payment/**) — idempotent.
     */
    @GetMapping("/seed-test-product")
    public ResponseEntity<Map<String, Object>> seedTestProduct() {
        try {
            java.util.Optional<Product> existing = productRepository.findAll().stream()
                .filter(p -> "Payment Testing Product".equals(p.getName()))
                .findFirst();
            if (existing.isPresent()) {
                Map<String, Object> r = new HashMap<>();
                r.put("message", "Test product already exists");
                r.put("product", existing.get());
                return ResponseEntity.ok(r);
            }
            Product p = new Product();
            p.setName("Payment Testing Product");
            p.setDescription("A ₹1 product to validate the Razorpay Live payment flow. No GST.");
            p.setCategory("Testing");
            p.setPrice(1.0);
            p.setStock(9999);

            p.setRatings(5.0);
            p.setReviewCount(0);
            p.setImageUrl("https://img.freepik.com/premium-vector/medicine-bottle-pills-black-white-vector-illustration_530521-1250.jpg");
            Product saved = productRepository.save(p);
            Map<String, Object> r = new HashMap<>();
            r.put("message", "Test product created successfully");
            r.put("product", saved);
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Serves the Razorpay checkout page containing standard JS checkout interface.
     */
    @GetMapping(value = "/checkout-html", produces = "text/html")
    @ResponseBody
    public String getCheckoutPage(
            @RequestParam String orderId,
            @RequestParam Double amount,
            @RequestParam String email,
            @RequestParam Double subtotal,
            @RequestParam Double discount,
            @RequestParam Double gst,
            @RequestParam Double deliveryFee,
            @RequestParam String shippingAddress,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>AarogyaMitra Secure Payment</title>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <script src='https://checkout.razorpay.com/v1/checkout.js'></script>\n" +
                "    <style>\n" +
                "        body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; }\n" +
                "        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }\n" +
                "        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n" +
                "        p { color: #64748b; margin-top: 20px; font-size: 16px; font-weight: 600; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='loader'></div>\n" +
                "    <p>Loading Razorpay Payment Gateway...</p>\n" +
                "    <script>\n" +
                "        var options = {\n" +
                "            'key': '" + keyId + "',\n" +
                "            'amount': " + (int)Math.round(amount * 100) + ",\n" +
                "            'currency': 'INR',\n" +
                "            'name': 'AarogyaMitra Pharmacy',\n" +
                "            'description': 'Real-time Medicine Order Checkout',\n" +
                "            'order_id': '" + orderId + "',\n" +
                "            'handler': function (response) {\n" +
                "                var redirectUrl = '/api/payment/callback' +\n" +
                "                    '?razorpayOrderId=' + encodeURIComponent(response.razorpay_order_id) +\n" +
                "                    '&razorpayPaymentId=' + encodeURIComponent(response.razorpay_payment_id) +\n" +
                "                    '&razorpaySignature=' + encodeURIComponent(response.razorpay_signature) +\n" +
                "                    '&email=' + encodeURIComponent('" + email + "') +\n" +
                "                    '&subtotal=' + " + subtotal + "\n" +
                "                    + '&discount=' + " + discount + "\n" +
                "                    + '&gst=' + " + gst + "\n" +
                "                    + '&deliveryFee=' + " + deliveryFee + "\n" +
                "                    + '&total=' + " + amount + "\n" +
                "                    + '&shippingAddress=' + encodeURIComponent('" + shippingAddress + "')\n" +
                "                    + '&latitude=' + '" + (latitude != null ? latitude : "") + "'\n" +
                "                    + '&longitude=' + '" + (longitude != null ? longitude : "") + "';\n" +
                "                window.location.href = redirectUrl;\n" +
                "            },\n" +
                "            'prefill': {\n" +
                "                'email': '" + email + "'\n" +
                "            },\n" +
                "            'theme': {\n" +
                "                'color': '#10b981'\n" +
                "            },\n" +
                "            'modal': {\n" +
                "                'ondismiss': function() {\n" +
                "                    window.location.href = '/api/payment/cancel-page';\n" +
                "                }\n" +
                "            }\n" +
                "        };\n" +
                "        var rzp = new Razorpay(options);\n" +
                "        window.onload = function() { rzp.open(); };\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Handle payment success redirection and signature checks.
     */
    @GetMapping(value = "/callback", produces = "text/html")
    @ResponseBody
    public String paymentCallback(
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String razorpaySignature,
            @RequestParam String email,
            @RequestParam Double subtotal,
            @RequestParam Double discount,
            @RequestParam Double gst,
            @RequestParam Double deliveryFee,
            @RequestParam Double total,
            @RequestParam String shippingAddress,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        boolean isValid = paymentService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            return "<html><body><h1 style='color: red; text-align: center; margin-top: 50px;'>Payment Verification Failed</h1></body></html>";
        }

        List<CartItem> cartItems = pharmacyService.getCart(email);
        Order orderRequest = new Order();
        orderRequest.setPaymentMethod("RAZORPAY");
        orderRequest.setPaymentStatus("PAID");
        orderRequest.setRazorpayOrderId(razorpayOrderId);
        orderRequest.setRazorpayPaymentId(razorpayPaymentId);
        orderRequest.setRazorpaySignature(razorpaySignature);
        orderRequest.setSubtotal(subtotal);
        orderRequest.setDiscount(discount);
        orderRequest.setGst(gst);
        orderRequest.setDeliveryFee(deliveryFee);
        orderRequest.setTotal(total);
        orderRequest.setShippingAddress(shippingAddress);
        orderRequest.setLatitude(latitude);
        orderRequest.setLongitude(longitude);

        Order savedOrder = pharmacyService.placeOrder(email, orderRequest, cartItems);

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>Payment Success</title>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <style>\n" +
                "        body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #ecfdf5; color: #065f46; text-align: center; padding: 20px; }\n" +
                "        h1 { margin-bottom: 10px; }\n" +
                "        p { color: #047857; margin-bottom: 30px; }\n" +
                "        .btn { background-color: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; text-decoration: none; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <svg width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='#10b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path><polyline points='22 4 12 14.01 9 11.01'></polyline></svg>\n" +
                "    <h1>Payment Successful!</h1>\n" +
                "    <p>Your order #" + savedOrder.getId() + " has been placed successfully.</p>\n" +
                "    <p style='font-size: 13px; color: #64748b;'>You can close this tab and return to the app.</p>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Handle payment cancellations.
     */
    @GetMapping(value = "/cancel-page", produces = "text/html")
    @ResponseBody
    public String paymentCancel() {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>Payment Cancelled</title>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <style>\n" +
                "        body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #fef2f2; color: #991b1b; text-align: center; padding: 20px; }\n" +
                "        h1 { margin-bottom: 10px; }\n" +
                "        p { color: #b91c1c; margin-bottom: 30px; }\n" +
                "        .btn { background-color: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; text-decoration: none; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <svg width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='#ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><line x1='15' y1='9' x2='9' y2='15'></line><line x1='9' y1='9' x2='15' y2='15'></line></svg>\n" +
                "    <h1>Payment Cancelled</h1>\n" +
                "    <p>The transaction was cancelled or dismissed.</p>\n" +
                "    <p style='font-size: 13px; color: #64748b;'>You can close this tab and return to the app.</p>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Create Razorpay Order
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            Double amount = Double.valueOf(payload.get("amount").toString());
            String receiptId = "txn_" + UUID.randomUUID().toString().substring(0, 8);

            String orderResponse = paymentService.createRazorpayOrder(amount, receiptId);
            JSONObject json = new JSONObject(orderResponse);

            Map<String, Object> response = new HashMap<>();
            response.put("id", json.getString("id"));
            response.put("amount", json.getInt("amount"));
            response.put("currency", json.getString("currency"));
            response.put("receipt", json.getString("receipt"));
            response.put("status", json.getString("status"));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create payment order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Verify signature endpoint
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, Object> payload) {
        try {
            String email = (String) payload.get("email");
            String orderId = (String) payload.get("razorpayOrderId");
            String paymentId = (String) payload.get("razorpayPaymentId");
            String signature = (String) payload.get("razorpaySignature");

            boolean isValid = paymentService.verifySignature(orderId, paymentId, signature);
            if (!isValid) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid payment signature");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Payment is valid, let's place the order
            List<CartItem> cartItems = new java.util.ArrayList<>(pharmacyService.getCart(email));
            if (cartItems.isEmpty()) {
                List<Map<String, Object>> payloadItems = (List<Map<String, Object>>) payload.get("orderItems");
                if (payloadItems != null && !payloadItems.isEmpty()) {
                    for (Map<String, Object> itemMap : payloadItems) {
                        Map<String, Object> prodMap = (Map<String, Object>) itemMap.get("product");
                        if (prodMap != null && prodMap.get("id") != null) {
                            Long productId = Long.valueOf(prodMap.get("id").toString());
                            int quantity = Integer.parseInt(itemMap.get("quantity").toString());
                            java.util.Optional<com.aarogyamitra.backend.model.Product> pOpt = pharmacyService.getProductById(productId);
                            if (pOpt.isPresent()) {
                                CartItem ci = new CartItem(null, email, pOpt.get(), quantity);
                                cartItems.add(ci);
                            }
                        }
                    }
                }
            }

            if (cartItems.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Cart is empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Order orderRequest = new Order();
            orderRequest.setPaymentMethod("RAZORPAY");
            orderRequest.setPaymentStatus("PAID");
            orderRequest.setRazorpayOrderId(orderId);
            orderRequest.setRazorpayPaymentId(paymentId);
            orderRequest.setRazorpaySignature(signature);

            orderRequest.setSubtotal(Double.valueOf(payload.get("subtotal").toString()));
            orderRequest.setDiscount(Double.valueOf(payload.get("discount").toString()));
            orderRequest.setGst(Double.valueOf(payload.get("gst").toString()));
            orderRequest.setDeliveryFee(Double.valueOf(payload.get("deliveryFee").toString()));
            orderRequest.setTotal(Double.valueOf(payload.get("total").toString()));
            orderRequest.setShippingAddress((String) payload.get("shippingAddress"));
            orderRequest.setLatitude(payload.get("latitude") != null ? Double.valueOf(payload.get("latitude").toString()) : null);
            orderRequest.setLongitude(payload.get("longitude") != null ? Double.valueOf(payload.get("longitude").toString()) : null);

            Order savedOrder = pharmacyService.placeOrder(email, orderRequest, cartItems);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("order", savedOrder);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  QR CODE PAYMENT ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a Razorpay UPI QR code for the given amount.
     * Returns: { id, imageUrl, amount, closeBy }
     */
    @PostMapping("/create-qr")
    public ResponseEntity<Map<String, Object>> createQrCode(@RequestBody Map<String, Object> payload) {
        try {
            Double amount = Double.valueOf(payload.get("amount").toString());
            String reference = "qr_" + UUID.randomUUID().toString().substring(0, 8);

            Map<String, Object> qrData = paymentService.createQrCode(amount, reference);
            return ResponseEntity.ok(qrData);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create QR code: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Poll whether a Razorpay QR code has received a payment.
     * If paid, automatically places the order and clears the cart.
     * Returns: { paid, paymentId, orderId (if placed) }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/qr-complete")
    public ResponseEntity<Map<String, Object>> completeQrPayment(@RequestBody Map<String, Object> payload) {
        try {
            String qrCodeId   = (String) payload.get("qrCodeId");
            String email      = (String) payload.get("email");

            // Check if Razorpay received payment for this QR
            Map<String, Object> qrStatus = paymentService.checkQrPayment(qrCodeId);
            boolean isPaid = Boolean.TRUE.equals(qrStatus.get("paid"));

            if (!isPaid) {
                Map<String, Object> response = new HashMap<>();
                response.put("paid", false);
                response.put("message", "No payment received yet");
                return ResponseEntity.ok(response);
            }

            // Payment received — place the order
            List<CartItem> cartItems = new java.util.ArrayList<>(pharmacyService.getCart(email));
            if (cartItems.isEmpty()) {
                List<Map<String, Object>> payloadItems = (List<Map<String, Object>>) payload.get("orderItems");
                if (payloadItems != null && !payloadItems.isEmpty()) {
                    for (Map<String, Object> itemMap : payloadItems) {
                        Map<String, Object> prodMap = (Map<String, Object>) itemMap.get("product");
                        if (prodMap != null && prodMap.get("id") != null) {
                            Long productId = Long.valueOf(prodMap.get("id").toString());
                            int quantity = Integer.parseInt(itemMap.get("quantity").toString());
                            java.util.Optional<com.aarogyamitra.backend.model.Product> pOpt = pharmacyService.getProductById(productId);
                            if (pOpt.isPresent()) {
                                CartItem ci = new CartItem(null, email, pOpt.get(), quantity);
                                cartItems.add(ci);
                            }
                        }
                    }
                }
            }

            Order orderRequest = new Order();
            orderRequest.setPaymentMethod("RAZORPAY_QR");
            orderRequest.setPaymentStatus("PAID");
            orderRequest.setRazorpayOrderId(qrCodeId);
            orderRequest.setRazorpayPaymentId(qrStatus.get("paymentId") != null
                    ? qrStatus.get("paymentId").toString() : "qr_payment");
            orderRequest.setRazorpaySignature("qr_verified");

            orderRequest.setSubtotal(Double.valueOf(payload.get("subtotal").toString()));
            orderRequest.setDiscount(Double.valueOf(payload.get("discount").toString()));
            orderRequest.setGst(Double.valueOf(payload.get("gst").toString()));
            orderRequest.setDeliveryFee(Double.valueOf(payload.get("deliveryFee").toString()));
            orderRequest.setTotal(Double.valueOf(payload.get("total").toString()));
            orderRequest.setShippingAddress((String) payload.get("shippingAddress"));
            orderRequest.setLatitude(payload.get("latitude") != null
                    ? Double.valueOf(payload.get("latitude").toString()) : null);
            orderRequest.setLongitude(payload.get("longitude") != null
                    ? Double.valueOf(payload.get("longitude").toString()) : null);

            Order savedOrder = pharmacyService.placeOrder(email, orderRequest, cartItems);

            Map<String, Object> response = new HashMap<>();
            response.put("paid", true);
            response.put("paymentId", qrStatus.get("paymentId"));
            response.put("orderId", savedOrder.getId());
            response.put("order", savedOrder);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("paid", false);
            error.put("error", "QR completion failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

