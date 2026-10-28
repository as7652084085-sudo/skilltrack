import { useState } from 'react'
import { ArrowRight, Check, Mic, PenLine, Sparkles, User } from 'lucide-react'
import { GRADES, LANGS, getBand } from '../lib/constants'
import { cn } from '../lib/utils'

const features = [
  { icon: Mic, label: 'Speak', sub: 'Read aloud' },
  { icon: PenLine, label: 'Write', sub: 'Daily alekh' },
  { icon: Sparkles, label: 'Grow', sub: 'Word bank' },
]

export default function ProfileSetup({ onComplete }) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(null)
  const [lang, setLang] = useState('en')
  const [error, setError] = useState('')

  const band = grade ? getBand(grade) : null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Please enter the student’s name (at least 2 letters).')
      return
    }
    if (!grade) {
      setError('Please choose a class from 1 to 8.')
      return
    }
    onComplete({ name: name.trim(), grade, lang })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-700">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-36 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] stripe-bg" />

      <main className="relative z-10 flex flex-1 flex-col px-6 pb-7 pt-9">
        <div className="flex items-center gap-2.5 text-white">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/90 shadow-sm ring-1 ring-white/30 backdrop-blur">
            <img
              src="/logo.png"
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold leading-none tracking-tight">SkillTrack</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/80">
              Bilingual skills coach
            </p>
          </div>
        </div>

        <div className="mt-9 animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-blue-50 backdrop-blur">
            <Sparkles size={12} className="text-amber-300" /> Class 1 – 8 · Hindi & English
          </span>
          <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.03] tracking-tight text-white">
            Read. Write.
            <br />
            <span className="text-amber-300">Grow.</span>
          </h1>
          <p className="mt-3 max-w-[300px] text-[13px] font-medium leading-relaxed text-blue-100">
            Daily reading fluency, creative writing and a growing word bank — one friendly coach for your child.
          </p>
          <p className="mt-1 font-display text-sm font-semibold text-blue-200/90">
            पढ़ो, लिखो और हर दिन आगे बढ़ो।
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2.5 py-2.5 backdrop-blur"
            >
              <feature.icon size={16} className="shrink-0 text-amber-300" strokeWidth={2.4} />
              <div>
                <p className="text-[11px] font-extrabold leading-none text-white">{feature.label}</p>
                <p className="mt-0.5 text-[9px] font-medium leading-none text-blue-200">{feature.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-[28px] bg-white p-5 shadow-2xl shadow-blue-950/30 animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900">Let’s set up your profile</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Your coach adapts to your class and language.</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <User size={17} strokeWidth={2.3} />
            </span>
          </div>

          <label htmlFor="student-name" className="mt-4 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Student name
          </label>
          <input
            id="student-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            maxLength={30}
            placeholder="e.g. Aarav Sharma"
            autoComplete="name"
            className="mt-1.5 min-h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-500 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Class</p>
            {band ? (
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', band.chip)}>
                {band.emoji} {band.label}
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5" role="group" aria-label="Choose class">
            {GRADES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setGrade(item)
                  setError('')
                }}
                aria-pressed={grade === item}
                className={cn(
                  'flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-extrabold transition-all duration-150 active:scale-95',
                  grade === item
                    ? 'border-blue-600 bg-blue-600 text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.9)]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-slate-500">
            {band ? band.note : 'Select a class to see the right reading and writing level.'}
          </p>

          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Learning language</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {Object.values(LANGS).map((language) => {
              const active = lang === language.id
              return (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setLang(language.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-[54px] items-center justify-between rounded-2xl border px-3.5 text-left transition-all duration-150 active:scale-[0.98]',
                    active
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <span>
                    <span className="block text-sm font-extrabold text-slate-900">
                      {language.id === 'en' ? 'English' : 'हिंदी'}
                    </span>
                    <span className="block text-[10px] font-medium text-slate-600">
                      {language.id === 'en' ? 'en-IN · Read & write' : 'hi-IN · पढ़ें और लिखें'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-transparent',
                    )}
                  >
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                </button>
              )
            })}
          </div>

          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="press mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-[15px] font-extrabold text-white shadow-lift transition hover:bg-blue-700"
          >
            Start my journey
            <ArrowRight size={18} strokeWidth={2.8} />
          </button>

          <p className="mt-3 text-center text-[10px] font-medium text-slate-500">
            Progress is saved privately on this device. No sign-up needed.
          </p>
        </form>

        <p className="mt-auto pt-6 text-center text-[10px] font-semibold tracking-wide text-blue-200/70">
          Made for curious learners · अभ्यास से सफलता
        </p>
      </main>
    </div>
  )
}
