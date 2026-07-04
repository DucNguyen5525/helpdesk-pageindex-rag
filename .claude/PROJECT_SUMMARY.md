# Project Summary

**Last Updated:** 2026-07-04 23:37:00 +07:00  
**Session:** #4 - GCLI Proxy Key Rotation Integration

---

## 1. Project Overview

- **Type:** Full-stack web app MVP for Helpdesk Q&A over preprocessed PageIndex data.
- **Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, MongoDB Atlas, Cloudflare R2, GCLI Proxy (Key Rotation), PageIndex JSON/tree data.
- **Package Manager:** npm workspaces.
- **i18n:** None. Gemini prompt answers in Vietnamese by default.
- **State Management:** React local state plus browser local storage for retrieval settings.
- **Styling:** Tailwind CSS with compact admin/chat UI.
- **Deployment:** Vercel for `apps/web`; optional Railway only for `workers/pageindex-ingest` long-running ingestion.

---

## 2. File Structure

### Key Directories

```text
apps/web/                         Next.js UI and API runtime
apps/web/app/api/                 Next.js API routes for chat, retrieval, documents, sessions
apps/web/lib/server/              MongoDB, R2, GCLI/Gemini, PageIndex import/retrieval modules
apps/web/app/chat/                Main chatbot UI
apps/web/app/admin/documents/     PageIndex JSON import and document list UI
apps/web/app/admin/debug/         Vectorless retrieval debug UI
apps/web/app/settings/            Retrieval topK/tag settings UI
packages/shared/                  Shared TypeScript contracts
scripts/import-pageindex.ts       Local TS importer for existing PageIndex JSON
workers/pageindex-ingest/         Optional Python worker/tooling for PageIndex processing
apps/api/                         Disabled legacy Express/Supabase API; not in workspaces
supabase/                         Disabled legacy pgvector migration; not in workspaces
```

### Critical Files

| File | Purpose | Notes |
| --- | --- | --- |
| `package.json` | Root workspace scripts | Builds shared and web only. |
| `.env.example` | MongoDB/R2/GCLI env template | GCLI_BASE_URL, GCLI_API_KEYS, GCLI_MODEL, GCLI_ROTATION_STRATEGY. |
| `README.md` | Human setup and deployment guide | Documents Vercel/MongoDB/R2/PageIndex flow. |
| `LEGACY_DISABLED.md` | Legacy cleanup note | Explains locked old `apps/api` and `supabase`. |
| `apps/web/lib/server/mongodb.ts` | MongoDB connection cache | Suitable for Next.js/Vercel serverless runtime. |
| `apps/web/lib/server/repository.ts` | MongoDB collections/repository | Documents, nodes, conversations, messages. |
| `apps/web/lib/server/retrieval.ts` | PageIndex vectorless retrieval | Keyword/title/path/summary/content scoring; no embeddings. |
| `apps/web/lib/server/gemini.ts` | GCLI Key Rotation & grounded answer generation | Supports SWRR / Weighted Random, failover retry, model mapping. |
| `apps/web/lib/server/pageindex-importer.ts` | PageIndex JSON import orchestration | Optional R2 backup, Mongo upsert. |
| `workers/pageindex-ingest/import_pageindex_to_mongo.py` | Optional worker import entrypoint | Supports source-file processing or existing JSON import. |

---

## 3. Architecture & Patterns

### Component Structure

Frontend uses functional React components in Next.js app router pages. Client pages use `"use client"` for state, file inputs, and local storage.

### State Management

State remains page-local. Retrieval settings store `topK` and comma-separated tag filters in local storage.

### Styling Approach

Tailwind utility classes directly in TSX. UI remains operational/admin-focused.

### API Integration

Frontend calls same-origin Next API routes through `apps/web/lib/api-client.ts`. `NEXT_PUBLIC_API_URL` is no longer used.

### Routing

Next.js provides both UI routes and runtime API routes:

```text
/chat
/admin/documents
/admin/debug
/settings
/api/chat
/api/chat/retrieve
/api/chat/sessions
/api/chat/sessions/[id]/messages
/api/documents
/api/documents/import
```

### Backend Layers

Runtime server logic is under `apps/web/lib/server/`. API route handlers parse/validate HTTP input and call modules for repository, retrieval, import, R2, and Gemini/GCLI.

---

## 4. Active Features & Status

