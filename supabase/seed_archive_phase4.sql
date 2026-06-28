-- Archive seed stories — Phase 4
-- 27 stories across all 9 chapters
-- 2 tied to world events (covid-19, olympics-2024); 25 without

-- ============================================================
-- KINDNESS
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'On a bitterly cold December night in 2022, a pharmacist named Nadia Okonkwo drove forty minutes back to her closed store in Toronto after she realized she had filled an insulin prescription at the wrong dosage.',
  'The customer, an elderly man named Harold Finch, had already gone home by the time she caught the error reviewing her evening receipts. She found his number in the system, called him, and drove to his apartment at eleven at night to personally hand him the corrected medication and sit with him while he checked his blood sugar. She refused any suggestion of payment. "I was the one who made the error," she told him. "This is the only right thing to do." She stayed forty-five minutes to make sure he was stable.',
  'Harold''s daughter, who had been in the next room, wrote a letter to the provincial pharmacy board describing what Nadia had done. The letter was included in a Canadian pharmaceutical ethics publication as a case study in patient-centered care. Nadia still works the same counter at the same store. She says she does not think of that night as unusual.',
  2022, 12, 'Canada', 'Toronto',
  (select id from archive_chapters where slug = 'kindness' limit 1),
  array['pharmacy', 'patient care', 'midnight'],
  'Harold Finch', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, world_event_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'At the 2024 Paris Olympics, a French volunteer named Sophie Leclerc noticed a deaf-blind man sitting alone in the stands at the Aquatics Centre with no interpreter and no way to follow the race — and spent the entire swimming final describing every stroke to him through his hands.',
  'The man''s name was André. His support worker had been called away to a medical situation in another section. Sophie had been assigned to general wayfinding. She had taken one university course in tactile communication and was not fluent. She used what she knew. She pressed his fingers to indicate each stroke change, tapped his wrist at the turn, and squeezed his hand hard when France''s swimmer touched the wall first. André''s whole posture changed. He turned toward her and signed something slowly. His support worker, returning minutes later, translated: "She gave me the race."',
  'Sophie posted nothing about it. André''s support worker wrote about it three weeks later with André''s permission. The post spread widely in the deaf-blind community. André sent a handwritten card to the Paris Olympics volunteer office addressed simply to "Sophie at the Aquatics Centre." It found her. She keeps it on her desk.',
  2024, 8, 'France', 'Paris',
  (select id from archive_chapters where slug = 'kindness' limit 1),
  (select id from world_events where slug = 'olympics-2024' limit 1),
  array['Olympics', 'deaf-blind', 'volunteer'],
  'Sophie Leclerc', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In the spring of 2021, a Nashville elementary school principal named Arthur Greer paid off $47,000 in outstanding lunch debt for 200 families — using his own savings and a quiet three-month fundraiser — without telling his staff or the families until every account had been cleared.',
  'The debt had accumulated over two years, through the pandemic and its aftermath. Under district policy, students with arrears received a cold-cheese sandwich instead of a hot lunch. Arthur had watched it happen and paid small amounts individually for years. In the fall of 2020 he decided to find a way to clear it entirely. He contacted local businesses privately and contributed his annual performance bonus. He kept his goal to himself to avoid families feeling observed. In April 2021, when the last account cleared, he sent a letter to each family saying simply: your balance is zero.',
  'A parent posted the letter online. By the following morning it had been shared more than 80,000 times. The school received donations from 37 states. Arthur used the overflow to establish a permanent cafeteria hardship fund so the situation could not recur. He has continued as principal at the same school.',
  2021, 4, 'United States', 'Nashville',
  (select id from archive_chapters where slug = 'kindness' limit 1),
  array['school lunch', 'principal', 'debt'],
  'Arthur Greer', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- COURAGE
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2019, a fifteen-year-old named Priya Sharma stood up during a school assembly in Melbourne, in front of four hundred students and twenty teachers, and named the three boys who had been harassing her friend online for eight months.',
  'She had written a three-minute speech and practiced it forty-six times. Her mother told her it was too risky. Her friend told her it was unnecessary. But Priya had watched her friend stop eating lunch in the cafeteria and stop raising her hand in class, and decided that doing nothing was its own kind of choice. She walked to the microphone during the open remarks portion of the assembly and named the boys calmly and by full name. The principal was unprepared. The room went silent. Two of the three boys were suspended by the end of the week.',
  'Her friend returned to eating lunch in the cafeteria the following Monday. One of the suspended boys sent a handwritten apology eight months later, after mandatory counseling. He wrote that no one had made him feel the weight of what he had done until that assembly. Priya is now studying law.',
  2019, 3, 'Australia', 'Melbourne',
  (select id from archive_chapters where slug = 'courage' limit 1),
  array['bullying', 'school', 'standing up'],
  'Priya Sharma', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2016, a maintenance worker named Eduardo Lima reported his employer — a food processing plant in São Paulo — to health regulators after discovering the facility had been falsifying safety inspection records for three years.',
  'Eduardo had worked there for eleven years and was two years from a full pension. His supervisor had shown him the falsified documents not as a confession but as a demonstration of how things were done. Eduardo spent six weeks quietly photographing records on his phone before walking into the regional health authority office on a Tuesday morning. He was fired within forty-eight hours. His colleagues were warned not to speak with him. He applied to more than forty jobs over the following year before finding work.',
  'The facility was shut down for four months and fourteen violations were documented. A Brazilian labor court ruled in Eduardo''s favor two years later, awarding full compensation plus damages. He used part of the settlement to fund a scholarship for his neighbor''s daughter to study food safety at the federal university. He says the hardest part was the year of silence from people he had worked alongside for over a decade.',
  2016, 5, 'Brazil', 'São Paulo',
  (select id from archive_chapters where slug = 'courage' limit 1),
  array['whistleblower', 'workplace safety', 'food industry'],
  'Eduardo Lima', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2021, a retired school counselor named Grace Osei talked a young man back from the railing of a bridge in Accra for forty-seven minutes before emergency help arrived — and then gave him her phone number.',
  'Grace had been walking home from the market when she saw him. She did not call the police first. She set her shopping bag down, walked slowly to a spot nearby, and said: "I am not going to touch you or come any closer. I just don''t want to be alone right now. Will you let me stand here with you?" The young man''s name was Kwame. He was 24 and had just been evicted. Grace talked about her own son, who had struggled at the same age. She talked about the smell of rain on hot pavement, which Kwame said was his favorite smell. She did not argue with his reasons. She stayed until the paramedics arrived.',
  'Kwame called Grace three weeks later. He had found a room and part-time work. She connected him to a community center where she volunteered on weekends. He now volunteers there himself, on Saturdays. Grace says she did not feel brave at the time. "I felt terrified and like I had no choice."',
  2021, 9, 'Ghana', 'Accra',
  (select id from archive_chapters where slug = 'courage' limit 1),
  array['mental health', 'intervention', 'connection'],
  'Grace Osei', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- COMMUNITY
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In the spring of 2020, when a 79-year-old widow named Ruth Abernathy came home from the hospital after hip surgery to find her entire backyard garden destroyed by an ice storm, her neighbors rebuilt it in three days.',
  'Ruth had tended that garden for 41 years. It held her late husband''s rose bush, her granddaughter''s sunflower bed, two apple trees, and a vegetable plot she relied on through the summer. Word spread through the neighborhood group chat. By Saturday morning eighteen people were in her yard, including a retired landscaper from four doors down who brought a truck of topsoil. They worked from eight in the morning to six in the evening. Ruth sat in a lawn chair the entire time and directed them on where everything went.',
  'Ruth told her daughter afterward that when she saw what her neighbors had done, she understood for the first time why her husband had always insisted they stay in that neighborhood when the years got harder. The rose bush bloomed the following June, right on time.',
  2020, 3, 'United States', 'Lexington',
  (select id from archive_chapters where slug = 'community' limit 1),
  array['neighbors', 'garden', 'homecoming'],
  'Ruth Abernathy', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, world_event_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In April 2020, a restaurant owner named Yusuf Hassan closed his dining room in Minneapolis — and then reopened it as a free kitchen for healthcare workers and families who had lost income to the pandemic.',
  'Yusuf had come to Minneapolis from Somalia seventeen years earlier and opened Afro Deli in 2011. When shutdown orders came, he had twenty-three employees. He paid them all through the first month from his personal savings. Then he started cooking. He reached out to a nearby hospital and offered free meals for their staff. By the third week he was feeding 300 people a day. Donations arrived from former customers, then from strangers who had read about it online. The restaurant operated as a community kitchen for four months through the worst of the lockdown.',
  'Three of the volunteers who staffed the kitchen during those months are now full-time employees at Afro Deli. Yusuf was recognized by the Minneapolis City Council. He says the moment he remembers most was when a Somali grandmother came in during the third week and ordered her meal in her own language, and the kitchen understood her.',
  2020, 4, 'United States', 'Minneapolis',
  (select id from archive_chapters where slug = 'community' limit 1),
  (select id from world_events where slug = 'covid-19' limit 1),
  array['restaurant', 'community kitchen', 'pandemic'],
  'Yusuf Hassan', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'When the only bookstore in Mineral Wells, Texas announced it was closing in 2023, the town raised $40,000 in eleven days to keep it open.',
  'The owner, Deborah Crane, had run the store for 28 years. She had not asked for help — she posted a closing notice on the door and began boxing inventory. A regular customer named Leon Park photographed the notice and posted it with a simple caption: "This is where I learned to love reading. If you grew up here, you know this place." The post spread widely. A former employee set up a fundraiser. Deborah found out when a stranger called to say she had donated and wanted to make sure she had the right store.',
  'The store reopened with new shelving, a children''s reading corner that hadn''t existed before, and a pay-what-you-can shelf by the door. Deborah kept every handwritten note that came with a donation. They fill a shoebox she keeps behind the counter.',
  2023, 2, 'United States', 'Mineral Wells',
  (select id from archive_chapters where slug = 'community' limit 1),
  array['bookstore', 'small town', 'community effort'],
  'Deborah Crane', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- SACRIFICE
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2017, a Chicago fire captain named Robert DiSalvo donated one of his kidneys to the seven-year-old daughter of a colleague — a man he had worked alongside for four years but had never been close friends with.',
  'Robert had heard about the girl, Mia, during a shift briefing. Her father James had mentioned it once, matter-of-factly, not asking for anything. Robert went home that night and looked up living kidney donation. He was tested quietly, without telling anyone at the station, and found he was compatible. He told his wife first, then James. It took James three weeks to accept the offer. The surgery took place in March and went without complication. Robert was back at the station within eight weeks.',
  'Mia turned sixteen in 2026. She plays club volleyball. Her father sent Robert a photograph every year on the anniversary of the surgery, without fail. Robert keeps them in a folder on his phone. He has never told anyone at the station. James has never stopped trying to find adequate words.',
  2017, 3, 'United States', 'Chicago',
  (select id from archive_chapters where slug = 'sacrifice' limit 1),
  array['kidney donation', 'firefighter', 'living donor'],
  'James (Mia''s father)', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2015, a 22-year-old named Amara Diallo deferred her acceptance to medical school in Paris to spend one year at home in Dakar caring for her mother, who had been diagnosed with early-stage dementia.',
  'Her professors warned her that one year could become two. Her mother, on her clearest days, begged her to go. Amara stayed anyway. She built a daily routine with her mother: the same breakfast, the same evening walk, the same song her mother had sung to her as a child — a song she could still remember even on days when she could not remember her daughter''s face. When the year ended, Amara returned to Paris as planned.',
  'Amara graduated from medical school in 2022, specializing in geriatric care — a field she had not considered before that year at home. Her mother died in 2023, peacefully. In her last clear weeks, she told Amara that the year they had spent together was the best year of her life.',
  2015, 8, 'Senegal', 'Dakar',
  (select id from archive_chapters where slug = 'sacrifice' limit 1),
  array['dementia', 'family', 'medical school'],
  'Amara Diallo', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2019, a secondary school teacher in Glasgow named Janet MacPherson used £12,000 from an early pension withdrawal to quietly pay the outstanding school costs for three students who were at risk of being pushed out of the school system.',
  'The three students came from families that had lost income unexpectedly within the same year. The school''s hardship fund was exhausted. Janet had learned about their situations through her role as year tutor. She did not tell the students. She did not tell the administration where the money came from. She told her husband, who said it was their money to do with as they chose. The three students completed the academic year and sat their exams.',
  'Janet retired three years later than she had planned, to make up the difference. One of the three students — now in university — found out through a school administrator at a reunion event years later. He called Janet on a Sunday morning and cried for most of the call. Janet said: "I just wanted them to finish their year. I didn''t think it needed to be more complicated than that."',
  2019, 1, 'United Kingdom', 'Glasgow',
  (select id from archive_chapters where slug = 'sacrifice' limit 1),
  array['teacher', 'school fees', 'pension'],
  'Janet MacPherson', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- LOVE
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2014, a 71-year-old retired bus driver named Walter Crane taught himself American Sign Language so he could talk to his granddaughter Maya, who was born deaf and had been growing up without being able to have a real conversation with him.',
  'Walter had never learned any language beyond English. He bought three workbooks and watched instructional videos online, which he described as "more confusing than the books." He practiced every evening. His wife thought he was losing his mind. Maya''s parents had tried to teach him before, but it hadn''t stuck when it felt like homework. This time Walter decided to learn it the way he had learned everything else in his life: by doing it badly, repeatedly, until he didn''t. Maya was seven the first time he signed "I love you" correctly. She studied his hand position, corrected it slightly, and signed it back.',
  'Walter is now 83 and still signing. He and Maya have real conversations. He has told her things about his own childhood he had never told anyone else — because, he says, he had never before had quite the right listener.',
  2014, null, 'United States', 'Tulsa',
  (select id from archive_chapters where slug = 'love' limit 1),
  array['sign language', 'grandparent', 'deaf'],
  'Walter Crane', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'Between 1979 and 2014, a couple in County Cork, Ireland — Brigid and Seamus Malone — fostered 52 children.',
  'They started at 29, when their own children were young. The first child placed with them was a seven-year-old boy who stayed eight months. He arrived with one shoe. They never planned to continue — each placement was supposed to be the last. But there was always another call, and Brigid always answered. Seamus installed a bunk bed that was never unoccupied for thirty-five years. Not every placement was easy. Two were very hard. Brigid says those are the ones she still thinks about most.',
  'In 2015, a group of former foster children organized a gathering. Forty-one of the 52 attended. Seamus had died the year before. Brigid sat in an armchair at the center of the room while forty-one adults came to find her one by one. "I didn''t know what to say," she told her daughter afterward. "I just kept saying their names."',
  2015, 6, 'Ireland', 'County Cork',
  (select id from archive_chapters where slug = 'love' limit 1),
  array['foster care', 'family', 'devotion'],
  'Brigid Malone', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2021, a 34-year-old named Daniel Okafor received a letter from a woman in Lagos saying she was his birth mother — and that she had been searching for him since the day she placed him for adoption in 1987.',
  'Daniel had grown up in Birmingham with an adoptive family who had always been honest about what little they knew: that he had been born in Nigeria, that the adoption was through a licensed agency, and that they had no further information. He had not searched for more. The letter arrived at his parents'' address — his birth mother had found them through agency records after Nigeria passed an adoption disclosure law in 2019. Daniel sat on his parents'' kitchen floor and read it three times. Then he called his mother — his adoptive mother — and read it aloud to her. She was crying before he finished the first page.',
  'Daniel flew to Lagos in the spring of 2022. He met his birth mother, two half-sisters, and an uncle who had his exact laugh. He has returned three times since. He says he does not think of it as finding a missing piece. He thinks of it as his life getting larger.',
  2021, 11, 'United Kingdom', 'Birmingham',
  (select id from archive_chapters where slug = 'love' limit 1),
  array['adoption', 'reunion', 'identity'],
  'Daniel Okafor', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- RESILIENCE
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2010, three years after arriving in Edmonton as a refugee from Eritrea, a woman named Selam Tesfaye used her savings and two rented rooms above a laundromat to open a Saturday tutoring program for East African immigrant children whose parents were navigating the same transition she had.',
  'Selam had been a primary school teacher in Asmara. In Canada, her credentials were not recognized. She worked night shifts at a grocery distribution warehouse and saved for two years. Her Saturday program started with six students and one whiteboard. By 2015 it had forty students and three volunteer teachers. By 2018 it had moved into a church hall and was running five days a week. Selam tracked every student from enrollment through to whatever came next.',
  'In 2023, the program''s first cohort began graduating from university. Two became teachers. One became a nurse. One is studying engineering. Selam attended the convocation of each one. She still teaches on Saturdays. She has never applied for a grant.',
  2010, 9, 'Canada', 'Edmonton',
  (select id from archive_chapters where slug = 'resilience' limit 1),
  array['refugee', 'education', 'tutoring'],
  'Selam Tesfaye', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'After the 2011 earthquake in Christchurch, New Zealand, a builder named David Taua spent three years rebuilding neighbors'' homes at cost — and sometimes for nothing — after watching outside contractors arrive with quotes that devastated families could not afford.',
  'David had his own business and could have taken insurance work at market rate. Instead he made a list of twelve families on his street and nearby blocks whose damage he knew was real and whose claims had been delayed or disputed. He charged materials only for six of them. He and his crew worked evenings and weekends for three years. His wife kept the accounts. They did not advertise what they were doing. Several families did not discover what they had actually been charged — or not charged — until years later, comparing notes with neighbors.',
  'By 2014, all twelve families had returned to their homes. David''s business survived on commercial work that subsidized the rest. In 2015 he received the New Zealand Order of Merit. At the ceremony he gave the credit entirely to his crew, two of whom had worked for him since their apprenticeships. One of those apprentices now runs the company.',
  2011, 9, 'New Zealand', 'Christchurch',
  (select id from archive_chapters where slug = 'resilience' limit 1),
  array['earthquake', 'rebuilding', 'builder'],
  'David Taua', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2008, a man named Marcus Cole walked out of a federal correctional facility in Georgia after six years, with $200 in gate money and the phone number of a teacher who had told him, before he left, that she would hire him if he ever wanted to work.',
  'The teacher was Elena Reyes, who ran the facility''s GED program. She told every student she thought was serious the same thing. When Marcus called, she was surprised — most didn''t. He had been 24 when he went in. He came out with a GED, some construction skills, and a healthy skepticism about promises. Elena found him work with a contractor she knew. He showed up every day for two years without being asked twice for anything. Then he started his own small company.',
  'Marcus''s company now employs seven people, four of whom he met through the same prison education program. He and Elena return to the facility together twice a year to speak with incarcerated men. He changes his talk each time depending on who he sees in the room. He always ends the same way: "I called because she seemed like she meant it."',
  2008, 7, 'United States', 'Atlanta',
  (select id from archive_chapters where slug = 'resilience' limit 1),
  array['second chance', 'prison', 'education'],
  'Marcus Cole', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- INNOVATION
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2017, a 16-year-old named Chioma Eze built a working water filtration system from locally available materials for her grandmother''s village in Enugu State, Nigeria — after spending a school holiday watching her aunt walk two miles each way to collect water from a stream.',
  'Chioma had read about biosand filters in a school science textbook. She had no money and no lab equipment. She used sand from a local quarry, gravel, charcoal from the market, and a large clay pot. She built four iterations before she got one that worked consistently. She tested the output herself and presented it to the village elders, who tested it independently for a month before allowing it to be used regularly.',
  'The filter is still in use. In 2018 Chioma won a national youth science prize and a university scholarship. She studied environmental engineering and now runs a program teaching the same filter design to secondary school students across six Nigerian states. She says the most important thing she learned from the project was iteration: "The first three didn''t work. That was the point."',
  2017, 7, 'Nigeria', 'Enugu',
  (select id from archive_chapters where slug = 'innovation' limit 1),
  array['water', 'filtration', 'Nigeria'],
  'Chioma Eze', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2019, a software engineer named James Park, who had been blind since birth, built a mobile application that uses haptic feedback to help blind users navigate grocery stores independently — because every existing solution he tried required visual confirmation at some point.',
  'James spent eight months building the app in the evenings after his day job. It uses a store''s existing Wi-Fi infrastructure to triangulate position and communicates via vibration patterns he designed himself: slow pulses for an open aisle, rapid taps at a junction, a long hold when the target item is within reach. He tested it alone in three different grocery stores and released it for free. Within a year, three grocery chains in South Korea had formally adopted it.',
  'A message from a user in Busan read: "I went to the store alone for the first time in eleven years." James printed it and keeps it on his desk. The app is now open source with contributors in twelve countries.',
  2019, 4, 'South Korea', 'Seoul',
  (select id from archive_chapters where slug = 'innovation' limit 1),
  array['accessibility', 'blindness', 'technology'],
  'James Park', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'Over twenty years of farming through recurring drought in Rajasthan, India, a farmer named Prakash Meghwal developed a dryland cultivation technique that reduced his water use by 60 percent and increased his yields — through careful observation, deliberate failure, and handwritten records kept across 26 notebooks.',
  'Prakash had no formal agricultural training beyond what he learned from his father. He started keeping a daily log in 1998 after a devastating drought year. He tracked rainfall, soil conditions, planting dates, and yields, changing one variable per growing season. By 2006 he was achieving a maize yield on 40 percent of the water his neighbors used. He shared his notebooks freely with anyone who asked. By 2012, eleven neighboring families had adopted the core techniques.',
  'An agricultural NGO documented Prakash''s method in 2015 and distributed it across Rajasthan. It is now used by more than 400 farming families. Prakash still keeps the notebooks. He says the most important line in the first one is the last entry of that year: "Did not know what I was doing. Started anyway."',
  2006, null, 'India', 'Rajasthan',
  (select id from archive_chapters where slug = 'innovation' limit 1),
  array['farming', 'drought', 'water conservation'],
  'Prakash Meghwal', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- ENVIRONMENT
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'Beginning in 1979, a man named Jadav Payeng planted a forest on a barren sandbar in Assam, India — alone and without recognition for decades — until it grew larger than Central Park and became home to elephants, tigers, and rhinoceros.',
  'Jadav was 16 when he saw snakes dying on the sandbar after a flood had stripped it bare. He brought bamboo shoots and planted them. He came back every day. He told no one for years. The local forest department discovered what he had done in 2008, when an officer could not believe that the 550-hectare forest he was standing in had been planted by a single person. By then there were birds, deer, tigers, and herds of elephants that came seasonally. Jadav still lived nearby and tended it as he always had.',
  'The forest — named Molai Forest after Jadav''s childhood nickname — is now a protected wildlife reserve documented by researchers from multiple countries. When asked why he did it, Jadav has said he has never known how to answer, because the question never occurred to him. There was a dead sandbar. He planted trees. He kept planting.',
  1979, null, 'India', 'Assam',
  (select id from archive_chapters where slug = 'environment' limit 1),
  array['reforestation', 'one person', 'wildlife'],
  'Jadav Payeng', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'For twenty-two years, a marine biologist named Alejandro Cruz spent every one of his vacation weeks diving in the waters off the Yucatán coast to remove ghost gear — abandoned fishing nets that continue trapping and killing marine life long after they are lost.',
  'Alejandro estimated that in his first year alone he removed enough netting to fill a small truck. He dived mostly alone, occasionally with one or two volunteers. Over time he built a relationship with local fishermen who began reporting lost gear to him and sometimes joined the dives. Over two decades he catalogued 1,400 individual pieces of ghost gear, documented the species found trapped, and published the data in fisheries journals — contributing to a regional gear-marking program that helped reduce future losses.',
  'In 2023, the government of Yucatán adopted a ghost gear reporting protocol modeled on the informal system Alejandro had been running for a decade. He was not invited to the announcement ceremony. A journalist called to ask for a comment. His comment was: "Good."',
  2001, null, 'Mexico', 'Yucatán',
  (select id from archive_chapters where slug = 'environment' limit 1),
  array['ocean', 'ghost gear', 'marine life'],
  'Alejandro Cruz', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2009, a schoolteacher named Nguyen Thi Lan organized the first cleanup of the To Lich River in Hanoi — a waterway used as an open drainage canal for decades — with seventeen volunteers, no budget, and no official support.',
  'Lan had walked past the river every day for eight years. She posted a notice on a neighborhood community board. Seventeen people showed up on a Saturday morning. They removed what they could carry by hand. The river looked unchanged by Sunday. She posted again the following week. Twenty-three people came. Over two years the group grew to more than 300 regular volunteers. They removed 800 tons of debris in their first three years and lobbied the city for official support. In 2014, the city contributed dredging equipment and partial funding.',
  'The river is not clean. Lan is the first to say this. But the volunteer network she built became the foundation of the Hanoi River Watch — a nonprofit that now monitors five waterways and has influenced municipal environmental policy three times. Lan still walks past the river every morning.',
  2009, 4, 'Vietnam', 'Hanoi',
  (select id from archive_chapters where slug = 'environment' limit 1),
  array['river', 'cleanup', 'organizing'],
  'Nguyen Thi Lan', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- JOY
