import { DEFAULT_STATE, DRAFT_KEY, STORAGE_KEY, getWritingTarget } from './constants.js'
import { getPassages } from '../data/passages.js'
import { vocabulary } from '../data/vocabulary.js'
import { dateKey, uid } from './utils.js'

const safeParse = (value) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const emptyState = () => ({
  ...DEFAULT_STATE,
  profile: null,
  sessions: [],
  essays: [],
  mastered: [],
  challenging: [],
  quizLog: [],
  activity: {},
  demo: false,
  createdAt: new Date().toISOString(),
})

export const loadState = () => {
  if (typeof window === 'undefined') return emptyState()
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY))
  if (!raw || typeof raw !== 'object') return emptyState()

  const sessions = Array.isArray(raw.sessions) ? raw.sessions : []
  const essays = Array.isArray(raw.essays) ? raw.essays : []
  const mastered = Array.isArray(raw.mastered) ? raw.mastered : []
  const challenging = Array.isArray(raw.challenging) ? raw.challenging : []
  const quizLog = Array.isArray(raw.quizLog) ? raw.quizLog : []

  return {
    ...emptyState(),
    ...raw,
    profile:
      raw.profile && typeof raw.profile.name === 'string' && raw.profile.grade
        ? {
            name: raw.profile.name,
            grade: Number(raw.profile.grade) || 1,
            lang: raw.profile.lang === 'hi' ? 'hi' : 'en',
            createdAt: raw.profile.createdAt || new Date().toISOString(),
          }
        : null,
    sessions,
    essays,
    mastered,
    challenging,
    quizLog,
    activity: rebuildActivity({ sessions, essays, mastered, quizLog }),
    demo: Boolean(raw.demo),
  }
}

export const saveState = (state) => {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export const loadDrafts = () => {
  if (typeof window === 'undefined') return {}
  const raw = safeParse(window.localStorage.getItem(DRAFT_KEY))
  return raw && typeof raw === 'object' ? raw : {}
}

export const saveDrafts = (drafts) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
  } catch {
    // A full storage quota should never block writing.
  }
}

const localDayKey = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : dateKey(date)
}

const ensureDay = (activity, key) => {
  if (!activity[key]) {
    activity[key] = {
      wordsRead: 0,
      readingSeconds: 0,
      essays: 0,
      wordsWritten: 0,
      mastered: 0,
      quizzes: 0,
      sessions: 0,
    }
  }
  return activity[key]
}

export const rebuildActivity = (records = {}) => {
  const activity = {}
  const { sessions = [], essays = [], mastered = [], quizLog = [] } = records

  sessions.forEach((session) => {
    const key = session?.date ? localDayKey(session.date) : null
    if (!key) return
    const day = ensureDay(activity, key)
    day.wordsRead += Number(session.attempted) || 0
    day.readingSeconds += Number(session.seconds) || 0
    day.sessions += 1
  })

  essays.forEach((essay) => {
    const key = essay?.date ? localDayKey(essay.date) : null
    if (!key) return
    const day = ensureDay(activity, key)
    day.essays += 1
    day.wordsWritten += Number(essay.words) || 0
  })

  mastered.forEach((word) => {
    const key = word?.date ? localDayKey(word.date) : null
    if (!key) return
    const day = ensureDay(activity, key)
    day.mastered += 1
  })

  quizLog.forEach((quiz) => {
    const key = quiz?.date ? localDayKey(quiz.date) : null
    if (!key) return
    const day = ensureDay(activity, key)
    day.quizzes += 1
  })

  return activity
}

export const mergeChallenging = (list = [], words = [], meta = {}) => {
  const next = [...list]
  words.forEach((rawWord) => {
    const word = String(rawWord || '').trim()
    if (!word) return
    const key = `${meta.lang || 'en'}:${word.toLowerCase()}`
    const index = next.findIndex((item) => (item.key || `${item.lang}:${item.word?.toLowerCase()}`) === key)
    if (index >= 0) {
      next[index] = {
        ...next[index],
        date: new Date().toISOString(),
        count: (next[index].count || 1) + 1,
        source: meta.source || next[index].source || 'reading',
      }
    } else {
      next.unshift({
        id: uid(),
        key,
        word,
        lang: meta.lang || 'en',
        grade: meta.grade || null,
        source: meta.source || 'reading',
        date: new Date().toISOString(),
        count: 1,
      })
    }
  })
  return next.slice(0, 100)
}

