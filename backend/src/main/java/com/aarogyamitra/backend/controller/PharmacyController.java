package com.aarogyamitra.backend.controller;

import com.aarogyamitra.backend.model.*;
import com.aarogyamitra.backend.service.PharmacyService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    // --- PRODUCTS ---

    @GetMapping("/products")
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(pharmacyService.getProducts(
                category, search, minPrice, maxPrice, inStock, minRating, page, size, sortBy, sortDir));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return pharmacyService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products/featured")
    public ResponseEntity<List<Product>> getFeaturedProducts() {
        return ResponseEntity.ok(pharmacyService.getFeaturedProducts());
    }

    @GetMapping("/products/recommended")
    public ResponseEntity<List<Product>> getRecommendedProducts() {
        return ResponseEntity.ok(pharmacyService.getRecommendations());
    }

    private String getAuthenticatedEmail() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // --- CART ---

    @GetMapping("/cart")
    public ResponseEntity<List<CartItem>> getCart() {
        return ResponseEntity.ok(pharmacyService.getCart(getAuthenticatedEmail()));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<CartItem> addToCart(@RequestBody Map<String, Object> payload) {
        String email = getAuthenticatedEmail();
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(pharmacyService.addToCart(email, productId, quantity));
    }

    @PostMapping("/cart/update")
    public ResponseEntity<CartItem> updateCartQuantity(@RequestBody Map<String, Object> payload) {
        String email = getAuthenticatedEmail();
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(pharmacyService.updateCartQuantity(email, productId, quantity));
    }

    @DeleteMapping("/cart/remove")
    public ResponseEntity<Void> removeFromCart(@RequestParam Long productId) {
        pharmacyService.removeFromCart(getAuthenticatedEmail(), productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<Void> clearCart() {
        pharmacyService.clearCart(getAuthenticatedEmail());
        return ResponseEntity.ok().build();
    }

    // --- ADDRESS ---

    @GetMapping("/addresses")
    public ResponseEntity<List<SavedAddress>> getAddresses() {
        return ResponseEntity.ok(pharmacyService.getAddresses(getAuthenticatedEmail()));
    }

    @PostMapping("/addresses/add")
    public ResponseEntity<SavedAddress> addAddress(@RequestBody SavedAddress address) {
        return ResponseEntity.ok(pharmacyService.addAddress(getAuthenticatedEmail(), address));
    }

    @DeleteMapping("/addresses/delete/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        pharmacyService.deleteAddress(getAuthenticatedEmail(), id);
        return ResponseEntity.ok().build();
    }

    // --- ORDERS ---

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders() {
        return ResponseEntity.ok(pharmacyService.getOrders(getAuthenticatedEmail()));
    }

    @PostMapping("/orders/place-cod")
    public ResponseEntity<Order> placeCodOrder(@RequestBody Order orderRequest) {
        String email = getAuthenticatedEmail();
        List<CartItem> cartItems = pharmacyService.getCart(email);
        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        orderRequest.setPaymentMethod("COD");
        orderRequest.setPaymentStatus("PENDING");
        Order order = pharmacyService.placeOrder(email, orderRequest, cartItems);
        return ResponseEntity.ok(order);
    }
    
    @PostMapping("/orders/create-razorpay")
    public ResponseEntity<Map<String, String>> createRazorpayOrder(@RequestBody Map<String, Object> payload) {
        try {
            Double amount = Double.parseDouble(payload.get("amount").toString());
            String rzpOrderId = pharmacyService.createRazorpayOrder(amount);
            return ResponseEntity.ok(Map.of("id", rzpOrderId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/orders/place-online")
    public ResponseEntity<com.aarogyamitra.backend.model.Order> placeOnlineOrder(@RequestBody com.aarogyamitra.backend.model.Order orderRequest) {
        String email = getAuthenticatedEmail();
        List<CartItem> cartItems = pharmacyService.getCart(email);
        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        orderRequest.setPaymentMethod("RAZORPAY");
        orderRequest.setPaymentStatus("PAID");
        com.aarogyamitra.backend.model.Order order = pharmacyService.placeOrder(email, orderRequest, cartItems);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/cancel/{id}")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long id) {
        pharmacyService.cancelOrder(getAuthenticatedEmail(), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/add-test-product")
    public ResponseEntity<Product> addTestProduct(@org.springframework.beans.factory.annotation.Autowired com.aarogyamitra.backend.repository.ProductRepository productRepo) {
        Product p = new Product();
        p.setName("Test Product Rs. 1");
        p.setDescription("A dummy product for testing payments.");
        p.setCategory("Test");
        p.setPrice(1.0);
        p.setStock(100);
        p.setInStock(true);
        p.setRatings(5.0);
        p.setReviewCount(0);
        p.setImageUrl("https://img.freepik.com/premium-vector/medicine-bottle-pills-black-white-vector-illustration_530521-1250.jpg");
        return ResponseEntity.ok(productRepo.save(p));
    }
}