-- ============================================================

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'Over seventeen years on his mail route in Portland, Oregon, a carrier named Harold Park learned the name of every dog he delivered to — 127 in total — and kept a handwritten index card for each one noting their name, breed, temperament, treat preference, and birthday.',
  'Harold says it started practically: knowing a dog''s name calmed it down and made deliveries faster. But somewhere around year four it had stopped being practical and become something else. He noted birthdays from collar tags. He carried treats. When a dog died, he left a handwritten note for the family. When a new dog appeared, he introduced himself on the first visit. People began moving onto his route intentionally. One family told their realtor to find them a house "where the guy with the cards" delivered.',
  'When Harold retired in 2023, three hundred people organized his last day in secret. Every family came out with their dog. Harold walked the full route one final time, stopping at every house, each dog getting a last treat. He still has all 127 cards.',
  2023, 5, 'United States', 'Portland',
  (select id from archive_chapters where slug = 'joy' limit 1),
  array['mail carrier', 'dogs', 'small joys'],
  'Harold Park', false, 'This happened to me',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'In 2018, a 91-year-old woman named Vera Bowman started a ukulele band at her nursing home in Bristol — with four residents, a second-hand ukulele she had never played, and no musical training — because she had always meant to learn and decided that meant now.',
  'Vera learned four chords from a YouTube video her great-granddaughter helped her find. She taught the same four chords to the four residents who said yes when she knocked on their doors. They were not good. They played "You Are My Sunshine" for the first three months almost exclusively. By the end of the year there were eight members. They performed at the Christmas party and received a standing ovation from an audience of forty — including three staff members who had worked there for over a decade and had never seen anyone stand up before.',
  'Vera died in 2022 at 95, still playing. The Tuesday and Thursday sessions continue under the name "Vera''s Band." There are seven members. They are still not good. They know this. They play anyway. Every performance ends with "You Are My Sunshine."',
  2018, 10, 'United Kingdom', 'Bristol',
  (select id from archive_chapters where slug = 'joy' limit 1),
  array['ukulele', 'nursing home', 'music'],
  'Vera''s great-granddaughter', false, 'I witnessed this',
  'en', true, 9, true, now()
);

