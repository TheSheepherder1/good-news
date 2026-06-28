-- Two test seed stories for archive development/testing
-- Run in Supabase SQL Editor on the archive-dev environment

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
)
values
(
  'live',
  'On a January morning in 2019, a retired schoolteacher named Dorothea Sousa walked into a diner in Portland, Oregon, and quietly paid for every meal on the board.',
  'The diner owner, Marcus Webb, didn''t notice until a waitress came back with a confused look. "Table 4 says their bill''s already covered." Then table 7. Then the whole room. Dorothea had left $400 at the register with a note that read: "Everyone deserves a warm meal today." She was gone before anyone could thank her. Marcus framed the note. It still hangs above the register.',
  'That morning became a story Marcus tells every new employee. Three years later, a regular named James — who had been one of the people at the diner that day — paid forward every bill on a Tuesday in January. He said he''d been waiting for the right moment. The diner now calls it "Dorothea''s Tuesday."',
  2019, 1, 'United States', 'Portland',
  (select id from archive_chapters where slug = 'kindness' limit 1),
  array['pay it forward', 'diner', 'community'],
  'Marcus Webb', false, 'I witnessed this',
  'en', true, 9, true,
  now()
),
(
  'live',
  'During the 2014 World Cup in Brazil, a young volunteer interpreter named Felipe Andrade spent every match day guiding lost foreign fans through São Paulo — not as a job, but because he could not stand to see people miss the thing they had traveled so far to see.',
  'Felipe was 22 and between jobs. He had no uniform, no lanyard, no official role. He just showed up at the main fan zone each morning with his English and Spanish and a hand-drawn map he''d made the night before. Over three weeks he helped more than two hundred people — a family from Japan who had taken a wrong bus, a group of elderly Ghanaian fans whose phones had died, a German couple whose tickets had been printed at the wrong stadium. He never asked for anything.',
  'A journalist covering the tournament wrote a short piece about him. It was picked up internationally. Within a week, FIFA contacted Felipe and offered him an official role at the 2018 World Cup in Russia. He accepted. He still makes hand-drawn maps.',
  2014, 6, 'Brazil', 'São Paulo',
  (select id from archive_chapters where slug = 'kindness' limit 1),
  array['World Cup', 'volunteer', 'lost tourists'],
  'Felipe Andrade', false, 'This happened to me',
  'en', true, 9, true,
  now()
);

-- Insert characters for story 1
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Dorothea Sousa', 0 from archive_stories where opening ilike '%Dorothea Sousa%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Marcus Webb', 1 from archive_stories where opening ilike '%Dorothea Sousa%' and is_seed = true;

-- Insert characters for story 2
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Felipe Andrade', 0 from archive_stories where opening ilike '%Felipe Andrade%' and is_seed = true;
