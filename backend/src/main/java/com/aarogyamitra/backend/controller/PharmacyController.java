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

    // --- CART ---

    @GetMapping("/cart")
    public ResponseEntity<List<CartItem>> getCart(@RequestParam String email) {
        return ResponseEntity.ok(pharmacyService.getCart(email));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<CartItem> addToCart(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(pharmacyService.addToCart(email, productId, quantity));
    }

    @PostMapping("/cart/update")
    public ResponseEntity<CartItem> updateCartQuantity(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        Long productId = Long.valueOf(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(pharmacyService.updateCartQuantity(email, productId, quantity));
    }

    @DeleteMapping("/cart/remove")
    public ResponseEntity<Void> removeFromCart(@RequestParam String email, @RequestParam Long productId) {
        pharmacyService.removeFromCart(email, productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<Void> clearCart(@RequestParam String email) {
        pharmacyService.clearCart(email);
        return ResponseEntity.ok().build();
    }

    // --- ADDRESS ---

    @GetMapping("/addresses")
    public ResponseEntity<List<SavedAddress>> getAddresses(@RequestParam String email) {
        return ResponseEntity.ok(pharmacyService.getAddresses(email));
    }

    @PostMapping("/addresses/add")
    public ResponseEntity<SavedAddress> addAddress(@RequestParam String email, @RequestBody SavedAddress address) {
        return ResponseEntity.ok(pharmacyService.addAddress(email, address));
    }

    @DeleteMapping("/addresses/delete/{id}")
    public ResponseEntity<Void> deleteAddress(@RequestParam String email, @PathVariable Long id) {
        pharmacyService.deleteAddress(email, id);
        return ResponseEntity.ok().build();
    }

    // --- ORDERS ---

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders(@RequestParam String email) {
        return ResponseEntity.ok(pharmacyService.getOrders(email));
    }

    @PostMapping("/orders/place-cod")
    public ResponseEntity<Order> placeCodOrder(@RequestParam String email, @RequestBody Order orderRequest) {
        List<CartItem> cartItems = pharmacyService.getCart(email);
        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        orderRequest.setPaymentMethod("COD");
        orderRequest.setPaymentStatus("PENDING");
        Order order = pharmacyService.placeOrder(email, orderRequest, cartItems);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/cancel/{id}")
    public ResponseEntity<Void> cancelOrder(@RequestParam String email, @PathVariable Long id) {
        pharmacyService.cancelOrder(email, id);
        return ResponseEntity.ok().build();
    }
}
