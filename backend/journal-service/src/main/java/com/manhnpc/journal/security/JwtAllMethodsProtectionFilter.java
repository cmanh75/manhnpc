package com.manhnpc.journal.security;

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
 * The whole journal is private — unlike the other services, every method
 * (including GET) requires a valid HS256 JWT signed with the shared secret.
 */
@Component
public class JwtAllMethodsProtectionFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtAllMethodsProtectionFilter(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // CORS preflight never carries the Authorization header — let it through
        // so the browser's preflight check succeeds and the real request can be sent.
        // (Uploaded images are served straight from R2's public URL, never through
        // this service, so there's no GET-serving path here to exempt.)
        return request.getRequestURI().startsWith("/h2-console")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
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
