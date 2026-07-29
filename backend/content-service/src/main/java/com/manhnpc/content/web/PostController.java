package com.manhnpc.content.web;

import com.manhnpc.content.model.Post;
import com.manhnpc.content.repository.PostRepository;
import com.manhnpc.content.web.error.NotFoundException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
@RequestMapping("/api/posts")
public class PostController {

    public record PagedResponse<T>(List<T> content, long totalElements, int totalPages, int page) {
    }

    public record TagCount(String tag, long count) {
    }

    private final PostRepository posts;

    public PostController(PostRepository posts) {
        this.posts = posts;
    }

    @GetMapping
    public PagedResponse<Post> list(@RequestParam(required = false) String tag,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        List<Post> all = posts.findByPublishedTrueOrderByCreatedAtDesc();

        List<Post> filtered = all.stream()
                .filter(p -> tag == null || tag.isBlank() || tagsOf(p).contains(tag.toLowerCase(Locale.ROOT)))
                .filter(p -> matchesQuery(p, q))
                .toList();

        int safeSize = Math.max(1, size);
        int totalPages = (int) Math.ceil((double) filtered.size() / safeSize);
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, filtered.size());
        int to = Math.min(from + safeSize, filtered.size());

        return new PagedResponse<>(filtered.subList(from, to), filtered.size(), totalPages, safePage);
    }

    @GetMapping("/tags")
    public List<TagCount> tags() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Post post : posts.findByPublishedTrueOrderByCreatedAtDesc()) {
            for (String tag : tagsOf(post)) {
                counts.merge(tag, 1L, Long::sum);
            }
        }
        return counts.entrySet().stream()
                .map(e -> new TagCount(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }

    @GetMapping("/{slug}")
    public Post bySlug(@PathVariable String slug) {
        Post post = posts.findBySlug(slug)
                .filter(Post::isPublished)
                .orElseThrow(() -> new NotFoundException("Post not found: " + slug));
        post.setViews(post.getViews() + 1);
        return posts.save(post);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Post create(@RequestBody Post post) {
        post.setId(null);
        if (post.getSlug() == null || post.getSlug().isBlank()) {
            post.setSlug(slugify(post.getTitle()));
        }
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        return posts.save(post);
    }

    @PutMapping("/{id}")
    public Post update(@PathVariable Long id, @RequestBody Post update) {
        Post post = posts.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found: " + id));
        post.setTitle(update.getTitle());
        if (update.getSlug() != null && !update.getSlug().isBlank()) {
            post.setSlug(update.getSlug());
        }
        post.setExcerpt(update.getExcerpt());
        post.setContent(update.getContent());
        post.setCoverImage(update.getCoverImage());
        post.setTags(update.getTags());
        post.setCategory(update.getCategory());
        post.setReadingTime(update.getReadingTime());
        post.setPublished(update.isPublished());
        post.setUpdatedAt(LocalDateTime.now());
        return posts.save(post);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!posts.existsById(id)) {
            throw new NotFoundException("Post not found: " + id);
        }
        posts.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static List<String> tagsOf(Post post) {
        if (post.getTags() == null || post.getTags().isBlank()) {
            return List.of();
        }
        return Arrays.stream(post.getTags().split(","))
                .map(t -> t.trim().toLowerCase(Locale.ROOT))
                .filter(t -> !t.isEmpty())
                .toList();
    }

    private static boolean matchesQuery(Post post, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.toLowerCase(Locale.ROOT);
        return (post.getTitle() != null && post.getTitle().toLowerCase(Locale.ROOT).contains(needle))
                || (post.getExcerpt() != null && post.getExcerpt().toLowerCase(Locale.ROOT).contains(needle))
                || (post.getContent() != null && post.getContent().toLowerCase(Locale.ROOT).contains(needle));
    }

    private static String slugify(String title) {
        if (title == null) {
            return "post-" + System.currentTimeMillis();
        }
        return title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
