# Architecture Overview

## Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI & Styling:** Tailwind CSS, shadcn/ui, Framer Motion
- **Forms:** React Hook Form + Zod
- **Database:** PostgreSQL (via Prisma ORM)
- **Auth:** NextAuth (Auth.js) with Credentials provider (JWT session)
- **PDF Generation:** @react-pdf/renderer
- **File Storage:** Object Storage via `StorageService` (Supabase Storage impl)

## Core Principles
1. **Server-Side Data Logic:** The browser never touches Prisma. All data fetching and mutations go through Server Actions or Route Handlers, down to a `Service Layer`, and finally to Prisma.
2. **Service Layer:** Business logic lives exclusively in the `server/services/` directory. React components (Client or Server) do not contain business rules.
3. **Atomic Operations:** Multi-step writes (e.g., converting a Quotation to a Sales Order) are wrapped in Prisma transactions.
4. **Immutability of Documents:** Invoices, confirmed Sales Orders, and approved Quotations are never deleted. They are marked as `CANCELLED` and appended with a cancellation reason.
5. **Money Handling:** Uses `Prisma.Decimal` (mapped to `Decimal(18,2)` or `18,4` in the DB) to avoid floating-point errors.
6. **Zod Validation:** Strict validation on all inputs (client-side for UX, server-side for security).

## Directory Structure
- `/app`: Next.js App Router pages (Dashboard, CRM, Sales, Finance modules).
- `/components`: Reusable UI components (DataTable, Modal, Buttons, PageHeader).
- `/lib`: Helper functions (money formatting, status machines, utilities).
- `/server/services`: The core business logic (e.g., `CustomerService`, `QuotationService`, `InvoiceService`).
- `/server/pdf`: PDF templates and generation service.
- `/prisma`: Database schema and migrations.
- `/tests`: Unit, Integration, and E2E test suites.

## State Management
Global state is minimized. Data is fetched server-side and passed down to Client Components. Forms use React Hook Form for local state.

## Security
- **Authentication:** Managed by NextAuth.
- **Authorization:** `PermissionService` enforces Role-Based Access Control (RBAC). Every service method and server action verifies the user's role and permissions.
- **Audit Logging:** Critical actions (Create, Edit, Delete, Approve, Convert) are logged via `AuditService`.
