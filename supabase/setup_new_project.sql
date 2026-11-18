-- ====================================================================
-- DURAGRIT VITRIFIED — COMPLETE ONE-CLICK SETUP FOR NEW SUPABASE PROJECT
-- Target Project: https://supabase.com/dashboard/project/bzvmsuctrdlqnfccejtr/sql/new
-- ====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Contractor',
    location VARCHAR(255) DEFAULT 'Morbi, Gujarat',
    state VARCHAR(100) DEFAULT 'Gujarat',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'Verified',
    account_status VARCHAR(20) NOT NULL DEFAULT 'Active',
    tier_level VARCHAR(50) DEFAULT 'Gold Applicator Tier 2',
    pan_number VARCHAR(10),
    vpa_upi_id VARCHAR(100),
    reward_balance DECIMAL(12, 2) DEFAULT 0.00,
    escrow_balance DECIMAL(12, 2) DEFAULT 0.00,
    scans_count INT DEFAULT 0,
    terminal_key VARCHAR(100),
    hub_depot VARCHAR(100) DEFAULT 'Morbi Central Hub',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Adhesives',
    pack_weight VARCHAR(50) NOT NULL DEFAULT '20 kg Bag',
    base_mrp DECIMAL(10, 2) NOT NULL DEFAULT 1200,
    cashback_reward DECIMAL(10, 2) NOT NULL DEFAULT 150,
    initial_batch_qty INT DEFAULT 100,
    active_batches_count INT DEFAULT 0,
    security_spec VARCHAR(100) DEFAULT 'TF-256-UV Foil Dual-Stage',
    description TEXT,
    pricing_tiers JSONB DEFAULT '{"dealer": 1800, "contractor": 530, "retail": 1200}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku_code ON public.products(sku_code);

-- 3. VENDORS TABLE
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Chemicals',
    gstin VARCHAR(20),
    gstin_verified BOOLEAN DEFAULT TRUE,
    location VARCHAR(255) DEFAULT 'Morbi Central Hub, Gujarat',
    state VARCHAR(100) DEFAULT 'Gujarat',
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    account_status VARCHAR(20) NOT NULL DEFAULT 'Active',
    compliance_score INT DEFAULT 98,
    active_purchase_orders INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_vendor_id ON public.vendors(vendor_id);

-- 4. QR BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.qr_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_prefix VARCHAR(50) NOT NULL DEFAULT 'DG',
    batch_identifier VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    lot_number VARCHAR(50) NOT NULL DEFAULT '1001',
    quantity INT NOT NULL DEFAULT 100,
    discount_tier VARCHAR(50) DEFAULT 'Standard Master Tier',
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '24 months'),
    cryptographic_hash VARCHAR(128) NOT NULL DEFAULT 'SHA256-DG',
    crypto_engine_version VARCHAR(20) DEFAULT 'V2.4',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_batches_identifier ON public.qr_batches(batch_identifier);

-- 5. QR TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.qr_batches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    serial_key VARCHAR(100) UNIQUE NOT NULL,
    dual_sha128_hash VARCHAR(64) UNIQUE NOT NULL,
    cashback_amount DECIMAL(10, 2) NOT NULL DEFAULT 150,
    is_scanned BOOLEAN DEFAULT FALSE,
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ,
    geo_lat DECIMAL(9, 6),
    geo_lng DECIMAL(9, 6),
    stage_1_verified BOOLEAN DEFAULT FALSE,
    stage_2_unlocked BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_serial_key ON public.qr_tokens(serial_key);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_is_scanned ON public.qr_tokens(is_scanned);

