export type Language = 'en' | 'es' | 'fr' | 'de' | 'sr'

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'sr', label: 'Srpski' },
]

export type UIStrings = {
  siteTitle: string
  tagline: string
  brightSpot: string
  searchPlaceholder: string
  topOfPage: string
  sections: string
  sourcePrefix: string
  noStories: string
  noResults: (q: string) => string
  resultCount: (n: number, q: string) => string
  about: string
  aiPolicy: string
  advertisingPolicy: string
  footerCopyright: string
  categories: Record<string, string>
}

export const UI: Record<Language, UIStrings> = {
  en: {
    siteTitle: 'The Good I Found',
    tagline: 'Stories of Kindness, Progress, and Hope from Around the World',
    brightSpot: "Today's Bright Spot",
    searchPlaceholder: 'Search stories…',
    topOfPage: 'Top of Page',
    sections: 'Sections',
    sourcePrefix: 'Source: ',
    noStories: 'No stories yet — check back soon!',
    noResults: (q) => `No stories found for "${q}"`,
    resultCount: (n, q) => `${n} ${n === 1 ? 'story' : 'stories'} matching "${q}"`,
    about: 'About',
    aiPolicy: 'AI Policy',
    advertisingPolicy: 'Advertising Policy',
    footerCopyright: 'All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content.',
    categories: {
      'Animals': 'Animals', 'Good News': 'Good News', 'Science': 'Science', 'Health': 'Health',
      'Environment': 'Environment', 'Culture': 'Culture', 'Art': 'Art',
      'Humanity': 'Humanity', 'Sports': 'Sports', 'Technology': 'Technology',
    },
  },
  es: {
    siteTitle: 'Lo Bueno que Encontré',
    tagline: 'Historias de bondad, progreso y esperanza de todo el mundo',
    brightSpot: 'El Punto Brillante de Hoy',
    searchPlaceholder: 'Buscar historias…',
    topOfPage: 'Inicio de Página',
    sections: 'Secciones',
    sourcePrefix: 'Fuente: ',
    noStories: 'Aún no hay historias — ¡vuelve pronto!',
    noResults: (q) => `No se encontraron historias para "${q}"`,
    resultCount: (n, q) => `${n} ${n === 1 ? 'historia' : 'historias'} que coinciden con "${q}"`,
    about: 'Acerca de',
    aiPolicy: 'Política de IA',
    advertisingPolicy: 'Política de Publicidad',
    footerCopyright: 'Todas las historias © sus respectivos editores. The Good I Found selecciona enlaces a fuentes originales y no reclama la propiedad de ningún contenido.',
    categories: {
      'Good News': 'Buenas Noticias', 'Science': 'Ciencia', 'Health': 'Salud',
      'Environment': 'Medio Ambiente', 'Culture': 'Cultura', 'Art': 'Arte',
      'Humanity': 'Humanidad', 'Sports': 'Deportes', 'Animals': 'Animales', 'Technology': 'Tecnología',
    },
  },
  fr: {
    siteTitle: "Le Bien que J'ai Trouvé",
    tagline: "Des histoires de bonté, de progrès et d'espoir du monde entier",
    brightSpot: "Le Point Lumineux du Jour",
    searchPlaceholder: 'Rechercher des histoires…',
    topOfPage: 'Haut de Page',
    sections: 'Sections',
    sourcePrefix: 'Source : ',
    noStories: "Pas encore d'histoires — revenez bientôt !",
    noResults: (q) => `Aucune histoire trouvée pour « ${q} »`,
    resultCount: (n, q) => `${n} histoire${n > 1 ? 's' : ''} correspondant à « ${q} »`,
    about: 'À propos',
    aiPolicy: 'Politique IA',
    advertisingPolicy: 'Politique Publicitaire',
    footerCopyright: "Toutes les histoires © leurs éditeurs respectifs. The Good I Found sélectionne des liens vers des sources originales et ne revendique aucun droit sur le contenu.",
    categories: {
      'Good News': 'Bonnes Nouvelles', 'Science': 'Science', 'Health': 'Santé',
      'Environment': 'Environnement', 'Culture': 'Culture', 'Art': 'Art',
      'Humanity': 'Humanité', 'Sports': 'Sports', 'Animals': 'Animaux', 'Technology': 'Technologie',
    },
  },
  de: {
    siteTitle: 'Das Gute, das ich Fand',
    tagline: 'Geschichten von Freundlichkeit, Fortschritt und Hoffnung aus aller Welt',
    brightSpot: 'Der Lichtblick des Tages',
    searchPlaceholder: 'Geschichten suchen…',
    topOfPage: 'Seitenanfang',
    sections: 'Bereiche',
    sourcePrefix: 'Quelle: ',
    noStories: 'Noch keine Geschichten — schauen Sie bald wieder vorbei!',
    noResults: (q) => `Keine Geschichten gefunden für „${q}"`,
    resultCount: (n, q) => `${n} Geschichte${n !== 1 ? 'n' : ''} passend zu „${q}"`,
    about: 'Über uns',
    aiPolicy: 'KI-Richtlinie',
    advertisingPolicy: 'Werberichtlinie',
    footerCopyright: 'Alle Geschichten © ihre jeweiligen Verlage. The Good I Found kuratiert Links zu Originalquellen und beansprucht kein Eigentum an Inhalten.',
    categories: {
      'Good News': 'Gute Nachrichten', 'Science': 'Wissenschaft', 'Health': 'Gesundheit',
      'Environment': 'Umwelt', 'Culture': 'Kultur', 'Art': 'Kunst',
      'Humanity': 'Menschheit', 'Sports': 'Sport', 'Animals': 'Tiere', 'Technology': 'Technologie',
    },
  },
  sr: {
    siteTitle: 'Dobro koje sam Pronašao',
    tagline: 'Priče o dobroti, napretku i nadi iz celog sveta',
    brightSpot: 'Svetla tačka dana',
    searchPlaceholder: 'Pretraži priče…',
    topOfPage: 'Vrh stranice',
    sections: 'Sekcije',
    sourcePrefix: 'Izvor: ',
    noStories: 'Još nema priča — svratite uskoro!',
    noResults: (q) => `Nisu pronađene priče za „${q}"`,
    resultCount: (n, q) => `${n} ${n === 1 ? 'priča' : 'priče'} odgovara „${q}"`,
    about: 'O nama',
    aiPolicy: 'AI politika',
    advertisingPolicy: 'Politika oglašavanja',
    footerCopyright: 'Sve priče © njihovi odgovarajući izdavači. The Good I Found prikuplja veze do originalnih izvora i ne tvrdi vlasništvo nad sadržajem.',
    categories: {
      'Good News': 'Dobre vesti', 'Science': 'Nauka', 'Health': 'Zdravlje',
      'Environment': 'Životna sredina', 'Culture': 'Kultura', 'Art': 'Umetnost',
      'Humanity': 'Čovečanstvo', 'Sports': 'Sport', 'Animals': 'Životinje', 'Technology': 'Tehnologija',
    },
  },
}
