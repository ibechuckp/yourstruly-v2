# YoursTruly XP & Gamification System

## Overview
Duolingo-inspired gamification to encourage daily engagement and social accountability.

---

## Core Concepts

### 1. XP (Experience Points)
- Earned through platform activities
- Can be spent on PostScript messages
- Visible on profile and leaderboards

### 2. Streaks
- Consecutive days of meaningful activity
- Streak freezes available (cost XP)
- Streak milestones unlock rewards

### 3. Leagues/Groups (Fitbit-style)
- Compete with friends/family on weekly XP
- Leagues reset weekly
- Top performers get bonus XP

---

## XP Earning Actions

| Action | XP | Frequency |
|--------|-----|-----------|
| **Daily Actions** | | |
| Daily login | 10 | Once/day |
| Maintain streak | +5 bonus | Per day |
| | | |
| **Content Creation** | | |
| Add memory | 25 | Each |
| Add memory with photo | +10 bonus | Each |
| Add memory with voice | +15 bonus | Each |
| Add contact | 15 | Each |
| Write PostScript | 20 | Each |
| | | |
| **Profile Completion** | | |
| Fill interests | 100 | One-time |
| Fill skills | 100 | One-time |
| Fill personality | 100 | One-time |
| Add bio | 50 | One-time |
| Add credo | 50 | One-time |
| Add life goals | 100 | One-time |
| Upload avatar | 50 | One-time |
| | | |
| **Social/Engagement** | | |
| Invite friend (who joins) | 200 | Each |
| Answer interview question | 30 | Each |
| Chat with AI | 5 | Max 10/day |
| | | |
| **Streak Milestones** | | |
| 7-day streak | 50 bonus | One-time |
| 30-day streak | 200 bonus | One-time |
| 100-day streak | 500 bonus | One-time |
| 365-day streak | 2000 bonus | One-time |

---

## XP Spending

| Item | Cost |
|------|------|
| Extra PostScript | 500 XP |
| Streak Freeze (1 day) | 200 XP |
| Premium theme unlock | 300 XP |

---

## PostScript Economy

### Free Users
- **3 PostScripts total** on registration
- Can earn more via XP (500 XP each)
- No monthly refresh

### Paid Users ($X/month)
- **3 PostScripts per month** (refresh on billing date)
- Can still earn more via XP
- Unused don't roll over

---

## Leagues (Weekly Competition)

### Structure
- Users grouped into leagues of ~20 people
- Can create private groups with friends/family
- Weekly leaderboard resets Sunday midnight

### Rewards
- 🥇 1st place: 100 XP bonus
- 🥈 2nd place: 50 XP bonus  
- 🥉 3rd place: 25 XP bonus
- Top 5: Special badge for the week

### Social Features
- See friends' streaks
- Send "nudges" to friends who might break streak
- Celebrate milestones (toast notifications)

---

## Streak Rules

### What counts as activity?
Any ONE of:
- Add a memory
- Add/edit a contact
- Write a PostScript
- Answer an interview question
- Add to profile

### Streak Freeze
- Protects streak for 1 day of inactivity
- Costs 200 XP
- Max 2 active at a time
- Auto-applied if you have one and miss a day

---

## UI Components Needed

1. **XP Counter** (in TopNav) - Shows current XP with animation on earn
2. **Streak Widget** (dashboard) - Fire icon with streak count
3. **Daily Goals Card** - Progress toward daily XP target
4. **Leaderboard Page** - Weekly rankings
5. **XP History** - Transaction log
6. **PostScript Balance** - Shows available PostScripts + option to buy more

---

## Database Schema

See: `supabase/migrations/014_xp_system.sql`
