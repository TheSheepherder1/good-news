# The Good I Found — Project Decisions

## Project Overview
A daily curated good-news website. Stories are fetched from 39 RSS feeds across the globe, filtered by AI for positivity and politics, reviewed by the admin, and published to the public site.

---

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL with RLS enabled)
- **Storage:** Supabase Storage (`featured-images` bucket) — used for all admin-uploaded images
- **AI Filtering:** Anthropic Claude Haiku (fast, cheap, good enough for classification)
- **Translation:** Google Translate free endpoint (`translate.googleapis.com`) via server-side proxy route `/api/translate`
- **Deployment:** Vercel (auto-deploys on push to GitHub)
- **RSS Parsing:** rss-parser
- **Fonts:** Geist Sans (body), Merriweather Bold (site title)
- **Favicon:** 😊 emoji SVG

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

Curated good-news feeds are flagged as `curated=true` so the AI applies a slightly lower bar.

### Feed prioritization (tuning knobs in `src/lib/ingest.ts`)
- **Curated feeds:** 15 items each
- **General feeds:** 8 items each
- **Minimum AI score to reach queue:** 6/10 (stories below this are auto-rejected)
- **Pending queue order:** AI score descending — best stories appear first for review

### Public page card ordering
Within each category section, cards are sorted by `ai_score` descending — highest rated stories appear top-left, filling left to right across rows.

### Publish modes
When clicking "Publish Stories" the admin chooses:
- **Replace** — deletes all current `published` stories, replaces with today's `approved`
- **Add** — keeps existing `published` stories, adds today's `approved` alongside

### Featured story (Today's Bright Spot)
One story can be marked as Featured. It appears as a hero card above all category sections with the image in the left 1/3 column and content in the right 2/3 on desktop; image at top on mobile. Only one story can be featured at a time (enforced by a unique partial index in Postgres). Setting a new featured story when one already exists prompts a confirmation showing the current featured story's title. Can be changed from both the Approved and Published admin tabs.

### Image uploads
Admin can upload images (including WebP) to any story card from any tab (Pending, Approved, Skipped, Published). Images are stored in Supabase Storage (`featured-images` bucket) and saved to `story.image_url`. Upload button shows "Uploading…" while in progress and "✓ Image added!" on success. Auth is passed as a URL query parameter for FormData requests (header approach caused issues on Vercel).

### Admin tabs
Four tabs: **Pending | Approved | Skipped | Published**
- **Pending:** approve/skip, section override dropdown, image upload
- **Approved:** set as featured (with conflict confirmation), image upload
- **Skipped:** rescue back to approved
- **Published:** mirrors public page order exactly; allows section change, image add/replace/remove, unpublish (→ Skipped), featured change

### Section override
Admin can change the AI-assigned category on Pending or Published tabs. Dropdown of static section list; "(AI suggested)" label stays permanently on the original AI value regardless of what admin selects.

### Admin sections list (alphabetical)
Art, Culture, Environment, Good News, Health, Science, Sports

### Mobile article sheet
On mobile, tapping a story card opens a slide-up bottom sheet showing the image, full summary, and a "Read Full Article" button. Swipe down or tap X to close. Desktop behavior unchanged (opens new tab).

### Sticky header (all screen sizes)
Header sticks to top on both mobile and desktop. Scroll margin set to 224px on mobile to clear the sticky header when using section nav.

### Sections dropdown
Dynamically populated from whichever categories have published stories that day. Includes "Top of Page" as the first option always. Labels translate with selected language.

### Search
Client-side filtering of loaded stories by title, summary, and source. Desktop: always-visible search bar inline with Sections dropdown. Mobile: tap 🔍 icon to expand full-width search bar in sticky header. Font size forced to 16px on mobile input to prevent iOS Safari auto-zoom.

### Language translation
5 languages: English, Español, Français, Deutsch, Srpski. Static UI strings (title, tagline, section headers, footer, buttons) are pre-translated in `src/lib/translations.ts` — instant, no API. Story titles and summaries are translated via Google Translate free endpoint routed through `/api/translate` server route (avoids CORS/rate-limit issues on mobile). Translations cached per session — switching back to a previously viewed language is instant. Card sizes stay consistent with `line-clamp-2` on titles and `line-clamp-3` on summaries.

### Layout width
Max width `max-w-7xl` (1280px) on both public site and admin. 3-column card grid on desktop.

### Footer
Copyright line plus three modal links: **About**, **AI Policy**, **Advertising Policy** — all placeholder content pending copy from owner.

---

## RSS Feeds (39 total)

### Curated Good News (7)
| Source | Region |
|---|---|
| Good News Network | US |
| Positive News | UK |
| Reasons to be Cheerful | US |
| Good Good Good | US |
| The Brighter Side | US |
| Optimist Daily | US |
| Upworthy | US |

### Science (11)
| Source | Region |
|---|---|
| NASA News | US |
| Science Daily | US |
| New Scientist | UK |
| Live Science | US |
| Popular Science | US |
| Phys.org (via Google News) | Global |
| ABC Australia | Australia |
| The Guardian (Science) | UK |
| BBC Science & Environment | UK |
| The Hindu (Science) | India |
| Japan Times | Japan |

### Good News / Human Interest (8)
| Source | Region |
|---|---|
| Yes! Magazine | US |
| Next City (via Google News) | US |
| Edutopia (via Google News) | US |
| RNZ (New Zealand) | New Zealand |
| Global Citizen | Global |
| UN News | Global |
| Al Jazeera | Qatar/Global |
| IOL South Africa | South Africa |

### Environment (3)
| Source | Region |
|---|---|
| Conservation International | US |
| Mongabay | Global |
| The Guardian (Environment) | UK |

### Culture (3)
| Source | Region |
|---|---|
| Atlas Obscura | US |
| Mental Floss | US |
| Smithsonian Magazine | US |

### Health (2)
| Source | Region |
|---|---|
| Harvard Health | US |
| NIH News in Health (via Google News) | US |

### Animals (3)
| Source | Region |
|---|---|
| The Dodo (via Google News) | US |
| World Wildlife Fund | Global |
| Audubon Society | US |

### Technology (1)
| Source | Region |
|---|---|
| MIT Technology Review | US |

### Middle East (1)
| Source | Region |
|---|---|
| Arab News | Saudi Arabia |

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

RLS enabled. One policy: public can SELECT where status = `published`. All writes use service role key (bypasses RLS).

---

## Legal
- Displaying RSS-provided headlines and summary snippets only — not full article text
- All stories link back to original source
- Footer: "All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content."
- Images pulled from RSS enclosures — potential risk if monetizing; revisit if ads/subscriptions added
- About, AI Policy, and Advertising Policy modals — content pending from owner

---

## Deployment
- **Repo:** https://github.com/TheSheepherder1/good-news
- **Live site:** https://thegoodifound.com
- **Admin:** https://thegoodifound.com/admin
- **Vercel URL:** https://good-news-ten-teal.vercel.app
- **Domain registrar:** GoDaddy — DNS pointed to Vercel (A record + CNAME)
- Auto-deploys on push to `main`

---

## To Do
1. **Custom story creator** — admin form to manually add any article as a card: choose section, name the source, give it a linked title (URL), write a text description, optionally add a photo. Card matches the exact style of all other cards. Goes directly to Approved queue, bypassing fetch/AI filter.
2. **Daily automation** — schedule the fetch to run each morning automatically via Vercel cron
3. **Footer modal content** — add real text for About, AI Policy, and Advertising Policy when ready
