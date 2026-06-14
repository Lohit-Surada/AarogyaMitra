package com.aarogyamitra.backend.dto;

import java.io.Serializable;

/**
 * DTO for location-based nearby places search
 */
public class NearbyPlacesRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private Double latitude;
    private Double longitude;
    private Integer radius; // in meters
    private String type; // hospital, pharmacy, clinic, etc.
    private String keyword;

    // Constructors
    public NearbyPlacesRequest() {
    }

    public NearbyPlacesRequest(Double latitude, Double longitude, Integer radius, String type) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.type = type;
    }

    // Getters and Setters
    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getRadius() {
        return radius;
    }

    public void setRadius(Integer radius) {
        this.radius = radius;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }
}
