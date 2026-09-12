package dev.amfshr.budgeteer.service.ingest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Owns the "ingest then refresh balances" pairing and its error isolation — the single entry
 * point for every post-sync trigger (hourly job, post-backfill hook, dev endpoint). An ingest
 * failure never blocks the balance refresh.
 */
@Service
public class IngestOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(IngestOrchestrator.class);

    private final IngestService ingestService;
    private final BalanceRefreshService balanceRefreshService;

    public IngestOrchestrator(IngestService ingestService, BalanceRefreshService balanceRefreshService) {
        this.ingestService = ingestService;
        this.balanceRefreshService = balanceRefreshService;
    }

    /** One full raw → domain mapping pass followed by a balance refresh, each guarded. */
    public void runFullPass() {
        try {
            ingestService.ingestAll();
        } catch (Exception e) {
            log.error("Ingest pass failed", e);
        }
        try {
            balanceRefreshService.refreshAll();
        } catch (Exception e) {
            log.error("Balance refresh failed", e);
        }
    }
}
