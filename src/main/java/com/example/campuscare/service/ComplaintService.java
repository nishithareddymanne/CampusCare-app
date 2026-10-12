package com.example.campuscare.service;

import com.example.campuscare.dto.ComplaintDto;
import com.example.campuscare.dto.StudentStatsDto;
import com.example.campuscare.entity.*;
import com.example.campuscare.exception.ApiException;
import com.example.campuscare.repository.ComplaintRepository;
import com.example.campuscare.repository.ComplaintUpdateRepository;
import com.example.campuscare.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Student-side complaint operations. Every query is scoped to the authenticated student. */
@Service
public class ComplaintService {

    private final ComplaintRepository complaints;
    private final ComplaintUpdateRepository updates;
    private final UserRepository users;
    private final ComplaintMapper mapper;
    private final FileStorageService files;

    public ComplaintService(ComplaintRepository complaints, ComplaintUpdateRepository updates,
                            UserRepository users, ComplaintMapper mapper, FileStorageService files) {
        this.complaints = complaints;
        this.updates = updates;
        this.users = users;
        this.mapper = mapper;
        this.files = files;
    }

    @Transactional
    public ComplaintDto create(String email, String title, String categoryRaw, String description,
                               String location, MultipartFile image) {
        String t = clean(title);
        String d = clean(description);
        String l = clean(location);

        Map<String, String> errors = new LinkedHashMap<>();
        if (t.length() < 5 || t.length() > 150) errors.put("title", "Title must be between 5 and 150 characters.");
        if (d.length() < 10 || d.length() > 2000) errors.put("description", "Description must be between 10 and 2000 characters.");
        if (l.length() < 2 || l.length() > 150) errors.put("location", "Campus location must be between 2 and 150 characters.");
        Category category = null;
        try {
            category = Category.valueOf(clean(categoryRaw).toUpperCase());
        } catch (IllegalArgumentException e) {
            errors.put("category", "Please choose a valid category.");
        }
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.", errors);
        }

        // The owner is ALWAYS the authenticated student - never a value supplied by the client.
        User student = findUser(email);
        String imageUrl = files.store(image);
        try {
            Complaint c = new Complaint();
            c.setUser(student);
            c.setCategory(category);
            c.setTitle(t);
            c.setDescription(d);
            c.setLocation(l);
            c.setImageUrl(imageUrl);
            c.setStatus(ComplaintStatus.PENDING);
            complaints.saveAndFlush(c);

            ComplaintUpdate first = new ComplaintUpdate();
            first.setComplaint(c);
            first.setUpdatedBy(student);
            first.setOldStatus(null);
            first.setNewStatus(ComplaintStatus.PENDING);
            first.setRemark("Complaint submitted.");
            updates.saveAndFlush(first);
            return mapper.toDto(c, true);
        } catch (RuntimeException e) {
            files.deleteQuietly(imageUrl);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> myComplaints(String email) {
        User student = findUser(email);
        return complaints.findByUser_UserIdOrderByCreatedAtDesc(student.getUserId())
                .stream().map(c -> mapper.toDto(c, false)).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDto getMine(String email, Long id) {
        User student = findUser(email);
        Complaint c = complaints.findById(id).orElseThrow(ComplaintService::notFound);
        if (!c.getUser().getUserId().equals(student.getUserId())) {
            throw notFound(); // do not reveal that the complaint exists
        }
        return mapper.toDto(c, true);
    }

    @Transactional(readOnly = true)
    public StudentStatsDto stats(String email) {
        Long uid = findUser(email).getUserId();
        return new StudentStatsDto(
                complaints.countByUser_UserId(uid),
                complaints.countByUser_UserIdAndStatus(uid, ComplaintStatus.PENDING),
                complaints.countByUser_UserIdAndStatus(uid, ComplaintStatus.ASSIGNED),
                complaints.countByUser_UserIdAndStatus(uid, ComplaintStatus.IN_PROGRESS),
                complaints.countByUser_UserIdAndStatus(uid, ComplaintStatus.RESOLVED),
                complaints.countByUser_UserIdAndStatus(uid, ComplaintStatus.REJECTED));
    }

    /** Returns an uploaded image only to an administrator or to the student who owns the complaint. */
    @Transactional(readOnly = true)
    public Resource getImage(String email, boolean admin, String filename) {
        Complaint c = complaints.findByImageUrl("/files/" + filename).orElseThrow(ComplaintService::notFound);
        if (!admin && !c.getUser().getEmail().equalsIgnoreCase(email)) {
            throw notFound();
        }
        return files.load(filename);
    }

    private User findUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "Complaint not found.");
    }
}
