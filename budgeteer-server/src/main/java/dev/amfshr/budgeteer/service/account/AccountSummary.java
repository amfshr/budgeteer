package dev.amfshr.budgeteer.service.account;

import java.util.UUID;

/**
 * Internal read model for an account's spending summary — the service-layer result, mapped to
 * the wire shape by the api layer. {@code out} values are positive magnitudes.
 */
public record AccountSummary(
        UUID accountId, String zone,
        WindowSums today, WindowSums thisWeek, WindowSums monthToDate) {

    /** Signed-in / magnitude-out sums for one window. */
    public record WindowSums(long inMinorUnits, long outMinorUnits) {}
}
