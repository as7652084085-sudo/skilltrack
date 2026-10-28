export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const uid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export const pad = (n) => String(n).padStart(2, '0')

export const dateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayKey = () => dateKey(new Date())

export const startOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export const addDays = (date, amount) => {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

export const formatClock = (totalSeconds = 0) => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

export const formatDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export const formatShortDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const relativeDay = (iso, lang = 'en') => {
  if (!iso) return ''
  const date = dateKey(new Date(iso))
  const today = todayKey()
  const yesterday = dateKey(addDays(new Date(), -1))
  if (date === today) return lang === 'hi' ? 'आज' : 'Today'
  if (date === yesterday) return lang === 'hi' ? 'कल' : 'Yesterday'
  return formatShortDate(iso)
}

export const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
}

export const lastNDays = (n, lang = 'en') => {
  const days = []
  const today = startOfDay(new Date())
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = addDays(today, -i)
    days.push({
      key: dateKey(d),
      date: d,
      weekday: WEEKDAYS[lang][d.getDay()],
      dayNumber: d.getDate(),
      isToday: i === 0,
    })
  }
  return days
}

export const countWords = (text) => {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
}

export const normalizeWord = (word = '') =>
  word
    .toString()
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\p{P}\p{S}]/gu, '')
    .trim()

export const splitWords = (text = '') => (text.trim() ? text.trim().split(/\s+/) : [])

/**
 * Word ranges keep the exact character offsets of the original passage.
 * SpeechSynthesis boundary events report charIndex, so these offsets let us
 * map the spoken word back to the visible word without guessing.
 */
export const splitWordRanges = (text = '') => {
  const source = String(text || '')
  const ranges = []
  const pattern = /\S+/g
  let match = pattern.exec(source)
  while (match) {
    ranges.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
    match = pattern.exec(source)
  }
  return ranges
}

export const cleanTokens = (text = '') => splitWords(text).map(normalizeWord).filter(Boolean)

export const keywordUsed = (text, keyword) => {
  const key = normalizeWord(keyword)
  if (!key) return false
  const words = String(text)
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)
  return words.some((word) => {
    if (word === key) return true
    if (key.length >= 4 && (word.startsWith(key) || key.startsWith(word))) return true
    const prefix = key.slice(0, Math.min(5, key.length))
    return key.length >= 5 && word.length >= 5 && word.startsWith(prefix)
  })
}

export const round = (value, digits = 0) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

export const computeStreak = (activity = {}) => {
  const hasPractice = (key) => {
    const entry = activity[key]
    if (!entry) return false
    return (
      (entry.wordsRead || 0) > 0 ||
      (entry.readingSeconds || 0) > 0 ||
      (entry.essays || 0) > 0 ||
      (entry.wordsWritten || 0) > 0 ||
      (entry.mastered || 0) > 0 ||
      (entry.quizzes || 0) > 0
    )
  }

  const today = startOfDay(new Date())
  let cursor = today
  if (!hasPractice(dateKey(cursor))) {
    cursor = addDays(cursor, -1)
    if (!hasPractice(dateKey(cursor))) return 0
  }

  let streak = 0
  while (hasPractice(dateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export const bestStreak = (activity = {}) => {
  const keys = Object.keys(activity)
    .filter((key) => {
      const a = activity[key]
      return (
        (a.wordsRead || 0) > 0 ||
        (a.essays || 0) > 0 ||
        (a.wordsWritten || 0) > 0 ||
        (a.mastered || 0) > 0 ||
        (a.quizzes || 0) > 0
      )
    })
    .sort()
  let best = 0
  let run = 0
  let previous = null
  for (const key of keys) {
    if (previous && dateKey(addDays(new Date(`${previous}T00:00:00`), 1)) === key) {
      run += 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    previous = key
  }
  return best
}

export const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the textarea fallback
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export const seededShuffle = (items, seed = 1) => {
  const arr = [...items]
  let s = seed || 1
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
