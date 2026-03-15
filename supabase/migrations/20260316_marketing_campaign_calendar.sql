-- Add campaign scheduling fields to marketing_posts
ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS campaign_name text,
  ADD COLUMN IF NOT EXISTS post_order integer DEFAULT 0;

-- Index for calendar queries
CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_date
  ON public.marketing_posts (scheduled_date)
  WHERE scheduled_date IS NOT NULL;

-- Update status check to include 'scheduled'
ALTER TABLE public.marketing_posts
  DROP CONSTRAINT IF EXISTS marketing_posts_status_check;

ALTER TABLE public.marketing_posts
  ADD CONSTRAINT marketing_posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'posted', 'archived'));
