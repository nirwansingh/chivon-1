# CHIVON MECHANICAL CRM & ERP — MASTER SPECIFICATION (V1)

**Source of truth for business requirements.** Build order and progress live in `IMPLEMENTATION_PLAN.md`; engineering standards live in `SKILL.md`.

| Item | Value |
|---|---|
| Company | Chivon Mechanical (UAE), single company |
| Currency / VAT | AED / 5% default (configurable) |
| Users | ~5–6 |
| Devices | Desktop-first, fully responsive for mobile/tablet |
| V1 | Internal CRM + Sales + Basic Finance + Documents |
| V2 (not now) | Website inquiries, email ingestion, AI processing, WhatsApp API, advanced ERP |
| Future | Procurement, inventory expansion, communication automation |

> Section 33 lists ambiguities in the original draft and the **default resolutions** the agent must apply.

---

## 1. PRODUCT OBJECTIVE

An internal CRM/ERP that manages the whole commercial lifecycle:

`Customer / Opportunity → Quotation → Sales Order → Invoice → Payment → Receivable → SOA`

Entities managed: Customers, Contacts, Addresses, Products/Services, Inquiries, Opportunities, Tasks, Follow-ups, Quotations, Quotation Revisions, Sales Orders, Invoices, Payments, Payment Allocations, Credit Notes, SOA, Documents, Users, Roles, Permissions, Audit Logs, Dashboard.

---

## 2. V1 SCOPE

The agent must **not accidentally build V2 functionality**.

**V1 includes:** Authentication, Users, Roles, Permissions, Dashboard, Customers (+Contacts, Addresses), Products, Services, Stock information, Inquiries (manual only), Opportunities, Quotations (+Revisions), Sales Orders, Invoices, Payments, Payment receipts, Credit Notes (minimal, see §16.6), SOA, Receivables, Tasks, Follow-ups, Documents, Audit logs, PDF generation/download, WhatsApp share-link helper, Search, Reports, Company settings.

**V1 excludes:** Website inquiry API/lead capture, Outlook integration/email reading, AI email classification, AI quotation generation, WhatsApp API, automatic notifications, Procurement, Purchase Orders, Supplier management, multiple warehouses, multi-company, advanced accounting, bank API/feeds, any AI automation.

Excluded modules appear in the UI only as **Coming Soon** (non-breaking), never as half-implemented features.

---

## 3. BUSINESS WORKFLOW

```
Inquiry (manual) → Opportunity → Customer → Quotation (+Revisions) → Sales Order → Invoice → Payment → SOA
```

Allowed shortcuts: Customer → Quotation, Customer → Opportunity, Opportunity → Quotation, Quotation → Sales Order, Sales Order → Invoice (and Quotation → Invoice, see §33 R4).

**An invoice can never exist without a linked Quotation or Sales Order.**

---

## 4. TECHNOLOGY & ARCHITECTURE

- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons.
- **Backend:** Next.js server-side functionality + Prisma ORM + **PostgreSQL from day one (including local dev; no SQLite)**. No separate Express/Nest backend.
- **Layering:** `React UI → Server Actions / Route Handlers → Service Layer → Prisma → PostgreSQL`.
- "Simple authorization" means no elaborate policy engine in V1. It never means exposing Prisma/DB credentials or unrestricted DB operations to the browser. All DB access is server-side.

---

## 5. AUTHENTICATION

Auth.js (NextAuth-compatible) with Prisma. V1: login, logout, session, password authentication, user status, role. **No public registration**; only authorized administrators create users.

User fields: `id, name, email, passwordHash, roleId, avatar, phone, status (ACTIVE|INACTIVE), createdAt, updatedAt, lastLoginAt`.

---

## 6. ROLES & PERMISSIONS

### 6.1 Model
Tables: `User, Role, Permission, RolePermission`. Permissions are data, never hard-coded in components. Format `MODULE.ACTION`, e.g. `CUSTOMER.VIEW/CREATE/EDIT/DELETE`, `QUOTATION.VIEW/CREATE/EDIT/DELETE/APPROVE/SEND/DOWNLOAD`, `SALES_ORDER.VIEW/CREATE/EDIT/CANCEL`, `INVOICE.VIEW/CREATE/EDIT/CANCEL`, `PAYMENT.VIEW/CREATE/REVERSE`, `AUDIT.VIEW`, `USER.MANAGE`, `ROLE.MANAGE`.
`EXPORT`, `DOWNLOAD`, `SHARE` and `APPROVE` are **separate** permissions wherever applicable.

