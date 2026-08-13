package com.manhnpc.journal.web;

import com.manhnpc.journal.model.JournalEntry;
import com.manhnpc.journal.repository.JournalEntryRepository;
import com.manhnpc.common.web.error.NotFoundException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journal")
public class JournalEntryController {

    private final JournalEntryRepository entries;

    public JournalEntryController(JournalEntryRepository entries) {
        this.entries = entries;
    }

    @GetMapping
    public List<JournalEntry> list(@RequestParam(required = false) String tag) {
        List<JournalEntry> all = entries.findAllByOrderByEntryDateDescIdDesc();
        if (tag == null || tag.isBlank()) {
            return all;
        }
        String needle = tag.toLowerCase(Locale.ROOT);
        return all.stream().filter(e -> tagsOf(e).contains(needle)).toList();
    }

    @GetMapping("/{id}")
    public JournalEntry get(@PathVariable Long id) {
        return entries.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal entry not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JournalEntry create(@RequestBody JournalEntry entry) {
        entry.setId(null);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setUpdatedAt(LocalDateTime.now());
        return entries.save(entry);
    }

    @PutMapping("/{id}")
    public JournalEntry update(@PathVariable Long id, @RequestBody JournalEntry update) {
        JournalEntry entry = entries.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal entry not found: " + id));
        entry.setTitle(update.getTitle());
        entry.setContent(update.getContent());
        entry.setTags(update.getTags());
        if (update.getEntryDate() != null) {
            entry.setEntryDate(update.getEntryDate());
        }
        entry.setUpdatedAt(LocalDateTime.now());
        return entries.save(entry);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!entries.existsById(id)) {
            throw new NotFoundException("Journal entry not found: " + id);
        }
        entries.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static List<String> tagsOf(JournalEntry entry) {
        if (entry.getTags() == null || entry.getTags().isBlank()) {
            return List.of();
        }
        return Arrays.stream(entry.getTags().split(","))
                .map(t -> t.trim().toLowerCase(Locale.ROOT))
                .filter(t -> !t.isEmpty())
                .toList();
    }
}
