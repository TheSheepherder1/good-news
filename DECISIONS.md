# The Good I Found — Project Decisions

## Project Overview
A daily curated good-news website. Stories are fetched from 35 RSS feeds across the globe, filtered by AI for positivity and politics, reviewed by the admin, and published to the public site.

---

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL with RLS enabled)
- **Storage:** Supabase Storage (`featured-images` bucket) — used for all admin-uploaded images
- **AI Filtering:** Anthropic Claude Haiku (fast, cheap, good enough for classification)
- **Translation:** Google Translate free endpoint (`translate.googleapis.com`) via server-side proxy route `/api/translate`
- **Analytics:** Vercel Analytics
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
- `approved` — admin approved, not yet published; custom stories survive fetch clears
- `skipped` — admin passed on (can be rescued)
- `published` — live on public site
- `rejected` — AI filtered out (kept for deduplication, never shown)

### Session clearing on fetch
Each new fetch clears `pending`, `skipped`, and non-custom `approved` stories. Custom stories in `approved` survive fetches. `published` and `rejected` are never deleted by fetch.

### Deduplication — two layers
1. **URL exact match** — same URL never inserted twice
2. **Title similarity** — normalized title word overlap ≥60% treated as duplicate; curated sources win ties; checked against last 14 days of DB stories

### AI filtering (Claude Haiku)
Stories are classified in batches of 20. Each story gets:
- `approved` (true/false) — whether it passes the positivity + no-politics test
- `ai_score` (1–10) — positivity score
- `ai_reason` — one-line explanation

Curated good-news feeds are flagged as `curated=true`.

### Feed prioritization (tuning knobs in `src/lib/ingest.ts`)
- **Curated feeds:** 15 items each
- **General feeds:** 8 items each
- **Minimum AI score to reach queue:** 5/10
- **Pending queue order:** AI score descending — best stories appear first for review

### Public page card ordering
Within each category section, cards are sorted by `ai_score` descending — highest rated stories appear top-left, filling left to right across rows.

### Section order (public page)
Humanity → Culture → Art → Health → Animals → Science → Good News → Environment → Technology → Space → Sports

### Publish modes
When clicking "Publish Stories" the admin chooses:
- **Replace** — deletes all current `published` stories, replaces with today's `approved`
- **Add** — keeps existing `published` stories, adds today's `approved` alongside

### Refresh Site button
Admin header has a **Refresh Site** button that calls `/api/revalidate` to immediately clear the Next.js page cache, making published changes visible without waiting for the 2-minute revalidation window.

### Featured story (Today's Bright Spot)
One story can be marked as Featured. It appears inside a frosted panel with a thick gold border (`#F0B429`) above all category sections. Image in left 1/3 column, content in right 2/3 on desktop; image at top on mobile. Can be changed from Approved and Published tabs. Subtitle: "Today's Bright Spot" in bright gold, with "Good things are happening every day." below in emerald green (removed — was crowding).

### Custom story creator
Admin can create their own stories via the **Create Story** button in the admin header. Two types:
1. **Hosted** — story text lives at `thegoodifound.com/story/[id]`. Has a separate "Story Description" (card summary) and "Full Story" (story page content) field.
2. **External URL** — links to an external article. Has a "Story Description" for the card and an external URL for the title link.
Custom stories go directly to Approved, bypass AI filter, survive fetch clears, and show a purple **Custom** badge in admin.

### Image uploads
Admin can upload images (including WebP) to any story card from any tab. Images stored in Supabase Storage (`featured-images` bucket). Upload button shows "Uploading…" then "✓ Image added!" on success. Auth passed as URL query param (header approach caused issues on Vercel).

### Admin tabs
Four tabs: **Pending | Approved | Skipped | Published**
- **Pending:** approve/skip, section override dropdown (with AI suggested label), image upload
- **Approved:** set as featured (conflict confirmation), image upload, custom story badge
- **Skipped:** rescue back to approved
- **Published:** mirrors public page order; section change, image add/replace/remove, unpublish (→ Skipped), featured change

### Admin header buttons
**Edit Content** | **Refresh Site** | **Create Story** | **Publish Stories** | **Fetch New Stories**

### Admin sections list (alphabetical)
Animals, Art, Culture, Environment, Good News, Health, Humanity, Science, Space, Sports

### Site content editor
Admin can edit the title and body text of the **About**, **AI Policy**, and **Advertising Policy** modals via **Edit Content** in the admin header. Content stored in `site_settings` Supabase table. Toolbar supports **Bold** (`**text**`), *Italic* (`*text*`), and bullet points (`- item`). Paragraphs separated by blank lines. Changes go live after clicking **Refresh Site**.