### 6.2 Default roles (seeded)
`SUPER_ADMIN, ADMIN, MANAGER, SALES, ACCOUNTS, INVENTORY, VIEWER`. Administrators can edit role permissions and create custom roles.

| Role | Access |
|---|---|
| SUPER_ADMIN | Everything |
| ADMIN | Almost full operational access; cannot remove/change Super Admin |
| MANAGER | Customers, Opportunities, Quotes, Sales Orders, Invoices, Payments, Dashboard, Reports, Tasks, Documents; can approve documents |
| SALES | Customers, Opportunities, Quotes, Sales Orders, Tasks, Follow-ups; cannot modify accounting records |
| ACCOUNTS | Customers (view), Invoices, Payments, SOA, Receivables, Reports |
| INVENTORY | Products, Services, Stock, Customers (view) |
| VIEWER | Read-only on permitted modules |

---

## 7. LAYOUT, NAVIGATION & DESIGN

**Desktop:** top bar (logo, universal search, user menu, settings) + left sidebar + main content. **Mobile:** top bar, content, collapsible sidebar or bottom navigation.

**Sidebar:**
- Dashboard
- CRM: Inquiries, Opportunities, Customers
- Sales: Quotations, Sales Orders, Invoices
- Finance: Payments, Receivables, Statements of Account
- Catalog: Products, Services, Stock
- Activities: Tasks, Follow-ups
- Documents · Reports · Audit Logs
- Administration: Users, Roles & Permissions, Settings
- Coming Soon: Procurement, Suppliers, Purchase Orders, Email Automation, WhatsApp, AI Automation, Website Inquiries

**Design system:** White, Deep Corporate Blue, Sky Blue, Light Blue, Neutral Gray; Success Green, Warning Amber, Danger Red. Glassmorphism sparingly. This is an enterprise app, **not a flashy landing page**; prioritize readability, density, hierarchy, speed, consistency. Framer Motion only for: sidebar, modal, drawer, table expansion, page transition, toast, dropdown, status changes. Avoid excessive animation. Use skeleton loading and lazy loading.

---

## 8. DASHBOARD

Role-specific; real database data only.

**Admin/Manager dashboard**
- Cards: Total Customers, Active Opportunities, Quotation Value, Sales Order Value, Invoice Value, Received Payments, Outstanding Receivables, Overdue Receivables.
- Charts: quotation value over time, invoice value over time, payment collection, opportunity pipeline, receivables aging.
- Tables: recent quotations, recent invoices, overdue invoices, upcoming follow-ups, recent payments.

**Filters (every widget):** Today, This Week, This Month, This Quarter, This Financial Year, Custom. Financial year start/end is configurable in Company Settings (not hard-coded).

**Export:** CSV and PDF for appropriate reports, respecting the current date filter.

---

## 9. INQUIRIES (manual entry only in V1)

Fields: Inquiry ID, Title, Source, Customer, Contact, Product/Service, Quantity, Description, Project, Site, Expected Value, Expected Closing Date, Assigned To, Status, Priority, Notes, Created By, Created At, Updated At.

Status (exactly): `NEW, CONTACTED, QUALIFIED, UNQUALIFIED, FOLLOW_UP_REQUIRED, CONVERTED, LOST`.

Detail page tabs: Overview, Customer, Product/Service, Activity, Tasks, Notes, Attachments, Timeline.

**Convert to Opportunity:** never delete the inquiry; set `status = CONVERTED` and `opportunityId`, preserving traceability.

---

## 10. OPPORTUNITIES

Fields: Opportunity ID, Name, Customer, Contact, Description, Expected Value, Probability, Expected Closing Date, Assigned User, Source, Competitor, Project, Site, Products/Services, Notes, Status.

Status: `NEW, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST`.

**Kanban:** one column per status. Cards show opportunity, customer, value, probability, expected close, assigned user. Drag/drop updates status (server-side, audited).

---

## 11. CUSTOMERS

### 11.1 Creation
From Customers → Add Customer, **or inline** while creating a Quotation, Opportunity or Sales Order: search existing → not found → "+ Add Customer" → quick form → save → automatically attached to the current document. The same pattern applies to Products/Services.

