package org.example.controller;

import org.example.entity.User;
import org.example.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record RegisterRequest(String name, String email, String password) {}
    public record LoginRequest(String email, String password) {}
    public record UpdateProfileRequest(String name, String email, String newPassword) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Введіть ім'я — це поле обов'язкове"));
        }
        String trimmedName = request.name().trim();
        if (trimmedName.length() > 50) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Ім'я занадто довге (максимум 50 символів)"));
        }

        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Введіть електронну пошту — це поле обов'язкове"));
        }
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Некоректний формат пошти"));
        }

        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Введіть пароль — це поле обов'язкове"));
        }
        if (request.password().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Пароль занадто короткий (мінімум 6 символів)"));
        }
        if (request.password().length() > 100) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Пароль занадто довгий (максимум 100 символів)"));
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Акаунт із поштою " + normalizedEmail + " вже зареєстрований"));
        }

        String token = UUID.randomUUID().toString();
        User user = new User(
                trimmedName,
                normalizedEmail,
                hashPassword(request.password()),
                token
        );
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "user", formatUser(user)
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Введіть електронну пошту"));
        }
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Некоректний формат електронної пошти"));
        }

        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Введіть пароль"));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Користувача з поштою " + normalizedEmail + " не знайдено"));
        }

        User user = userOpt.get();
        if (!user.getPasswordHash().equals(hashPassword(request.password()))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Неправильний пароль для акаунта " + normalizedEmail));
        }

        String token = UUID.randomUUID().toString();
        user.setAuthToken(token);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", formatUser(user)
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Відсутній заголовок авторизації"));
        }

        return resolveUserByHeader(authHeader)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of("user", formatUser(user))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Сесія застаріла або токен недійсний — увійдіть повторно")));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UpdateProfileRequest request
    ) {
        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Відсутній токен авторизації — увійдіть у профіль"));
        }

        Optional<User> userOpt = resolveUserByHeader(authHeader);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Сесія недійсна або акаунт було видалено — увійдіть повторно"));
        }

        User user = userOpt.get();

        // Перевірка імені
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Ім'я не може бути порожнім"));
        }
        String trimmedName = request.name().trim();
        if (trimmedName.length() > 50) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Нове ім'я занадто довге (максимум 50 символів)"));
        }
        user.setName(trimmedName);

        // Перевірка нової пошти
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Електронна пошта не може бути порожньою"));
        }
        String newEmail = request.email().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(newEmail).matches()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Некоректний формат нової електронної пошти"));
        }
        if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(newEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Пошта " + newEmail + " вже використовується іншим користувачем"));
        }
        user.setEmail(newEmail);

        // Перевірка нового пароля (якщо користувач вирішив його змінити)
        if (request.newPassword() != null && !request.newPassword().isEmpty()) {
            if (request.newPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Новий пароль не може складатися лише з пробілів"));
            }
            if (request.newPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Новий пароль занадто короткий (мінімум 6 символів)"));
            }
            if (request.newPassword().length() > 100) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Новий пароль занадто довгий (максимум 100 символів)"));
            }
            String newHash = hashPassword(request.newPassword());
            if (newHash.equals(user.getPasswordHash())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Новий пароль збігається з поточним — введіть інший"));
            }
            user.setPasswordHash(newHash);
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Профіль успішно оновлено",
                "user", formatUser(user)
        ));
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteAccount(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Відсутній токен авторизації для видалення профілю"));
        }

        Optional<User> userOpt = resolveUserByHeader(authHeader);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Акаунт не знайдено"));
        }

        userRepository.delete(userOpt.get());
        return ResponseEntity.ok(Map.of("message", "Акаунт остаточно видалено"));
    }

    private Optional<User> resolveUserByHeader(String authHeader) {
        if (!authHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByAuthToken(token);
    }

    private Map<String, Object> formatUser(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()
        );
    }

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}