insert into archive_stories (
  status, opening, body, impact,
  occurred_year, occurred_month, country, city,
  chapter_id, tags, author_name, is_anonymous, relationship,
  original_language, ai_passed, ai_score, is_seed, published_at
) values (
  'live',
  'For eleven years, a librarian named Margaret Cho at a branch library in Vancouver hid small hand-painted bookmarks inside books she thought deserved more readers — each one painted in watercolor, each one different, each one a small surprise for whoever found it.',
  'Margaret had painted since she was a child. She made the bookmarks at home in the evenings, painting something suggested by the book — a color, a symbol, a fragment of a scene. She placed them near the middle of books that hadn''t been checked out in over a year. She told no one. The first person who found one came to the desk in 2013 and asked who had made it. Margaret said she didn''t know. By 2017, people were visiting the branch specifically to search for them. A local blog called "Finding Margaret''s Marks" had thousands of followers.',
  'She confirmed she was the one in 2019, after a child found a bookmark and burst into tears at the reference desk because she had been looking for one for two years. That year, library circulation at the branch increased by 23 percent. Margaret retired in 2024. Her last bookmark was painted entirely gold. She placed it in her own favorite book and left it on the shelf without telling anyone which book it was.',
  2013, null, 'Canada', 'Vancouver',
  (select id from archive_chapters where slug = 'joy' limit 1),
  array['library', 'bookmarks', 'hidden art'],
  'Margaret Cho', false, 'This happened to me',
  'en', true, 9, true, now()
);