### 11.2 Fields
Customer ID, Company Name, Customer Type, VAT Number, TRN, Email, Phone, Website, Industry, Customer Status, Notes, Opening Receivable (with as-of date, see §16.5).

### 11.3 Contacts (many per customer)
Name, Designation, Email, Phone, Mobile, WhatsApp, Primary Contact flag, Notes.

### 11.4 Addresses
Separate table `CustomerAddress` (never address columns on Customer): `type (REGISTERED|BILLING|SHIPPING), addressLine1, addressLine2, city, state, country, postalCode`. Each independently editable.

### 11.5 Customer 360 page (one of the most important screens)
Tabs: Overview, Contacts, Addresses, Inquiries, Opportunities, Quotations, Sales Orders, Invoices, Payments, SOA, Tasks, Documents, Activity.
Financial summary: Total Invoiced, Total Paid, Outstanding, Overdue.

### 11.6 Deletion
Hard delete only for customers with no transactional dependencies. Otherwise block with: *"Customer cannot be deleted because transactional records exist."* (Future: `ARCHIVED`.)

---

## 12. PRODUCTS, SERVICES & INVENTORY

**Types:** `PRODUCT, SERVICE, MANPOWER`.
**Fields:** SKU, Name, Type, Category, Description, Unit, Rate, VAT Rate, Stock Quantity, Minimum Stock, Status.
**Units:** `NOS, KG, HOURS, DAYS, METER, SET, LOT, OTHER`.
**Inline creation:** while creating a quotation, product search → not found → "+ Add Product" → quick form → save → automatically inserted into the current document.

**Inventory V1 (no warehouses):** Product, Current Stock, Minimum Stock, Stock Adjustment, Stock Movement History. Movement types `OPENING, IN, OUT, ADJUSTMENT`. Current stock is derived from movements. Example: Opening 100, OUT 20, IN 50, Adjustment −5 → **125**.
"Services" and "Stock" sidebar items are filtered views of the product catalog / stock data.

---

## 13. QUOTATIONS

### 13.1 Numbering
`QT-YYYYMMDD-0001`; increments per day; never resets annually; DB-enforced unique. Example: `QT-20260928-0001`, `QT-20260928-0002`.

### 13.2 Structure
`Quotation → QuotationRevision (Rev 0, 1, 2…) → QuotationItems`. Exactly one revision is flagged CURRENT.

### 13.3 Edit & Create Revision
- **Edit** on a saved quotation creates the next revision (Rev 1, …); the previous revision stays intact.
- **More → Create Revision** also creates a new revision. Both paths produce a new revision.

### 13.4 Revision deletion
Allowed only for revisions that were **never sent AND** are not linked to downstream transactions. Never a revision used for a Sales Order.

### 13.5 Sending
Only the **latest** revision may be sent. Rev 0 (already SENT) cannot be sent again once Rev 1 exists.

### 13.6 Statuses
`DRAFT, PENDING_APPROVAL, APPROVED, SENT, ACCEPTED, REJECTED, EXPIRED, CANCELLED` (transitions: §26.3).

### 13.7 Line items
Product/Service, Description, Quantity, Unit, Rate, Discount Type (`PERCENTAGE|FIXED_AMOUNT`), Discount Value, Discount Amount, Tax Rate, Tax Amount, Line Subtotal, Line Total.

### 13.8 Calculations (shared by quotation, SO, invoice, credit note)
```
Gross    = Quantity × Rate
Discount = percentage ? Gross × pct / 100 : fixed amount
Net      = Gross − Discount
VAT      = Net × VATRate / 100
Total    = Net + VAT
```
Document totals: Subtotal, Discount, Taxable Amount, VAT, Grand Total. Default VAT 5%; document-level VAT configurable. Round each line to 2 dp (half-up) and sum rounded lines.

### 13.9 Quotation PDF (professional formatting)
- **Company:** logo, name, address, contact information, TRN/VAT number.
- **Document:** quotation number, revision number, date, valid until.
- **Customer:** customer information, billing address, shipping address, contact person, project/site.
- **Line items:** quantity, unit, description, rate, discount, VAT, amount.
- **Totals:** subtotal, discount, VAT, grand total, amount in words.
- **Commercial:** payment terms, delivery terms, validity, notes, terms & conditions, bank details.
- **Sign-off:** prepared by, approved by, signature/stamp area.

