import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import { vocabulary } from '../data/vocabulary'
import { wordGlossary } from '../data/wordGlossary'
import { getPhonicsBreakdown } from '../lib/phonics'
import { isWordMatch, transcriptToWords } from '../lib/reading'
import {
  getRecognitionClass,
  isRecognitionSupported,
  playSuccessChime,
  stopSpeaking,
  unlockSuccessSound,
  useSpeech,
} from '../lib/speech'
import { normalizeWord } from '../lib/utils'
import { Badge, Button, Modal } from './ui'

const micErrorCopy = {
  'not-allowed': 'माइक्रोफ़ोन की अनुमति बंद है। Browser settings में mic allow करें।',
  'service-not-allowed': 'Browser ने microphone block किया है। Settings में allow करें।',
  'audio-capture': 'कोई microphone नहीं मिला। Mic जोड़कर फिर कोशिश करें।',
  network: 'Speech service से connection नहीं बना। Internet जाँचकर फिर कोशिश करें।',
  'language-not-supported': 'यह browser इस भाषा का उच्चारण check नहीं कर सकता। Chrome आज़माएँ।',
}

export default function SingleWordPracticeModal({
  open,
  word = '',
  lang = 'en',
  context = '',
  onClose,
  onMastered,
}) {
  const [status, setStatus] = useState('idle')
  const [heard, setHeard] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)
  const finalWordsRef = useRef([])
  const heardWordsRef = useRef([])
  const masteredRef = useRef(false)
  const { speak, stop, speakingKey } = useSpeech()
  const recognitionSupported = useMemo(() => isRecognitionSupported(), [])
  const cleanWord = useMemo(() => normalizeWord(word), [word])
  const meaningLang = lang === 'en' ? 'hi' : 'en'

  const entry = useMemo(
    () =>
      vocabulary.find(
        (item) => item.lang === lang && normalizeWord(item.word) === cleanWord,
      ),
    [cleanWord, lang],
  )

  const meaning = entry?.meaning || wordGlossary[lang]?.[cleanWord] || ''
  const example = entry?.example || context
  const phonics = useMemo(() => getPhonicsBreakdown(word, lang), [word, lang])

  const stopRecognition = useCallback(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      try {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.abort()
      } catch {
        // The browser may already have closed the session.
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    setStatus('idle')
    setHeard('')
    setError('')
    finalWordsRef.current = []
    heardWordsRef.current = []
    masteredRef.current = false

    return () => {
      stopRecognition()
      stopSpeaking()
    }
  }, [open, cleanWord, lang, stopRecognition])

  const handleClose = () => {
    stopRecognition()
    stop()
    onClose?.()
  }

  const handleListen = () => {
    if (!cleanWord) return
    stopRecognition()
    setStatus('idle')
    setHeard('')
    setError('')
    unlockSuccessSound()
    speak(cleanWord, lang, 'single-word-practice', {
      rate: lang === 'hi' ? 0.66 : 0.72,
    })
  }

  const markMastered = useCallback(() => {
    if (masteredRef.current) return
    masteredRef.current = true
    stopRecognition()
    setStatus('correct')
    setHeard('')
    setError('')
    playSuccessChime()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 90])
    }
    onMastered?.()
  }, [onMastered, stopRecognition])

  const checkWords = useCallback(
    (words) => {
      if (!cleanWord || !words?.length) return false
      const matched =
        words.some((spoken) => isWordMatch(cleanWord, spoken)) ||
        isWordMatch(cleanWord, words.join(''))
      if (matched) markMastered()
      return matched
    },
    [cleanWord, markMastered],
  )

  const startCheck = () => {
    if (!recognitionSupported || !cleanWord || status === 'correct') return
    const Recognition = getRecognitionClass()
    if (!Recognition) {
      setStatus('error')
      setError('इस browser में word check उपलब्ध नहीं है। Chrome में खोलकर देखें।')
      return
    }

    stopRecognition()
    stop()
    unlockSuccessSound()
    finalWordsRef.current = []
    heardWordsRef.current = []
    masteredRef.current = false
    setHeard('')
    setError('')
    setStatus('listening')

    const recognition = new Recognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) {
          finalWordsRef.current = [
            ...finalWordsRef.current,
            ...transcriptToWords(piece),
          ]
        } else {
          interim += ` ${piece}`
        }
      }
      const words = [
        ...finalWordsRef.current,
        ...transcriptToWords(interim),
      ]
      heardWordsRef.current = words
      setHeard(words.join(' '))
      checkWords(words)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setStatus('retry')
      setError(
        micErrorCopy[event.error] ||
          'आवाज़ पहचानने में दिक्कत आई। फिर से कोशिश करें।',
      )
      stopRecognition()
    }

    recognition.onend = () => {
      recognitionRef.current = null
      clearTimeout(timeoutRef.current)
      if (masteredRef.current) return
      if (!checkWords(heardWordsRef.current)) {
        setStatus('retry')
        if (!heardWordsRef.current.length) {
          setError('कुछ सुनाई नहीं दिया। शब्द को साफ़ बोलकर फिर कोशिश करें।')
        }
      }
    }

    recognitionRef.current = recognition
    timeoutRef.current = window.setTimeout(() => {
      if (recognitionRef.current === recognition) {
        stopRecognition()
        if (!masteredRef.current) {
          setStatus('retry')
          setError('आवाज़ नहीं आई। शब्द को ज़ोर से और साफ़ बोलें।')
        }
      }
    }, 8000)

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setStatus('error')
      setError('माइक्रोफ़ोन शुरू नहीं हो पाया। Permission जाँचकर फिर कोशिश करें।')
    }
  }

  const isSpeaking = speakingKey === 'single-word-practice'
  const heading = lang === 'hi' ? 'शब्द अभ्यास' : 'Word practice'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={heading}
      subtitle="एक शब्द सुनो, बोलो और master करो"
      className="max-w-sm"
    >
      <div className="text-center">
        <Badge tone={lang === 'hi' ? 'amber' : 'blue'}>
          {lang === 'hi' ? 'हिंदी' : 'English'}
          {entry?.pos ? ` · ${entry.pos}` : ''}
        </Badge>
        <p
          className="mt-3 break-words font-display text-[42px] font-extrabold leading-tight tracking-tight text-slate-900"
          lang={lang}
        >
          {word}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Listen · Say it · Master it
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 text-left">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
          Meaning · अर्थ
        </p>
        {meaning ? (
          <p className="mt-1 text-xl font-extrabold leading-snug text-blue-950" lang={meaningLang}>
            {meaning}
          </p>
        ) : (
          <p className="mt-1 text-[11px] font-bold leading-relaxed text-blue-900">
            कहानी के संदर्भ में इस शब्द का अर्थ समझें:
          </p>
        )}
        {example ? (
          <p className="mt-2 border-t border-blue-100 pt-2 text-[11px] font-semibold leading-relaxed text-blue-900/75" lang={lang}>
            “{example}”
          </p>
        ) : null}
      </div>

      {phonics.units.length ? (
        <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-violet-600">
              {phonics.label} · ध्वनि
            </p>
            <Sparkles size={11} className="text-violet-400" />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {phonics.units.map((unit, index) => (
              <span
                key={`${unit}-${index}`}
                className="rounded-lg border border-violet-200 bg-white px-2 py-1 font-display text-base font-extrabold text-violet-800"
                lang={lang}
              >
                {unit}
              </span>
            ))}
          </div>
          {phonics.soundOut ? (
            <p className="mt-2 text-[10px] font-bold leading-relaxed text-violet-700/80" lang={lang}>
              {lang === 'hi' ? 'बोलकर जोड़ें: ' : 'Sound it out: '}
              <span className="font-extrabold text-violet-950">{phonics.soundOut}</span>
            </p>
          ) : null}
          <p className="mt-1 text-[9px] font-semibold leading-relaxed text-violet-600/75">{phonics.hint}</p>
        </div>
      ) : null}

      {status !== 'correct' ? (
        <div className="mt-3 grid gap-2">
          <Button variant="secondary" full onClick={handleListen}>
            {isSpeaking ? (
              <Square size={15} className="fill-current" />
            ) : (
              <Volume2 size={16} />
            )}
            {isSpeaking ? 'ऑडियो रोकें' : 'उच्चारण सुनें · Listen'}
          </Button>
          <Button
            full
            onClick={startCheck}
            loading={status === 'listening'}
            disabled={!recognitionSupported}
          >
            {status === 'listening' ? null : <Mic size={16} />}
            {status === 'listening' ? 'सुन रहे हैं…' : 'बोलकर चेक करें · Speak & check'}
          </Button>
        </div>
      ) : null}

      {!recognitionSupported ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-amber-800">
          इस browser में microphone check उपलब्ध नहीं है। Chrome में खोलकर कोशिश करें।
        </p>
      ) : null}

      <div className="mt-3" aria-live="polite">
        {status === 'listening' ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-800">
            <Loader2 size={17} className="mt-0.5 shrink-0 animate-spin" />
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold">सुन रहे हैं…</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-blue-700/75">
                {heard ? `“${heard}”` : 'सिर्फ़ यही शब्द साफ़ बोलें'}
              </p>
            </div>
          </div>
        ) : null}

        {status === 'correct' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <div>
                <p className="text-[12px] font-extrabold">शाबाश! सही उच्चारण 🎉</p>
                <p className="mt-0.5 text-[10px] font-semibold text-emerald-700">
                  Great job! यह शब्द अब master हो गया है।
                </p>
              </div>
            </div>
            <Button full className="mt-3" variant="emerald" onClick={handleClose}>
              <Sparkles size={15} /> Done · आगे बढ़ें
            </Button>
          </div>
        ) : null}

        {status === 'retry' || status === 'error' ? (
          <div
            className={cnStatus(status)}
          >
            <div className="flex items-start gap-2.5">
              <RotateCcw size={17} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold">
                  {status === 'error' ? 'Mic check रुका' : 'फिर कोशिश करें'}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold leading-relaxed opacity-80">
                  {error || (heard ? `सुना गया: “${heard}”` : 'शब्द को साफ़ बोलें।')}
                </p>
              </div>
            </div>
            <Button
              full
              variant="secondary"
              className="mt-3"
              onClick={startCheck}
              disabled={!recognitionSupported}
            >
              <Mic size={15} /> फिर बोलें · Try again
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

const cnStatus = (status) =>
  status === 'error'
    ? 'rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-800'
    : 'rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800'
