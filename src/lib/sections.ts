export const SECTIONS = [
  'Animals',
  'Art',
  'Culture',
  'Environment',
  'Good News',
  'Health',
  'Humanity',
  'Science',
  'Sports',
] as const

export type Section = typeof SECTIONS[number]
