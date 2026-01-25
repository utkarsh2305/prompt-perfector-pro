-- Create uninstall feedback table
CREATE TABLE public.uninstall_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  additional_comments TEXT,
  user_tier TEXT,
  days_used INTEGER,
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.uninstall_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated inserts
CREATE POLICY "Allow anonymous inserts" ON public.uninstall_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Only admins can view feedback" ON public.uninstall_feedback
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for admin queries
CREATE INDEX idx_uninstall_feedback_created_at ON public.uninstall_feedback(created_at DESC);
CREATE INDEX idx_uninstall_feedback_reason ON public.uninstall_feedback(reason);