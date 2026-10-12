package com.example.campuscare.dto;

import com.example.campuscare.entity.User;
import java.time.LocalDateTime;

public record UserDto(Long id, String name, String email, String role, LocalDateTime createdAt) {
    public static UserDto from(User u) {
        return new UserDto(u.getUserId(), u.getName(), u.getEmail(), u.getRole().name(), u.getCreatedAt());
    }
}
