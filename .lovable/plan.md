
# Contact Page Upgrade

## What's changing

1. **Add Subject field** to the contact form (between Email and Message)
2. **Send form via email** using a `mailto:` link to `reham.elshrkawy@gmail.com` with subject and body pre-filled, then show a success toast
3. **Update WhatsApp button** with the correct community link, WhatsApp green styling, and "Join Our WhatsApp Community" text

## Technical Details

### 1. ContactPage.tsx changes
- Add `subject` to form state
- Add a Subject input field between Email and Message
- On submit, open a `mailto:reham.elshrkawy@gmail.com` link with the subject and body (name + message) encoded, then show success toast and reset form
- Replace the current WhatsApp button with a green (`#25D366`) rounded button linking to `https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq?mode=gi_t`

### 2. Translation updates (translations.ts)
- Add `form.subject`, `form.subjectPlaceholder`, and update `whatsapp` text in both English and Arabic:
  - EN: subject = "Subject", placeholder = "What is this about?", whatsapp = "Join Our WhatsApp Community"
  - AR: subject = "الموضوع", placeholder = "ما هو موضوع رسالتك؟", whatsapp = "انضم لمجتمعنا على واتساب"

### 3. WhatsApp button styling
- Background: `bg-[#25D366]` with `hover:bg-[#1ebe5d]`
- White text, rounded-full, WhatsApp icon (MessageCircle from lucide)
- Fully responsive
