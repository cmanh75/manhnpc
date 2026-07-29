package com.manhnpc.media.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Set;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Mutating requests (POST/PUT/DELETE/PATCH) require a valid HS256 JWT signed
 * with the shared secret. Reads pass through freely.
 */
@Component
public class JwtWriteProtectionFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_METHODS = Set.of("POST", "PUT", "DELETE", "PATCH");

    private final SecretKey key;

    public JwtWriteProtectionFilter(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !PROTECTED_METHODS.contains(request.getMethod())
                || request.getRequestURI().startsWith("/h2-console");
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
