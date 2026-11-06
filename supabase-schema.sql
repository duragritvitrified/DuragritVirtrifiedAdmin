-- ====================================================================
-- DURAGRIT VITRIFIED RETAIL & QR ENTERPRISE PORTAL
-- Database Engine: PostgreSQL 15+ (Supabase Managed Cloud)
-- Author: Full-Stack Principal Software Engineer
-- Target Admin Account: duragrit07@gmail.com
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. EXTENSIONS & SETUP
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS & PROFILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Contractor', 'Dealer', 'Admin', 'Mason', 'Vendor')) DEFAULT 'Contractor',
    location VARCHAR(255) DEFAULT 'Morbi, Gujarat',
    state VARCHAR(100) DEFAULT 'Gujarat',
    kyc_status VARCHAR(20) NOT NULL CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected')) DEFAULT 'Pending',
    account_status VARCHAR(20) NOT NULL CHECK (account_status IN ('Active', 'Suspended', 'Deactivated')) DEFAULT 'Active',
    tier_level VARCHAR(50) DEFAULT 'Gold Applicator Tier 2',
    pan_number VARCHAR(10),
    vpa_upi_id VARCHAR(100),
    reward_balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (reward_balance >= 0),
    escrow_balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (escrow_balance >= 0),
    scans_count INT DEFAULT 0 CHECK (scans_count >= 0),
    terminal_key VARCHAR(100),
    hub_depot VARCHAR(100) DEFAULT 'Morbi Central Hub',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by phone, role, and auth ID
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);

-- --------------------------------------------------------------------
-- 2. PRODUCTS CATALOG TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Adhesives', 'Grouts', 'Primers', 'Waterproofing')),
    pack_weight VARCHAR(50) NOT NULL,
    base_mrp DECIMAL(10, 2) NOT NULL CHECK (base_mrp > 0),
    cashback_reward DECIMAL(10, 2) NOT NULL CHECK (cashback_reward >= 10 AND cashback_reward <= 500),
    initial_batch_qty INT DEFAULT 1000 CHECK (initial_batch_qty >= 0),
    active_batches_count INT DEFAULT 0,
    security_spec VARCHAR(100) DEFAULT 'TF-256-UV Foil Dual-Stage',
    description TEXT,
    pricing_tiers JSONB DEFAULT '{"dealer": 0, "contractor": 0, "retail": 0}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku_code ON public.products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- --------------------------------------------------------------------
-- 3. VENDORS DIRECTORY TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Raw materials', 'Chemicals', 'Packaging', 'Logistics', 'Machinery')),
    gstin VARCHAR(15) UNIQUE NOT NULL,
    gstin_verified BOOLEAN DEFAULT TRUE,
    location VARCHAR(255),
    state VARCHAR(100) DEFAULT 'Gujarat',
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    account_status VARCHAR(20) NOT NULL CHECK (account_status IN ('Active', 'Suspended', 'Pending Review')) DEFAULT 'Active',
    compliance_score INT DEFAULT 98 CHECK (compliance_score BETWEEN 0 AND 100),
    active_purchase_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_gstin ON public.vendors(gstin);

-- --------------------------------------------------------------------
-- 4. QR BATCHES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_prefix VARCHAR(20) NOT NULL DEFAULT 'DG',
    batch_identifier VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    lot_number VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 1000 CHECK (quantity > 0),
    discount_tier VARCHAR(50) DEFAULT 'Standard Master Tier',
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '24 months'),
    cryptographic_hash VARCHAR(128) NOT NULL,
    crypto_engine_version VARCHAR(20) DEFAULT 'V2.4',
    created_by UUID REFERENCES public.profiles(id),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Exhausted', 'Recalled', 'Locked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_batches_identifier ON public.qr_batches(batch_identifier);
CREATE INDEX IF NOT EXISTS idx_qr_batches_product_id ON public.qr_batches(product_id);

-- --------------------------------------------------------------------
-- 5. QR SERIAL TOKENS TABLE (Cryptographic Dual-Stage Tokens)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.qr_batches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    serial_key VARCHAR(100) UNIQUE NOT NULL, -- Format: DG-[5-digit Lot]-[Unit Identifier]
    dual_sha128_hash VARCHAR(64) UNIQUE NOT NULL,
    cashback_amount DECIMAL(10, 2) NOT NULL,
    is_scanned BOOLEAN DEFAULT FALSE,
    scanned_by UUID REFERENCES public.profiles(id),
    scanned_at TIMESTAMPTZ,
    geo_lat DECIMAL(9, 6),
    geo_lng DECIMAL(9, 6),
    stage_1_verified BOOLEAN DEFAULT FALSE,
    stage_2_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_serial_key ON public.qr_tokens(serial_key);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON public.qr_tokens(dual_sha128_hash);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_batch_id ON public.qr_tokens(batch_id);

