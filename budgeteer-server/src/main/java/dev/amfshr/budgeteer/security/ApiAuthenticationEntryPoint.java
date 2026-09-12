package dev.amfshr.budgeteer.security;

import dev.amfshr.budgeteer.api.common.ApiError;
import dev.amfshr.budgeteer.api.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * 401 + the ApiError envelope for unauthenticated requests to protected routes. Without this,
 * Spring Security's default entry point answers 403 — the client must be able to distinguish
 * "not logged in → go log in" (401) from "logged in but forbidden" (403).
 */
@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public ApiAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiError.of(ErrorCode.MISSING_TOKEN, request.getRequestURI())));
    }
}
