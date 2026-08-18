package com.manhnpc.audit.geo;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.AddressNotFoundException;
import com.maxmind.geoip2.model.CityResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Resolves an IP to its country + city using a local MaxMind GeoLite2-City database — no
 * per-lookup network call, so visitor IPs never leave the server. The database itself is
 * downloaded once (via a MaxMind license key) and cached on disk at {@code geoip.database-path};
 * subsequent boots reuse the cached file. Mirrors R2StorageService's lazy-init pattern: the reader
 * is built lazily on first use, not in the constructor, so a missing/blank license key (the local-dev
 * default — see application.yml) never stops the app from booting, it just disables the lookup.
 */
@Slf4j
@Service
public class GeoIpService {

    private static final String DOWNLOAD_URL =
            "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=%s&suffix=tar.gz";

    public record GeoLocation(String countryCode, String city) {}

    private final String licenseKey;
    private final Path databasePath;
    private volatile DatabaseReader reader;
    private volatile boolean unavailable;

    public GeoIpService(
            @Value("${geoip.license-key}") String licenseKey,
            @Value("${geoip.database-path}") String databasePath) {
        this.licenseKey = licenseKey;
        this.databasePath = Path.of(databasePath);
    }

    public boolean isConfigured() {
        return licenseKey != null && !licenseKey.isBlank();
    }

    public Optional<GeoLocation> lookup(String ip) {
        if (ip == null || ip.isBlank()) {
            return Optional.empty();
        }
        DatabaseReader r = reader();
        if (r == null) {
            return Optional.empty();
        }
        try {
            InetAddress address = InetAddress.getByName(ip);
            CityResponse response = r.city(address);
            String countryCode = response.getCountry().getIsoCode();
            String city = response.getCity().getName();
            if (countryCode == null && city == null) {
                return Optional.empty();
            }
            return Optional.of(new GeoLocation(countryCode, city));
        } catch (AddressNotFoundException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for {}: {}", ip, e.toString());
            return Optional.empty();
        }
    }

    private DatabaseReader reader() {
        DatabaseReader existing = reader;
        if (existing != null || unavailable) {
            return existing;
        }
        synchronized (this) {
            if (reader != null || unavailable) {
                return reader;
            }
            if (!isConfigured()) {
                unavailable = true;
                log.info("geoip.license-key not set — visit-log geo lookups disabled");
                return null;
            }
            try {
                ensureDatabaseDownloaded();
                reader = new DatabaseReader.Builder(databasePath.toFile()).build();
            } catch (Exception e) {
                unavailable = true;
                log.warn("Could not initialize GeoLite2 database, geo lookups disabled: {}", e.toString());
            }
            return reader;
        }
    }

    private void ensureDatabaseDownloaded() throws IOException {
        if (Files.exists(databasePath)) {
            return;
        }
        Path parent = databasePath.toAbsolutePath().getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        log.info("Downloading GeoLite2-City database from MaxMind...");
        URL url = URI.create(DOWNLOAD_URL.formatted(licenseKey)).toURL();
        Path tempTar = Files.createTempFile("geolite2-city-", ".tar.gz");
        try {
            try (InputStream in = url.openStream()) {
                Files.copy(in, tempTar, StandardCopyOption.REPLACE_EXISTING);
            }
            extractMmdb(tempTar, databasePath);
        } finally {
            Files.deleteIfExists(tempTar);
        }
        log.info("GeoLite2-City database saved to {}", databasePath.toAbsolutePath());
    }

    private static void extractMmdb(Path tarGz, Path destination) throws IOException {
        try (InputStream fileIn = Files.newInputStream(tarGz);
             GzipCompressorInputStream gzIn = new GzipCompressorInputStream(fileIn);
             TarArchiveInputStream tarIn = new TarArchiveInputStream(gzIn)) {
            TarArchiveEntry entry;
            while ((entry = tarIn.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().endsWith(".mmdb")) {
                    Path tempMmdb = Files.createTempFile(destination.toAbsolutePath().getParent(), "geolite2-", ".mmdb.tmp");
                    Files.copy(tarIn, tempMmdb, StandardCopyOption.REPLACE_EXISTING);
                    Files.move(tempMmdb, destination, StandardCopyOption.REPLACE_EXISTING);
                    return;
                }
            }
        }
        throw new IOException("Downloaded GeoLite2 archive did not contain an .mmdb file");
    }
}