### 13.10 Actions
Download PDF, Preview PDF, Convert to Sales Order, Convert to Invoice, Share, Edit, Create Revision, Duplicate, Print (plus Approve/Submit/Cancel per workflow).

### 13.11 Quotation → Sales Order
Do not duplicate customer or product records. Store `quotationId` and `quotationRevisionId` on the Sales Order. The quotation remains as a historical record (status conversion, not destructive replacement).

---

## 14. SALES ORDERS

- **Numbering:** `SO-YYYYMMDD-0001` (no annual reset).
- **Statuses:** `DRAFT, CONFIRMED, IN_PROGRESS, PARTIALLY_FULFILLED, FULFILLED, CANCELLED`.
- **Fulfillment:** no delivery challan; manual tracking per line: Ordered Qty, Fulfilled Qty, Remaining Qty.
- **Partial invoicing (important):** SO 100,000 → Invoice 40,000 → Invoice 30,000 → Remaining 30,000. SO detail shows **Total SO / Invoiced / Remaining**. Invoice quantity/value must never exceed remaining eligible amount.
- **Cancellation:** requires confirmation. Cancelled SOs cannot get new invoices or be modified unless an authorized administrator reopens them.

---

## 15. INVOICES

- Origin: **Quotation OR Sales Order only** — no free-standing invoices in V1.
- **Conversion rule:** conversion keeps the source (Quotation/SO) as a historical record and links to it; nothing is replaced or deleted.
- **Numbering:** `INV-YYYYMMDD-0001` (no annual reset).
- **Statuses:** `DRAFT, PENDING_APPROVAL, APPROVED, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED`. `OVERDUE` is derived (due date passed and outstanding > 0). Approval statuses apply only when approval is enabled (§20).
- **Outstanding is never stored as a mutable source of truth:**
  `Outstanding = Invoice Total − Valid Payment Allocations − Valid Credit Notes`
- Fields include invoice date, due date, payment terms, source links, items, totals.

---

## 16. PAYMENTS, CREDIT NOTES & OPENING BALANCE

### 16.1 Payments
Methods: `Cash, Bank Transfer, Cheque, Card, Other`. Fields: Payment ID, Customer, Amount, Payment Date, Payment Method, Reference Number, Bank, Cheque Number, Notes, Attachment, Status, Created By. Numbering `PAY-YYYYMMDD-0001`.

### 16.2 Allocation (many-to-many)
One payment → many invoices; one invoice → many payments. Example: Payment 100,000 → Invoice A 40,000, B 30,000, C 20,000, Unallocated 10,000.
Allocation states: `UNALLOCATED, PARTIALLY_ALLOCATED, FULLY_ALLOCATED`. Accounts can allocate a remaining balance later.

### 16.3 Reversal
Never silently edit a posted payment. **Reverse Payment** creates a reversal transaction; the original stays in the audit history.

### 16.4 Payment receipt PDF
Payment Receipt Number (`PAY-…`), Customer, Payment Date, Method, Reference, Amount, Allocated Invoices, Remaining Unallocated, Amount in words, Company details, Authorized by.

### 16.5 Opening balance
Per customer "Opening Receivable" (with date) for balances that exist outside the app; appears in SOA and financial summaries.

### 16.6 Credit notes (minimal in V1)
Issued against an invoice (amount ≤ its outstanding), number `CN-YYYYMMDD-0001`, reduces outstanding, appears in SOA, has a PDF and audit entries. No broader credit-note module in V1.

---

## 17. SOA & RECEIVABLES

### 17.1 Statement of Account (Finance → Statement of Account)
Select customer + From/To dates. Shows: Opening Balance, Invoices, Credit Notes, Payments, Adjustments, Closing Balance. Actions: Generate PDF, Download, Print.

### 17.2 Aging
Buckets: Current, 1–30, 31–60, 61–90, 90+ days — calculated from **Invoice Due Date**, not creation date.

### 17.3 Receivables (Finance → Receivables)
Columns: Customer, Invoice, Invoice Date, Due Date, Invoice Amount, Paid, Outstanding, Days Overdue, Status.
Filters: Customer, Status, Date, Assigned salesperson, Aging bucket.

---

## 18. TASKS, FOLLOW-UPS & TIMELINE

