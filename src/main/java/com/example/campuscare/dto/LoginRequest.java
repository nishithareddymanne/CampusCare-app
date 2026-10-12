package com.example.campuscare.dto;

import jakarta.validation.constraints.*;

public record LoginRequest(
        @NotBlank(message = "Email is required.") @Email(message = "Please enter a valid email address.") String email,
        @NotBlank(message = "Password is required.") String password) { }
