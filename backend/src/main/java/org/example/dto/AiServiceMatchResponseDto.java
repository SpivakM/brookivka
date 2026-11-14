package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiServiceMatchResponseDto {
    private String status;
    private String requestId;
    private AiScoredCandidateDto bestMatch;
    private List<AiScoredCandidateDto> candidates;
    private Boolean detectionFallback;
    private String modelVersion;
    private Integer processingMs;
}