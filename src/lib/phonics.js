const ENGLISH_SYLLABLES = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi
const DEVANAGARI_BASE = /[\u0905-\u0939\u0958-\u0961][\u0900-\u0903\u093E-\u094D]*/g

const englishUnits = (word = '') => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!clean) return []
  const units = clean.match(ENGLISH_SYLLABLES) || []
  return units.length ? units : [clean]
}

const hindiUnits = (word = '') => {
  const raw = word.normalize('NFC').match(DEVANAGARI_BASE) || []
  const units = []
  raw.forEach((unit) => {
    // A virama joins the following consonant into one conjunct (क्ष, त्र).
    if (units.length && units[units.length - 1].endsWith('\u094D')) {
      units[units.length - 1] += unit
    } else {
      units.push(unit)
    }
  })
  return units
}

/**
 * Offline phonics support for the single-word practice modal.
 * This is deliberately simple and dependency-free: useful syllable chunks,
 * a sound-it-out line and a friendly coaching hint.
 */
export const getPhonicsBreakdown = (word = '', lang = 'en') => {
  const clean = String(word || '').normalize('NFC').trim()
  if (!clean) {
    return { label: 'Phonics', units: [], soundOut: '', hint: '' }
  }

  if (lang === 'hi') {
    const units = hindiUnits(clean)
    return {
      label: 'वर्ण-विच्छेद',
      units,
      soundOut: units.join(' · '),
      hint: 'हर अक्षर को धीरे-धीरे बोलें, फिर सबको जोड़कर पूरा शब्द बोलें।',
      letters: units,
    }
  }

  const units = englishUnits(clean)
  const letters = clean.toLowerCase().replace(/[^a-z]/g, '').split('')
  return {
    label: 'Phonics breakdown',
    units,
    soundOut: letters.slice(0, 12).join(' · '),
    hint: 'Say each sound slowly, then blend the parts together.',
    letters,
  }
}
