package com.manhnpc.guestbook.web;

import com.manhnpc.guestbook.model.GuestEntry;
import com.manhnpc.guestbook.repository.GuestEntryRepository;
import com.manhnpc.common.web.error.BadRequestException;
import com.manhnpc.common.web.error.NotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guestbook")
public class GuestbookController {

    public record NewEntry(String name, String message, String emoji) {
    }

    private final GuestEntryRepository entries;

    public GuestbookController(GuestEntryRepository entries) {
        this.entries = entries;
    }

    @GetMapping
    public List<GuestEntry> list() {
        return entries.findTop200ByOrderByCreatedAtDesc();
    }

    /** Public — visitors sign without an account. Validation keeps it civil-ish. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GuestEntry sign(@RequestBody NewEntry entry) {
        String message = entry.message() == null ? "" : entry.message().trim();
        if (message.isEmpty()) {
            throw new BadRequestException("Message must not be empty");
        }
        if (message.length() > 500) {
            throw new BadRequestException("Message is limited to 500 characters");
        }
        String name = entry.name() == null || entry.name().isBlank()
                ? "anonymous traveler"
                : entry.name().trim();
        if (name.length() > 40) {
            name = name.substring(0, 40);
        }
        String emoji = entry.emoji() == null || entry.emoji().isBlank() ? "🌏" : entry.emoji().trim();
        if (emoji.length() > 8) {
            emoji = emoji.substring(0, 8);
        }
        return entries.save(GuestEntry.builder()
                .name(name)
                .message(message)
                .emoji(emoji)
                .createdAt(LocalDateTime.now())
                .build());
    }

    /** Owner only (JWT enforced by the write-protection filter). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!entries.existsById(id)) {
            throw new NotFoundException("Entry not found: " + id);
        }
        entries.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
