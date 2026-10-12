package com.example.campuscare.service;

import com.example.campuscare.dto.*;
import com.example.campuscare.entity.*;
import com.example.campuscare.exception.ApiException;
import com.example.campuscare.repository.ComplaintRepository;
import com.example.campuscare.repository.ComplaintUpdateRepository;
import com.example.campuscare.repository.DepartmentRepository;
import com.example.campuscare.repository.UserRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminComplaintService {

    private final ComplaintRepository complaints;
    private final ComplaintUpdateRepository updates;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final ComplaintMapper mapper;

    public AdminComplaintService(ComplaintRepository complaints, ComplaintUpdateRepository updates,
                                 DepartmentRepository departments, UserRepository users, ComplaintMapper mapper) {
        this.complaints = complaints;
        this.updates = updates;
        this.departments = departments;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> list(String q, String status, String category, Long departmentId) {
        ComplaintStatus st = parse(ComplaintStatus.class, status, "status");
        Category cat = parse(Category.class, category, "category");

        Specification<Complaint> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (st != null) p.add(cb.equal(root.get("status"), st));
            if (cat != null) p.add(cb.equal(root.get("category"), cat));
            if (departmentId != null) {
                p.add(cb.equal(root.join("department", JoinType.LEFT).get("departmentId"), departmentId));
            }
            if (q != null && !q.isBlank()) {
                String text = q.trim();
                Predicate byTitle = cb.like(cb.lower(root.get("title")), "%" + text.toLowerCase() + "%");
                try {
                    p.add(cb.or(byTitle, cb.equal(root.get("complaintId"), Long.parseLong(text.replace("#", "")))));
                } catch (NumberFormatException e) {
                    p.add(byTitle);
                }
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        return complaints.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(c -> mapper.toDto(c, false)).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDto details(Long id) {
        return mapper.toDto(find(id), true);
    }

    @Transactional
    public ComplaintDto assign(String adminEmail, Long id, AssignRequest req) {
        User admin = findUser(adminEmail);
        Complaint c = find(id);
        ComplaintStatus old = c.getStatus();
        if (old != ComplaintStatus.PENDING && old != ComplaintStatus.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "A department can only be assigned while the complaint is Pending or Assigned.");
        }
        Department dept = departments.findById(req.departmentId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected department does not exist.",
                        Map.of("departmentId", "Selected department does not exist.")));

        c.setDepartment(dept);
        c.setStatus(ComplaintStatus.ASSIGNED);
        complaints.saveAndFlush(c);

        String remark = blankToNull(req.remark());
        logUpdate(c, admin, old, ComplaintStatus.ASSIGNED,
                remark != null ? remark : "Assigned to the " + dept.getName() + " department.");
        return mapper.toDto(c, true);
    }

    @Transactional
    public ComplaintDto updateStatus(String adminEmail, Long id, StatusUpdateRequest req) {
        User admin = findUser(adminEmail);
        Complaint c = find(id);
        ComplaintStatus old = c.getStatus();
        ComplaintStatus next = req.status();
        String remark = blankToNull(req.remark());

        if (next == ComplaintStatus.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT, "Use 'Assign Department' to move a complaint to Assigned.");
        }
        if (!old.allowedNext().contains(next)) {
            String allowed = old.allowedNext().isEmpty() ? "none (this complaint is closed)" : old.allowedNext().toString();
            throw new ApiException(HttpStatus.CONFLICT,
                    "Invalid status change: " + old + " -> " + next + ". Allowed next status: " + allowed + ".");
        }
        if (next == ComplaintStatus.REJECTED && remark == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A remark is required when rejecting a complaint.",
                    Map.of("remark", "Please explain why this complaint is rejected."));
        }
        c.setStatus(next);
        complaints.saveAndFlush(c);
        logUpdate(c, admin, old, next, remark);
        return mapper.toDto(c, true);
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto dashboard() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        long total = 0;
        for (ComplaintStatus s : ComplaintStatus.values()) {
            long n = complaints.countByStatus(s);
            byStatus.put(s.name(), n);
            total += n;
        }
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Category c : Category.values()) byCategory.put(c.name(), 0L);
        for (Object[] row : complaints.countGroupedByCategory()) {
            byCategory.put(((Category) row[0]).name(), (Long) row[1]);
        }
        Map<String, Long> byDepartment = new LinkedHashMap<>();
        for (Department d : departments.findAll(Sort.by("name"))) byDepartment.put(d.getName(), 0L);
        for (Object[] row : complaints.countGroupedByDepartment()) {
            byDepartment.put((String) row[0], (Long) row[1]);
        }
        return new AdminDashboardDto(total, byStatus, byCategory, byDepartment);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> departments() {
        return departments.findAll(Sort.by("name")).stream().map(DepartmentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintUpdateDto> recentUpdates() {
        return updates.findTop50ByOrderByUpdatedAtDescUpdateIdDesc().stream().map(ComplaintUpdateDto::from).toList();
    }

    // ---- helpers ----
    private void logUpdate(Complaint c, User by, ComplaintStatus old, ComplaintStatus next, String remark) {
        ComplaintUpdate u = new ComplaintUpdate();
        u.setComplaint(c);
        u.setUpdatedBy(by);
        u.setOldStatus(old);
        u.setNewStatus(next);
        u.setRemark(remark);
        updates.saveAndFlush(u);
    }

    private Complaint find(Long id) {
        return complaints.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found."));
    }

    private User findUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static <E extends Enum<E>> E parse(Class<E> type, String raw, String field) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid " + field + " filter.");
        }
    }
}
