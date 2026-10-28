import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, Check, RotateCcw, Sparkles, X } from 'lucide-react'
import { playSuccessChime } from '../lib/speech'
import { seededShuffle } from '../lib/utils'
import { Badge, Button } from './ui'

const stringSeed = (value = '') =>
  String(value)
    .split('')
    .reduce((total, char, index) => (total + char.charCodeAt(0) * (index + 1)) % 99991, 7)

export default function ComprehensionQuiz({ passageId, questions = [], lang = 'en' }) {
  const [answers, setAnswers] = useState({})
  const completedRef = useRef(false)

  const prepared = useMemo(
    () =>
      questions.map((question, index) => {
        const options = question.options.map((label, optionIndex) => ({
          label,
          correct: optionIndex === question.answer,
        }))
        return {
          ...question,
          options: seededShuffle(options, stringSeed(passageId) + index * 97 + 11),
        }
      }),
    [passageId, questions],
  )

  const allAnswered = prepared.length > 0 && prepared.every((_, index) => answers[index] !== undefined)
  const score = prepared.reduce((total, question, index) => {
    const selected = answers[index]
    return total + (question.options[selected]?.correct ? 1 : 0)
  }, 0)
  const perfect = allAnswered && score === prepared.length

  useEffect(() => {
    if (!perfect || completedRef.current) return
    completedRef.current = true
    playSuccessChime()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 40, 70])
    }
  }, [perfect])

  if (!prepared.length) return null

  const title = lang === 'hi' ? 'कहानी समझें' : 'Story check'
  const subtitle =
    lang === 'hi'
      ? 'कहानी पढ़ने के बाद दो छोटे सवालों के जवाब दें।'
      : 'Two quick questions to check what you understood.'

  const reset = () => {
    completedRef.current = false
    setAnswers({})
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <div className="flex items-start justify-between gap-2 border-b border-violet-100 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Brain size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[13px] font-extrabold text-violet-950">{title}</p>
            <p className="mt-0.5 text-[9px] font-semibold leading-relaxed text-violet-700/75">{subtitle}</p>
          </div>
        </div>
        <Badge tone={perfect ? 'emerald' : 'violet'} className="shrink-0">
          {score}/{prepared.length}
        </Badge>
      </div>

      <div className="space-y-3 p-3">
        {prepared.map((question, questionIndex) => {
          const selectedIndex = answers[questionIndex]
          const answered = selectedIndex !== undefined
          return (
            <div key={`${passageId}-${questionIndex}`}>
              <p className="text-[11px] font-extrabold leading-snug text-slate-800">
                <span className="mr-1 text-violet-600">{questionIndex + 1}.</span>
                {question.q}
              </p>
              <div className="mt-1.5 grid gap-1.5" role="group" aria-label={question.q}>
                {question.options.map((option, optionIndex) => {
                  const selected = selectedIndex === optionIndex
                  const showCorrect = answered && option.correct
                  const showWrong = selected && !option.correct
                  return (
                    <button
                      key={`${questionIndex}-${optionIndex}`}
                      type="button"
                      onClick={() => {
                        if (answered) return
                        setAnswers((previous) => ({ ...previous, [questionIndex]: optionIndex }))
                      }}
                      disabled={answered}
                      aria-pressed={selected}
                      className={[
                        'flex min-h-[38px] w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[10px] font-bold transition active:scale-[0.99]',
                        showCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : showWrong
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : answered
                              ? 'border-slate-200 bg-white/60 text-slate-400'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={[
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[8px] font-extrabold',
                            showCorrect
                              ? 'border-emerald-400 bg-emerald-500 text-white'
                              : showWrong
                                ? 'border-rose-400 bg-rose-500 text-white'
                                : 'border-slate-300 bg-white text-slate-500',
                          ].join(' ')}
                        >
                          {showCorrect ? <Check size={10} strokeWidth={3.5} /> : showWrong ? <X size={10} strokeWidth={3.5} /> : String.fromCharCode(65 + optionIndex)}
                        </span>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {answered ? (
                <p
                  className={[
                    'mt-1 flex items-start gap-1 text-[9px] font-bold leading-relaxed',
                    question.options[selectedIndex]?.correct ? 'text-emerald-700' : 'text-rose-600',
                  ].join(' ')}
                  aria-live="polite"
                >
                  {question.options[selectedIndex]?.correct ? (
                    <>
                      <Sparkles size={10} className="mt-0.5 shrink-0" />
                      {lang === 'hi' ? 'बहुत बढ़िया, सही जवाब!' : 'Well done, that is correct!'}
                    </>
                  ) : (
                    <>
                      <X size={10} className="mt-0.5 shrink-0" />
                      {lang === 'hi' ? 'इसका सही जवाब हरा वाला है।' : 'The green option is the correct answer.'}
                    </>
                  )}
                </p>
              ) : null}
            </div>
          )
        })}

        {allAnswered ? (
          <div
            className={[
              'flex items-center justify-between gap-2 rounded-xl px-2.5 py-2',
              perfect ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800',
            ].join(' ')}
            aria-live="polite"
          >
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold">
              {perfect ? <Sparkles size={13} /> : <Brain size={13} />}
              {perfect
                ? lang === 'hi'
                  ? 'शाबाश! कहानी पूरी तरह समझ आई।'
                  : 'Brilliant! You understood the whole story.'
                : lang === 'hi'
                  ? `आपने ${score} में से ${prepared.length} सही किए।`
                  : `You got ${score} of ${prepared.length} right.`}
            </p>
            <button
              type="button"
              onClick={reset}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[9px] font-extrabold text-slate-600 transition hover:bg-white active:scale-95"
            >
              <RotateCcw size={9} /> {lang === 'hi' ? 'फिर से' : 'Retry'}
            </button>
          </div>
        ) : null}

        {!allAnswered ? (
          <Button size="sm" variant="soft" full onClick={reset} className="text-[10px]">
            <RotateCcw size={12} /> {lang === 'hi' ? 'जवाब साफ़ करें' : 'Clear answers'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
