export type UIStrings = {
  siteTitle: string
  tagline: string
  brightSpot: string
  storyOfGoodness: string
  browseArchive: string
  shareStoryOfGoodness: string
  searchPlaceholder: string
  topOfPage: string
  sections: string
  sourcePrefix: string
  noStories: string
  noResults: string
  resultCount: string
  about: string
  aiPolicy: string
  advertisingPolicy: string
  shareStory: string
  shareStoryWithUs: string
  enjoyingGoodNews: string
  supportUs: string
  supportTheGood: string
  footerCopyright: string
  catNew: string
  catAnimals: string
  catArt: string
  catCulture: string
  catEnvironment: string
  catGoodNews: string
  catHealth: string
  catHistory: string
  catHumanity: string
  catScience: string
  catSpace: string
  catSports: string
  catTechnology: string
}

export const UI_EN: UIStrings = {
  siteTitle: 'The Good I Found',
  tagline: 'Stories of Kindness, Progress, and Hope from Around the World',
  brightSpot: "Today's Bright Spot",
  storyOfGoodness: 'A Story of Goodness',
  browseArchive: 'Archive of Goodness',
  shareStoryOfGoodness: 'Share a Story of Goodness',
  searchPlaceholder: 'Search stories…',
  topOfPage: 'Top of Page',
  sections: 'Sections',
  sourcePrefix: 'Source: ',
  noStories: 'No stories yet — check back soon!',
  noResults: 'No stories found for "{q}"',
  resultCount: '{n} stories matching "{q}"',
  about: 'About',
  aiPolicy: 'AI Policy',
  advertisingPolicy: 'Advertising Policy',
  shareStory: 'Share a Story',
  shareStoryWithUs: 'Share a Story of Goodness with Us!',
  enjoyingGoodNews: 'Enjoying the Good News?',
  supportUs: 'Support Us ❤️',
  supportTheGood: 'Support the Good',
  footerCopyright: 'All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content.',
  catNew: 'New!',
  catAnimals: 'Animals',
  catArt: 'Art',
  catCulture: 'Culture',
  catEnvironment: 'Environment',
  catGoodNews: 'Good News',
  catHealth: 'Health',
  catHistory: 'History',
  catHumanity: 'Humanity',
  catScience: 'Science',
  catSpace: 'Space',
  catSports: 'Sports',
  catTechnology: 'Technology',
}

const CATEGORY_KEYS: Record<string, keyof UIStrings> = {
  'New!': 'catNew',
  'Animals': 'catAnimals',
  'Art': 'catArt',
  'Culture': 'catCulture',
  'Environment': 'catEnvironment',
  'Good News': 'catGoodNews',
  'Health': 'catHealth',
  'History': 'catHistory',
  'Humanity': 'catHumanity',
  'Science': 'catScience',
  'Space': 'catSpace',
  'Sports': 'catSports',
  'Technology': 'catTechnology',
}

export function getCategoryLabel(cat: string, t: UIStrings): string {
  const key = CATEGORY_KEYS[cat]
  return key ? t[key] as string : cat
}
