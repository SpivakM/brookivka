package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.LandmarkResponseDto;
import org.example.entity.Landmark;
import org.example.entity.LandmarkType;
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

        List<LandmarkResponseDto> dtos = landmarkRepository.findNearbyLandmarks(lat, lng, radius)
                .stream()
                .map(p -> LandmarkResponseDto.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .fullDescription(p.getFullDescription())
                        .architectureStyle(p.getArchitectureStyle())
                        .buildYear(p.getBuildYear())
                        .photoUrl(p.getPhotoUrl())
                        .category(p.getCategory())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .objectType(p.getObjectType() != null ? LandmarkType.valueOf(p.getObjectType()) : LandmarkType.BUILDING)
                        .distanceMeters(p.getDistanceMeters())
                        .bearingDegrees(p.getBearingDegrees())
                        .visibilityRadiusMeters(p.getVisibilityRadiusMeters())
                        .build())
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/s3-photos")
    public ResponseEntity<List<LandmarkMediaService.S3PhotoInfo>> getS3LandmarkPhotos() {
        return ResponseEntity.ok(landmarkMediaService.listAllS3LandmarkPhotos());
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
                .objectType(l.getObjectType())
                .visibilityRadiusMeters(l.getVisibilityRadiusMeters())
                .build();
    }
}