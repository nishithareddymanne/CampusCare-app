package com.example.campuscare.entity;

import java.util.EnumSet;
import java.util.Set;

/** Workflow: PENDING -> ASSIGNED -> IN_PROGRESS -> RESOLVED. REJECTED is allowed before resolution. */
public enum ComplaintStatus {
    PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED;

    public Set<ComplaintStatus> allowedNext() {
        return switch (this) {
            case PENDING -> EnumSet.of(ASSIGNED, REJECTED);
            case ASSIGNED -> EnumSet.of(IN_PROGRESS, REJECTED);
            case IN_PROGRESS -> EnumSet.of(RESOLVED, REJECTED);
            case RESOLVED, REJECTED -> EnumSet.noneOf(ComplaintStatus.class);
        };
    }
}
