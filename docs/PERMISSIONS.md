# Roles and Permissions

Chivon Mechanical uses a Role-Based Access Control (RBAC) system. Every user is assigned a single Role, and each Role has a set of Permissions.

## Permission Structure
Permissions are formatted as `MODULE.ACTION` (e.g., `QUOTATION.APPROVE`, `CUSTOMER.VIEW`).

**Available Modules:**
`CUSTOMER`, `INQUIRY`, `OPPORTUNITY`, `PRODUCT`, `STOCK`, `QUOTATION`, `SALES_ORDER`, `INVOICE`, `PAYMENT`, `CREDIT_NOTE`, `SOA`, `TASK`, `DOCUMENT`, `REPORT`, `DASHBOARD`, `AUDIT`, `USER`, `ROLE`, `SETTINGS`.

**Available Actions:**
`VIEW`, `CREATE`, `EDIT`, `DELETE`, `APPROVE`, `SEND`, `DOWNLOAD`, `SHARE`, `EXPORT`, `CANCEL`, `REVERSE`, `MANAGE`.

## Default Roles

1. **SUPER_ADMIN:** Has unrestricted access to all modules and actions.
2. **ADMIN:** Nearly everything; cannot modify or remove the Super Admin.
3. **MANAGER:** Full access to Sales, CRM, and Finance modules. Includes `APPROVE` permissions for Quotes and Invoices.
4. **SALES:** Access to Customers, Inquiries, Opportunities, Quotes, and Sales Orders. No access to financial edits (Invoices/Payments) or approval rights.
5. **ACCOUNTS:** Access to Invoices, Payments, SOA, Receivables, and Reports. Read-only access to Customers.
6. **INVENTORY:** Access to Products, Services, Stock, and read-only access to Customers.
7. **VIEWER:** Read-only access to permitted modules. No create/edit rights.

## Enforcement
Permissions are enforced strictly on the server:
1. **Route Handlers / Server Actions:** Must check `PermissionService.requirePermission(userId, 'MODULE.ACTION')` before proceeding.
2. **UI Rendering:** The Sidebar and UI action buttons (like 'Create Quote') conditionally render based on the user's permissions, but this is only for UX. The true guard is on the server.

## Audit Logging
Changes to a user's role, or modifications to a role's permissions, are strictly audited via the `AuditService`.
