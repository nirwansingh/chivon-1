# CHIVON MECHANICAL CRM & ERP — IMPLEMENTATION PLAN (V1)

> **This file is the single source of truth for build progress.**
> It is designed to be re-read at the start of every session so work can stop and resume on any day.

---

## SOURCE DOCUMENTS (KEEP ALL THREE IN THE REPO ROOT)

| File | Role |
|---|---|
| `IMPLEMENTATION_PLAN.md` (this file) | **What to build, in what order, and what is done.** Owns progress tracking, build order, decisions. |
| `SPEC.md` | The original **Master Implementation Specification** (numbered §1–§33, with sub-sections such as §13.9). Owns the detailed business requirements: field lists, PDF contents, dashboard widgets, report lists, settings, seed counts, validation rules. This plan refers to it as "spec §N" or "per spec". |
| `SKILL.md` (engineering skill) | **How to build it well**: quality bar, security, verification, and mistakes to avoid. Applies to every task. |

**Precedence:** (1) explicit user instructions in chat, (2) this plan's §8 resolutions and §14 decisions, (3) `SPEC.md`, (4) this plan's summaries. If this plan only says "per spec" for a field list or layout, open `SPEC.md` and implement exactly that list — never guess or shorten it.

---

## 0. RESUME PROTOCOL (READ THIS FIRST, EVERY SESSION)

1. Read this entire file top to bottom. Do **not** rely on chat memory.
2. Go to **§2 Progress Dashboard** and **§3 Session Log**. Find the last entry's "Next up".
3. Find the first task in §11 that is `[ ]` or `[~]`. Resume there. Never skip ahead to UI polish before its dependencies are `[x]`.
4. If a task is `[~]` (in progress), inspect the actual code/DB state, finish it, then verify its acceptance criteria before marking `[x]`.
5. Before writing code for a task, confirm its dependencies (`Deps`) are `[x]`. If not, do the dependency first.
6. **Update this file as you work**, not only at the end:
   - Flip the task checkbox (`[ ]` → `[~]` when you start, → `[x]` only after acceptance criteria pass).
   - Update the phase status in §2.
   - Add anything blocked to §13 (Blockers) and any decision you made to §14 (Decisions Log).
7. **Before ending a session** (or when you sense you are running out of context), append a Session Log entry (§3): what was finished, what is half-done (with file paths), what to run to verify, and the exact next task ID.
8. Never mark a task `[x]` because "the page renders". A task is done only when its acceptance criteria are met **against real PostgreSQL data**.
9. Never delete or reorder task IDs. Add new tasks with the next free ID in that phase (e.g. `P8.19`) so history stays traceable.

### Status legend

| Mark | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress / partially done (note what remains in the Session Log) |
| `[x]` | Done and verified against acceptance criteria |
| `[!]` | Blocked (details in §13) |
| `[-]` | Deliberately skipped / moved to V2 (reason in §14) |

---

## 1. PROJECT SUMMARY

**Product:** Internal CRM + Sales + Basic Finance + Documents application for **Chivon Mechanical** (UAE, single company, ~5–6 users, desktop-first, fully responsive).
**Currency:** AED. **Default VAT:** 5% (configurable).
**Core engine (must be rock solid):**

```
Customer → Opportunity → Quotation (+Revisions) → Sales Order → Invoice → Payment → SOA
```

Supporting: Inquiries (manual), Products/Services/Stock, Tasks & Follow-ups, Documents, Audit Logs, Approvals, PDFs, Search, Reports, Dashboard, Settings.

### V1 IN scope
Auth, Users, Roles, Permissions, Dashboard, Customers (+Contacts, Addresses), Products/Services/Manpower, Stock (single-pool, movements), Inquiries (manual only), Opportunities (+Kanban), Quotations (+Revisions, Approval), Sales Orders (fulfillment, partial invoicing), Invoices, Payments (+multi-invoice allocation, reversal, receipts), minimal Credit Notes, SOA + Aging, Receivables, Tasks/Follow-ups, Documents, Audit Logs, PDF generation/preview/download, WhatsApp **share-link helper only**, Search, Reports, Company Settings.

### V1 OUT of scope (do NOT build; show "Coming Soon" in sidebar only)
Website inquiry API/lead capture, Outlook/email ingestion, AI classification/quotation, WhatsApp API, automatic notifications, Procurement, POs, Suppliers, multiple warehouses, multi-company, advanced accounting, bank feeds, any AI automation.
Build only the **interfaces + mock implementations** listed in §7.

---

## 2. PROGRESS DASHBOARD

Update the Status column as phases progress. (`NOT_STARTED` / `IN_PROGRESS` / `DONE` / `BLOCKED`)

| Phase | Title | Status | Depends on |
|---|---|---|---|
| P0 | Project setup | IN_PROGRESS | — |
| P1 | Database, core libs & seed | NOT_STARTED | P0 |
| P2 | Authentication, users, roles, permissions | NOT_STARTED | P1 |
| P3 | Design system & app shell | NOT_STARTED | P2 |
| P4 | Customers (contacts, addresses, 360) | NOT_STARTED | P3 |
| P5 | Products, services & stock | NOT_STARTED | P3 |
| P6 | Inquiries | NOT_STARTED | P4, P5 |
| P7 | Opportunities & Kanban | NOT_STARTED | P6 |
| P8 | Quotations, revisions, approval, PDF | NOT_STARTED | P4, P5, P7 |
| P9 | Sales Orders | NOT_STARTED | P8 |
| P10 | Invoices & credit notes | NOT_STARTED | P9 |
| P11 | Payments & receipts | NOT_STARTED | P10 |
| P12 | SOA, aging & receivables | NOT_STARTED | P11 |
| P13 | Tasks & follow-ups | NOT_STARTED | P4 |
| P14 | Documents | NOT_STARTED | P3 |
| P15 | Audit log UI | NOT_STARTED | P2 |
| P16 | Dashboard | NOT_STARTED | P12 |
| P17 | Reports | NOT_STARTED | P12 |
| P18 | PDF polish | NOT_STARTED | P8–P12 |
| P19 | Responsive pass | NOT_STARTED | P16 |
| P20 | Full test pass | NOT_STARTED | P19 |
| P21 | Documentation | NOT_STARTED | P20 |
| P22 | Deployment & production check | NOT_STARTED | P21 |

