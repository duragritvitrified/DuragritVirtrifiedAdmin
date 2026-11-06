-- ====================================================================
-- DURAGRIT VITRIFIED — CLEAN RESET & REALTIME SYNC MIGRATION
-- Run this script once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fykxjzvdslvxablmjlfw/sql/new
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. REMOVE ALL SAMPLE / SEED DATA (PRESERVES ADMIN LOGIN PROFILE ONLY)
-- --------------------------------------------------------------------
DELETE FROM public.cashback_requests;
DELETE FROM public.qr_tokens;
DELETE FROM public.qr_batches;
DELETE FROM public.vendors;
DELETE FROM public.products;
DELETE FROM public.profiles WHERE role != 'Admin';

UPDATE public.profiles
SET reward_balance = 0.00,
    escrow_balance = 0.00,
    scans_count = 0,
    updated_at = NOW()
WHERE role = 'Admin';

-- Ensure Principal Admin profile exists cleanly
INSERT INTO public.profiles (full_name, email, mobile, role, location, kyc_status, account_status, terminal_key, hub_depot)
VALUES ('DuraGrit Principal Admin', 'duragrit07@gmail.com', '9000000000', 'Admin', 'Morbi Central Hub, Gujarat', 'Verified', 'Active', 'DG-SEC-9942-ALPHA', 'Morbi Kiln HQ')
ON CONFLICT (mobile) DO UPDATE
SET role = 'Admin',
    kyc_status = 'Verified',
    account_status = 'Active',
    reward_balance = 0.00,
    escrow_balance = 0.00,
    scans_count = 0;

-- --------------------------------------------------------------------
-- 2. ADD FLEXIBLE METADATA JSONB COLUMNS FOR FULL ERP <-> APP FIDELITY
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.qr_batches ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.qr_tokens ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.cashback_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- --------------------------------------------------------------------
-- 3. RELAX RESTRICTIVE CHECK & FK CONSTRAINTS FOR MANUAL ENTRY
-- --------------------------------------------------------------------
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_cashback_reward_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_base_mrp_check;
ALTER TABLE public.products ADD CONSTRAINT products_cashback_reward_check CHECK (cashback_reward >= 0);
ALTER TABLE public.products ADD CONSTRAINT products_base_mrp_check CHECK (base_mrp >= 0);

ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_category_check;
ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_account_status_check;
ALTER TABLE public.vendors ALTER COLUMN gstin DROP NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_kyc_status_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.qr_batches DROP CONSTRAINT IF EXISTS qr_batches_product_id_fkey;
ALTER TABLE public.qr_batches
  ADD CONSTRAINT qr_batches_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.cashback_requests DROP CONSTRAINT IF EXISTS cashback_requests_payout_method_check;
ALTER TABLE public.cashback_requests DROP CONSTRAINT IF EXISTS cashback_requests_claim_value_check;
ALTER TABLE public.cashback_requests ADD CONSTRAINT cashback_requests_claim_value_check CHECK (claim_value >= 0);
ALTER TABLE public.cashback_requests DROP CONSTRAINT IF EXISTS cashback_requests_user_id_fkey;
ALTER TABLE public.cashback_requests
  ADD CONSTRAINT cashback_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Refresh compatibility views after adding metadata columns
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;
CREATE OR REPLACE VIEW public.users_directory AS SELECT * FROM public.profiles;
CREATE OR REPLACE VIEW public.products_sku AS SELECT * FROM public.products;
CREATE OR REPLACE VIEW public.qr_scans AS SELECT * FROM public.cashback_requests;
CREATE OR REPLACE VIEW public.cashback_claims AS SELECT * FROM public.cashback_requests;
CREATE OR REPLACE VIEW public.vendors_directory AS SELECT * FROM public.vendors;

-- --------------------------------------------------------------------
-- 4. STRICT QR TOKEN VALIDATION RPC (NO FAKE FALLBACK PRODUCTS)
-- --------------------------------------------------------------------
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
    v_reward DECIMAL(10, 2);
    v_tds_info JSONB;
BEGIN
    v_clean_key := UPPER(TRIM(p_serial_key));

    SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User profile not found in Supabase.');
    END IF;

    IF v_user.account_status NOT IN ('Active', 'ACTIVE') THEN
        RETURN jsonb_build_object('success', false, 'message', 'User account is suspended or inactive.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.cashback_requests WHERE UPPER(qr_serial) = v_clean_key) THEN
        RETURN jsonb_build_object('success', false, 'message', 'This QR serial key has already been scanned and claimed.');
    END IF;

    SELECT * INTO v_token FROM public.qr_tokens WHERE UPPER(serial_key) = v_clean_key FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unregistered QR code. Generate a QR batch in Admin Panel first.');
    END IF;

    IF v_token.is_scanned THEN
        RETURN jsonb_build_object('success', false, 'message', 'This QR serial token has already been redeemed.');
    END IF;

    IF v_token.product_id IS NOT NULL THEN
        SELECT * INTO v_product FROM public.products WHERE id = v_token.product_id;
    END IF;

    v_reward := COALESCE(v_token.cashback_amount, v_product.cashback_reward, 0);
    v_tds_info := public.calculate_tds_sec194c(v_reward, v_user.pan_number IS NOT NULL);
    v_request_num := 'CB-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    INSERT INTO public.cashback_requests (
        request_id, user_id, qr_token_id, qr_serial, claim_value,
        payout_method, vpa_or_ifsc, status, proof_url,
        tds_deducted, net_disbursed, geo_lat, geo_lng, metadata
    ) VALUES (
        v_request_num, p_user_id, v_token.id, v_clean_key, v_reward,
        'UPI', COALESCE(p_vpa, v_user.vpa_upi_id, ''), 'Pending', p_proof_url,
        (v_tds_info->>'tds_amount')::DECIMAL, (v_tds_info->>'net_amount')::DECIMAL,
        p_geo_lat, p_geo_lng,
        jsonb_build_object(
            'userName', v_user.full_name,
            'mobile', v_user.mobile,
            'productName', COALESCE(v_product.name, 'DuraGrit Verified Pack'),
            'skuCode', COALESCE(v_product.sku_code, '')
        )
    ) RETURNING id INTO v_claim_id;

    UPDATE public.qr_tokens
    SET is_scanned = TRUE,
        scanned_by = p_user_id,
        scanned_at = NOW(),
        geo_lat = p_geo_lat,
        geo_lng = p_geo_lng,
        stage_1_verified = TRUE,
        stage_2_unlocked = TRUE
    WHERE id = v_token.id;

    UPDATE public.profiles
    SET escrow_balance = COALESCE(escrow_balance, 0) + v_reward,
        scans_count = COALESCE(scans_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'claim_id', v_claim_id,
        'request_id', v_request_num,
        'claim_value', v_reward,
        'product_name', COALESCE(v_product.name, 'DuraGrit Verified Pack'),
        'tds_info', v_tds_info,
        'status', 'Pending'
    );
END;
$$;

-- --------------------------------------------------------------------
-- 5. ENABLE BIDIRECTIONAL ADMIN PANEL <-> MOBILE APP <-> SUPABASE SYNC
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 6. ENABLE REALTIME REPLICATION ACROSS ALL 6 TABLES
-- --------------------------------------------------------------------
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

COMMIT;

