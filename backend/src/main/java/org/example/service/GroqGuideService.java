package org.example.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.AiChatRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@Service
public class GroqGuideService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.api.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String askGuide(AiChatRequestDto request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY не налаштовано!");
        }

        String systemPrompt = String.format(
                "Ти — харизматичний, живий екскурсовод Львовом у мобільному додатку Brookivka. " +
                        "Твоя задача — цікаво та лаконічно (3-5 речень) відповідати туристу українською мовою. " +
                        "Пам'ятка: %s. Базовий опис із бази: %s.",
                request.landmarkName(),
                request.context() != null ? request.context() : "інформація уточнюється"
        );

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", request.userMessage())
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        var entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText("Вибачте, не вдалося сформувати відповідь.");
        } catch (Exception e) {
            e.printStackTrace();
            return "Зараз гід трохи задумався. Спробуйте запитати ще раз за мить!";
        }
    }
}