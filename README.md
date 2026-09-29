# Dr. Cubie Inspiration — Separate Admin Dashboard

A dedicated, production-grade Web Administrator Console built with **React**, **Vite**, and **Supabase** for managing the content and media infrastructure of the Dr. Cubie Inspiration platform.

This application is built as an independent, scalable management system that directly manages the same Supabase database and storage buckets consumed by the consumer mobile application (`drcubie-app`).

---

## 📑 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Production Build & Preview](#production-build--preview)
- [Deployment (Vercel & SPA Routing)](#deployment-vercel--spa-routing)
- [Supabase Setup & Schema](#supabase-setup--schema)
- [Admin Access Requirements & Security](#admin-access-requirements--security)

---

## 🏛 Overview & Architecture

```
                    ┌──────────────────────────────┐
                    │    DR. CUBIE ADMIN CONSOLE   │
                    │   (Vite + React SPA Admin)   │
                    └──────────────┬───────────────┘
                                   │ Browser-safe Anon Key + RLS
                                   ▼
                   ┌───────────────────────────────┐
                   │       SUPABASE BACKEND        │
                   │  - PostgreSQL (RLS Enforced)  │
                   │  - Storage Buckets            │
                   │  - Supabase Auth Engine       │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    DR. CUBIE MOBILE APP      │
                    │   (Consumer Experience)      │
                    └──────────────────────────────┘
```

The Admin Dashboard provides real-time CRUD and media storage management without requiring duplicate tables or modifying the existing mobile consumer client.

---

## 🚀 Key Features

1. **Secure Admin Authentication**:
   - Protected login powered by Supabase Auth (`signInWithPassword`).
   - Profile verification against `public.profiles` (`role = 'admin'`).
   - Non-admin accounts are immediately rejected with an explicit permission warning and signed out.
   - **No new authentication users are created or seeded**.

2. **Overview KPI Dashboard (`/dashboard`)**:
   - Real-time aggregated counts queried directly from Supabase (Total Users, Sparks, Videos, Audios, Recommendations, VIP Content, Published Content, Active Notifications).
   - Shows 0 if tables have no records; no fake or hardcoded KPI numbers.
   - Recent content activity across Sparks, Videos, and Audios.

3. **Spark Management (`/sparks`)**:
   - Create, edit, preview, publish/unpublish, and archive daily wisdom Sparks.
   - Links wisdom cards with reflection, insight, practice, and associated video/audio tracks.
   - Full search, category filter, publication status, and VIP tier flags.

4. **Video Management (`/videos`)**:
   - Direct binary upload to the `videos` Supabase Storage bucket (up to 100MB).
   - Dedicated thumbnail poster upload to `thumbnails` bucket.
   - Metadata persistence in `public.videos`.
   - Integrated video preview player.
   - Pre-delete validation that prevents deleting videos actively linked to existing Sparks.

5. **Audio Management (`/audios`)**:
   - Upload audio contemplation files to the `audio` storage bucket (up to 50MB).
   - Artwork upload to `thumbnails` bucket.
   - Speaker metadata, duration formatting, and interactive audio playback preview.

6. **Recommendations Management (`/recommendations`)**:
   - Curate and order cards shown in the mobile app's "Recommended For You" carousel.
   - Supports polymorphic targets: Spark, Video, or Audio without duplicating content records.
   - Drag/priority display ordering and instant active/inactive toggle.

7. **Daily Content Scheduling (`/daily-content`)**:
   - Controls what appears on the consumer mobile app's Today screen for any calendar date.
   - Select Date, Today's Spark, Today's Video, Today's Audio, and review active recommendations.
   - Sets publication status (Draft vs. Published).

8. **User Directory (`/users`)**:
   - Inspect registered members from `public.profiles`.
   - Columns: Name, Email, VIP status, Joined date, Role, Status.
   - "View Profile" modal for viewing comprehensive member metadata.
   - One-click toggle for VIP pass entitlement (`is_vip = true / false`).
   - Strictly respects privacy: passwords are never exposed; no new users are generated.

9. **Notification Center (`/notifications`)**:
   - Compose and dispatch targeted in-app notifications.
   - Target audiences: **All Users**, **VIP Pass Holders**, or **Specific Registered Member**.
   - Strictly validated types (`spark`, `video`, `audio`, `vip`, `general`, `system`, `streak`).
   - Deep-linking destination actions (`Today Screen`, `Specific Spark/Video/Audio`, `VIP Screen`).

10. **Media Storage Library (`/media`)**:
    - Browse and inspect files across storage buckets: `videos`, `audio`, `thumbnails`, `avatars`.
    - File size formatting, MIME types, and public URL copying.
    - Safety checks before deletion to warn if a file is referenced by active database records.

---

## 📁 Project Structure

```
drcubie-admin/
├── public/                 # Static brand assets & icons
├── src/
│   ├── components/
│   │   ├── layout/         # AdminLayout, Header, Sidebar, ProtectedRoute
│   │   ├── ui/             # Reusable UI (Button, Modal, Input, Select, Badge, Spinner, etc.)
│   │   ├── dashboard/      # KpiCard, RecentContentTable
│   │   ├── content/        # SparkFormModal, MediaPreviewModal
│   │   ├── users/          # UserProfileModal
│   │   └── media/          # MediaUploader
│   ├── pages/
│   │   ├── auth/           # LoginPage
│   │   ├── dashboard/      # DashboardPage
│   │   ├── sparks/         # SparksPage
│   │   ├── videos/         # VideosPage
│   │   ├── audios/         # AudiosPage
│   │   ├── recommendations/# RecommendationsPage
│   │   ├── dailyContent/   # DailyContentPage
│   │   ├── users/          # UsersPage
│   │   ├── notifications/  # NotificationsPage
│   │   ├── media/          # MediaLibraryPage
│   │   └── settings/       # SettingsPage
│   ├── services/
│   │   ├── supabase/       # Centralized browser client (anon key only)
│   │   ├── dashboard/      # KPI & recent content fetchers
│   │   ├── sparks/         # Sparks CRUD operations
│   │   ├── videos/         # Videos CRUD & upload operations
│   │   ├── audios/         # Audios CRUD & upload operations
│   │   ├── recommendations/# Recommendations CRUD & ordering
│   │   ├── dailyContent/   # Daily schedule programming
│   │   ├── users/          # Profiles query & VIP pass management
│   │   ├── notifications/  # Broadcast dispatch engine
│   │   └── media/          # Storage bucket listing & deletion
│   ├── context/
│   │   ├── AuthContext.jsx # Admin session state & role guard
│   │   └── ToastContext.jsx# System feedback alerts
│   ├── hooks/
│   │   └── useDebounce.js  # Debounce hook for searches
│   ├── utils/
│   │   ├── formatters.js   # Date, duration, and file size formatters
│   │   └── validators.js   # URL, email, and slug validators
│   ├── routes/
│   │   └── index.jsx       # Route path constants
│   ├── lib/
│   │   └── supabase.js     # Supabase instance re-export
│   ├── styles/
│   │   └── admin.css       # Complete design system & responsive rules
│   ├── App.jsx             # Main routing configuration
│   └── main.jsx            # React root entry point
├── .env.example            # Template for environment configuration
├── .gitignore              # Ignores dist, node_modules, and secrets
├── package.json            # Project dependencies & scripts
├── vercel.json             # SPA rewrite configuration
└── vite.config.js          # Vite build configuration
```

---

## ⚙️ Environment Variables

Create a local `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure your Supabase credentials:

```ini
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```

> ⚠️ **CRITICAL SECURITY NOTE:**
> NEVER expose `SUPABASE_SERVICE_ROLE_KEY` in `.env`, client code, or the Git repository. The admin frontend uses only the publishable anon key combined with database-level Row Level Security (RLS) policies.

---

## 🛠 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. Open the displayed URL (e.g. `http://localhost:5173`) in your browser.

---

## 📦 Production Build & Preview

1. **Compile the production bundle:**
   ```bash
   npm run build
   ```

2. **Preview the production build locally:**
   ```bash
   npm run preview
   ```

---

## 🚀 Deployment (Vercel & SPA Routing)

The project includes `vercel.json` with SPA rewrites to ensure deep routes (`/dashboard`, `/videos`, `/sparks`, `/daily-content`, etc.) do not return 404 upon browser refresh:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

When deploying to Vercel, Netlify, or AWS Amplify:
1. Set the **Build Command** to `npm run build`.
2. Set the **Output Directory** to `dist`.
3. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 🗄 Supabase Setup & Schema

The application connects to the standard Dr. Cubie Inspiration Supabase database:

### Tables
- `public.profiles`: User profiles with `role` (`'admin'` or `'user'`) and `is_vip`.
- `public.sparks`: Daily wisdom modules, reflections, practices, and linked media IDs.
- `public.videos`: Video contemplation records and storage asset links.
- `public.audios`: Audio contemplation records, speaker metadata, and sound tracks.
- `public.daily_content`: Calendar schedule mapping dates (`content_date`) to featured Sparks.
- `public.recommendations`: Curated recommendations with priority ordering.
- `public.notifications`: User notifications with `type` check constraint.

### Storage Buckets
- `videos`: Max 100MB (Public read, admin write).
- `audio`: Max 50MB (Public read, admin write).
- `thumbnails`: Max 10MB (Public read, admin write).
- `avatars`: Max 5MB (Public read, user/admin write).

---

## 🔐 Admin Access Requirements & Security

1. **Authentication**: Users must sign in via Supabase Auth with email and password.
2. **Authorization**: Access is restricted strictly to accounts where `public.profiles.role = 'admin'`.
3. **Database RLS Function**:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS boolean AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
   ```
4. **Granting Admin Access to an Existing User**:
   If an existing user needs admin rights, run the following in the Supabase SQL editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-user@example.com';
   ```
   *(Do NOT create new dummy users).*
