package com.example.campuscare.service;

import com.example.campuscare.dto.LoginRequest;
import com.example.campuscare.dto.SignupRequest;
import com.example.campuscare.dto.UserDto;
import com.example.campuscare.entity.Role;
import com.example.campuscare.entity.User;
import com.example.campuscare.exception.ApiException;
import com.example.campuscare.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final String allowedDomain;

    public AuthService(UserRepository users, PasswordEncoder encoder, AuthenticationManager authenticationManager,
                       SecurityContextRepository contextRepository,
                       @Value("${campuscare.email-domain:}") String allowedDomain) {
        this.users = users;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.allowedDomain = allowedDomain == null ? "" : allowedDomain.trim();
    }

    /** Public registration: always creates a STUDENT; the role is never taken from the client. */
    @Transactional
    public UserDto register(SignupRequest req) {
        String email = req.email().trim().toLowerCase();

        Map<String, String> errors = new LinkedHashMap<>();
        if (!req.password().equals(req.confirmPassword())) {
            errors.put("confirmPassword", "Passwords do not match.");
        }
        if (!allowedDomain.isEmpty() && !email.endsWith("@" + allowedDomain.toLowerCase())) {
            errors.put("email", "Please use your college email (@" + allowedDomain + ").");
        }
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.", errors);
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw duplicateEmail();
        }

        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(Role.STUDENT);
        try {
            return UserDto.from(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw duplicateEmail();
        }
    }

    /** Authenticates with Spring Security and stores the context in the HTTP session. */
    public UserDto login(LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            req.email().trim().toLowerCase(), req.password()));
        } catch (AuthenticationException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        if (request.getSession(false) != null) {
            request.changeSessionId(); // prevent session fixation
        }
        contextRepository.saveContext(context, request, response);
        return me(authentication.getName());
    }

    @Transactional(readOnly = true)
    public UserDto me(String email) {
        return users.findByEmailIgnoreCase(email)
                .map(UserDto::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
    }

    private static ApiException duplicateEmail() {
        return new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.",
                Map.of("email", "This email is already registered."));
    }
}
