package com.manhnpc.audit.web;

import com.manhnpc.audit.model.VisitLog;
import com.manhnpc.audit.repository.VisitLogRepository;
import com.manhnpc.common.security.OwnerRequests;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    public record VisitRequest(String path, String referrer, String language) {
    }

    public record CountEntry(String label, long count) {
    }

    public record VisitStats(long totalVisits, long uniqueIps, long visitsToday, long visitsLast30Days,
                             List<CountEntry> topPaths, List<CountEntry> topReferrers,
                             List<CountEntry> browsers, List<CountEntry> operatingSystems,
                             List<CountEntry> visitsByDay) {
    }

    private final VisitLogRepository visits;

    public AuditController(VisitLogRepository visits) {
        this.visits = visits;
    }

    /** Public — called once per page view from the frontend. IP/User-Agent are read from the request itself, not client-supplied. */
    @PostMapping("/visit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recordVisit(@RequestBody(required = false) VisitRequest body, HttpServletRequest request) {
        if (OwnerRequests.isOwner(request)) return;
        String ip = OwnerRequests.clientIp(request);
        String userAgent = trim(request.getHeader("User-Agent"), 500);
        UserAgentParser.Info info = UserAgentParser.parse(userAgent);
        VisitLog log = VisitLog.builder()
                .ipAddress(trim(ip, 64))
                .userAgent(userAgent)
                .browser(info.browser())
                .os(info.os())
                .path(trim(body != null && body.path() != null && !body.path().isBlank() ? body.path() : "/", 300))
                .referrer(trim(body != null ? body.referrer() : null, 500))
                .language(trim(body != null ? body.language() : request.getHeader("Accept-Language"), 40))
                .build();
        visits.save(log);
    }

    /** Owner only. */
    @GetMapping("/visits")
    public Page<VisitLog> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(200, Math.max(1, size)));
        return visits.findAllByOrderByCreatedAtDesc(pageable);
    }

    /** Owner only. */
    @GetMapping("/stats")
    public VisitStats stats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime last30Days = LocalDateTime.now().minusDays(30);
        List<VisitLog> recent = visits.findByCreatedAtAfter(last30Days);

        return new VisitStats(
                visits.count(),
                visits.countDistinctIpAddress(),
                visits.countByCreatedAtAfter(startOfToday),
                recent.size(),
                topOf(recent, VisitLog::getPath, 10),
                topOf(recent, v -> v.getReferrer() == null || v.getReferrer().isBlank() ? "(direct)" : v.getReferrer(), 10),
                topOf(recent, v -> v.getBrowser() == null ? "unknown" : v.getBrowser(), 10),
                topOf(recent, v -> v.getOs() == null ? "unknown" : v.getOs(), 10),
                byDay(recent));
    }

    private static List<CountEntry> topOf(List<VisitLog> logs, java.util.function.Function<VisitLog, String> key, int limit) {
        Map<String, Long> counts = logs.stream().collect(Collectors.groupingBy(key, LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new CountEntry(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(CountEntry::count).reversed())
                .limit(limit)
                .toList();
    }

    private static List<CountEntry> byDay(List<VisitLog> logs) {
        Map<String, Long> counts = logs.stream().collect(Collectors.groupingBy(
                v -> v.getCreatedAt().toLocalDate().toString(), Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new CountEntry(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(CountEntry::label))
                .toList();
    }

    private static String trim(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