> P13, P14, P15 may be built any time after their dependencies; the rest follow order. Every module phase must satisfy the **Module Definition of Done (§10)**.

---

## 3. SESSION LOG

Append newest entry at the **bottom**. Template:

```
### Session N — YYYY-MM-DD
- Completed: <task IDs>
- Partially done ([~]): <task ID> — <what exists, file paths, what remains>
- Verified by: <commands run / tests passing>
- Decisions/deviations: <or "none">
- Blockers: <or "none">
- NEXT UP: <exact task ID>
```

### Session 0 — YYYY-MM-DD
- Completed: none
- Partially done ([~]): P0.1 — Created README.md and .gitignore, but `git init` failed.
- Verified by: File system check.
- Decisions/deviations: none
- Blockers: Git and PostgreSQL are not installed.
- NEXT UP: P0.1

---

## 4. AGENT OPERATING RULES (NON-NEGOTIABLE)

1. **No fake UI.** Every button, dropdown, form, calculation, status transition, PDF action, conversion, search result, filter, permission and dashboard metric must be wired to real logic and persistent PostgreSQL data.
2. **No mock data in functional screens** once the corresponding DB module exists. Placeholder buttons that do nothing are forbidden; V2 features are labelled **Coming Soon**, not faked.
3. **Server-side only for data.** Browser never touches Prisma/DB credentials. Flow: `React UI → Server Actions / Route Handlers → Service Layer → Prisma → PostgreSQL`. No separate Express/Nest backend.
4. **Business logic lives in services**, never in React components.
5. **Money = Decimal.** Never JS floats for money (see §6.2).
6. **Atomic operations** in a Prisma transaction: create quotation, create revision, quote→SO, SO→invoice, payment+allocations, payment reversal, approve, cancel.
7. **Never destructively replace** documents on conversion. Source documents remain as history; link via foreign keys.
8. **Never physically delete** issued invoices, posted payments, approved quotes, confirmed SOs. Use `CANCELLED` + `cancelledBy/At/Reason`.
9. **Server-side validation (Zod)** on every mutation, even when the client also validates. Never expose raw Prisma errors to users; log them server-side.
10. **Autonomy rule:** for minor unspecified decisions choose the simplest production-sensible option consistent with this architecture and record it in §14. Stop and ask the user **only** if the decision materially changes the DB model, business workflow, financial calculation, security model or user-facing behaviour.
11. Use Prisma **migrations** for every schema change. Never edit prod schema by hand.
12. Do not log passwords, tokens or secrets. Never commit secrets.

---

## 5. LOCKED TECHNOLOGY DECISIONS

| Area | Decision |
|---|---|
| Framework | Next.js (App Router), TypeScript, React |
| Styling/UI | Tailwind CSS, shadcn/ui, Lucide icons, Framer Motion (restrained) |
| Forms | React Hook Form + Zod (client **and** server validation) |
| Toasts | react-toastify (per spec) |
| DB | **PostgreSQL from day 1** (local dev too — no SQLite) |
| ORM | Prisma (use current stable; follow its Next.js guide; commit migrations) |
| Auth | Auth.js (NextAuth) + Prisma adapter, **Credentials provider with JWT session strategy** (Credentials does not support DB sessions). No public registration. |
| Money math | `Prisma.Decimal` / `decimal.js`; DB columns `Decimal(18,2)` (rates/qty may use `Decimal(18,4)` where needed) |
| PDF | **Server-side** deterministic generation (recommended: `@react-pdf/renderer` — pure JS, serverless-friendly). Not `html2canvas`/browser screenshots. Wrap behind `PdfService`. |
| Files | Object storage behind an abstract `StorageService` (Supabase Storage for V1). Never store blobs in Postgres. |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Deploy | GitHub → Netlify (Next.js) + Supabase (Postgres + Storage). **Not Vercel Hobby** (non-commercial only). Target `crm.chivonmechanical.com`. |
| Environments | Local + Production minimum (separate DB credentials). Never develop against prod. |

---

## 6. DOMAIN RULES REFERENCE

### 6.1 Document numbering — `DocumentNumberService` (single centralized service)

| Doc | Format | Example |
|---|---|---|
| Quotation | `QT-YYYYMMDD-0001` | QT-20260928-0001 |
| Sales Order | `SO-YYYYMMDD-0001` | |
| Invoice | `INV-YYYYMMDD-0001` | |
| Payment receipt | `PAY-YYYYMMDD-0001` | |
| Credit note | `CN-YYYYMMDD-0001` (spec gap; see §14) | |

- Sequence increments **per prefix per day**; never resets annually.
- Implement via a `DocumentSequence(prefix, dateKey, lastValue)` table incremented atomically inside the same transaction as the document insert (row lock / `upsert` + increment). DB `@unique` on every document number.
- PDF filenames: `QT-20260928-0001-REV2.pdf`, `SO-…pdf`, `INV-…pdf`, `PAY-…pdf`.

### 6.2 Calculations (per line, then document totals)

```
Gross    = Quantity × Rate
Discount = PERCENTAGE ? Gross × pct / 100 : FIXED_AMOUNT
Net      = Gross − Discount
VAT      = Net × VATRate / 100
LineTotal= Net + VAT
```
Document: `Subtotal (Σ gross) | Discount (Σ) | Taxable (Σ net) | VAT (Σ) | Grand Total`.
- Round each line's money values to 2dp (half-up), then **sum the rounded lines** for document totals.
- Default VAT 5%; allow document-level VAT override.
- Validation: qty > 0, rate ≥ 0, discount ≥ 0 (and ≤ gross), VAT ≥ 0, payment > 0, invoice total > 0.
- **Outstanding is always computed, never stored as source of truth:**
  `Outstanding = InvoiceTotal − Σ(valid PaymentAllocations) − Σ(valid CreditNotes)`
