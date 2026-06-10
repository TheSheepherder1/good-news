export const SECTIONS = [
  'Animals',
  'Art',
  'Culture',
  'Environment',
  'Good News',
  'Health',
  'History',
  'Humanity',
  'Science',
  'Space',
  'Sports',
  'Technology',
] as const

export type Section = typeof SECTIONS[number]

// Display order for the public page (and admin published-tab sorting/filtering).
// Not the same order as SECTIONS (which is alphabetical for admin dropdowns).
export const CATEGORY_ORDER = ['Humanity', 'Culture', 'History', 'Art', 'Health', 'Animals', 'Science', 'Good News', 'Environment', 'Space', 'Technology', 'Sports']
