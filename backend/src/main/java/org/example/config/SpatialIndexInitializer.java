package org.example.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpatialIndexInitializer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void createSpatialIndexes() {
        try {
            jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_landmarks_location_gist
                ON landmarks USING GIST (location)
            """);
            jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_landmarks_footprint_gist
                ON landmarks USING GIST (footprint)
            """);
            log.info("PostGIS GiST spatial indexes verified/created successfully.");
        } catch (Exception e) {
            log.warn("Could not create PostGIS spatial indexes automatically: {}", e.getMessage());
        }
    }
}