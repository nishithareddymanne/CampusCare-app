package com.example.campuscare.controller;

import com.example.campuscare.exception.ApiException;
import com.example.campuscare.service.ComplaintService;
import com.example.campuscare.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/** Serves complaint photos only to the owning student or an administrator. */
@RestController
public class FileController {

    private static final Pattern SAFE_NAME =
            Pattern.compile("^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)$");

    private final ComplaintService complaintService;

    public FileController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> file(@PathVariable String filename, Authentication authentication) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image not found.");
        }
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Resource resource = complaintService.getImage(authentication.getName(), admin, filename);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(FileStorageService.contentType(filename)))
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
                .body(resource);
    }
}
