import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gauge,
  Headphones,
  Info,
  LockKeyhole,
  Mic,
  MousePointerClick,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Star,
  Target,
  Timer,
  Trash2,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { getReadingTarget, getDailyGoal } from '../lib/constants'
import { getPassages, passages } from '../data/passages'
import { getComprehensionQuestions } from '../data/comprehension'
import {
  getRecognitionClass,
  isRecognitionSupported,
  isSpeechSupported,
  useSpeech,
} from '../lib/speech'
import {
  advanceLiveReading,
  finalizeMarks,
  getCompletedSentenceIndexes,
  manualMetrics,
  readingMetrics,
  readingStars,
  transcriptToWords,
} from '../lib/reading'
import {
  cn,
  formatClock,
  normalizeWord,
  splitWordRanges,
  splitWords,
  todayKey,
  uid,
} from '../lib/utils'
import { Badge, Button, Card, ProgressBar, Ring, Segmented } from './ui'
import { MitraBubble } from './AICompanion'
import ComprehensionQuiz from './ComprehensionQuiz'
import SingleWordPracticeModal from './SingleWordPracticeModal'

const AUTO_FINISH_DELAY_MS = 2200
const QUIET_AFTER_MS = 2800

const MITRA_COPY = {
  en: {
    idle: 'Hi! I’m Mitra. Tap the mic when you are ready.',
    practice: 'Tap any word to hear it. I’ll read along with you.',
    listening: 'I’m listening. Read at your own pace — take your time.',
    quiet: 'Take your time. I’m still listening.',
    manual: 'Tap the words you find hard. I’m right here with you.',
    sentence: [
      'Beautiful reading! That sentence sounded great.',
      'Lovely! Keep that smooth reading going.',
      'Wonderful! I heard that sentence clearly.',
    ],
    wrong: 'No worries! Let’s listen to that word and try it again.',
    finish3: 'Three stars! I’m so proud of your reading.',
    finish2: 'Great effort! One more read and those stars will shine brighter.',
    finish1: 'Every reading makes you stronger. Let’s practise the tricky words.',
    nudge: [
      'You’re doing great — one word at a time.',
      'I believe in you! Let’s read together.',
      'A little practice every day makes a big difference.',
    ],
    nudgeListening: 'I’m right here with you. Keep going!',
  },
  hi: {
    idle: 'नमस्ते! मैं मित्र हूँ। तैयार हो तो माइक दबाओ।',
    practice: 'किसी भी शब्द पर टैप करके उच्चारण सुनो। मैं साथ पढ़ूँगा।',
    listening: 'मैं सुन रहा हूँ। अपनी गति से पढ़ो, जल्दी नहीं।',
    quiet: 'आराम से पढ़ो, मैं अभी भी सुन रहा हूँ।',
    manual: 'जो शब्द कठिन लगें उन पर टैप करो। मैं तुम्हारे साथ हूँ।',
    sentence: [
      'वाह! यह वाक्य बहुत अच्छा पढ़ा।',
      'बहुत बढ़िया! ऐसे ही आगे बढ़ो।',
      'शानदार! यह वाक्य साफ़ सुनाई दिया।',
    ],
    wrong: 'कोई बात नहीं! उस शब्द को सुनकर फिर से दोहराते हैं।',
    finish3: 'तीन सितारे! मुझे तुम्हारी पढ़ाई पर गर्व है।',
    finish2: 'बहुत अच्छा! एक बार और पढ़ो, सितारे और चमकेंगे।',
    finish1: 'हर बार पढ़ने से तुम मज़बूत बनते हो। कठिन शब्दों का अभ्यास करें।',
    nudge: [
      'तुम बहुत अच्छा कर रहे हो — एक-एक शब्द।',
      'मुझे तुम पर भरोसा है! चलो साथ पढ़ें।',
      'रोज़ थोड़ा अभ्यास बड़ा फ़र्क़ लाता है।',
    ],
    nudgeListening: 'मैं तुम्हारे साथ हूँ। पढ़ते रहो!',
  },
}

const starCopy = {
  en: {
    3: 'Star reader! Class-level speed and accuracy.',
    2: 'Great progress! One more read for three stars.',
    1: 'Good start! Practise the red words, then read again.',
    0: 'Keep going! Every read makes you stronger.',
  },
  hi: {
    3: 'स्टार रीडर! कक्षा-स्तर की गति और शुद्धता।',
    2: 'बहुत अच्छा! तीन सितारों के लिए एक बार और पढ़ें।',
    1: 'अच्छी शुरुआत! लाल शब्दों का अभ्यास करके फिर पढ़ें।',
    0: 'पढ़ते रहो! हर बार पढ़ने से तुम मज़बूत बनते हो।',
  },
}

const errorCopy = {
  'not-allowed': 'Microphone access is blocked. Allow the mic in your browser settings, or switch to self-check mode.',
  'service-not-allowed': 'Microphone access is blocked by the browser. Please allow it, or use self-check mode.',
  'audio-capture': 'No microphone was found. Connect a mic or use self-check mode.',
  network: 'The speech service needs an internet connection. Check your connection or use self-check mode.',
  'language-not-supported': 'This browser cannot recognise Hindi speech. Try Google Chrome, or use self-check mode.',
  'bad-grammar': 'The speech service had a small problem. Please try again.',
}

function Metric({ label, value, unit, tone = 'slate', icon: Icon }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <div className={cn('rounded-2xl px-3 py-2.5', tones[tone])}>
      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide opacity-70">
        {Icon ? <Icon size={11} strokeWidth={2.8} /> : null}
        {label}
      </div>
      <p className="mt-0.5 font-display text-xl font-extrabold leading-none">
        {value}
        {unit ? <span className="ml-0.5 text-[10px] font-bold opacity-70">{unit}</span> : null}
      </p>
    </div>
  )
}

