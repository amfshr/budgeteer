package dev.amfshr.budgeteer.api.v1.auth.dto;

import dev.amfshr.budgeteer.util.LogSanitizer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for login (magic link request).
 */
public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must be less than 255 characters")
        String email
) {
    /**
     * Masked: Spring MVC's DEBUG request logging prints deserialized DTOs via toString,
     * which would leak the raw email into logs (observed live 2026-09-19). Any DTO
     * carrying PII must mask its toString the same way.
     */
    @Override
    public String toString() {
        return "LoginRequest[email=" + LogSanitizer.maskEmail(email) + "]";
    }
}
