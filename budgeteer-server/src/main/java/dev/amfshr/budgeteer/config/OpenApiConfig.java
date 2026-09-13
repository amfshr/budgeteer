package dev.amfshr.budgeteer.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for the generated spec ({@code /v3/api-docs}) and Swagger UI
 * ({@code /swagger-ui.html}). Generation is disabled by default and switched on by the
 * dev profile (springdoc.* properties) — the committed snapshot at
 * {@code docs/api/openapi.json} is the reviewable contract, regenerated with
 * {@code scripts/generate-openapi.sh}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI budgeteerOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Budgeteer API")
                .description("Personal Monzo-integrated budgeting app. All responses use the "
                        + "ApiResponse/ApiError envelope; authentication is a JWE session cookie "
                        + "obtained via the magic-link flow (dev: POST /api/dev/auth/quick-login). "
                        + "Unauthenticated requests to protected routes return 401 with an "
                        + "ApiError envelope (code MISSING_TOKEN).")
                .version("v1"));
    }
}
