# The Good I Found — Project Decisions

## Project Overview
A daily curated good-news website, live at **www.thegoodifound.com**. Stories are fetched from 35 RSS feeds across the globe, filtered by AI for positivity and politics, reviewed by the admin, and published to the public site. Human-in-the-loop: nothing publishes automatically. Supports 10 languages, search, mobile slide-up reader, custom hand-written stories, and admin-editable footer content.

**To resume work in a fresh conversation:** read this whole file, then continue. It is the source of truth for the project's state and decisions.

---

## The Archive — Big Idea (Built — live on `archive-dev`, merging to production after QA)

The site is evolving toward a two-layer destination:

**Layer 1 — The Daily Feed** (live today)
Curated good news, fresh every day. Stays exactly as-is.

**Layer 2 — The Archive of Human Goodness** (future)
A permanent, searchable, public library of human goodness. Anyone can submit a story — a personal account, a witnessed act, a family memory. Stories live forever, translated on demand, organized so anyone can find them. No ads, no PII collected, no accounts required.

### Archive — Decisions Made

**Chapter taxonomy (9 chapters, defined and seeded):**
Kindness, Courage, Community, Sacrifice, Love, Resilience, Innovation, Environment, Joy. One level of chapters to start — sub-chapters added later when volume and natural groupings earn them.

**Seeding complete:** 27 stories seeded across all 9 chapters (3 per chapter) before public launch. 25 stories without world-event ties; 2 tied to world events still in the database (COVID-19 Pandemic, Paris Olympics 2024). Stories covering multiple countries, time periods, and historical moments.

**Home page integration — "A Story of Goodness":**
The opening/home page features one archive story as its hero card under the label "A Story of Goodness" (emerald color scheme). This replaced the "Today's Bright Spot" featured-news slot. All news stories now go into sections — none has a separate hero. Admin can pin any live archive story as the home feature via the admin panel; when none is pinned the most recently published live story is shown automatically. Image fallback: `image_1_url → image_2_url → image_3_url` (shows best available photo). A "Browse the Archive →" link sits alongside the hero label.

**Admin home curation (`is_home_featured`):**
`archive_stories.is_home_featured boolean not null default false`. A partial index (`where is_home_featured = true`) supports fast lookup. Admin "Live Stories" tab in the Archive group shows all live stories with "Set as Home Story" / "Remove from Home" buttons. Feature action unsets any previously pinned story first (only one at a time). Revalidate button clears the ISR cache (120s) so the change appears immediately.

**`/contribute` is now a choice landing page:**
Clicking "Share a Story" leads to `/contribute`, which shows two cards:
1. **"Share a story of goodness"** — links to `/archive/submit` (the archive submission form)
2. **"Recommend a news article"** — expands the existing URL recommendation form inline

"Write an Article" (custom news article mode) is retired — the archive replaces it as the way readers contribute personal writing.

**Submission:** Open to anyone in the world. No account required.
- AI reviews each submission on arrival — passes automatically → goes live immediately
- Fails AI → enters human review queue (Mike reviews before publishing)
- A **"Check My Story"** button lets writers run the AI check *before* submitting, so they can self-correct. Returns friendly, specific feedback on what might prevent it from going live.
- AI checks for: genuine goodness, no hate/negativity/political agenda, no third-party PII, not a copy/paste news article, not promotional.

**Language:** Stories are stored permanently in the original language the writer used — no grammar or spelling corrections, no AI cleanup. The writer's voice is preserved exactly. Translation works the same as the daily feed — on-demand, reader's chosen language. The original is always accessible alongside the translation.

**Permanence:** Stories are always available, no time limit, no expiry. Once submitted and live, a story stays forever. Operational implications to address before launch:
- **Regular exports** — automated backups of the full archive to AWS S3, GitHub, or similar. Text is tiny; a million stories is still a small file.
- **Internet Archive partnership** — the Wayback Machine actively partners with preservation projects; worth pursuing.
- **Open dataset** — make the archive a publicly downloadable dataset so stories survive even if the site ever goes down.
- **Legal/estate planning** — a non-profit structure would protect the archive long-term and ensure it outlives any single person's involvement.