- "Amount in words" util (AED + fils) shared by all PDFs.

### 6.3 Status machines (reject any transition not listed)

**Quotation:** `DRAFT → PENDING_APPROVAL → APPROVED | REJECTED`; `REJECTED → (edit) → PENDING_APPROVAL`; `APPROVED → SENT → ACCEPTED | REJECTED | EXPIRED`; any non-terminal → `CANCELLED`. `SENT → DRAFT` forbidden (use new revision). Only the **latest** revision may be sent.
**Sales Order:** `DRAFT → CONFIRMED → IN_PROGRESS → PARTIALLY_FULFILLED → FULFILLED`; any non-fulfilled → `CANCELLED` (confirm dialog; reopen by authorized admin only). Cancelled SO: no new invoices, no edits.
**Invoice:** `DRAFT → [PENDING_APPROVAL → APPROVED] → ISSUED → PARTIALLY_PAID → PAID`; `CANCELLED` allowed only if no valid allocations. `OVERDUE` is **derived** at query time (`dueDate < today AND outstanding > 0`), shown as status badge.
**Payment allocation state:** `UNALLOCATED | PARTIALLY_ALLOCATED | FULLY_ALLOCATED`; reversal creates a reversal record and marks allocations reversed — never edits the original.
**Inquiry:** `NEW, CONTACTED, QUALIFIED, UNQUALIFIED, FOLLOW_UP_REQUIRED, CONVERTED, LOST`.
**Opportunity:** `NEW, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST`.
**Task:** `TODO, IN_PROGRESS, COMPLETED, CANCELLED`; priority `LOW, MEDIUM, HIGH, URGENT`.
**User:** `ACTIVE, INACTIVE`.

### 6.4 Key business rules
- **Invoice requires a source:** `quotationId` OR `salesOrderId` (DB check + service validation). No free-standing invoice.
- **Partial invoicing:** Σ invoiced against an SO (by line qty/value) can never exceed SO total; block over-invoicing. SO detail shows `Total / Invoiced / Remaining`.
- **Payment:** one payment → many invoices; one invoice → many payments. Allocation ≤ payment unallocated balance AND ≤ invoice outstanding. Payment always has a customer.
- **Quotation revisions:** `Quotation → QuotationRevision(n) → QuotationItem`. Exactly one revision flagged `isCurrent`. Both **Edit** (on an already-saved revision) and **More → Create Revision** produce a new revision; the prior revision is untouched. A revision may be deleted only if never sent AND not linked downstream (SO/invoice).
- **Conversion** stores `quotationId` + `quotationRevisionId` on the Sales Order; customer/product records are never duplicated.
- **Customer deletion:** blocked with "Customer cannot be deleted because transactional records exist." if any dependent transactional record exists.
- **Opening balance:** per-customer `openingBalance` (+ date) shown in SOA and financial summaries.
- **Duplicate-submission protection:** UI disables submit + generates an idempotency key; DB unique constraints (`idempotencyKey`, document numbers) are the real guard.

### 6.5 Roles & default permissions

Permission key format: `MODULE.ACTION` (e.g. `QUOTATION.APPROVE`). Never hard-code role checks in components; check permissions via `PermissionService`.
Modules: `CUSTOMER, INQUIRY, OPPORTUNITY, PRODUCT, STOCK, QUOTATION, SALES_ORDER, INVOICE, PAYMENT, CREDIT_NOTE, SOA, TASK, DOCUMENT, REPORT, DASHBOARD, AUDIT, USER, ROLE, SETTINGS`.
Actions: `VIEW, CREATE, EDIT, DELETE, APPROVE, SEND, DOWNLOAD, SHARE, EXPORT, CANCEL, REVERSE, MANAGE` (as applicable per module; `EXPORT/DOWNLOAD/SHARE/APPROVE` are always separate permissions).

| Role | Default access |
|---|---|
| SUPER_ADMIN | Everything |
| ADMIN | Nearly everything; cannot modify/remove Super Admin |
| MANAGER | Customers, Opportunities, Quotes, SOs, Invoices, Payments, Dashboard, Reports, Tasks, Documents; **can approve** |
| SALES | Customers, Opportunities, Inquiries, Quotes, SOs, Tasks, Follow-ups; no accounting edits |
| ACCOUNTS | Customers (view), Invoices, Payments, SOA, Receivables, Reports |
| INVENTORY | Products, Services, Stock, Customers (view) |
| VIEWER | Read-only on permitted modules |

Admins can edit role permissions and create custom roles. Permission/role changes are audited.

### 6.6 Approvals
Role-based only in V1 (no amount thresholds). Configurable per doc type in `DocumentSetting`: `approvalRequired.quotation` (default **true**), `.salesOrder` (default **false**), `.invoice` (default **false**). When off, skip `PENDING_APPROVAL`. Rejection requires a reason.

---

## 7. ARCHITECTURE

### 7.1 Directory structure
```
app/
  (auth)/login/
  dashboard/  customers/{new,[id]}  inquiries/  opportunities/
  quotations/{new,[id]}  sales-orders/  invoices/  payments/  soa/
  products/  tasks/  documents/  reports/  audit/  settings/  api/
components/   (shared UI — see §7.3)
lib/          (money, dates, result type, amount-in-words, status machines)
server/
  services/   (see §7.2)
  storage/    (StorageService + Supabase impl)
  pdf/        (PdfService + templates)
  integrations/ (Mock*Service interfaces — §7.4)
prisma/       (schema.prisma, migrations/, seed.ts)
tests/        (unit/, integration/, e2e/)
docs/         (ARCHITECTURE.md, DATABASE.md, PERMISSIONS.md, WORKFLOWS.md, DEPLOYMENT.md, TESTING.md)
```

