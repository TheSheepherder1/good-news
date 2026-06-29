-- =============================================================
-- The Archive of Human Goodness — Phase 1 Database Migration
-- =============================================================

-- -------------------------------------------------------------
-- 1. ARCHIVE CHAPTERS (chapters and sub-chapters)
-- -------------------------------------------------------------
create table if not exists archive_chapters (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,        -- used in URLs: /archive/courage
  description   text,                        -- what kinds of stories belong here
  parent_id     uuid references archive_chapters(id) on delete set null, -- null = top-level chapter; set = sub-chapter
  status        text not null default 'active' check (status in ('active', 'retired')),
  sort_order    integer not null default 0,  -- controls display order
  created_at    timestamptz not null default now()
);

-- Seed the 9 starter chapters
insert into archive_chapters (name, slug, description, sort_order) values
  ('Kindness',    'kindness',    'Acts of generosity, compassion, and helping others',            1),
  ('Courage',     'courage',     'Bravery, standing up, doing the hard right thing',              2),
  ('Community',   'community',   'People coming together, collective action, belonging',           3),
  ('Sacrifice',   'sacrifice',   'Giving something up for the benefit of others',                 4),
  ('Love',        'love',        'Family, friendship, devotion, and human connection',            5),
  ('Resilience',  'resilience',  'Overcoming adversity, rebuilding, and persisting',              6),
  ('Innovation',  'innovation',  'Creative solutions and inventions that helped people',          7),
  ('Environment', 'environment', 'People protecting nature, animals, and the planet',             8),
  ('Joy',         'joy',         'Pure moments of happiness and goodness that spread to others',  9);

-- RLS
alter table archive_chapters enable row level security;
create policy "Public can read active chapters"
  on archive_chapters for select
  using (status = 'active');
create policy "Service role has full access to chapters"
  on archive_chapters for all
  using (true)
  with check (true);

-- -------------------------------------------------------------
-- 2. WORLD EVENTS
-- -------------------------------------------------------------
create table if not exists world_events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,    -- used in filters: world-cup-2026
  description text,
  event_year  integer,                 -- start year of the event
  status      text not null default 'active' check (status in ('active', 'retired')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Seed a starter set of world events
insert into world_events (name, slug, description, event_year, status, sort_order) values
  ('FIFA World Cup 2026',   'world-cup-2026',   'FIFA World Cup hosted in USA, Canada, and Mexico',    2026, 'active',  1),
  ('COVID-19 Pandemic',     'covid-19',         'Global pandemic 2020–2023',                           2020, 'retired', 2),
  ('FIFA World Cup 2022',   'world-cup-2022',   'FIFA World Cup hosted in Qatar',                      2022, 'retired', 3),
  ('Tokyo Olympics 2021',   'olympics-2021',    'Summer Olympics held in Tokyo, Japan',                2021, 'retired', 4),
  ('Paris Olympics 2024',   'olympics-2024',    'Summer Olympics held in Paris, France',               2024, 'retired', 5),
  ('September 11, 2001',    'sept-11-2001',     'Acts of goodness in the aftermath of 9/11',          2001, 'retired', 6),
  ('Hurricane Katrina',     'katrina-2005',     'Community response to Hurricane Katrina',             2005, 'retired', 7),
  ('Thai Cave Rescue 2018', 'thai-cave-2018',   'Rescue of 12 boys and their coach from Tham Luang',  2018, 'retired', 8);

-- RLS
alter table world_events enable row level security;
create policy "Public can read all world events"
  on world_events for select
  using (true);
create policy "Service role has full access to world events"
  on world_events for all
  using (true)
  with check (true);

-- -------------------------------------------------------------
-- 3. ARCHIVE STORIES
-- -------------------------------------------------------------
create table if not exists archive_stories (
  id                  uuid primary key default gen_random_uuid(),

  -- Status flow: live (AI passed) | review (AI failed, awaiting Mike) | declined | removed
  status              text not null default 'review' check (status in ('live', 'review', 'declined', 'removed')),

  -- Story content (template sections)
  opening             text,            -- "Set the scene..."
  body                text,            -- "Tell us what happened..."
  impact              text,            -- "What changed because of this..."

  -- Images (up to 3, all optional)
  image_1_url         text,
  image_1_caption     text,
  image_2_url         text,
  image_2_caption     text,
  image_3_url         text,
  image_3_caption     text,

  -- When it happened
  occurred_year       integer not null,
  occurred_month      integer check (occurred_month between 1 and 12),

  -- Where it happened
  country             text not null,
  state_province      text,
  city                text,

  -- Classification
  chapter_id          uuid references archive_chapters(id),
  world_event_id      uuid references world_events(id),
  tags                text[] default '{}',   -- up to 3 free-form tags
  organization        text,

  -- Submitter
  author_name         text not null,         -- always collected, even if anonymous
  is_anonymous        boolean not null default false,
  relationship        text not null check (relationship in (
                        'I witnessed this',
                        'This happened to me',
                        'This is a family story',
                        'This is a community story',
                        'I read about this'
                      )),
  original_language   text not null default 'en',  -- BCP 47 language code, detected by AI

  -- AI review
  ai_passed           boolean,
  ai_score            integer,          -- 1-10 quality score
  ai_reason           text,             -- AI explanation

  -- Flags
  is_seed             boolean not null default false,  -- true for AI-generated seed stories

  -- Timestamps
  submitted_at        timestamptz not null default now(),
  reviewed_at         timestamptz,      -- when Mike reviewed (review queue only)
  published_at        timestamptz       -- when story went live
);

-- RLS
alter table archive_stories enable row level security;
create policy "Public can read live archive stories"
  on archive_stories for select
  using (status = 'live');
create policy "Service role has full access to archive stories"
  on archive_stories for all
  using (true)
  with check (true);

-- -------------------------------------------------------------
-- 4. ARCHIVE STORY CHARACTERS
-- Separate table — each story can have multiple named characters
-- -------------------------------------------------------------
create table if not exists archive_story_characters (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references archive_stories(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0
);

-- RLS
alter table archive_story_characters enable row level security;
create policy "Public can read archive story characters"
  on archive_story_characters for select
  using (true);
create policy "Service role has full access to characters"
  on archive_story_characters for all
  using (true)
  with check (true);

-- -------------------------------------------------------------
-- 5. INDEXES for common lookups
-- -------------------------------------------------------------
create index if not exists archive_stories_status_idx       on archive_stories(status);
create index if not exists archive_stories_chapter_idx      on archive_stories(chapter_id);
create index if not exists archive_stories_world_event_idx  on archive_stories(world_event_id);
create index if not exists archive_stories_country_idx      on archive_stories(country);
create index if not exists archive_stories_year_idx         on archive_stories(occurred_year);
create index if not exists archive_stories_language_idx     on archive_stories(original_language);
create index if not exists archive_characters_story_idx     on archive_story_characters(story_id);
