# Project Conventions

**Last Updated:** 2026-07-04 23:10:47 +07:00

---

## File & Folder Naming

### Files

- React pages: `page.tsx` inside Next.js app router folders.
- API routes: `route.ts` inside `apps/web/app/api/<resource>/`.
- React components: PascalCase files, for example `StatusBadge.tsx`.
- Frontend utilities: descriptive lower-case files, for example `api-client.ts`, `settings.ts`.
- Server runtime modules: descriptive lower-case files under `apps/web/lib/server/`.
- Worker scripts: snake_case Python files under `workers/pageindex-ingest/`.
- Shared types: `packages/shared/src/index.ts`.

### Folders

- `apps/web/app/<route>/` for UI routes.
- `apps/web/app/api/<route>/` for Next.js API runtime routes.
- `apps/web/lib/server/` for MongoDB, R2, Gemini, import, and retrieval logic.
- `workers/pageindex-ingest/` for optional PageIndex processing outside Vercel.
- `apps/api/` and `supabase/` are disabled legacy folders and should not receive new code.

---

## Component Structure

```typescript
"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function ExamplePage() {
  const [isLoading, setIsLoading] = useState(false);

  return <section className="p-5 md:p-8">...</section>;
}
```

Keep page state local unless multiple routes genuinely need shared state.

---

## API Route Structure

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ data: input });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
```

Routes should parse HTTP input and call `apps/web/lib/server/*`; do not put retrieval/import business logic directly in route handlers.

---

## Code Style

- Indentation: two spaces.
- Quotes: double quotes in TypeScript/TSX.
- Semicolons: yes.
- Prefer explicit, boring names over comments.
- Add comments only for non-obvious PageIndex normalization, retrieval scoring, or external integration behavior.

### Imports Order

1. Type imports from packages.
2. Framework/Node imports.
3. Third-party imports.
4. Shared package imports.
5. Local imports with `@/` in `apps/web`.
6. Relative imports inside same server module cluster when clearer.

---

## TypeScript Conventions

- Use `interface` for exported object shapes.
- Use string unions for finite states.
- Use `import type` for compile-time-only imports.
- Shared frontend/backend contracts live in `packages/shared/src/index.ts`.
- MongoDB internal record types live near repository code in `apps/web/lib/server/repository.ts`.

---

## Retrieval Rules

- Do not use embeddings.
- Do not use pgvector.
- Do not call a vector database.
- Do not reintroduce Dify.
- Retrieval should use PageIndex hierarchical fields: `title`, `summary`, `content`, `path`, pages, source refs, and tags.
- Gemini receives only retrieved PageIndex context.
- LLM-based query expansion (generating alternative phrasings, then lexical retrieval over the union) is allowed — it stays token-based, no embeddings. See `query-expansion.ts` + `retrievePageIndexNodesExpanded`.

---

## Styling Conventions

Tailwind utilities are used directly in JSX. Keep the UI compact and operational.

```tsx
<button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 hover:bg-stone-50">
  ...
</button>
```

---

## Naming Conventions

- Booleans: `isLoading`, `backupToR2`, `saved`.
- Event handlers: `handleSubmit`, `handleJsonFile`.
- API client methods: `listDocuments`, `importPageIndex`, `ask`, `retrieve`.
- Server functions: `retrievePageIndexNodes`, `importPageIndex`, `generateGroundedAnswer`.

---

## Testing

No automated test runner is configured yet. Add tests after dependency installation is available.

Recommended future tests:

- `flattenPageIndexTree` for real PageIndex JSON variants.
- `retrievePageIndexNodes` scoring behavior with sample nodes.
- `/api/documents/import` with mocked Mongo/R2.
- `/api/chat` with mocked Gemini.

---

## Do / Don't

### Do

- Keep normal runtime in `apps/web`.
- Keep PageIndex processing outside Vercel runtime.
- Use MongoDB through repository helpers.
- Use R2 through the R2 helper.
- Update `.env.example` when adding config.

### Don't

- Do not add new code to `apps/api`.
- Do not add new Supabase or pgvector migrations.
- Do not add embedding model calls.
- Do not run Python scripts outside the approved Conda environment.
- Do not expose admin/import routes publicly without adding auth.