**Task fields:** Task ID, Title, Description, Assigned To, Created By, Due Date, Priority, Status, and optional links to Customer, Inquiry, Opportunity, Quotation, Sales Order, Invoice.
**Status:** `TODO, IN_PROGRESS, COMPLETED, CANCELLED`. **Priority:** `LOW, MEDIUM, HIGH, URGENT`.
"Follow-ups" is a filtered view of Tasks. No automated notification engine in V1; use visual indicators: Overdue, Due Today, Upcoming, Completed.

**Activity timeline:** every customer has a chronological timeline (quotation created/revised/sent/accepted, task assigned, SO created, invoice created, payment received…) — the CRM's "memory".

---

## 19. DOCUMENTS & STORAGE

- **Categories:** Customer Document, Quotation PDF, Sales Order PDF, Invoice PDF, Payment Receipt, Other.
- **Metadata:** fileName, fileType, fileSize, storagePath, uploadedBy, createdAt, relatedEntity.
- Files are **never** stored as database blobs. Use managed object storage (Supabase Storage for V1) behind an abstract `StorageService` so the provider can be replaced.
- **Sharing (V1):** generate PDF → download → user sends manually. No public document portal; architect the document service so secure token links can be added later.
- **Preview:** Preview PDF with Download, Print, Share, Close.

---

## 20. APPROVALS

Role-based only (no amount thresholds in V1). Documents: Quotation, Sales Order, Invoice.
Flow: `DRAFT → PENDING_APPROVAL → APPROVED → SENT / ISSUED`.
- **Quotation:** Salesperson submits; Manager/Admin approves or rejects. Rejection requires a reason; the salesperson can edit and resubmit.
- **Invoice:** Accounts/Admin creates; if approval is required: `DRAFT → PENDING_APPROVAL → APPROVED → ISSUED`.
- Approval requirement is configurable per document type (defaults in §33 R3).
- Future: amount thresholds, department approval, multi-level approval.

---

## 21. AUDIT LOG

Log: `LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, REJECT, SEND, DOWNLOAD, EXPORT, CONVERT, CANCEL, PAYMENT, PAYMENT_REVERSAL, PERMISSION_CHANGE, ROLE_CHANGE, USER_CHANGE`.
Structure: `id, userId, action, module, entityType, entityId, description, beforeData, afterData, ipAddress, userAgent, createdAt`.
Audit logs are never editable through the UI. UI: list with filters and per-record history showing user, timestamp, field, old value, new value.

---

## 22. SHARED SERVICES

### 22.1 DocumentNumberService (single centralized service)
Supports `QT, SO, INV, PAY, CN`; guarantees uniqueness; never generated ad hoc inside modules. Date component uses the Dubai calendar date (§33 R6).

### 22.2 PdfService
One engine, structured data in, templates: `QuotationTemplate, SalesOrderTemplate, InvoiceTemplate, PaymentReceiptTemplate, SOATemplate` (+ credit note). **Server-side, deterministic** generation — not browser screenshots (`html2canvas`). Output must look identical regardless of browser.
File names: `QT-20260928-0001-REV2.pdf`, `SO-…pdf`, `INV-…pdf`, `PAY-…pdf`.
All company details come from `CompanySetting` — never hard-coded in templates.

### 22.3 Search
Universal search across Customers, Contacts, Products, Inquiries, Opportunities, Quotations, Sales Orders, Invoices, Payments. Debounce 250–300 ms. Results grouped by type; clicking navigates directly to the record.

---

## 23. COMMUNICATION & V2 READINESS

V1 provides **interfaces only** plus mocks: `EmailService, WhatsAppService, CommunicationService, AIService, LeadCaptureService, NotificationService` with `MockEmailService`, `MockWhatsAppService`.
**WhatsApp V1:** generate PDF → download → share manually. Provide a `WhatsApp Share` helper that can generate a `wa.me/?text=…` link; do not present it as WhatsApp API integration.
Later: Microsoft Graph (Outlook), Meta WhatsApp Cloud API.

Long-term direction (not V1; the V1 data model must not prevent it): Website/Email inquiry → AI extraction (customer, project, site, scope, quantity, specification, deadline, payment terms, attachments) → Inquiry → Opportunity → AI-assisted quotation draft → human review → approval → send → customer PO → Sales Order → Procurement → Execution → Invoice → Payment → SOA.

---

## 24. DATA ARCHITECTURE