### Mobile article sheet
On mobile, tapping a story card opens a slide-up bottom sheet showing the image, full summary, and a "Read Full Article" button (new tab). Swipe down or tap X to close. Desktop also opens in new tab.

### Sticky header (all screen sizes)
Header sticks to top on both mobile and desktop. Section nav uses dynamic scroll offset — measures actual header height at click time to handle varying heights across languages.

### Sections dropdown
Dynamically populated from whichever categories have published stories that day. Includes "Top of Page" as the first option always. Labels translate with selected language.

### Search
Client-side filtering by title, summary, and source. Desktop: always-visible search bar inline with Sections/Language row. Mobile: tap 🔍 to expand full-width search bar. Font size 16px on mobile input prevents iOS Safari auto-zoom.

### Language translation
5 languages: English, Español, Français, Deutsch, Srpski. Static UI strings pre-translated in `src/lib/translations.ts`. Story content translated via Google Translate through `/api/translate` server route. About modal content also translates dynamically. Cached per session. Card sizes consistent with `line-clamp-2` titles and `line-clamp-3` summaries.

### Visual design
- **Background:** linear gradient top-to-bottom `#c8e6dd` → `#f8fbfa`
- **Section panels:** `bg-white/50 backdrop-blur-sm rounded-3xl` frosted glass containers
- **Section headers:** `text-emerald-800`, 18px, uppercase, tracking-widest
- **Today's Bright Spot:** bright gold `#F0B429`, 1.35rem, uppercase; featured card has 4px gold border
- **Layout:** max-width 1280px (`max-w-7xl`), 3-column card grid on desktop

### Layout width
Max width `max-w-7xl` (1280px) on both public site and admin. 3-column card grid on desktop.

### Footer
Three modal links: **About**, **AI Policy**, **Advertising Policy**. Content editable from admin. About modal content translates to selected language.

### SEO
- Rich metadata with 15 keywords in `layout.tsx`
- Open Graph + Twitter Card tags
- JSON-LD structured data (WebSite schema)
- Sitemap at `/sitemap.xml`
- robots.txt (blocks `/admin`)
- OG image generated via `opengraph-image.tsx` (basic — redesign is a to-do)

---

## RSS Feeds (35 total)

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

### Science (9)
| Source | Region |
|---|---|
| NASA News | US |
| Science Daily | US |
| Live Science | US |
| Popular Science | US |
| Phys.org (via Google News) | Global |
| ABC Australia | Australia |
| BBC Science & Environment | UK |
| The Hindu (Science) | India |
| Japan Times | Japan |

### Good News / Human Interest (7)
| Source | Region |
|---|---|
| Yes! Magazine | US |
| Next City (via Google News) | US |
| RNZ (New Zealand) | New Zealand |
| Global Citizen | Global |
| UN News | Global |
| Al Jazeera | Qatar/Global |
| IOL South Africa | South Africa |

### Environment (2)
| Source | Region |
|---|---|
| Conservation International | US |
| Mongabay | Global |

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
  summary text,              -- card description
  content text,              -- full story text (custom hosted stories only)
  url text not null unique,
  source text not null,
  published_at timestamptz,  -- RSS article date
  fetched_at timestamptz,    -- when we pulled it
  approved_at timestamptz,   -- when admin approved
  status text,               -- pending/approved/skipped/published/rejected
  ai_score integer,          -- 1-10
  ai_reason text,
  image_url text,
  category text,
  is_featured boolean default false,
  is_custom boolean default false
)

site_settings (
  key text primary key,      -- about_title, about_text, ai_policy_title, etc.
  value text not null
)
```

RLS enabled on both tables. `stories`: public SELECT where status = `published`. `site_settings`: public SELECT all. All writes use service role key (bypasses RLS).

---

## Legal
- Displaying RSS-provided headlines and summary snippets only — not full article text
- All stories link back to original source
- Footer: "All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content."
- About modal content written and live
- AI Policy and Advertising Policy — content pending from owner

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
1. **Daily automation** — schedule the fetch to run each morning automatically via Vercel cron
2. **OG image redesign** — make the social share preview image look great (currently functional but basic)
3. **Desktop article panel** — show a slide-up panel on desktop (like mobile sheet) with image, summary, and "Read Full Article" button. Keeps users on site longer.
4. **AI Policy content** — write and add via Edit Content in admin
5. **Advertising Policy content** — write and add via Edit Content in admin
