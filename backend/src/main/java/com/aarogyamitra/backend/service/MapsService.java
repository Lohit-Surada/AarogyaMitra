package com.aarogyamitra.backend.service;

import com.aarogyamitra.backend.dto.NearbyPlacesRequest;
import com.aarogyamitra.backend.dto.NearbyPlacesResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Maps Service
 * Handles business logic for maps and location-based services
 * Integrates with Google Maps API
 */
@Service
public class MapsService {

    private static final String GOOGLE_MAPS_API_KEY = "AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU";
    private static final String GOOGLE_PLACES_API_BASE = "https://maps.googleapis.com/maps/api";

    /**
     * Get nearby hospitals
     */
    public NearbyPlacesResponse getNearbyHospitals(NearbyPlacesRequest request) {
        try {
            List<NearbyPlacesResponse.PlaceDTO> hospitals = fetchNearbyPlaces(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                "hospital"
            );
            return new NearbyPlacesResponse(hospitals, "OK", "Successfully fetched nearby hospitals");
        } catch (Exception e) {
            return new NearbyPlacesResponse(new ArrayList<>(), "ERROR", "Failed to fetch hospitals: " + e.getMessage());
        }
    }

    /**
     * Get nearby pharmacies
     */
    public NearbyPlacesResponse getNearbyPharmacies(NearbyPlacesRequest request) {
        try {
            List<NearbyPlacesResponse.PlaceDTO> pharmacies = fetchNearbyPlaces(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                "pharmacy"
            );
            return new NearbyPlacesResponse(pharmacies, "OK", "Successfully fetched nearby pharmacies");
        } catch (Exception e) {
            return new NearbyPlacesResponse(new ArrayList<>(), "ERROR", "Failed to fetch pharmacies: " + e.getMessage());
        }
    }

    /**
     * Get nearby clinics
     */
    public NearbyPlacesResponse getNearByClinics(NearbyPlacesRequest request) {
        try {
            List<NearbyPlacesResponse.PlaceDTO> clinics = fetchNearbyPlaces(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                "clinic"
            );
            return new NearbyPlacesResponse(clinics, "OK", "Successfully fetched nearby clinics");
        } catch (Exception e) {
            return new NearbyPlacesResponse(new ArrayList<>(), "ERROR", "Failed to fetch clinics: " + e.getMessage());
        }
    }

    /**
     * Search health services by keyword
     */
    public NearbyPlacesResponse searchHealthServices(NearbyPlacesRequest request) {
        try {
            List<NearbyPlacesResponse.PlaceDTO> results = searchPlacesByKeyword(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                request.getKeyword()
            );
            return new NearbyPlacesResponse(results, "OK", "Successfully searched health services");
        } catch (Exception e) {
            return new NearbyPlacesResponse(new ArrayList<>(), "ERROR", "Failed to search services: " + e.getMessage());
        }
    }

    /**
     * Fetch nearby places from Google Places API
     * Note: In production, consider caching and rate limiting
     */
    private List<NearbyPlacesResponse.PlaceDTO> fetchNearbyPlaces(
            Double latitude,
            Double longitude,
            Integer radius,
            String type) {
        // This would call the actual Google Places API
        // For now, returning a demo implementation
        List<NearbyPlacesResponse.PlaceDTO> places = new ArrayList<>();

        // TODO: Implement actual Google Places API call
        // Example URL: https://maps.googleapis.com/maps/api/place/nearbysearch/json
        // ?location={lat},{lng}&radius={radius}&type={type}&key={API_KEY}

        return places;
    }

    /**
     * Search places by keyword
     */
    private List<NearbyPlacesResponse.PlaceDTO> searchPlacesByKeyword(
            Double latitude,
            Double longitude,
            Integer radius,
            String keyword) {
        // This would call the actual Google Places API text search
        List<NearbyPlacesResponse.PlaceDTO> places = new ArrayList<>();

        // TODO: Implement actual Google Places Text Search API call
        // Example URL: https://maps.googleapis.com/maps/api/place/textsearch/json
        // ?query={keyword}&location={lat},{lng}&radius={radius}&key={API_KEY}

        return places;
    }

    /**
     * Calculate distance between two locations using Haversine formula
     * Returns distance in meters
     */
    public double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            throw new IllegalArgumentException("Coordinates cannot be null");
        }

        final int EARTH_RADIUS_METERS = 6371000; // Earth's radius in meters

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Format distance for display
     */
    public String formatDistance(double meters) {
        if (meters < 1000) {
            return String.format("%.0f m", meters);
        }
        return String.format("%.1f km", meters / 1000);
    }

    /**
     * Format duration for display
     */
    public String formatDuration(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;

        if (hours > 0) {
            return String.format("%dh %dm", hours, minutes);
        }
        return String.format("%dm", minutes);
    }

    /**
     * Validate location coordinates
     */
    public boolean isValidCoordinate(Double latitude, Double longitude) {
        return latitude != null &&
               longitude != null &&
               latitude >= -90 && latitude <= 90 &&
               longitude >= -180 && longitude <= 180;
    }
}
