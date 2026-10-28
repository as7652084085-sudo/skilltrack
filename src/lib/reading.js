import { normalizeWord, round } from './utils'

const levenshtein = (a, b) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

export const similarity = (a, b) => {
  if (!a || !b) return 0
  if (a === b) return 1
  const distance = levenshtein(a, b)
  return 1 - distance / Math.max(a.length, b.length)
}

const isInflection = (shorter, longer) => {
  if (shorter.length < 3 || !longer.startsWith(shorter)) return false
  const suffix = longer.slice(shorter.length)
  if (['s', 'es', 'ed', 'd', 'ing', 'ly', 'er', 'est'].includes(suffix)) return true

  const doubled = shorter.slice(-1)
  return (
    longer === `${shorter}${doubled}ing` ||
    longer === `${shorter}${doubled}ed`
  )
}

/**
 * Young readers often repeat the first sound while getting a word out
 * ("th-the", "c-cat"). Speech engines usually return that stutter as one
 * token, so collapse a repeated opening sound before comparing.
 */
const collapseStutter = (word = '') => word.replace(/^(\p{L}{1,2})\1+/u, '$1')

const HINDI_NUKTA_VARIANTS = {
  'क़': 'क',
  'ख़': 'ख',
  'ग़': 'ग',
  'ज़': 'ज',
  'ड़': 'ड',
  'ढ़': 'ढ',
  'फ़': 'फ',
  'य़': 'य',
}

/**
 * Speech engines return dictionary spellings, but children and different
 * accents often land on the same sound. A light phonetic key lets us accept
 * "kat" for "cat", "fone" for "phone" and nukta variants in Hindi without
 * making unrelated words match.
 */
const phoneticKey = (word = '') => {
  let value = String(word || '').toLowerCase()
  if (/^[a-z]+$/.test(value)) {
    value = value
      .replace(/ph/g, 'f')
      .replace(/ck/g, 'k')
      .replace(/qu/g, 'kw')
      .replace(/wh/g, 'w')
      .replace(/x/g, 'ks')
      .replace(/c(?=[aou])/g, 'k')
      .replace(/c(?=[eiy])/g, 's')
  } else {
    Object.entries(HINDI_NUKTA_VARIANTS).forEach(([from, to]) => {
      value = value.split(from).join(to)
    })
  }
  return value
}

const hasFinalLetterTolerance = (target = '', spoken = '') => {
  if (target.length < 3 || spoken.length < 3) return false
  const longer = target.length >= spoken.length ? target : spoken
  const shorter = target.length >= spoken.length ? spoken : target
  // Fast readers often clip the final consonant ("readin" for "reading").
  // Accept only a small ending difference, not a completely different word.
  return longer.startsWith(shorter) && longer.length - shorter.length <= 2
}

const isMatch = (target, spoken) => {
  if (!target || !spoken) return false
  if (target === spoken) return true

  const deStuttered = collapseStutter(spoken)
  if (deStuttered !== spoken && target === deStuttered) return true

  const shortest = Math.min(target.length, deStuttered.length)
  if (shortest <= 2) return false

  const longer = target.length > deStuttered.length ? target : deStuttered
  const shorter = target.length > deStuttered.length ? deStuttered : target
  if (isInflection(shorter, longer)) return true

  const plainScore = similarity(target, deStuttered)
  if (plainScore >= 0.7) return true

  const phoneticTarget = phoneticKey(target)
  const phoneticSpoken = phoneticKey(deStuttered)
  if (phoneticTarget !== target || phoneticSpoken !== deStuttered) {
    if (phoneticTarget === phoneticSpoken) return true
    if (
      Math.min(phoneticTarget.length, phoneticSpoken.length) > 2 &&
      similarity(phoneticTarget, phoneticSpoken) >= 0.7
    ) {
      return true
    }
  }

  return hasFinalLetterTolerance(target, deStuttered)
}

export const isWordMatch = (target, spoken) =>
  isMatch(normalizeWord(target), normalizeWord(spoken))

/**
 * ASR regularly drops tiny function words when a child reads quickly
 * ("A lion was sleeping in the forest" can arrive as "A lion sleeping forest").
 * These words should not turn yellow just because they were not heard.
 */
const LIGHT_WORDS = new Set(
  `a an the and or but in on at of to for from with by as is am are was were be been being
  it its this that these those he she him her his hers they them their we us our you your i my me
  do does did has have had not no so if then than when while into onto up down out over under again
  just very can could will would shall should may might must there here
  है हैं था थी थे का की के को में पर से और या भी नहीं एक यह वह वे हम तुम मैं मेरा मेरी उसका उसकी उनका
  कि जो तो ही ने लिए साथ अब फिर बहुत कुछ कभी यहाँ वहाँ`
    .split(/\s+/)
    .filter(Boolean),
)

const isForgivableSkip = (word = '') => word.length <= 2 || LIGHT_WORDS.has(word)

/**
 * Greedy, order-aware alignment of spoken words against the passage.
 * Punctuation is stripped before comparison, and a 5-word look-ahead lets
 * tracking recover quickly without jumping too far ahead on fast reading.
 */
