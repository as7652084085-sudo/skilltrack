import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookMarked,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { getVocab, vocabulary } from '../data/vocabulary'
import { POS_LABELS } from '../lib/constants'
import { isSpeechSupported, useSpeech } from '../lib/speech'
import { cn, seededShuffle } from '../lib/utils'
import { Badge, Button, Card, Modal, ProgressBar } from './ui'

const accents = [
  { bar: 'from-blue-500 to-indigo-600', soft: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100', chip: 'blue' },
  { bar: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', chip: 'emerald' },
  { bar: 'from-amber-400 to-orange-500', soft: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', chip: 'amber' },
  { bar: 'from-violet-500 to-purple-600', soft: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100', chip: 'violet' },
  { bar: 'from-rose-500 to-pink-600', soft: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100', chip: 'rose' },
]

const buildQuestions = (words, lang, seed) => {
  const chosen = seededShuffle(words, seed).slice(0, 3)
  const pool = vocabulary.filter(
    (word) => word.lang === lang && !chosen.some((item) => item.id === word.id),
  )
  return chosen.map((word, index) => {
    const meanings = [
      ...new Set(
        pool
          .filter((item) => item.meaning.toLowerCase() !== word.meaning.toLowerCase())
          .map((item) => item.meaning),
      ),
    ]
    const distractors = seededShuffle(meanings, seed + index * 17 + 3).slice(0, 3)
    const options = seededShuffle([word.meaning, ...distractors], seed + index * 29 + 7)
    return { word, options }
  })
}

export default function VocabModule({ profile, mastered, onQuizComplete, notify }) {
  const words = useMemo(() => getVocab(profile.grade, profile.lang), [profile.grade, profile.lang])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [quizFinished, setQuizFinished] = useState(false)
  const [score, setScore] = useState(0)
  const completedRef = useRef(false)
  const { speak, stop, speakingKey } = useSpeech()

  const word = words[index] || words[0]
  const accent = accents[index % accents.length]
  const langLabel = (language) => (language === 'hi' ? 'हिंदी' : 'English')
  const otherLang = profile.lang === 'hi' ? 'en' : 'hi'

  const isMastered = (vocabWord) => mastered.some((item) => item.wordId === vocabWord.id)
  const masteredForGrade = words.filter((item) => isMastered(item)).length
  const totalMastered = mastered.length
  const currentMastered = word ? isMastered(word) : false

  const goTo = (nextIndex) => {
    stop()
    const next = (nextIndex + words.length) % words.length
    setIndex(next)
    setRevealed(false)
  }

  const speakWord = (text, key, language = profile.lang) => {
    if (!isSpeechSupported()) {
      notify('Audio is not supported in this browser. Try Chrome.', 'info')
      return
    }
    speak(text, language, key, { rate: language === 'hi' ? 0.8 : 0.84 })
  }

  const startQuiz = () => {
    if (words.length < 3) {
      notify('Not enough words in this word bank for a quiz.', 'error')
      return
    }
    stop()
    const seed = (Date.now() % 9973) + 11
    const nextQuestions = buildQuestions(words, profile.lang, seed)
    setQuestions(nextQuestions)
    setQuestionIndex(0)
    setSelected(null)
    setAnswers([])
    setQuizFinished(false)
    setScore(0)
    completedRef.current = false
    setQuizOpen(true)
  }

  const chooseAnswer = (option) => {
    if (selected !== null || quizFinished) return
    const question = questions[questionIndex]
    const correct = option === question.word.meaning
    setSelected(option)
    setAnswers((previous) => [
      ...previous,
      {
        wordId: question.word.id,
        word: question.word.word,
        meaning: question.word.meaning,
        selected: option,
        correct,
      },
    ])
  }

  const finishQuiz = () => {
    const total = questions.length
    const correctCount = answers.filter((answer) => answer.correct).length
    setScore(correctCount)
    setQuizFinished(true)
    if (!completedRef.current) {
      completedRef.current = true
      onQuizComplete({
        lang: profile.lang,
        grade: profile.grade,
        questions: questions.map((question) => question.word),
        answers,
        score: correctCount,
        total,
      })
      notify(
        `Quiz complete · ${correctCount}/${total} correct`,
        correctCount === total ? 'reward' : correctCount >= 2 ? 'success' : 'info',
      )
    }
  }

  const nextQuestion = () => {
    if (selected === null) return
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((previous) => previous + 1)
      setSelected(null)
      stop()
    } else {
      finishQuiz()
    }
  }

  const closeQuiz = () => {
    stop()
    setQuizOpen(false)
    if (!quizFinished) {
      setSelected(null)
      setAnswers([])
    }
  }

  const currentQuestion = questions[questionIndex]
  const isCorrect = selected !== null && currentQuestion && selected === currentQuestion.word.meaning

  if (!word) {
    return (
      <Card className="mt-4 p-6 text-center">
        <p className="text-sm font-bold text-slate-700">No words found for this class.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4 pb-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-4 text-white shadow-[0_16px_36px_-18px_rgba(16,185,129,0.8)] animate-fade-up">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 left-6 h-32 w-32 rounded-full bg-lime-200/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-100">
              <BookMarked size={12} strokeWidth={2.8} /> Word Bank · शब्दकोश
            </div>
            <h2 className="mt-1 font-display text-[22px] font-extrabold leading-tight">Five words a day.</h2>
            <p className="mt-1 text-[11px] font-medium text-emerald-50">
              Class {profile.grade} · {profile.lang === 'hi' ? 'हिंदी' : 'English'} word cards with audio and meanings.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <Badge className="border-white/20 bg-white/15 text-white" tone="slate">
                <CheckCircle2 size={10} /> {masteredForGrade}/{words.length} this class
              </Badge>
              <Badge className="border-white/20 bg-white/15 text-white" tone="slate">
                <Brain size={10} /> {totalMastered} mastered
              </Badge>
            </div>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Brain size={23} strokeWidth={2.2} />
          </span>
        </div>
        <div className="relative mt-3">
          <ProgressBar
            value={masteredForGrade}
            max={words.length}
            height="h-1.5"
            className="bg-white/20"
            barClassName="bg-amber-300"
            label="Word mastery progress"
          />
        </div>
      </section>

      {/* Flashcard */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="font-display text-base font-extrabold text-slate-900">Today’s word cards</h2>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
            {profile.lang === 'hi' ? 'शब्द सुनो, अर्थ जानो' : 'Listen, flip and learn the meaning.'}
          </p>
        </div>
        <Badge tone={currentMastered ? 'emerald' : accent.chip}>
          {currentMastered ? (
            <>
              <Check size={10} strokeWidth={3.5} /> Mastered
            </>
          ) : (
            `${index + 1} of ${words.length}`
          )}
        </Badge>
      </div>

      <div className="flip-stage h-[310px]">
        <div className={cn('flip-inner relative h-full w-full', revealed && 'is-flipped')}>
          {/* Front */}
          <div className="flip-face absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
            <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.bar)} />
            <div className="flex items-center justify-between px-4 pt-3">
              <div className="flex items-center gap-1.5">
                <Badge tone="slate">{POS_LABELS[profile.lang][word.pos] || word.pos}</Badge>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-300">
                  {langLabel(profile.lang)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => speakWord(word.word, `word-${word.id}`)}
                aria-label={`Hear ${word.word}`}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90',
                  speakingKey === `word-${word.id}` ? 'bg-emerald-500 text-white' : `${accent.soft} ${accent.text}`,
                )}
              >
                <Volume2 size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-600">
                Word of the day
              </span>
              <h3
                className={cn(
                  'mt-2 font-display font-extrabold leading-tight text-slate-900',
                  word.word.length > 12 ? 'text-[34px]' : 'text-[46px]',
                )}
                lang={profile.lang}
              >
                {word.word}
              </h3>
              <p className="mt-3 max-w-[230px] text-[11px] font-medium leading-relaxed text-slate-500">
                {profile.lang === 'hi'
                  ? 'अर्थ जानने के लिए कार्ड पलटो और उदाहरण पढ़ो।'
                  : 'Flip the card to learn the meaning and a sample sentence.'}
              </p>
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className={cn(
                  'press flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-xl text-[12px] font-extrabold transition',
                  accent.soft,
                  accent.text,
                  'hover:brightness-95',
                )}
              >
                <RotateCcw size={14} /> Reveal meaning
              </button>
            </div>
          </div>

          {/* Back */}
          <div className="flip-face flip-back absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-soft">
            <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.bar)} />
            <div className="flex items-center justify-between px-4 pt-3">
              <Badge tone={accent.chip}>
                <CheckCircle2 size={10} /> {langLabel(otherLang)} meaning
              </Badge>
              <button
                type="button"
                onClick={() => speakWord(word.word, `word-${word.id}`)}
                aria-label={`Hear ${word.word}`}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90',
                  speakingKey === `word-${word.id}` ? 'bg-emerald-500 text-white' : `${accent.soft} ${accent.text}`,
                )}
              >
                <Volume2 size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-extrabold text-slate-900" lang={profile.lang}>
                  {word.word}
                </h3>
                <span className="text-[9px] font-bold text-slate-500">
                  {POS_LABELS[profile.lang][word.pos]} · {POS_LABELS[otherLang][word.pos]}
                </span>
              </div>
              <p className={cn('mt-0.5 font-display text-[26px] font-extrabold leading-tight', accent.text)} lang={otherLang}>
                {word.meaning}
              </p>
              <div className="mt-2.5 rounded-2xl border border-slate-100 bg-white p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-600">In a sentence</p>
                  <button
                    type="button"
                    onClick={() => speakWord(word.example, `example-${word.id}`)}
                    className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Volume2 size={10} /> Hear
                  </button>
                </div>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-600" lang={profile.lang}>
                  “{word.example}”
                </p>
              </div>
              <p className="mt-2 text-[9px] font-medium leading-relaxed text-slate-500">
                {profile.lang === 'hi' ? 'नीचे दिए उदाहरण में शब्द का प्रयोग देखो।' : 'Notice how the word is used in the example above.'}
              </p>
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setRevealed(false)}
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-extrabold text-slate-500 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <RotateCcw size={13} /> Back to word
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card nav */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95"
          aria-label="Previous word"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          {words.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(dotIndex)}
              aria-label={`Go to word ${dotIndex + 1}`}
              className="flex h-6 w-6 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  dotIndex === index ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-400 hover:bg-slate-500',
                )}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95"
          aria-label="Next word"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quiz CTA */}
      <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Sparkles size={20} className="text-amber-300" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-extrabold">Quick 3-question quiz</h3>
            <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-blue-100">
              Match words with meanings. Every correct answer joins your mastered shelf.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={startQuiz}
          className="press relative mt-3 flex min-h-[44px] w-full items-center justify-between rounded-xl bg-white px-3.5 text-[12px] font-extrabold text-blue-700 transition hover:bg-blue-50"
        >
          Start word quiz
          <ArrowRight size={16} />
        </button>
      </Card>

      {/* Word shelf */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-extrabold text-slate-900">
              <Brain size={15} className="text-emerald-500" /> Today’s word shelf
            </h3>
            <p className="mt-0.5 text-[9px] font-semibold text-slate-500">Tap a word to open its card</p>
          </div>
          <Badge tone="emerald">
            {masteredForGrade}/{words.length}
          </Badge>
        </div>
        <div className="divide-y divide-slate-100">
          {words.map((item, wordIndex) => {
            const done = isMastered(item)
            return (
              <div
                key={item.id}
                className="flex min-h-[48px] w-full items-center gap-2 px-4 py-2 transition hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    goTo(wordIndex)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold',
                      done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {done ? <Check size={13} strokeWidth={3.5} /> : wordIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate text-[12px] font-extrabold text-slate-800" lang={profile.lang}>
                        {item.word}
                      </span>
                      <span className="shrink-0 text-[9px] font-semibold text-slate-500" lang={otherLang}>
                        {item.meaning}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] font-medium text-slate-500">
                      {POS_LABELS[profile.lang][item.pos]}
                    </span>
                  </span>
                  <span className="sr-only">Open word card</span>
                </button>
                <button
                  type="button"
                  onClick={() => speakWord(item.word, `shelf-${item.id}`)}
                  aria-label={`Hear ${item.word}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Volume2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
        <Lightbulb size={14} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-[10px] font-medium leading-relaxed text-emerald-800/80">
          Say each word aloud, then use it in your own sentence. Words you answer correctly in the quiz are saved as
          mastered.
        </p>
      </div>

      {/* Quiz modal */}
      <Modal
        open={quizOpen}
        onClose={closeQuiz}
        title={quizFinished ? 'Quiz result' : 'Quick word quiz'}
        subtitle={
          quizFinished
            ? 'Your word shelf has been updated.'
            : `Question ${Math.min(questionIndex + 1, questions.length)} of ${questions.length} · Match the meaning`
        }
      >
        {!quizFinished && currentQuestion ? (
          <div>
            <ProgressBar
              value={questionIndex + (selected ? 1 : 0)}
              max={questions.length}
              className="mb-4"
              barClassName="bg-emerald-500"
              label="Quiz progress"
            />

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 text-center">
              <Badge tone="slate">{POS_LABELS[profile.lang][currentQuestion.word.pos] || currentQuestion.word.pos}</Badge>
              <div className="mt-2 flex items-center justify-center gap-2">
                <h3 className="font-display text-[32px] font-extrabold leading-tight text-slate-900" lang={profile.lang}>
                  {currentQuestion.word.word}
                </h3>
                <button
                  type="button"
                  onClick={() => speakWord(currentQuestion.word.word, `quiz-${currentQuestion.word.id}`)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition active:scale-90"
                  aria-label={`Hear ${currentQuestion.word.word}`}
                >
                  <Volume2 size={15} />
                </button>
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">
                What does this word mean in {otherLang === 'hi' ? 'Hindi' : 'English'}?
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {currentQuestion.options.map((option, optionIndex) => {
                const isAnswer = option === currentQuestion.word.meaning
                const isPicked = selected === option
                let style = 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                if (selected !== null) {
                  if (isAnswer) style = 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  else if (isPicked) style = 'border-rose-300 bg-rose-50 text-rose-700'
                  else style = 'border-slate-200 bg-white text-slate-500'
                }
                return (
                  <button
                    key={`${option}-${optionIndex}`}
                    type="button"
                    onClick={() => chooseAnswer(option)}
                    disabled={selected !== null}
                    className={cn(
                      'flex min-h-[50px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] font-bold transition active:scale-[0.99] disabled:cursor-default',
                      style,
                    )}
                    lang={otherLang}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold',
                        selected !== null && isAnswer
                          ? 'bg-emerald-500 text-white'
                          : selected !== null && isPicked
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {selected !== null && isAnswer ? (
                        <Check size={12} strokeWidth={3.5} />
                      ) : selected !== null && isPicked ? (
                        <X size={12} strokeWidth={3.5} />
                      ) : (
                        String.fromCharCode(65 + optionIndex)
                      )}
                    </span>
                    {option}
                  </button>
                )
              })}
            </div>

            {selected !== null ? (
              <div
                className={cn(
                  'mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold leading-relaxed animate-fade-in',
                  isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                )}
              >
                {isCorrect ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <Lightbulb size={14} className="mt-0.5 shrink-0" />}
                <span>
                  {isCorrect ? 'Correct! ' : `The answer is “${currentQuestion.word.meaning}”. `}
                  {currentQuestion.word.example}
                </span>
              </div>
            ) : null}

            <Button
              full
              className="mt-4"
              variant={selected === null ? 'secondary' : 'emerald'}
              disabled={selected === null}
              onClick={nextQuestion}
            >
              {questionIndex === questions.length - 1 ? 'See my result' : 'Next question'}
              <ArrowRight size={16} />
            </Button>
            <p className="mt-2 text-center text-[9px] font-medium text-slate-500">
              Correct answers are saved to your mastered words.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div
              className={cn(
                'mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg',
                score === questions.length
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                  : score >= 2
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200'
                    : 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-200',
              )}
            >
              <Trophy size={36} className={score >= 2 ? 'text-amber-100' : 'text-white/90'} />
            </div>
            <h3 className="mt-3 font-display text-xl font-extrabold text-slate-900">
              {score === questions.length
                ? 'Perfect score!'
                : score >= 2
                  ? 'Well done!'
                  : 'Good try — keep practising!'}
            </h3>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              You matched <span className="text-emerald-600">{score}</span> of {questions.length} words correctly.
            </p>

            <div className="mt-3 flex items-center justify-center gap-1">
              {questions.map((question, starIndex) => {
                const answer = answers[starIndex]
                return (
                  <Star
                    key={question.word.id}
                    size={28}
                    className={cn(
                      'transition',
                      answer?.correct ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200',
                    )}
                  />
                )
              })}
            </div>

            <div className="mt-4 space-y-1.5 text-left">
              {answers.map((answer) => (
                <div
                  key={answer.wordId}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2',
                    answer.correct ? 'bg-emerald-50' : 'bg-rose-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white',
                      answer.correct ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                  >
                    {answer.correct ? <Check size={12} strokeWidth={3.5} /> : <X size={12} strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-slate-800" lang={profile.lang}>
                      {answer.word}
                    </span>
                    <span className="block truncate text-[10px] font-semibold text-slate-500" lang={otherLang}>
                      {answer.meaning}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-medium leading-relaxed text-slate-500">
              {score === questions.length
                ? 'All three words are now on your mastered shelf. Come back tomorrow for a new set.'
                : 'Words you missed have been added to your tricky word list for extra practice.'}
            </p>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" full onClick={startQuiz}>
                <RotateCcw size={14} /> Try again
              </Button>
              <Button full onClick={closeQuiz}>
                Done <Check size={15} strokeWidth={3} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
