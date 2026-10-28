import { useEffect, useRef, useState } from 'react'

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

export const getRecognitionClass = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export const isRecognitionSupported = () => Boolean(getRecognitionClass())

const pickVoice = (lang) => {
  if (!isSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const exact = voices.find((voice) => voice.lang?.toLowerCase() === locale.toLowerCase())
  if (exact) return exact
  const regional = voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang))
  if (regional) return regional
  if (lang === 'hi') {
    const hindi = voices.find((voice) => /hindi|हिंदी/i.test(voice.name))
    if (hindi) return hindi
  }
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith('en')) || voices[0] || null
}

export const speakText = (text, lang = 'en', options = {}) => {
  if (!isSpeechSupported() || !text) return false
  const { rate = 0.92, pitch = 1, onEnd, onStart, onBoundary } = options
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(String(text))
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = rate
    utterance.pitch = pitch
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice
    utterance.onstart = () => onStart?.()
    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()
    utterance.onboundary = (event) => {
      // Some engines emit sentence boundaries as well; karaoke only needs
      // word boundaries. An empty name is still usable in older engines.
      if (event.name && event.name !== 'word') return
      onBoundary?.(event)
    }
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    onEnd?.()
    return false
  }
}

export const stopSpeaking = () => {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}

let successAudioContext = null

const getSuccessAudioContext = () => {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!successAudioContext) successAudioContext = new AudioContextClass()
  return successAudioContext
}

export const unlockSuccessSound = () => {
  const context = getSuccessAudioContext()
  if (context?.state === 'suspended') context.resume().catch(() => {})
}

export const playSuccessChime = () => {
  const context = getSuccessAudioContext()
  if (!context) return

  const play = () => {
    try {
      const now = context.currentTime
      ;[523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = now + index * 0.12
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, start)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.3)
      })
    } catch {
      // Sound is a bonus; the visual success state still works.
    }
  }

  if (context.state === 'suspended') {
    context.resume().then(play).catch(() => {})
  } else {
    play()
  }
}

export const useSpeech = () => {
  const [speakingKey, setSpeakingKey] = useState(null)
  const keyRef = useRef(null)

  const stop = () => {
    keyRef.current = null
    setSpeakingKey(null)
    stopSpeaking()
  }

  const speak = (text, lang, key = 'default', options = {}) => {
    if (!text) return false
    if (keyRef.current === key) {
      stop()
      return false
    }
    keyRef.current = key
    setSpeakingKey(key)
    const started = speakText(text, lang, {
      ...options,
      onEnd: () => {
        if (keyRef.current === key) {
          keyRef.current = null
          setSpeakingKey(null)
        }
        options.onEnd?.()
      },
    })
    if (!started) setSpeakingKey(null)
    return started
  }

  useEffect(() => {
    if (!isSpeechSupported()) return undefined
    const warm = () => window.speechSynthesis.getVoices()
    warm()
    window.speechSynthesis.addEventListener?.('voiceschanged', warm)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warm)
      stopSpeaking()
    }
  }, [])

  return { speak, stop, speakingKey, isSpeaking: Boolean(speakingKey) }
}
