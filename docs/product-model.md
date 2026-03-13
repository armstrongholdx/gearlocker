# Gear Locker Product Model

## Core identity

- `Item` is the core asset record.
- `assetId` is the product-facing identifier.
- `id` is the internal database key.
- QR labels, scan routes, exports, and item detail URLs all resolve by `assetId`.
- `Kit` also has a product-facing `assetId` so kits can be labeled, scanned, and operated as first-class units.

## Entities

### Item

An `Item` represents a physical production asset or grouped stock record.

It carries:
- core identity: `assetId`, `name`, `category`, `subcategory`
- identification: `brand`, `model`, `serialNumber`
- operational state: `status`, `conditionGrade`, `conditionNotes`, `location`
- ownership and value: `ownerName`, `purchaseDate`, `purchasePrice`, `purchaseSource`, `purchaseReference`, `replacementValue`, `warrantyExpiresAt`
- practical usage: `quantity`, `isConsumable`, `notes`
- relationships: tags, attachments, kits, history events

Operational status rule:
- `available` means the item is at rest in studio/storage and ready to deploy
- `active` means the item is currently deployed or out on a job

### Kit

A `Kit` is a reusable package of items that move or prep together.

It carries:
- `assetId`, `name`, and optional `code`
- description and notes
- optional home `location`
- operational `status`
- many item memberships through `ItemKit`

`ItemKit` stores the membership layer so the app can later track:
- quantity per kit
- kit-specific notes
- membership timestamps

Kits can be scanned and checked out as units, but return logic is item-verified.

### Package contents

`Package contents` are different from kits.

They describe what is expected inside a primary item's own case, box, or package.

Example:
- a light body as the parent item
- ballast, cables, clamp, and reflector as expected contained items

This is modeled as a hybrid manifest, not as an operational dispatch package.

Rule of thumb:
- use `Kit` when multiple items move together as a unit for a job
- use `Package contents` when one primary item has expected internal components

Operational implication:
- the parent item remains the primary record
- tracked child items can still be scanned independently and belong to kits independently
- lightweight checklist entries can be added without creating full item records
- package contents answer the question "what should be inside this case or box?"
- kits answer the question "what goes out together on a job?"

Hybrid model:
- `Tracked contents` are linked to real `Item` records
- `Checklist contents` are lightweight expected entries such as reflectors, clamps, adapters, and small cables
- both live under the same package-contents surface on the parent item

### Location

A `Location` represents where gear lives physically.

It supports:
- a human name and optional code
- hierarchical nesting through `parentLocationId`
- both item assignment and kit home assignment

This lets the app model:
- building > room > shelf
- truck > bay > case
- storage unit > rack > bin

UI presentation rule:
- locations should be treated like a folder path and shown as breadcrumbs, e.g. `Studio / Rack A / Shelf 3`

### Attachment

An `Attachment` is a file or document linked to an item.

The structure is designed for Supabase Storage later, but useful now:
- attachment type bucket: photo, receipt, serial photo, manual, warranty, misc
- file metadata: `fileName`, `fileUrl`, `mimeType`, `fileSize`
- storage metadata: `storageProvider`, `storageBucket`, `storagePath`
- human context: `title`, `notes`

### ItemHistoryEvent

An `ItemHistoryEvent` records meaningful changes over time.

It supports:
- event `type`
- human summary and details
- optional note
- structured status transitions: `statusFrom`, `statusTo`
- optional location context
- freeform `metadata` JSON for future integrations

This is the foundation for:
- check-in / check-out
- movement tracking
- repair logging
- future loan and maintenance records

### Kit verification

`KitVerificationSession` and `KitVerificationItem` exist to support return workflows.

Return rule:
- a kit can be checked out as a unit
- a kit is not fully returned until each expected item is confirmed individually
- missing items remain visible until accounted for

## Relationship summary

- One `Category` has many `Item` records.
- One `Location` has many child `Location` records, many `Item` records, many `Kit` records, and can be referenced by `ItemHistoryEvent`.
- One `Item` has many `Attachment`, `ItemHistoryEvent`, `ItemTag`, and `ItemKit` records.
- One `Tag` connects to many items through `ItemTag`.
- One `Kit` connects to many items through `ItemKit`.
- One `Kit` also has many `KitHistoryEvent` and `KitVerificationSession` records.

## Current implementation line

- Implemented now: inventory, item creation/editing, item detail, dedicated item movement workflow, status transitions, kit creation, kit detail, add/remove kit memberships, scan action routing, kit return verification screens, tags, locations, QR routes, CSV export.
- Implemented now: hybrid package contents model with tracked linked items and checklist-only entries on item detail.
- Scaffolded but not fully wired: attachment uploads, auth protection, live Supabase storage flows, browser camera scanning, richer attachment previews.
- Partially wired for QR operations: labels and item detail QR blocks now generate full scan destinations using the best available public/request origin, but reliable phone scanning still depends on using a reachable LAN or deployed host.
- Planned next: loan records, maintenance records, vendor directory, insurance views, richer reporting, and tighter scan-driven verification UX.
