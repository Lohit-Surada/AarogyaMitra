package com.aarogyamitra.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
public class Product {
    public Product(Long id, String name, String description, Double price, String category, Integer stock, String imageUrl, Double ratings, Integer reviewCount, String uses, String sideEffects, String manufacturer) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.ratings = ratings;
        this.reviewCount = reviewCount;
        this.uses = uses;
        this.sideEffects = sideEffects;
        this.manufacturer = manufacturer;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

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
}
