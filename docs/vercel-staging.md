# Vercel Staging Launch

## Purpose

Use this flow to launch Gear Locker on a stable public Vercel URL for outside testing.

## Required environment variables

Set these in Vercel for the staging project:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set this if you want QR codes and public links to always use one stable URL:

- `NEXT_PUBLIC_APP_URL`

Recommended for public tester safety:

- `STAGING_ACCESS_USERNAME`
- `STAGING_ACCESS_PASSWORD`

Reserved for future attachment and admin workflows:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

## Prisma deployment rule

- Local development: `prisma migrate dev`
- Staging/production: `prisma migrate deploy`

Do not use `prisma migrate dev` against the staging database.

## Suggested staging pattern

1. Create a dedicated Supabase staging project or staging database.
2. Put the staging `DATABASE_URL` into Vercel.
3. Deploy Gear Locker to Vercel.
4. Run `npm run prisma:migrate:deploy` against the staging database.
5. Run `npm run prisma:seed` against staging only if you want demo/sample data there.

## QR behavior

- QR labels resolve to `/scan/[assetId]`
- if `NEXT_PUBLIC_APP_URL` is set, that origin is used
- otherwise Gear Locker falls back to the active request host
- on Vercel, this means QR generation works correctly on the public deployment URL

## Staging safety

Set `STAGING_ACCESS_USERNAME` and `STAGING_ACCESS_PASSWORD` to enable the lightweight staging gate in `proxy.ts`.