export const alignReading = (targets = [], spoken = []) => {
  const cleanTargets = targets.map((word) => normalizeWord(word))
  const cleanSpoken = spoken.map((word) => normalizeWord(word)).filter(Boolean)
  const marks = new Array(cleanTargets.length).fill('pending')
  let t = 0
  let s = 0

  while (t < cleanTargets.length && s < cleanSpoken.length) {
    if (isMatch(cleanTargets[t], cleanSpoken[s])) {
      marks[t] = 'correct'
      t += 1
      s += 1
      continue
    }

    // The reader may have skipped a word: find the next passage word they
    // actually said. Keep this window tight (4-5 words); a large window can
    // jump over correctly-read words and paint them yellow.
    const targetLookahead = 5
    let targetAhead = -1
    for (let step = 1; step <= targetLookahead && t + step < cleanTargets.length; step += 1) {
      if (isMatch(cleanTargets[t + step], cleanSpoken[s])) {
        targetAhead = t + step
        break
      }
    }
    if (targetAhead !== -1) {
      for (let k = t; k < targetAhead; k += 1) {
        marks[k] = isForgivableSkip(cleanTargets[k]) ? 'correct' : 'skipped'
      }
      t = targetAhead
      continue
    }

    // The reader added a word or the recogniser hallucinated one: skip it.
    const spokenLookahead = 5
    let spokenAhead = -1
    for (let step = 1; step <= spokenLookahead && s + step < cleanSpoken.length; step += 1) {
      if (isMatch(cleanTargets[t], cleanSpoken[s + step])) {
        spokenAhead = s + step
        break
      }
    }
    if (spokenAhead !== -1) {
      s = spokenAhead
      continue
    }

    // Both words are wrong; consume them so later words can still align.
    marks[t] = 'wrong'
    t += 1
    s += 1
  }

  return marks
}

/**
 * Interim transcripts are revised constantly. Never let a word that was
 * already confirmed turn yellow/pending again during a live test.
 */
export const mergeReadingMarks = (previous = [], next = []) =>
  next.map((mark, index) => (previous[index] === 'correct' ? 'correct' : mark))

export const finalizeMarks = (marks = []) => marks.map((mark) => (mark === 'pending' ? 'skipped' : mark))

export const readingMetrics = (marks = [], totalWords = 0, elapsedSeconds = 0) => {
  const correct = marks.filter((mark) => mark === 'correct').length
  const wrong = marks.filter((mark) => mark === 'wrong' || mark === 'skipped').length
  const attempted = marks.filter((mark) => mark === 'correct' || mark === 'wrong').length
  const safeTotal = totalWords || marks.length
  const seconds = Math.max(elapsedSeconds, 0)
  const wpm = seconds > 0 ? (attempted / seconds) * 60 : 0
  const accuracy = safeTotal > 0 ? (correct / safeTotal) * 100 : 0
  const fluency = wpm * (accuracy / 100)
  return {
    correct,
    wrong,
    attempted,
    total: safeTotal,
    wpm: Math.max(0, round(wpm, 1)),
    accuracy: round(Math.min(100, accuracy), 1),
    fluency: Math.max(0, round(fluency, 1)),
    seconds: round(seconds, 1),
  }
}

export const manualMetrics = (totalWords = 0, missedCount = 0, elapsedSeconds = 0) => {
  const seconds = Math.max(elapsedSeconds, 0)
  const correct = Math.max(0, totalWords - missedCount)
  const accuracy = totalWords > 0 ? (correct / totalWords) * 100 : 0
  const wpm = seconds > 0 ? (totalWords / seconds) * 60 : 0
  return {
    correct,
    wrong: missedCount,
    attempted: totalWords,
    total: totalWords,
    wpm: Math.max(0, round(wpm, 1)),
    accuracy: round(Math.min(100, accuracy), 1),
    fluency: Math.max(0, round(wpm * (accuracy / 100), 1)),
    seconds: round(seconds, 1),
  }
}

export const transcriptToWords = (transcript = '') =>
  transcript
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)

export const uniquePassageWords = (targets = [], marks = []) => {
  const seen = new Set()
  const words = []
  targets.forEach((word, index) => {
    const mark = marks[index]
    if ((mark === 'wrong' || mark === 'skipped') && word && !seen.has(word)) {
      seen.add(word)
      words.push(word)
    }
  })
  return words
}

/**
 * Sentence boundaries keep the AI companion's encouragement in step with the
 * story. Quotes/brackets after a full stop are part of the sentence ending.
 */
export const getSentenceRanges = (words = []) => {
  const ranges = []
  let start = 0
  words.forEach((word, index) => {
    const endsSentence = /[.!?।…]["'”’)\]]*$/.test(String(word || ''))
    if (endsSentence || index === words.length - 1) {
      if (index >= start) ranges.push([start, index])
      start = index + 1
    }
  })
  return ranges
}

export const getCompletedSentenceIndexes = (words = [], marks = []) => {
  const ranges = getSentenceRanges(words)
  return ranges
    .map((range, index) => ({ range, index }))
    .filter(({ range }) => {
      const [start, end] = range
      if (start === end && marks[start] !== 'correct') return false
      for (let i = start; i <= end; i += 1) {
        if (marks[i] !== 'correct') return false
      }
      return true
    })
    .map(({ index }) => index)
}

/**
 * Friendly three-star rubric used in the result card. It rewards both
 * accuracy and age-appropriate speed without hiding the real metrics.
 */
export const readingStars = (metrics = {}, targetWpm = 60) => {
  const accuracy = Number(metrics.accuracy) || 0
  const wpm = Number(metrics.wpm) || 0
  if (accuracy >= 92 && wpm >= Math.max(20, targetWpm)) return 3
  if (accuracy >= 80 && wpm >= Math.max(12, targetWpm * 0.6)) return 2
  if (accuracy >= 50) return 1
  return 0
}
