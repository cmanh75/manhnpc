package com.manhnpc.guestbook.config;

import com.manhnpc.guestbook.model.GuestEntry;
import com.manhnpc.guestbook.repository.GuestEntryRepository;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedGuestbook(GuestEntryRepository entries) {
        return args -> {
            if (entries.count() > 0) {
                return;
            }
            entries.save(GuestEntry.builder()
                    .name("linh.dev")
                    .message("That globe is unreasonably smooth. Teach me your shader ways 🙏")
                    .emoji("🚀")
                    .createdAt(LocalDateTime.of(2026, 7, 20, 14, 12))
                    .build());
            entries.save(GuestEntry.builder()
                    .name("tuan_backend")
                    .message("Seven microservices for a personal site... respect. Absolutely unhinged. Respect.")
                    .emoji("🔥")
                    .createdAt(LocalDateTime.of(2026, 7, 22, 9, 41))
                    .build());
            entries.save(GuestEntry.builder()
                    .name("a stranger from HN")
                    .message("Got lost spinning the Earth for ten minutes. This is what the web should feel like.")
                    .emoji("🌏")
                    .createdAt(LocalDateTime.of(2026, 7, 25, 23, 5))
                    .build());
        };
    }
}
