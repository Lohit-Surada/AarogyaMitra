package com.aarogyamitra.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aarogyamitra.backend.dto.DiseaseSymptomRequest;
import com.aarogyamitra.backend.dto.DiseaseSymptomResponse;

import java.util.Map;

@Service
public class DiseaseService {
    private static final Logger logger = LoggerFactory.getLogger(DiseaseService.class);
    
    @Value("${ml.service.url:http://192.168.1.5:5000}")
    private String mlServiceUrl;
    
    private final RestTemplate restTemplate;
    
    public DiseaseService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Predict disease based on symptoms
     * @param request containing symptoms array
     * @return disease prediction response
     */
    public DiseaseSymptomResponse predictDisease(DiseaseSymptomRequest request) {
        try {
            if (request.getSymptoms() == null || request.getSymptoms().length == 0) {
                DiseaseSymptomResponse response = new DiseaseSymptomResponse();
                response.setSuccess(false);
                response.setError("Please provide at least one symptom");
                return response;
            }
            
            logger.info("Sending prediction request with {} symptoms to ML service", request.getSymptoms().length);
            
            // Call ML service
            String mlEndpoint = mlServiceUrl + "/api/predict-disease";
            logger.info("ML Service URL: {}", mlEndpoint);
            
            DiseaseSymptomResponse response = restTemplate.postForObject(
                mlEndpoint,
                request,
                DiseaseSymptomResponse.class
            );
            
            if (response != null) {
                logger.info("Successfully predicted disease: {} with confidence: {}", 
                    response.getDisease(), response.getConfidence());
            }
            
            return response;
            
        } catch (RestClientException e) {
            logger.error("Error calling ML service: {}", e.getMessage(), e);
            DiseaseSymptomResponse response = new DiseaseSymptomResponse();
            response.setSuccess(false);
            response.setError("ML service is unavailable. Please ensure the Python Flask server is running on port 5000.");
            return response;
        } catch (RuntimeException e) {
            logger.error("Unexpected error during disease prediction: {}", e.getMessage(), e);
            DiseaseSymptomResponse response = new DiseaseSymptomResponse();
            response.setSuccess(false);
            response.setError("Error processing prediction: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Check health of ML service
     * @return true if ML service is healthy
     */
    public boolean checkMlServiceHealth() {
        try {
            String healthEndpoint = mlServiceUrl + "/health";
            Object response = restTemplate.getForObject(healthEndpoint, Map.class);

            if (response instanceof Map<?, ?> responseMap) {
                return "healthy".equals(responseMap.get("status"));
            }

            return false;
        } catch (RestClientException e) {
            logger.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
