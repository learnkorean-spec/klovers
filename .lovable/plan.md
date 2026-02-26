

# Auto Social Post Scheduler — Implementation Plan

## Overview
Add a full social media post scheduler to the admin panel: a new page at `/admin/social-scheduler` where admins create, schedule, edit, and monitor social posts to Facebook and Instagram, powered by a cron-triggered edge function that publishes via Meta Graph API.

## Database

**New table: `scheduled_social_posts`**
- `id` uuid PK
- `group_id` uuid nullable (FK to `pkg_groups`)
- `course_title` text
- `caption` text
- `registration_url` text nullable
- `platforms` text[] (values: `instagram`, `facebook`)
- `scheduled_at` timestamptz
- `status` text default `scheduled` (scheduled | posted | failed | canceled)
- `posted_at` timestamptz nullable
- `attempts` int default 0
- `last_error` text nullable
- `meta_result` jsonb nullable
- `created_at` timestamptz default now()
- `created_by` uuid (admin who created it)

**RLS**: Admin-only for all operations (reuse `has_role(auth.uid(), 'admin')`).

## Secrets Required
Four secrets to be added via the secrets tool:
1. `META_PAGE_ID` — Facebook Page ID
2. `META_PAGE_ACCESS_TOKEN` — Long-lived Page Access Token
3. `META_IG_USER_ID` — Instagram Business Account ID
4. `IG_STATIC_IMAGE_URL` — Public URL of a static image for all IG posts

## Edge Function: `publish-social-posts`

- Fetches rows where `status = 'scheduled' AND scheduled_at <= now()`.
- For each post:
  - **Facebook**: POST to `https://graph.facebook.com/v21.0/{PAGE_ID}/feed` with `message` = caption + registration URL.
  - **Instagram**: Two-step — create media container with `image_url` + `caption`, then publish container.
- On success: `status = 'posted'`, `posted_at = now()`, store API response in `meta_result`.
- On failure: increment `attempts`, set `last_error`. After 3 attempts, set `status = 'failed'`.
- 1-second delay between posts to respect rate limits.

**Config in `supabase/config.toml`**: `verify_jwt = false` (validates admin auth in code).

## Cron Job
A `pg_cron` + `pg_net` job that calls the edge function every 5 minutes:
```sql
SELECT cron.schedule('publish-social-posts', '*/5 * * * *', $$
  SELECT net.http_post(
    url:='https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/publish-social-posts',
    headers:='{"Authorization": "Bearer <anon_key>", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
$$);
```

## New Page: `/admin/social-scheduler`

**Component**: `src/pages/SocialSchedulerPage.tsx`

**Section 1 — Create Post card**:
- Dropdown populated from `pkg_groups` joined with `schedule_packages` (same source as Groups panel).
- On group selection, auto-populate: group name, level, day, time, duration, capacity, seats left.
- "Generate Caption" button produces an Arabic template with the group data.
- Editable textarea for caption.
- Platform checkboxes: Instagram + Facebook (default both).
- Datetime picker for `scheduled_at` (default: tomorrow 10:00 AM).
- "Schedule Post" button inserts into `scheduled_social_posts`.
- Small tooltip with usage guide.

**Section 2 — Posts table**:
- Columns: created_at, scheduled_at, platforms, course/group, status, last_error, actions.
- Actions: View (dialog with caption), Edit (caption + time if scheduled), Cancel, Retry (re-queues with `status = 'scheduled'`, `scheduled_at = now() + 2min`).

## Routing
- Add route `/admin/social-scheduler` in `App.tsx` wrapped with `ProtectedRoute`.
- Add a navigation link/button from the Admin Dashboard to this page.

## Implementation Steps

1. Create `scheduled_social_posts` table with RLS via migration tool.
2. Request all 4 Meta secrets from admin via `add_secret` tool.
3. Create edge function `supabase/functions/publish-social-posts/index.ts`.
4. Register function in `supabase/config.toml`.
5. Set up `pg_cron` job via insert tool.
6. Build `src/pages/SocialSchedulerPage.tsx` with create + list UI.
7. Add route in `App.tsx` and navigation link from Admin Dashboard.

