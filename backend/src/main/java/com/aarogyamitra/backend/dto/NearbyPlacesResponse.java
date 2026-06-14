package com.aarogyamitra.backend.dto;

import java.io.Serializable;
import java.util.List;

/**
 * DTO for nearby places response
 */
public class NearbyPlacesResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<PlaceDTO> places;
    private String status;
    private String message;

    // Constructors
    public NearbyPlacesResponse() {
    }

    public NearbyPlacesResponse(List<PlaceDTO> places, String status, String message) {
        this.places = places;
        this.status = status;
        this.message = message;
    }

    // Getters and Setters
    public List<PlaceDTO> getPlaces() {
        return places;
    }

    public void setPlaces(List<PlaceDTO> places) {
        this.places = places;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Inner DTO for place details
     */
    public static class PlaceDTO implements Serializable {
        private static final long serialVersionUID = 1L;

        private String id;
        private String name;
        private String placeType;
        private LocationDTO location;
        private String address;
        private Double distance;
        private Double rating;
        private String phoneNumber;
        private String website;
        private String photoUrl;
        private Boolean isOpen;
        private String businessStatus;

        // Constructors
        public PlaceDTO() {
        }

        public PlaceDTO(String id, String name, String placeType, LocationDTO location, String address) {
            this.id = id;
            this.name = name;
            this.placeType = placeType;
            this.location = location;
            this.address = address;
        }

        // Getters and Setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPlaceType() {
            return placeType;
        }

        public void setPlaceType(String placeType) {
            this.placeType = placeType;
        }

        public LocationDTO getLocation() {
            return location;
        }

        public void setLocation(LocationDTO location) {
            this.location = location;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public Double getDistance() {
            return distance;
        }

        public void setDistance(Double distance) {
            this.distance = distance;
        }

        public Double getRating() {
            return rating;
        }

        public void setRating(Double rating) {
            this.rating = rating;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }

        public String getPhotoUrl() {
            return photoUrl;
        }

        public void setPhotoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
        }

        public Boolean getIsOpen() {
            return isOpen;
        }

        public void setIsOpen(Boolean isOpen) {
            this.isOpen = isOpen;
        }

        public String getBusinessStatus() {
            return businessStatus;
        }

        public void setBusinessStatus(String businessStatus) {
            this.businessStatus = businessStatus;
        }
    }

    /**
     * Inner DTO for location coordinates
     */
    public static class LocationDTO implements Serializable {
        private static final long serialVersionUID = 1L;

        private Double latitude;
        private Double longitude;

        // Constructors
        public LocationDTO() {
        }

        public LocationDTO(Double latitude, Double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
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
    }
}
