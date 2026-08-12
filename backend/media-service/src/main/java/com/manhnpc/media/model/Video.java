package com.manhnpc.media.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "videos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String url;

    private String thumbnailUrl;

    /** R2 object key backing {@link #url}; null for seeded/external URLs. */
    private String storageKey;

    /** R2 object key backing {@link #thumbnailUrl}; null for seeded/picsum thumbnails. */
    private String thumbnailKey;

    private int durationSeconds;

    private String category;

    private LocalDateTime createdAt;
}
