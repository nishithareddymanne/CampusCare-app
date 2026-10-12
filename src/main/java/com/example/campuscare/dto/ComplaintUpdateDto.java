package com.example.campuscare.dto;

import com.example.campuscare.entity.ComplaintUpdate;
import java.time.LocalDateTime;

public record ComplaintUpdateDto(Long id, Long complaintId, String complaintTitle, String oldStatus,
                                 String newStatus, String remark, String updatedBy, LocalDateTime updatedAt) {
    public static ComplaintUpdateDto from(ComplaintUpdate u) {
        return new ComplaintUpdateDto(
                u.getUpdateId(),
                u.getComplaint().getComplaintId(),
                u.getComplaint().getTitle(),
                u.getOldStatus() == null ? null : u.getOldStatus().name(),
                u.getNewStatus().name(),
                u.getRemark(),
                u.getUpdatedBy().getName(),
                u.getUpdatedAt());
    }
}
