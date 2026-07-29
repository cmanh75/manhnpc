package com.manhnpc.travel.model;

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
@Table(name = "visited_places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String country;

    /** ISO 3166-1 alpha-2 code, e.g. "VN". */
    private String countryCode;

    private double lat;

    private double lng;

    private LocalDate visitedAt;

    @Column(length = 1000)
    private String description;

    private String highlight;

    /** Hex color used by the frontend globe/map markers, e.g. "#22d3ee". */
    private String color;

    private int photosCount;

    /** 1-5 stars. */
    private int rating;
}
