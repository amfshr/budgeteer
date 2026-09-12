package dev.amfshr.budgeteer.service.ingest;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("IngestOrchestrator")
class IngestOrchestratorTest {

    @Mock private IngestService ingestService;
    @Mock private BalanceRefreshService balanceRefreshService;

    @InjectMocks
    private IngestOrchestrator orchestrator;

    @Test
    @DisplayName("runs ingest then balance refresh, in order")
    void runsIngestThenBalances() {
        orchestrator.runFullPass();

        InOrder inOrder = inOrder(ingestService, balanceRefreshService);
        inOrder.verify(ingestService).ingestAll();
        inOrder.verify(balanceRefreshService).refreshAll();
    }

    @Test
    @DisplayName("ingest failure does not block the balance refresh")
    void ingestFailureDoesNotBlockBalances() {
        doThrow(new RuntimeException("ingest failed")).when(ingestService).ingestAll();

        orchestrator.runFullPass();

        verify(balanceRefreshService).refreshAll();
    }

    @Test
    @DisplayName("balance failure is swallowed (callers never see it)")
    void balanceFailureSwallowed() {
        doThrow(new RuntimeException("refresh failed")).when(balanceRefreshService).refreshAll();

        orchestrator.runFullPass();

        verify(ingestService).ingestAll();
    }
}
