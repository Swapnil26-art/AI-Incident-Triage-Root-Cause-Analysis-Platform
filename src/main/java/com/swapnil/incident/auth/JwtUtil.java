package com.swapnil.incident.auth;

import io.jsonwebtoken.*;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.userdetails.UserDetails;

import com.swapnil.incident.auth.User.Role;

public class JwtUtil {
    private final String SECRET_KEY = System.getenv("JWT_SECRET") ?? "fallback-secret";
    private final long EXPIRATION_TIME = 86400000; // 24 hours in milliseconds

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", userDetails.getUsername());
        claims.put("role", userDetails.getAuthorities().get(0).getAuthority());
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
            .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
            .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody().getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}