### 7.2 Service layer (one file each; no logic in components)
`CustomerService, InquiryService, OpportunityService, ProductService, QuotationService, SalesOrderService, InvoiceService, PaymentService, CreditNoteService, SOAService, TaskService, DocumentService, AuditService, PdfService, PermissionService, DashboardService, SearchService, DocumentNumberService, StockService`.
Every service call returns `ActionResult<T> = { success, data?, error?, message? }`.

### 7.3 Shared components (build once in P3, reuse everywhere)
`DataTable, SearchInput, PageHeader, StatusBadge, ConfirmDialog, FormModal, Drawer, EntitySelector, CustomerSelector, ProductSelector, MoneyDisplay, DateDisplay, DocumentActions (standard action bar), PdfPreview, Timeline, ActivityTimeline, DocumentLineage, EmptyState, LoadingState, ErrorState, Pagination, FilterBar`.

### 7.4 V2-ready interfaces (interfaces + Mock only)
`EmailService, WhatsAppService, CommunicationService, AIService, LeadCaptureService, NotificationService` with `MockEmailService`, `MockWhatsAppService` in V1. `WhatsApp Share` helper builds a `wa.me/?text=` link — do not present it as API integration.

### 7.5 Data model (Prisma) — entities
`User, Role, Permission, RolePermission` · `Customer, CustomerContact, CustomerAddress(type: REGISTERED|BILLING|SHIPPING)` · `Inquiry, Opportunity, OpportunityItem` · `Product, ProductCategory, StockMovement(OPENING|IN|OUT|ADJUSTMENT)` · `Quotation, QuotationRevision, QuotationItem` · `SalesOrder, SalesOrderItem(ordered/fulfilled/invoiced qty)` · `Invoice, InvoiceItem` · `Payment, PaymentAllocation, CreditNote, CreditNoteItem` · `Task, Activity` · `Document` · `AuditLog` · `CompanySetting, DocumentSetting, DocumentSequence`.
Rules: address in its own table (not columns on Customer); enums for all statuses; `Decimal` for money; indexes on `Customer.name/email/phone`, `Quotation.number/status/customerId`, `SalesOrder.number/status`, `Invoice.number/status/customerId/dueDate`, `Payment.customerId/paymentDate`; never `SELECT *` on list views; server-side pagination/sort/filter; audit fields (`createdBy/At`, `updatedAt`) everywhere.

### 7.6 Navigation (sidebar)
Dashboard · CRM (Inquiries, Opportunities, Customers) · Sales (Quotations, Sales Orders, Invoices) · Finance (Payments, Receivables, Statements of Account) · Catalog (Products, Services, Stock) · Activities (Tasks, Follow-ups) · Documents · Reports · Audit Logs · Administration (Users, Roles & Permissions, Settings) · Coming Soon (Procurement, Email Automation, WhatsApp, AI Automation — non-breaking, labelled).

### 7.7 Design rules
White + deep corporate blue + sky blue + light blue + neutral gray; success green / warning amber / danger red. Enterprise app, **not** a landing page: prioritise readability, density, hierarchy, speed, consistency. Glassmorphism sparingly. Framer Motion only for sidebar, modal, drawer, table expansion, page transition, toast, dropdown, status change. Skeleton loaders + lazy loading everywhere async. Desktop-first; mobile uses cards, collapsible filters, bottom action bars, stacked forms. Keyboard nav, focus states, ARIA labels, readable contrast.

---

## 8. SPEC AMBIGUITIES — DEFAULT RESOLUTIONS (agent may proceed with these)

| # | Ambiguity | Default resolution |
|---|---|---|
| A1 | Credit notes appear in outstanding/SOA formulas but numbering/scope list omits them | Implement **minimal** CreditNote (issue against an invoice, `CN-` number, reduces outstanding, shown in SOA). No standalone credit-note module UI beyond list/create/PDF |
| A2 | Invoice enum lacks `PENDING_APPROVAL/APPROVED` used in the approval flow | Add both to Invoice status enum |
| A3 | `REJECTED` used both for approval rejection and customer rejection of a quote | One status; store `rejectionStage: APPROVAL | CUSTOMER` + reason. Only `APPROVAL`-stage rejections can be resubmitted |
| A4 | "Edit" creates a new revision — including for never-sent drafts? | Follow spec literally: Edit on a saved revision creates the next revision |
| A5 | Storage provider | Supabase Storage behind `StorageService`; swappable |
| A6 | Toast lib vs shadcn default | react-toastify per spec |
| A7 | `OVERDUE` invoice status | Derived at query time, not persisted |

The resolutions R1–R10 in `SPEC.md` §33 also apply (notably R4 quote→SO/invoice double-billing guard, R6 Asia/Dubai dates, R7 filtered nav views). Add new resolutions to §14.

---

## 9. CRITICAL ACCEPTANCE TESTS (gate for P20; also write earlier where noted)

- [ ] **T-01 Outstanding:** Invoice 100,000; Payments 20,000 + 30,000; Credit Note 10,000 → shows Total 100,000 / Paid 50,000 / Credit Notes 10,000 / **Outstanding 40,000**.
- [ ] **T-02 Partial invoicing:** SO 100,000 → Invoice 40,000 → Remaining 60,000 → Invoice 60,000 → Remaining 0 → third invoice attempt **BLOCKED**.
- [ ] **T-03 Revisions:** QT-…-0001 Rev 0 (50,000) → Edit → Rev 1 (55,000); Rev 0 historical, Rev 1 current; **only Rev 1 sendable**.
- [ ] **T-04 Audit:** quote value 50,000 → 55,000 audit shows user, timestamp, record, field, old value, new value.
- [ ] **T-05 Multi-invoice payment:** one payment 100,000 allocated 40k/30k/20k, 10k unallocated, later allocatable; over-allocation blocked.
- [ ] **T-06 Payment reversal:** original preserved, reversal record created, invoice outstanding restored, audited.
- [ ] **T-07 Duplicate protection:** double-click "Create Invoice"/"Record Payment" yields exactly one record.
- [ ] **T-08 Number generation:** concurrent creation same day yields unique sequential numbers (0001, 0002, …).
- [ ] **T-09 Aging:** buckets Current / 1–30 / 31–60 / 61–90 / 90+ computed from **due date**.
- [ ] **T-10 Permissions:** each default role can/cannot perform its expected actions, server-enforced (not just hidden UI).
- [ ] **T-11 Deletion guards:** customer with invoice cannot be deleted; issued invoice/posted payment cannot be hard-deleted.
- [ ] **T-12 Lineage:** invoice shows source SO and original quote+revision as links.

