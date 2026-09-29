# Database Overview

The Chivon Mechanical CRM & ERP is powered by a PostgreSQL database managed via Prisma ORM.

## Core Modules & Models

### Identity
- **User:** System users (employees). Linked to a `Role`.
- **Role:** Defines access level (e.g., SUPER_ADMIN, SALES).
- **Permission:** Available actions in the system.
- **RolePermission:** Junction table mapping Roles to Permissions.

### CRM
- **Customer:** The core business entity. Has an opening balance.
- **CustomerContact:** Multiple contacts per customer. Includes a primary flag.
- **CustomerAddress:** Registered, Billing, and Shipping addresses.
- **Inquiry:** Initial customer contact.
- **Opportunity:** Qualified lead with an expected value and probability.

### Catalog
- **Product:** Products, Services, or Manpower.
- **ProductCategory:** Grouping for products.
- **StockMovement:** Tracking stock in, out, and adjustments.

### Sales & Finance
- **Quotation:** Includes revisions. Only the `isCurrent` revision is active.
- **QuotationRevision:** Snapshots of quote pricing and terms.
- **QuotationItem:** Line items in a revision.
- **SalesOrder & SalesOrderItem:** Created from a Quote. Tracks fulfilled and invoiced quantities.
- **Invoice & InvoiceItem:** Demands for payment. Created from an SO or Quote.
- **Payment & PaymentAllocation:** Tracks money received and how it's allocated across invoices.
- **CreditNote:** Reduces the outstanding balance of an invoice.

### Support
- **Task & Activity:** To-dos and system events.
- **Document:** Attachments and generated PDFs.
- **AuditLog:** Complete history of data changes.
- **CompanySetting & DocumentSetting:** Global configuration.
- **DocumentSequence:** Atomic counters for generating sequential document numbers (e.g., `INV-20260928-0001`).

## Calculations
All financial calculations are done in the service layer using `Decimal.js` and stored as `Decimal(18,2)` or `(18,4)` in the database.
- **Line Total:** `(Quantity * Rate) - Discount + VAT`
- **Document Total:** Sum of rounded line totals.
- **Outstanding Balance:** Calculated dynamically via `InvoiceTotal - SUM(Allocations) - SUM(CreditNotes)`. It is NOT stored as a column to ensure absolute accuracy.

## Status Transitions
- **Quotation:** `DRAFT → PENDING_APPROVAL → APPROVED → SENT → ACCEPTED | REJECTED`
- **Sales Order:** `DRAFT → CONFIRMED → IN_PROGRESS → PARTIALLY_FULFILLED → FULFILLED`
- **Invoice:** `DRAFT → ISSUED → PARTIALLY_PAID → PAID` (OVERDUE is dynamically calculated based on due date).
- **Payment:** `UNALLOCATED → PARTIALLY_ALLOCATED → FULLY_ALLOCATED`
