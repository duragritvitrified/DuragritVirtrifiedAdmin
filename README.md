# DuraGrit Vitrified Retail & QR Portal
> **Enterprise QR Serialization, Cashback Escrow, and Retailer ERP Portal**  
> Primary Master Administrator: `duragrit07@gmail.com`

---

## 🏗️ Architecture Overview

- **Design System:** Deep Crimson / Burgundy (`#8B0000`), Warm Orange / Gold accents, Light Gray (`#F9FAFB`) background, Inter typography, high-density enterprise cards and responsive sidebar layout.
- **Frontend Stack:** React 18, Tailwind CSS, Lucide React, Canvas Confetti.
- **Cryptographic Serialization:** Engine V2.4 with Dual 128-bit SHA hashing, lot prefixes (`DG`, `DGV`, `DGM`), collision guards, and `DG-[5-digit Lot]-[Unit Identifier]` serialization.
- **Settlement & Escrow Gateway:** Simulated NPCI 256-bit Automated Escrow settlement with instant VPA (UPI ID) validation and IMPS clearing.
- **Mobile Platforms:** iOS PWA (`manifest.json`) and native Android project configured via `@capacitor/android` with camera optical viewfinder.

---

## 📑 14 Mandatory Modules Implemented

1. **Admin Authentication & Security:** Secure login screen configured for `duragrit07@gmail.com`, 8-hour session countdown timer, and restricted access audit notices.
2. **Product Catalog & SKU Master:** 28+ SKUs (Adhesives, Grouts, Primers, Waterproofing), 142+ active batch counters, pricing tiers (Dealer, Contractor, Retail/MRP), and cashback per scan (₹25–₹68).
3. **Add New SKU / Product Form:** Detailed form with product name, SKU Code (`DG-ERP-XXX`), category, pack weight, description, cashback reward, initial batch quantity (1000), single-use dual stage security, geo-fencing radius, and thermal foil UV specs (`TF-256-UV`).
4. **QR Code Batch Generator:** Engine V2.4 cryptographic generator, prefix selectors, lot number selector, discount tier mapping, anti-duplication guard (Dual 128-bit SHA hashing), visual QR preview matrix, and CSV print export for packaging lines.
5. **User Management Directory:** Directory tracking 1,428+ registered contractors, dealers, and masons with KYC statuses, search by mobile/name, and profile dossier view.
6. **Register New User Modal:** Direct KYC onboarding modal capturing legal name, 10-digit mobile ID, role classification, street address, state, and account status.
7. **Vendor Management Directory:** Tracking 84+ certified industrial vendors (Raw materials, Chemicals, Packaging, Logistics), real-time 15-character GSTIN verification, active purchase orders, and compliance scores.
8. **Vendor & Contractor Mobile Sign-In:** Mobile yard terminal login with yard hub selector (North Hub, Gujarat Petrochem Yard, South Depot), terminal security keys, and live serialization counters.
9. **Contractor Dashboard (DG Field):** Gold Applicator Tier 2 badge, real-time reward balance points, pending vs. approved/paid breakdown, recent scans list, and toll-free helpline (1800-DURAGRIT).
10. **QR Scan & Upload Interface:** 60FPS camera optical viewfinder, auto-ingest alignment, manual serial key fallback (`DG-[5-digit Lot]-[Unit Identifier]`), and session queue logs.
11. **My Cashback Requests:** Escrow snapshot, claim verification timeline, dispute logs, and proof photo viewer.
12. **Mobile App Admin Panel & Moderation:** Supervisor moderation queue with 1-tap "Review & Approve" / "Flag/Reject" buttons and NPCI 256-bit automated escrow summary.
13. **QR Cashback Requests Approval Queue (Web):** Enterprise bulk approval table, filter by product/payout method, select-all bulk payout release, and automated NPCI UPI VPA validation.
14. **Monthly Cashback Application Report:** Financial reconciliation audit reports, volume growth charts, gateway success rates, CSV & PDF export (via `jspdf` & `jspdf-autotable`), and statutory Section 194R TDS / GST compliance metadata.

---

## 🚀 Quick Start Guide

### 1. Launch Web ERP Development Server
```bash
npm run dev
# Or double-click start-dev.bat
```
Visit: `http://localhost:3000`

### 2. Production Build
```bash
npm run build
```

### 3. Compile Android APK
```bash
# Double-click build-apk.bat or run:
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
The compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔒 Default Credentials

- **Admin Email:** `duragrit07@gmail.com`
- **Session Duration:** 8 Hours Persistent
- **Terminal Key:** `DG-SEC-9942-ALPHA`
- **Master PIN:** `9942`
