// English source strings for archive UI chrome — auto-translated via useArchiveStrings hook

export type ArchivePageStrings = {
  navArchive: string
  navShareStory: string
  archiveTitle: string
  archiveSubtitle: string
  allStories: string
  filter: string
  clearAll: string
  clearAllFilters: string
  storySingular: string
  storyPlural: string
  filterCountry: string
  anyCountry: string
  filterYear: string
  anyYear: string
  filterWorldEvent: string
  anyEvent: string
  filterLanguage: string
  anyLanguage: string
  filterAuthor: string
  authorPlaceholder: string
  clearAuthor: string
  filterTags: string
  loadingStories: string
  noStoriesFiltered: string
  loadMore: string        // contains {n}
  loadingMore: string
  emptyTitle: string
  emptyBody: string
  emptyShareFirst: string
  todaysNews: string
  historicalBadge: string
  anonymous: string
  storySharedBy: string
  peopleLabel: string
  backToArchive: string
  shareYourStory: string
}

export const ARCHIVE_PAGE_EN: ArchivePageStrings = {
  navArchive: 'Archive',
  navShareStory: 'Share a Story of Goodness',
  archiveTitle: 'The Archive of Human Goodness',
  archiveSubtitle: 'A permanent record of human kindness, courage, and goodness — collected from every corner of the world.',
  allStories: 'All Stories',
  filter: 'Filter',
  clearAll: 'Clear all',
  clearAllFilters: 'Clear all filters',
  storySingular: 'story',
  storyPlural: 'stories',
  filterCountry: 'Country',
  anyCountry: 'Any country',
  filterYear: 'Year',
  anyYear: 'Any year',
  filterWorldEvent: 'World Event',
  anyEvent: 'Any event',
  filterLanguage: 'Language',
  anyLanguage: 'Any language',
  filterAuthor: 'Author Name',
  authorPlaceholder: 'Type a name…',
  clearAuthor: 'Clear',
  filterTags: 'Tags',
  loadingStories: 'Loading stories…',
  noStoriesFiltered: 'No stories found for these filters.',
  loadMore: 'Load more stories ({n} remaining)',
  loadingMore: 'Loading…',
  emptyTitle: 'The archive is just getting started',
  emptyBody: 'Be one of the first to add a story. Every great archive begins with a single act of goodness worth remembering.',
  emptyShareFirst: 'Share the first story',
  todaysNews: "← Today's News",
  historicalBadge: 'Historical Account',
  anonymous: 'Anonymous',
  storySharedBy: 'Story shared by',
  peopleLabel: 'People',
  backToArchive: '← Back to Archive',
  shareYourStory: 'Share your own story',
}

export type ArchiveSubmitStrings = {
  // Header
  headerSubtitle: string
  // Page title
  pageTitle: string
  pageSubtitle: string
  // Section 1
  sectionYourStory: string
  imageLabel1: string
  imageLabel2: string
  imageLabel3: string
  imageCaption: string
  imageUpload: string
  imageUploading: string
  imageRemove: string
  openingLabel: string
  openingPlaceholder: string
  bodyLabel: string
  bodyPlaceholder: string
  impactLabel: string
  impactOptional: string
  impactPlaceholder: string
  // Section 2
  sectionAboutStory: string
  aboutStoryHint: string
  yearLabel: string
  monthLabel: string
  monthOptional: string
  monthDefault: string
  countryLabel: string
  countryDefault: string
  stateLabel: string
  cityLabel: string
  optionalPlaceholder: string
  charactersLabel: string
  charactersHint: string
  addPerson: string
  organizationLabel: string
  organizationOptional: string
  organizationPlaceholder: string
  worldEventLabel: string
  worldEventOptional: string
  worldEventHint: string
  worldEventDefault: string
  tagsLabel: string
  tagsCount: string
  tagsHint: string
  tagLabel: string         // "Tag {n}"
  personLabel: string      // "Person {n}"
  // Section 3
  sectionAboutYou: string
  nameLabel: string
  namePlaceholder: string
  anonymousLabel: string
  anonymousNote: string
  relationshipLabel: string
  relationshipWitnessed: string
  relationshipHappenedToMe: string
  relationshipFamily: string
  relationshipCommunity: string
  relationshipRead: string
  // Check & Submit
  checkButton: string
  checkingButton: string
  checkOptionalNote: string
  checkPassed: string
  checkSuggestions: string
  checkScore: string      // "Score: {n}/10"
  checkChapter: string    // "Suggested chapter: {name}"
  submitButton: string
  submittingButton: string
  submitDisclaimer: string
  // Validation errors
  errorStoryRequired: string
  errorOpeningTooShort: string   // contains {min}
  errorBodyTooShort: string      // contains {min}
  errorImpactTooShort: string    // contains {min}
  errorYearRequired: string
  errorCountryRequired: string
  errorNameRequired: string
  errorRelationshipRequired: string
  errorCheckFailed: string
  errorSubmitFailed: string
  // Success
  successLiveTitle: string
  successReviewTitle: string
  successLiveBody: string
  successLiveChapter: string   // "under the {chapter} chapter"
  successLiveEnd: string
  successReviewBody: string
  successPermanent: string
  backToSite: string
  submitAnother: string
}