-- 6. CASHBACK REQUESTS & SYNC EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.cashback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    qr_token_id UUID REFERENCES public.qr_tokens(id) ON DELETE SET NULL,
    qr_serial VARCHAR(100) NOT NULL,
    claim_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payout_method VARCHAR(30) NOT NULL DEFAULT 'UPI',
    vpa_or_ifsc VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    proof_url TEXT,
    npci_rrn VARCHAR(100),
    tds_deducted DECIMAL(10, 2) DEFAULT 0.00,
    net_disbursed DECIMAL(10, 2) DEFAULT 0.00,
    flag_reason TEXT,
    disbursed_at TIMESTAMPTZ,
    geo_lat DECIMAL(9, 6),
    geo_lng DECIMAL(9, 6),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashback_requests_status ON public.cashback_requests(status);
CREATE INDEX IF NOT EXISTS idx_cashback_requests_serial ON public.cashback_requests(qr_serial);
CREATE INDEX IF NOT EXISTS idx_cashback_requests_timestamp ON public.cashback_requests(timestamp DESC);

-- 7. ENABLE ROW LEVEL SECURITY & FULL SYNC POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sync Full Access Profiles" ON public.profiles;
CREATE POLICY "Sync Full Access Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sync Full Access Products" ON public.products;
CREATE POLICY "Sync Full Access Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sync Full Access Vendors" ON public.vendors;
CREATE POLICY "Sync Full Access Vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sync Full Access Batches" ON public.qr_batches;
CREATE POLICY "Sync Full Access Batches" ON public.qr_batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sync Full Access Tokens" ON public.qr_tokens;
CREATE POLICY "Sync Full Access Tokens" ON public.qr_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sync Full Access Claims" ON public.cashback_requests;
CREATE POLICY "Sync Full Access Claims" ON public.cashback_requests FOR ALL USING (true) WITH CHECK (true);

-- 8. ENABLE REALTIME ON ALL 6 TABLES
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['profiles', 'products', 'vendors', 'qr_batches', 'qr_tokens', 'cashback_requests']
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END LOOP;
END $$;

-- 9. SEED PRINCIPAL ADMIN, DEFAULT SKU & BASE VENDORS
INSERT INTO public.profiles (full_name, email, mobile, role, location, kyc_status, account_status, terminal_key, hub_depot)
VALUES ('DuraGrit Principal Admin', 'duragrit07@gmail.com', '9000000000', 'Admin', 'Morbi Central Hub, Gujarat', 'Verified', 'Active', 'DG-SEC-9942-ALPHA', 'Morbi Kiln HQ')
ON CONFLICT (mobile) DO UPDATE SET role = 'Admin', kyc_status = 'Verified', account_status = 'Active';

INSERT INTO public.products (sku_code, name, category, pack_weight, base_mrp, cashback_reward, initial_batch_qty, active_batches_count, metadata)
VALUES (
    'DA-777',
    'DURAGRIT DTA 777',
    'Adhesives',
    '20 kg Bag',
    1200,
    150,
    100,
    1,
    '{"rewardPoints": 600, "dealerPrice": 1800, "contractorPrice": 530, "gstPercent": 18, "hsnCode": "38245090", "subCategory": "High-Polymer Vitrified"}'::jsonb
)
ON CONFLICT (sku_code) DO NOTHING;

INSERT INTO public.vendors (vendor_id, company_name, category, gstin, location, state, contact_person, phone, email, account_status)
VALUES
    ('VND-101', 'Ecreation IT Solution', 'Chemicals', '24AAACD1011M1Z5', 'Morbi Central Hub, Gujarat', 'Gujarat', 'Vendor Partner', '8826021114', 'duragrit07@gmail.com', 'Active'),
    ('VND-102', 'JEEE Toure', 'Chemicals', '24AAACD1022M1Z6', 'Morbi Central Hub, Gujarat', 'Gujarat', 'Sunaj Sahoo', '9876543210', 'sahoo.sunaj@gmail.com', 'Active'),
    ('VND-103', 'RR Agency', 'Packaging', '24AAACD1033M1Z7', 'Morbi Central Hub, Gujarat', 'Gujarat', 'Rohit Verma', '9811223344', 'rohit.agency@gmail.com', 'Active')
ON CONFLICT (vendor_id) DO NOTHING;

COMMIT;
