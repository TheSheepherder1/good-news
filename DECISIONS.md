# The Good I Found — Project Decisions

## Project Overview
A daily curated good-news website, live at **www.thegoodifound.com**. Stories are fetched from 35 RSS feeds across the globe, filtered by AI for positivity and politics, reviewed by the admin, and published to the public site. Human-in-the-loop: nothing publishes automatically. Supports 5 languages, search, mobile slide-up reader, custom hand-written stories, and admin-editable footer content.

**To resume work in a fresh conversation:** read this whole file, then continue. It is the source of truth for the project's state and decisions.

---

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (PostgreSQL with RLS enabled)
- **Storage:** Supabase Storage (`featured-images` bucket) — used for all admin-uploaded images
- **AI Filtering:** Anthropic Claude Haiku (fast, cheap, good enough for classification)
- **Translation:** Google Translate free endpoint (`translate.googleapis.com`) via server-side proxy route `/api/translate`. Note: this is an unofficial endpoint with no SLA. When traffic grows, migrate to the official Google Cloud Translation API ($20/1M characters, first 500K/month free). Migration is a simple endpoint + API key swap in `/api/translate`.
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
- `pending` — fetched, awaiting admin review; persists across fetches (new stories added to queue)
- `approved` — admin approved, not yet published; custom stories survive fetch clears
- `skipped` — admin passed on (can be rescued); **never deleted** — kept permanently for dedup
- `published` — live on public site
- `archived` — formerly published, rotated out via Replace-publish; **never deleted** — kept for dedup
- `rejected` — AI filtered out (kept for deduplication, never shown)

### Session clearing on fetch
Each new fetch clears ONLY non-custom `approved` stories from the previous session. Everything else persists: `pending` (new stories added to existing queue), `skipped`, `published`, `archived`, `rejected`, and custom `approved`. This keeps the dedup memory permanent.

### Deduplication — two layers
1. **URL exact match** — checks the ENTIRE stories table (all statuses) so any previously-seen article URL is permanently blocked. Insert uses `upsert` with `ignoreDuplicates: true` (onConflict: url) so dup URLs are silently skipped, never error.
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
Within each category section, cards are sorted by `site_published_at` descending — most recently published stories appear top-left. Falls back to `approved_at` for older stories that pre-date that column.

### Section order (public page)
Default: **New!** → Humanity → Culture → History → Art → Health → Animals → Science → Good News → Environment → Space → Technology → Sports

