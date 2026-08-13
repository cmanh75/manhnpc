package com.manhnpc.audit.web;

import java.util.Locale;

/** Lightweight best-effort browser/OS detection from the User-Agent string — no external library. */
final class UserAgentParser {

    private UserAgentParser() {
    }

    record Info(String browser, String os) {
    }

    static Info parse(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return new Info("unknown", "unknown");
        }
        String ua = userAgent.toLowerCase(Locale.ROOT);
        String browser = "other";
        if (ua.contains("edg/")) browser = "Edge";
        else if (ua.contains("opr/") || ua.contains("opera")) browser = "Opera";
        else if (ua.contains("chrome/") && !ua.contains("chromium")) browser = "Chrome";
        else if (ua.contains("firefox/")) browser = "Firefox";
        else if (ua.contains("safari/") && !ua.contains("chrome")) browser = "Safari";

        String os = "other";
        if (ua.contains("windows")) os = "Windows";
        else if (ua.contains("android")) os = "Android";
        else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) os = "iOS";
        else if (ua.contains("mac os")) os = "macOS";
        else if (ua.contains("linux")) os = "Linux";

        return new Info(browser, os);
    }
}
