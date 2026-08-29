# HackShastra Backend — Execution Prompt

You are executing the HackShastra backend project using the existing `plan.md` file in this repository.

## Source of truth

Treat `plan.md` as the **only technical plan and architecture specification**.

Do NOT create a second plan, rewrite the plan in chat, or generate a replacement roadmap unless the user explicitly asks for changes to `plan.md`.

Use `execution_state.md` as the **live execution record**.

---

## Your responsibilities

1. Read `plan.md` before doing any implementation work.
2. Read `execution_state.md` before doing any implementation work.
3. Determine the current stage from `execution_state.md`.
4. Execute only the current stage from `plan.md`.
5. Do not silently start later stages.
6. Test the current stage thoroughly.
7. Fix problems discovered during testing.
8. Re-run the relevant tests after fixes.
9. Perform the production-readiness checks required for that stage.
10. Update `execution_state.md` with the actual current state.
11. Stop at the end of every major stage.
12. Ask the user for explicit approval before starting the next major stage.

---

## Critical approval behavior

Approval is stage-specific.

Approval of one stage does NOT mean approval of every future stage.

Never continue automatically across an approval gate.

### Prisma gate

When Stage 3 is complete and the project is ready for Prisma:

STOP.

Ask:

> The PostgreSQL architecture is ready and we have reached the Prisma integration stage. Do you want me to install Prisma, configure it, create the Prisma schema, generate the client, create migrations, and integrate Prisma into the backend?

Until the user explicitly approves, do not:

- install Prisma
- install `@prisma/client`
- run `npx prisma init`
- create `prisma/schema.prisma`
- create Prisma models
- generate Prisma Client
- create or run Prisma migrations
- run `prisma db push`
- import Prisma Client
- replace database access with Prisma

### Post-Prisma gate

After Stage 4 is completely implemented, tested, fixed, and documented:

STOP again.

Ask:

> Prisma integration is complete and has been tested. Do you want me to proceed with the next backend stage?

### Production deployment gate

After production preparation is complete:

STOP.

Ask:

> The backend has completed development, integration testing, security review, concurrency testing, and production-readiness checks. Do you want me to proceed with production deployment?

Do not deploy without explicit approval.

---

## Execution quality rules

- Follow `plan.md` rather than inventing a parallel architecture.
- Preserve working functionality when adding new stages.
- Prefer simple, maintainable production-ready code.
- Do not add dependencies without a reason.
- Do not add speculative future features.
- Keep controllers thin.
- Keep business logic in services.
- Keep validation separate from business logic.
- Keep external services such as email and Cloudflare isolated.
- Never hard-code secrets.
- Never trust frontend validation alone.
- Never expose admin functionality without authorization.
- Keep public visitor flows accountless.

---

## Required stage workflow

For the current stage, follow this sequence:

```text
Read current state
↓
Confirm scope from plan.md
↓
Implement
↓
Run the application
↓
Test
↓
Investigate failures
↓
Fix failures
↓
Re-test
↓
Review production concerns
↓
Update execution_state.md
↓
Stop
↓
Ask for approval to continue
```

Do not skip testing merely because the implementation appears straightforward.

---

## Questions policy

Ask questions only when the missing answer materially blocks or changes the current stage.

Do not repeatedly ask questions whose answers are already recorded in `execution_state.md` or in the conversation.

When a decision can safely remain unresolved until a later stage, record it as TBD in `execution_state.md` and continue the current stage.

Do not stop Stage 1 or Stage 2 simply because later-stage business decisions such as SMTP provider or registration fields have not yet been finalized.

---

## State-file maintenance

After meaningful work, update `execution_state.md` with:

- Current stage
- Current task
- What was implemented
- Files changed
- Tests performed
- Test results
- Problems found
- Problems fixed
- Known blockers
- Important decisions
- Next planned action
- Approval history when applicable

Do not fabricate successful tests or pretend an integration is complete when it was not actually verified.

---

## Progress report format

At the end of a stage, report:

```text
Current stage:
Status:
Implemented:
Files changed:
Tests run:
Test results:
Issues found:
Issues fixed:
Production review:
State-file updated:
Next stage:
Approval required:
```

Keep the report factual and concise.

---

## Starting instruction

Start by reading:

```text
plan.md
execution_state.md
```

Then execute **only the stage identified as the current stage in `execution_state.md`**.

At the end of that stage, stop and wait for explicit approval before moving to the next stage.
