package com.example.campuscare.dto;

import com.example.campuscare.entity.ComplaintStatus;
import jakarta.validation.constraints.*;

public record StatusUpdateRequest(
        @NotNull(message = "Please select a status.") ComplaintStatus status,
        @Size(max = 500, message = "Remark must be at most 500 characters.") String remark) { }
