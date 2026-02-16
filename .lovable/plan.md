

## Bulk Email Campaign System

### Overview
Add a complete email campaign system to the Admin Dashboard, allowing you to send bulk emails (e.g., "Welcome / Start Learning Korean") to all existing users, with duplicate prevention, batch processing, and campaign history tracking.

---

### What You'll Get

1. **New "Campaigns" tab** in the Admin Dashboard with:
   - Create campaign form (subject, HTML body with live preview)
   - Audience selector: All users vs. users who haven't received this campaign
   - "Send Test" button (sends to your admin email)
   - "Send" button with confirmation modal and real-time progress bar

2. **Campaign History** showing each campaign's name, date, and counts (queued / sent / failed), with a detail view per campaign

3. **Reliable batch sending** via a backend function that processes emails in batches of 50, with retry logic (up to 3 attempts) and per-send status tracking

---

### Database Changes (2 new tables)

**`email_campaigns`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto |
| name | text | campaign label |
| subject | text | email subject |
| html_body | text | full HTML |
| created_by | uuid | admin user_id |
| created_at | timestamptz | default now() |

**`email_sends`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto |
| campaign_id | uuid (FK) | references email_campaigns |
| user_id | uuid | target user |
| email | text | target email |
| status | text | queued / sent / failed |
| error | text | nullable |
| attempts | int | default 0 |
| sent_at | timestamptz | nullable |
| created_at | timestamptz | default now() |
| **UNIQUE** | (campaign_id, user_id) | prevents duplicates |

Both tables will have RLS policies restricting all operations to admin-only.

---

### Backend Function: `process-email-campaign`

- Picks up to 50 `queued` sends (or `failed` with attempts < 3)
- Sends each via the existing Resend integration
- Updates status to `sent` or `failed` with error details
- 1-second delay between sends for rate limiting
- Called by the admin UI after enqueueing, with polling for progress

The email template will be a clean, modern HTML design with:
- White background, soft purple accent (#8B5CF6)
- Personalized greeting (first name or "Hi there")
- Primary CTA: "Start Learning Korean" linking to the dashboard
- Secondary links to Courses and Dashboard
- Signature: "Reham, Founder of K-Lovers"

---

### Security
- Both tables: admin-only RLS
- The backend function validates admin role before processing
- The Campaign tab is inside the existing admin-protected dashboard

---

### Technical Details

**Files to create:**
- `src/components/admin/BulkEmailManager.tsx` -- campaign UI component
- `supabase/functions/process-email-campaign/index.ts` -- batch sender

**Files to modify:**
- `src/pages/AdminDashboard.tsx` -- add "Campaigns" tab trigger + content
- `supabase/config.toml` -- register new edge function with `verify_jwt = false`

**Migration SQL:**
- Create `email_campaigns` and `email_sends` tables with RLS policies

**Sending flow:**
1. Admin creates campaign (name + subject + HTML body)
2. Admin selects audience and clicks Send
3. Frontend inserts campaign row, then bulk-inserts `email_sends` rows (status=queued) for all target users from `profiles` table
4. Frontend calls `process-email-campaign` edge function
5. Edge function processes batch of 50, returns progress
6. Frontend polls/re-calls until all sends are processed
7. UI shows real-time progress (queued/sent/failed counts)

