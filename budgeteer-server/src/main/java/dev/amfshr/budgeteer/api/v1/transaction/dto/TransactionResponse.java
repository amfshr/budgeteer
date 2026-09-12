package dev.amfshr.budgeteer.api.v1.transaction.dto;

import dev.amfshr.budgeteer.domain.transaction.TransactionStatus;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

/**
 * One domain transaction. {@code amountMinorUnits} is signed: negative = money out.
 * {@code status} serialises as its {@code name()} string.
 */
public record TransactionResponse(
        UUID id, UUID accountId, long amountMinorUnits, String currency, TransactionStatus status,
        @Nullable String description, @Nullable String merchantName,
        @Nullable String merchantCategory, @Nullable String notes,
        boolean excludedFromAnalytics, Instant occurredAt, @Nullable Instant settledAt) {}
