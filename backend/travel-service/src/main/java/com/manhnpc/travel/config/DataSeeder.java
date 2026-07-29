package com.manhnpc.travel.config;

import com.manhnpc.travel.model.VisitedPlace;
import com.manhnpc.travel.repository.VisitedPlaceRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedPlaces(VisitedPlaceRepository places) {
        return args -> {
            if (places.count() > 0) {
                return;
            }
            places.saveAll(List.of(
                    place("Hanoi", "Vietnam", "VN", 21.0285, 105.8542, LocalDate.of(2019, 1, 1),
                            "Home base. Every trip starts and ends with a bowl of phở here.",
                            "Home is where the phở is", "#22d3ee", 120, 5),
                    place("Ho Chi Minh City", "Vietnam", "VN", 10.8231, 106.6297, LocalDate.of(2019, 6, 14),
                            "The southern engine of Vietnam — chaotic, caffeinated, and always awake.",
                            "Cà phê sữa đá on every corner", "#a78bfa", 34, 4),
                    place("Da Nang", "Vietnam", "VN", 16.0544, 108.2022, LocalDate.of(2020, 7, 20),
                            "Beaches, bridges and the Marble Mountains. My favorite escape from Hanoi winters.",
                            "Watched the Dragon Bridge breathe fire", "#f472b6", 58, 5),
                    place("Sa Pa", "Vietnam", "VN", 22.3364, 103.8438, LocalDate.of(2021, 11, 5),
                            "Rice terraces stacked into the clouds. Cold, misty, unforgettable trekking.",
                            "Sunrise above a sea of clouds on Fansipan", "#34d399", 42, 5),
                    place("Bangkok", "Thailand", "TH", 13.7563, 100.5018, LocalDate.of(2022, 12, 17),
                            "First international trip after the pandemic. Temples by day, street food by night.",
                            "Ate the best boat noodles of my life", "#fbbf24", 27, 4),
                    place("Singapore", "Singapore", "SG", 1.3521, 103.8198, LocalDate.of(2023, 11, 2),
                            "A city that runs like a well-tuned CI pipeline. Hawker centres are the real attraction.",
                            "Chicken rice worth a Michelin star", "#22d3ee", 31, 4),
                    place("Kuala Lumpur", "Malaysia", "MY", 3.1390, 101.6869, LocalDate.of(2024, 3, 8),
                            "Petronas Towers, mamak stalls at 2am, and the best roti canai I've found.",
                            "Teh tarik pulled two meters through the air", "#a78bfa", 19, 4),
                    place("Seoul", "South Korea", "KR", 37.5665, 126.9780, LocalDate.of(2024, 10, 14),
                            "Autumn in Seoul: palaces in golden leaves and BBQ that ruins all other BBQ.",
                            "Korean BBQ until they asked us to leave", "#f472b6", 45, 5),
                    place("Tokyo", "Japan", "JP", 35.6762, 139.6503, LocalDate.of(2025, 4, 7),
                            "Cherry blossom season. Everything is precise, everything is delicious.",
                            "Hanami under full-bloom sakura in Ueno", "#34d399", 63, 5),
                    place("Bali", "Indonesia", "ID", -8.3405, 115.0920, LocalDate.of(2025, 6, 21),
                            "Remote-work week that was 20% work, 80% rice terraces and beach sunsets.",
                            "Deployed to prod from a beach café", "#fbbf24", 38, 4),
                    place("Paris", "France", "FR", 48.8566, 2.3522, LocalDate.of(2025, 9, 26),
                            "First time in Europe. Museums by day, baguette-based survival strategy throughout.",
                            "Sunrise at Trocadéro, croissant count: 14", "#22d3ee", 52, 5),
                    place("Sydney", "Australia", "AU", -33.8688, 151.2093, LocalDate.of(2026, 1, 14),
                            "Southern-hemisphere summer in January — the ultimate Hanoi winter hack.",
                            "New Year swim at Bondi Beach", "#a78bfa", 29, 4)));
        };
    }

    private static VisitedPlace place(String name, String country, String countryCode,
                                      double lat, double lng, LocalDate visitedAt,
                                      String description, String highlight, String color,
                                      int photosCount, int rating) {
        return VisitedPlace.builder()
                .name(name)
                .country(country)
                .countryCode(countryCode)
                .lat(lat)
                .lng(lng)
                .visitedAt(visitedAt)
                .description(description)
                .highlight(highlight)
                .color(color)
                .photosCount(photosCount)
                .rating(rating)
                .build();
    }
}
