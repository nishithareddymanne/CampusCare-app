package com.example.campuscare.dto;

import jakarta.validation.constraints.*;

public record SignupRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters.")
        String name,

        @NotBlank(message = "College email is required.")
        @Email(message = "Please enter a valid email address.")
        @Size(max = 150, message = "Email is too long.")
        String email,

        @NotBlank(message = "Password is required.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                 message = "Password must be 8-72 characters and contain a letter and a number.")
        String password,

        @NotBlank(message = "Please confirm your password.")
        String confirmPassword) { }