| Feature | Status | Files Involved | Notes |
| --- | --- | --- | --- |
| Next.js runtime consolidation | Completed | `package.json`, `apps/web/app/api/*` | Main API now deploys with Vercel. |
| Dify removal | Completed | Full repo scan | No Dify code/env/routes found in current source. |
| Supabase/pgvector removal from runtime | Completed | `package.json`, `.env.example`, `README.md`, `LEGACY_DISABLED.md` | Old dirs remain OS-locked but disabled and ignored. |
| MongoDB data layer | Completed | `mongodb.ts`, `repository.ts` | Connection caching and collection indexes. |
| Cloudflare R2 layer | Completed | `r2.ts`, importer modules | Used for optional PageIndex JSON backup. |
| PageIndex vectorless retrieval | Completed | `retrieval.ts` | Lexical score over title/path/summary/content; no embeddings. |
| GCLI Key Rotation LLM layer | Completed | `gemini.ts`, `env.ts`, `/api/chat` | Replaces raw Gemini SDK with SWRR/Weighted Random key rotation, failover, model mapping. |
| PageIndex import API/UI | Completed | `/api/documents/import`, admin documents page | Imports existing PageIndex JSON. |
| Local TS import script | Completed | `scripts/import-pageindex.ts` | `npm run import:pageindex -- --file ...`. |
| Optional Python ingestion worker | Completed | `workers/pageindex-ingest/*` | Not run in Vercel runtime. |
| Authentication | Planning | None | Needed before public use. |
| Automated tests | Planning | None | Not added yet. |

**Legend:** Planning / In Progress / Completed

---

## 5. Known Issues & TODOs

### High Priority

- [x] Run `npm install` to update dependencies.
- [ ] Refresh or regenerate `package-lock.json` if needed.
- [ ] Verify MongoDB Atlas and R2 credentials in a real environment.
- [ ] Add authentication/admin gate before public deployment.

### Medium Priority

- [x] Re-run `npm run typecheck` and `npm run build` after dependencies install.
- [ ] Add tests for `flattenPageIndexTree`, retrieval scoring, import route, and chat route with mocked Gemini.
- [ ] Physically delete `apps/api/` and `supabase/` on a machine where Windows filesystem permits deletion.

### Low Priority / Nice to Have

- [ ] Add richer PageIndex schema normalization if real PageIndex JSON differs from supported shapes.
- [ ] Add streaming Gemini responses.
- [ ] Add feedback UI and API route for `feedback` collection.

---

## 6. Dependencies & External Resources

### Key Dependencies

- `next` - UI and API runtime.
- `react`, `react-dom` - UI runtime.
- `tailwindcss` - Styling.
- `lucide-react` - Icons.
- `mongodb` - MongoDB Atlas client for Next.js API routes.
- `@aws-sdk/client-s3` - S3-compatible Cloudflare R2 client.
- `zod` - API validation.
- `tsx` - Local TypeScript import script runner.

### External APIs / Services

- MongoDB Atlas - Documents, PageIndex nodes, conversations, messages, feedback.
- Cloudflare R2 - Original files and PageIndex JSON backups.
- GCLI Proxy Upstream - OpenAI-compatible endpoint for Gemini models with key rotation.
- Vercel - Main app/runtime deployment.
- Railway - Optional worker deployment only.

---

## 7. Important Notes for Claude

### When making changes to:

- **Retrieval:** Do not add embeddings, vector search, pgvector, or vector DB calls.
- **Runtime APIs:** Add Next.js API routes in `apps/web/app/api`, not Express routes.
- **Persistence:** Use `apps/web/lib/server/repository.ts` and MongoDB.
- **Storage:** Use R2 only through `apps/web/lib/server/r2.ts` or worker tooling.
- **PageIndex processing:** Keep it in `workers/pageindex-ingest/` or local scripts, not Vercel runtime.
- **Legacy dirs:** Treat `apps/api/` and `supabase/` as disabled legacy artifacts unless explicitly cleaning filesystem locks.

### Testing checklist:

- [ ] `npm install`
- [ ] `npm run build --workspace @helpdesk/shared`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Import PageIndex JSON against real MongoDB/R2.
- [ ] Ask a chat question and verify sources.

### Do not forget to:

- Update this file's timestamp and session number after changes.
- Follow `.claude/CONVENTIONS.md`.
- Keep `.claude/IMPORTANT_FIXED_BUGS.md` only for important recurring-risk bugs.

---

## 8. Quick Commands

```bash
npm install
npm run dev --workspace @helpdesk/web
npm run typecheck
npm run build
npm run import:pageindex -- --file ./data/warranty-index.json --title "Warranty Policy" --slug warranty-policy --tags helpdesk,warranty
```

Python worker commands must be run only inside the approved Conda environment for this workspace.

---

**Critical:** Read this entire file before making any changes to the project.
