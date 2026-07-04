# Legacy Disabled Code

`apps/api/` and `supabase/` are legacy artifacts from the previous Express/Supabase pgvector MVP. They are no longer part of npm workspaces, build scripts, deployment instructions, or runtime imports.

They could not be physically deleted in this Windows workspace because the filesystem returned access denied for the existing files. Treat them as disabled legacy code and do not use them for new work.

Current runtime is `apps/web` Next.js API routes with MongoDB Atlas, Cloudflare R2, PageIndex vectorless retrieval, and Gemini Flash.
