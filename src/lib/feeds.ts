export type Feed = {
  name: string
  url: string
  category: string
  // true = already editorially curated for positive/good news; LLM bar is lower
  curated: boolean
}

export const RSS_FEEDS: Feed[] = [
  // === Dedicated good-news outlets ===
  {
    name: 'Good News Network',
    url: 'https://www.goodnewsnetwork.org/feed/',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'Positive News',
    url: 'https://www.positive.news/feed/',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'Reasons to be Cheerful',
    url: 'https://reasonstobecheerful.world/feed/',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'Good Good Good',
    url: 'https://www.goodgoodgood.co/feed',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'The Brighter Side',
    url: 'https://www.thebrighterside.news/feed',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'Optimist Daily',
    url: 'https://www.optimistdaily.com/feed/',
    category: 'Good News',
    curated: true,
  },
  {
    name: 'Upworthy',
    url: 'https://www.upworthy.com/rss',
    category: 'Good News',
    curated: true,
  },
  // === Science & discovery ===
  {
    name: 'NASA News',
    url: 'https://www.nasa.gov/news-release/feed/',
    category: 'Science',
    curated: false,
  },
  {
    name: 'Science Daily',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    category: 'Science',
    curated: false,
  },
  {
    name: 'New Scientist',
    url: 'https://www.newscientist.com/feed/home/',
    category: 'Science',
    curated: false,
  },
  // === Health & wellness ===
  {
    name: 'Harvard Health',
    url: 'https://www.health.harvard.edu/blog/feed',
    category: 'Health',
    curated: false,
  },
  // === Nature & environment ===
  {
    name: 'Conservation International',
    url: 'https://www.conservation.org/blog/feed',
    category: 'Environment',
    curated: false,
  },
  {
    name: 'Mongabay',
    url: 'https://news.mongabay.com/feed/',
    category: 'Environment',
    curated: false,
  },
  // === Human interest / culture ===
  {
    name: 'Atlas Obscura',
    url: 'https://www.atlasobscura.com/feeds/latest',
    category: 'Culture',
    curated: false,
  },
  {
    name: 'Mental Floss',
    url: 'https://www.mentalfloss.com/rss',
    category: 'Culture',
    curated: false,
  },
  {
    name: 'Smithsonian Magazine',
    url: 'https://www.smithsonianmag.com/rss/latest_articles/',
    category: 'Culture',
    curated: false,
  },
  // === Science & discovery (additional) ===
  {
    name: 'Live Science',
    url: 'https://www.livescience.com/feeds/all',
    category: 'Science',
    curated: false,
  },
  {
    name: 'Popular Science',
    url: 'https://www.popsci.com/feed/',
    category: 'Science',
    curated: false,
  },
  // === Human interest / solutions ===
  {
    name: 'Yes! Magazine',
    url: 'https://www.yesmagazine.org/feed',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'Next City',
    url: 'https://news.google.com/rss/search?q=site:nextcity.org&hl=en&gl=US&ceid=US:en',
    category: 'Good News',
    curated: false,
  },
  // === Animals & wildlife ===
  {
    name: 'The Dodo',
    url: 'https://news.google.com/rss/search?q=site:thedodo.com&hl=en&gl=US&ceid=US:en',
    category: 'Animals',
    curated: false,
  },
  // === Health (additional) ===
  {
    name: 'NIH News in Health',
    url: 'https://news.google.com/rss/search?q=site:newsinhealth.nih.gov&hl=en&gl=US&ceid=US:en',
    category: 'Health',
    curated: false,
  },
  // === Education ===
  {
    name: 'Edutopia',
    url: 'https://news.google.com/rss/search?q=site:edutopia.org&hl=en&gl=US&ceid=US:en',
    category: 'Good News',
    curated: false,
  },
  // === Science (additional) ===
  {
    name: 'Phys.org',
    url: 'https://news.google.com/rss/search?q=site:phys.org&hl=en&gl=US&ceid=US:en',
    category: 'Science',
    curated: false,
  },
  // === International ===
  {
    name: 'ABC Australia',
    url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    category: 'Science',
    curated: false,
  },
  {
    name: 'RNZ (New Zealand)',
    url: 'https://www.rnz.co.nz/rss/news.xml',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'Global Citizen',
    url: 'https://www.globalcitizen.org/en/content/feed/',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'UN News',
    url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/sci-tech/science/?service=rss',
    category: 'Science',
    curated: false,
  },
  // === International (additional) ===
  {
    name: 'BBC Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'Science',
    curated: false,
  },
  {
    name: 'Japan Times',
    url: 'https://www.japantimes.co.jp/feed/',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'Arab News',
    url: 'https://www.arabnews.com/rss.xml',
    category: 'Good News',
    curated: false,
  },
  {
    name: 'IOL South Africa',
    url: 'https://www.iol.co.za/rss',
    category: 'Good News',
    curated: false,
  },
  // === Animals (additional) ===
  {
    name: 'Audubon Society',
    url: 'https://www.audubon.org/rss.xml',
    category: 'Animals',
    curated: false,
  },
  // === Technology (breakthroughs, not drama) ===
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'Technology',
    curated: false,
  },
  // === Animals & wildlife ===
  {
    name: 'World Wildlife Fund',
    url: 'https://www.worldwildlife.org/magazine/feed',
    category: 'Animals',
    curated: false,
  },
]
