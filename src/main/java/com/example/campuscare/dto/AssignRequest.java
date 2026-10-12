package com.example.campuscare.dto;

import jakarta.validation.constraints.*;

public record AssignRequest(
        @NotNull(message = "Please select a department.") Long departmentId,
        @Size(max = 500, message = "Remark must be at most 500 characters.") String remark) { }
