package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiScoredCandidateDto {
    private Long landmarkId;
    private String name;
    private Double score;
    private Double visualScore;
    private Double geoScore;
    private Double headingScore;
    private Double distanceMeters;
    private Double bearingDegrees;
    private String objectType;
    private String matchedViewId;
}