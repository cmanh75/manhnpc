package com.manhnpc.audit.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Inverse of the usual write-protection filter: recording a visit
 * (POST /api/audit/visit) must stay public since visitors aren't
 * authenticated, but reading the logs/stats back is owner-only.
 */
@Component
public class JwtReadProtectionFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtReadProtectionFilter(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/h2-console")
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || ("POST".equalsIgnoreCase(request.getMethod()) && request.getRequestURI().equals("/api/audit/visit"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Jwts.parser().verifyWith(key).build().parseSignedClaims(header.substring(7));
                filterChain.doFilter(request, response);
                return;
            } catch (Exception ignored) {
                // fall through to 401
            }
        }
        response.setStatus(401);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"timestamp":"%s","status":401,"error":"Unauthorized","message":"A valid Bearer token is required for this operation","path":"%s"}"""
                .formatted(Instant.now(), request.getRequestURI()));
    }
}
