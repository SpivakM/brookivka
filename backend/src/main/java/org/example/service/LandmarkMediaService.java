package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.Landmark;
import org.example.repository.LandmarkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LandmarkMediaService {

    public record S3PhotoInfo(Long landmarkId, String key, String photoUrl) {
    }

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final S3Client s3Client;
    private final LandmarkRepository landmarkRepository;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.cdn.base-url}")
    private String cdnBaseUrl;

    @Transactional
    public Landmark uploadLandmarkPhoto(Long landmarkId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл не передано або він порожній");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.containsKey(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Дозволені лише зображення JPEG, PNG або WebP");
        }

        Landmark landmark = landmarkRepository.findById(landmarkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пам'ятку не знайдено"));

        String cleanCdnBase = normalizeBaseUrl(cdnBaseUrl);
        String extension = ALLOWED_CONTENT_TYPES.get(contentType);
        String key = "landmarks/" + landmarkId + "/" + UUID.randomUUID() + extension;

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .cacheControl("public, max-age=31536000")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Помилка читання файлу", e);
        }

        String photoUrl = cleanCdnBase + "/" + key;
        if (landmark.getPhotoUrls() == null) {
            landmark.setPhotoUrls(new ArrayList<>());
        }
        landmark.getPhotoUrls().add(photoUrl);

        return landmarkRepository.save(landmark);
    }

    @Transactional
    public Landmark deleteLandmarkPhoto(Long landmarkId, String photoUrlToDelete) {
        Landmark landmark = landmarkRepository.findById(landmarkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пам'ятку не знайдено"));

        List<String> photos = landmark.getPhotoUrls();
        if (photos == null || photos.isEmpty()) {
            return landmark;
        }

        String cleanCdnBase = normalizeBaseUrl(cdnBaseUrl);

        if (photoUrlToDelete != null && !photoUrlToDelete.isBlank()) {
            boolean removed = photos.remove(photoUrlToDelete);
            if (!removed) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Вказане фото не знайдено у цієї пам'ятки");
            }
            if (photoUrlToDelete.startsWith(cleanCdnBase + "/")) {
                String key = photoUrlToDelete.substring((cleanCdnBase + "/").length());
                deleteFromS3Quietly(key);
            }
        } else {
            for (String url : photos) {
                if (url != null && url.startsWith(cleanCdnBase + "/")) {
                    String key = url.substring((cleanCdnBase + "/").length());
                    deleteFromS3Quietly(key);
                }
            }
            photos.clear();
        }

        return landmarkRepository.save(landmark);
    }

    @Transactional
    public List<S3PhotoInfo> listAllS3LandmarkPhotos() {
        String cleanCdnBase = normalizeBaseUrl(cdnBaseUrl);
        ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix("landmarks/")
                .build();

        ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);
        List<S3PhotoInfo> result = new ArrayList<>();
        Map<Long, String> firstPhotoByLandmark = new HashMap<>();

        for (S3Object obj : listRes.contents()) {
            String key = obj.key();
            if (key == null || key.endsWith("/")) {
                continue;
            }
            String[] parts = key.split("/");
            if (parts.length < 3) {
                continue;
            }
            try {
                Long landmarkId = Long.parseLong(parts[1]);
                String fullUrl = cleanCdnBase + "/" + key;
                result.add(new S3PhotoInfo(landmarkId, key, fullUrl));
                firstPhotoByLandmark.putIfAbsent(landmarkId, fullUrl);
            } catch (NumberFormatException ignored) {
            }
        }

        for (Map.Entry<Long, String> entry : firstPhotoByLandmark.entrySet()) {
            Optional<Landmark> opt = landmarkRepository.findById(entry.getKey());
            if (opt.isPresent()) {
                Landmark landmark = opt.get();
                if (landmark.getPhotoUrl() == null || landmark.getPhotoUrl().isBlank()) {
                    landmark.setPhotoUrl(entry.getValue());
                    landmarkRepository.save(landmark);
                }
            }
        }

        return result;
    }

    private void deleteFromS3Quietly(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("Не вдалося видалити об'єкт із S3 ({}): {}", key, e.getMessage());
        }
    }

    private String normalizeBaseUrl(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}