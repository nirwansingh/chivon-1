# Testing Guide

The project uses a combination of Vitest for Unit/Integration testing and Playwright for End-to-End (E2E) testing.

## Unit and Integration Tests
Unit tests cover isolated logic like money rounding, sequence generation, and permissions. Integration tests cover database interactions via the Service layer (e.g., converting a Quotation to a Sales Order).

### Running Tests
To run all unit and integration tests:
```bash
npm run test
```

### Framework
- **Test Runner:** Vitest (`vitest.config.ts`)
- **Environment:** Node (via `jsdom` for React components if needed)
- **Database:** Integration tests run against the local PostgreSQL database defined in `.env`.

*Note: E2E tests are excluded from the Vitest runner.*

## End-to-End (E2E) Tests
E2E tests verify the complete user journey in a real browser instance.

### Running E2E Tests
```bash
npm run e2e
```

### Framework
- **Test Runner:** Playwright (`playwright.config.ts`)
- **Location:** `tests/e2e/workflow.spec.ts`

*Known Issue: If you encounter a driver download error (404 Azure CDN) for Playwright 1.57.0, E2E testing is temporarily blocked on your network/environment.*
