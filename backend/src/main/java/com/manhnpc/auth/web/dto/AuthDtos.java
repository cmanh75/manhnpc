package com.manhnpc.auth.web.dto;

import com.manhnpc.auth.model.User;
import java.util.List;
import java.util.Map;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(String username, String password) {
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {
    }

    public record UserDto(Long id, String username, String displayName, String avatarUrl) {

        public static UserDto from(User user) {
            return new UserDto(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl());
        }
    }

    public record LoginResponse(String token, UserDto user) {
    }

    public record ProfileResponse(
            String name,
            String alias,
            String role,
            String company,
            String location,
            String bio,
            String avatarUrl,
            List<String> skills,
            Map<String, String> socials,
            Map<String, Integer> stats) {
    }
}
