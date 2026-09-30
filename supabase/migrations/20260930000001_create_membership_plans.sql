-- ==============================================================================
-- Migration: Create membership_plans table
-- Description: Supports dynamic creation and management of membership plans
--              (Annual, Monthly, Custom) with pricing, trial days, features list,
--              and display ordering for Dr. Cubie Inspiration.
-- ==============================================================================

-- 1. Create the membership_plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'Monthly' CHECK (plan_type IN ('Monthly', 'Annual', 'Custom')),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  billing_period TEXT NOT NULL DEFAULT 'Monthly' CHECK (billing_period IN ('Monthly', 'Yearly', 'Custom')),
  description TEXT,
  discount_text TEXT,
  trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for efficient ordering and filtering
CREATE INDEX IF NOT EXISTS idx_membership_plans_display_order
  ON public.membership_plans (display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_plans_is_active
  ON public.membership_plans (is_active);

-- 3. Row Level Security (RLS)
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow anyone (including mobile app and public preview) to view active plans,
-- and allow authenticated users / admins to view all plans
DROP POLICY IF EXISTS "Public can view membership plans" ON public.membership_plans;
CREATE POLICY "Public can view membership plans"
  ON public.membership_plans
  FOR SELECT
  TO public
  USING (true);

-- Allow admins to insert new membership plans
DROP POLICY IF EXISTS "Admins can insert membership plans" ON public.membership_plans;
CREATE POLICY "Admins can insert membership plans"
  ON public.membership_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Allow admins to update membership plans
DROP POLICY IF EXISTS "Admins can update membership plans" ON public.membership_plans;
CREATE POLICY "Admins can update membership plans"
  ON public.membership_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Allow admins to delete membership plans
DROP POLICY IF EXISTS "Admins can delete membership plans" ON public.membership_plans;
CREATE POLICY "Admins can delete membership plans"
  ON public.membership_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_membership_plans_updated_at ON public.membership_plans;
CREATE TRIGGER trg_membership_plans_updated_at
BEFORE UPDATE ON public.membership_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Comment on table
COMMENT ON TABLE public.membership_plans IS 'Stores dynamic Dr. Cubie membership and subscription plans for admin management and mobile app consumption.';