**Curation standard:** AI holds a high bar — not just "is this positive?" but "is this a genuine story of human goodness worthy of permanent preservation?" Specific criteria: a real human act at the center, specific enough to be credible (vague feel-good fluff doesn't pass), an original personal account (not a retelling of a news article), and something that would still matter to read in 50 years. The "Check My Story" pre-check button coaches writers to meet this bar before submitting.

**Story template:** Stories follow a structured magazine-style layout with prompted text areas and optional images — mirrors how a great feature story reads, not a form. Structure:
1. **Hero image** (optional) + caption
2. **Opening** — prompted: "Set the scene. Who is this story about, where were they, and when did this happen?"
3. **Body** — prompted: "Tell us what happened. What did they do, and why does it matter?"
4. **Mid-story image** (optional) + caption
5. **Impact** — prompted: "What changed because of this? How did it affect the people involved, or the world around them?"
6. **Closing image** (optional) + caption
7. **Submitter name** (or anonymous) + relationship to story (I witnessed this / This happened to me / This is a family story / I read about this)

**Images:** Upload only — no external URL links. Images stored in Supabase Storage alongside the story permanently. Rationale: external URLs can disappear; uploaded images are under our control and consistent with the permanence principle.

**No edits after submission:** Once submitted, a story cannot be edited. It is a permanent snapshot of what the person knew and felt at the moment of submission — allowing edits would enable revisionism. If a story needs to be removed (defamatory content, privacy violation), that is an admin removal decision, not an edit.

### Archive — Decisions Pending

- **Sub-chapters:** Start with one level; add sub-chapters when the archive earns them through volume
- **Story grouping within chapters:** How stories are sorted/grouped once a reader is inside a chapter — chronological, by place, by world event, by something else. Let real stories inform this.

### Archive — Launch Seeding

The archive will be seeded with AI-generated stories before public launch so the first visitors arrive to a living, explorable archive rather than an empty one. Seed stories set the tone for what "archive-worthy" means — they are effectively the quality bar every future submitter sees.

**What gets seeded:**
- 3–5 stories per chapter at minimum
- Stories based on well-known historical acts of goodness and public record events (Dunkirk fishermen, the Thai cave rescue, Fred Rogers, etc.)
- Stories spread across multiple countries, languages, and time periods — demonstrating the global scope from day one
- All chapters represented so none feel empty

**Rules for seed stories:**
- Never presented as first-person accounts from real named individuals who didn't submit them — that would undermine the archive's integrity
- Historical public figures and well-documented public events are fair game
- Clearly marked with a consistent attribution label (e.g. "Historical Account" or "Archived Story") so provenance is never in question
- Must pass the same AI quality bar as any future submission — seed stories are the standard, not exceptions to it

**What seed stories accomplish:**
- Give first visitors something to explore immediately
- Define what archive-worthy looks like for future submitters
- Populate the Kayak filters so attribute search works from day one
- Seed the world events list with historical events worth connecting stories to

### Archive — Translation & Localization

The archive is fully translated into the reader's chosen language — the same `tgif_lang` key in `localStorage` that drives the home page.

**What translates:**
- All UI chrome on `/archive` (title, subtitle, filter labels, buttons, empty states, pagination, badges) via `useArchivePageStrings(lang)` hook
- Story card openings — all cards batch-translate in a single API call per page load; result stored in `Record<storyId, string>` and passed as props to `ArchiveCard`
- All UI on `/archive/submit` (section headers, field labels, placeholders, relationship options, error messages, success messages) via `useArchiveSubmitStrings(lang)` hook
- Story content (opening, body, impact) on `/archive/[id]` via `ArchiveStoryContent` — a client component that reads `tgif_lang` on mount and calls `/api/translate` for the three fields together
- Month names in the submission form derived from `Intl.DateTimeFormat` with the reader's locale — no extra string keys needed
- Country names in the submission form and on archive cards / story detail page via `Intl.DisplayNames` — no library, no translation API call

**Key files:**
- `src/lib/archiveStrings.ts` — English source strings for both archive pages (`ARCHIVE_PAGE_EN`, `ARCHIVE_SUBMIT_EN`)
- `src/lib/useArchiveStrings.ts` — `useArchivePageStrings(lang)` and `useArchiveSubmitStrings(lang)` hooks, same batch-translate + per-language cache pattern as `useContributeStrings`
- `src/components/ArchiveStoryContent.tsx` — client component for story detail page; dims content with `opacity-70` during translation
- `src/lib/countries.ts` — exports `LANG_TO_LOCALE` map (used by submit page for month locale) + `getCountryName(code, lang)` + `getAllCountriesSorted(lang)`
- `src/components/LocalizedCountry.tsx` — client wrapper for server-rendered story detail page; reads `tgif_lang` and resolves country name via `Intl.DisplayNames`

**Translate API (`sl=auto`):** Changed from `sl=en` to `sl=auto` so stories written in any language (not just English) translate correctly to the reader's chosen language.

**Relationship values vs. display:** Relationship options (e.g. "I witnessed this") are stored in the DB as English strings. The submission form maps these to translated display labels (`s.relationshipWitnessed` etc.) at render time — the stored value never changes, only the label shown to the reader.

**Country data integrity:** Country field stores ISO 3166-1 alpha-2 codes (e.g. "BR"), not free-text names. This prevents duplicate spellings across languages ("Brazil" vs. "Brasil"). Display name is resolved client-side by the reader's language via `Intl.DisplayNames`. A migration (`migration_archive_country_codes.sql`) converted the 15 existing country name strings to ISO codes before launch.

**Country select dropdown:** The `/archive/submit` form replaced the free-text country input with a `<select>` populated by `getAllCountriesSorted(lang)` — names appear in the reader's chosen language and the ISO code is stored as the value.

### Archive — Navigation

**"← Today's News" link:** In the archive browse and story detail page headers, a "← Today's News" link sits to the right of the logo and both point back to `/` (the home page). The link text matches the same font size, color, and weight as the "Archive" text in the banner — visually symmetrical. Decision: keep the daily feed as the front page for now; the archive is linked from it, not the other way around.

**"Share a Story of Goodness with Us!":** All links and buttons previously labelled "Share a Story with Us!" were renamed to "Share a Story of Goodness with Us!" across all 10 languages in `src/lib/translations.ts` (`shareStoryWithUs` key).

### Archive — Build Plan

**Architecture:** The archive lives inside the existing Next.js app — same codebase, same repo, same Supabase database, same Vercel deployment. Shares translation, styling, admin panel, and hosting. No separate app or monorepo needed.

**Development approach:** All archive work is built and tested locally first. Nothing pushed to production until the archive is complete, seeded, and ready for public launch. The daily feed continues running in production unchanged throughout.

**New routes:**
- `/archive` — browsing and search experience
- `/archive/submit` — story template + submission form
- `/archive/[id]` — individual story page

**New database tables:**
- `archive_stories` — different schema from `stories` (characters, location, year, world event, chapter, 3× images, submission metadata)
- `world_events` — Mike's curated event list with active/retired status
- `archive_chapters` — theme taxonomy

**Admin additions:**
- Archive moderation queue tab (AI-failed stories awaiting human review)
- World events management tab (add, retire, re-activate events)

**What stays unchanged:** The daily feed, card grid, sections, slide-in panel, existing admin tabs, translation system, Supabase instance, Vercel hosting, brand, header, footer — all untouched.

**Build phases:**

**Phase 1 — Database + admin foundation** ✓ DONE
New tables, world events admin panel, archive moderation queue

**Phase 2 — Submission experience** ✓ DONE
`/archive/submit` with story template, prompted text areas, 3-image upload, submission form fields, AI quality check, pre-submit "Check My Story" button

**Phase 3 — Public archive** ✓ DONE
`/archive` browsing with Kayak-effect attribute filters, chapter navigation, individual story pages at `/archive/[id]`

**Phase 4 — Seeding + launch** ✓ DONE
27 seed stories across all 9 chapters, home page integration ("A Story of Goodness" hero), admin home curation, `/contribute` choice page. Ready for production merge after QA.

### Archive — Browsing & Discovery

Two paths for readers to find stories:

**Path 1 — Attribute search (the Kayak effect)**
Filters work with an AND effect — every active filter narrows results together, never OR. Selecting one attribute instantly updates all other filters to show only values that still have matching stories — no dead ends, no "0 results." A reader can start with any attribute and narrow from there:
- Select Country: Brazil → Year filter shows only years with Brazilian stories
- Select Year: 2014 → World Events shows only events tied to Brazil 2014
- Select World Cup 2014 → results show exactly those stories

Searchable attributes: Country, City, Year, World Event, Chapter/Theme, Character name, Organization, Author name, Tags, Relationship to story, Language.

**Path 2 — Chapter browsing**
Reader arrives at a chapter (e.g. Courage) and sees stories grouped within it. How stories are grouped inside a chapter is still to be determined — chronological, by place, by world event, or by something that emerges naturally from the content. Both chapters and sub-chapters are browsable this way.

**The two paths connect** — a reader browsing a chapter can apply attribute filters within it, and a reader using attribute search can jump to the matching chapter view. Same stories, different entry points.

### Archive — Submission Form

The submission form is separate from the story itself. It is metadata — never displayed as part of the published story, but powers search and organization. Presented to the writer after the story is written as a distinct step: *"Almost done — help us file your story so others can find it."*

**About the story**
- **Date occurred** — Month (optional) + Year (required). Year is almost always remembered; month less reliably so.
- **Place occurred** — City (optional) + State/Province (optional) + Country (required)
- **World event connection** — optional dropdown, curated and maintained by Mike (see World Events below)

**About the people**
- **Main characters** — multiple names supported; writer can add/remove fields as needed
- **Organization involved** — optional (a school, charity, sports team, company, etc.)
- **Relationship to this story** — required. Options: Witnessed it / It happened to me / Family story / Community story / I read about this

**About the submitter**
- **Author name** — required. Collected internally always; displayed publicly unless anonymous is toggled.
- **Anonymous** — optional toggle. Name still collected for moderation purposes, displayed publicly as "Anonymous."

**Discovery**
- **Tags** — up to 3 free-form words the writer associates with the story. Captures things no taxonomy anticipates.

**What AI handles automatically (writer does not fill in):**
- Chapter assignment (theme)
- Language detection
- Attribute extraction from story text as fallback for any fields left blank

### Archive — World Events

A curated list of world events maintained by Mike, used to connect stories to larger historical moments (World Cup 2026, COVID-19 Pandemic, Hurricane Katrina, etc.).

**Two states:**
- **Active** — available in the dropdown for new story submissions
- **Retired** — removed from the new submission dropdown, but all stories tagged to it remain permanently searchable. Can be re-activated at any time (e.g. for an anniversary moment when new stories may come in).

**Two contexts:**
- **Writers submitting** — see only active events. Clean, relevant, not overwhelming.
- **Readers searching** — see all events ever created, active and retired. "World Cup 2026" is findable ten years from now with every story ever tagged to it.

**Over time**, the full events list becomes a remarkable index of human goodness mapped to world history — every event a doorway into the stories connected to that moment.

**Admin management:** Mike adds events, retires them, and re-activates them from an admin panel. Nothing is ever deleted — retired events stay in the database and remain fully searchable.

### Archive — Search & Organization

**Two distinct systems:**
- **Search** — targeted lookup. Solved by attributes/metadata. John types his grandfather's name and finds the story regardless of what chapter it lives in.
- **Browsing** — discovery. Solved by chapters. A stranger explores the archive without knowing what they're looking for yet.

**Search attributes** (metadata collected at submission):
- Name of the person the story is about — critical for the grandfather lookup
- Location where it happened — country minimum, city if known
- When it happened — year minimum, exact date optional
- World event connection — was this tied to something larger? (a World Cup, a disaster, a war, a pandemic, etc.)
- Submitter relationship — I witnessed this / This happened to me / This is a family story / I read about this
- Original language
- Submission date (automatic)

Some attributes (who, where, when) can also be extracted by AI from the story text itself as a fallback if the writer doesn't fill them in — but explicitly asking is more reliable.

**Chapter organization** (for browsing):
- **Primary chapter = Theme** — what kind of goodness is this? (Kindness, Courage, Sacrifice, Community, Love, Innovation, etc.)
- **Place and time are filters within chapters**, not separate chapters — a story about a firefighter in Brazil during the 2014 World Cup lives in Courage, findable by filtering Brazil + 2014
- **AI assigns the chapter** — writer sees the assignment before submitting and can flag a disagreement. Writer doesn't need to know the taxonomy; AI applies it consistently.
- **One level of chapters to start** — sub-chapters added later when natural groupings emerge from the stories themselves. Don't over-design the taxonomy before the archive has content.

**Guiding principle:** Let the first 1,000 stories teach what the chapters and sub-chapters should actually be. Decide principles now; refine taxonomy from real submissions.

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
- **Fonts:** Geist Sans (body) — Merriweather removed; site title is now the SVG logo
- **Favicon:** Logo icon PNG (`public/logo-icon.png`, sourced from `TheGoodIFound_Icon_512.png`). Also placed at `src/app/icon.png` for Next.js App Router auto-detection.

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
Public page has a "Share a Story" footer link (`/contribute`, translates into the reader's chosen language — see "Language translation" below). `/contribute` is a **choice landing page** with two paths:
1. **"Share a story of goodness"** — links to `/archive/submit`, the archive story submission form (see Archive section above). This is the primary contribution path.
2. **"Recommend a news article"** — expands an inline URL recommendation form (name, URL, optional note, optional email).

"Write an Article" (custom news article mode) is retired — the archive replaces it. The URL recommendation path remains.

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

**Daily Feed group — five tabs: Pending | Approved | Skipped | Published | Public Created**
- **Pending:** approve/skip, section override dropdown (with AI suggested label), image upload
- **Approved:** set as featured (conflict confirmation), image upload, custom story badge, section override dropdown
- **Skipped:** rescue back to approved, section override dropdown
- **Published:** mirrors public page order; section change, image add/replace/remove, unpublish (→ Skipped), featured change; search + Section/Date Published filters; **Unpublish All** button (with confirmation) bulk-unpublishes every story matching the active filters
- **Public Created:** review queue for reader submissions (see **Reader Submissions** below). Tab shows an unread-count badge. Each card has a Section dropdown (required) plus **Approve** / **Dismiss**.

**Archive group — three tabs: Archive Review | Live Stories | World Events**
- **Archive Review:** stories that failed AI auto-approval, awaiting human decision. Approve (with chapter assignment) or Decline.
- **Live Stories:** all live archive stories. Each has "Set as Home Story" button (or "Remove from Home" + ⭐ badge if currently pinned). Setting a new home story automatically unsets the previous one.
- **World Events:** add new events, retire active ones, re-activate retired ones. Active events appear in the archive submission dropdown; retired ones stay in reader search forever.

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
Dynamically populated from whichever categories have published stories. Includes "Top of Page" and "A Story of Goodness" (the archive hero) as fixed nav items at the top when an archive story is featured, followed by the section list. "Today's Bright Spot" is retained in translations but no longer rendered — archive hero replaced it. Each section row has ↑ ↓ reorder arrows on the right (see **Reader section reordering** above). Labels translate with selected language.

### Search
Client-side filtering by title, summary, and source. Desktop: always-visible search bar inline with Sections/Language row. Mobile: tap 🔍 to expand full-width search bar. Font size 16px on mobile input prevents iOS Safari auto-zoom.

### Language translation
**Universal 74-language system** — readers choose any of 74 languages from a searchable `LanguagePicker` dropdown (rows show native name · English name, English always pinned first). Language choice saved to `localStorage` (`LANG_STORAGE_KEY = 'tgif_lang'`) and restored on load — synced across home page, `/archive`, and `/contribute`.

- `src/lib/languages.ts` — typed list of 74 `{ code, native, english }` entries sorted alphabetically by English name. `getLangLabel(code)` returns the native label (used in the archive browse page filter).
- `src/lib/uiStrings.ts` — `UIStrings` type + `UI_EN` English source for all site-chrome strings (site title, tagline, search, sections, footer, category labels, etc.). Template strings with `{q}` / `{n}` placeholders replace function-valued strings. `getCategoryLabel(cat, t)` maps an English category name to its translated key.
- `src/lib/useUIStrings.ts` — `useUIStrings(lang)` hook. Module-level cache seeded with `{ en: UI_EN }`. English is instant (no API call); other languages batch-translate `UI_EN` values via `/api/translate` and cache the result for the session.
- `src/lib/contributeStrings.ts` + `useContributeStrings.ts` — same pattern for the ~50 `/contribute` page strings.
- `src/lib/archiveStrings.ts` + `useArchivePageStrings.ts` / `useArchiveSubmitStrings.ts` — same pattern for archive page and submit-form strings.
- `lang` is typed as `string` everywhere (was a 10-value union). All existing `localStorage` values remain valid.
- `/api/translate` uses `sl=auto` (source language auto-detected) so stories written in any language translate correctly into the reader's chosen language.
- `src/lib/countries.ts` `LANG_TO_LOCALE` maps all 74 language codes to BCP 47 locales for `Intl.DisplayNames` (country names) and `Intl.DateTimeFormat` (month names) — no API call needed for these.
- Card sizes consistent with `line-clamp-2` titles and `line-clamp-3` summaries.

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
- **Today's Bright Spot:** retired as a news hero slot. Label retained in translations but no longer rendered.
- **A Story of Goodness:** emerald (`text-emerald-600`), 1.35rem, uppercase; archive hero card sits in its own `bg-white/50` frosted panel above all news sections. "Browse the Archive →" link sits alongside the label.
- **Site title:** SVG logo (`public/logo.svg`) — icon + "The Good / I Found" wordmark in Georgia serif, rendered as `<img>` at `h-[72px]` mobile / `h-[90px]` desktop. Replaces the old Merriweather text `<h1>`.
- **Tagline:** `text-gray-600` (still shown below the logo, still translates with selected language)
- **Header date:** `text-emerald-500` — matches the brand green (#10B981), same font size/weight as tagline
- **Layout:** max-width 1280px (`max-w-7xl`), 3-column card grid on desktop

### Layout width
Max width `max-w-7xl` (1280px) on both public site and admin. 3-column card grid on desktop.

### Footer
Three modal links (**About**, **AI Policy**, **Advertising Policy**) plus a **Share a Story** link to the `/contribute` page (see Reader Submissions). Modal content editable from admin; About modal content translates to selected language.

### Text-to-Speech (Read Aloud)
A speaker icon appears in the category/source row of the story slide-in panel (alongside the share button), on both mobile and desktop. Designed primarily as an accessibility feature for readers who have difficulty reading or seeing — they can listen to the story title and summary read aloud in their chosen language.

**How it works:**
- Uses the browser's built-in Web Speech API (`speechSynthesis`) — no API keys, no cost, works offline, no external dependency.
- Tap the speaker icon to start reading; tap again (stop square icon) to stop. Icon turns green while speaking.
- Reads the title first, then the summary, in the reader's currently selected language. Language codes are mapped to BCP 47 tags so the device picks the appropriate voice.
- Resets automatically when the panel closes or a different story is opened.
- Button is hidden entirely on browsers that don't support the API (graceful degradation).
- User tap is always required to start — no auto-play on any platform (required by iOS).

**Language support:** All 10 site languages are mapped (en→en-US, zh→zh-CN, de→de-DE, nl→nl-NL, es→es-ES, fr→fr-FR, pl→pl-PL, pt→pt-PT, ja→ja-JP, sr→sr-RS). Uses the device's built-in voices — quality is excellent for major languages; Polish and Serbian may fall back to a default voice on some devices.

**Compatibility:** Works on iOS Safari, Android Chrome, Chrome/Safari/Edge/Firefox desktop.

**Component:** `src/components/TextToSpeechButton.tsx`.

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

### RSS Reader Feed
Readers can subscribe to published stories via a standard RSS 2.0 feed at `/feed.xml` (`src/app/feed.xml/route.ts`). Returns the 50 most recent published stories with title, summary, source, category, image, and a link to the original article. Each item's description includes a Ko-fi donation callout. The feed is cached for 5 minutes (`Cache-Control: public, max-age=300`). An RSS autodiscovery `<link>` tag is included in the site `<head>` via `layout.tsx` metadata (`alternates.types`), so RSS readers can auto-detect it. A small RSS icon in the footer links to the feed directly.

### Social sharing
Each story's slide-in panel (`ArticleSheet`) has a share icon button inline on the category/source line, to the right of the source name. Behavior:
- **Web Share API (primary):** on iOS, Android, macOS Safari/Chrome, and Windows Chrome the button opens the device's native share sheet — readers see all their installed apps and pick one. No platform icons to design or maintain.
- **Fallback dropdown:** on browsers without `navigator.share` (Firefox desktop, etc.) clicking the button opens a small dropdown with five options: X / Twitter, Facebook, WhatsApp, LinkedIn, Email. Each opens the platform's share page in a new tab with text pre-filled.
- **Share content:** the original article URL is what gets shared. Pre-filled text reads `"[Article Title] — via The Good I Found https://thegoodifound.com"` — credits the site without replacing the article link.
- **Component:** `src/components/ShareButton.tsx`. Accepts `title` and `url` props. Uses `navigator.share` if available, otherwise toggles a dropdown. Click-outside closes the dropdown.
- **OG image limitation:** because the share button shares the *original article URL*, the preview card shown to the recipient uses the original publisher's OG image — not The Good I Found's. Our OG image only appears when someone shares the root `thegoodifound.com` URL directly. Dynamic per-story OG images (to-do #25) would fix this.

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

### Brand & Logo
The Good I Found has a full brand identity. Source files live in `~/Downloads/` (not in the repo — keep originals safe).

**Files delivered by designer:**
| File | Use |
|---|---|
| `TGIF_Light.svg` / `.png` | Full color logo on off-white (#F8FBFA) |
| `TGIF_Dark.svg` / `.png` | White + emerald on dark (#102126) |
| `TGIF_Reversed.svg` / `.png` | White logo on emerald (#10B981) |
| `TGIF_Mono.svg` / `TGIF_Monochrome.png` | Monochrome (dark gray) version |
| `TheGoodIFound_Wordmark.svg` | Full wordmark with tagline, Georgia serif, proper viewBox |
| `TheGoodIFound_Wordmark_1200x400.png` | Raster wordmark |
| `TheGoodIFound_Icon_512.png` | Icon only, 512×512px — used as favicon |
| `TGIF_Brand_Guidelines.pdf` | Full brand spec |

**Color palette:**
- Emerald green: `#10B981`
- Soft blue: `#C8DDE6`
- Gold: `#F0B429`
- Off-white: `#F8FBFA`
- Dark teal (text): `#2F3A3A`

**What's implemented:**
- `public/logo.svg` — clean wordmark SVG (no background rect, trimmed viewBox) for the site header
- `public/logo-icon.png` + `src/app/icon.png` — favicon
- `public/og-image.png` — 1200×630 OG image, soft blue background, full color logo

### SEO
- Canonical domain is `https://www.thegoodifound.com` (www) — non-www 307-redirects to www on Vercel. All metadata, sitemap, robots, JSON-LD use www.
- Rich metadata with 15 keywords in `layout.tsx`
- Open Graph + Twitter Card tags
- JSON-LD structured data (WebSite schema)
- **Sitemap is a STATIC file** at `public/sitemap.xml` (the dynamic `src/app/sitemap.ts` was removed — static is more reliable for Google). Update it manually only if permanent pages are added.
- robots.txt via `src/app/robots.ts` (blocks `/admin`, points to www sitemap)
- OG image: `public/og-image.png` — 1200×630, soft blue (#C8DDE6) background, full-color logo (emerald icon, gold sun, dark/emerald wordmark, tagline). Generated via Node/sharp from the brand SVG source. Replaces the old placeholder.
- **Gotcha — Next.js App Router OG precedence:** the special file `opengraph-image.tsx` (or `.png`) placed in `src/app/` takes precedence over `metadata.openGraph.images` in `layout.tsx` and silently overrides it. The old `opengraph-image.tsx` (emoji + gradient) was doing this — deleted in favour of the static `public/og-image.png`. If a dynamic OG route is ever added back, it must replace `public/og-image.png` entirely rather than coexist with it.
- Social platforms cache OG images aggressively. After updating, use the Facebook Sharing Debugger and LinkedIn Post Inspector to force a re-scrape.
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

```

**Archive tables:**

```sql
archive_chapters (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer
)
-- 9 chapters: Kindness, Courage, Community, Sacrifice, Love, Resilience, Innovation, Environment, Joy

world_events (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  year integer,
  status text not null default 'active',  -- active | retired
  created_at timestamptz not null default now()
)

archive_stories (
  id uuid primary key,
  chapter_id uuid references archive_chapters(id),
  world_event_id uuid references world_events(id),
  opening text not null,
  body text,
  impact text,
  image_1_url text,
  image_2_url text,
  image_3_url text,
  image_1_caption text,
  image_2_caption text,
  image_3_caption text,
  author_name text,
  is_anonymous boolean not null default false,
  relationship text,
  occurred_year integer,
  occurred_month integer,
  country text,
  city text,
  tags text[],
  status text not null default 'review',  -- review | live | declined
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz,
  is_home_featured boolean not null default false  -- admin-pinned home page hero; partial index for fast lookup
)
-- partial index: archive_stories_home_featured_idx on archive_stories(is_home_featured) where is_home_featured = true

archive_story_characters (
  id uuid primary key,
  story_id uuid references archive_stories(id),
  name text not null,
  sort_order integer not null default 0
)
```

RLS enabled on all four daily-feed tables. `stories`: public SELECT where status = `published`. `site_settings`: public SELECT all. `reader_submissions` and `submission_attestations`: no public policies — fully locked down, all access via service role. All writes use service role key (bypasses RLS).

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
2. ~~**OG image redesign**~~ — DONE. 1200×630 soft blue (#C8DDE6) background with full-color logo. See **Brand & Logo** section.
3. **Desktop article panel** — show a slide-up panel on desktop (like mobile sheet) with image, summary, and "Read Full Article" button. Keeps users on site longer.
4. ~~**AI Policy content**~~ — DONE. Added via Edit Content in admin.
5. ~~**Advertising Policy content**~~ — DONE. Added via Edit Content in admin.
6. ~~**Donations via Ko-fi**~~ — DONE. Ko-fi account live at ko-fi.com/thegoodifound. "Support Us" link in the footer, "❤️ Support the Good" banners between sections, a desktop "Share a Story with Us!" link beside them, and a mobile floating heart button after first scroll. No popups, no ads.
7. ~~**Daily DB cleanup job**~~ — DONE. `/api/cleanup` hard-deletes stories where `fetched_at` > 10 days old, excluding `published` and custom (`is_custom`) stories — reader-submitted "Write an Article" stories are always `is_custom` and so are never auto-deleted. Also hard-deletes `skipped` stories where `fetched_at` > 72 hours old (same `is_custom` exclusion). Also purges `submission_attestations` rows older than 7 years. Runs daily at 6am UTC via Vercel cron (`vercel.json`). Secured with `CRON_SECRET` env var.
8. ~~**Published date per article (admin only)**~~ — DONE. `site_published_at` column added; set at publish time; shown on Published tab cards only.
9. ~~**Sort-by on Published tab (admin only)**~~ — DONE.
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
23. ~~**Bookmarks (Save for Later)**~~ — DONE. See **Bookmarks** section.
24. **Social media accounts + site links** — create The Good I Found accounts on Instagram, Facebook, and potentially Bluesky/X. Once created, add social links to the site footer alongside the existing Ko-fi and About links. Accounts can be used to cross-post stories and grow readership back to the site.
25. **Dynamic per-story OG images** — when a reader shares a story via the share button, the OG preview shown is the original publisher's image (not ours). A `/api/og?storyId=...` route using `@vercel/og` (Next.js built-in) could generate a 1200×630 branded card with the story title and logo on the fly, so every shared story carries The Good I Found branding. Requires updating `ShareButton.tsx` to share `thegoodifound.com/?story=[id]` or a similar canonical story URL instead of the raw original URL.
26. **Most Liked section** — a virtual pinned section (like "New!") showing the top-liked stories of the past 7 days, ordered by `likes` descending. Hold off until readership and like counts are high enough to make the ranking meaningful.
27. **Image upload size limit** — Vercel serverless functions have a hard 4.5MB request body limit, causing larger image uploads to silently fail. Supabase Storage itself supports up to 50MB so that's not the constraint. Three options:
    - **Client-side compression (simplest):** resize/compress the image in the browser before sending using the Canvas API, targeting ~1MB. Story card images display at ~400px wide so there's no quality loss.
    - **Direct-to-Supabase upload (cleanest):** generate a signed upload URL server-side, then have the browser send the file straight to Supabase Storage — bypassing Vercel entirely and removing the 4.5MB ceiling.
    - **Visible size warning (quick patch):** add a "Max 4MB" note to the upload button so the limit is obvious before attempting.
28. **Daily story reminder email (Archive)** — opt-in daily email reminding the subscriber to submit a story of goodness to the archive. Subscriber chooses the time of day they'd like to receive it. Key considerations: no account required to subscribe (just an email + preferred send time), one-click unsubscribe, email platform needed for scheduling and delivery (Mailchimp, Beehiiv, or similar), reminder copy should be warm and personal — not a marketing blast. Ties closely to to-do #21 (weekly digest) so the same email platform and subscriber list can serve both purposes.
29. **Video uploads alongside photos** — allow submitters to upload a short video clip where photos are currently accepted (archive stories, news story submissions). Key decisions and constraints:
    - **Vercel's 4.5MB serverless limit** blocks any video upload through the current route. Must use direct-to-Supabase signed uploads (browser sends the file straight to Supabase Storage, bypassing Vercel) — this is the same fix needed for to-do #27 and should be solved together.
    - **Supabase Storage cost model:** Pro plan ($25/mo) includes 100GB storage + 200GB bandwidth/month. Storage is cheap (~50MB per short clip = ~2,000 clips per 100GB). Bandwidth is the real cost — if 500 viewers/day each stream one 50MB clip, that's ~750GB/month in egress, roughly $50/month in overages at $0.09/GB. Costs grow with traffic.
    - **Supabase Storage is an object store, not a video platform** — no transcoding, no adaptive bitrate streaming, no thumbnail generation. Videos play as raw files. Fine for short clips; poor experience for anything over ~2 minutes.
    - **Recommended alternative for serious video: Cloudflare Stream** — $5 per 1,000 minutes stored + $1 per 1,000 minutes delivered. Handles transcoding, adaptive bitrate, thumbnail extraction. At modest archive traffic likely under $5/month. Tradeoff: third-party platform (though video data is exportable and ownership stays with submitter).
    - **Decision needed before building:** (a) archive only or news stories too? (b) file upload (permanence) or YouTube/Vimeo embed URL (simpler, no cost, but external platform can remove it)? For the archive, file upload is the right call given the permanence principle — Cloudflare Stream is the recommended host. For news stories, a YouTube/Vimeo embed URL is appropriate.
30. **Translation API upgrade** — the current `/api/translate` route proxies a free, unofficial Google Translate endpoint with no SLA, no rate-limit guarantees, and no support for auto source-language detection on some paths. Evaluate upgrading to a paid API for better reliability and quality as traffic grows. Options:
    - **Google Cloud Translation API (v2)** — same translation engine as the free endpoint, but with an official SLA, per-key rate limits, and a dashboard. Cost: $20 per 1M characters. First step to evaluate — minimal migration work since the translation quality is identical and the response format is nearly the same.
    - **Microsoft Azure Translator** — 100+ languages, $10 per 1M characters (free tier: 2M chars/month). Competitive quality, especially for less-common languages. Slightly higher migration effort (different auth model and response shape).
    - **DeepL** — best-in-class quality for European languages (English, German, French, Spanish, Italian, Dutch, Polish, Portuguese, etc.). Only 33 languages total; no support for many of the 74 currently offered (e.g. Arabic, Thai, Vietnamese, Hindi, Swahili). Pricing: Free tier 500K chars/month; Pro from $7.50/month. Worth considering as a supplemental engine for European readers if quality matters more than coverage.
    - **LLM-based translation (Claude / GPT-4o) for archive story content** — archive stories are personal, emotional narratives where context and nuance matter more than the news summaries on the home page. An LLM prompted with "translate this story faithfully, preserving the author's voice and emotional tone" would outperform any MT engine for the opening / body / impact fields. Cost is higher (per-token vs. per-character), so best applied only to archive story content, not site chrome or feed summaries.
