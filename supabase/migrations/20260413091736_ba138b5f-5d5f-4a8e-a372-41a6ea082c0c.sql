ALTER TABLE public.profiles 
  ADD COLUMN subscription_end timestamp with time zone DEFAULT NULL,
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;