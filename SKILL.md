---
name: chivon-engineering
description: Mandatory engineering standards for the Chivon Mechanical CRM/ERP (Next.js, TypeScript, Prisma, PostgreSQL). Use for EVERY coding task in this repo — writing features, schema changes, server actions, financial logic, PDFs, UI, tests, migrations, or claiming a task is done. Prevents common AI mistakes: invented APIs, fake features, unverified "done" claims, insecure server actions, float money, non-atomic writes, scope creep, and destructive commands.
---

# Chivon CRM/ERP — Engineering Skill

This is a **financial business application** (quotes, invoices, payments, receivables) used by real staff. A silent bug here means wrong money, wrong customer statements, or lost records. Act like a careful senior engineer, not a fast code generator.

Read alongside: `IMPLEMENTATION_PLAN.md` (what/when/progress) and `SPEC.md` (detailed requirements).

---

## 1. PRIME DIRECTIVES

1. **Correct > fast > pretty.** Never trade financial correctness or security for speed or looks.
2. **Verify, don't assume.** Nothing is "done" until you have *run* it and seen it work. Evidence beats confidence.
3. **Be honest about status.** Never claim something works, passes, or is complete if you did not run it. Say exactly what you tested and what you did not.
4. **Stay in scope.** Build the current task. Do not build V2 features, extra modules, or "nice-to-haves" that aren't in the plan.
5. **Protect existing work.** Never overwrite, delete, or rewrite working code/data beyond what the task requires.
6. **Reuse before creating.** Use existing shared components, services, and utilities. Do not duplicate.
7. **When unsure about a fact, look it up** (installed package types, official docs, existing code). Never invent.

---

## 2. THE MISTAKES AI AGENTS MAKE — AND THE RULE THAT PREVENTS EACH

| Common AI mistake | What you must do instead |
|---|---|
| **Inventing APIs, packages, config keys, or props** that don't exist | Check the installed version in `package.json`, read the package's types in `node_modules` or its official docs before using an API. If you can't verify it, don't use it. |
| **Using outdated patterns** from training data (Next.js, Prisma, Auth.js, Tailwind, shadcn change often) | Read the installed version's docs. Examples to check: async `params`/`searchParams`/`cookies()`/`headers()` in current Next.js, middleware vs proxy file naming, Prisma client/generator config, Auth.js v5 env names. Follow what the *installed* version requires. |
| **Saying "done" without running anything** | Run typecheck, lint, tests, and the actual feature (browser). Quote the commands/results in your report. |
| **Fake functionality**: buttons that do nothing, hard-coded numbers, mock arrays, `// TODO`, placeholder handlers | Every control must call real logic and persist to PostgreSQL. If a feature is V2, label it "Coming Soon" — do not fake it. Zero TODOs left in code you mark done. |
| **Scope creep / building V2** | Only what the current plan task says. Note ideas in the plan's Decisions Log, don't build them. |
| **Over-engineering** (needless abstractions, extra libraries, generic frameworks) | Simplest solution that meets the acceptance criteria and the architecture. No new dependency without a clear reason logged in the plan. |
| **Under-engineering** (skipping validation, errors, edge cases, empty/loading states) | Follow the Module Definition of Done in the plan (§10). Handle empty, loading, error, and boundary cases. |
| **Swallowing errors** (`catch {}`, `console.log` and continue) | Catch deliberately, log server-side (no secrets), return a structured `ActionResult` with a user-friendly message. Never show raw Prisma/stack errors to users. |
| **Weak typing** (`any`, `as unknown as`, `@ts-ignore`, non-null `!` to silence errors) | TypeScript strict. Use Zod-inferred types at boundaries. Fix the type problem; don't silence it. |
| **Floating-point money** | `Decimal` everywhere for money (DB `Decimal(18,2)`, `Prisma.Decimal`/`decimal.js` in code). Never `Number` arithmetic on money, never `parseFloat` for amounts. |
| **Non-atomic multi-step writes** | Wrap in `prisma.$transaction`. Document numbers, documents, items, allocations, audit entries commit together or not at all. |
| **Race conditions / duplicates** (double-click, retries, concurrent numbering) | Idempotency keys + DB unique constraints + disabled submit buttons. Number generation only via `DocumentNumberService`. |
| **Trusting the client** (hidden buttons as "security", IDs from forms, client-computed totals) | Server re-checks authentication, permission, ownership/entity existence, and **recomputes all money server-side**. Client values are hints only. |
| **Unprotected server actions / route handlers** (they are public HTTP endpoints) | Every action/handler starts with: authenticate → authorize (`PermissionService`) → validate (Zod) → execute → audit. No exceptions. |
| **N+1 queries, `SELECT *`, loading thousands of rows** | Use `select`/`include` deliberately, server-side pagination/sort/filter, indexes on filtered columns. |
| **Business logic inside React components** | Logic in `server/services/*`. Components render and call actions. |
| **Copy-paste duplication** of tables, forms, badges, PDF code | Use shared components (`DataTable`, `StatusBadge`, `MoneyDisplay`, `DocumentActions`, …) and one `PdfService`. |
| **Destructive commands** (`prisma migrate reset`, `db push --force-reset`, `DROP`, `rm -rf`, `git reset --hard`, `git push --force`) | Never run against anything but the disposable local dev DB, and only when the task requires it. Never against production. Ask first if unsure. |
| **Editing applied migrations / hand-editing prod schema** | Schema change → new Prisma migration → test locally → commit. Never edit a migration already applied elsewhere. |
| **Committing secrets / logging secrets** | `.env` git-ignored; `.env.example` has names only. Never log passwords, tokens, keys, full request bodies with credentials. |
| **Context drift on long tasks** (forgetting rules, contradicting earlier decisions) | Re-read `IMPLEMENTATION_PLAN.md` at session start and before each new phase. Update it as you go. |
| **Large unreviewable changes** | Small, focused, verifiable steps; commit after each verified task. |
| **Guessing business rules** | The spec defines them. Read the relevant `SPEC.md` section. If truly ambiguous and it changes money/workflow/data model/security, ask; otherwise pick the simplest sensible default and log it. |
| **Timezone/date bugs** | See §7. |

