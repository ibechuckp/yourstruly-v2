# YoursTruly V2

> **A life platform for documenting the past, planning the future, and staying connected across generations.**

## 🎯 Core Features

| Feature | Description |
|---------|-------------|
| 📹 **Async Video Journalist** | Send questions to family, capture video responses remotely |
| 🤖 **AI Avatar** | Create a digital version of yourself for loved ones |
| 🗂️ **Smart Life Documentation** | Timeline, albums, memories with AI organization |
| 💌 **PostScripts + Gifts** | Schedule messages and gifts for the future |
| 👥 **Collaboration** | Shared memories, group celebrations |
| ✈️ **Trip Planning** | Bucket list adventures with AI deal finder + crowdfunding |

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: OpenAI GPT-4 + Whisper
- **Video**: Twilio (SMS + Video)
- **Maps**: Mapbox
- **Payments**: Stripe

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# In Supabase SQL editor, run: supabase/migrations/001_initial_schema.sql

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/      # Protected dashboard pages
│   │   └── dashboard/
│   │       ├── profile/
│   │       ├── contacts/
│   │       └── pets/
│   └── page.tsx          # Landing page
├── components/           # Reusable components
├── lib/
│   └── supabase/         # Supabase client utilities
└── middleware.ts         # Auth middleware
```

## 📊 Development Phases

See [ROADMAP.md](./ROADMAP.md) for detailed phases with testable milestones.

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (Auth, Profiles, Contacts, Pets) | ✅ In Progress |
| 2 | Memories & Timeline | ⏳ Upcoming |
| 3 | Async Video Journalist | ⏳ Upcoming |
| 4 | AI Avatar | ⏳ Upcoming |
| 5 | PostScripts + Gifts | ⏳ Upcoming |
| 6 | Collaboration | ⏳ Upcoming |
| 7 | Smart AI Features | ⏳ Upcoming |
| 8 | Trip Planning + Crowdfunding | ⏳ Upcoming |
| 9 | Polish & Launch | ⏳ Upcoming |

## 📄 License

Private - All Rights Reserved

---

*Built with ❤️ for families everywhere*
