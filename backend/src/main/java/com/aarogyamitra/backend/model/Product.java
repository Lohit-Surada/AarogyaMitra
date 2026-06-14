package com.aarogyamitra.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    @Column(length = 1000)
    private String description;
    
    private Double price;
    private String category; // Medicines, Health Supplements, Personal Care, Medical Devices, Baby Care, Fitness
    private Integer stock;
    
    @Column(length = 500)
    private String imageUrl;
    
    private Double ratings;
    private Integer reviewCount;
    
    @Column(length = 1000)
    private String uses;
    
    @Column(length = 1000)
    private String sideEffects;
    
    private String manufacturer;
    private Boolean inStock;
}
