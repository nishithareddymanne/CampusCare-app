package com.example.campuscare.config;

import com.example.campuscare.entity.Department;
import com.example.campuscare.entity.Role;
import com.example.campuscare.entity.User;
import com.example.campuscare.repository.DepartmentRepository;
import com.example.campuscare.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Seeds departments and (optionally) the very first administrator at startup. */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DepartmentRepository departments;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminName;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(DepartmentRepository departments, UserRepository users, PasswordEncoder encoder,
                           @Value("${campuscare.admin.name}") String adminName,
                           @Value("${campuscare.admin.email}") String adminEmail,
                           @Value("${campuscare.admin.password}") String adminPassword) {
        this.departments = departments;
        this.users = users;
        this.encoder = encoder;
        this.adminName = adminName;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedDepartments();
        seedAdmin();
    }

    private void seedDepartments() {
        List<Department> defaults = List.of(
                new Department("Maintenance", "maintenance@campuscare.edu"),
                new Department("Hostel", "hostel@campuscare.edu"),
                new Department("Laboratory", "laboratory@campuscare.edu"),
                new Department("Facilities", "facilities@campuscare.edu"));
        for (Department d : defaults) {
            if (departments.findByNameIgnoreCase(d.getName()).isEmpty()) {
                departments.save(d);
                log.info("Created department: {}", d.getName());
            }
        }
    }

    private void seedAdmin() {
        if (users.existsByRole(Role.ADMIN)) {
            return;
        }
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("No ADMIN account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables "
                    + "and restart to create the first administrator.");
            return;
        }
        if (adminPassword.length() < 8) {
            log.error("ADMIN_PASSWORD must be at least 8 characters. Administrator was NOT created.");
            return;
        }
        User admin = new User();
        admin.setName(adminName);
        admin.setEmail(adminEmail.trim().toLowerCase());
        admin.setPasswordHash(encoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.info("First administrator created: {}", admin.getEmail());
    }
}
