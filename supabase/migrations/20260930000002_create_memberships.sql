-- ==============================================================================
-- Migration: Create memberships table and extend profiles for VIP tracking
-- Description: Supports persistent membership purchase lifecycle, VIP activation,
--              plan association, and payment status for Dr. Cubie Inspiration.
-- ==============================================================================

-- 1. Create the memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed', 'revoked', 'inactive')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for efficient lookup and queries
CREATE INDEX IF NOT EXISTS idx_memberships_user_id
  ON public.memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_status
  ON public.memberships (status);

CREATE INDEX IF NOT EXISTS idx_memberships_user_status
  ON public.memberships (user_id, status);

CREATE INDEX IF NOT EXISTS idx_memberships_created_at
  ON public.memberships (created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Policies for memberships table
-- Allow users to view only their own memberships (or admin can view all)
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
CREATE POLICY "Users can view own memberships"
  ON public.memberships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to insert their own membership record on purchase
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.memberships;
CREATE POLICY "Users can insert own memberships"
  ON public.memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to update their own membership (e.g. cancellation)
DROP POLICY IF EXISTS "Users can update own memberships" ON public.memberships;
CREATE POLICY "Users can update own memberships"
  ON public.memberships
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Allow admins to delete memberships if needed
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
CREATE POLICY "Admins can delete memberships"
  ON public.memberships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- 5. Extend profiles table with VIP tracking columns if not already present
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vip_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS vip_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vip_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vip_payment_reference TEXT;
