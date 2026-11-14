package org.example.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RecognitionMatchResponseDto {
    private String status;
    private String requestId;
    private LandmarkResponseDto matchedLandmark;
    private AiScoredCandidateDto bestMatch;
    private List<AiScoredCandidateDto> candidates;
    private Boolean detectionFallback;
    private String modelVersion;
    private Integer processingMs;
}