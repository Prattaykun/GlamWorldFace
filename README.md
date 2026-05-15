# 👑 GlamWorldFace

GlamWorldFace is a modern, mobile-first beauty pageant platform MVP where contestants can join competitions, complete their profiles, and compete in either Jury-based or Public Voting competitions. 

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Authentication:** [Auth.js v5](https://authjs.dev/) (NextAuth.js)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (running in Docker)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Validation:** [Zod](https://zod.dev/)

## ✨ Key Features

- **Role-Based Authentication:** Users are assigned roles (`ADMIN`, `CONTESTANT`, `PUBLIC`). The platform uses a centralized `proxy.ts` (Next.js 16 middleware) to securely lock down routes like `/admin` and `/dashboard`.
- **Multiple Login Methods:** Supports Google OAuth and classic Email/Password credentials.
- **Database Models:** Fully relational schema mapping `Users`, `Contestants`, `Competitions`, `Votes`, and `Scores`.
- **Mobile-First UI:** Responsive navigation (hamburger menus, drawers) and clean forms designed for all screen sizes.
- **Dark Mode:** Integrated theme toggling utilizing `next-themes`.

---

## 🚀 Getting Started

Follow these instructions to run the platform locally on your machine.

### 1. Environment Variables
Create a `.env.local` file in the root directory (you can copy `.env.example`).
Make sure the database URL points to the Docker container (which we map to port `5433` to avoid conflicting with any local PostgreSQL installations):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/glamworldface?schema=public"
AUTH_SECRET="your_generated_secret_key"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Database (Docker)
The project uses Docker Compose to run an isolated PostgreSQL instance.
```bash
npm run db:up
```
*(To stop the database later, run `npm run db:down`)*

### 4. Sync Database Schema & Generate Prisma Client
Push the schema to your newly created Docker database and generate the Prisma Client:
```bash
npm run db:push
```

### 5. Seed the Database
Populate the database with demo users, roles, and initial competitions:
```bash
npm run db:seed
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials

The database seeding script creates the following accounts for testing purposes:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@glamworldface.com` | `admin123!` |
| **Contestant** | `demo@glamworldface.com` | `contestant123!` |
| **Jury** | `jury@glamworldface.com` | `jury123!` |
| **Public Viewer** | `viewer@glamworldface.com` | `public123!` |

## 📊 Database Management

You can visually inspect and manage your database records using Prisma Studio.
```bash
npm run db:studio
```
This will open a web interface (usually at `localhost:5555`) to view your Users, Competitions, and Votes.

## 📁 Project Structure

```text
├── prisma/
│   ├── schema.prisma      # Database schema definitions
│   └── seed.ts            # Seeding script for initial data
├── src/
│   ├── app/               # Next.js App Router (pages, layouts, api routes)
│   │   ├── actions/       # Server Actions (auth logic, etc.)
│   │   └── api/           # API Routes (Auth.js endpoints)
│   ├── components/        # Reusable React components (Shadcn, UI elements)
│   ├── config/            # Constants and navigation configurations
│   ├── generated/         # Generated Prisma Client
│   ├── lib/               # Utility functions (prisma singleton, auth config)
│   ├── proxy.ts           # Route protection (Next.js 16 Proxy/Middleware)
│   └── types/             # TypeScript type definitions and module augmentations
└── docker-compose.yml     # PostgreSQL container configuration
```
