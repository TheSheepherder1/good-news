export const SECTIONS = [
  'Art',
  'Culture',
  'Environment',
  'Good News',
  'Health',
  'Science',
  'Sports',
] as const

export type Section = typeof SECTIONS[number]
