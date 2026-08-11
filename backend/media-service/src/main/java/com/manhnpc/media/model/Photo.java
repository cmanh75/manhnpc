package com.manhnpc.media.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

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

    /** One of: travel, food, code, life. */
    private String category;

    private String location;

    private LocalDate takenAt;

    private int width;

    private int height;

    @Builder.Default
    private boolean featured = false;
}
