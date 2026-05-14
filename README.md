# DigiKhata

DigiKhata is a cloud credit ledger app for jewellery shopkeepers. It uses Supabase Auth, PostgreSQL, Row Level Security, and a static frontend that can be hosted on Cloudflare Pages, Vercel, Netlify, or any static hosting service.

## Current Setup

- Supabase URL: `https://pfqondqxyhstbdubblmv.supabase.co`
- Database tables: `profiles`, `customers`, `credit_entries`, `payments`
- Summary view: `credit_entry_summary`
- Email sender: Resend SMTP through `no-reply@cvang.in`

## Run Locally

Open `index.html` in a browser, or serve this folder with any static server.

For example, from this folder:

```bash
npx serve .
```

## Features

- Shopkeeper signup and login
- Email confirmation and forgot password through Supabase Auth
- Customer entry with location and phone
- Credit entry with native date pickers
- Payment history per credit entry
- Auto paid, partial, pending status calculation
- Remaining amount calculation
- Location, month, status filters
- Amount and date sorting
- Overdue reminders
- CSV export

## Security

The app uses Supabase Row Level Security. Every customer, credit entry, and payment row is tied to the logged-in user. A shopkeeper can only access their own rows.
