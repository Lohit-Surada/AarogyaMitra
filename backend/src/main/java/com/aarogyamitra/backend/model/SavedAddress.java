package com.aarogyamitra.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "saved_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavedAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String name;
    private String phone;
    private String addressLine;
    private String city;
    private String state;
    private String zipCode;
    
    private Double latitude;
    private Double longitude;
}
