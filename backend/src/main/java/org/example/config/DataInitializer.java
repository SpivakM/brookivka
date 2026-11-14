package org.example.config;

import org.example.entity.Landmark;
import org.example.entity.LandmarkType;
import org.example.repository.LandmarkRepository;
import org.locationtech.jts.geom.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    private MultiPolygon createBoxFootprint(GeometryFactory factory, double lon, double lat, double halfWidthDeg, double halfHeightDeg) {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(lon - halfWidthDeg, lat - halfHeightDeg),
                new Coordinate(lon + halfWidthDeg, lat - halfHeightDeg),
                new Coordinate(lon + halfWidthDeg, lat + halfHeightDeg),
                new Coordinate(lon - halfWidthDeg, lat + halfHeightDeg),
                new Coordinate(lon - halfWidthDeg, lat - halfHeightDeg)
        };
        Polygon polygon = factory.createPolygon(coords);
        return factory.createMultiPolygon(new Polygon[]{polygon});
    }

    @Bean
    public CommandLineRunner initDatabase(LandmarkRepository repository) {
        return args -> {
            GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);

            if (repository.count() == 0) {
                Landmark ratusha = Landmark.builder()
                        .name("Львівська Ратуша")
                        .description("Адміністративна будівля в центрі Львова.")
                        .fullDescription("""
                                Львівська ратуша — адміністративна будівля у центральній частині Львова (на площі Ринок).
                                Протягом усього часу свого існування — місце розташування львівського міського самоврядування.
                                Сучасна вежа львівської ратуші має висоту 65 метрів і є найвищою в Україні.
                                З оглядового майданчика відкривається панорамний вигляд на історичний центр міста.
                                """)
                        .architectureStyle("Неокласицизм")
                        .buildYear(1835)
                        .category("Архітектура")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0316, 49.8418)))
                        .footprint(createBoxFootprint(factory, 24.0316, 49.8418, 0.00045, 0.00035))
                        .visibilityRadiusMeters(150.0)
                        .active(true)
                        .build();

                Landmark opera = Landmark.builder()
                        .name("Оперний Театр")
                        .description("Театр опери та балету імені Соломії Крушельницької.")
                        .fullDescription("""
                                Львівський національний академічний театр опери та балету імені Соломії Крушельницької.
                                Збудований наприкінці XIX століття за проєктом архітектора Зигмунта Ґорґолевського.
                                Споруда виконана у стилі неоренесансу та необароко, прикрашена багатим скульптурним декором.
                                """)
                        .architectureStyle("Неоренесанс")
                        .buildYear(1900)
                        .category("Культура")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0263, 49.8440)))
                        .footprint(createBoxFootprint(factory, 24.0263, 49.8440, 0.00040, 0.00050))
                        .visibilityRadiusMeters(180.0)
                        .active(true)
                        .build();

                Landmark cathedral = Landmark.builder()
                        .name("Латинський Катедральний Собор")
                        .description("Головний католицький храм Львова.")
                        .fullDescription("""
                                Архікатедральна базиліка Успіння Пресвятої Діви Марії — головний римсько-католицький храм України.
                                Будівництво розпочалося у другій половині XIV століття і тривало понад століття.
                                Собор поєднує в собі риси готики, бароко та ренесансу, відомий своїми унікальними каплицями.
                                """)
                        .architectureStyle("Готика / Бароко")
                        .buildYear(1481)
                        .category("Релігія")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0308, 49.8407)))
                        .footprint(createBoxFootprint(factory, 24.0308, 49.8407, 0.00042, 0.00025))
                        .visibilityRadiusMeters(120.0)
                        .active(true)
                        .build();

                Landmark boimChapel = Landmark.builder()
                        .name("Каплиця Боїмів")
                        .description("Знаменита пам'ятка сакральної архітектури поруч із Латинським собором.")
                        .fullDescription("""
                                Каплиця Боїмів — унікальна пам'ятка пізнього ренесансу (маньєризму), збудована як родинна усипальниця купецького роду Боїмів.
                                Західний фасад каплиці повністю вкритий вишуковим кам'яним різьбленням на біблійні сюжети.
                                Купол споруди увінчаний рідкісною скульптурою Христа, який сидить у тузі (Скорботний Христос).
                                """)
                        .architectureStyle("Ренесанс / Маньєризм")
                        .buildYear(1615)
                        .category("Релігія / Архітектура")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0311, 49.8407)))
                        .visibilityRadiusMeters(80.0)
                        .active(true)
                        .build();

                Landmark dominican = Landmark.builder()
                        .name("Домініканський Собор")
                        .description("Величний бароковий костел із масивним еліптичним куполом.")
                        .fullDescription("""
                                Церква Пресвятого Євхаристії (колишній костел Божого Тіла монастиря домініканців) — одна з найзначніших пам'яток бароко у Львові.
                                Монументальний фасад прикрашений гаслом «SOLI DEO HONOR ET GLORIA» («Єдиному Богу честь і слава»).
                                Інтер'єр вражає потужною еліптичною банею, яку підтримують 18 дерев'яних позолочених скульптур святих.
                                """)
                        .architectureStyle("Бароко")
                        .buildYear(1759)
                        .category("Релігія")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0344, 49.8415)))
                        .visibilityRadiusMeters(120.0)
                        .active(true)
                        .build();

                Landmark potockiPalace = Landmark.builder()
                        .name("Палац Потоцьких")
                        .description("Розкішний французький палац кінця XIX століття.")
                        .fullDescription("""
                                Палац графів Потоцьких — яскравий зразок архітектури зрілого історизму та французького неокласицизму.
                                Збудований за проєктом французького архітектора Луї д'Оверня на замовлення графа Альфреда II Потоцького.
                                Сьогодні тут розташована картинна галерея, а подвір'я палацу є популярним місцем для проведення мистецьких фестивалів.
                                """)
                        .architectureStyle("Неокласицизм / Французьке Бароко")
                        .buildYear(1880)
                        .category("Архітектура / Культура")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0269, 49.8379)))
                        .footprint(createBoxFootprint(factory, 24.0269, 49.8379, 0.00045, 0.00030))
                        .visibilityRadiusMeters(140.0)
                        .active(true)
                        .build();

                Landmark bernardine = Landmark.builder()
                        .name("Бернардинський Монастир")
                        .description("Оборонний монастирський комплекс із розкішним бароковим інтер'єром.")
                        .fullDescription("""
                                Комплекс монастиря бернардинів (нині церква Святого Андрія) у давнину розташовувався за межами міських стін і мав власну систему оборони.
                                Архітектура собору поєднує маньєризм та італійсько-нідерландський ренесанс.
                                Інтер'єр комплексу славиться багатими розписами стін, різбленими вівтарями та старовинним органом.
                                """)
                        .architectureStyle("Ренесанс / Бароко")
                        .buildYear(1630)
                        .category("Релігія / Оборонна архітектура")
                        .objectType(LandmarkType.BUILDING)
                        .location(factory.createPoint(new Coordinate(24.0345, 49.8397)))
                        .visibilityRadiusMeters(130.0)
                        .active(true)
                        .build();

                repository.saveAll(List.of(
                        ratusha, opera, cathedral,
                        boimChapel, dominican, potockiPalace, bernardine
                ));
            } else {
                // Якщо база вже існувала до цього оновлення — заповнюємо дефолтні поля та полігони
                List<Landmark> existing = repository.findAll();
                for (Landmark l : existing) {
                    if (l.getObjectType() == null) l.setObjectType(LandmarkType.BUILDING);
                    if (l.getActive() == null) l.setActive(true);
                    if (l.getVisibilityRadiusMeters() == null) l.setVisibilityRadiusMeters(100.0);
                    if (l.getFootprint() == null && l.getLocation() != null) {
                        double lon = l.getLocation().getX();
                        double lat = l.getLocation().getY();
                        if ("Львівська Ратуша".equals(l.getName())) {
                            l.setFootprint(createBoxFootprint(factory, lon, lat, 0.00045, 0.00035));
                        } else if ("Оперний Театр".equals(l.getName())) {
                            l.setFootprint(createBoxFootprint(factory, lon, lat, 0.00040, 0.00050));
                        } else if ("Латинський Катедральний Собор".equals(l.getName())) {
                            l.setFootprint(createBoxFootprint(factory, lon, lat, 0.00042, 0.00025));
                        }
                    }
                }
                repository.saveAll(existing);
            }
        };
    }
}