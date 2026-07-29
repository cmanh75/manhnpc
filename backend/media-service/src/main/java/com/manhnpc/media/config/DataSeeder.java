package com.manhnpc.media.config;

import com.manhnpc.media.model.Photo;
import com.manhnpc.media.model.Video;
import com.manhnpc.media.repository.PhotoRepository;
import com.manhnpc.media.repository.VideoRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedMedia(PhotoRepository photos, VideoRepository videos) {
        return args -> {
            if (photos.count() == 0) {
                photos.saveAll(List.of(
                        photo("Sunrise over Hoan Kiem Lake", "Morning mist over the Turtle Tower before the city wakes up.",
                                "hanoi-hoankiem", "travel", "Hanoi, Vietnam", LocalDate.of(2024, 3, 12), 1200, 800, true),
                        photo("Bún chả alley lunch", "The kind of lunch that ruins every other lunch for you.",
                                "hanoi-buncha", "food", "Hanoi, Vietnam", LocalDate.of(2024, 4, 2), 1000, 1000, false),
                        photo("Golden Bridge hands", "The giant stone hands holding the bridge above Ba Na Hills.",
                                "danang-goldenbridge", "travel", "Da Nang, Vietnam", LocalDate.of(2023, 7, 21), 1200, 800, true),
                        photo("My Khe beach run", "5km barefoot before the sun got serious.",
                                "danang-mykhe", "life", "Da Nang, Vietnam", LocalDate.of(2023, 7, 22), 800, 1200, false),
                        photo("Shibuya crossing at night", "Organized chaos, neon edition.",
                                "tokyo-shibuya", "travel", "Tokyo, Japan", LocalDate.of(2025, 4, 8), 1200, 800, true),
                        photo("7am ramen in Shinjuku", "Jet lag has its perks: first in line at the counter.",
                                "tokyo-ramen", "food", "Tokyo, Japan", LocalDate.of(2025, 4, 9), 1000, 1000, false),
                        photo("Bukchon hanok rooftops", "Traditional roofs with the Seoul skyline photobombing behind.",
                                "seoul-bukchon", "travel", "Seoul, South Korea", LocalDate.of(2024, 10, 15), 800, 1200, false),
                        photo("Gwangjang market bindaetteok", "Mung bean pancakes fried in front of you. Zero regrets.",
                                "seoul-gwangjang", "food", "Seoul, South Korea", LocalDate.of(2024, 10, 16), 1200, 800, false),
                        photo("Supertree Grove after dark", "Gardens by the Bay light show from the ground up.",
                                "singapore-supertree", "travel", "Singapore", LocalDate.of(2023, 11, 3), 800, 1200, true),
                        photo("Hawker centre chicken rice", "Michelin-starred food at food-court prices.",
                                "singapore-hawker", "food", "Singapore", LocalDate.of(2023, 11, 4), 1000, 1000, false),
                        photo("Wat Arun at golden hour", "Temple of Dawn actually best at dusk. Don't tell anyone.",
                                "bangkok-watarun", "travel", "Bangkok, Thailand", LocalDate.of(2022, 12, 18), 1200, 800, false),
                        photo("Boat noodles by the khlong", "Tiny bowls, big flavor, questionable seating stability.",
                                "bangkok-boatnoodles", "food", "Bangkok, Thailand", LocalDate.of(2022, 12, 19), 1000, 1000, false),
                        photo("Eiffel Tower from Trocadéro", "Cliché? Yes. Worth the 6am alarm? Also yes.",
                                "paris-eiffel", "travel", "Paris, France", LocalDate.of(2025, 9, 27), 800, 1200, true),
                        photo("Opera House ferry view", "Best angle of the sails is from the Manly ferry, for the price of a ferry ticket.",
                                "sydney-opera", "travel", "Sydney, Australia", LocalDate.of(2026, 1, 15), 1200, 800, false),
                        photo("Late night deploy station", "Two monitors, one terminal, zero bugs (allegedly).",
                                "desk-setup", "code", "Hanoi, Vietnam", LocalDate.of(2025, 6, 30), 1200, 800, false),
                        photo("Whiteboard architecture session", "The microservices diagram that started this whole website.",
                                "whiteboard-arch", "code", "Hanoi, Vietnam", LocalDate.of(2025, 8, 11), 1000, 1000, false)));
            }

            if (videos.count() == 0) {
                videos.saveAll(List.of(
                        video("Hanoi street food crawl",
                                "One evening, five stalls, no survivors. A tour through the Old Quarter's best bites.",
                                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                                "video-hanoi-food", 596, "food", LocalDateTime.of(2025, 5, 20, 19, 0)),
                        video("Da Nang drone reel",
                                "Coastline, bridges and Marble Mountains from above.",
                                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                                "video-danang-drone", 15, "travel", LocalDateTime.of(2024, 8, 2, 10, 30)),
                        video("Building this site: timelapse",
                                "Six microservices, one weekend, too much coffee. Coding timelapse.",
                                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                                "video-coding-timelapse", 888, "code", LocalDateTime.of(2026, 2, 14, 22, 45)),
                        video("Tokyo in 60 seconds",
                                "A minute of neon, trains and vending machines.",
                                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                                "video-tokyo-60s", 734, "travel", LocalDateTime.of(2025, 4, 12, 8, 15))));
            }
        };
    }

    private static Photo photo(String title, String description, String seed, String category,
                               String location, LocalDate takenAt, int width, int height, boolean featured) {
        String url = "https://picsum.photos/seed/" + seed + "/" + width + "/" + height;
        String thumb = "https://picsum.photos/seed/" + seed + "/" + (width / 3) + "/" + (height / 3);
        return Photo.builder()
                .title(title)
                .description(description)
                .url(url)
                .thumbnailUrl(thumb)
                .category(category)
                .location(location)
                .takenAt(takenAt)
                .width(width)
                .height(height)
                .featured(featured)
                .build();
    }

    private static Video video(String title, String description, String url, String thumbSeed,
                               int durationSeconds, String category, LocalDateTime createdAt) {
        return Video.builder()
                .title(title)
                .description(description)
                .url(url)
                .thumbnailUrl("https://picsum.photos/seed/" + thumbSeed + "/640/360")
                .durationSeconds(durationSeconds)
                .category(category)
                .createdAt(createdAt)
                .build();
    }
}
