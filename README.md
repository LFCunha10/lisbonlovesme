# Lisbonlovesme - Tour Booking Application

A full-stack tour booking application for Lisbon tourism, built with React, Node.js, Express, and PostgreSQL.

## Features

- 🗺️ Tour management with multilingual support (English, Portuguese, Russian)
- 📅 Booking system with availability management
- 💳 Payment processing with Stripe integration
- 📧 Email notifications and confirmations
- 🖼️ Gallery management
- 📝 Articles/blog system
- 👨‍💼 Admin dashboard for complete management
- 🌍 Internationalization support

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with sessions
- **Email**: Nodemailer
- **Payments**: Stripe
- **Deployment**: Ready for Railway, Render, Heroku

## Quick Deploy

### Railway (Recommended)
1. Fork this repository
2. Connect to Railway: https://railway.app
3. Create new project from GitHub repo
4. Add environment variables (see .env.example)
5. Deploy!

### Render
1. Fork this repository
2. Connect to Render: https://render.com
3. Create new web service from GitHub repo
4. Add environment variables
5. Deploy!

### Heroku
1. Fork this repository
2. Create new Heroku app
3. Connect GitHub repo
4. Add Heroku Postgres addon
5. Set environment variables
6. Deploy!

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session
SESSION_SECRET=your-super-secret-session-key

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Optional: Visit geolocation and iOS Push Notifications
# If set, visits tracked on the site will include city/region/country
IPINFO_TOKEN=your_ipinfo_token

# APNs (optional; enables iOS push from server)
# Either set APNS_KEY_PATH to a .p8 file path on server, or base64 of the key
APNS_KEY_ID=ABC1234567
APNS_TEAM_ID=YOURTEAMID
APNS_BUNDLE_ID=com.yourcompany.LLMAdmin
# APNS_KEY_PATH=/absolute/path/AuthKey_ABC1234567.p8
# Or alternatively:
# APNS_KEY_BASE64=base64-encoded-.p8-key
# APNS_SANDBOX=true
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`

3. Push database schema:
```bash
npm run db:push
```

New tables created by the schema:
- `devices`: stores iOS device tokens (for push)
- `notifications`: in-app notifications (visits, contacts, bookings)
- `contact_messages`: persisted contact form messages

4. Start development server:
```bash
npm run dev
```

5. Visit http://localhost:5001

## Database Setup

The application uses PostgreSQL. You can use:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway Postgres**: Automatically provisioned
- **Render Postgres**: Available as addon

## Admin Access

After deployment, create an admin user by calling:
```bash
POST /api/admin/create-user
{
  "username": "admin",
  "password": "your-secure-password"
}
```

Then access the admin panel at `/admin/login`

The frontend also posts a lightweight event to `/api/track-visit` on first load, which creates an admin notification (and optionally sends a push). See `mobile/LLMAdmin/README.md` for the SwiftUI admin app.

## Features Overview

### Customer Features
- Browse available tours with multilingual content
- Book tours with date/time selection
- Receive email confirmations
- Leave reviews after tours
- Contact form

### Admin Features
- Complete tour management (CRUD)
- Booking calendar and request management
- Customer communication tools
- Gallery management
- Articles/blog management
- Review moderation
- Payment tracking and refunds
- Database export functionality

## Support

For deployment help or questions, contact: cluizfilipe@gmail.com

## License

MIT License - see LICENSE file for details
