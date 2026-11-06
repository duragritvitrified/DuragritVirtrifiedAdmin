# DuraGrit Vitrified - Shared Supabase Architecture

This folder contains the single source of truth for the Supabase database shared by both `/web` (Corporate ERP Dashboard) and `/app` (Mobile Retail & Contractor Portal).

## 1. Database Specifications
- **Project Ref**: `fykxjzvdslvxablmjlfw`
- **Region**: `eu-west-1`
- **Engine**: PostgreSQL 17.11 (Supabase Managed Cloud)
- **URL**: `https://fykxjzvdslvxablmjlfw.supabase.co`

## 2. Core Tables & Schemas
- `profiles` — User profiles (Super Admin, Contractor, Dealer, Mason, Vendor).
- `products` — Verified SKUs, pricing tiers, and cashback reward specs.
- `vendors` — Certified suppliers with GSTIN verification and PO trackers.
- `qr_batches` — Kiln lot allocations and cryptographic batch records.
- `qr_tokens` — Serial keys (`DG-[5-digit Lot]-[Unit Identifier]`) with dual 128-bit SHA hash.
- `cashback_requests` — Realtime moderation queue and NPCI disbursement ledger.

## 3. Realtime Synchronization
Realtime publication (`supabase_realtime`) is active on:
- `public.cashback_requests`
- `public.qr_batches`
- `public.profiles`

Whenever a contractor scans a code in `/app`, `/web` receives the claim instantly. Whenever an admin approves a payout in `/web`, `/app` updates the contractor's status immediately.

## 4. Stored Procedures
- `process_qr_scan_claim()` — Atomic single-use token lock and escrow ingestion.
- `calculate_tds_sec194c()` — Automatic Section 194C / 206AA TDS calculation.
- `handle_new_auth_user()` — Auto-sync trigger from `auth.users` to `public.profiles`.
