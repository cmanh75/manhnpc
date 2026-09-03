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

    /** Shared by every video in the same multi-video post; null for standalone videos. */
    private String groupId;

    /** Order within {@link #groupId}; null/0 for standalone videos or rows predating this column. */
    @Column(name = "sort_position")
    @Builder.Default
    private Integer position = 0;

    /** Public R2 URL of the music track attached to this post (same value on every member of {@link #groupId}), if any. */
    private String musicUrl;

    /** R2 object key for {@link #musicUrl} — shared by every member of the group, so only deleted when the whole post is gone. */
    private String musicStorageKey;

    private int durationSeconds;

    private String category;

    private LocalDateTime createdAt;

    /** Nullable so ddl-auto's ALTER TABLE (adding this column after the table already has rows)
     *  doesn't try a NOT NULL column with no default, which H2 rejects on non-empty tables — same
     *  reasoning as {@link #position}. Null/0 for rows predating this column. */
    private Long views;

    public long getViews() {
        return views == null ? 0L : views;
    }

    public void setViews(long views) {
        this.views = views;
    }
}
