# Gear Locker Implementation Status

## Implemented

- App Router-only Next.js structure
- Prisma 7 schema and shared Prisma client
- Canonical item routing by `assetId`
- Canonical kit routing by `assetId`
- Dashboard summary
- Inventory search and filtering by text, category, status, location, and tag
- Item creation and editing with shared validation/mutation logic
- Item detail with overview, purchase section, attachment buckets, location movement, kit membership, and structured history
- Dedicated item movement workflow with location history context
- Kit creation, detail views, membership management, completeness signals, and return verification workflow
- Hybrid package contents architecture with tracked linked items plus checklist-only entries
- Location creation, hierarchy display, and breadcrumb-style path usage
- Future locations map/layout placeholder
- QR label generation and scan action route for items and kits
- Request-aware QR destination generation so labels can use a reachable LAN/deployed host when available
- CSV export with operational and ownership fields

## Partially scaffolded

- Attachment upload workflow to Supabase Storage
- Rich attachment preview/download UX
- Category management UI
- Tag management UI beyond inline item creation
- Richer scan-triggered action states and camera integration
- Package contents management beyond the current parent-item detail flow
- Editing existing checklist entry rows in place
- Kit label generation parity with item labels
- Category/tag admin pages
- Location editing/reordering

## Deferred intentionally

- Full auth hardening
- Production deployment work
- Camera-based QR scanning
- Insurance and vendor UX
- Maintenance scheduling UI
- Loan workflow UI

## Architectural rules

- Use `assetId` for product-facing references.
- Use database `id` only for relations and internal joins.
- Record meaningful operational changes in `ItemHistoryEvent`.
- Record kit-level operational changes in `KitHistoryEvent`.
- Treat `available` as at-rest inventory and `active` as deployed gear.
- Treat locations as nested folder paths.
- Treat package contents as expected internal components of a primary item, not as a substitute for kits.
- Allow package contents to mix tracked inventory items with lightweight checklist entries.
- A kit return is not complete until each expected item is verified individually.
- QR destinations should resolve to `/scan/[assetId]` so scans land in action-first workflows.
- Use dedicated movement and return screens when the workflow is operational, not just data maintenance.
- Keep files and route helpers centralized so scans, labels, exports, and navigation stay aligned.
