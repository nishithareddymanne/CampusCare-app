package com.example.campuscare.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String message, Map<String, String> fieldErrors, LocalDateTime timestamp) {
    public ApiError(int status, String message, Map<String, String> fieldErrors) {
        this(status, message, fieldErrors, LocalDateTime.now());
    }
}
