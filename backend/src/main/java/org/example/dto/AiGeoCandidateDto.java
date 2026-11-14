package org.example.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiGeoCandidateDto {
    private Long landmarkId;
    private String name;
    private String objectType;
    private Double distanceMeters;
    private Double bearingDegrees;
    private Double visibilityRadiusMeters;
}