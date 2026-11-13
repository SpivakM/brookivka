package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.LandmarkResponseDto;
import org.example.entity.Landmark;
import org.example.repository.LandmarkRepository;
import org.example.service.LandmarkMediaService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/landmarks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LandmarkController {

    private final LandmarkRepository landmarkRepository;
    private final LandmarkMediaService landmarkMediaService;

    @GetMapping("/nearby")
    public ResponseEntity<List<LandmarkResponseDto>> getNearbyLandmarks(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "500") double radius) {

        List<Landmark> landmarks = landmarkRepository.findNearbyLandmarks(lat, lng, radius);
        List<LandmarkResponseDto> dtos = landmarks.stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LandmarkResponseDto> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        Landmark updated = landmarkMediaService.uploadLandmarkPhoto(id, file);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        landmarkMediaService.deleteLandmarkPhoto(id);
        return ResponseEntity.noContent().build();
    }

    private LandmarkResponseDto toDto(Landmark l) {
        return LandmarkResponseDto.builder()
                .id(l.getId())
                .name(l.getName())
                .description(l.getDescription())
                .fullDescription(l.getFullDescription())
                .architectureStyle(l.getArchitectureStyle())
                .buildYear(l.getBuildYear())
                .photoUrl(l.getPhotoUrl())
                .category(l.getCategory())
                .latitude(l.getLocation().getY())
                .longitude(l.getLocation().getX())
                .build();
    }
}