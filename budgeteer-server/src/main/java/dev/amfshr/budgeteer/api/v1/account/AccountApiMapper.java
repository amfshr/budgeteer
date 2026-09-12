package dev.amfshr.budgeteer.api.v1.account;

import dev.amfshr.budgeteer.api.v1.account.dto.AccountResponse;
import dev.amfshr.budgeteer.api.v1.account.dto.AccountSummaryResponse;
import dev.amfshr.budgeteer.domain.account.Account;
import dev.amfshr.budgeteer.service.account.AccountSummary;

/**
 * Maps service-layer types to the v1 wire shapes. Lives in the api layer so services never
 * depend on DTOs (the mapping boundary — PR #87 review decision).
 */
final class AccountApiMapper {

    private AccountApiMapper() {
    }

    static AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getProvider(),
                account.getAccountType(),
                account.getInstitutionName(),
                account.getDisplayName(),
                account.getCurrency(),
                account.getBalanceMinorUnits(),
                account.getBalanceAsOf(),
                account.getCreditLimitMinorUnits(),
                account.getDisplayOrder(),
                account.isArchived());
    }

    static AccountSummaryResponse toResponse(AccountSummary summary) {
        return new AccountSummaryResponse(
                summary.accountId(),
                summary.zone(),
                toWindow(summary.today()),
                toWindow(summary.thisWeek()),
                toWindow(summary.monthToDate()));
    }

    private static AccountSummaryResponse.WindowSums toWindow(AccountSummary.WindowSums sums) {
        return new AccountSummaryResponse.WindowSums(sums.inMinorUnits(), sums.outMinorUnits());
    }
}
