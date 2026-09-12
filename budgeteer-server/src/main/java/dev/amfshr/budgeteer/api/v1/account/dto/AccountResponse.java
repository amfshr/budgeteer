package dev.amfshr.budgeteer.api.v1.account.dto;

import dev.amfshr.budgeteer.domain.account.AccountType;
import dev.amfshr.budgeteer.domain.account.Provider;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

/**
 * One bank account as the product sees it. Balance fields are null until the first refresh.
 * Enums serialise as their {@code name()} strings — renaming a domain enum value is a
 * breaking API change (accepted deliberately, Session 01).
 */
public record AccountResponse(
        UUID id, Provider provider, AccountType accountType, String institutionName,
        @Nullable String displayName, String currency,
        @Nullable Long balanceMinorUnits, @Nullable Instant balanceAsOf,
        @Nullable Long creditLimitMinorUnits, int displayOrder, boolean archived) {}
