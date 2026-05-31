# The Good I Found — Project Decisions

## Project Overview
A daily curated good-news website. Stories are fetched from RSS feeds, filtered by AI for positivity and politics, reviewed by the admin, and published to the public site.

---

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL with RLS enabled)
- **AI Filtering:** Anthropic Claude Haiku (fast, cheap, good enough for classification)
- **Deployment:** Vercel (auto-deploys on push to GitHub)
- **RSS Parsing:** rss-parser

---

## Architecture Decisions

### Human-in-the-loop publishing
Stories are never published automatically. The flow is:
1. Fetch → stories land in `pending`
2. Admin reviews → `approved` or `skipped`
3. Admin clicks Publish → choose replace or add to public page → `published`

### Story statuses
- `pending` — fetched, awaiting admin review
- `approved` — admin approved, not yet published
- `skipped` — admin passed on (can be rescued)
- `published` — live on public site
- `rejected` — AI filtered out (kept for deduplication, never shown)

### Session clearing on fetch
Each new fetch clears `pending`, `approved`, and `skipped` from the previous session. `published` and `rejected` stories are never deleted by the fetch. Admin should publish before fetching again or approved stories will be lost.

### Deduplication — two layers
1. **URL exact match** — same URL never inserted twice
2. **Title similarity** — normalized title word overlap ≥60% treated as duplicate; curated sources win ties; checked against last 14 days of DB stories

### AI filtering (Claude Haiku)
Stories are classified in batches of 20. Each story gets:
- `approved` (true/false) — whether it passes the positivity + no-politics test
- `ai_score` (1–10) — positivity score
- `ai_reason` — one-line explanation

Curated good-news feeds (Good News Network, Positive News, etc.) are flagged as `curated=true` so the AI applies a slightly lower bar.

### Public page card ordering
Within each category section, cards are sorted by `ai_score` descending — highest rated stories appear top-left, filling left to right across rows.

### Publish modes
When clicking "Publish Stories" the admin chooses:
- **Replace** — deletes all current `published` stories, replaces with today's `approved`
- **Add** — keeps existing `published` stories, adds today's `approved` alongside

### Featured story
One story can be marked as Featured. It appears as a full-width hero card above all category sections. Only one story can be featured at a time (enforced by a unique partial index in Postgres). Setting a new featured story when one already exists prompts a confirmation showing the current featured story's title.

### Mobile article sheet
On mobile, tapping a story card opens a slide-up bottom sheet showing the image, full summary, and a "Read Full Article" button. Swipe down or tap X to close. Desktop behavior unchanged (opens new tab). A small number of news outlets force a new tab regardless due to their own redirect behavior — accepted limitation.

### Sticky header (mobile only)
On mobile, the site header (title, tagline, date, Sections dropdown) sticks to the top of the screen while scrolling. On desktop it scrolls with the page.

### Sections dropdown
Dynamically populated from whichever categories have published stories that day — no hardcoded list. Includes "Top of Page" as the first option always. On mobile only (hidden on desktop via Tailwind).

---

## RSS Feeds (17 total)

| Source | Category | Curated |
|---|---|---|
| Good News Network | Good News | Yes |
| Positive News | Good News | Yes |
| Reasons to be Cheerful | Good News | Yes |
| Good Good Good | Good News | Yes |
| The Brighter Side | Good News | Yes |
| Optimist Daily | Good News | Yes |
| Upworthy | Good News | Yes |
| NASA News | Science | No |
| Science Daily | Science | No |
| New Scientist | Science | No |
| Harvard Health | Health | No |
| Conservation International | Environment | No |
| Mongabay | Environment | No |
| Atlas Obscura | Culture | No |
| Mental Floss | Culture | No |
| Smithsonian Magazine | Culture | No |
| MIT Technology Review | Technology | No |

---

## Database Schema

```sql
stories (
  id uuid primary key,
  title text not null,
  summary text,
  url text not null unique,
  source text not null,
  published_at timestamptz,       -- RSS article date
  fetched_at timestamptz,         -- when we pulled it
  approved_at timestamptz,        -- when admin approved
  status text,                    -- pending/approved/skipped/published/rejected
  ai_score integer,               -- 1-10
  ai_reason text,
  image_url text,
  category text,
  is_featured boolean default false
)
```

RLS enabled. One policy: public can SELECT where status = 'approved'. All writes use service role key (bypasses RLS).

---

## Legal
- Displaying RSS-provided headlines and summary snippets only — not full article text
- All stories link back to original source
- Footer: "All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content."
- Images pulled from RSS enclosures — potential risk if monetizing; revisit if ads/subscriptions added

---

## Deployment
- **Repo:** https://github.com/TheSheepherder1/good-news
- **Live site:** https://good-news-ten-teal.vercel.app
- **Admin:** https://good-news-ten-teal.vercel.app/admin
- **Target domain:** thegoodifound.com (to be connected)
- Auto-deploys on push to `main`

---

## To Do
1. **Connect custom domain** — buy `thegoodifound.com`, add to Vercel project settings, point DNS records
2. **Custom story creator** — admin form to write your own story card: section/category, source name, article title, optional photo, article text
3. **Daily automation** — schedule the fetch to run each morning automatically via Vercel cron
4. **Section override on pending** — in the pending review queue, allow admin to change the AI-assigned category before approving; dropdown of static section list, defaults to AI-recommended value
