package com.example.campuscare.service;

import com.example.campuscare.dto.ComplaintDto;
import com.example.campuscare.dto.ComplaintUpdateDto;
import com.example.campuscare.entity.Complaint;
import com.example.campuscare.entity.Department;
import com.example.campuscare.entity.User;
import com.example.campuscare.repository.ComplaintUpdateRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/** Converts entities to DTOs. Must be called inside a transaction (lazy associations). */
@Component
public class ComplaintMapper {

    private final ComplaintUpdateRepository updates;

    public ComplaintMapper(ComplaintUpdateRepository updates) {
        this.updates = updates;
    }

    public ComplaintDto toDto(Complaint c, boolean withHistory) {
        List<ComplaintUpdateDto> history = updates
                .findByComplaint_ComplaintIdOrderByUpdatedAtAscUpdateIdAsc(c.getComplaintId())
                .stream().map(ComplaintUpdateDto::from).toList();

        String latest = null;
        for (int i = history.size() - 1; i >= 0; i--) {
            String remark = history.get(i).remark();
            if (remark != null && !remark.isBlank()) {
                latest = remark;
                break;
            }
        }
        Department d = c.getDepartment();
        User u = c.getUser();
        return new ComplaintDto(
                c.getComplaintId(), c.getTitle(), c.getCategory().name(), c.getDescription(), c.getLocation(),
                c.getImageUrl(), c.getStatus().name(),
                u.getUserId(), u.getName(), u.getEmail(),
                d == null ? null : d.getDepartmentId(), d == null ? null : d.getName(),
                c.getCreatedAt(), c.getUpdatedAt(), latest,
                c.getStatus().allowedNext().stream().map(Enum::name).toList(),
                withHistory ? history : null);
    }
}
