package com.example.campuscare.security;

import com.example.campuscare.dto.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Session-based authentication (JSESSIONID, HttpOnly) with CSRF protection.
 * The XSRF-TOKEN cookie is readable by JavaScript, which echoes it in the X-XSRF-TOKEN header.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, SecurityContextRepository contextRepository,
                                           ObjectMapper mapper) throws Exception {

        AuthenticationEntryPoint entryPoint = (req, res, ex) -> {
            if (isPageRequest(req)) {
                res.sendRedirect("/login.html");
            } else {
                writeJson(mapper, res, 401, "Please log in to continue.");
            }
        };
        AccessDeniedHandler deniedHandler = (req, res, ex) -> {
            if (isPageRequest(req)) {
                res.sendRedirect("/login.html");
            } else {
                writeJson(mapper, res, 403, "You do not have permission to perform this action.");
            }
        };

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/auth/login", "/auth/signup"))
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .securityContext(sc -> sc.securityContextRepository(contextRepository))
            .headers(h -> h.contentSecurityPolicy(csp -> csp.policyDirectives(
                "default-src 'self'; script-src 'self'; "
                + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                + "font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; "
                + "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/login.html", "/register.html",
                                 "/css/**", "/js/**", "/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/signup").permitAll()
                .requestMatchers("/student-dashboard.html", "/raise-complaint.html", "/my-complaints.html",
                                 "/complaint-details.html", "/profile.html").hasRole("STUDENT")
                .requestMatchers("/admin-dashboard.html", "/admin-complaints.html", "/admin/**").hasRole("ADMIN")
                .requestMatchers("/complaints/**").hasRole("STUDENT")
                .requestMatchers("/auth/me", "/files/**").authenticated()
                .anyRequest().denyAll())
            .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint).accessDeniedHandler(deniedHandler))
            .logout(l -> l
                .logoutUrl("/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((req, res, auth) -> {
                    res.setStatus(200);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"message\":\"Logged out\"}");
                }));
        return http.build();
    }

    private static boolean isPageRequest(HttpServletRequest req) {
        return req.getRequestURI().endsWith(".html");
    }

    private static void writeJson(ObjectMapper mapper, HttpServletResponse res, int status, String message)
            throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getWriter(), new ApiError(status, message, null));
    }

    /** Forces the deferred CSRF token to be generated so the XSRF-TOKEN cookie is set on every response. */
    static final class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain) throws ServletException, IOException {
            CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (token != null) {
                token.getToken();
            }
            chain.doFilter(request, response);
        }
    }
}
