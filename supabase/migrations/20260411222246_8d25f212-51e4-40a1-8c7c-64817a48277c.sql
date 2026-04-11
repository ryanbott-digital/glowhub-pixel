
-- Add granted_pro_until column to profiles
ALTER TABLE public.profiles
ADD COLUMN granted_pro_until timestamp with time zone DEFAULT NULL;

-- Update is_pro_user to also consider time-limited grants
CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND (
        -- Paying subscriber
        subscription_tier IN ('pro', 'enterprise')
        -- Or has an active manual grant (NULL means forever, future date means still valid)
        OR granted_pro_until > now()
      )
  )
$$;
