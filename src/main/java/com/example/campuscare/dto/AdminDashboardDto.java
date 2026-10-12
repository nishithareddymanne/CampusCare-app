package com.example.campuscare.dto;

import java.util.Map;

public record AdminDashboardDto(long total, Map<String, Long> byStatus, Map<String, Long> byCategory,
                                Map<String, Long> byDepartment) { }
