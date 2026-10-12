package com.example.campuscare.controller;

import com.example.campuscare.dto.LoginRequest;
import com.example.campuscare.dto.SignupRequest;
import com.example.campuscare.dto.UserDto;
import com.example.campuscare.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
                         HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    /** Returns the currently logged-in user (used by the frontend to guard pages). Logout is POST /auth/logout. */
    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        return authService.me(authentication.getName());
    }
}
