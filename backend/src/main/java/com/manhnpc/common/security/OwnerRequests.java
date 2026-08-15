package com.manhnpc.common.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;

/** Shared "is this the owner's own browser" check, used to keep the owner's own traffic out of
 *  visitor-facing counters (audit visit log, post/photo/video view counts). */
public final class OwnerRequests {

    /** Fallback for when the owner is browsing logged out (no JWT yet, so no principal to check) —
     *  their home/mobile network's public IP, not any specific device (NAT means every device on
     *  that connection shares it). Mobile carrier IPs rotate, so this list may need the occasional
     *  update; the principal check below covers the common logged-in case regardless of network. */
    private static final Set<String> IGNORED_IPS = Set.of("58.186.123.46", "27.68.212.237");

    private OwnerRequests() {
    }

    /** JwtAuthFilter authenticates any request carrying the owner's token, public endpoint or not —
     *  the frontend's axios interceptor attaches it whenever a logged-in session exists, so this is
     *  "is it the owner's browser" independent of which network they're on. */
    public static boolean isOwner(HttpServletRequest request) {
        if (request.getUserPrincipal() != null) return true;
        return IGNORED_IPS.contains(clientIp(request));
    }

    public static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
