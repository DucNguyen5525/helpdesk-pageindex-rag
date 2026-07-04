# Instructions for Claude Code

---

## Core Principle

Read `.claude/PROJECT_SUMMARY.md` first, not the entire codebase.
Update documentation after every change.

---

## Before Any Task

### 1. Read in order

```text
.claude/PROJECT_SUMMARY.md     -> Project state, architecture, active features
.claude/CONVENTIONS.md         -> Coding standards, if implementation is needed
Specific files user mentioned  -> Only if needed for implementation
```

### 2. Do Not Read by Default

- Do not read the entire `apps/` or `packages/` tree just to understand the project.
- Do not re-read files already summarized in `PROJECT_SUMMARY.md` unless the task touches them.
- Do not do broad searches before reading project context.

---

## After Any Task

### Update PROJECT_SUMMARY.md

Always update:

- Top: `Last Updated` timestamp and session number.
- `Active Features & Status`: update feature status if changed.
- `Known Issues & TODOs`: mark completed TODOs and add new current TODOs/issues.

Update if changed:

- `File Structure`.
- `Dependencies & External Resources`.
- `Architecture & Patterns`.
- `Quick Commands`.

Do not use `PROJECT_SUMMARY.md` to store changelog, change history, recent changes, Recent Changes, last 3, Last 3 Sessions, Section 7, lịch sử thay đổi, or bug-fix log. If an important bug is high-impact, hard to detect, likely to recur, or affects architecture/API/migration/workflow, record it briefly in `.claude/IMPORTANT_FIXED_BUGS.md`.

---

## Reading Priority

```text
1. Always      -> .claude/PROJECT_SUMMARY.md
2. If needed   -> .claude/CONVENTIONS.md
3. If needed   -> Files mentioned in the user request
4. Rarely      -> Other source files
```

---

## Project Quick Reference

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, MongoDB Atlas, Cloudflare R2, PageIndex JSON/tree data, Google Gemini Flash, npm workspaces.

**Key Files:**

- `README.md` - Human setup, architecture, endpoint, and deployment guide.
- `apps/web/app/api/chat/route.ts` - Main grounded chat API route.
- `apps/web/lib/server/retrieval.ts` - PageIndex vectorless retrieval.
- `apps/web/lib/server/repository.ts` - MongoDB data access.
- `apps/web/lib/server/r2.ts` - Cloudflare R2 helper.
- `apps/web/app/chat/page.tsx` - Main chat interface.
- `apps/web/app/admin/documents/page.tsx` - PageIndex JSON import UI.
- `workers/pageindex-ingest/` - Optional PageIndex processing worker/tooling.

**Dev Commands:**

```bash
npm install
npm run build
npm run typecheck
npm run dev --workspace @helpdesk/api
npm run dev --workspace @helpdesk/web
```

---

## Coding Rules

### Think Before Coding

- State assumptions explicitly when they matter.
- If multiple interpretations exist, surface them before implementing.
- If the simpler approach is enough, use it.
- If something is unclear and risky, ask before changing structure.

### Simplicity First

- No features beyond what was asked.
- No abstractions for single-use code.
- No speculative configurability.
- Prefer the minimum maintainable code that solves the requested behavior.

### Surgical Changes

- Touch only files needed for the task.
- Match existing style even when another style is possible.
- Do not refactor adjacent code unless required.
- Remove only unused code created by the current change.

### Goal-Driven Execution

For multi-step work, define success criteria and verify them:

```text
1. Implement change -> verify build/typecheck or targeted command
2. Update docs -> verify PROJECT_SUMMARY.md reflects current state
3. Report outcome -> include commands run and any known limitations
```

---

## Documentation Structure

```text
project-root/
├── CLAUDE.md
└── .claude/
    ├── PROJECT_SUMMARY.md
    ├── CONVENTIONS.md
    ├── IMPORTANT_FIXED_BUGS.md
    └── SETUP_REPORT.md
```

---

## Notes for Claude

- This project is an MVP for personal use; keep it lightweight and understandable.
- Runtime server code lives in Next.js API routes plus `apps/web/lib/server/*`.
- Server modules validate required environment variables when runtime routes/scripts use them.
- No authentication exists yet; do not imply this is safe for public exposure without adding auth.
- Accuracy is more important than creativity: answers must be grounded in retrieved PageIndex nodes.

---

**Remember:** Documentation is the source of truth for future sessions.