---

## 3. WORKING LOOP FOR EVERY TASK

1. **Read** `IMPLEMENTATION_PLAN.md`: find the task, confirm dependencies are `[x]`, read its acceptance criteria and the referenced `SPEC.md` sections.
2. **Inspect** the current code: what exists, what conventions are used, what can be reused. Check `git status` first so you know what's uncommitted.
3. **Plan briefly**: files to touch, schema changes, edge cases, tests. Mark the task `[~]`.
4. **Implement** in small steps. Follow §4–§9.
5. **Verify** (§10): typecheck, lint, tests, and run the feature end-to-end in the browser with real seeded data.
6. **Update docs/plan**: tick `[x]` only if acceptance criteria are met; update the phase status, Decisions Log, Blockers, and Session Log.
7. **Commit** with a clear message (`feat(quotation): create revision from saved revision`), one logical change per commit.
8. **Report** concisely: what changed, how it was verified, what is *not* done or not tested, and the next task.

If you are about to run out of context or stop: leave the repo in a working state, mark partial tasks `[~]`, and write a precise Session Log entry with the exact next step.

---

## 4. ARCHITECTURE RULES

```
React UI → Server Actions / Route Handlers → Service Layer → Prisma → PostgreSQL
```

- Browser never touches the database or DB credentials. No separate Express/Nest backend.
- One service per domain in `server/services/` (`QuotationService`, `InvoiceService`, `PaymentService`, …). Cross-domain flows (quote→SO, SO→invoice, allocate payment) live in services and are transactional.
- All server functions return `ActionResult<T> = { success: boolean; data?: T; error?: string; message?: string }`.
- Numbers: only `DocumentNumberService`. PDFs: only `PdfService`. Storage: only `StorageService`. Permissions: only `PermissionService`. Audit: only `AuditService`.
- V2 integrations (email, WhatsApp API, AI) exist only as interfaces + `Mock*` implementations. Don't wire real ones.
- Environment variables are read through a Zod-validated env module, not scattered `process.env` calls.

---

## 5. SECURITY CHECKLIST (run mentally for every server action / handler)

