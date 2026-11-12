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
                        .fullDescription("""
                                Львівська ратуша — адміністративна будівля у центральній частині Львова (на площі Ринок).
                                Протягом усього часу свого існування — місце розташування львівського міського самоврядування.
                                Сучасна вежа львівської ратуші має висоту 65 метрів і є найвищою в Україні.
                                З оглядового майданчика відкривається панорамний вигляд на історичний центр міста.
                                """)
                        .architectureStyle("Неокласицизм")
                        .buildYear(1835)
                        .category("Архітектура")
                        .location(factory.createPoint(new Coordinate(24.0316, 49.8418)))
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
                        .location(factory.createPoint(new Coordinate(24.0263, 49.8440)))
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
                        .location(factory.createPoint(new Coordinate(24.0308, 49.8407)))
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
                        .location(factory.createPoint(new Coordinate(24.0311, 49.8407)))
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
                        .location(factory.createPoint(new Coordinate(24.0344, 49.8415)))
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
                        .location(factory.createPoint(new Coordinate(24.0269, 49.8379)))
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
                        .location(factory.createPoint(new Coordinate(24.0345, 49.8397)))
                        .build();

                repository.saveAll(List.of(
                        ratusha, opera, cathedral,
                        boimChapel, dominican, potockiPalace, bernardine
                ));
            }
        };
    }
}