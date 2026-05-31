export const SECTIONS = [
  'Culture',
  'Environment',
  'Good News',
  'Health',
  'Science',
  'Sports',
] as const

export type Section = typeof SECTIONS[number]
