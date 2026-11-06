# DuraGrit Vitrified — Native Flutter & Dart Mobile App

This directory contains the cross-platform native Flutter & Dart implementation of the **DuraGrit Retail & Contractor QR Portal** (Steps 8–12), built according to the `stitch_duragrit_mobile_retail_portal` enterprise specifications.

---

## 📱 Modules Included (Steps 8–12)

- **Step 08: Mobile Yard Sign In** (`lib/screens/step8_signin_screen.dart`):
  - Contractor, Mason, and Logistics role tabs
  - Mobile number + 4-digit field PIN / OTP verification
  - Yard depot location picker (Morbi Kiln HQ, Ahmedabad Hub, Surat Yard)
  - FIPS-140 & RBI Escrow authentication banner

- **Step 09: Contractor Loyalty Dashboard** (`lib/screens/step9_dashboard_screen.dart`):
  - Total Reward Points & equivalent ₹ INR balance (1 Pt = ₹0.25)
  - 3-column stats: Pending, Approved/Paid, Total Scans
  - Quick action buttons ("Scan QR & Claim", "View Request List")
  - Profile & KYC credentials (UIDAI Aadhaar Verified, Tier 2 Gold)

- **Step 10: Optical QR Scanner** (`lib/screens/step10_scanner_screen.dart`):
  - Animated HUD laser reticle and corner brackets
  - Dual 128-bit SHA cryptographic validation
  - Single-use anti-replay duplicate scan rejection
  - Haversine GPS geo-fence validation (Morbi HQ 250km limit)
  - Manual serial key entry fallback (`DG-[5-digit Lot]-[Unit Identifier]`)
  - Direct atomic ingestion into live Supabase `cashback_requests` table

- **Step 11: My Cashback Requests** (`lib/screens/step11_requests_screen.dart`):
  - Real-time Supabase stream listener (`SupabaseService.claimsStream`)
  - Filter tabs: All, Pending, Disbursed, Flagged
  - Instant status update when admin authorizes payout on Web ERP

- **Step 12: Field Admin Moderation Queue** (`lib/screens/step12_moderation_screen.dart`):
  - Mobile moderation interface for field supervisors
  - One-tap "Authorize Payout" with simulated NPCI RRN generation
  - Flag / investigative hold action

---

## 🛠️ How to Build the Android APK with Flutter

### Prerequisites:
1. Install Flutter SDK: [https://docs.flutter.dev/get-started/install/windows](https://docs.flutter.dev/get-started/install/windows)
2. Ensure `flutter` is added to your PATH environment variable.

### Commands:
```bash
cd flutter_app

# Install packages
flutter pub get

# Run on connected device or emulator
flutter run

# Compile Release Android APK
flutter build apk --release
```

The compiled APK will be located at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`
