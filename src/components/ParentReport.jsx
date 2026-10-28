import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  GraduationCap,
  Languages,
  PenLine,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import { getBand, getReadingTarget } from '../lib/constants'
import { copyText, downloadTextFile, formatClock, formatShortDate, lastNDays, todayKey } from '../lib/utils'
import { Button } from './ui'

const sectionTitle = 'font-display text-[13px] font-extrabold text-slate-900'

export default function ParentReport({ open, onClose, profile, sessions, essays, mastered, challenging, activity, notify }) {
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const stats = useMemo(() => {
    const validSessions = sessions.filter((session) => Number.isFinite(session.wpm))
    const avgWpm = validSessions.length
      ? Math.round(validSessions.reduce((sum, session) => sum + session.wpm, 0) / validSessions.length)
      : 0
    const avgAccuracy = validSessions.length
      ? Math.round(validSessions.reduce((sum, session) => sum + session.accuracy, 0) / validSessions.length)
      : 0
    const bestWpm = validSessions.length ? Math.round(Math.max(...validSessions.map((session) => session.wpm))) : 0
    const readingMinutes = Math.round(sessions.reduce((sum, session) => sum + (session.seconds || 0), 0) / 60)
    const totalReadWords = sessions.reduce((sum, session) => sum + (session.attempted || 0), 0)
    const essayWords = essays.reduce((sum, essay) => sum + (essay.words || 0), 0)
    const target = getReadingTarget(profile.grade)
    const today = activity?.[todayKey()] || {}
    const week = lastNDays(7, profile.lang).map((day) => {
      const entry = activity?.[day.key] || {}
      return {
        ...day,
        wordsRead: entry.wordsRead || 0,
        wordsWritten: entry.wordsWritten || 0,
        readingSeconds: entry.readingSeconds || 0,
        mastered: entry.mastered || 0,
      }
    })
    return {
      avgWpm,
      avgAccuracy,
      bestWpm,
      readingMinutes,
      totalReadWords,
      essayWords,
      target,
      week,
      todayWords: (today.wordsRead || 0) + (today.wordsWritten || 0),
    }
  }, [sessions, essays, activity, profile.grade, profile.lang])

  const progress = useMemo(() => {
    const validSessions = sessions.filter((session) => Number.isFinite(session.wpm))
    const wpm = validSessions.length
      ? validSessions.reduce((sum, session) => sum + session.wpm, 0) / validSessions.length
      : 0
    const accuracy = validSessions.length
      ? validSessions.reduce((sum, session) => sum + session.accuracy, 0) / validSessions.length
      : 0
    const strengths = []
    const focus = []

    if (validSessions.length === 0) {
      focus.push('Complete a first reading test to set a baseline.')
    } else {
      if (wpm >= stats.target) strengths.push(`Reading speed is at the Class ${profile.grade} target (${Math.round(wpm)} WPM).`)
      else focus.push(`Build reading speed from ${Math.round(wpm)} WPM towards the ${stats.target} WPM class target.`)
      if (accuracy >= 90) strengths.push(`Word recognition is strong at ${Math.round(accuracy)}% accuracy.`)
      else focus.push(`Re-read familiar passages aloud to lift accuracy above 90% (currently ${Math.round(accuracy)}%).`)
    }

    if (essays.length >= 2) strengths.push(`A steady writing habit: ${essays.length} alekh pieces saved.`)
    else focus.push('Write one short alekh each week and use three golden words.')

    if (mastered.length >= 5) strengths.push(`Vocabulary is growing: ${mastered.length} words mastered.`)
    else focus.push('Finish a word quiz each day to move words to the mastered shelf.')

    if (challenging.length > 0) {
      focus.push(`Practise the ${challenging.length} tricky word${challenging.length === 1 ? '' : 's'} listed below.`)
    }

    if (!focus.length) focus.push('Keep the daily routine going and try a longer passage next.')

    return { strengths, focus }
  }, [sessions, essays, mastered.length, challenging.length, profile.grade, stats.target])

  const weekRows = stats.week
  const recentSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const recentEssays = [...essays].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  const streak = useMemo(() => {
    const has = (key) => {
      const entry = activity?.[key]
      if (!entry) return false
      return (
        (entry.wordsRead || 0) > 0 ||
        (entry.essays || 0) > 0 ||
        (entry.wordsWritten || 0) > 0 ||
        (entry.mastered || 0) > 0 ||
        (entry.quizzes || 0) > 0
      )
    }
    const cursor = new Date()
    if (!has(todayKey())) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    for (let i = 0; i < 3650; i += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
        cursor.getDate(),
      ).padStart(2, '0')}`
      if (!has(key)) break
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [activity])

  const summary = useMemo(() => {
    const name = profile.name.split(' ')[0]
    const readPart = sessions.length
      ? `read ${stats.totalReadWords} words across ${sessions.length} reading test${sessions.length === 1 ? '' : 's'} at an average of ${stats.avgWpm} WPM and ${stats.avgAccuracy}% accuracy`
      : 'has not completed a reading test yet'
    const writePart = essays.length
      ? `written ${essays.length} alekh piece${essays.length === 1 ? '' : 's'} (${stats.essayWords} words)`
      : 'not yet saved an alekh'
    const vocabPart = mastered.length
      ? `mastered ${mastered.length} word${mastered.length === 1 ? '' : 's'}`
      : 'not yet mastered a word-bank card'
    return `${name} has ${readPart}, ${writePart}, and ${vocabPart}. Current practice streak: ${streak} day${streak === 1 ? '' : 's'}.`
  }, [profile.name, sessions.length, essays.length, mastered.length, stats, streak])

  const reportText = useMemo(() => {
    const lines = []
    lines.push('SKILLTRACK · STUDENT PROGRESS REPORT')
    lines.push('='.repeat(44))
    lines.push(`Student: ${profile.name}`)
    lines.push(`Class: ${profile.grade} (${getBand(profile.grade).label})`)
    lines.push(`Practice language: ${profile.lang === 'hi' ? 'Hindi (हिंदी)' : 'English'}`)
    lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`)
    lines.push(`Practice streak: ${streak} day${streak === 1 ? '' : 's'}`)
    lines.push('')
    lines.push('LEARNING SUMMARY')
    lines.push(summary)
    lines.push('')
    lines.push('KEY NUMBERS')
    lines.push(`Reading speed (avg): ${stats.avgWpm} WPM (class target ${stats.target} WPM)`)
    lines.push(`Reading accuracy (avg): ${stats.avgAccuracy}%`)
    lines.push(`Best reading speed: ${stats.bestWpm} WPM`)
    lines.push(`Reading time: ${stats.readingMinutes} minutes`)
    lines.push(`Alekh written: ${essays.length} piece${essays.length === 1 ? '' : 's'}, ${stats.essayWords} words`)
    lines.push(`Words mastered: ${mastered.length}`)
    lines.push(`Tricky words to practise: ${challenging.length}`)
    lines.push('')
    lines.push('THIS WEEK')
    weekRows.forEach((day) => {
      lines.push(
        `${day.weekday} ${formatShortDate(day.date)}: ${day.wordsRead} words read, ${day.wordsWritten} words written, ${Math.round(
          day.readingSeconds / 60,
        )} min reading, ${day.mastered} mastered`,
      )
    })
    lines.push('')
    lines.push('STRENGTHS')
    progress.strengths.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
    lines.push('NEXT FOCUS')
    progress.focus.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
    lines.push('RECENT READING')
    if (recentSessions.length) {
      recentSessions.forEach((session) => {
        lines.push(
          `- ${formatShortDate(session.date)} · ${session.passageTitle} · ${Math.round(session.wpm)} WPM · ${Math.round(
            session.accuracy,
          )}% · ${formatClock(session.seconds)}`,
        )
      })
    } else {
      lines.push('- No reading tests yet.')
    }
    lines.push('')
    lines.push('ALEKH / WRITING')
    if (recentEssays.length) {
      recentEssays.forEach((essay) => {
        lines.push(`- ${formatShortDate(essay.date)} · ${essay.title} · ${essay.words} words`)
      })
    } else {
      lines.push('- No essays saved yet.')
    }
    lines.push('')
    lines.push(`MASTERED WORDS (${mastered.length})`)
    lines.push(mastered.length ? mastered.map((word) => word.word).join(', ') : 'None yet.')
    lines.push('')
    lines.push(`WORDS TO PRACTISE (${challenging.length})`)
    lines.push(challenging.length ? challenging.slice(0, 25).map((word) => word.word).join(', ') : 'None yet.')
    lines.push('')
    lines.push('Generated by SkillTrack · saved locally on this device.')
    return lines.join('\n')
  }, [profile, streak, summary, stats, essays.length, weekRows, progress, recentSessions, recentEssays, mastered, challenging])

  const copySummary = async () => {
    const short = [
      `SkillTrack progress · ${profile.name} · Class ${profile.grade}`,
      summary,
      `Reading: ${stats.avgWpm} WPM, ${stats.avgAccuracy}% accuracy`,
      `Writing: ${essays.length} alekh (${stats.essayWords} words)`,
      `Vocabulary: ${mastered.length} words mastered`,
      `Streak: ${streak} days`,
    ].join('\n')
    const ok = await copyText(short)
    notify(ok ? 'Parent summary copied to clipboard.' : 'Could not copy. Please try download instead.', ok ? 'success' : 'error')
  }

  const download = () => {
    const safeName = profile.name.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'student'
    downloadTextFile(`skilltrack-${safeName}-class${profile.grade}.txt`, reportText)
    notify('Progress report downloaded.', 'success')
  }

  if (!open) return null

  return createPortal(
    <div
      className="report-overlay fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <button type="button" aria-label="Close report" onClick={onClose} className="print-hide absolute inset-0 cursor-default" />
      <div className="report-dialog relative z-10 flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl animate-slide-up sm:rounded-[28px] sm:animate-pop">
        <div className="print-hide flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h2 id="report-title" className="font-display text-base font-extrabold text-slate-900">
              Parent & teacher view
            </h2>
            <p className="text-[10px] font-medium text-slate-500">A clean summary you can share or print.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="report-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="print-area p-5">
            {/* Report header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-4 text-white">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-200">
                    <GraduationCap size={13} /> SkillTrack progress report
                  </p>
                  <h3 className="mt-1.5 font-display text-xl font-extrabold leading-none">{profile.name}</h3>
                  <p className="mt-1 text-[10px] font-semibold text-blue-100">
                    Class {profile.grade} · {getBand(profile.grade).label} · {profile.lang === 'hi' ? 'Hindi' : 'English'}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold ring-1 ring-white/20">
                  {profile.name.trim().charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                  <CalendarDays size={10} /> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 text-amber-100">
                  <Flame size={10} className="fill-amber-300 text-amber-300" /> {streak}-day streak
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                  <Languages size={10} /> {profile.lang === 'hi' ? 'हिंदी' : 'English'}
                </span>
              </div>
            </div>

            <section className="mt-4">
              <h4 className={sectionTitle}>Learning summary</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{summary}</p>
            </section>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-blue-500">
                  <TrendingUp size={10} /> Reading speed
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold leading-none text-blue-800">
                  {stats.avgWpm} <span className="text-[9px] font-bold text-blue-500">WPM</span>
                </p>
                <p className="mt-1 text-[8px] font-semibold text-blue-600/80">
                  {stats.avgAccuracy}% accuracy · best {stats.bestWpm}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-600">
                  <PenLine size={10} /> Alekh writing
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold leading-none text-amber-800">
                  {essays.length} <span className="text-[9px] font-bold text-amber-600">essays</span>
                </p>
                <p className="mt-1 text-[8px] font-semibold text-amber-700/80">{stats.essayWords} words written</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-emerald-600">
                  <Brain size={10} /> Words mastered
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold leading-none text-emerald-800">{mastered.length}</p>
                <p className="mt-1 text-[8px] font-semibold text-emerald-700/80">Across word-bank quizzes</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-rose-500">
                  <Target size={10} /> Focus words
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold leading-none text-rose-800">{challenging.length}</p>
                <p className="mt-1 text-[8px] font-semibold text-rose-600/80">{stats.readingMinutes} minutes of reading</p>
              </div>
            </div>

            <section className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5">
                <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 size={11} /> Strengths
                </p>
                <ul className="mt-1.5 space-y-1">
                  {progress.strengths.length ? (
                    progress.strengths.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-1 text-[9px] font-medium leading-relaxed text-emerald-800/80">
                        <span className="text-emerald-500">•</span> {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-[9px] text-emerald-700/70">Practice will reveal strengths here.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-2.5">
                <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
                  <Sparkles size={11} /> Next focus
                </p>
                <ul className="mt-1.5 space-y-1">
                  {progress.focus.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-1 text-[9px] font-medium leading-relaxed text-amber-800/80">
                      <span className="text-amber-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-4">
              <h4 className={sectionTitle}>This week</h4>
              <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[8px] font-extrabold uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-1.5">Day</th>
                      <th className="px-1 py-1.5 text-right">Read</th>
                      <th className="px-1 py-1.5 text-right">Wrote</th>
                      <th className="px-1 py-1.5 text-right">Min</th>
                      <th className="px-2 py-1.5 text-right">Words</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weekRows.map((day) => (
                      <tr key={day.key} className="text-[9px] font-semibold text-slate-600">
                        <td className="px-2 py-1.5">
                          <span className={day.isToday ? 'font-extrabold text-blue-700' : ''}>{day.weekday}</span>
                          <span className="ml-1 text-slate-500">{day.dayNumber}</span>
                        </td>
                        <td className="px-1 py-1.5 text-right">{day.wordsRead}</td>
                        <td className="px-1 py-1.5 text-right">{day.wordsWritten}</td>
                        <td className="px-1 py-1.5 text-right">{Math.round(day.readingSeconds / 60)}</td>
                        <td className="px-2 py-1.5 text-right">{day.mastered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-4">
              <h4 className={sectionTitle}>Recent reading</h4>
              {recentSessions.length ? (
                <div className="mt-1.5 space-y-1">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-extrabold text-slate-700">{session.passageTitle}</p>
                        <p className="text-[8px] font-medium text-slate-500">
                          {formatShortDate(session.date)} · {formatClock(session.seconds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-extrabold text-blue-700">{Math.round(session.wpm)} WPM</p>
                        <p className="text-[8px] font-semibold text-emerald-600">{Math.round(session.accuracy)}% accuracy</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[9px] font-medium text-slate-500">
                  No reading tests yet.
                </p>
              )}
            </section>

            <section className="mt-4">
              <h4 className={sectionTitle}>Alekh / writing</h4>
              {recentEssays.length ? (
                <div className="mt-1.5 space-y-1">
                  {recentEssays.map((essay) => (
                    <div key={essay.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-extrabold text-slate-700">{essay.title}</p>
                        <p className="text-[8px] font-medium text-slate-500">{formatShortDate(essay.date)}</p>
                      </div>
                      <p className="shrink-0 text-[9px] font-extrabold text-amber-700">
                        {essay.words} words
                        {essay.golden?.length ? <span className="ml-1 font-semibold text-emerald-600">· {essay.golden.length} golden</span> : null}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[9px] font-medium text-slate-500">
                  No essays saved yet.
                </p>
              )}
            </section>

            <section className="mt-4">
              <h4 className={sectionTitle}>Mastered words</h4>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {mastered.length ? (
                  mastered.slice(0, 18).map((word) => (
                    <span
                      key={word.id || word.word}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700"
                      lang={word.lang}
                    >
                      {word.word}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] font-medium text-slate-500">No mastered words yet.</span>
                )}
                {mastered.length > 18 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-500">
                    +{mastered.length - 18} more
                  </span>
                ) : null}
              </div>
            </section>

            <section className="mt-4">
              <h4 className={sectionTitle}>Words to practise</h4>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {challenging.length ? (
                  challenging.slice(0, 18).map((word) => (
                    <span
                      key={word.id || word.word}
                      className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[8px] font-bold text-rose-600"
                      lang={word.lang}
                    >
                      {word.word}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] font-medium text-slate-500">No tricky words recorded.</span>
                )}
                {challenging.length > 18 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-500">
                    +{challenging.length - 18} more
                  </span>
                ) : null}
              </div>
            </section>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-3">
              <p className="text-[8px] font-semibold leading-relaxed text-slate-500">
                Generated by SkillTrack · practice data stored privately on this device.
              </p>
              <span className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-blue-600">
                <BookOpen size={10} /> SkillTrack
              </span>
            </div>
          </div>
        </div>

        <div className="print-hide border-t border-slate-100 bg-slate-50/80 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" full onClick={download}>
              <Download size={15} /> Download report
            </Button>
            <Button variant="secondary" full onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" full size="sm" onClick={copySummary}>
              <Copy size={13} /> Copy summary
            </Button>
            <Button variant="ghost" full size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
