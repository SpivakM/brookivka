package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.RecognitionMatchResponseDto;
import org.example.service.RecognitionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/recognition")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RecognitionController {

    private final RecognitionService recognitionService;

    @PostMapping(value = "/match", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecognitionMatchResponseDto> matchLandmark(
            @RequestParam("image") MultipartFile image,
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam(value = "gpsAccuracyMeters", required = false) Double gpsAccuracyMeters,
            @RequestParam(value = "headingDegrees", required = false) Double headingDegrees,
            @RequestParam(value = "headingAccuracy", required = false) Double headingAccuracy
    ) {
        RecognitionMatchResponseDto result = recognitionService.recognizeLandmark(
                image,
                latitude,
                longitude,
                gpsAccuracyMeters,
                headingDegrees,
                headingAccuracy
        );
        return ResponseEntity.ok(result);
    }
}