export const ARCHIVE_SUBMIT_EN: ArchiveSubmitStrings = {
  headerSubtitle: 'The Archive of Human Goodness',
  pageTitle: 'Share Your Story',
  pageSubtitle: 'Every act of goodness deserves to be remembered. Write yours the way you\'d tell it to a friend.',
  sectionYourStory: 'Your Story',
  imageLabel1: 'Opening image (optional)',
  imageLabel2: 'Mid-story image (optional)',
  imageLabel3: 'Closing image (optional)',
  imageCaption: 'Caption (optional)',
  imageUpload: 'Take a photo or choose from your library',
  imageUploading: 'Uploading…',
  imageRemove: 'Remove',
  openingLabel: 'Opening',
  openingPlaceholder: 'Set the scene. Who is this story about, where were they, and when did this happen?',
  bodyLabel: 'The Story',
  bodyPlaceholder: 'Tell us what happened. What did they do, and why does it matter?',
  impactLabel: 'Impact',
  impactOptional: '(optional)',
  impactPlaceholder: 'What changed because of this? How did it affect the people involved, or the world around them?',
  sectionAboutStory: 'About the Story',
  aboutStoryHint: 'This helps readers find your story. Only Country and Year are required.',
  yearLabel: 'Year',
  monthLabel: 'Month',
  monthOptional: '(if you remember)',
  monthDefault: '— Month —',
  countryLabel: 'Country',
  countryDefault: 'Select a country…',
  stateLabel: 'State / Province',
  cityLabel: 'City',
  optionalPlaceholder: 'optional',
  charactersLabel: 'Main Characters',
  charactersHint: 'Names of the people this story is about — helps readers search by name.',
  addPerson: '+ Add another person',
  organizationLabel: 'Organization',
  organizationOptional: '(optional)',
  organizationPlaceholder: 'e.g. Red Cross, local fire station, a school…',
  worldEventLabel: 'World Event Connection',
  worldEventOptional: '(optional)',
  worldEventHint: 'Was this story connected to a larger world moment?',
  worldEventDefault: '— Not connected to a specific event —',
  tagsLabel: 'Tags',
  tagsCount: '(up to 3)',
  tagsHint: 'One word or short phrase that captures something unique about this story.',
  tagLabel: 'Tag {n}',
  personLabel: 'Person {n}',
  sectionAboutYou: 'About You',
  nameLabel: 'Your Name',
  namePlaceholder: 'How you\'d like to be credited',
  anonymousLabel: 'Display my name as Anonymous',
  anonymousNote: 'Your name is collected for moderation only and will not be shown publicly.',
  relationshipLabel: 'Your relationship to this story',
  relationshipWitnessed: 'I witnessed this',
  relationshipHappenedToMe: 'This happened to me',
  relationshipFamily: 'This is a family story',
  relationshipCommunity: 'This is a community story',
  relationshipRead: 'I read about this',
  checkButton: '✦ Check My Story Before Submitting',
  checkingButton: 'Checking your story…',
  checkOptionalNote: 'Optional — run the same AI quality check our archive uses, before you submit. AI nor Human review will make any textual changes, only review to ensure the story is within the safety and legal guidelines of this library.',
  checkPassed: '✓ Looks great!',
  checkSuggestions: '✎ A few suggestions',
  checkScore: 'Score: {n}/10',
  checkChapter: 'Suggested chapter: {name}',
  submitButton: 'Submit to the Archive',
  submittingButton: 'Submitting your story…',
  submitDisclaimer: 'By submitting, you confirm this is your own original account and that you have the right to share it.',
  errorStoryRequired: 'Please write at least the opening or body of your story.',
  errorOpeningTooShort: 'Opening must be at least {min} characters.',
  errorBodyTooShort: 'Story must be at least {min} characters.',
  errorImpactTooShort: 'Impact must be at least {min} characters if provided.',
  errorYearRequired: 'Year the story occurred is required.',
  errorCountryRequired: 'Country is required.',
  errorNameRequired: 'Your name is required.',
  errorRelationshipRequired: 'Please select your relationship to this story.',
  errorCheckFailed: 'Check failed. Please try again.',
  errorSubmitFailed: 'Submission failed. Please try again.',
  successLiveTitle: 'Your story is live!',
  successReviewTitle: 'Story received — thank you!',
  successLiveBody: 'Your story passed our quality review and has been added to The Archive of Human Goodness',
  successLiveChapter: 'under the {chapter} chapter',
  successLiveEnd: 'It will be here forever.',
  successReviewBody: 'Your story is in our review queue. We\'ll read it carefully before it goes live. Thank you for adding to The Archive of Human Goodness.',
  successPermanent: 'Once submitted, stories are permanent. Your words will be preserved exactly as you wrote them.',
  backToSite: 'Back to The Good I Found',
  submitAnother: 'Submit another story',
}
