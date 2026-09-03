package com.manhnpc.journal.web;

import com.manhnpc.journal.model.JournalEntry;
import com.manhnpc.journal.repository.JournalEntryRepository;
import com.manhnpc.common.storage.R2StorageService;
import com.manhnpc.common.web.error.NotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    /** Matches markdown image syntax `![alt](url)`, as inserted by the journal editor's image upload. */
    private static final Pattern IMAGE_URL_PATTERN = Pattern.compile("!\\[[^\\]]*]\\(([^)]+)\\)");

    private final JournalEntryRepository entries;
    private final R2StorageService storage;

    public JournalEntryController(JournalEntryRepository entries, R2StorageService storage) {
        this.entries = entries;
        this.storage = storage;
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
        JournalEntry entry = entries.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal entry not found: " + id));
        entries.deleteById(id);
        imageUrlsIn(entry.getContent()).forEach(storage::deleteByUrl);
        return ResponseEntity.noContent().build();
    }

    /** Every R2 image URL embedded via markdown `![alt](url)` in a journal entry's content. */
    private static List<String> imageUrlsIn(String content) {
        if (content == null) {
            return List.of();
        }
        List<String> urls = new ArrayList<>();
        Matcher matcher = IMAGE_URL_PATTERN.matcher(content);
        while (matcher.find()) {
            urls.add(matcher.group(1));
        }
        return urls;
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
