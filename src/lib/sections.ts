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
