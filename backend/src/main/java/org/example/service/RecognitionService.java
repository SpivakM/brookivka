package org.example.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.*;
import org.example.entity.Landmark;
import org.example.entity.LandmarkType;
import org.example.repository.LandmarkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecognitionService {

    private final LandmarkRepository landmarkRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai-service.url:http://localhost:8090}")
    private String aiServiceUrl;

    @Value("${ai-service.search-radius-meters:150.0}")
    private double defaultSearchRadiusMeters;

    public RecognitionMatchResponseDto recognizeLandmark(
            MultipartFile image,
            double latitude,
            double longitude,
            Double gpsAccuracyMeters,
            Double headingDegrees,
            Double headingAccuracy
    ) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (latitude < -90.0 || latitude > 90.0 || longitude < -180.0 || longitude > 180.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid GPS coordinates");
        }

        // Розширюємо радіус пошуку на величину GPS-похибки (але не більше +100м)
        double accuracyBuffer = (gpsAccuracyMeters != null && gpsAccuracyMeters > 0)
                ? Math.min(gpsAccuracyMeters, 100.0)
                : 0.0;
        double effectiveRadius = defaultSearchRadiusMeters + accuracyBuffer;

        List<LandmarkRepository.NearbyLandmarkProjection> nearbyProjections =
                landmarkRepository.findNearbyLandmarks(latitude, longitude, effectiveRadius);

        // Якщо поруч взагалі немає зареєстрованих пам'яток — не викликаємо AI-сервіс
        if (nearbyProjections.isEmpty()) {
            return RecognitionMatchResponseDto.builder()
                    .status("NOT_FOUND")
                    .requestId(UUID.randomUUID().toString())
                    .matchedLandmark(null)
                    .bestMatch(null)
                    .candidates(Collections.emptyList())
                    .detectionFallback(false)
                    .modelVersion("none")
                    .processingMs(0)
                    .build();
        }

        List<AiGeoCandidateDto> geoCandidates = nearbyProjections.stream()
                .map(p -> AiGeoCandidateDto.builder()
                        .landmarkId(p.getId())
                        .name(p.getName())
                        .objectType(p.getObjectType() != null ? p.getObjectType() : "BUILDING")
                        .distanceMeters(p.getDistanceMeters())
                        .bearingDegrees(p.getBearingDegrees())
                        .visibilityRadiusMeters(p.getVisibilityRadiusMeters())
                        .build())
                .toList();

        AiServiceMatchResponseDto aiResponse = callAiService(
                image, latitude, longitude, geoCandidates, gpsAccuracyMeters, headingDegrees, headingAccuracy
        );

        LandmarkResponseDto matchedLandmarkDto = null;
        if (aiResponse.getBestMatch() != null
                && ("MATCHED".equals(aiResponse.getStatus()) || "UNCERTAIN".equals(aiResponse.getStatus()))) {
            Long bestId = aiResponse.getBestMatch().getLandmarkId();
            matchedLandmarkDto = landmarkRepository.findById(bestId)
                    .map(l -> toLandmarkDto(l, aiResponse.getBestMatch()))
                    .orElse(null);
        }

        return RecognitionMatchResponseDto.builder()
                .status(aiResponse.getStatus())
                .requestId(aiResponse.getRequestId())
                .matchedLandmark(matchedLandmarkDto)
                .bestMatch(aiResponse.getBestMatch())
                .candidates(aiResponse.getCandidates() != null ? aiResponse.getCandidates() : Collections.emptyList())
                .detectionFallback(aiResponse.getDetectionFallback())
                .modelVersion(aiResponse.getModelVersion())
                .processingMs(aiResponse.getProcessingMs())
                .build();
    }

    private AiServiceMatchResponseDto callAiService(
            MultipartFile image,
            double latitude,
            double longitude,
            List<AiGeoCandidateDto> geoCandidates,
            Double gpsAccuracyMeters,
            Double headingDegrees,
            Double headingAccuracy
    ) {
        try {
            String candidatesJson = objectMapper.writeValueAsString(geoCandidates);
            byte[] imageBytes = image.getBytes();
            String filename = image.getOriginalFilename() != null ? image.getOriginalFilename() : "frame.jpg";

            ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", fileResource);
            body.add("latitude", String.valueOf(latitude));
            body.add("longitude", String.valueOf(longitude));
            body.add("candidatesJson", candidatesJson);
            if (gpsAccuracyMeters != null) {
                body.add("gpsAccuracyMeters", String.valueOf(gpsAccuracyMeters));
            }
            if (headingDegrees != null) {
                body.add("headingDegrees", String.valueOf(headingDegrees));
            }
            if (headingAccuracy != null) {
                body.add("headingAccuracy", String.valueOf(headingAccuracy));
            }

            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(3));
            requestFactory.setReadTimeout(Duration.ofSeconds(10));

            RestClient restClient = RestClient.builder()
                    .baseUrl(aiServiceUrl)
                    .requestFactory(requestFactory)
                    .build();

            AiServiceMatchResponseDto response = restClient.post()
                    .uri("/recognition/match")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiServiceMatchResponseDto.class);

            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from AI service");
            }
            return response;

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize candidatesJson", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to prepare AI request");
        } catch (IOException e) {
            log.error("Failed to read uploaded image bytes", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image");
        } catch (Exception e) {
            log.error("AI recognition service call failed: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI recognition service is unavailable");
        }
    }

    private LandmarkResponseDto toLandmarkDto(Landmark l, AiScoredCandidateDto scored) {
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
                .objectType(l.getObjectType() != null ? l.getObjectType() : LandmarkType.BUILDING)
                .distanceMeters(scored.getDistanceMeters())
                .bearingDegrees(scored.getBearingDegrees())
                .visibilityRadiusMeters(l.getVisibilityRadiusMeters())
                .build();
    }
}