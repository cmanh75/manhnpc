package com.manhnpc.content.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 1000)
    private String excerpt;

    @Lob
    @Column(nullable = false)
    private String content;

    private String coverImage;

    /** Public R2 URL of the music track attached to this post, if any. */
    private String musicUrl;

    /** R2 object key for {@link #musicUrl} — used to delete the object when replaced/removed. Not exposed for write via the JSON create/update endpoints. */
    private String musicStorageKey;

    /** Comma-separated list of tags, e.g. "java,spring,microservices". */
    @Column(length = 500)
    private String tags;

    private String category;

    private int readingTime;

    @Builder.Default
    private boolean published = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Builder.Default
    private long views = 0L;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
