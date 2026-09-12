package dev.amfshr.budgeteer.service.transaction;

import dev.amfshr.budgeteer.api.common.ErrorCode;
import dev.amfshr.budgeteer.domain.transaction.Transaction;
import dev.amfshr.budgeteer.exception.ApiException;
import dev.amfshr.budgeteer.repository.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TransactionQueryService")
class TransactionQueryServiceTest {

    @Mock private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionQueryService service;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("null from/to default to an open-ended range")
    void defaultsOpenEndedRange() {
        when(transactionRepository.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.list(userId, null, null, null, 0, 50);

        verify(transactionRepository).findFiltered(eq(userId), isNull(),
                eq(Instant.EPOCH), eq(Instant.parse("9999-12-31T00:00:00Z")),
                eq(PageRequest.of(0, 50)));
    }

    @Test
    @DisplayName("from >= to is a validation error")
    void rejectsFromAfterTo() {
        Instant t = Instant.parse("2026-01-01T00:00:00Z");

        assertThatThrownBy(() -> service.list(userId, null, t, t, 0, 50))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode())
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
        verifyNoInteractions(transactionRepository);
    }

    @Test
    @DisplayName("returns the repository page untouched (mapping is the api layer's job)")
    void returnsRepositoryPage() {
        Page<Transaction> page = new PageImpl<>(List.of(mock(Transaction.class)), PageRequest.of(2, 1), 5);
        when(transactionRepository.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        Page<Transaction> result = service.list(userId, null, null, null, 2, 1);

        assertThat(result).isSameAs(page);
    }
}
