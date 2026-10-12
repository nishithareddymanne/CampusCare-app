package com.example.campuscare.controller;

import com.example.campuscare.dto.ComplaintDto;
import com.example.campuscare.dto.StudentStatsDto;
import com.example.campuscare.service.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /** multipart/form-data: title, category, description, location, image (optional). */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintDto> create(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String location,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        ComplaintDto created = complaintService.create(authentication.getName(), title, category,
                description, location, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    public List<ComplaintDto> mine(Authentication authentication) {
        return complaintService.myComplaints(authentication.getName());
    }

    @GetMapping("/stats")
    public StudentStatsDto stats(Authentication authentication) {
        return complaintService.stats(authentication.getName());
    }

    @GetMapping("/{id}")
    public ComplaintDto one(@PathVariable Long id, Authentication authentication) {
        return complaintService.getMine(authentication.getName(), id);
    }
}
