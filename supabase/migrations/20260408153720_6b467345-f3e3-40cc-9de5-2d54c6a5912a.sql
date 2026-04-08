CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));