function ListeningBars() {
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="w-[3px] animate-pulse rounded-full bg-white/80"
          style={{
            height: `${6 + (bar % 3) * 4}px`,
            animationDuration: `${620 + bar * 130}ms`,
            animationDelay: `${bar * 90}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default function ReadingModule({
  profile,
  activity,
  challenging,
  onSaveSession,
  onRemoveChallenge,
  onClearChallenges,
  notify,
  premiumEnabled = false,
  proAccess = false,
  readingUsed = 0,
  readingLimit = 5,
  readingLocked = false,
  onRequestUpgrade,
}) {
  const availablePassages = useMemo(() => getPassages(profile.grade, profile.lang), [profile.grade, profile.lang])
  const [passageId, setPassageId] = useState(availablePassages[0]?.id || '')
  const [mode, setMode] = useState('practice')
  const [testMode, setTestMode] = useState(() => (isRecognitionSupported() ? 'voice' : 'manual'))
  const [testState, setTestState] = useState('idle')
  const [marks, setMarks] = useState(() => new Array(splitWords(availablePassages[0]?.text || '').length).fill('pending'))
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [micError, setMicError] = useState('')
  const [missedIndices, setMissedIndices] = useState(() => new Set())
  const [practiceWord, setPracticeWord] = useState(null)
  const [masteredPracticeWords, setMasteredPracticeWords] = useState(() => new Set())
  const [quietListening, setQuietListening] = useState(false)
  const [companionPulse, setCompanionPulse] = useState(null)
  const [ttsWordIndex, setTtsWordIndex] = useState(-1)

  const { speak, stop, speakingKey } = useSpeech()
  const passageSpeaking = Boolean(speakingKey && speakingKey.startsWith('passage-'))
  const recognitionSupported = useMemo(() => isRecognitionSupported(), [])
  const speechSupported = useMemo(() => isSpeechSupported(), [])
  const today = activity?.[todayKey()] || {}
  const dailyGoal = getDailyGoal(profile.grade)
  const readingTarget = getReadingTarget(profile.grade)

  const passage = availablePassages.find((item) => item.id === passageId) || availablePassages[0]
  const rawWords = useMemo(() => splitWords(passage?.text || ''), [passage])
  const passageWordRanges = useMemo(() => splitWordRanges(passage?.text || ''), [passage])
  const targets = useMemo(() => rawWords.map(normalizeWord), [rawWords])

  const recognitionRef = useRef(null)
  const recognitionSessionRef = useRef(0)
  const recognitionStartedAtRef = useRef(0)
  const runningRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const startedAtRef = useRef(0)
  const marksRef = useRef(marks)
  const liveCursorRef = useRef(0)
  const lastEventWordsRef = useRef([])
  const autoFinishRef = useRef(false)
  const autoFinishTimerRef = useRef(null)
  const restartCountRef = useRef(0)
  const restartTimerRef = useRef(null)
  const startFailuresRef = useRef(0)
  const savedRef = useRef(false)
  const finishRef = useRef(null)
  const manualRef = useRef(false)
  const voiceCardRef = useRef(null)
  const passageCardRef = useRef(null)
  const karaokeRef = useRef(null)
  const ttsActiveRef = useRef(false)
  const ttsSessionRef = useRef(0)
  const lastSpeechAtRef = useRef(0)
  const completedSentencesRef = useRef(new Set())
  const previousWrongCountRef = useRef(0)
  const pulseIdRef = useRef(0)
  const liveFrameRef = useRef(0)
  const pendingLiveRef = useRef({ marks: null, transcript: '' })

  const liveMetrics = useMemo(() => {
    if (testState !== 'running') return null
    const seconds = Math.max(elapsed, 0.8)
    const metrics = readingMetrics(marks, targets.length, seconds)
    return { ...metrics, wpm: Math.min(320, metrics.wpm) }
  }, [elapsed, marks, targets.length, testState])

  const comprehension = useMemo(
    () => getComprehensionQuestions(passage?.id),
    [passage?.id],
  )
  const mitraCopy = MITRA_COPY[profile.lang] || MITRA_COPY.en
  const stars = result ? readingStars(result, readingTarget) : 0

  let baseMood = 'idle'
  let baseMessage = mitraCopy.idle
  if (mode === 'practice') {
    baseMood = 'idle'
    baseMessage = mitraCopy.practice
  } else if (testState === 'running') {
    baseMood = 'listening'
    if (testMode === 'manual') baseMessage = mitraCopy.manual
    else baseMessage = quietListening ? mitraCopy.quiet : mitraCopy.listening
  } else if (testState === 'finished' && result) {
    baseMood = stars >= 2 ? 'celebrate' : 'comfort'
    baseMessage = stars >= 3 ? mitraCopy.finish3 : stars === 2 ? mitraCopy.finish2 : mitraCopy.finish1
  }

  const companionMood = companionPulse?.mood || baseMood
  const companionMessage = companionPulse?.message || baseMessage

  const pushCompanionPulse = (mood, message) => {
    pulseIdRef.current += 1
    setCompanionPulse({ id: pulseIdRef.current, mood, message })
  }

  const nudgeMitra = () => {
    if (testState === 'running') {
      pushCompanionPulse('listening', mitraCopy.nudgeListening)
      return
    }
    const message = mitraCopy.nudge[Math.floor(Math.random() * mitraCopy.nudge.length)]
    pushCompanionPulse('happy', message)
  }

  const cancelLivePaint = () => {
    if (liveFrameRef.current && typeof window !== 'undefined') {
      window.cancelAnimationFrame?.(liveFrameRef.current)
    }
    liveFrameRef.current = 0
    pendingLiveRef.current = { marks: null, transcript: '' }
  }

  /**
   * Interim results can arrive faster than React can paint. Coalesce them
   * into one paint per animation frame so highlights stay instant, but never
   * make the main thread do unnecessary renders.
   */
  const scheduleLivePaint = (nextMarks, transcript) => {
    pendingLiveRef.current = { marks: nextMarks, transcript }
    if (liveFrameRef.current) return
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      setMarks(nextMarks)
      setLiveTranscript(transcript)
      return
    }
    liveFrameRef.current = window.requestAnimationFrame(() => {
      liveFrameRef.current = 0
      const pending = pendingLiveRef.current
      if (!pending.marks) return
      setMarks(pending.marks)
      setLiveTranscript(pending.transcript)
    })
  }

  const stopRecognition = () => {
    recognitionSessionRef.current += 1
    recognitionStartedAtRef.current = 0
    startFailuresRef.current = 0
    clearTimeout(autoFinishTimerRef.current)
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onstart = null
        recognitionRef.current.abort()
      } catch {
        // Recognition can throw if it was never started.
      }
    }
    recognitionRef.current = null
    runningRef.current = false
  }

  const resetTest = (length = targets.length) => {
    cancelLivePaint()
    stopRecognition()
    stop()
    stopRequestedRef.current = true
    autoFinishRef.current = false
    liveCursorRef.current = 0
    lastEventWordsRef.current = []
    savedRef.current = false
    manualRef.current = false
    setTestState('idle')
    setMarks(new Array(length).fill('pending'))
    marksRef.current = new Array(length).fill('pending')
    setElapsed(0)
    setResult(null)
    setSaved(false)
    setLiveTranscript('')
    setMicError('')
    setMissedIndices(new Set())
    setQuietListening(false)
    setCompanionPulse(null)
    lastSpeechAtRef.current = 0
    completedSentencesRef.current = new Set()
    previousWrongCountRef.current = 0
  }

  useEffect(() => {
    return () => {
      cancelLivePaint()
      stopRecognition()
      clearTimeout(autoFinishTimerRef.current)
      clearTimeout(restartTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (testState !== 'running') return undefined
    const timer = setInterval(() => {
      if (!startedAtRef.current) return
      setElapsed((Date.now() - startedAtRef.current) / 1000)
      if (testMode === 'voice' && lastSpeechAtRef.current) {
        setQuietListening(Date.now() - lastSpeechAtRef.current > QUIET_AFTER_MS)
      }
    }, 200)
    return () => clearInterval(timer)
  }, [testState, testMode])

  useEffect(() => {
    if (!companionPulse) return undefined
    const timer = setTimeout(() => setCompanionPulse(null), 3400)
    return () => clearTimeout(timer)
  }, [companionPulse])

  useEffect(() => {
    if (passageSpeaking) return
    ttsActiveRef.current = false
    ttsSessionRef.current += 1
    setTtsWordIndex(-1)
  }, [passageSpeaking])

  useEffect(() => {
    if (mode !== 'test' || testState !== 'running') {
      completedSentencesRef.current = new Set()
      previousWrongCountRef.current = 0
      return
    }

    const completed = getCompletedSentenceIndexes(rawWords, marks)
    const fresh = completed.filter((index) => !completedSentencesRef.current.has(index))
    if (fresh.length) {
      fresh.forEach((index) => completedSentencesRef.current.add(index))
      const message = mitraCopy.sentence[fresh.length % mitraCopy.sentence.length]
      pushCompanionPulse('happy', message)
    }

    const wrongCount = marks.filter((mark) => mark === 'wrong').length
    if (wrongCount > previousWrongCountRef.current) {
      pushCompanionPulse('comfort', mitraCopy.wrong)
    }
    previousWrongCountRef.current = wrongCount
  }, [marks, mode, testState, rawWords, mitraCopy])

  const persistResult = (metrics, finalMarks, testKind) => {
    if (savedRef.current) return
    const seconds = metrics.seconds
    if (!metrics.total || seconds < 1 || metrics.attempted < 1) return
    const missed = []
    finalMarks.forEach((mark, index) => {
      if (mark === 'wrong' || mark === 'skipped') {
        const word = normalizeWord(rawWords[index])
        if (word) missed.push(word)
      }
    })
    const uniqueMissed = [...new Set(missed)]
    savedRef.current = true
    setSaved(true)
    onSaveSession(
      {
        id: uid(),
        date: new Date().toISOString(),
        lang: profile.lang,
        grade: profile.grade,
        passageId: passage.id,
        passageTitle: passage.title,
        mode: testKind,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        fluency: metrics.fluency,
        seconds: Math.round(metrics.seconds),
        correct: metrics.correct,
        total: metrics.total,
        attempted: metrics.attempted,
        wrongWords: uniqueMissed,
      },
      uniqueMissed,
    )
    notify(
      `${testKind === 'manual' ? 'Self-check' : 'Reading'} saved · ${Math.round(metrics.wpm)} WPM · ${Math.round(
        metrics.accuracy,
      )}% accuracy`,
      'success',
    )
  }

  const finishVoiceTest = () => {
    if (!runningRef.current && testState === 'finished') return
    runningRef.current = false
    stopRequestedRef.current = true
    recognitionSessionRef.current += 1
    recognitionStartedAtRef.current = 0
    startFailuresRef.current = 0
    cancelLivePaint()
    clearTimeout(autoFinishTimerRef.current)
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore a recognition session that has already ended.
      }
      recognitionRef.current = null
    }
    const final = finalizeMarks(marksRef.current)
    const seconds = Math.max(1, (Date.now() - startedAtRef.current) / 1000)
    const metrics = readingMetrics(final, targets.length, seconds)
    setMarks(final)
    marksRef.current = final
    setElapsed(seconds)
    setResult(metrics)
    setTestState('finished')
    setQuietListening(false)
    persistResult(metrics, final, 'voice')
  }
  finishRef.current = finishVoiceTest

  const scheduleAutoFinish = () => {
    if (autoFinishRef.current) return
    autoFinishRef.current = true
    autoFinishTimerRef.current = setTimeout(() => {
      if (runningRef.current) finishRef.current?.()
    }, AUTO_FINISH_DELAY_MS)
  }

  const handleRecognitionResult = (event) => {
    // Build the full transcript for this recognition session. Mobile Chrome
    // often repeats the whole transcript on every event; comparing against the
    // previous snapshot lets us process only genuinely new words.
    const eventWords = []
    for (let i = 0; i < event.results.length; i += 1) {
      eventWords.push(...transcriptToWords(event.results[i][0]?.transcript || ''))
    }

    const previousWords = lastEventWordsRef.current
    let commonPrefix = 0
    while (
      commonPrefix < previousWords.length &&
      commonPrefix < eventWords.length &&
      previousWords[commonPrefix] === eventWords[commonPrefix]
    ) {
      commonPrefix += 1
    }
    const freshWords = eventWords.slice(commonPrefix)
    lastEventWordsRef.current = eventWords

    if (!freshWords.length) return

    // Only matched words ever change colour. Background noise, duplicate
    // finals and hallucinated words are discarded without consuming a word.
    const advance = advanceLiveReading(
      targets,
      freshWords,
      liveCursorRef.current,
      marksRef.current,
    )
    liveCursorRef.current = advance.cursor
    if (!advance.advanced) return

    lastSpeechAtRef.current = Date.now()
    setQuietListening(false)

    // Keep confirmed words green while interim transcripts are revised, then
    // paint once per frame so fast readers get immediate, flicker-free colour.
    const transcript = eventWords.join(' ')
    marksRef.current = advance.marks
    scheduleLivePaint(advance.marks, transcript)
    if (
      advance.cursor >= targets.length ||
      (advance.marks.length && advance.marks.every((mark) => mark !== 'pending'))
    ) {
      scheduleAutoFinish()
    }
  }

  const scrollToVoiceCard = () => {
    window.setTimeout(() => {
      voiceCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const scrollToPassageCard = () => {
    window.setTimeout(() => {
      passageCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const startVoiceTest = ({ focus = false } = {}) => {
    if (readingLocked) {
      onRequestUpgrade?.()
      return
    }
    const Recognition = getRecognitionClass()
    if (!Recognition) {
      setTestMode('manual')
      setMicError('Live speech recognition is not available in this browser. Use self-check mode instead.')
      return
    }
    resetTest(targets.length)
    setTestMode('voice')
    setTestState('running')
    if (focus) scrollToVoiceCard()
    startedAtRef.current = Date.now()
    runningRef.current = true
    stopRequestedRef.current = false
    autoFinishRef.current = false
    savedRef.current = false
    restartCountRef.current = 0
    startFailuresRef.current = 0
    recognitionStartedAtRef.current = 0
    manualRef.current = false
    lastSpeechAtRef.current = Date.now()
    setQuietListening(false)
    setMicError('')

    const sessionId = recognitionSessionRef.current + 1
    recognitionSessionRef.current = sessionId
    const isActive = () =>
      recognitionSessionRef.current === sessionId &&
      runningRef.current &&
      !stopRequestedRef.current

    const handleFatalError = (message) => {
      if (!isActive()) return
      setMicError(message)
      runningRef.current = false
      stopRequestedRef.current = true
      clearTimeout(restartTimerRef.current)
      const current = recognitionRef.current
      recognitionRef.current = null
      if (current) {
        try {
          current.onend = null
          current.onerror = null
          current.onresult = null
          current.onstart = null
          current.abort()
        } catch {
          // The recognition session may already be closed.
        }
      }
      if (marksRef.current.some((mark) => mark === 'correct' || mark === 'wrong')) {
        finishRef.current?.()
      } else {
        setTestState('idle')
        setTestMode('manual')
      }
    }

    const scheduleRestart = (delay) => {
      if (!isActive()) return
      clearTimeout(restartTimerRef.current)
      restartCountRef.current += 1
      const wait = delay ?? Math.min(1600, 220 + restartCountRef.current * 140)
      restartTimerRef.current = setTimeout(() => {
        if (!isActive()) return
        launchRecognition()
      }, wait)
    }

    const launchRecognition = () => {
      if (!isActive()) return

      const previous = recognitionRef.current
      if (previous) {
        // Detach the old session before replacing it, so its late events
        // cannot restart or stop the new one.
        previous.onend = null
        previous.onerror = null
        previous.onresult = null
        previous.onstart = null
        try {
          previous.abort()
        } catch {
          // Already closed.
        }
        recognitionRef.current = null
      }

      const recognition = new Recognition()
      recognition.lang = profile.lang === 'hi' ? 'hi-IN' : 'en-IN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        if (!isActive()) return
        recognitionStartedAtRef.current = Date.now()
        startFailuresRef.current = 0
        setMicError('')
      }

      recognition.onresult = (event) => {
        if (!isActive()) return
        // A result proves the mic is live, so a later end starts fresh.
        restartCountRef.current = 0
        setMicError('')
        handleRecognitionResult(event)
      }

      recognition.onerror = (event) => {
        if (!isActive()) return
        const code = event.error || 'unknown'

        if (code === 'no-speech' || code === 'aborted') return

        if (code === 'network') {
          setMicError('Speech service connection was interrupted. Reconnecting…')
          scheduleRestart(900)
          return
        }

        if (
          code === 'not-allowed' ||
          code === 'service-not-allowed' ||
          code === 'audio-capture' ||
          code === 'language-not-supported'
        ) {
          handleFatalError(
            errorCopy[code] ||
              `Speech recognition stopped (${code}). Try again or use self-check mode.`,
          )
          return
        }

        setMicError(
          errorCopy[code] ||
            `Speech recognition had a problem (${code}). Reconnecting…`,
        )
        scheduleRestart(800)
      }

      recognition.onend = () => {
        if (!isActive()) return
        if (recognitionRef.current !== recognition) return
        recognitionRef.current = null

        const ranFor = recognitionStartedAtRef.current
          ? Date.now() - recognitionStartedAtRef.current
          : 0
        if (ranFor >= 2500) restartCountRef.current = 0
        scheduleRestart()
      }

      recognitionRef.current = recognition
      lastEventWordsRef.current = []
      try {
        recognition.start()
      } catch {
        if (recognitionRef.current === recognition) recognitionRef.current = null
        if (!isActive()) return
        startFailuresRef.current += 1
        if (startFailuresRef.current >= 8) {
          handleFatalError(
            'The microphone could not restart. Check browser permissions or use self-check mode.',
          )
          return
        }
        setMicError('Reconnecting microphone…')
        scheduleRestart(500 + startFailuresRef.current * 150)
      }
    }

    launchRecognition()
  }

  const startManualTest = () => {
    if (readingLocked) {
      onRequestUpgrade?.()
      return
    }
    resetTest(targets.length)
    setTestMode('manual')
    manualRef.current = true
    setTestState('running')
    startedAtRef.current = Date.now()
    runningRef.current = true
    savedRef.current = false
  }

  const toggleMissedWord = (index) => {
    if (!manualRef.current || testState !== 'running') return
    setMissedIndices((previous) => {
      const next = new Set(previous)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const finishManualTest = () => {
    if (!runningRef.current) return
    runningRef.current = false
    const seconds = Math.max(1, (Date.now() - startedAtRef.current) / 1000)
    const final = targets.map((_, index) => (missedIndices.has(index) ? 'wrong' : 'correct'))
    const metrics = manualMetrics(targets.length, missedIndices.size, seconds)
    setMarks(final)
    marksRef.current = final
    setElapsed(seconds)
    setResult(metrics)
    setTestState('finished')
    persistResult(metrics, final, 'manual')
  }

  const changeMode = (nextMode) => {
    if (mode === nextMode) return
    if (nextMode === 'test' && readingLocked) {
      onRequestUpgrade?.()
      return
    }
    resetTest(targets.length)
    setMode(nextMode)
  }

  const changeTestMode = (nextMode) => {
    if (testMode === nextMode) return
    resetTest(targets.length)
    setTestMode(nextMode)
  }

  const selectPassage = (id) => {
    if (id === passageId) return
    const next = availablePassages.find((item) => item.id === id)
    const nextLength = splitWords(next?.text || '').length
    resetTest(nextLength)
    setPassageId(id)
    setMode(mode)
  }

  const speakWord = (word, index, lang = profile.lang) => {
    if (!speechSupported) {
      notify('Audio is not supported in this browser. Try Chrome.', 'info')
      return
    }
    speak(word, lang, `word-${index}-${lang}`, { rate: lang === 'hi' ? 0.8 : 0.82 })
  }

  const handleTtsBoundary = (event) => {
    if (!ttsActiveRef.current || !passageWordRanges.length) return
    const charIndex = Number(event?.charIndex)
    if (!Number.isFinite(charIndex)) return

    let index = passageWordRanges.findIndex(
      (range) => charIndex >= range.start && charIndex < range.end,
    )
    if (index < 0) {
      // Some engines report the boundary at the space just before a word.
      index = passageWordRanges.findIndex((range) => range.start >= charIndex)
    }
    if (index < 0 || index >= passageWordRanges.length) return

    setTtsWordIndex((previous) => (previous === index ? previous : index))
    window.requestAnimationFrame(() => {
      const wordNode = karaokeRef.current?.querySelector(`[data-word-index="${index}"]`)
      wordNode?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const speakPassage = () => {
    if (!passage) return
    if (passageSpeaking) {
      ttsSessionRef.current += 1
      ttsActiveRef.current = false
      stop()
      setTtsWordIndex(-1)
      return
    }

    const session = ttsSessionRef.current + 1
    ttsSessionRef.current = session
    ttsActiveRef.current = true
    setTtsWordIndex(-1)
    const started = speak(passage.text, profile.lang, `passage-${session}`, {
      rate: profile.lang === 'hi' ? 0.82 : 0.88,
      onStart: () => {
        if (ttsSessionRef.current === session) setTtsWordIndex(-1)
      },
      onBoundary: (event) => {
        if (ttsSessionRef.current !== session) return
        handleTtsBoundary(event)
      },
      onEnd: () => {
        if (ttsSessionRef.current !== session) return
        ttsActiveRef.current = false
        setTtsWordIndex(-1)
      },
    })
    if (!started) {
      if (ttsSessionRef.current === session) {
        ttsActiveRef.current = false
        setTtsWordIndex(-1)
      }
    }
  }

  const wordStyle = (index) => {
    if (mode === 'practice') return 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
    if (testState === 'idle') return 'text-slate-600'
    const mark = marks[index]
    if (mark === 'correct') return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
    if (mark === 'wrong') return 'bg-rose-100 text-rose-700 underline decoration-rose-400 decoration-2 underline-offset-2'
    if (mark === 'skipped') return 'bg-amber-50 text-amber-700 underline decoration-amber-400 decoration-2 underline-offset-2'
    return 'text-slate-500'
  }

  const wordKey = (word, lang = profile.lang) => `${lang}:${normalizeWord(word)}`

  const getContextSentence = (text, word) => {
    const clean = normalizeWord(word)
    if (!clean) return ''
    const sentences = String(text || '').match(/[^.!?।]+[.!?।]?/g) || []
    return (
      sentences
        .map((sentence) => sentence.trim())
        .find((sentence) => splitWords(sentence).some((token) => normalizeWord(token) === clean)) || ''
    )
  }

  const findWordContext = (word, lang) => {
    const source = passages.find(
      (item) => item.lang === lang && getContextSentence(item.text, word),
    )
    return source ? getContextSentence(source.text, word) : ''
  }

  const openWordPractice = ({ word, lang = profile.lang, context = '', id = null }) => {
    const display =
      String(word || '')
        .replace(/^[^\p{L}\p{N}\p{M}]+|[^\p{L}\p{N}\p{M}]+$/gu, '')
        .trim() || normalizeWord(word)
    if (!display) return
    stop()
    setPracticeWord({
      word: display,
      lang,
      context: context || findWordContext(word, lang),
      id,
    })
  }

  const handleWordMastered = (item) => {
    if (!item?.word) return
    const key = wordKey(item.word, item.lang)
    setMasteredPracticeWords((previous) => {
      const next = new Set(previous)
      next.add(key)
      return next
    })
    const targetId =
      item.id ||
      challenging.find(
        (entry) =>
          entry.lang === item.lang &&
          normalizeWord(entry.word) === normalizeWord(item.word),
      )?.id
    if (targetId) {
      onRemoveChallenge(targetId)
      notify(`${item.word} mastered! Removed from tricky words.`, 'reward')
    } else {
      notify(`${item.word} mastered!`, 'reward')
    }
  }

  const renderPassageWords = ({ large = false, containerRef = null } = {}) => (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-wrap gap-x-1 gap-y-1 font-medium text-slate-700',
        large
          ? profile.lang === 'hi'
            ? 'text-[21px] leading-[2.1]'
            : 'text-[20px] leading-[2.05]'
          : profile.lang === 'hi'
            ? 'text-[19px] leading-[2.05]'
            : 'text-[18.5px] leading-[1.95]',
      )}
      lang={profile.lang}
    >
      {rawWords.map((word, index) => {
        const mark = marks[index]
        const canHear = mode === 'practice'
        const canMark = mode === 'test' && testMode === 'manual' && testState === 'running'
        const canPractise =
          mode === 'test' &&
          testState === 'finished' &&
          (mark === 'wrong' || mark === 'skipped')
        const karaokeActive = passageSpeaking && ttsWordIndex === index

        if (canPractise) {
          return (
            <button
              key={`${passage.id}-${index}`}
              type="button"
              data-word-index={index}
              onClick={() =>
                openWordPractice({
                  word,
                  lang: profile.lang,
                  context: getContextSentence(passage.text, word),
                })
              }
              aria-label={`Practise ${normalizeWord(word)}`}
              aria-current={karaokeActive ? 'true' : undefined}
              className={cn(
                'word-token press text-left ring-offset-1 hover:ring-2 hover:ring-rose-200 active:scale-95',
                karaokeActive ? 'karaoke-word' : wordStyle(index),
              )}
            >
              {word}
            </button>
          )
        }

        if (canHear || canMark) {
          return (
            <button
              key={`${passage.id}-${index}`}
              type="button"
              data-word-index={index}
              onClick={() => {
                if (mode === 'practice') speakWord(normalizeWord(word), index)
                else toggleMissedWord(index)
              }}
              aria-pressed={mode === 'test' ? missedIndices.has(index) : undefined}
              aria-current={karaokeActive ? 'true' : undefined}
              className={cn(
                'word-token press text-left',
                karaokeActive ? 'karaoke-word' : wordStyle(index),
                mode === 'test' &&
                  missedIndices.has(index) &&
                  'bg-rose-100 text-rose-700 underline decoration-rose-400 decoration-2 underline-offset-2',
                mode === 'test' &&
                  testState === 'running' &&
                  !missedIndices.has(index) &&
                  'hover:bg-slate-100',
              )}
            >
              {word}
            </button>
          )
        }

        return (
          <span
            key={`${passage.id}-${index}`}
            data-word-index={index}
            aria-current={karaokeActive ? 'true' : undefined}
            className={cn('word-token', karaokeActive ? 'karaoke-word' : wordStyle(index))}
          >
            {word}
          </span>
        )
      })}
    </div>
  )

  const renderPassagePanel = ({ large = false, legend = false } = {}) => (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <p className="truncate text-[10px] font-extrabold text-slate-700">
          <span className="mr-1">{passage.emoji}</span>
          {passage.title}
        </p>
        <span className="shrink-0 text-[9px] font-bold text-slate-500">{rawWords.length} words</span>
      </div>
      <div className="px-3 py-3">
        {legend && testState !== 'idle' ? (
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-300" /> Read correctly
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-rose-300" /> Misread
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-amber-200" /> Skipped
            </span>
          </div>
        ) : null}
        {renderPassageWords({ large })}
        {mode === 'test' && testState === 'finished' ? (
          <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
            <MousePointerClick size={11} /> Tap a red or yellow word to practise it.
          </p>
        ) : null}
      </div>
    </div>
  )

  const practiceWordItems = rawWords
    .map((word, index) => ({ word, index, key: wordKey(word) }))
    .filter((item) => marks[item.index] === 'wrong' || marks[item.index] === 'skipped')
    .filter((item) => !masteredPracticeWords.has(item.key))
  const visiblePracticeWords = practiceWordItems.slice(0, 14)

  const relevantChallenges = challenging.slice(0, 8)
  const passageIndex = availablePassages.findIndex((item) => item.id === passage.id)

  return (
    <div className="space-y-4 pb-2">
      {/* Daily hero */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-4 text-white shadow-lift animate-fade-up">
        <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 right-10 h-32 w-32 rounded-full bg-cyan-300/10" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-100">
              <BookOpen size={12} strokeWidth={2.8} /> Reading coach
            </div>
            <h2 className="mt-1 font-display text-[22px] font-extrabold leading-tight">
              {profile.lang === 'hi' ? 'पढ़ते रहो,' : 'Keep reading,'} {profile.name.split(' ')[0]}!
            </h2>
            <p className="mt-1 text-[11px] font-medium text-blue-100">
              Class {profile.grade} goal · {readingTarget} WPM · Tap any word to hear it.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white" tone="slate">
                <Flame size={11} className="fill-amber-300 text-amber-300" /> {today.wordsRead || 0} words today
              </Badge>
              <span className="text-[10px] font-semibold text-blue-200">
                {today.readingSeconds ? `${Math.round(today.readingSeconds / 60)} min practised` : 'Start your first read'}
              </span>
            </div>
          </div>
          <Ring
            value={today.wordsRead || 0}
            max={dailyGoal}
            size={78}
            stroke={7}
            color="#fbbf24"
            track="rgba(255,255,255,0.22)"
          >
            <span className="font-display text-lg font-extrabold leading-none">{today.wordsRead || 0}</span>
            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-blue-100">of {dailyGoal}</span>
          </Ring>
        </div>
        <div className="relative mt-3">
          <ProgressBar
            value={today.wordsRead || 0}
            max={dailyGoal}
            height="h-1.5"
            className="bg-white/20"
            barClassName="bg-amber-400"
            label="Daily reading goal"
          />
        </div>
      </section>

      <MitraBubble
        mood={companionMood}
        message={companionMessage}
        lang={profile.lang}
        onNudge={nudgeMitra}
      />

      {premiumEnabled && proAccess ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Crown size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-emerald-900">
              {profile.lang === 'hi' ? 'SkillTrack प्रो चालू है' : 'SkillTrack Pro is active'}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold text-emerald-700">
              {profile.lang === 'hi'
                ? 'असीमित रीडिंग और सभी प्रो सुविधाएँ अनलॉक हैं।'
                : 'Unlimited reading and all Pro tools are unlocked.'}
            </p>
          </div>
        </div>
      ) : premiumEnabled ? (
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5',
            readingLocked
              ? 'border-fuchsia-200 bg-gradient-to-r from-violet-50 to-fuchsia-50'
              : 'border-slate-200 bg-white',
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                readingLocked ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-indigo-50 text-indigo-600',
              )}
            >
              {readingLocked ? <LockKeyhole size={15} /> : <Crown size={15} />}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold text-slate-800">
                {readingLocked
                  ? profile.lang === 'hi'
                    ? 'मुफ़्त रीडिंग पूरी हो गईं'
                    : 'Free readings complete'
                  : profile.lang === 'hi'
                    ? 'फ्री रीडिंग प्रीव्यू'
                    : 'Free reading preview'}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-500">
                {profile.lang === 'hi'
                  ? `${Math.min(readingUsed, readingLimit)} / ${readingLimit} रीडिंग उपयोग हुईं`
                  : `${Math.min(readingUsed, readingLimit)} / ${readingLimit} readings used`}
                {!readingLocked && readingLimit - readingUsed > 0
                  ? profile.lang === 'hi'
                    ? ` · ${readingLimit - readingUsed} बाकी`
                    : ` · ${readingLimit - readingUsed} left`
                  : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequestUpgrade}
            className="shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-[9px] font-extrabold text-white shadow-sm transition hover:brightness-110 active:scale-95"
          >
            {readingLocked
              ? profile.lang === 'hi'
                ? 'प्रो अनलॉक करें'
                : 'Unlock Pro'
              : profile.lang === 'hi'
                ? 'प्रो देखें'
                : 'Go Pro'}
          </button>
        </div>
      ) : null}

      {/* Mode switch */}
      <Segmented
        options={[
          { id: 'practice', label: 'Practice', icon: Headphones },
          { id: 'test', label: 'Live test', icon: Mic },
        ]}
        value={mode}
        onChange={changeMode}
      />

      {/* Passage picker */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {availablePassages.map((item, index) => {
          const active = item.id === passage.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPassage(item.id)}
              className={cn(
                'flex min-h-[72px] min-w-[178px] flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98]',
                active
                  ? 'border-blue-500 bg-white shadow-soft ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white/70 hover:border-blue-200',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl',
                  active ? 'bg-blue-50' : 'bg-slate-100',
                )}
              >
                {item.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-extrabold text-slate-800">{item.title}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {item.genre}
                </span>
                <span className="mt-0.5 block text-[9px] font-semibold text-slate-500">
                  {splitWords(item.text).length} words · passage {index + 1}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Passage card */}
      <Card className={cn('overflow-hidden', mode === 'test' && testMode === 'voice' && 'hidden')}>
        <div
          ref={passageCardRef}
          className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 pb-3 pt-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{passage.emoji}</span>
              <h3 className="truncate font-display text-base font-extrabold text-slate-900">{passage.title}</h3>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              <span>{rawWords.length} words</span>
              <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
              <span>{passage.genre}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
              <span>Passage {passageIndex + 1} of {availablePassages.length}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {mode === 'practice' ? (
              <button
                type="button"
                onClick={speakPassage}
                disabled={testState === 'running'}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95',
                  passageSpeaking
                    ? 'border-blue-200 bg-blue-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600',
                )}
                aria-label={passageSpeaking ? 'Stop audio' : 'Listen to the passage'}
                title={passageSpeaking ? 'Stop audio' : 'Listen to passage'}
              >
                {passageSpeaking ? <Square size={13} className="fill-current" /> : <Volume2 size={16} />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => resetTest(targets.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:scale-95"
              aria-label="Reset reading test"
              title="Reset"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          {mode === 'practice' ? (
            <div className="mb-2 flex items-center gap-1.5 rounded-xl bg-blue-50/70 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">
              <MousePointerClick size={12} /> Tap any word to hear its pronunciation
            </div>
          ) : testState !== 'idle' ? (
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-300" /> Read correctly</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-300" /> Misread</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-200" /> Skipped</span>
            </div>
          ) : null}

          {renderPassageWords({ containerRef: karaokeRef })}

          {mode === 'practice' ? (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <Info size={11} /> Word audio uses your device’s {profile.lang === 'hi' ? 'Hindi' : 'English'} voice.
            </p>
          ) : testState === 'running' && testMode === 'manual' ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-amber-700">
              <MousePointerClick size={12} className="mt-0.5 shrink-0" />
              Reading aloud? Tap any word you skip or find difficult. Unmarked words count as correct when you finish.
            </p>
          ) : null}
        </div>
      </Card>

      {/* Test mode selector / fallback notice */}
      {mode === 'test' ? (
        <div className="space-y-3">
          {!recognitionSupported ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-extrabold">Live mic isn’t available in this browser</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">
                  For automatic word-by-word scoring, open SkillTrack in Google Chrome and allow microphone access.
                  You can still use the self-check test below.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500">
                {testMode === 'voice' ? 'Live microphone scoring' : 'Self-check: tap the words you miss'}
              </p>
              <button
                type="button"
                onClick={() => changeTestMode(testMode === 'voice' ? 'manual' : 'voice')}
                className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-blue-600 transition hover:bg-blue-50"
              >
                {testMode === 'voice' ? 'Use self-check' : 'Use microphone'}
              </button>
            </div>
          )}

          {micError ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold leading-relaxed">{micError}</p>
                {recognitionSupported && testMode === 'voice' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMicError('')
                      changeTestMode('manual')
                    }}
                    className="mt-1 text-[10px] font-extrabold text-rose-800 underline"
                  >
                    Switch to self-check mode
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {testState === 'finished' && result ? (
            <Card className="overflow-hidden animate-pop" aria-live="polite">
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3.5 text-white">
                <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/10" />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                      <Trophy size={18} className="text-amber-200" />
                    </span>
                    <div>
                      <p className="font-display text-base font-extrabold leading-none">Test complete!</p>
                      <p className="mt-1 text-[10px] font-medium text-emerald-50">
                        {testMode === 'manual' ? 'Self-check result' : 'Live microphone result'}
                      </p>
                    </div>
                  </div>
                  {saved ? (
                    <Badge className="border-white/20 bg-white/15 text-white" tone="slate">
                      <Check size={10} strokeWidth={3.5} /> Saved
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Speed" value={Math.round(result.wpm)} unit="WPM" tone="blue" icon={Gauge} />
                  <Metric label="Accuracy" value={Math.round(result.accuracy)} unit="%" tone="emerald" icon={Target} />
                  <Metric label="Fluency" value={Math.round(result.fluency)} unit="CWPM" tone="amber" icon={Sparkles} />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2">
                  <div
                    className="flex items-center gap-1"
                    role="img"
                    aria-label={`${stars} out of 3 stars`}
                  >
                    {[0, 1, 2].map((index) => (
                      <Star
                        key={index}
                        size={19}
                        strokeWidth={2.2}
                        fill={index < stars ? '#fbbf24' : 'none'}
                        className={index < stars ? 'text-amber-500' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                  <p className="text-right text-[9px] font-extrabold leading-snug text-amber-800">
                    {starCopy[profile.lang]?.[stars] || starCopy.en[stars]}
                  </p>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <Clock size={10} /> {formatClock(result.seconds)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {result.correct} / {result.total} words correct
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-1',
                      result.wpm >= readingTarget ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    Class target {readingTarget} WPM
                  </span>
                </div>
                {!saved ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[9px] font-semibold text-amber-700">
                    This attempt was too short to save. Read a little longer and finish again to add it to your progress.
                  </p>
                ) : null}

                {result.wpm >= readingTarget && result.accuracy >= 90 ? (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-emerald-700">
                    <Trophy size={13} className="mt-0.5 shrink-0" /> Superb! You are reading at your class level.
                    Try a longer passage next.
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-blue-700">
                    <Target size={13} className="mt-0.5 shrink-0" />
                    {result.accuracy < 90
                      ? 'Practise the red words below, then read once more for accuracy.'
                      : 'Nice accuracy! Read a little faster to reach your class target.'}
                  </div>
                )}

                {testMode === 'voice' ? (
                  <div className="mt-3">{renderPassagePanel({ large: true, legend: true })}</div>
                ) : null}

                {visiblePracticeWords.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      Words to practise ({practiceWordItems.length})
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                      Tap a word for sound, meaning and a one-word mic check.
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {visiblePracticeWords.map((item) => (
                        <button
                          key={`missed-${item.word}-${item.index}`}
                          type="button"
                          onClick={() =>
                            openWordPractice({
                              word: item.word,
                              lang: profile.lang,
                              context: getContextSentence(passage.text, item.word),
                            })
                          }
                          aria-label={`Practise ${normalizeWord(item.word)}`}
                          className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                        >
                          <Mic size={10} /> {item.word}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <ComprehensionQuiz
                  passageId={passage.id}
                  questions={comprehension}
                  lang={profile.lang}
                />

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    full
                    onClick={() => {
                      resetTest(targets.length)
                      if (testMode === 'voice') scrollToVoiceCard()
                      else scrollToPassageCard()
                    }}
                  >
                    <RotateCcw size={15} /> Read again
                  </Button>
                  <Button
                    full
                    onClick={() => {
                      if (testMode === 'voice') {
                        startVoiceTest({ focus: true })
                      } else {
                        startManualTest()
                        scrollToPassageCard()
                      }
                    }}
                  >
                    <Mic size={15} /> Try again
                  </Button>
                </div>
              </div>
            </Card>
          ) : testMode === 'voice' ? (
            <Card className="overflow-hidden">
              <div ref={voiceCardRef} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                    <Timer size={12} /> Live mic test
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-600">
                      {formatClock(elapsed)}
                    </span>
                    {liveMetrics ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-extrabold text-blue-700">
                        {Math.round(liveMetrics.wpm)} WPM
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => resetTest(targets.length)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:scale-95"
                      aria-label="Reset reading test"
                      title="Reset"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col items-center">
                  <div className="relative flex h-[104px] w-[104px] items-center justify-center">
                    {testState === 'running' ? (
                      <>
                        <span className="absolute h-20 w-20 rounded-full bg-rose-400/30 animate-ring" />
                        <span
                          className="absolute h-20 w-20 rounded-full bg-rose-400/20 animate-ring"
                          style={{ animationDelay: '700ms' }}
                        />
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => (testState === 'running' ? finishVoiceTest() : startVoiceTest())}
                      aria-label={testState === 'running' ? 'Stop and see result' : 'Start live reading test'}
                      className={cn(
                        'relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 active:scale-95',
                        testState === 'running'
                          ? 'bg-rose-500 shadow-rose-300/60 hover:bg-rose-600'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-300/60 hover:from-blue-700',
                      )}
                    >
                      {testState === 'running' ? <Square size={26} className="fill-current" /> : <Mic size={30} strokeWidth={2.2} />}
                    </button>
                  </div>
                  <p className="mt-2 font-display text-sm font-extrabold text-slate-800">
                    {testState === 'running'
                      ? 'Listening… read aloud'
                      : testState === 'finished'
                        ? 'Read again whenever you are ready'
                        : 'Tap the mic to begin'}
                  </p>
                  <p className="mt-0.5 text-center text-[10px] font-medium leading-relaxed text-slate-500">
                    {testState === 'running'
                      ? quietListening
                        ? 'Take your time — I’m still listening.'
                        : 'Read clearly. Tap the square when you finish.'
                      : testState === 'finished'
                        ? 'The full story stays below, with your final word colours.'
                        : 'The full story is right below the mic. Words turn green as you speak.'}
                  </p>

                  <div className="mt-3 w-full">
                    <MitraBubble
                      compact
                      mood={companionMood}
                      message={companionMessage}
                      lang={profile.lang}
                    />
                  </div>

                  <div className="mt-2 w-full">
                    {renderPassagePanel({ large: true, legend: true })}
                  </div>

                  {testState === 'running' ? (
                    <div className="mt-3 w-full">
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <Mic size={12} />
                          </span>
                          <p className="truncate text-[10px] font-semibold text-slate-500">
                            {liveTranscript
                              ? `“${liveTranscript}”`
                              : quietListening
                                ? 'Take your time — I’m still listening…'
                                : 'Waiting for your voice…'}
                          </p>
                        </div>
                        <ListeningBars />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-500">
                        <span>
                          {marks.filter((mark) => mark === 'correct' || mark === 'wrong').length} of {targets.length} words
                          attempted
                        </span>
                        <span>{Math.round(liveMetrics?.accuracy || 0)}% accuracy</span>
                      </div>
                    </div>
                  ) : testState === 'finished' ? (
                    <div className="mt-3 flex w-full items-start gap-1.5 rounded-xl bg-rose-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-rose-700">
                      <MousePointerClick size={12} className="mt-0.5 shrink-0" />
                      Tap any red or yellow word above to hear it, learn its meaning and check it with the mic.
                    </div>
                  ) : (
                    <div className="mt-3 flex w-full items-start gap-1.5 rounded-xl bg-blue-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-blue-700">
                      <Info size={12} className="mt-0.5 shrink-0" />
                      Allow microphone access when Chrome asks. Speak in {profile.lang === 'hi' ? 'Hindi' : 'English'} at a
                      steady pace.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                    <Play size={12} /> Self-check test
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-600">
                    {formatClock(elapsed)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-600">
                  Read the passage aloud at your normal pace. Start the timer, then tap every word you skip or find
                  difficult. Finish when you reach the last word.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Words</p>
                    <p className="font-display text-lg font-extrabold text-slate-800">{targets.length}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-3 py-2">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-rose-400">Marked hard</p>
                    <p className="font-display text-lg font-extrabold text-rose-600">{missedIndices.size}</p>
                  </div>
                </div>
                {testState === 'running' ? (
                  <Button full className="mt-3" variant="emerald" onClick={finishManualTest}>
                    <Check size={17} strokeWidth={3} /> Finish reading
                  </Button>
                ) : (
                  <Button full className="mt-3" onClick={startManualTest}>
                    <Timer size={17} /> Start self-check
                  </Button>
                )}
                <p className="mt-2 text-center text-[9px] font-medium text-slate-500">
                  Speed is calculated from the full passage and your reading time.
                </p>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-slate-700">Ready for a score?</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
              Switch to <span className="font-bold text-slate-600">Live test</span> to measure WPM, accuracy and fluency.
            </p>
          </div>
          <button
            type="button"
            onClick={() => changeMode('test')}
            className="ml-auto shrink-0 rounded-full bg-blue-50 px-3 py-2 text-[10px] font-extrabold text-blue-700 transition hover:bg-blue-100"
          >
            Let’s go
          </button>
        </Card>
      )}

      {/* Challenging words */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-extrabold text-slate-900">
              <Target size={15} className="text-rose-500" /> My tricky words
            </h3>
            <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
              Tap a word to practise · शब्द पर टैप करें
            </p>
          </div>
          {challenging.length > 0 ? (
            <button
              type="button"
              onClick={onClearChallenges}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={10} /> Clear
            </button>
          ) : null}
        </div>
        {relevantChallenges.length ? (
          <div className="flex flex-wrap gap-1.5 p-3">
            {relevantChallenges.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-1.5 transition hover:border-rose-200 hover:bg-rose-50"
              >
                <button
                  type="button"
                  onClick={() => speakWord(item.word, item.id, item.lang)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition active:scale-90"
                  aria-label={`Hear ${item.word}`}
                >
                  <Volume2 size={11} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openWordPractice({
                      word: item.word,
                      lang: item.lang,
                      context: findWordContext(item.word, item.lang),
                      id: item.id,
                    })
                  }
                  className="rounded-full px-1 text-[11px] font-bold text-slate-700 transition hover:text-rose-700"
                  aria-label={`Practise ${item.word}`}
                  lang={item.lang}
                >
                  {item.word}
                </button>
                {item.count > 1 ? (
                  <span className="rounded-full bg-rose-100 px-1 text-[8px] font-extrabold text-rose-600">×{item.count}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemoveChallenge(item.id)}
                  aria-label={`Remove ${item.word}`}
                  className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition hover:bg-white hover:text-rose-500"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 size={16} />
            </span>
            <p className="text-[10px] leading-relaxed text-slate-500">
              No tricky words yet. Take a live reading test and any word you miss will appear here for practice.
            </p>
          </div>
        )}
      </Card>

      {!speechSupported ? (
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed">
            Word pronunciation needs a browser with speech synthesis. Chrome, Edge and most Android browsers support it.
          </p>
        </div>
      ) : null}

      <SingleWordPracticeModal
        open={Boolean(practiceWord)}
        word={practiceWord?.word || ''}
        lang={practiceWord?.lang || profile.lang}
        context={practiceWord?.context || ''}
        onClose={() => setPracticeWord(null)}
        onMastered={() => handleWordMastered(practiceWord)}
      />
    </div>
  )
}
