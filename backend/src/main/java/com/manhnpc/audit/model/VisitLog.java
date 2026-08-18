package com.manhnpc.audit.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per page view — standard web-server-access-log fields only
 * (IP, user agent, path, referrer, language, timestamp, country, city). Country/city are
 * resolved offline from a local MaxMind GeoLite2 database (see audit.geo.GeoIpService) —
 * the visitor's IP never leaves the server. No fingerprinting, no persistent visitor/cookie IDs.
 */
@Entity
@Table(name = "visit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(length = 40)
    private String browser;

    @Column(length = 40)
    private String os;

    @Column(length = 300, nullable = false)
    private String path;

    @Column(length = 500)
    private String referrer;

    @Column(length = 40)
    private String language;

    /** ISO 3166-1 alpha-2 code (e.g. "VN"), null if unresolved (private/reserved IP, or GeoIP not configured). */
    @Column(length = 2)
    private String country;

    @Column(length = 100)
    private String city;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
