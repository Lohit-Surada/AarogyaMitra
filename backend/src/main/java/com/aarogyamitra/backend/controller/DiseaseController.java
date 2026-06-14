package com.aarogyamitra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aarogyamitra.backend.dto.DiseaseSymptomRequest;
import com.aarogyamitra.backend.dto.DiseaseSymptomResponse;
import com.aarogyamitra.backend.service.DiseaseService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DiseaseController {
    private static final Logger logger = LoggerFactory.getLogger(DiseaseController.class);
    
    private final DiseaseService diseaseService;
    
    public DiseaseController(DiseaseService diseaseService) {
        this.diseaseService = diseaseService;
    }
    
    /**
     * Predict disease based on provided symptoms
     * @param request containing symptoms
     * @return disease prediction response
     */
    @PostMapping("/predict-disease")
    public ResponseEntity<DiseaseSymptomResponse> predictDisease(
            @RequestBody DiseaseSymptomRequest request) {
        try {
            logger.info("Received disease prediction request with symptoms");
            
            DiseaseSymptomResponse response = diseaseService.predictDisease(request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
        } catch (Exception e) {
            logger.error("Error in disease prediction endpoint: {}", e.getMessage(), e);
            DiseaseSymptomResponse errorResponse = new DiseaseSymptomResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError("Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Health check endpoint
     * @return health status
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        boolean mlServiceHealthy = diseaseService.checkMlServiceHealth();
        logger.info("Backend health check - ML Service: {}", mlServiceHealthy ? "healthy" : "unhealthy");
        
        String response = "Backend is running. ML Service: " + (mlServiceHealthy ? "✓ connected" : "✗ unavailable");
        return ResponseEntity.ok(response);
    }
}
