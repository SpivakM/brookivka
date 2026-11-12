package org.example.controller;

import org.example.dto.AiChatRequestDto;
import org.example.dto.AiChatResponseDto;
import org.example.service.GroqGuideService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-guide")
@CrossOrigin(origins = "*")
public class AiGuideController {

    private final GroqGuideService groqGuideService;

    public AiGuideController(GroqGuideService groqGuideService) {
        this.groqGuideService = groqGuideService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponseDto> chat(@RequestBody AiChatRequestDto request) {
        String reply = groqGuideService.askGuide(request);
        return ResponseEntity.ok(new AiChatResponseDto(reply));
    }
}