package com.aarogyamitra.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiseaseSymptomResponse {
    private boolean success;
    private String disease;
    private double confidence;
    
    @JsonProperty("matched_symptoms")
    private String[] matchedSymptoms;
    
    @JsonProperty("unmatched_symptoms")
    private String[] unmatchedSymptoms;
    
    private String message;
    private String error;
}
