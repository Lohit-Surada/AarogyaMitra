package com.aarogyamitra.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChatbotController {
    private static final Logger logger = LoggerFactory.getLogger(ChatbotController.class);

    @Value("${chatbot.service.url:http://localhost:5001}")
    private String chatbotServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/chatbot")
    public ResponseEntity<?> chatbot(@RequestBody Map<String, Object> payload) {
        String userMessage = String.valueOf(payload.getOrDefault("message", "")).trim();

        if (userMessage.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("reply", "Please describe your symptoms or health question, including your age, how long it has been happening, and any medicines you already take.");
            return ResponseEntity.ok(err);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        String chatEndpoint = chatbotServiceUrl + "/api/chat";

        try {
            logger.info("Forwarding chatbot request to service at: {}", chatEndpoint);
            ResponseEntity<?> serviceResp = restTemplate.postForEntity(chatEndpoint, entity, Map.class);
            return ResponseEntity.ok(serviceResp.getBody());
        } catch (HttpStatusCodeException e) {
            logger.error("Chatbot service returned {}: {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            Map<String, String> err = new HashMap<>();
            err.put("reply", "The AI doctor service is temporarily having trouble communicating. Please check backend logs.");
            return ResponseEntity.ok(err);
        } catch (Exception e) {
            logger.error("Chatbot service request failed: {}", e.getMessage(), e);
            Map<String, String> err = new HashMap<>();
            err.put("reply", "The AI doctor service is temporarily unavailable. Please try again in a moment.");
            return ResponseEntity.ok(err);
        }
    }
}