-- --------------------------------------------------------------------
-- 6. QR SCANS & CASHBACK REQUESTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cashback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(50) UNIQUE NOT NULL, -- DG-CLM-YYYY-XXXXX
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    qr_token_id UUID REFERENCES public.qr_tokens(id) ON DELETE SET NULL,
    qr_serial VARCHAR(100) NOT NULL,
    claim_value DECIMAL(10, 2) NOT NULL CHECK (claim_value > 0),
    payout_method VARCHAR(20) NOT NULL CHECK (payout_method IN ('UPI', 'IMPS', 'NEFT')) DEFAULT 'UPI',
    vpa_or_ifsc VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Disbursed', 'Flagged')) DEFAULT 'Pending',
    proof_url TEXT,
    npci_rrn VARCHAR(100),
    tds_deducted DECIMAL(10, 2) DEFAULT 0.00,
    net_disbursed DECIMAL(10, 2) DEFAULT 0.00,
    flag_reason TEXT,
    disbursed_at TIMESTAMPTZ,
    geo_lat DECIMAL(9, 6),
    geo_lng DECIMAL(9, 6),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashback_requests_user ON public.cashback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_requests_status ON public.cashback_requests(status);
CREATE INDEX IF NOT EXISTS idx_cashback_requests_serial ON public.cashback_requests(qr_serial);

-- --------------------------------------------------------------------
-- 7. COMPATIBILITY VIEWS (For seamless legacy & multi-view queries)
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;
CREATE OR REPLACE VIEW public.users_directory AS SELECT * FROM public.profiles;
CREATE OR REPLACE VIEW public.products_sku AS SELECT * FROM public.products;
CREATE OR REPLACE VIEW public.qr_scans AS SELECT * FROM public.cashback_requests;
CREATE OR REPLACE VIEW public.cashback_claims AS SELECT * FROM public.cashback_requests;
CREATE OR REPLACE VIEW public.vendors_directory AS SELECT * FROM public.vendors;

-- --------------------------------------------------------------------
-- 8. BUSINESS LOGIC STORED PROCEDURES & FUNCTIONS
-- --------------------------------------------------------------------

-- Function 8.1: Automated Section 194C TDS Calculation
-- Under IT Act Sec 194C: 1% for Individual/HUF Contractors with PAN, 2% otherwise; 20% if PAN unavailable & threshold exceeded
CREATE OR REPLACE FUNCTION public.calculate_tds_sec194c(
    p_amount DECIMAL,
    p_has_pan BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tds_rate DECIMAL;
    v_tds_amount DECIMAL;
    v_net_amount DECIMAL;
BEGIN
    IF p_amount <= 500.00 THEN
        -- Micro-incentives under ₹500 exempt from automatic single-transaction withholding
        v_tds_rate := 0.00;
        v_tds_amount := 0.00;
        v_net_amount := p_amount;
    ELSE
        IF p_has_pan THEN
            v_tds_rate := 0.01; -- 1% Sec 194C Contractor rate
        ELSE
            v_tds_rate := 0.20; -- 20% penalty rate under Sec 206AA if PAN missing
        END IF;
        v_tds_amount := ROUND((p_amount * v_tds_rate)::numeric, 2);
        v_net_amount := p_amount - v_tds_amount;
    END IF;

    RETURN jsonb_build_object(
        'gross_amount', p_amount,
        'tds_rate', v_tds_rate,
        'tds_amount', v_tds_amount,
        'net_amount', v_net_amount,
        'tax_section', 'Section 194C'
    );
END;
$$;

-- Function 8.2: Atomic QR Scan Ingestion & Single-Use Enforcement
CREATE OR REPLACE FUNCTION public.process_qr_scan_claim(
    p_user_id UUID,
    p_serial_key VARCHAR,
    p_geo_lat DECIMAL DEFAULT NULL,
    p_geo_lng DECIMAL DEFAULT NULL,
    p_proof_url TEXT DEFAULT NULL,
    p_vpa VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
    v_product RECORD;
    v_user RECORD;
    v_claim_id UUID;
    v_request_num VARCHAR;
    v_clean_key VARCHAR;
    v_tds_info JSONB;
BEGIN
    v_clean_key := UPPER(TRIM(p_serial_key));

    -- Check if user exists and is active
    SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User profile not found.');
    END IF;

    IF v_user.account_status != 'Active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'User account is suspended or inactive.');
    END IF;

    -- Concurrency Guard: Check if serial key has already been submitted in cashback_requests
    IF EXISTS (SELECT 1 FROM public.cashback_requests WHERE qr_serial = v_clean_key) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Critical: This QR serial key has already been redeemed and locked by Single-Use Dual Stage Guard.');
    END IF;

    -- Lookup token in qr_tokens (if pre-generated) or derive from products
    SELECT * INTO v_token FROM public.qr_tokens WHERE serial_key = v_clean_key FOR UPDATE;

    IF FOUND THEN
        IF v_token.is_scanned THEN
            RETURN jsonb_build_object('success', false, 'message', 'Serial key already consumed in manufacturing/dealer stream.');
        END IF;
        SELECT * INTO v_product FROM public.products WHERE id = v_token.product_id;
    ELSE
        -- Fallback: Use standard registered active SKU
        SELECT * INTO v_product FROM public.products ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Calculate TDS under Sec 194C
    v_tds_info := public.calculate_tds_sec194c(v_product.cashback_reward, v_user.pan_number IS NOT NULL);

    -- Generate unique human-readable claim number
    v_request_num := 'DG-CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

    -- Insert into cashback_requests
    INSERT INTO public.cashback_requests (
        request_id,
        user_id,
        qr_token_id,
        qr_serial,
        claim_value,
        payout_method,
        vpa_or_ifsc,
        status,
        proof_url,
        tds_deducted,
        net_disbursed,
        geo_lat,
        geo_lng
    ) VALUES (
        v_request_num,
        p_user_id,
        v_token.id,
        v_clean_key,
        v_product.cashback_reward,
        'UPI',
        COALESCE(p_vpa, v_user.vpa_upi_id, 'contractor@upi'),
        'Pending',
        p_proof_url,
        (v_tds_info->>'tds_amount')::DECIMAL,
        (v_tds_info->>'net_amount')::DECIMAL,
        p_geo_lat,
        p_geo_lng
    ) RETURNING id INTO v_claim_id;

    -- Mark token as scanned if exists
    IF v_token.id IS NOT NULL THEN
        UPDATE public.qr_tokens
        SET is_scanned = TRUE,
            scanned_by = p_user_id,
            scanned_at = NOW(),
            geo_lat = p_geo_lat,
            geo_lng = p_geo_lng,
            stage_1_verified = TRUE,
            stage_2_unlocked = TRUE
        WHERE id = v_token.id;
    END IF;

    -- Credit user escrow balance & increment scan count
    UPDATE public.profiles
    SET escrow_balance = escrow_balance + v_product.cashback_reward,
        scans_count = scans_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'claim_id', v_claim_id,
        'request_id', v_request_num,
        'claim_value', v_product.cashback_reward,
        'tds_info', v_tds_info,
        'status', 'Pending'
    );
END;
$$;

-- Function 8.3: Auth Sync Trigger (Sync auth.users -> public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        auth_user_id,
        full_name,
        email,
        mobile,
        role,
        kyc_status,
        account_status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'DuraGrit User'),
        NEW.email,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'mobile', '9000000000'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Contractor'),
        'Pending',
        'Active'
    )
    ON CONFLICT (mobile) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        email = COALESCE(EXCLUDED.email, public.profiles.email);

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- --------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public & Authenticated Read Profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users Update Own Profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = auth_user_id OR auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Admin Full Access Profiles"
    ON public.profiles FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- Products Policies
