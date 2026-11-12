package org.example.dto;

public record AiChatRequestDto(
        String landmarkName,
        String context,
        String userMessage
) {}