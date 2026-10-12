package com.example.campuscare.dto;

import com.example.campuscare.entity.Department;

public record DepartmentDto(Long id, String name, String contactEmail) {
    public static DepartmentDto from(Department d) {
        return new DepartmentDto(d.getDepartmentId(), d.getName(), d.getContactEmail());
    }
}