**"New!" section** — a virtual pinned section always shown first (after Today's Bright Spot) containing all stories from the most recent "Publish Stories" batch. Stories within it are ordered by their section's position in the default section order. When the next batch is published the previous batch's stories leave "New!" automatically (they remain in their own sections). "New!" is hidden during search to avoid duplicate results since those stories also appear under their own sections.

**Reader section reordering** — readers can reorder sections using ↑ ↓ arrows inside the Sections dropdown. "New!" is always pinned first (shown with a lock icon, no arrows). The reader's order is saved to `localStorage` under `section_order` and restored on every visit. If new sections are added to the site later they append to the end of the reader's saved order automatically.

### Publish modes
When clicking "Publish Stories" the admin chooses:
- **Replace** — moves all current `published` stories to `archived` (kept for dedup, not deleted), then publishes today's `approved`
- **Add** — keeps existing `published` stories, adds today's `approved` alongside

### Refresh Site button
Admin header has a **Refresh Site** button that calls `/api/revalidate` to immediately clear the Next.js page cache, making published changes visible without waiting for the 2-minute revalidation window.

### Featured story (Today's Bright Spot)
One story can be marked as Featured. It appears inside a frosted panel with a thick gold border (`#F0B429`) above all category sections. Image in left 1/3 column, content in right 2/3 on desktop; image at top on mobile. Can be changed from Approved and Published tabs. Header label "Today's Bright Spot" in bright gold (`#F0B429`), 1.35rem, uppercase.

### Custom story creator
Admin can create their own stories via the **Create Story** button in the admin header. Two types:
1. **Hosted** — story text lives at `thegoodifound.com/story/[id]`. Has a separate "Story Description" (card summary) and "Full Story" (story page content) field.
2. **External URL** — links to an external article. Has a "Story Description" for the card and an external URL for the title link.
Custom stories go directly to Approved, bypass AI filter, survive fetch clears, and show a purple **Custom** badge in admin.

### Image uploads
Admin can upload images (including WebP) to any story card from any tab. Images stored in Supabase Storage (`featured-images` bucket). Upload button shows "Uploading…" then "✓ Image added!" on success. Auth passed as URL query param (header approach caused issues on Vercel).

### Reader Submissions
Public page has a "Share a Story" footer link (`/contribute`, translates into the reader's chosen language — see "Language translation" below) with two modes:
1. **Write an Article** — title, card summary, full story, optional 1 image, name, optional email, and a required submission agreement checkbox (see "Submission agreement" below).
2. **Recommend a Story** — name, URL, optional "why does this belong here?" note, optional email.

Both submit (multipart, with a hidden honeypot field) to `/api/submit` (unauthenticated) and land as `new` rows in the `reader_submissions` table, reviewed in the admin **Public Created** tab.

**Approval flow** (admin picks a Section, then clicks Approve):
- **Article** → admin review only, no automated fact-check. Inserted directly into `stories` as a Custom Hosted story (`is_custom: true`, `status: 'approved'`, `source` = the reader's name, `ai_score: 10`) — follows the same path as admin-created custom stories.
- **URL recommendation** → server fetches the page (`src/lib/extractMetadata.ts`) to pull `title`/`description`/`og:site_name`, runs it through the existing Claude classification (`classifyStories` in `src/lib/ingest.ts`, now exported), and inserts into `stories` as `status: 'pending'` with the AI score/reason — reviewed like any fetched story in the normal Pending queue.

**Dismiss** marks the submission `dismissed` with no further action.

On a successful submission (either mode), a thank-you modal appears with a personal note from Mike (24-hour review promise) and an "OK" button. Clicking OK navigates the reader back to the home page (`/`). Text lives in `CONTRIBUTE_EN` (`thankYouMessage`, `thankYouOk`) and translates via `useContributeStrings`.

### Submission agreement (Write an Article)
Replaces the old single-line accuracy attestation. Shows a thank-you message, then a bulleted list of terms the submitter agrees to (original work, no plagiarism/copyright issues, no others' personal info without permission, written by a human not AI, true story, no compensation — credited by submitted name, The Good I Found will not edit/spell-check the text, and The Good I Found may decline to publish or remove the story at its sole editorial discretion). A single checkbox ("I have read and agree to all of the above") confirms agreement. All text lives in `CONTRIBUTE_EN` (`src/lib/contributeStrings.ts`, keys prefixed `attestation*`) and translates via `useContributeStrings`.

On successful submission, `/api/submit` writes a row to `submission_attestations` (`submission_id`, `submitted_at`, `submitter_name`, `submitter_email`) as a permanent record of agreement — independent of what later happens to the `reader_submissions`/`stories` rows. `submission_id` is the `reader_submissions.id` for that submission (no foreign key, kept independent), letting an attestation be looked up by its submission's UUID, including the title via the linked submission. `/api/cleanup` purges these rows after 7 years.

The Submit button stays disabled until the checkbox is checked.

### Rich text formatting (Write an Article)
The Short Summary and Full Story fields on `/contribute` use a Tiptap-based `RichTextEditor` (`src/components/RichTextEditor.tsx`) with a Bold/Italic/Underline/Bullet-list toolbar; Full Story also gets a Font Size selector (Small 14px / Normal 16px / Large 20px / Heading 28px).

- **Short Summary** is serialized to an extended markdown subset (`**bold**`, `*italic*`, `__underline__`, `- bullet`) — kept as plain-ish text so it still works with the Google Translate text endpoint and client-side search. Rendered via `renderSummaryMarkdown` (`src/lib/summaryMarkdown.tsx`) in `StoryCard`, `ArticleSheet`, and the `PublicFeed` featured-story block.
- **Full Story** is sanitized to HTML (`sanitizeStoryHtml`, `src/lib/sanitizeHtml.ts` — allows `p`/`br`/`strong`/`em`/`u`/`ul`/`li`/`span` and a `style="font-size: …"` allowlist) and rendered via `dangerouslySetInnerHTML` only on `/story/[id]`.
- Articles approved through this flow are inserted into `stories` with `content_format: 'rich'`. All other stories (`'text'`, the default) keep the original plain-text rendering — no behavior change for RSS/admin-created/older stories.
- `SubmissionCard` (admin Public Created review) always renders article submissions with `renderSummaryMarkdown`/`sanitizeStoryHtml`, since all new article submissions use these formats regardless of the `content_format` flag (which only exists on `stories`).

### Admin tabs
Five tabs: **Pending | Approved | Skipped | Published | Public Created**
- **Pending:** approve/skip, section override dropdown (with AI suggested label), image upload
- **Approved:** set as featured (conflict confirmation), image upload, custom story badge, section override dropdown
- **Skipped:** rescue back to approved, section override dropdown
- **Published:** mirrors public page order; section change, image add/replace/remove, unpublish (→ Skipped), featured change; search + Section/Date Published filters; **Unpublish All** button (with confirmation) bulk-unpublishes every story matching the active filters
- **Public Created:** review queue for reader submissions (see **Reader Submissions** below). Tab shows an unread-count badge. Each card has a Section dropdown (required) plus **Approve** / **Dismiss**.

### Admin header buttons
**Edit Content** | **Refresh Site** | **Create Story** | **Publish Stories** | **Fetch New Stories**

### Admin sections list (alphabetical)
Animals, Art, Culture, Environment, Good News, Health, History, Humanity, Science, Space, Sports, Technology

### Site content editor
Admin can edit the title and body text of the **About**, **AI Policy**, and **Advertising Policy** modals via **Edit Content** in the admin header. Content stored in `site_settings` Supabase table. Toolbar supports **Bold** (`**text**`), *Italic* (`*text*`), and bullet points (`- item`). Paragraphs separated by blank lines. Changes go live after clicking **Refresh Site**.

### Mobile article sheet
On mobile, tapping a story card opens a slide-up bottom sheet showing the image, full summary (translated to selected language), and a "Read Full Article" button (new tab). Swipe down or tap X to close. Desktop also opens in new tab.

### Sticky header (all screen sizes)
Header sticks to top on both mobile and desktop. Section nav uses dynamic scroll offset — measures actual header height at click time to handle varying heights across languages.

### Collapsing mobile header
On mobile only, scrolling DOWN collapses the title/tagline/date away (smooth transition), leaving just the controls strip (Sections, Language, Search). Scrolling UP expands it back. Requires 12px consistent scroll before toggling and locks during the 350ms transition to prevent Android scroll-shake. Desktop header never collapses.

### Header date
Shows the VIEWER's local date (their timezone), computed client-side via `toLocaleDateString` in a `useEffect`. Not the server/UTC date.

### Sections dropdown
Dynamically populated from whichever categories have published stories. Includes "Top of Page" and "Today's Bright Spot" as fixed nav items at the top, followed by the section list. Each section row has ↑ ↓ reorder arrows on the right (see **Reader section reordering** above). Labels translate with selected language.

### Search
Client-side filtering by title, summary, and source. Desktop: always-visible search bar inline with Sections/Language row. Mobile: tap 🔍 to expand full-width search bar. Font size 16px on mobile input prevents iOS Safari auto-zoom.

### Language translation
10 languages: English, 中文, Deutsch, Nederlands, Español, Français, 日本語, Polski, Português, Srpski (`src/lib/translations.ts`). Static site-chrome UI strings are pre-translated by hand in the `UI` table. Story content/summaries and the About/Policy modal content translate dynamically via Google Translate through `/api/translate`, cached per session. Card sizes consistent with `line-clamp-2` titles and `line-clamp-3` summaries.

The reader's chosen language is saved to `localStorage` (`LANG_STORAGE_KEY = 'tgif_lang'`) and restored on load, so the choice carries from the home page to `/contribute`.

### `/contribute` page translation
The "Share a Story" form's UI chrome (labels, descriptions, buttons, validation/result messages, and the `RichTextEditor` toolbar — see "Rich text formatting" above) translates into the reader's chosen language. These ~50 strings are too numerous to hand-translate for 10 languages like the `UI` table, so instead:

- `src/lib/contributeStrings.ts` defines `CONTRIBUTE_EN` (the English source strings) and `translateServerMessage()`, which reverse-looks-up an English error string returned by `/api/submit` and returns its translated equivalent.
- `src/lib/useContributeStrings.ts`'s `useContributeStrings(lang)` hook batch-translates `CONTRIBUTE_EN` via one `/api/translate` call, caching the result per language at module scope (English is instant — no API call, `cache.en = CONTRIBUTE_EN`).
- `CONTRIBUTE_OVERRIDES` (also in `contributeStrings.ts`) hand-corrects short, context-free UI words — Bold/Italic/Underline/Bullet list, the 4 font-size labels, and Submit/Submitting/Translating — that the free Google Translate endpoint mistranslates for several languages (e.g. "Bold" → "daring" in fr/de/zh/ja/pt/es). These overrides win over the machine translation.
- `/contribute` has its own `LanguagePicker` reading/writing the same `LANG_STORAGE_KEY`, so the language choice stays in sync with the home page in both directions. User-entered content (title/summary/full story) is never translated — only the form's UI chrome.

### Visual design
- **Background:** linear gradient top-to-bottom soft blue `#c8dde6` → near-white `#f8fbfa` (set in `page.tsx`; sticky header bg matches at `rgba(200,221,230,0.95)`)
- **Section panels:** `bg-white/50 backdrop-blur-sm rounded-3xl` frosted glass containers, `gap-16` between sections
- **Section headers:** `text-emerald-800`, 18px (`text-lg`), uppercase, tracking-widest
- **Today's Bright Spot:** bright gold `#F0B429`, 1.35rem, uppercase; featured card has 4px gold border, sits in its own frosted panel
- **Site title:** Merriweather Bold, 2.43rem mobile / 2.7rem desktop
- **Tagline:** `text-gray-600`
- **Layout:** max-width 1280px (`max-w-7xl`), 3-column card grid on desktop

### Layout width
Max width `max-w-7xl` (1280px) on both public site and admin. 3-column card grid on desktop.

### Footer
Three modal links (**About**, **AI Policy**, **Advertising Policy**) plus a **Share a Story** link to the `/contribute` page (see Reader Submissions). Modal content editable from admin; About modal content translates to selected language.

### Bookmarks (Save for Later)
Readers can bookmark any story with a bookmark icon — bottom-right of every story card (alongside the like button) and inline on the Bright Spot card. No login required.

**Storage:** A full snapshot is written to `localStorage` under `tgif_bookmarks` (JSON array). Each snapshot includes: `id`, `title`, `summary`, `source`, `url`, `image_url`, `category`, `site_published_at`. Because the full content is saved locally, bookmarks remain accessible even if the story is later removed or unpublished from the site — the original source URL still works.

**UI:**
- Outline gray bookmark icon when not saved; filled green when saved.
- Tapping toggles save/remove with instant visual feedback.
- Cross-card sync via `tgif:bookmark-change` custom event — liking in "New!" instantly reflects in the section card and vice versa.
- Header bookmark button shows a green badge with the count of saved stories (hidden when zero).
- Clicking the header button opens the **Saved Stories panel** — mobile bottom sheet / desktop centered modal. Each item shows a thumbnail, title (links to original article in a new tab), source, category, and summary snippet, with an X to remove. Empty state shows a friendly prompt.

**Components:** `src/components/BookmarkButton.tsx`, `src/components/BookmarksPanel.tsx`, `src/lib/bookmarks.ts` (shared type + localStorage utilities).

### Social sharing
Each story's slide-in panel (`ArticleSheet`) has a share icon button inline on the category/source line, to the right of the source name. Behavior:
- **Web Share API (primary):** on iOS, Android, macOS Safari/Chrome, and Windows Chrome the button opens the device's native share sheet — readers see all their installed apps and pick one. No platform icons to design or maintain.
- **Fallback dropdown:** on browsers without `navigator.share` (Firefox desktop, etc.) clicking the button opens a small dropdown with five options: X / Twitter, Facebook, WhatsApp, LinkedIn, Email. Each opens the platform's share page in a new tab with text pre-filled.
- **Share content:** the original article URL is what gets shared. Pre-filled text reads `"[Article Title] — via The Good I Found https://thegoodifound.com"` — credits the site without replacing the article link.
- **Component:** `src/components/ShareButton.tsx`. Accepts `title` and `url` props. Uses `navigator.share` if available, otherwise toggles a dropdown. Click-outside closes the dropdown.

### Story Likes
Public readers can like (and unlike) any story. No login required — state is anonymous and device-local.

**How it works:**
- A `likes integer not null default 0` column on `stories` tracks the total count.
- Two Postgres functions handle atomic updates (no race conditions when two readers click simultaneously): `increment_story_likes(story_id uuid)` and `decrement_story_likes(story_id uuid)` (floors at 0).
- `/api/like` (POST) accepts `{ storyId, action: 'like' | 'unlike' }` and calls the appropriate function via the service role client.
- `LikeButton` component (`src/components/LikeButton.tsx`) — outline gray heart when not liked, filled red heart when liked. Like count shown beside the heart. Clicking toggles like/unlike with optimistic UI (instant visual response; API fires in background).

**Where it appears:**
- On every story card in section grids (bottom-right of card, not shown in admin mode).
- On the Today's Bright Spot (featured) card inline to the right of the source name.
- Not on the slide-in panel (shares panel already serves that space).

**Persistence & ISR resilience:**
- `localStorage` key `tgif_liked` — array of liked story IDs. Restores the red heart on page revisit.
- `localStorage` key `tgif_liked_counts` — map of `storyId → expectedCount`. Stored at like/unlike time. On reload, the displayed count is `Math.max(initialCount, expectedCount)` — so if the 2-minute ISR cache hasn't refreshed yet and still serves `likes: 0`, the reader still sees the correct count they left it at.

**Cross-card sync:**
Stories in the "New!" section are duplicates of their regular section cards. Liking one instantly syncs the other via a custom browser event `tgif:like-change` dispatched on `window`. All `LikeButton` instances for the same `storyId` listen for the event and update their state immediately — no refresh required.

### SEO
- Canonical domain is `https://www.thegoodifound.com` (www) — non-www 307-redirects to www on Vercel. All metadata, sitemap, robots, JSON-LD use www.
- Rich metadata with 15 keywords in `layout.tsx`
- Open Graph + Twitter Card tags
- JSON-LD structured data (WebSite schema)
- **Sitemap is a STATIC file** at `public/sitemap.xml` (the dynamic `src/app/sitemap.ts` was removed — static is more reliable for Google). Update it manually only if permanent pages are added.
- robots.txt via `src/app/robots.ts` (blocks `/admin`, points to www sitemap)
- OG image generated via `opengraph-image.tsx` (tagline forced to one line; basic — redesign is a to-do)
- Google Search Console verified via `public/google2deb88195915a625.html`. Both www and non-www properties added.

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
  status text,               -- pending/approved/skipped/published/rejected/archived
  ai_score integer,          -- 1-10
  ai_reason text,
  image_url text,
  category text,
  is_featured boolean default false,
  is_custom boolean default false,
  site_published_at timestamptz, -- when admin clicked Publish (not the RSS article date)
  content_format text not null default 'text', -- 'text' | 'rich' — see "Rich text formatting" below
  likes integer not null default 0             -- public like count; incremented/decremented atomically via Postgres functions
)
-- status check constraint allows: pending, approved, skipped, published, rejected, archived
-- content_format check constraint allows: text, rich
-- unique partial index enforces only one is_featured = true at a time

site_settings (
  key text primary key,      -- about_title, about_text, ai_policy_title, etc.
  value text not null
)

reader_submissions (
  id uuid primary key,
  type text not null,            -- 'article' | 'url'
  status text not null,          -- 'new' | 'approved' | 'dismissed'
  submitter_name text not null,
  submitter_email text,          -- optional
  title text,                    -- article only
  summary text,                  -- article only (card description)
  content text,                  -- article only (full story)
  image_url text,                -- article only (optional)
  attested boolean not null,     -- article only — agreed to submission terms
  url text,                      -- url type only
  reason text,                   -- url type only — "why does this belong here?"
  created_at timestamptz not null,
  reviewed_at timestamptz
)

submission_attestations (        -- proof of agreement to submission terms, kept 7 years
  id uuid primary key,
  submission_id uuid,            -- the reader_submissions row this attestation belongs to
  submitted_at timestamptz not null default now(),
  submitter_name text not null,
  submitter_email text           -- optional
)
```

RLS enabled on all four tables. `stories`: public SELECT where status = `published`. `site_settings`: public SELECT all. `reader_submissions` and `submission_attestations`: no public policies — fully locked down, all access via service role. All writes use service role key (bypasses RLS).

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
- **Live site:** https://www.thegoodifound.com (canonical, www)
- **Admin:** https://www.thegoodifound.com/admin
- **Vercel URL:** https://good-news-ten-teal.vercel.app
- **Domain registrar:** GoDaddy — DNS pointed to Vercel; www is primary, non-www 307-redirects to www
- Auto-deploys on push to `main`
- **Env vars (Vercel):** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, ADMIN_PASSWORD (= `Zilazeos1!`)
- **Supabase Storage:** public bucket `featured-images` for all uploaded images

---

## To Do
1. **Daily automation** — schedule the fetch to run each morning automatically via Vercel cron
2. **OG image redesign** — make the social share preview image look great (currently functional but basic)
3. **Desktop article panel** — show a slide-up panel on desktop (like mobile sheet) with image, summary, and "Read Full Article" button. Keeps users on site longer.
4. ~~**AI Policy content**~~ — DONE. Added via Edit Content in admin.
5. ~~**Advertising Policy content**~~ — DONE. Added via Edit Content in admin.
6. ~~**Donations via Ko-fi**~~ — DONE. Ko-fi account live at ko-fi.com/thegoodifound. "Support Us" link in the footer, "❤️ Support the Good" banners between sections, a desktop "Share a Story with Us!" link beside them, and a mobile floating heart button after first scroll. No popups, no ads.
7. ~~**Daily DB cleanup job**~~ — DONE. `/api/cleanup` hard-deletes stories where `fetched_at` > 10 days old, excluding `published` and custom (`is_custom`) stories — reader-submitted "Write an Article" stories are always `is_custom` and so are never auto-deleted. Also hard-deletes `skipped` stories where `fetched_at` > 72 hours old (same `is_custom` exclusion). Also purges `submission_attestations` rows older than 7 years. Runs daily at 6am UTC via Vercel cron (`vercel.json`). Secured with `CRON_SECRET` env var.
8. ~~**Published date per article (admin only)**~~ — DONE. `site_published_at` column added; set at publish time; shown on Published tab cards only.
9. **Sort-by on Published tab (admin only)** — add a sort control on the Published tab so admin can sort cards by: Section (alphabetical) or Date Published. Default order stays as-is (current public page order by ai_score).
10. **Mobile app (React Native / Expo)** — build iOS and Android apps that read published stories from the same Supabase database. Admin stays as-is on the web; no separate sync needed — publishing via admin is already the sync. App needs: card feed by section, slide-up story reader, search, language/translation, and section navigation. Supabase React Native SDK handles data. Rewrite UI in React Native components (no Tailwind); logic and data layer port almost directly from the web app.
11. ~~**Article Likes**~~ — DONE. See **Story Likes** section.
12. ~~**Reader Article Recommendations**~~ — DONE. See **Reader Submissions** section — "Recommend a Story" mode on `/contribute`.
13. ~~**Reader-Written Articles**~~ — DONE. See **Reader Submissions** section — "Write an Article" mode on `/contribute`.
14. **Switch story images to next/image** — `StoryCard.tsx` uses a plain `<img>` for `story.image_url`, which serves admin-uploaded images at full size with no compression/format conversion. Switching to Next.js's `<Image />` would auto-resize, convert to WebP/AVIF, and lazy-load — reducing bandwidth. Requires adding the Supabase Storage domain to `next.config.ts`'s allowed image domains.
15. ~~**Translate the `/contribute` page**~~ — DONE. See "`/contribute` page translation" under Language translation.
16. ~~**Expand the contribution attestation**~~ — DONE. See "Submission agreement" under Reader Submissions.
17. ~~**Promote "Share a Story" on-page, not just in the footer**~~ — DONE. Desktop-only "✍️ Share a Story with Us!" link to `/contribute` (translated, `t.shareStoryWithUs`) sits to the left of each "❤️ Support the Good" Ko-fi banner in `PublicFeed.tsx`.
18. **Auto-download a copy of the submission (Write an Article)** — when a reader submits an article, automatically trigger a download of a single self-contained HTML file containing their title, summary, full story, and the photo embedded inline as base64 (one combined file avoids browsers blocking a second automatic download). Gives the writer a personal copy without any extra click. Doesn't apply to "Recommend a Story" (no content/image to bundle).
19. **Submitted story open/close behavior** — revisit how a reader-submitted ("Write an Article") story opens and closes from the public feed. Currently: clicking a card opens the preview sheet, "Read Full Story" opens `/story/[id]` in a new tab, and that page's "Back"/"More Good News" links open another homepage tab instead of returning to the original. Decide on the desired behavior.
20. **Managing a Recommended Story on receipt** — decide how admin should handle a "Recommend a Story" submission once approved. Currently it's inserted straight into Pending via the normal AI classification pipeline (same as RSS stories), with nothing marking it as a reader recommendation.
21. **Weekly email digest** — send a weekly newsletter to subscribers summarizing that week's published stories. Format: short personal note from Mike at the top (his voice is a key differentiator vs. algorithm-driven sites), followed by 5–10 handpicked story highlights (headline + 1–2 sentence summary + "Read more" link), closing with a soft call-to-action (support us, share with a friend). Stories can be auto-pulled from the database (published stories from the past 7 days), Mike writes the intro and hits send. Use an email platform such as Mailchimp (free up to 500 contacts), Beehiiv, or Substack for list management and delivery — some have APIs that could auto-populate the story list. Add a newsletter signup to the site (footer and/or inline). Daily digest (just the top 3–5 stories, very brief) is an alternative if weekly feels too infrequent.
22. **Video / Podcast section** — add a dedicated section for curated uplifting YouTube videos and/or a podcast. Good News Network has a YouTube section; Positive.News has a podcast. Could start with a curated video section pulling from YouTube (no hosting needed — just embed or link), then add a podcast later if there's appetite. Decide on format and whether Mike hosts or just curates.
23. **Social media accounts + site links** — create The Good I Found accounts on Instagram, Facebook, and potentially Bluesky/X. Once created, add social links to the site footer alongside the existing Ko-fi and About links. Accounts can be used to cross-post stories and grow readership back to the site.
23. **Most Liked section** — a virtual pinned section (like "New!") showing the top-liked stories of the past 7 days, ordered by `likes` descending. Hold off until readership and like counts are high enough to make the ranking meaningful.
23. ~~**Bookmarks (Save for Later)**~~ — DONE. See **Bookmarks** section.
