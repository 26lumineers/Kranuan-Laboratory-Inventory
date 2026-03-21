# Laboratory Inventory — Agent Rules

This document defines how any AI agent or developer must behave when contributing to this project.

The goal is consistency, scalability, and production-readiness.

## instruction

-   can create file, but don't remove anything on my computers.
- read opencode.md first for get better context
---

## 1. Core Principles

-   Always prioritize correctness, scalability, and maintainability.
-   Avoid premature optimization.
-   Do not introduce unnecessary complexity.
-   Favor explicit design over magic.
-   All changes must align with domain-driven design.
-   The system must remain observable and auditable.

---

## 2. Architecture Overview

This system is a monorepo with the following stack:

Frontend:

-   Next.js
-   Responsive mobile-first design
-   Eden validation
-   Types shared with backend

Backend:

-   Bun runtime
-   Elysia framework
-   Drizzle ORM
-   PostgreSQL

---

## 3. Domain Model

This is a laboratory inventory system.

Key flow:
GENERAL user → request → automatic stock deduction.

Admin and Superadmin:

-   Cannot block transactions.
-   Only monitor and manage products and stock.

The system must always maintain a full audit trail.

---

## 4. Code Generation Rules

When generating code:

-   Follow existing folder structure.
-   Do not create new abstractions unless necessary.
-   Reuse existing services and utilities.
-   Do not duplicate logic.
-   Avoid tight coupling.
-   Prefer pure functions.
-   Keep functions small and composable.

---

## 5. Backend Rules

### 5.1 Elysia

-   All routes must be modular.
-   Routes must not contain business logic.
-   Use service layers.
-   Use schema validation for every request.
-   All endpoints must return typed responses.

### 5.2 Database

-   Use Drizzle ORM only.
-   No raw SQL unless justified.
-   Every write must be transactional.
-   Use database constraints for safety.
-   Prevent race conditions in stock deduction.

### 5.3 Inventory Safety

-   Always check stock availability.
-   Prevent negative inventory.
-   Use row-level locking or equivalent.
-   Record inventory movement for every change.

---

## 6. Frontend Rules

-   Mobile-first UI.
-   Accessibility must be considered.
-   Forms must be validated.
-   Use shared types from backend.
-   Avoid client-side business logic.

---

## 7. Security

-   Validate all inputs.
-   Never trust client data.
-   Enforce role-based access.
-   Prevent injection and XSS.
-   Use secure cookies and session management.

---

## 8. Observability

-   Log important events.
-   Log inventory movements.
-   Track performance.
-   Include correlation IDs.

---

## 9. Testing

-   Critical business logic must be unit tested.
-   Inventory flows must have integration tests.
-   Avoid brittle tests.

---

## 10. Notifications

The system must support:

-   Low stock alerts.
-   Abnormal usage alerts.
-   Future real-time notifications.

Design with extensibility.

---

## 11. Reporting

The system must support:

-   Daily, weekly, monthly reports.
-   Room-level analytics.
-   Usage insights.

---

## 12. Performance

-   Optimize database queries.
-   Avoid N+1.
-   Use caching when appropriate.
-   Do not sacrifice correctness for speed.

---

## 13. Documentation

Every major feature must include:

-   Explanation.
-   Tradeoffs.
-   Scalability considerations.

---

## 14. Decision Making

When unclear:

-   Choose the simplest scalable solution.
-   Document assumptions.
-   Avoid overengineering.

---

## 15. Forbidden Actions

-   No breaking database schema without migration.
-   No hidden side effects.
-   No global mutable state.
-   No silent failures.
-   No magic numbers.

---

## 16. Future-Proofing

The system should support:

-   Expiry tracking.
-   Batch tracking.
-   AI reorder.
-   Vendor and procurement.

Design changes with future compatibility in mind.

---

## 17. Commit Guidelines

-   Use conventional commits.
-   Explain why, not only what.
-   Keep commits small.

---

## 18. Continuous Improvement

The agent should suggest:

-   Better architecture.
-   Security improvements.
-   Performance improvements.

But must not refactor unrelated code without request.
## 19. Project structure
- refactor that follow this repo https://github.com/AzouKr/typescript-clean-architecture
