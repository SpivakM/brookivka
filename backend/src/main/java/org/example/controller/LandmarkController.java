package org.example.controller;

import org.example.dto.LandmarkResponseDto;
import org.example.entity.Landmark;
import org.example.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/landmarks")
@RequiredArgsConstructor
public class LandmarkController {

    private final LandmarkRepository landmarkRepository;

    @GetMapping("/nearby")
    public ResponseEntity<List<LandmarkResponseDto>> getNearbyLandmarks(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "500") double radius) {

        // Передаємо чисті lat, lng та radius у метрах прямо у PostGIS
        List<Landmark> landmarks = landmarkRepository.findNearbyLandmarks(lat, lng, radius);

        List<LandmarkResponseDto> dtos = landmarks.stream().map(l -> LandmarkResponseDto.builder()
                .id(l.getId())
                .name(l.getName())
                .description(l.getDescription())
                .architectureStyle(l.getArchitectureStyle())
                .buildYear(l.getBuildYear())
                .photoUrl(l.getPhotoUrl())
                .category(l.getCategory())
                .latitude(l.getLocation().getY())
                .longitude(l.getLocation().getX())
                .build()
        ).toList();

        return ResponseEntity.ok(dtos);
    }
}