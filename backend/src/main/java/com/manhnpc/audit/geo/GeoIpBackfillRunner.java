package com.manhnpc.audit.geo;

import com.manhnpc.audit.model.VisitLog;
import com.manhnpc.audit.repository.VisitLogRepository;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * One-time-per-boot catch-up: fills in {@code country} on visit_logs rows that predate
 * GeoIpService (or were left null because GeoIP wasn't configured yet at the time). Only
 * runs when a license key is actually set, so it's a no-op on every boot until then.
 */
@Slf4j
@Component
public class GeoIpBackfillRunner implements ApplicationRunner {

    private final VisitLogRepository visits;
    private final GeoIpService geoIp;

    public GeoIpBackfillRunner(VisitLogRepository visits, GeoIpService geoIp) {
        this.visits = visits;
        this.geoIp = geoIp;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!geoIp.isConfigured()) {
            return;
        }
        List<VisitLog> pending = visits.findByCountryIsNullAndIpAddressIsNotNull();
        if (pending.isEmpty()) {
            return;
        }
        int resolved = 0;
        for (VisitLog visit : pending) {
            String country = geoIp.countryCode(visit.getIpAddress()).orElse(null);
            if (country != null) {
                visit.setCountry(country);
                resolved++;
            }
        }
        visits.saveAll(pending);
        log.info("GeoIP backfill: resolved country for {}/{} existing visit logs", resolved, pending.size());
    }
}