### 24.1 Models
`User, Role, Permission, RolePermission` · `Customer, CustomerContact, CustomerAddress` · `Inquiry, Opportunity, OpportunityItem` · `Product, ProductCategory, StockMovement` · `Quotation, QuotationRevision, QuotationItem` · `SalesOrder, SalesOrderItem` · `Invoice, InvoiceItem` · `Payment, PaymentAllocation` · `CreditNote, CreditNoteItem` · `Task, Activity` · `Document` · `AuditLog` · `CompanySetting, DocumentSetting` (+ a document-sequence table for numbering).

### 24.2 Relationships
- Customer → Contacts, Addresses, Inquiries, Opportunities, Quotations, Sales Orders, Invoices, Payments, Tasks, Documents.
- Quotation → Customer, Opportunity, Revisions → Items.
- SalesOrder → Customer, Quotation, QuotationRevision, Items.
- Invoice → Customer, Quotation?, SalesOrder?, Items — **at least one source required** (validate + DB check).
- Payment → Customer, PaymentAllocations → (Invoice, Amount).

### 24.3 Money
Never floating point. Use `Decimal` (e.g. `Decimal(18,2)`, or more precision where needed) for: Rate, Discount, VAT, Invoice Total, Payment, Outstanding, Stock valuation.

### 24.4 Atomic operations (single DB transaction each)
Create quotation, create revision, convert quotation → SO, convert SO → invoice, record payment + allocations, reverse payment, approve document, cancel document. Any failure rolls back everything.

### 24.5 Conversion services
`QuotationService.convertToSalesOrder()` and `SalesOrderService.convertToInvoice()` — never in React components.

### 24.6 Service layer
`CustomerService, InquiryService, OpportunityService, ProductService, QuotationService, SalesOrderService, InvoiceService, PaymentService, CreditNoteService, SOAService, TaskService, DocumentService, AuditService, PdfService, PermissionService, DashboardService, SearchService, DocumentNumberService`.

---

## 25. APPLICATION STRUCTURE & UI ENGINEERING

**Routes:** `app/(auth)/login`, `dashboard`, `customers` (`new`, `[id]`), `inquiries`, `opportunities`, `quotations` (`new`, `[id]`), `sales-orders`, `invoices`, `payments`, `soa`, `products`, `tasks`, `documents`, `reports`, `audit`, `settings`, `api`.

**Reusable components (no duplication):** DataTable, SearchInput, PageHeader, StatusBadge, ConfirmDialog, FormModal, Drawer, EntitySelector, CustomerSelector, ProductSelector, MoneyDisplay, DateDisplay, DocumentActions, PdfPreview, Timeline, ActivityTimeline, EmptyState, LoadingState, ErrorState, Pagination, FilterBar.

**Forms:** React Hook Form + Zod; **client and server validation** on every form.
**Errors:** every operation returns `{ success, data, error, message }`. Never expose raw Prisma errors (user sees e.g. "Unable to create quotation. Please try again."; developers see the logged technical error).
**Toasts:** react-toastify for Success/Error/Warning/Info (e.g. "Quotation created successfully.", "Quotation revision created.", "Sales Order created.", "Invoice generated.", "Payment recorded.", "Customer updated."). No notification engine in V1.
**Loading:** every async operation has skeleton, spinner, and disabled submit.
**Duplicate-submission protection:** for financial/document creation the button is disabled, a transaction/idempotency ID is generated, and DB uniqueness constraints also protect against duplicates.
**Standard document action bar** (same layout everywhere): `[Edit] [Approve] [Download PDF] [Share] [Convert] [More]`.
**Standard record detail page:** Header (document number, status, actions) → summary cards → main information → line items → financial summary → timeline → documents → related records. Consistent across Customer, Opportunity, Quotation, SO, Invoice, Payment.
**Lineage:** every document shows clickable source links (e.g. Invoice → Source SO → Original Quote + Revision) and a visual chain `QT-0001 Rev 2 → SO-0003 → INV-0007 → PAY-0010`.

**Responsiveness:** desktop = dense tables, sidebar, multi-column, dashboard grids. Mobile = cards, horizontal scrolling tables only where unavoidable, collapsible filters, bottom action bars, stacked forms. Critical mobile workflows: customer lookup/details, opportunity, quote viewing, PDF viewing, task update, payment viewing.

---

## 26. BUSINESS RULES & INTEGRITY

