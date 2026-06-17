package com.aarogyamitra.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    private String userEmail;
    
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    
    private String paymentStatus; // PENDING, PAID, FAILED, COD
    private String orderStatus; // PLACED, SHIPPED, DELIVERED, CANCELLED
    
    private Double subtotal;
    private Double discount;
    private Double gst;
    private Double deliveryFee;
    private Double total;
    
    private String paymentMethod; // RAZORPAY, COD
    
    @Column(length = 500)
    private String shippingAddress;
    private Double latitude;
    private Double longitude;
    
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> orderItems;
}
