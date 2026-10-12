package com.example.campuscare.service;

import com.example.campuscare.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Stores uploaded images under generated UUID file names after verifying type (magic bytes) and size. */
@Service
public class FileStorageService {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> CONTENT_TYPES =
            Map.of("jpg", "image/jpeg", "png", "image/png", "webp", "image/webp");

    private final Path root;

    public FileStorageService(@Value("${campuscare.upload-dir}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create upload directory " + root, e);
        }
    }

    /** @return the public URL path (e.g. /files/uuid.png) or null when no file was supplied. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        if (file.getSize() > MAX_BYTES) {
            throw invalid("Image must be 5 MB or smaller.");
        }
        String declared = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(declared)) {
            throw invalid("Only JPEG, PNG or WebP images are allowed.");
        }
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            String ext = detectExtension(head);
            if (ext == null) {
                throw invalid("The uploaded file is not a valid JPEG, PNG or WebP image.");
            }
            String name = UUID.randomUUID() + "." + ext;
            try (InputStream again = file.getInputStream()) {
                Files.copy(again, root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
            return "/files/" + name;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the uploaded image.");
        }
    }

    public Resource load(String filename) {
        Path file = root.resolve(filename).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image not found.");
        }
        return new FileSystemResource(file);
    }

    public void deleteQuietly(String publicUrl) {
        if (publicUrl == null) {
            return;
        }
        try {
            Path file = root.resolve(publicUrl.substring(publicUrl.lastIndexOf('/') + 1)).normalize();
            if (file.startsWith(root)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ignored) {
            // best effort
        }
    }

    public static String contentType(String filename) {
        String ext = filename.substring(filename.lastIndexOf('.') + 1);
        return CONTENT_TYPES.getOrDefault(ext, "application/octet-stream");
    }

    private static String detectExtension(byte[] h) {
        if (h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (h.length >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G'
                && h[4] == 0x0D && h[5] == 0x0A && h[6] == 0x1A && h[7] == 0x0A) {
            return "png";
        }
        if (h.length >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
            return "webp";
        }
        return null;
    }

    private static ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, Map.of("image", message));
    }
}