### 26.1 Validation
Quantity > 0; Rate ≥ 0; Discount ≥ 0; VAT ≥ 0; Payment > 0; Invoice total > 0. Document status controls allowed actions.

### 26.2 No orphan financial documents
Prevent: invoice without source; payment without customer; allocation exceeding payment; allocation exceeding invoice balance; invoice exceeding SO remaining.

### 26.3 Status machines (arbitrary changes rejected)
- **Quotation:** `DRAFT → PENDING_APPROVAL → APPROVED | REJECTED`; `REJECTED → PENDING_APPROVAL` (after edit, approval-stage rejections); `APPROVED → SENT → ACCEPTED | REJECTED | EXPIRED`; any non-terminal → `CANCELLED`. `SENT → DRAFT` is not allowed except via the revision process.
- **Sales Order:** `DRAFT → CONFIRMED → IN_PROGRESS → PARTIALLY_FULFILLED → FULFILLED`; `CANCELLED`; admin reopen.
- **Invoice:** `DRAFT → [PENDING_APPROVAL → APPROVED] → ISSUED → PARTIALLY_PAID → PAID`; `CANCELLED` only when no valid allocations; `OVERDUE` derived.

### 26.4 Cancelled records
Never physically delete: issued invoices, posted payments, approved quotes, confirmed SOs. Set `status = CANCELLED` with `cancelledBy, cancelledAt, cancellationReason`.

---

## 27. SETTINGS & REPORTS

**Settings sections:** Company, Users, Roles, Permissions, Document Branding, VAT, Financial Year, Numbering, Payment Methods, Units, Product Categories, System Preferences.
**Company settings:** Company Name, Logo, Address, Phone, Email, Website, TRN, VAT, Bank Name, Account Name, IBAN, SWIFT, Payment Instructions (also default terms/payment terms used by PDFs).

**Reports (V1):** Sales, Quotation, Sales Order, Invoice, Payment, Receivables, Aging, Customer Statement, Product, Opportunity Pipeline. Each supports Date, Customer, User, Status filters where relevant; CSV/PDF export (permission-gated, audited).

---

## 28. SECURITY, LOGGING, BACKUP & ACCESSIBILITY

- **Security baseline:** HTTPS, secure cookies, password hashing, environment secrets, input validation, CSRF protection where applicable, XSS-safe rendering, SQL-injection protection via Prisma, file type validation, file size limits. No sensitive credentials in frontend code.
- **Uploads:** allow PDF, PNG, JPG, JPEG, DOCX, XLSX; 10 MB limit for V1; validate MIME type **and** extension.
- **Logging:** server logs for errors, failed document creation, failed PDF generation, database errors, authentication errors. Never log passwords, tokens or API secrets.
- **Backup:** document how to export/back up PostgreSQL and document storage; code lives in GitHub. A free cloud database is not a backup system.
- **Accessibility:** keyboard navigation, focus states, ARIA labels, readable contrast; tables and forms usable without a mouse where practical.

---

## 29. PERFORMANCE & STANDARD TABLE BEHAVIOUR

For 5–6 users don't over-engineer, but implement pagination, DB indexes, debounced search, server-side filtering and sorting, lazy loading. Tables never load thousands of records at once. Never `SELECT *` on large views — fetch only required fields.

**Indexes:** Customer(name, email, phone); Quotation(number, status, customerId); SalesOrder(number, status); Invoice(number, status, customerId, dueDate); Payment(customerId, paymentDate).

**Every major table supports:** Search, Filter, Sort, Pagination, Column visibility, Export, Row actions, Bulk selection where useful.

---

## 30. ENVIRONMENTS, DEPLOYMENT & SEED DATA

- **Environments:** Local and Production at minimum (Staging optional), with separate database credentials. Never develop against production.
- **Env vars:** `DATABASE_URL, AUTH_SECRET, AUTH_URL, STORAGE_URL, STORAGE_KEY, STORAGE_SECRET`. Future: `MICROSOFT_CLIENT_ID/SECRET`, `WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID`, `OPENAI_API_KEY`. Provide `.env.example`; never commit secrets.
- **Migrations:** every schema change is a Prisma migration: change schema → generate migration → run locally → test → deploy migration → deploy app. Never modify production schema manually.
- **Deployment:** GitHub → **Netlify** (Next.js) + **Supabase** (PostgreSQL + Storage). Do not use Vercel Hobby (personal/non-commercial terms). Supabase free projects can pause after inactivity. Verify current plan terms before go-live.
- **Domain:** `crm.chivonmechanical.com` (or `erp.…`); configure DNS after deployment.
- **Seed (demo/dev only):** 7 users (one per role), 10 customers, 15 products, 10 opportunities, 15 quotes, 10 sales orders, 15 invoices, 10 payments — realistic and internally consistent so the dashboard looks real. Demo credentials come from env/seed config; show demo users in the UI only in development; never hard-code production passwords.

