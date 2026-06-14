package com.aarogyamitra.backend.service;

import com.aarogyamitra.backend.model.*;
import com.aarogyamitra.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PharmacyService {

    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final SavedAddressRepository savedAddressRepository;
    private final OrderRepository orderRepository;

    public PharmacyService(ProductRepository productRepository,
                           CartItemRepository cartItemRepository,
                           SavedAddressRepository savedAddressRepository,
                           OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
        this.savedAddressRepository = savedAddressRepository;
        this.orderRepository = orderRepository;
    }

    // --- PRODUCTS ---

    public Page<Product> getProducts(String category, String search, Double minPrice, Double maxPrice,
                                    Boolean inStock, Double minRating, int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        PageRequest pageable = PageRequest.of(page, size, sort);
        return productRepository.filterProducts(
                (category == null || category.trim().isEmpty()) ? null : category,
                (search == null || search.trim().isEmpty()) ? null : search,
                minPrice, maxPrice, inStock, minRating, pageable);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getFeaturedProducts() {
        return productRepository.findTop6ByOrderByRatingsDesc();
    }

    public List<Product> getRecommendations() {
        return productRepository.findTop6ByOrderByReviewCountDesc();
    }

    // --- CART ---

    public List<CartItem> getCart(String email) {
        return cartItemRepository.findByUserEmail(email);
    }

    public CartItem addToCart(String email, Long productId, int quantity) {
        Optional<CartItem> existing = cartItemRepository.findByUserEmailAndProductId(email, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        } else {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            CartItem item = new CartItem(null, email, product, quantity);
            return cartItemRepository.save(item);
        }
    }

    public CartItem updateCartQuantity(String email, Long productId, int quantity) {
        CartItem item = cartItemRepository.findByUserEmailAndProductId(email, productId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found in cart"));
        if (quantity <= 0) {
            cartItemRepository.delete(item);
            return null;
        }
        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    public void removeFromCart(String email, Long productId) {
        cartItemRepository.findByUserEmailAndProductId(email, productId)
                .ifPresent(cartItemRepository::delete);
    }

    public void clearCart(String email) {
        cartItemRepository.deleteByUserEmail(email);
    }

    // --- ADDRESS ---

    public List<SavedAddress> getAddresses(String email) {
        return savedAddressRepository.findByUserEmail(email);
    }

    public SavedAddress addAddress(String email, SavedAddress address) {
        address.setUserEmail(email);
        return savedAddressRepository.save(address);
    }

    public void deleteAddress(String email, Long addressId) {
        savedAddressRepository.findById(addressId).ifPresent(addr -> {
            if (addr.getUserEmail().equalsIgnoreCase(email)) {
                savedAddressRepository.delete(addr);
            }
        });
    }

    // --- ORDERS ---

    public List<Order> getOrders(String email) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Order placeOrder(String email, Order orderRequest, List<CartItem> cartItems) {
        Order order = new Order();
        order.setUserEmail(email);
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setPaymentStatus(orderRequest.getPaymentStatus());
        order.setOrderStatus("PLACED");
        order.setShippingAddress(orderRequest.getShippingAddress());
        order.setLatitude(orderRequest.getLatitude());
        order.setLongitude(orderRequest.getLongitude());
        order.setCreatedAt(LocalDateTime.now());
        
        order.setSubtotal(orderRequest.getSubtotal());
        order.setDiscount(orderRequest.getDiscount());
        order.setGst(orderRequest.getGst());
        order.setDeliveryFee(orderRequest.getDeliveryFee());
        order.setTotal(orderRequest.getTotal());
        
        order.setRazorpayOrderId(orderRequest.getRazorpayOrderId());
        order.setRazorpayPaymentId(orderRequest.getRazorpayPaymentId());
        order.setRazorpaySignature(orderRequest.getRazorpaySignature());

        List<OrderItem> items = new ArrayList<>();
        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(ci.getProduct().getPrice());
            items.add(oi);
            
            // Update stock
            Product prod = ci.getProduct();
            int newStock = Math.max(0, prod.getStock() - ci.getQuantity());
            prod.setStock(newStock);
            if (newStock == 0) {
                prod.setInStock(false);
            }
            productRepository.save(prod);
        }
        order.setOrderItems(items);

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteByUserEmail(email);
        return savedOrder;
    }

    public void cancelOrder(String email, Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (order.getUserEmail().equalsIgnoreCase(email) && order.getOrderStatus().equals("PLACED")) {
                order.setOrderStatus("CANCELLED");
                // Revert stocks
                for (OrderItem item : order.getOrderItems()) {
                    Product prod = item.getProduct();
                    prod.setStock(prod.getStock() + item.getQuantity());
                    prod.setInStock(true);
                    productRepository.save(prod);
                }
                orderRepository.save(order);
            }
        });
    }
}