- [ ] Authenticated? (session required; inactive users rejected)
- [ ] Authorized? (`MODULE.ACTION` permission checked server-side, not just hidden in UI)
- [ ] Input validated with Zod on the server (types, ranges, enums, max lengths)
- [ ] Referenced IDs exist and are allowed for this action (no trusting client-supplied totals, statuses, or created-by)
- [ ] State transition legal per the status machine (reject arbitrary status changes)
- [ ] Money recomputed server-side from items, never taken from the client
- [ ] Wrapped in a transaction if it writes more than one row
- [ ] Idempotent against double submit (idempotency key / unique constraint)
- [ ] Audit log written (who, what, entity, before/after where relevant)
- [ ] Errors mapped to safe messages; details logged server-side without secrets
- [ ] Output escaped (no `dangerouslySetInnerHTML` with user content); uploads validated by extension **and** MIME, size ≤ 10 MB, allowed types only, stored via `StorageService`, never as DB blobs
- [ ] Passwords hashed (bcrypt/argon2), cookies secure/httpOnly, no secrets in client bundles

Roles and permissions are data (tables), not `if (role === "ADMIN")` scattered in components.

---

## 6. DATABASE & MONEY RULES

- Money columns `Decimal(18,2)` (quantities/rates may need more precision — decide once, document it). Round **half-up to 2 dp per line**, then sum the rounded lines for document totals. Use the shared calculation functions from `lib/money` only — never re-implement VAT/discount math in a component or another service.
- **Never store outstanding as the source of truth.** `Outstanding = InvoiceTotal − Σ valid allocations − Σ valid credit notes`, computed. Derived statuses (e.g., `OVERDUE`) are computed, not persisted.
- Financial history is immutable: reverse/cancel with a new record + reason; do not edit posted payments or delete issued invoices.
- Every schema change = Prisma migration. Add indexes for columns used in filters/sorts (see plan §7.5). Add DB-level constraints where possible (uniques on document numbers and idempotency keys; check that an invoice has a quotation or sales order source).
- Use `select` to fetch only needed fields on list views. Paginate on the server. Avoid N+1 (batch with `include`/`in` queries).
- Seed scripts must be idempotent and internally consistent (totals, allocations, and statuses must reconcile).

---

## 7. DATES & TIME (UAE)

- Store timestamps in UTC (`timestamptz`). Business day and display timezone: **Asia/Dubai (UTC+4, no DST)**.
- Document-number date keys (`QT-YYYYMMDD-####`), "today", "overdue", aging, and dashboard periods use the **Dubai calendar date**, not the server's UTC date. Deploy servers run in UTC — a naive `new Date()` at 21:00 UTC is already tomorrow in Dubai.
- Date-only concepts (due date, valid until, payment date, SOA range) are dates, not timestamps; compare by date.
- Format dates consistently through `DateDisplay`; format money through `MoneyDisplay` (AED, 2 decimals, thousands separators).

---

## 8. UI / UX STANDARDS

- **All UI follows `DESIGN.md` and uses the shared motion primitives. No hard-coded colors, fonts, spacing or ad-hoc animations in components. No unstyled default elements. Every new screen must include loading, empty, error and entrance-motion states.**
- Enterprise business app: dense, readable, consistent. White / deep blue / sky blue / light blue / neutral gray; green/amber/red for status only. Animations are subtle and functional (Framer Motion), never distracting.
- Use shared components from P3; do not restyle per page. Standard record page layout: Header (number, status, actions) → summary cards → main info → line items → financial summary → timeline → documents → related records/lineage.
- Every async view has **loading (skeleton), empty, and error states**. Every submit button is disabled while pending and shows progress.
- Forms: React Hook Form + Zod, inline field errors, keyboard-friendly, labels tied to inputs, visible focus states, ARIA labels on icon buttons, sufficient contrast.
- Tables: server-side search (debounced 250–300 ms), sort, filter, pagination, column visibility, row actions.
- Destructive/irreversible actions (cancel, reverse, delete) require a `ConfirmDialog` and a reason where the spec says so.
- Desktop-first, fully responsive: cards instead of dense tables on mobile, collapsible filters, no horizontal page scroll.
- Toasts via react-toastify for success/error. Messages are specific ("Sales Order SO-… created"), never "Something went wrong" without context.
- After creating something, navigate/refresh so the user sees real persisted data (revalidate caches properly).

---

## 9. PDFs

- Generated **server-side** by `PdfService` from structured data using shared templates (Quotation, Sales Order, Invoice, Payment Receipt, SOA). Not browser screenshots.
- All company details, logo, TRN, bank info, and terms come from `CompanySetting` — never hard-coded.
- Include everything listed in the spec for that document; use the exact filename patterns (`QT-…-REV2.pdf`).
- Always test with: long names/addresses/terms, 20+ line items (multi-page), large amounts, discounts, VAT, missing optional fields. Totals must never overlap, split badly, or disappear across page breaks.
- Amount-in-words must be correct for AED and fils.
- Actually open/inspect the generated PDF (render to image and look) before claiming a PDF task is done.

