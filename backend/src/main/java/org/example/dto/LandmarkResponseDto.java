package org.example.dto;

import lombok.Builder;
import lombok.Data;
import org.example.entity.LandmarkType;

import java.util.List;

@Data
@Builder
public class LandmarkResponseDto {
    private Long id;
    private String name;
    private String description;
    private String fullDescription;
    private String architectureStyle;
    private Integer buildYear;
    private String photoUrl;
    private List<String> photoUrls;
    private String category;
    private double latitude;
    private double longitude;

    private LandmarkType objectType;
    private Double distanceMeters;
    private Double bearingDegrees;
    private Double visibilityRadiusMeters;
}