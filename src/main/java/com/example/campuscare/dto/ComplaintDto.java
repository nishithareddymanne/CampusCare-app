package com.example.campuscare.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ComplaintDto(Long id, String title, String category, String description, String location,
                           String imageUrl, String status, Long studentId, String studentName, String studentEmail,
                           Long departmentId, String department, LocalDateTime createdAt, LocalDateTime updatedAt,
                           String latestRemark, List<String> allowedNext, List<ComplaintUpdateDto> history) { }
