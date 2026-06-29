export const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en', zh: 'zh-CN', de: 'de', nl: 'nl', es: 'es',
  fr: 'fr', pl: 'pl', pt: 'pt', ja: 'ja', sr: 'sr',
}

export const COUNTRY_CODES = [
  'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ',
  'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI',
  'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ',
  'DK', 'DJ', 'DM', 'DO',
  'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET',
  'FK', 'FO', 'FJ', 'FI', 'FR',
  'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY',
  'HT', 'HM', 'VA', 'HN', 'HK', 'HU',
  'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT',
  'JM', 'JP', 'JE', 'JO',
  'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG',
  'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU',
  'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM',
  'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO',
  'OM',
  'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR',
  'QA',
  'RE', 'RO', 'RU', 'RW',
  'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY',
  'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV',
  'UG', 'UA', 'AE', 'GB', 'UM', 'US', 'UY', 'UZ',
  'VU', 'VE', 'VN', 'VG', 'VI',
  'WF', 'EH',
  'YE',
  'ZM', 'ZW',
] as const

export type CountryCode = typeof COUNTRY_CODES[number]

export function getCountryName(code: string, lang = 'en'): string {
  if (!code) return ''
  try {
    const locale = LANG_TO_LOCALE[lang] || 'en'
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

export function getAllCountriesSorted(lang = 'en'): { code: string; name: string }[] {
  const locale = LANG_TO_LOCALE[lang] || 'en'
  const dn = new Intl.DisplayNames([locale], { type: 'region' })
  return [...COUNTRY_CODES]
    .map(code => ({ code, name: dn.of(code) || code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}
