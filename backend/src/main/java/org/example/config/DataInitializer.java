package org.example.config;

import org.example.entity.Landmark;
import org.example.repository.LandmarkRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(LandmarkRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);

                Landmark ratusha = Landmark.builder()
                        .name("Львівська Ратуша")
                        .description("Адміністративна будівля в центрі Львова.")
                        .architectureStyle("Неокласицизм")
                        .buildYear(1835)
                        .category("Архітектура")
                        .location(factory.createPoint(new Coordinate(24.0316, 49.8418)))
                        .build();

                Landmark opera = Landmark.builder()
                        .name("Оперний Театр")
                        .description("Театр опери та балету імені Соломії Крушельницької.")
                        .architectureStyle("Неоренесанс")
                        .buildYear(1900)
                        .category("Культура")
                        .location(factory.createPoint(new Coordinate(24.0263, 49.8440)))
                        .build();

                Landmark cathedral = Landmark.builder()
                        .name("Латинський Катедральний Собор")
                        .description("Головний католицький храм Львова.")
                        .architectureStyle("Готика / Бароко")
                        .buildYear(1481)
                        .category("Релігія")
                        .location(factory.createPoint(new Coordinate(24.0308, 49.8407)))
                        .build();

                repository.saveAll(List.of(ratusha, opera, cathedral));
            }
        };
    }
}