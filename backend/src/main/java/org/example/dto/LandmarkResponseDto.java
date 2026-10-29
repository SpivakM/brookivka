package org.example.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LandmarkResponseDto {
    private Long id;
    private String name;
    private String description;
    private String architectureStyle;
    private Integer buildYear;
    private String photoUrl;
    private String category;
    private double latitude;
    private double longitude;
}