---

## 10. MODULE DEFINITION OF DONE (apply to every module phase P4–P17)

A module task group is done only if **all** are true:
- [ ] Server-side Zod validation + permission check on every mutation and every data read
- [ ] Business rules & status machine enforced in the service layer
- [ ] Multi-step writes wrapped in a DB transaction
- [ ] Audit log entries written for create/update/delete/approve/convert/cancel etc.
- [ ] List view: server-side pagination, sort, filter, debounced search (250–300 ms), column visibility, export where relevant
- [ ] Detail view follows standard layout (Header → Summary cards → Main info → Line items → Financial summary → Timeline → Documents → Related records)
- [ ] Skeleton/loading, empty, and error states; submit buttons disabled while pending
- [ ] Toast on success/error; user-friendly errors (no raw Prisma text)
- [ ] Works at desktop and mobile widths
- [ ] Unit/integration tests for logic added; no mock data; no dead buttons

---

## 11. PHASED TASK LIST

Format: `[ ] ID — Task  (Deps)  ▸ Acceptance`

### PHASE 0 — Project setup
- [~] P0.1 — Create Git repo, `.gitignore`, `README` stub  ▸ repo initialised, first commit
- [ ] P0.2 — Create Next.js App Router + TypeScript app, Tailwind  ▸ `npm run dev` serves blank app
- [ ] P0.3 — Install/configure shadcn/ui, lucide-react, framer-motion, react-hook-form, zod, react-toastify  (P0.2)  ▸ sample Button/Toast render
- [ ] P0.4 — ESLint + Prettier + TS strict; Vitest + Playwright configured; npm scripts (`lint`, `typecheck`, `test`, `e2e`, `db:migrate`, `db:seed`)  (P0.2)  ▸ all scripts run clean
- [ ] P0.5 — Local PostgreSQL (no Docker) + Prisma init & connection  (P0.2)  ▸ `prisma migrate dev` succeeds
- [ ] P0.6 — `.env.example` + Zod-validated env loader (`DATABASE_URL, AUTH_SECRET, AUTH_URL, STORAGE_URL, STORAGE_KEY, STORAGE_SECRET`; future keys commented)  (P0.2)  ▸ app fails fast with clear message on missing env
- [ ] P0.7 — Create folder skeleton from §7.1  (P0.2)  ▸ structure exists
- [ ] P0.8 — Install Auth.js + Prisma adapter (config only)  (P0.5)  ▸ compiles
- ✅ **Exit:** app boots, DB connects, lint + typecheck pass. **No UI-heavy work before P1.**

### PHASE 1 — Database, core libs & seed
- [ ] P1.1 — Define all enums (§6.3)  (P0.5)  ▸ compiles
- [ ] P1.2 — Identity models: User, Role, Permission, RolePermission  (P1.1)
- [ ] P1.3 — CRM models: Customer, CustomerContact, CustomerAddress, Inquiry, Opportunity, OpportunityItem  (P1.1)
- [ ] P1.4 — Catalog models: Product, ProductCategory, StockMovement  (P1.1)
- [ ] P1.5 — Sales models: Quotation, QuotationRevision, QuotationItem, SalesOrder, SalesOrderItem  (P1.1)
- [ ] P1.6 — Finance models: Invoice, InvoiceItem, Payment, PaymentAllocation, CreditNote, CreditNoteItem (Decimal money, idempotencyKey, cancel fields)  (P1.1)
- [ ] P1.7 — Support models: Task, Activity, Document, AuditLog, CompanySetting, DocumentSetting, DocumentSequence  (P1.1)
- [ ] P1.8 — Indexes and unique constraints per §7.5; invoice-source check  (P1.2–P1.7)
- [ ] P1.9 — Run first migration  (P1.8)  ▸ migration committed, DB matches schema
- [ ] P1.10 — `lib/money` (Decimal helpers, rounding, formatting AED) + line/document calculation functions + amount-in-words  (P0.4)  ▸ unit tests incl. VAT/discount cases
- [ ] P1.11 — `DocumentNumberService` (atomic, per prefix/day)  (P1.9)  ▸ concurrency test (T-08)
- [ ] P1.12 — Status-machine helpers (`canTransition`) for all documents  (P1.1)  ▸ unit tests
- [ ] P1.13 — `ActionResult` type, error mapper, server logger (no secrets)  (P0.4)
- [ ] P1.14 — `AuditService` (`log({user, action, module, entity, before, after, ip, ua})`)  (P1.9)
- [ ] P1.15 — `PermissionService` + permission catalog constants  (P1.2)
- [ ] P1.16 — `StorageService` interface + Supabase impl + `Mock*` integration interfaces (§7.4)  (P0.6)
- [ ] P1.17 — Seed: permissions, 7 default roles + role→permission map, settings defaults, demo users (one per role; creds from env/seed config), demo data (10 customers, 15 products, 10 opportunities, 15 quotes, 10 SOs, 15 invoices, 10 payments — internally consistent)  (P1.9–P1.15)  ▸ `db:seed` idempotent and dashboard-worthy
- ✅ **Exit:** schema migrated, seed runs, money/numbering/status/audit/permission libs unit-tested.

