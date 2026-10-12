package com.example.campuscare.controller;

import com.example.campuscare.dto.*;
import com.example.campuscare.service.AdminComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** All /admin/** URLs are restricted to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/admin")
public class AdminComplaintController {

    private final AdminComplaintService service;

    public AdminComplaintController(AdminComplaintService service) {
        this.service = service;
    }

    @GetMapping("/complaints")
    public List<ComplaintDto> list(@RequestParam(required = false) String q,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(required = false) String category,
                                   @RequestParam(required = false) Long departmentId) {
        return service.list(q, status, category, departmentId);
    }

    @GetMapping("/complaints/{id}")
    public ComplaintDto details(@PathVariable Long id) {
        return service.details(id);
    }

    @PutMapping("/complaints/{id}/assign")
    public ComplaintDto assign(@PathVariable Long id, @Valid @RequestBody AssignRequest request,
                               Authentication authentication) {
        return service.assign(authentication.getName(), id, request);
    }

    @PutMapping("/complaints/{id}/status")
    public ComplaintDto updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request,
                                     Authentication authentication) {
        return service.updateStatus(authentication.getName(), id, request);
    }

    @GetMapping("/dashboard")
    public AdminDashboardDto dashboard() {
        return service.dashboard();
    }

    @GetMapping("/departments")
    public List<DepartmentDto> departments() {
        return service.departments();
    }

    @GetMapping("/updates")
    public List<ComplaintUpdateDto> updates() {
        return service.recentUpdates();
    }
}