---

## 31. TESTING

**Unit:** VAT calculation, discount calculation, invoice outstanding, payment allocation, aging calculation, number generation.
**Integration:** Quote → SO, SO → Invoice, Payment → Invoice, Payment → multiple invoices, Payment reversal.
**UI/E2E:** Login, create customer, create product, create opportunity, create quote, revise quote, approve quote, convert to SO, create partial invoice, record payment, generate SOA, download PDF.
Also: permission tests, PDF tests, mobile tests. The agent must not stop after "the page renders".

**Critical acceptance tests**
1. **Accounting:** Invoice 100,000; Payment 20,000; Payment 30,000; Credit Note 10,000 → display Invoice Total 100,000 / Paid 50,000 / Credit Notes 10,000 / **Outstanding 40,000**.
2. **Partial invoice:** SO 100,000 → Invoice 40,000 (Invoiced 40,000, Remaining 60,000) → Invoice 60,000 (Remaining 0) → a third invoice is **blocked**.
3. **Revision:** QT-20260928-0001 Rev 0 (50,000) → Edit → Rev 1 (55,000); Rev 0 historical, Rev 1 current; only Rev 1 can be sent.
4. **Audit:** changing quote value 50,000 → 55,000 shows user, date/time, record, field, old value, new value.

---

## 32. REQUIRED DOCUMENTATION (produced by the agent)

`README.md, ARCHITECTURE.md, DATABASE.md, PERMISSIONS.md, WORKFLOWS.md, DEPLOYMENT.md, TESTING.md, .env.example`.
- **README:** install, run, configure database, migrate, seed, create admin, deploy, configure domain, backup, restore.
- **DATABASE.md:** every model, relationship, important enum, financial calculation, status transition.
- **WORKFLOWS.md (with diagrams):** Inquiry → Opportunity, Opportunity → Quote, Quote → Revision, Quote → SO, SO → Invoice, Invoice → Payment, Payment → SOA.

---

## 33. RESOLVED AMBIGUITIES (DEFAULTS THE AGENT MUST APPLY)

| # | Ambiguity in the original draft | Resolution |
|---|---|---|
| R1 | Credit notes are used in the outstanding/SOA formulas but were missing from scope and numbering | Minimal credit note in V1: `CN-YYYYMMDD-0001`, issued against an invoice, reduces outstanding, shown in SOA (§16.6) |
| R2 | Invoice approval flow used `PENDING_APPROVAL/APPROVED` which weren't in the invoice status list | Added to the invoice status enum (§15) |
| R3 | Approval requirement per document type unspecified | Configurable in `DocumentSetting`; defaults: quotation **on**, sales order **off**, invoice **off**. When off, skip `PENDING_APPROVAL` |
| R4 | Quotation could convert to both SO and invoice → risk of double billing | Quote → SO allowed from `APPROVED`, `SENT` or `ACCEPTED` (marks quote `ACCEPTED`). Direct Quote → Invoice allowed only if no non-cancelled SO exists for that quotation; otherwise invoice via the SO. One non-cancelled SO per quotation |
| R5 | `REJECTED` used for both internal approval rejection and customer rejection | One status; store `rejectionStage: APPROVAL \| CUSTOMER` + reason. Only `APPROVAL`-stage rejections can be resubmitted |
| R6 | Numbering/overdue/aging date basis unspecified | Use the **Asia/Dubai (UTC+4)** calendar date, not the server's UTC date |
| R7 | "Services", "Follow-ups", "Stock" appear in navigation without their own data models | Filtered views of Products, Tasks and stock data respectively |
| R8 | `Edit` creates a revision — including for never-sent drafts | Follow spec literally: Edit on a saved revision creates the next revision |
| R9 | Toast library | react-toastify |
| R10 | Original draft's implementation phases, definition of done, and agent rules | Moved to `IMPLEMENTATION_PLAN.md` and `SKILL.md`; not duplicated here |