### PHASE 2 — Authentication, users, roles, permissions
- [ ] P2.1 — Login page + credentials auth (bcrypt/argon2 hash), logout, JWT session, `lastLoginAt`  (P1.17)  ▸ can log in with seeded users; inactive users blocked
- [ ] P2.2 — Route protection (middleware + server checks); `requirePermission()` guard for actions/routes  (P2.1)  ▸ unauthenticated redirected; unauthorized = 403 server-side
- [ ] P2.3 — Users admin: list/create/edit/deactivate, reset password (no public registration; only `USER.MANAGE`)  (P2.2)
- [ ] P2.4 — Roles & Permissions admin: edit default roles, create custom roles, permission matrix UI; audited  (P2.2)
- [ ] P2.5 — Protect SUPER_ADMIN from Admin changes  (P2.3)
- [ ] P2.6 — Audit LOGIN/LOGOUT/USER_CHANGE/ROLE_CHANGE/PERMISSION_CHANGE  (P2.1, P1.14)
- [ ] P2.7 — Permission tests for all default roles (T-10 scaffold)  (P2.4)
- ✅ **Exit:** all 7 roles tested; permissions server-enforced.

### PHASE 3 — Design system & app shell
- [ ] P3.1 — Theme tokens (colors, typography, spacing), light theme
- [ ] P3.2 — App shell: sidebar (§7.6, permission-aware, Coming Soon items), topbar (logo, universal search placeholder → wired in P3.6, user menu, settings), mobile nav
- [ ] P3.3 — Base components: buttons, forms, inputs, badges, cards, modal, drawer, toast wrapper  (P3.1)
- [ ] P3.4 — `DataTable` with server-side pagination/sort/filter/column visibility/export hooks; `FilterBar`, `Pagination`  (P3.3)
- [ ] P3.5 — `Timeline/ActivityTimeline`, `StatusBadge`, `MoneyDisplay`, `DateDisplay`, `EmptyState/LoadingState/ErrorState`, `ConfirmDialog`, `DocumentActions`, `DocumentLineage`, `PdfPreview` shell  (P3.3)
- [ ] P3.6 — `SearchService` + universal search UI (debounced, grouped results, deep links) for all indexed entities available so far  (P3.2)
- [ ] P3.7 — Framer Motion transitions (restrained)
- ✅ **Exit:** one reusable kit; no module re-implements these components.

### PHASE 4 — Customers
- [ ] P4.1 — Customer list (search/filter/sort/paginate)  (P3.4)
- [ ] P4.2 — Create/Edit customer (fields per spec incl. TRN, opening balance)  (P4.1)
- [ ] P4.3 — Contacts CRUD (multiple, primary flag)  (P4.2)
- [ ] P4.4 — Addresses CRUD (Registered/Billing/Shipping, independent)  (P4.2)
- [ ] P4.5 — **Inline customer creation** via `CustomerSelector` ("+ Add Customer" → quick form → auto-attach)  (P4.2)
- [ ] P4.6 — Customer 360 page (tabs: Overview, Contacts, Addresses, Inquiries, Opportunities, Quotations, Sales Orders, Invoices, Payments, SOA, Tasks, Documents, Activity); tabs for later modules show empty states until built  (P4.3, P4.4)
- [ ] P4.7 — Financial summary card (Total Invoiced / Paid / Outstanding / Overdue) — wire real data in P12  (P4.6)
- [ ] P4.8 — Deletion guard (T-11) + audit  (P4.2)
- ✅ **Exit:** §10 DoD met; inline creation works.

### PHASE 5 — Products, services & stock
- [ ] P5.1 — Product list + categories  (P3.4)
- [ ] P5.2 — Create/Edit product (types PRODUCT/SERVICE/MANPOWER; units NOS, KG, HOURS, DAYS, METER, SET, LOT, OTHER; VAT rate; min stock)  (P5.1)
- [ ] P5.3 — **Inline product creation** via `ProductSelector`  (P5.2)
- [ ] P5.4 — Stock: current stock, adjustments, movement history (OPENING/IN/OUT/ADJUSTMENT), computed current quantity; low-stock indicator  (P5.2)
- [ ] P5.5 — Product detail page  (P5.2)
- ✅ **Exit:** stock arithmetic verified (100 −20 +50 −5 = 125).

### PHASE 6 — Inquiries
- [ ] P6.1 — Inquiry list + create/edit (fields per spec)  (P4.5, P5.3)
- [ ] P6.2 — Inquiry detail (Overview, Customer, Product/Service, Activity, Tasks, Notes, Attachments, Timeline)  (P6.1)
- [ ] P6.3 — Status workflow + assignment  (P6.1)
- [ ] P6.4 — **Convert to Opportunity** (inquiry retained; `status=CONVERTED`, `opportunityId` set; transactional)  (P7.1)
- ✅ **Exit:** conversion keeps traceability.

### PHASE 7 — Opportunities
- [ ] P7.1 — Opportunity list + create/edit  (P4.5)
- [ ] P7.2 — Detail page (tasks, timeline, products/services)  (P7.1)
- [ ] P7.3 — Kanban board (6 columns); drag/drop updates status server-side; cards show name, customer, value, probability, expected close, assignee  (P7.1)
- [ ] P7.4 — Pipeline summary widget data (for dashboard)  (P7.3)
- ✅ **Exit:** drag/drop persists and audits.

### PHASE 8 — Quotations (major phase)
- [ ] P8.1 — Quotation list (filters: status, customer, user, date)  (P3.4)
- [ ] P8.2 — Create form: customer/contact/opportunity selectors, inline customer & product, dynamic line items, discount (percentage/fixed), VAT, live totals  (P4.5, P5.3, P1.10)
- [ ] P8.3 — `QuotationService.create` (transactional: quotation + Rev 0 + items + number)  (P8.2, P1.11)
- [ ] P8.4 — Revision engine: Edit → new revision; **More → Create Revision**; `isCurrent` uniqueness; revision list/view; guarded revision delete  (P8.3)
- [ ] P8.5 — Send rule: only latest revision sendable (T-03)  (P8.4)
- [ ] P8.6 — Approval workflow (submit → approve/reject-with-reason → resubmit) honoring `DocumentSetting`; role-gated  (P8.3, P1.15)
- [ ] P8.7 — Quotation PDF template (all fields in spec §13.9) + `PdfService` foundation  (P8.3)
- [ ] P8.8 — PDF preview modal (Download / Print / Share / Close) + WhatsApp share-link helper  (P8.7)
- [ ] P8.9 — Standard action bar: Edit, Approve, Download PDF, Share, Convert, More (Create Revision, Duplicate, Print, Cancel)  (P8.4–P8.8)
- [ ] P8.10 — Statuses: SENT/ACCEPTED/REJECTED/EXPIRED/CANCELLED transitions + validity expiry handling  (P8.6)
- [ ] P8.11 — Quotation detail page (lineage, timeline, documents)  (P8.3)
- [ ] P8.12 — Audit everything (T-04 field-level diff on value change)  (P8.3)
- ✅ **Exit:** T-03, T-04 pass; PDF opens correctly.