-- ============================================================
-- CHARACTERS
-- ============================================================

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Nadia Okonkwo', 0 from archive_stories where opening ilike '%Nadia Okonkwo%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Harold Finch', 1 from archive_stories where opening ilike '%Nadia Okonkwo%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Sophie Leclerc', 0 from archive_stories where opening ilike '%Sophie Leclerc%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'André', 1 from archive_stories where opening ilike '%Sophie Leclerc%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Arthur Greer', 0 from archive_stories where opening ilike '%Arthur Greer%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Priya Sharma', 0 from archive_stories where opening ilike '%Priya Sharma%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Eduardo Lima', 0 from archive_stories where opening ilike '%Eduardo Lima%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Grace Osei', 0 from archive_stories where opening ilike '%Grace Osei%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Kwame', 1 from archive_stories where opening ilike '%Grace Osei%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Ruth Abernathy', 0 from archive_stories where opening ilike '%Ruth Abernathy%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Yusuf Hassan', 0 from archive_stories where opening ilike '%Yusuf Hassan%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Deborah Crane', 0 from archive_stories where opening ilike '%Deborah Crane%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Robert DiSalvo', 0 from archive_stories where opening ilike '%Robert DiSalvo%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Amara Diallo', 0 from archive_stories where opening ilike '%Amara Diallo%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Janet MacPherson', 0 from archive_stories where opening ilike '%Janet MacPherson%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Walter Crane', 0 from archive_stories where opening ilike '%Walter Crane%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Maya', 1 from archive_stories where opening ilike '%Walter Crane%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Brigid Malone', 0 from archive_stories where opening ilike '%Brigid and Seamus Malone%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Seamus Malone', 1 from archive_stories where opening ilike '%Brigid and Seamus Malone%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Daniel Okafor', 0 from archive_stories where opening ilike '%Daniel Okafor%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Selam Tesfaye', 0 from archive_stories where opening ilike '%Selam Tesfaye%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'David Taua', 0 from archive_stories where opening ilike '%David Taua%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Marcus Cole', 0 from archive_stories where opening ilike '%Marcus Cole%' and is_seed = true;
insert into archive_story_characters (story_id, name, sort_order)
select id, 'Elena Reyes', 1 from archive_stories where opening ilike '%Marcus Cole%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Chioma Eze', 0 from archive_stories where opening ilike '%Chioma Eze%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'James Park', 0 from archive_stories where opening ilike '%James Park%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Prakash Meghwal', 0 from archive_stories where opening ilike '%Prakash Meghwal%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Jadav Payeng', 0 from archive_stories where opening ilike '%Jadav Payeng%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Alejandro Cruz', 0 from archive_stories where opening ilike '%Alejandro Cruz%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Nguyen Thi Lan', 0 from archive_stories where opening ilike '%Nguyen Thi Lan%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Harold Park', 0 from archive_stories where opening ilike '%Harold Park%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Vera Bowman', 0 from archive_stories where opening ilike '%Vera Bowman%' and is_seed = true;

insert into archive_story_characters (story_id, name, sort_order)
select id, 'Margaret Cho', 0 from archive_stories where opening ilike '%Margaret Cho%' and is_seed = true;
