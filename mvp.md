# GlamWorldFace — MVP Implementation Status & Scoring Rulebook

This document reviews the current development state of the **GlamWorldFace MVP**, comparing the delivered codebase against the original requirements defined in `mvp.txt`. It also documents the **Scoring Rulebook**, the **JURY role**, and provides a step-by-step guide on how to perform a full Demo Test.

> [!NOTE]
> **The full standalone Scoring Rulebook is at [`SCORING_RULEBOOK.md`](file:///d:/projects/GlamWorldFace/SCORING_RULEBOOK.md)** — it contains detailed category descriptions, scale explanations, worked examples, and edge cases.

---

## 🎯 1. What is Achieved

The core architecture, database, and all 4 development phases requested in the MVP spec have been successfully implemented, along with the extended jury scoring system.

### ✅ Phase 1: Foundation & Profiles
- **Authentication**: Fully implemented using NextAuth.js (Auth.js v5). Supports Google OAuth and Email/Password Credentials. Routes are heavily protected based on Roles (`ADMIN`, `CONTESTANT`, `PUBLIC`, `JURY`).
- **Database Architecture**: Prisma ORM is fully configured with a PostgreSQL schema that includes all required tables plus new scoring tables.
- **Contestant Profiles**: The `/dashboard/profile` route allows contestants to build their profile with all original 12 fields **plus 5 new extended fields** (Goals, Achievements, Languages, Occupation, Personality), validated by Zod.
- **Image Storage**: Implemented an upload system supporting **DigitalOcean Spaces** (AWS S3 SDK) for Profile, Face, and Full-Body images. It currently safely defaults to a local filesystem fallback (`/public/uploads/...`) for seamless local development.

### ✅ Phase 2 & 3: Competitions, Voting, & Admin
- **Competition Creation**: Admins can create competitions (`JURY` or `PUBLIC_VOTING`) with specific start/end dates and active statuses via `/admin/competitions/create`.
- **Contestant Registration**: Contestants can browse active competitions and click "Join". Their entry is stored as `Pending` until Admin approval.
- **Admin Controls**: The `/admin/competitions/[id]/entries` dashboard allows Admins to review contestant applications, **Approve/Revoke** entries, and trigger AI scoring.
- **Public Voting System**: Robust `/api/vote` route that allows authenticated users to vote. It strictly enforces **one vote per competition per user** using database-level `UNIQUE` constraints.

### ✅ Phase 4: UX Polish, Mobile, & Shareability
- **Mobile-First App Layout**: The homepage automatically switches from a scrolling desktop view to a tabbed, app-like mobile view with bottom navigation.
- **Shareable Result Pages**: Dedicated `/leaderboard/[id]` and `/contestants/[id]` routes have been built.
- **SEO & Social Sharing**: OpenGraph and Twitter Cards are dynamically generated for contestants and leaderboards.
- **Theming**: Flawless Light/Dark mode toggle implemented globally using Shadcn UI.

### ✅ Phase 5: Jury Scoring System (NEW)
- **JURY User Role**: Added to the `UserRole` enum. Jury users see a "Jury Dashboard" link in their sidebar.
- **Jury Assignment**: A `JuryAssignment` join table links jury users to specific competitions. Admins assign jurors by email.
- **Human Jury Scoring**: Each juror can score each approved entry on 5 categories (1–10 scale) with optional comments. Scores are upsertable (update, not duplicate).
- **LLM System Scoring**: An automated pipeline using **OpenAI (primary)** with **Google Gemini (fallback)** evaluates contestant text profiles.
- **Final Score Computation**: A weighted formula combines human and system scores.
- **Contestant Score Breakdown**: The `/dashboard/results` page shows per-competition score breakdowns with **interactive radar charts** (Recharts) comparing Human vs AI scores.

---

## ⏳ 2. What is Not Yet Achieved (Pending/Future)

1. **Production Deployment (DigitalOcean)**: The app runs locally. It needs PM2 + NGINX deployment on the DigitalOcean Droplet.
2. **Admin User Management (`/admin/users`)**: Global user role management table is not yet built.
3. **Dynamic Winner Cards**: The spec mentioned "dynamic winner cards" for social sharing as a future enhancement.

---

## 👤 3. User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **ADMIN** | Platform administrator | Create competitions, approve/reject entries, assign jurors, trigger AI scoring |
| **CONTESTANT** | Competition participant | Build profile, upload images, join competitions, view score breakdowns |
| **PUBLIC** | General authenticated user | Browse competitions, vote in PUBLIC_VOTING competitions |
| **JURY** | Assigned judge | View assigned competitions, score contestants on 5 categories |

---

## 📊 4. Scoring Rulebook

### 4.1 Scoring Categories

All scoring (both human jury and LLM system) uses the same **5 categories** on a **1–10 scale**:

| Category | What it Measures | Low (1–3) | Medium (4–6) | High (7–10) |
|----------|------------------|-----------|--------------|-------------|
| **Presentation** | Clarity, structure, and appeal of bio & profile text | Poorly written, no structure, unappealing | Acceptable writing, basic structure | Compelling, well-structured, engaging prose |
| **Confidence** | Strength and ambition shown in goals, aspirations, self-description | No goals mentioned, vague, passive | Some goals but generic or unclear | Bold, specific aspirations with clear vision |
| **Styling** | Quality indicators from occupation, personality, portfolio presence | No portfolio, no indication of style awareness | Some indicators of style or creative interest | Strong creative portfolio, professional persona |
| **Profile Quality** | Completeness and detail of all text fields | Most fields empty, minimal information | Some fields filled, moderate detail | All fields complete with rich, detailed content |
| **Professionalism** | Tone, grammar, coherence, and maturity of written text | Poor grammar, informal tone, incoherent | Acceptable grammar, somewhat professional | Polished, error-free, mature professional tone |

### 4.2 Who Scores What

> [!IMPORTANT]
> **Human jurors** and the **AI system** have different responsibilities:

| Aspect | Human Jury | AI System (LLM) |
|--------|-----------|-----------------|
| **Text fields** (bio, goals, achievements, personality) | ✅ Evaluates | ✅ Evaluates |
| **Images** (profile photo, face images, full-body images) | ✅ Evaluates | ❌ Does NOT evaluate |
| **Instagram / Social Presence** | ✅ Evaluates | ❌ Does NOT evaluate |
| **Physical Attributes** (height, weight, body type) | ✅ Evaluates in person/via images | ✅ Evaluates completeness only |

The LLM scores **only structured text fields** and cannot judge actual images. This is by design to ensure fairness and to complement the human jury's visual assessment.

### 4.3 Final Score Formula

The final score for each contestant entry in a JURY competition is calculated as:

```
final_score = (avg_human_score × 1.0 + system_score × 0.5) / 1.5
```

**In plain language:**
- The **average of all human jury scores** carries a weight of **1.0** (full weight).
- The **AI system score** carries a weight of **0.5** (half weight).
- These are combined and divided by **1.5** (the sum of the weights) to produce a normalized final score on the same 1–10 scale.

**Example:**
- 3 human jurors gave overall scores of 8.0, 7.5, and 8.5 → average = **8.0**
- AI system gave an overall score of **7.0**
- Final score = (8.0 × 1.0 + 7.0 × 0.5) / 1.5 = (8.0 + 3.5) / 1.5 = **7.67**

**Edge Cases:**
- If no system score exists, only the human average is used.
- If no human scores exist, only the system score is used.
- The function is **idempotent** — it can be re-run whenever new human scores arrive.

### 4.4 Leaderboard Ordering

| Competition Type | Ordered By |
|------------------|------------|
| **JURY** | `finalScore DESC` (falls back to `overallScore DESC`) |
| **PUBLIC_VOTING** | `voteCount DESC` |

---

## 🗄️ 5. Data Model for Scoring

### New Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `jury_assignments` | Links jury users to competitions | `competitionId`, `juryUserId` (unique pair) |
| `jury_scores` | Per-juror score for each entry | `entryId`, `juryId`, 5 category scores, `overallScore`, `comments` (unique per entry+juror) |
| `system_scores` | LLM-generated score for each entry | `entryId` (unique), 5 category scores, `overallScore`, `modelName`, `rawOutput` |

### Modified Tables

| Table | Change |
|-------|--------|
| `users` | Added `JURY` to `UserRole` enum |
| `contestants` | Added 5 new fields: `goals`, `achievements`, `languages`, `occupation`, `personality` |
| `competition_entries` | Added `finalScore` column for the weighted combined score |

### How Data Flows

```
Contestant fills profile (17 fields + images)
        ↓
Admin creates JURY competition → assigns jury users
        ↓
Contestant joins → Admin approves entry
        ↓
┌─────────────────────┐     ┌──────────────────────┐
│   Human Jury scores │     │  Admin triggers LLM  │
│   via /jury/[id]    │     │  system scoring      │
│   → jury_scores     │     │  → system_scores     │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └─────────┬─────────────────┘
                   ↓
        computeFinalScoreForEntry()
        final = (avg_human × 1.0 + system × 0.5) / 1.5
                   ↓
        competition_entries.finalScore updated
                   ↓
        Leaderboard shows ranked results
                   ↓
        Contestant sees breakdown + radar chart
        at /dashboard/results
```

---

## 🧪 6. How to Run a Full Demo Test

### Prerequisites
You need at least **4 separate accounts** (or 4 different browsers/incognito windows):
1. **Admin Account** (role = `ADMIN`)
2. **Contestant Account** (role = `CONTESTANT`)
3. **Jury Account** (role = `JURY`)
4. **Voter Account** (role = `PUBLIC`)

> [!TIP]
> After registering, set user roles directly in PostgreSQL:
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
> UPDATE users SET role = 'JURY' WHERE email = 'jury@example.com';
> ```

### Step 1: Contestant Profile Setup
1. Log in as the **Contestant**.
2. Navigate to **Dashboard → Profile**.
3. Fill out all fields including the new Extended Profile section (Goals, Achievements, Languages, Occupation, Personality).
4. Upload a Profile Picture, Face Images, and Full Body Images.
5. Save the profile.

### Step 2: Admin Creates a JURY Competition
1. Log in as the **Admin**.
2. Go to `/admin/competitions` → **New Competition**.
3. Create a competition with type = **Jury Scoring**, status = **ACTIVE**.

### Step 3: Admin Assigns a Jury Member
1. Still as Admin, go to the competition's **Manage Entries** page (`/admin/competitions/[id]/entries`).
2. At the top of the page, you'll see the **"Assigned Jurors"** panel with an email input field.
3. Enter the Jury account's email (e.g. `jury@glamworldface.com`) and click **Assign**.
4. The juror badge will appear in the panel.

### Step 4: Contestant Joins & Admin Approves
1. Log in as the **Contestant** → browse to the competition → **Join Competition**.
2. Log in as **Admin** → go to **Manage Entries** → **Approve** the contestant.

### Step 5: Admin Triggers AI Scoring
1. As Admin, trigger the LLM system score for the approved entry.
2. The AI evaluates the contestant's text profile and stores scores in `system_scores`.

### Step 6: Human Jury Scores the Contestant
1. Log in as the **Jury** account.
2. Navigate to **Jury Dashboard** (`/jury`).
3. Click into the assigned competition.
4. View the contestant's profile, images, and Instagram link.
5. Score each category (1–10) and add optional comments.
6. Submit. The final score is automatically computed.

### Step 7: Verify the Leaderboard
1. Go to `/competitions/[id]` → **Leaderboard** tab.
2. Entries are now ranked by `finalScore` (weighted human + AI).

### Step 8: Contestant Views Score Breakdown
1. Log in as the **Contestant**.
2. Go to **Dashboard → Results** (`/dashboard/results`).
3. See the interactive **radar chart** comparing Human vs AI scores per category.
4. See final score, human average, and AI score badges.

### Step 9: Test Public Voting (separate competition)
1. Create a `PUBLIC_VOTING` competition as Admin.
2. Have the contestant join and get approved.
3. Log in as the **Voter** → vote for the contestant.
4. Verify duplicate vote prevention (button becomes disabled).
5. Check the leaderboard updates by `voteCount`.

### Step 10: Share Results
1. Visit `/leaderboard/[id]` — shareable leaderboard with OG tags.
2. Visit `/contestants/[contestant-id]` — shareable profile with OG tags.
3. Inspect `<meta>` tags in page source to verify social preview data.

---

## 🔧 7. Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Image Storage
SPACES_KEY=""
SPACES_SECRET=""
NEXT_PUBLIC_SPACES_BUCKET=""
NEXT_PUBLIC_SPACES_REGION=""

# LLM Scoring
OPENAI_API_KEY=""       # Primary provider
GEMINI_API_KEY=""       # Fallback provider

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="GlamWorldFace"
```

---

## 📁 8. Route Map

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Homepage with mobile tab navigation |
| `/competitions` | Dynamic | Public competition listing |
| `/competitions/[id]` | Dynamic | Competition detail + leaderboard |
| `/contestants/[id]` | Dynamic | Public contestant profile (shareable) |
| `/leaderboard/[id]` | Dynamic | Shareable leaderboard page |
| `/auth/login` | Static | Login page |
| `/auth/register` | Static | Registration page |
| `/dashboard` | Dynamic | Contestant dashboard overview |
| `/dashboard/profile` | Dynamic | Profile edit form (17 fields) |
| `/dashboard/results` | Dynamic | Score breakdown with radar charts |
| `/jury` | Dynamic | Jury dashboard (assigned competitions) |
| `/jury/[competitionId]` | Dynamic | Per-competition scoring interface |
| `/admin/competitions` | Dynamic | Admin competition list |
| `/admin/competitions/create` | Static | Create competition form |
| `/admin/competitions/[id]/entries` | Dynamic | Manage entries (approve/reject/score) |
| `/api/vote` | API | Public voting endpoint |
| `/api/upload` | API | Image upload endpoint |
| `/api/upload/delete` | API | Image deletion endpoint |