### PHASE 9 — Sales Orders
- [ ] P9.1 — `QuotationService.convertToSalesOrder()` (transactional; stores quotationId + revisionId; quote retained/marked converted)  (P8.6)
- [ ] P9.2 — SO list + detail (customer, lineage, items, financial summary Total/Invoiced/Remaining)  (P9.1)
- [ ] P9.3 — SO edit (draft/confirmed rules) + status machine  (P9.2)
- [ ] P9.4 — Line-level fulfillment tracking (ordered / fulfilled / remaining) and derived SO fulfillment status  (P9.2)
- [ ] P9.5 — Cancellation with confirm; authorized reopen; block invoice on cancelled SO  (P9.2)
- [ ] P9.6 — SO PDF template  (P9.2)
- [ ] P9.7 — Optional approval per setting  (P9.3)
- ✅ **Exit:** conversion never duplicates customer/product; SO PDF works.

### PHASE 10 — Invoices & credit notes
- [ ] P10.1 — `SalesOrderService.convertToInvoice()` + direct quote→invoice; enforce source rule; partial invoicing by qty/value; over-invoice block (T-02)  (P9.2)
- [ ] P10.2 — Invoice list/detail (lineage, due date, payment terms, financial summary)  (P10.1)
- [ ] P10.3 — Computed outstanding function/query + derived OVERDUE  (P10.1, P1.10)
- [ ] P10.4 — Invoice status machine + optional approval → ISSUED  (P10.2)
- [ ] P10.5 — Cancellation rules (no valid allocations)  (P10.2)
- [ ] P10.6 — Invoice PDF template  (P10.2)
- [ ] P10.7 — Minimal CreditNote: create against invoice (≤ outstanding), `CN-` number, PDF, audit  (P10.2)
- [ ] P10.8 — Idempotency + button lock (T-07)  (P10.1)
- ✅ **Exit:** T-02 passes.

### PHASE 11 — Payments
- [ ] P11.1 — Payment list + record payment (Cash/Bank Transfer/Cheque/Card/Other; ref, bank, cheque no., attachment)  (P10.2)
- [ ] P11.2 — Allocation UI + `PaymentService.allocate` (multi-invoice; over-allocation blocked; unallocated state) (T-05)  (P11.1)
- [ ] P11.3 — Post-hoc allocation of remaining balance by Accounts  (P11.2)
- [ ] P11.4 — **Reverse Payment** (reversal record; allocations reversed; original preserved) (T-06)  (P11.2)
- [ ] P11.5 — Payment receipt PDF (`PAY-` number, allocated invoices, remaining unallocated, amount in words)  (P11.2)
- [ ] P11.6 — Invoice status updates (PARTIALLY_PAID/PAID) driven by allocations; T-01 verified  (P11.2, P10.7)
- [ ] P11.7 — Idempotency + button lock (T-07)  (P11.1)
- ✅ **Exit:** T-01, T-05, T-06 pass.

### PHASE 12 — SOA, aging & receivables
- [ ] P12.1 — `SOAService`: opening balance + invoices + credit notes + payments + adjustments → closing balance for date range  (P11.6)
- [ ] P12.2 — SOA page (customer + From/To), ledger table  (P12.1)
- [ ] P12.3 — Aging buckets from due date (T-09)  (P12.1)
- [ ] P12.4 — SOA PDF (generate / download / print)  (P12.2)
- [ ] P12.5 — Receivables page (columns/filters per spec: customer, status, date, salesperson, aging bucket)  (P11.6)
- [ ] P12.6 — Wire Customer 360 financial summary + SOA tab to real data  (P12.1, P4.7)
- ✅ **Exit:** T-09 passes; totals reconcile with invoices/payments.

### PHASE 13 — Tasks & follow-ups
- [ ] P13.1 — Task CRUD with links (customer/inquiry/opportunity/quotation/SO/invoice), assignee, priority, due date, status  (P4.6)
- [ ] P13.2 — Visual state: Overdue / Due Today / Upcoming / Completed (no notification engine)  (P13.1)
- [ ] P13.3 — Tasks list/board view + related-entity tabs + follow-ups view  (P13.1)
- [ ] P13.4 — Activity/timeline events written for major actions across modules  (P13.1, P1.14)

### PHASE 14 — Documents
- [ ] P14.1 — Upload (PDF/PNG/JPG/JPEG/DOCX/XLSX, ≤10 MB, MIME+extension validation) via `StorageService`  (P1.16)
- [ ] P14.2 — Metadata (fileName, type, size, path, uploader, relatedEntity, category)  (P14.1)
- [ ] P14.3 — Preview / download / delete (permission-gated, audited)  (P14.1)
- [ ] P14.4 — Attach to entities; generated PDFs saved as documents (quote/SO/invoice/receipt)  (P14.2, P8.7)
- [ ] P14.5 — Secure-link-ready document service (no public portal in V1)

### PHASE 15 — Audit log UI
- [ ] P15.1 — Audit list with filters (user, module, action, entity, date)  (P1.14)
- [ ] P15.2 — Record-level history with before/after diff view; read-only (no edit UI)  (P15.1)
- [ ] P15.3 — Verify all action types from spec §21 are being logged (LOGIN … USER_CHANGE)

