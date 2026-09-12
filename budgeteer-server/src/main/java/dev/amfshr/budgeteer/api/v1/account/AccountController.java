package dev.amfshr.budgeteer.api.v1.account;

import dev.amfshr.budgeteer.api.common.ApiResponse;
import dev.amfshr.budgeteer.api.v1.account.dto.AccountResponse;
import dev.amfshr.budgeteer.api.v1.account.dto.AccountSummaryResponse;
import dev.amfshr.budgeteer.security.CurrentUserId;
import dev.amfshr.budgeteer.service.account.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Bank-account reads. All responses are user-scoped; an unknown or other-user's account id is a
 * 404 (never a 403 — existence is not confirmed).
 */
@RestController
@RequestMapping("/api/v1/accounts")
@Validated
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /** GET /api/v1/accounts — the user's accounts, ordered display_order then created_at. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> listAccounts(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        List<AccountResponse> accounts = accountService.listAccounts(userId, includeArchived)
                .stream().map(AccountApiMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.of(accounts));
    }

    /**
     * GET /api/v1/accounts/{id}/summary — today / week / month-to-date sums in {@code zone}.
     * {@code zone} binds natively to ZoneId; an invalid value is a 400 via the type-mismatch
     * handler.
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<ApiResponse<AccountSummaryResponse>> getSummary(
            @CurrentUserId UUID userId,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "Europe/London") ZoneId zone
    ) {
        return ResponseEntity.ok(ApiResponse.of(
                AccountApiMapper.toResponse(accountService.getSummary(userId, id, zone))));
    }
}
