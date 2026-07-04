# PageIndex Ingestion Worker

This folder contains optional tooling for processing source files with VectifyAI/PageIndex outside the Vercel runtime.

Normal chat runtime does not require this worker. Deploy it to Railway only when you want cloud-side long-running processing.

## Modes

Mode A: process a source file with local PageIndex, upload JSON backup to R2, and import nodes into MongoDB.

```bash
python import_pageindex_to_mongo.py --source ./data/warranty.pdf --title "Warranty Policy" --slug warranty-policy --tags helpdesk,warranty
```

Mode B: import an existing PageIndex JSON file.

```bash
python import_pageindex_to_mongo.py --index-json ./output/warranty-pageindex.json --title "Warranty Policy" --slug warranty-policy --tags helpdesk,warranty
```

## Environment

```text
MONGODB_URI=
MONGODB_DB=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
GCLI_BASE_URL=https://gcli.ggchan.dev/v1
GCLI_API_KEYS=key1:10,key2:20
GCLI_MODEL=gemini-3-flash-preview
PAGEINDEX_MODEL=gemini-3-flash-preview
PAGEINDEX_COMMAND=python -m pageindex --input {source} --output {output}
```

## Supported File Formats

- `.pdf`, `.md`, `.txt` — processed directly by PageIndex CLI.
- `.docx`, `.xlsx`, `.pptx`, `.html`, `.csv` — automatically converted to `.md` via Microsoft MarkItDown before PageIndex processing.

## Notes

- Do not use embeddings.
- Do not use pgvector.
- Do not call this worker from Next.js route handlers.
- Install/clone PageIndex separately inside the worker environment.