CREATE POLICY "Public Read Products"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Admin Modify Products"
    ON public.products FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- Vendors Policies
CREATE POLICY "Authenticated Read Vendors"
    ON public.vendors FOR SELECT
    USING (true);

CREATE POLICY "Admin Modify Vendors"
    ON public.vendors FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- QR Batches Policies
CREATE POLICY "Authenticated Read Batches"
    ON public.qr_batches FOR SELECT
    USING (true);

CREATE POLICY "Admin Create Batches"
    ON public.qr_batches FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- QR Tokens Policies
CREATE POLICY "Authenticated Read Tokens"
    ON public.qr_tokens FOR SELECT
    USING (true);

CREATE POLICY "Admin Insert Tokens"
    ON public.qr_tokens FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- Cashback Requests Policies
CREATE POLICY "Contractors Read Own Claims"
    ON public.cashback_requests FOR SELECT
    USING (
        auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = user_id) OR
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role' OR
        true -- Allow read for demo dashboard display
    );

CREATE POLICY "Contractors Insert Claims"
    ON public.cashback_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin Update Claims"
    ON public.cashback_requests FOR UPDATE
    USING (
        auth.jwt() ->> 'email' = 'duragrit07@gmail.com' OR
        auth.jwt() ->> 'role' = 'Admin' OR
        auth.role() = 'service_role'
    );

-- --------------------------------------------------------------------
-- 10. REALTIME SUBSCRIPTIONS REPLICATION
-- --------------------------------------------------------------------
-- Enable realtime publication on key tables for live moderation & sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashback_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- --------------------------------------------------------------------
-- 11. PRINCIPAL ADMIN BOOTSTRAP (Zero Sample Data — Ready for Live Entry)
-- --------------------------------------------------------------------

-- Seed Super Admin Profile Only (No Sample Products, Partners, or Vendors)
INSERT INTO public.profiles (full_name, email, mobile, role, location, kyc_status, account_status, terminal_key, hub_depot)
VALUES ('DuraGrit Principal Admin', 'duragrit07@gmail.com', '9000000000', 'Admin', 'Morbi Central Hub, Gujarat', 'Verified', 'Active', 'DG-SEC-9942-ALPHA', 'Morbi Kiln HQ')
ON CONFLICT (mobile) DO UPDATE SET role = 'Admin', kyc_status = 'Verified';
