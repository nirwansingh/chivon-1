# Chivon Mechanical CRM/ERP — Always-On Rules

Before starting ANY task in this repository:
1. Read IMPLEMENTATION_PLAN.md (follow its Resume Protocol, and update it as you work).
2. Follow the chivon-engineering skill (SKILL.md) for all code, security, verification and reporting standards.
3. SPEC.md holds the detailed business requirements — open the relevant section before implementing a feature.

4. Commit locally after every verified task. NEVER run git push. Before ending any session, tell the human how many commits are unpushed so they can push with GitHub Desktop.

5. **CRITICAL RULE:** EVERY TIME you finish any action or task, you MUST immediately update `IMPLEMENTATION_PLAN.md` to reflect the new state. Do not wait until the end of the session!

6. **All UI follows DESIGN.md and uses the shared motion primitives. No hard-coded colors, fonts, spacing or ad-hoc animations in components. No unstyled default elements. Every new screen must include loading, empty, error and entrance-motion states.**

Never mark a task done without running and verifying it. Never build V2 features or fake/mock functionality.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
