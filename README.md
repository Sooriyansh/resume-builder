# ResumeLens AI

A private, evidence-based resume analyzer built with Next.js, TypeScript,
LangChain.js, PostgreSQL, Prisma, Tailwind CSS, Zod, and OpenAI-compatible models.

## Local setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Start a PostgreSQL database, set `DATABASE_URL`, then install and migrate:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

3. Open `http://localhost:3000`.

The health endpoint is `GET /api/health`.

## Security model

- Uploaded files are signature-checked, limited to 5 MB, renamed randomly, and private.
- Every resume, job, analysis, chunk, and chat query is scoped by the authenticated user.
- RAG lookup is filtered by both `userId` and `resumeId`.
- Documents are treated as untrusted data; prompt instructions inside them are ignored.
- Scores are calculated deterministically in TypeScript. AI cannot select the final score.
- Deletion cascades through analyses, embeddings, and chats; storage files are also removed.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Production notes

- Connect a PostgreSQL provider in Vercel and expose its pooled connection string
  as `DATABASE_URL`.
- Create a private Supabase Storage bucket named `private-resumes` (or change
  `SUPABASE_RESUME_BUCKET`) and configure its server-side service-role credentials.
- Set `STORAGE_PROVIDER=supabase`; Vercel's local filesystem is not persistent.
- Keep AI and Auth secrets server-only. Never prefix them with `NEXT_PUBLIC_`.
- The Vercel build command runs `prisma migrate deploy` before compiling the app.

### Required Vercel environment variables

```text
DATABASE_URL
STORAGE_PROVIDER=supabase
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_RESUME_BUCKET=private-resumes
OPENAI_API_KEY
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Apply these to Production (and Preview if preview deployments should work), then
redeploy without reusing the previous build cache.
