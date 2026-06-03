package com.sie.identidad.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UUID usuarioId, String email, Set<String> roles, UUID colegioId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("usuarioId", usuarioId.toString())
                .claim("roles", new ArrayList<>(roles))
                .claim("colegioId", colegioId.toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmail(Claims claims) {
        return claims.getSubject();
    }

    public UUID getUsuarioId(Claims claims) {
        return UUID.fromString(claims.get("usuarioId", String.class));
    }

    @SuppressWarnings("unchecked")
    public Set<String> getRoles(Claims claims) {
        List<String> rolesList = claims.get("roles", List.class);
        return new HashSet<>(rolesList);
    }

    public UUID getColegioId(Claims claims) {
        return UUID.fromString(claims.get("colegioId", String.class));
    }
}
