-- ============================================================================
-- SHAMS HEALTH CARE - SUPABASE DATABASE SCHEMA & DUAL-MODE RLS CONFIGURATION
-- ============================================================================
-- Purpose: Tightens Row Level Security (RLS) on public.lab_reports (B01 resolution),
-- aligns table column schema with client storage engine, enables realtime sync,
-- and prevents unauthenticated data breaches.
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/<your-project-id>
-- 2. Navigate to SQL Editor -> New Query.
-- 3. Paste and run this script.
-- 4. Under Authentication -> Users, create clinic staff accounts (e.g. staff@shamslab.local).
-- 5. Under Project Settings -> API, revoke and rotate your publishable API key if previously exposed.
-- ============================================================================

-- Step 1: Create or update lab_reports table with canonical schema
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id TEXT PRIMARY KEY,
    serial INTEGER,
    patient_id TEXT,
    patient_name TEXT,
    reported_date TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure backward compatibility if table existed with legacy columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lab_reports' AND column_name='serial') THEN
        ALTER TABLE public.lab_reports ADD COLUMN serial INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lab_reports' AND column_name='is_deleted') THEN
        ALTER TABLE public.lab_reports ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lab_reports' AND column_name='data') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lab_reports' AND column_name='report_data') THEN
            ALTER TABLE public.lab_reports RENAME COLUMN report_data TO data;
        ELSE
            ALTER TABLE public.lab_reports ADD COLUMN data JSONB;
        END IF;
    END IF;
END $$;

-- Step 2: Create indexes for rapid querying and sync
CREATE INDEX IF NOT EXISTS idx_lab_reports_serial ON public.lab_reports (serial DESC);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON public.lab_reports (patient_id, patient_name);
CREATE INDEX IF NOT EXISTS idx_lab_reports_active ON public.lab_reports (is_deleted) WHERE (is_deleted = FALSE);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old open/insecure policies
DROP POLICY IF EXISTS "Allow public read-write for clinic app" ON public.lab_reports;
DROP POLICY IF EXISTS "Public access" ON public.lab_reports;
DROP POLICY IF EXISTS "anon_full_access" ON public.lab_reports;

-- Step 5: Implement Tightened Dual-Mode Policy
-- Only authenticated users (clinic staff logged into Supabase Auth) can read, insert, update, or soft-delete reports.
-- Anonymous requests (holding only the public anon key via curl or external scripts) are blocked.
CREATE POLICY "Clinic staff authenticated full access"
    ON public.lab_reports
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 6: Enable Realtime Synchronization for lab_reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_reports;

-- Verification check:
-- To verify that anonymous access is successfully blocked:
-- curl -H "apikey: <YOUR_ANON_KEY>" "https://<YOUR_PROJECT_ID>.supabase.co/rest/v1/lab_reports?select=id"
-- Result: Returns empty array [] or 401 Unauthorized (no patient data exposed).