export const buildDemoState = (profile) => {
  const demoPassages = getPassages(profile.grade, profile.lang)
  const now = new Date()
  const sessions = []
  const essays = []
  const mastered = []
  const challenging = []
  const quizLog = []

  const sessionSeeds = [
    { daysAgo: 6, offset: 0, accuracy: 86, seconds: 72 },
    { daysAgo: 5, offset: 1, accuracy: 89, seconds: 58 },
    { daysAgo: 4, offset: 0, accuracy: 91, seconds: 54 },
    { daysAgo: 3, offset: 1, accuracy: 88, seconds: 61 },
    { daysAgo: 2, offset: 0, accuracy: 93, seconds: 49 },
    { daysAgo: 1, offset: 1, accuracy: 95, seconds: 46 },
    { daysAgo: 0, offset: 0, accuracy: 94, seconds: 44 },
  ]

  sessionSeeds.forEach((seed, index) => {
    const passage = demoPassages[index % demoPassages.length]
    const words = passage.text.trim().split(/\s+/)
    const total = words.length
    const correct = Math.round((total * seed.accuracy) / 100)
    const wpm = Math.round(total / (seed.seconds / 60))
    const date = new Date(now.getTime() - seed.daysAgo * 86400000 - (index % 3) * 3600000)
    const missed = words.filter((_, wordIndex) => wordIndex % 11 === 0).slice(0, 3)
    sessions.push({
      id: `demo-session-${index}`,
      date: date.toISOString(),
      lang: profile.lang,
      grade: profile.grade,
      passageId: passage.id,
      passageTitle: passage.title,
      wpm,
      accuracy: seed.accuracy,
      fluency: Math.round(wpm * (seed.accuracy / 100)),
      seconds: seed.seconds,
      correct,
      total,
      attempted: total,
      wrongWords: missed,
      mode: 'voice',
      demo: true,
    })
    if (missed.length) {
      missed.forEach((word, missedIndex) => {
        challenging.push({
          id: `demo-challenge-${index}-${missedIndex}`,
          key: `${profile.lang}:${word.toLowerCase()}`,
          word,
          lang: profile.lang,
          grade: profile.grade,
          source: 'reading',
          date: date.toISOString(),
          count: 1,
          demo: true,
        })
      })
    }
  })

  const essayTitles =
    profile.lang === 'hi'
      ? ['मेरा बगीचा', 'बारिश का दिन']
      : ['My Garden', 'A Rainy Day']
  const essayBodies =
    profile.lang === 'hi'
      ? [
          'मेरा एक छोटा सा बगीचा है। वहाँ गुलाब, गेंदा और तुलसी के पौधे लगे हैं। मैं रोज़ सुबह उन्हें पानी देता हूँ। हरी पत्तियों पर ओस की बूँदें बहुत सुंदर लगती हैं। सुबह की ताज़ी हवा मन को खुश कर देती है। मेरे बगीचे में तितलियाँ और चिड़ियाँ भी आती हैं। यह मेरा प्रिय स्थान है।',
          'बारिश का दिन बहुत सुंदर होता है। आसमान में काले बादल छा जाते हैं और ठंडी हवा चलने लगती है। मैं खिड़की के पास बैठकर पानी की आवाज़ सुनता हूँ। माँ गरम पकौड़े बनाती हैं। बच्चे रंगीन छाते लेकर स्कूल जाते हैं। बारिश के बाद पेड़ और पत्तियाँ चमक उठते हैं। मुझे बारिश का दिन बहुत पसंद है।',
        ]
      : [
          'I have a small garden in front of my house. Colourful flowers grow there, and the green leaves look fresh every morning. I water the plants daily and remove the dry leaves. My mother grows tulsi and mint as well. Butterflies visit the garden, and birds often sing on the fence. I love to sit there with a book after school. My garden teaches me patience and care.',
          'A rainy day is full of lovely sounds and smells. Dark clouds cover the sky, and cool wind shakes the trees. I sit near the window and watch raindrops race down the glass. My mother makes hot pakoras, and we eat them together. Children splash in the puddles with bright umbrellas. After the rain, the leaves shine and a rainbow sometimes appears. I always feel happy on a rainy day.',
        ]

  const essayPrompts =
    profile.lang === 'hi'
      ? ['hi-w-g2-1', 'hi-w-g2-2']
      : ['en-w-g2-1', 'en-w-g2-2']

  essayBodies.forEach((body, index) => {
    const date = new Date(now.getTime() - (index + 1) * 86400000)
    essays.push({
      id: `demo-essay-${index}`,
      date: date.toISOString(),
      promptId: essayPrompts[index],
      title: essayTitles[index],
      promptTitle: essayTitles[index],
      lang: profile.lang,
      grade: profile.grade,
      text: body,
      words: body.trim().split(/\s+/).length,
      target: getWritingTarget(profile.grade),
      golden: [],
      demo: true,
    })
  })

  const vocabSource = vocabulary.filter(
    (word) => word.lang === profile.lang && word.grade === profile.grade,
  )
  vocabSource.slice(0, 4).forEach((word, index) => {
    const date = new Date(now.getTime() - index * 86400000 - 7200000)
    mastered.push({
      id: `demo-mastered-${index}`,
      wordId: word.id,
      word: word.word,
      meaning: word.meaning,
      lang: word.lang,
      grade: word.grade,
      date: date.toISOString(),
      demo: true,
    })
  })

  quizLog.push({
    id: 'demo-quiz-1',
    date: new Date(now.getTime() - 2 * 86400000 - 3600000).toISOString(),
    lang: profile.lang,
    grade: profile.grade,
    score: 3,
    total: 3,
    demo: true,
  })

  return {
    sessions,
    essays,
    mastered,
    challenging,
    quizLog,
    demo: true,
    activity: rebuildActivity({ sessions, essays, mastered, quizLog }),
  }
}