---

## 10. VERIFICATION — WHAT "DONE" MEANS

Before marking any task `[x]`, do all that apply and record the results:

1. `npm run typecheck` and `npm run lint` — zero errors.
2. `npm run test` — new logic has unit/integration tests; all pass. Tests cover: normal path, boundaries (0, 1, max), invalid input, forbidden transition, permission denied, duplicate submit, concurrency (numbering, allocations).
3. Migrations apply cleanly on a fresh local DB and seed runs.
4. **Run the feature in the browser** (use Antigravity's browser/preview): click through the real flow with seeded data, including error paths and a mobile viewport. Confirm data persisted by reloading.
5. Check the database result when money is involved (totals, statuses, allocations reconcile).
6. Confirm the audit log entry was written.
7. Confirm no console errors, no leftover TODOs/`console.log`, no unused code.
8. Re-check the task's acceptance criteria one by one, and the plan's Module Definition of Done.

If something can't be verified (e.g., needs credentials), mark the task `[~]` or `[!]` and say so plainly. **Never** mark `[x]` on the strength of "it should work".

Critical financial invariants that must always hold (test them):
- Invoice total = Σ line totals; allocations never exceed payment or invoice outstanding; invoiced total never exceeds SO total; only the latest quotation revision can be sent; exactly one current revision; document numbers unique and sequential per prefix/day.

---

## 11. CODE QUALITY

- TypeScript strict; explicit types at module boundaries; Zod schemas shared between client and server where practical.
- Small functions, clear names (domain vocabulary: quotation, revision, allocation, receivable, SOA). No dead code, no commented-out blocks, no magic numbers (name constants such as the default VAT rate — and read VAT from settings).
- Comments explain *why* (business rules, non-obvious decisions), not *what*.
- Keep components small; server components by default, client components only where interactivity requires.
- Prefer boring, well-known solutions. Add a dependency only when it clearly beats writing 20 lines; check it is maintained and works in serverless (Netlify) runtimes.
- Consistent file naming and folder structure per the plan §7.1. Follow existing patterns in the repo before inventing new ones.
- Error handling and logging: structured server logs for failed document creation, PDF failures, DB errors, and auth errors — without secrets.

---

## 12. GIT & ENVIRONMENT HYGIENE

- Commit locally after every verified task. NEVER run git push. Before ending any session, tell the human how many commits are unpushed so they can push with GitHub Desktop.
- Don't rewrite history or force-push. Don't discard uncommitted changes you didn't make.
- Local dev DB is disposable; production is sacred. Never point local tooling at production credentials.
- Keep `.env.example` in sync when adding an env var. Document any new setup step in README/DEPLOYMENT.
- Don't leave debug endpoints, seed passwords in UI outside development, or test bypasses in production paths.

---

## 13. COMMUNICATION

- Progress reports are short and factual: **Done / Verified by / Not done or not tested / Next**.
- Log design choices in the plan's Decisions Log; log blockers in the Blockers table.
- Ask the user only when a decision materially affects the DB model, business workflow, financial calculation, security model, or user-visible behavior. Otherwise choose the simplest production-sensible option, proceed, and log it.
- If the spec seems wrong or contradictory, say so, propose the smallest safe resolution, log it, and continue (unless it changes money/security — then ask).
- Never hide a failed test or a shortcut. Surface it.

---

## 14. FINAL PRE-COMPLETION CHECKLIST (per task)

- [ ] Matches the plan task and its acceptance criteria — nothing extra, nothing missing
- [ ] Real DB data, real logic, no mock/placeholder behavior
- [ ] Auth + permission + Zod validation + transaction + idempotency + audit where applicable
- [ ] Money uses Decimal and shared calculation functions
- [ ] Loading / empty / error states; responsive; accessible
- [ ] Typecheck, lint, tests pass; feature clicked through in the browser
- [ ] No secrets, no TODOs, no stray logs, no dead code
- [ ] Plan file updated (checkbox, dashboard, decisions, blockers, session log)
- [ ] Committed with a clear message
