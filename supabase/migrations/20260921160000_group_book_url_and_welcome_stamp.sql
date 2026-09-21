-- What a welcome letter needs to exist.
--
-- book_url on the GROUP, not on each student: every student in a class gets
-- the same book, and Re types the link once when she sends the first welcome.
-- Keeping it here means a student seated next month gets the same link
-- without anyone remembering what it was.
--
-- welcome_email_sent_at on the MEMBERSHIP, not on the profile: the letter is
-- about one class. A student who moves to another group should be welcomed to
-- that one too, and a student who was already welcomed here should not be
-- welcomed again when the next student joins and Re presses send for the
-- group. The stamp is on the seat, which is the thing that is true.

alter table public.pkg_groups
  add column if not exists book_url text;

comment on column public.pkg_groups.book_url is
  'Link to this class''s book, sent in the course welcome letter. Typed once per group in the admin Groups screen.';

alter table public.pkg_group_members
  add column if not exists welcome_email_sent_at timestamptz;

comment on column public.pkg_group_members.welcome_email_sent_at is
  'When the course welcome letter was sent for THIS seat. Null means never; the admin screen skips anyone stamped unless resend is ticked.';
