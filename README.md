# ResumeLens AI

A private, evidence-based resume analyzer built with Next.js, TypeScript, Auth.js,
LangChain.js, SQLite, Prisma, Tailwind CSS, Zod, and OpenAI-compatible models.

## Local setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install and create the local SQLite database:

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

- Create a private Supabase bucket and provide its service-role credentials server-side
  before setting `STORAGE_PROVIDER=supabase`.
- Keep AI and Auth secrets server-only. Never prefix them with `NEXT_PUBLIC_`.
- Run migrations in CI and use signed, private file access only.
