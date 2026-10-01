# Supabase setup

Follow these once, in order. Until step 3 is done the app runs in read-only
preview mode from `data/gloosphere-export.json`.

## 1. Create the project

1. Go to https://supabase.com/dashboard and create a new project (pick the
   Singapore region). Save the database password somewhere safe.
2. In **Project Settings > API** note the Project URL, the `anon` key and the
   `service_role` key.
3. In **Authentication > URL Configuration** set the Site URL to your domain
   (e.g. `https://reviews.blink.sg`) and add `https://reviews.blink.sg/auth/callback`
   and `http://localhost:3000/auth/callback` to the redirect allow list.
4. Optional but recommended: in **Authentication > SMTP** connect your own
   email provider. The built-in sender only allows a few emails per hour,
   which is not enough to invite all owners.

## 2. Run the migration

Open **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`
and run it. (Or, with the Supabase CLI linked to the project, run
`supabase db push`.) It creates the tables, triggers, security policies and
the public `logos` storage bucket. It is safe to run more than once.

## 3. Set the environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://reviews.blink.sg
```

Set the same four in your hosting provider. Never expose the service role key
to the browser; it is only read on the server.

## 4. Create the first admin

1. Start the app (`npm run dev`), open `/login` and sign up (or use
   **Authentication > Users > Add user** in the dashboard) with the email you
   want to use as super admin.
2. In **Authentication > Users** copy that user's UUID.
3. In the SQL Editor run:

   ```sql
   insert into public.admin_users (user_id, email)
   values ('<the uuid>', '<the email>');
   ```

Anyone in `admin_users` can see and edit every business, review and lead.

## 5. Import the existing data

Dry run first; it only prints counts:

```
npx tsx scripts/import-export.ts --data data/gloosphere-export.json
```

Then write everything (businesses, reviews, logos, campaigns, owner accounts):

```
npx tsx scripts/import-export.ts --data data/gloosphere-export.json --commit
```

The script is idempotent: running it again updates the same rows. It creates
one confirmed auth user per owner email and links it to the business; owners
cannot sign in yet because they have no password.

## 6. Invite the owners

When you are ready for clients to log in, send everyone a password-set email:

```
npx tsx scripts/import-export.ts --data data/gloosphere-export.json --invite
```

Only owners of active businesses are emailed; add `--include-inactive` to
email everyone. Emails go out 1.5 seconds apart to stay under the rate limit.
A single owner can be re-invited at any time from the admin UI (it calls
`inviteOwner()` in `src/lib/data/supabase-repo.ts`).

## Notes

- Business ids are the legacy Firebase ids. Printed QR codes point at them, so
  they are never regenerated.
- Review counters on each business are maintained by database triggers. If
  they ever look wrong, run `select public.recompute_business_stats();`.
- Logos live in the public `logos` bucket under `<businessId>/<filename>`.

## Before sending the customer invites (`--invite`)

1. **Use your own email sender.** Supabase's built-in email only sends a few
   emails per hour, which is not enough for 56 owners. In Supabase go to
   Authentication > Emails > SMTP Settings and enter Resend's SMTP details
   (host `smtp.resend.com`, port 465, user `resend`, password = your Resend API key,
   sender e.g. `notifications@reviews.blink.sg`).
2. **Point the links at the live site.** Authentication > URL Configuration:
   Site URL `https://reviews.blink.sg`, and add
   `https://reviews.blink.sg/auth/callback` to Redirect URLs.
   Only send invites once the site is live on that address, or the links in
   the emails will not work.
3. Optional: edit the "Reset password" email template so it reads as a
   welcome, e.g. "Your Blink review dashboard is ready. Set your password."
