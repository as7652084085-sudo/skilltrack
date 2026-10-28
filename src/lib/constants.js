export const LANGS = {
  en: {
    id: 'en',
    label: 'English',
    native: 'English',
    speech: 'en-IN',
    short: 'EN',
    other: 'hi',
  },
  hi: {
    id: 'hi',
    label: 'Hindi',
    native: 'हिंदी',
    speech: 'hi-IN',
    short: 'हिं',
    other: 'en',
  },
}

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8]

export const GRADE_BANDS = {
  early: {
    id: 'early',
    label: 'Early Reader',
    title: 'Phonics & Sight Words',
    classes: 'Class 1–2',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    solid: 'bg-emerald-500',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    emoji: '🌱',
    note: 'Short sound-out stories, simple words and picture-level writing.',
  },
  growing: {
    id: 'growing',
    label: 'Growing Reader',
    title: 'Fluency & Paragraphs',
    classes: 'Class 3–5',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    solid: 'bg-blue-600',
    text: 'text-blue-600',
    soft: 'bg-blue-50',
    ring: 'ring-blue-200',
    emoji: '📘',
    note: 'Sanyukt akshar, 50–70 word passages and full paragraph writing.',
  },
  advanced: {
    id: 'advanced',
    label: 'Advanced Learner',
    title: 'Comprehension & Essays',
    classes: 'Class 6–8',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    solid: 'bg-amber-500',
    text: 'text-amber-600',
    soft: 'bg-amber-50',
    ring: 'ring-amber-200',
    emoji: '🚀',
    note: '100–150 word comprehension, formal alekh and advanced vocabulary.',
  },
}

export const getBand = (grade) => {
  if (grade <= 2) return GRADE_BANDS.early
  if (grade <= 5) return GRADE_BANDS.growing
  return GRADE_BANDS.advanced
}

export const READING_TARGETS = { 1: 25, 2: 35, 3: 45, 4: 55, 5: 65, 6: 80, 7: 90, 8: 100 }

export const WRITING_TARGETS = { 1: 20, 2: 30, 3: 50, 4: 70, 5: 100, 6: 120, 7: 150, 8: 180 }

export const DAILY_GOALS = { 1: 40, 2: 50, 3: 80, 4: 100, 5: 120, 6: 150, 7: 180, 8: 200 }

export const getReadingTarget = (grade) => READING_TARGETS[grade] ?? 60
export const getWritingTarget = (grade) => WRITING_TARGETS[grade] ?? 100
export const getDailyGoal = (grade) => DAILY_GOALS[grade] ?? 120

export const POS_LABELS = {
  en: {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    adverb: 'Adverb',
    phrase: 'Phrase',
  },
  hi: {
    noun: 'संज्ञा',
    verb: 'क्रिया',
    adjective: 'विशेषण',
    adverb: 'क्रिया-विशेषण',
    phrase: 'वाक्यांश',
  },
}

export const DAILY_QUIZ_SIZE = 3
export const QUIZ_PASS_MARK = 2

export const NAV_ITEMS = [
  { id: 'read', label: 'Read', labelHi: 'पढ़ें', icon: 'book' },
  { id: 'write', label: 'Write', labelHi: 'लेखन', icon: 'pen' },
  { id: 'vocab', label: 'Vocab', labelHi: 'शब्द', icon: 'bulb' },
  { id: 'track', label: 'Track', labelHi: 'प्रगति', icon: 'chart' },
]

export const STORAGE_KEY = 'skilltrack:state:v1'
export const DRAFT_KEY = 'skilltrack:drafts:v1'

export const DEFAULT_STATE = {
  profile: null,
  sessions: [],
  essays: [],
  mastered: [],
  challenging: [],
  quizLog: [],
  activity: {},
  demo: false,
  createdAt: null,
}
