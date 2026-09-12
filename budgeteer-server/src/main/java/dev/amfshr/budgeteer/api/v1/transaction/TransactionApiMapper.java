package dev.amfshr.budgeteer.api.v1.transaction;

import dev.amfshr.budgeteer.api.v1.transaction.dto.TransactionResponse;
import dev.amfshr.budgeteer.domain.transaction.Transaction;

/**
 * Maps domain transactions to the v1 wire shape. Lives in the api layer so services never
 * depend on DTOs (the mapping boundary — PR #87 review decision).
 */
final class TransactionApiMapper {

    private TransactionApiMapper() {
    }

    static TransactionResponse toResponse(Transaction tx) {
        return new TransactionResponse(
                tx.getId(),
                tx.getAccount().getId(),
                tx.getAmountMinorUnits(),
                tx.getCurrency(),
                tx.getStatus(),
                tx.getDescription(),
                tx.getMerchantName(),
                tx.getMerchantCategory(),
                tx.getNotes(),
                tx.isExcludedFromAnalytics(),
                tx.getOccurredAt(),
                tx.getSettledAt());
    }
}
