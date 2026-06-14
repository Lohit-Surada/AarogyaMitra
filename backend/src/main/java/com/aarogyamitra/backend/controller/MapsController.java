package com.aarogyamitra.backend.controller;

import com.aarogyamitra.backend.dto.NearbyPlacesRequest;
import com.aarogyamitra.backend.dto.NearbyPlacesResponse;
import com.aarogyamitra.backend.service.MapsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Maps API Controller
 * Handles requests for nearby hospitals, pharmacies, and other health services
 */
@RestController
@RequestMapping("/api/maps")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MapsController {

    @Autowired
    private MapsService mapsService;

    /**
     * Get nearby hospitals based on location
     */
    @PostMapping("/nearby/hospitals")
    public ResponseEntity<NearbyPlacesResponse> getNearbyHospitals(@RequestBody NearbyPlacesRequest request) {
        try {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest().body(
                    new NearbyPlacesResponse(null, "ERROR", "Latitude and longitude are required")
                );
            }

            // Set default radius if not provided
            if (request.getRadius() == null) {
                request.setRadius(5000); // 5km default
            }

            NearbyPlacesResponse response = mapsService.getNearbyHospitals(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new NearbyPlacesResponse(null, "ERROR", "Error fetching nearby hospitals: " + e.getMessage())
            );
        }
    }

    /**
     * Get nearby pharmacies based on location
     */
    @PostMapping("/nearby/pharmacies")
    public ResponseEntity<NearbyPlacesResponse> getNearbyPharmacies(@RequestBody NearbyPlacesRequest request) {
        try {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest().body(
                    new NearbyPlacesResponse(null, "ERROR", "Latitude and longitude are required")
                );
            }

            // Set default radius if not provided
            if (request.getRadius() == null) {
                request.setRadius(5000); // 5km default
            }

            NearbyPlacesResponse response = mapsService.getNearbyPharmacies(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new NearbyPlacesResponse(null, "ERROR", "Error fetching nearby pharmacies: " + e.getMessage())
            );
        }
    }

    /**
     * Get nearby clinics based on location
     */
    @PostMapping("/nearby/clinics")
    public ResponseEntity<NearbyPlacesResponse> getNearByClinics(@RequestBody NearbyPlacesRequest request) {
        try {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest().body(
                    new NearbyPlacesResponse(null, "ERROR", "Latitude and longitude are required")
                );
            }

            // Set default radius if not provided
            if (request.getRadius() == null) {
                request.setRadius(5000); // 5km default
            }

            NearbyPlacesResponse response = mapsService.getNearByClinics(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new NearbyPlacesResponse(null, "ERROR", "Error fetching nearby clinics: " + e.getMessage())
            );
        }
    }

    /**
     * Search for health services by keyword
     */
    @PostMapping("/search")
    public ResponseEntity<NearbyPlacesResponse> searchHealthServices(@RequestBody NearbyPlacesRequest request) {
        try {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest().body(
                    new NearbyPlacesResponse(null, "ERROR", "Latitude and longitude are required")
                );
            }

            if (request.getKeyword() == null || request.getKeyword().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new NearbyPlacesResponse(null, "ERROR", "Keyword is required for search")
                );
            }

            // Set default radius if not provided
            if (request.getRadius() == null) {
                request.setRadius(5000); // 5km default
            }

            NearbyPlacesResponse response = mapsService.searchHealthServices(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new NearbyPlacesResponse(null, "ERROR", "Error searching health services: " + e.getMessage())
            );
        }
    }

    /**
     * Get distance between two locations
     */
    @PostMapping("/distance")
    public ResponseEntity<?> getDistance(
            @RequestParam(name = "originLat") Double originLat,
            @RequestParam(name = "originLng") Double originLng,
            @RequestParam(name = "destLat") Double destLat,
            @RequestParam(name = "destLng") Double destLng) {
        try {
            double distance = mapsService.calculateDistance(originLat, originLng, destLat, destLng);
            return ResponseEntity.ok(new DistanceResponse(distance, "meters"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse("ERROR", "Error calculating distance: " + e.getMessage())
            );
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Maps service is running");
    }

    // Helper classes
    static class DistanceResponse {
        private double distance;
        private String unit;

        public DistanceResponse(double distance, String unit) {
            this.distance = distance;
            this.unit = unit;
        }

        public double getDistance() {
            return distance;
        }

        public void setDistance(double distance) {
            this.distance = distance;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }
    }

    static class ErrorResponse {
        private String status;
        private String message;

        public ErrorResponse(String status, String message) {
            this.status = status;
            this.message = message;
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
    }
}