### PHASE 16 — Dashboard (only after data modules work)
- [ ] P16.1 — `DashboardService` with date-range filter (Today/Week/Month/Quarter/Financial Year/Custom); financial year configurable in settings  (P12)
- [ ] P16.2 — KPI cards: Customers, Active Opportunities, Quotation Value, SO Value, Invoice Value, Received, Outstanding, Overdue  (P16.1)
- [ ] P16.3 — Charts: quotation value, invoice value, payment collection, pipeline, receivables aging  (P16.1)
- [ ] P16.4 — Tables: recent quotations, recent invoices, overdue invoices, upcoming follow-ups, recent payments  (P16.1)
- [ ] P16.5 — Role-specific dashboard variants  (P16.2)
- [ ] P16.6 — CSV/PDF export respecting filter  (P16.2)
- ✅ **Exit:** all values come from real DB; none hard-coded.

### PHASE 17 — Reports
- [ ] P17.1 — Sales, Quotation, SO, Invoice, Payment, Receivables, Aging, Customer Statement, Product, Opportunity Pipeline reports (filters: date, customer, user, status)  (P12)
- [ ] P17.2 — CSV/PDF export, permission-gated (`EXPORT`), audited

### PHASE 18 — PDF polish
- [ ] P18.1 — Test PDFs with: long company/product names, 20+ lines (multi-page), large amounts, discounts, VAT, long addresses, long terms  (P8–P12)
- [ ] P18.2 — Ensure totals never overlap/disappear across page breaks; repeat headers; page numbers
- [ ] P18.3 — Branding fully driven by `CompanySetting` (logo, TRN, bank details, terms) — nothing hard-coded

### PHASE 19 — Responsive pass
- [ ] P19.1 — Verify at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844
- [ ] P19.2 — Critical mobile flows: customer lookup/detail, opportunity, quote view, PDF view, task update, payment view

### PHASE 20 — Full test pass
- [ ] P20.1 — Unit: VAT, discount, outstanding, allocation, aging, numbering
- [ ] P20.2 — Integration: quote→SO, SO→invoice, payment→invoice, multi-invoice payment, reversal
- [ ] P20.3 — E2E (Playwright): login → customer → product → opportunity → quote → revise → approve → SO → partial invoice → payment → SOA → PDF download
- [ ] P20.4 — Permission tests per role; PDF tests; calculation tests; mobile tests
- [ ] P20.5 — All §9 acceptance tests T-01…T-12 checked
- ✅ **Exit:** all suites green.

### PHASE 21 — Documentation
- [ ] P21.1 — `README.md` (install, run, configure DB, migrate, seed, create admin, deploy, configure domain, backup, restore)
- [ ] P21.2 — `ARCHITECTURE.md`, `DATABASE.md` (every model, relation, enum, calculation, status transition), `PERMISSIONS.md`, `WORKFLOWS.md` (diagrams: Inquiry→Opp→Quote→Revision→SO→Invoice→Payment→SOA), `DEPLOYMENT.md`, `TESTING.md`
- [ ] P21.3 — `.env.example` final; backup/export procedure for PostgreSQL + storage documented

### PHASE 22 — Deployment & production check
- [ ] P22.1 — GitHub repo → Netlify (Next.js) configured; env vars set (`DATABASE_URL, AUTH_SECRET, AUTH_URL`, storage creds)
- [ ] P22.2 — Supabase Postgres + Storage provisioned; run migrations to prod; seed **only** roles/permissions/settings (no demo passwords; no demo users shown in UI outside dev)
- [ ] P22.3 — Domain `crm.chivonmechanical.com` (or `erp.`) DNS + HTTPS
- [ ] P22.4 — Security baseline: secure cookies, password hashing, CSRF, XSS-safe rendering, file validation, secrets not in repo
- [ ] P22.5 — Note in DEPLOYMENT.md: Supabase free projects can pause when inactive; backups are not automatic on free tier
- [ ] P22.6 — **Production check** — all of §12 works on production

---

## 12. FINAL DEFINITION OF DONE

The project is complete **only** when this works end-to-end on real data (not because "all pages exist"):

`LOGIN → CREATE CUSTOMER → CONTACT → PRODUCT → OPPORTUNITY → QUOTATION → EDIT/REVISION → APPROVAL → PDF DOWNLOAD → CONVERT TO SO → UPDATE FULFILLMENT → PARTIAL INVOICE → REMAINING INVOICE → RECORD PAYMENT → ALLOCATE → PAYMENT RECEIPT → CUSTOMER SOA → VIEW OUTSTANDING → VIEW AGING → VIEW AUDIT HISTORY`

plus: permissions verified per role, mobile checked, all PDFs correct, T-01…T-12 green, docs written.

---

## 13. BLOCKERS & OPEN QUESTIONS

| ID | Date | Description | Related task | Status |
|---|---|---|---|---|
| B1 | 2026-09-28 | Git is not installed or not in PATH | P0.1 | BLOCKED |
| B2 | 2026-09-28 | PostgreSQL and Docker are not installed | P0.5 | RESOLVED |

Ask the user only for decisions that materially change DB model, workflow, financial calculation, security, or user-facing behaviour (see rule 10).

## 14. DECISIONS LOG

| Date | Decision | Reason |
|---|---|---|
| plan | PostgreSQL from day 1 (no SQLite) | Avoid SQLite/Postgres behavioural drift |
| plan | Defaults A1–A7 in §8 | Resolve spec ambiguities without blocking |
| 2026-09-28 | Local PostgreSQL, no Docker | Use locally installed PostgreSQL on localhost:5432 |

*(Append new rows as decisions are made.)*

---

## 15. HOW TO START

Begin at **P0.1**. Work strictly in phase order (except where §2 notes parallelism). After each task: verify acceptance → tick the box → update §2 if the phase status changed. At the end of every session: write the Session Log entry with an exact **NEXT UP** task ID.
