import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  FlaskConical,
  Mic,
  PenLine,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Volume2,
} from 'lucide-react'
import { getBand, getDailyGoal, getReadingTarget } from '../lib/constants'
import { useSpeech } from '../lib/speech'
import {
  bestStreak,
  computeStreak,
  formatClock,
  lastNDays,
  relativeDay,
  todayKey,
} from '../lib/utils'
import ParentReport from './ParentReport'
import WeeklyChart from './WeeklyChart'
import { Badge, Button, Card, ConfirmDialog, ProgressBar, Ring } from './ui'

function StatCard({ icon: Icon, tone, label, value, unit, sub, footer, barValue, barMax, barClass }) {
  const tones = {
    blue: { wrap: 'border-blue-100 bg-blue-50/50', icon: 'bg-blue-100 text-blue-700', value: 'text-blue-800', label: 'text-blue-700' },
    amber: { wrap: 'border-amber-100 bg-amber-50/50', icon: 'bg-amber-100 text-amber-700', value: 'text-amber-800', label: 'text-amber-700' },
    emerald: { wrap: 'border-emerald-100 bg-emerald-50/50', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-800', label: 'text-emerald-700' },
    rose: { wrap: 'border-rose-100 bg-rose-50/50', icon: 'bg-rose-100 text-rose-700', value: 'text-rose-800', label: 'text-rose-700' },
  }
  const style = tones[tone]
  return (
    <div className={`rounded-2xl border p-3 ${style.wrap}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon size={16} strokeWidth={2.3} />
        </span>
        <span className={`text-[8px] font-extrabold uppercase tracking-wide ${style.label}`}>{label}</span>
      </div>
      <p className={`mt-2 font-display text-[26px] font-extrabold leading-none ${style.value}`}>
        {value}
        {unit ? <span className="ml-1 text-[9px] font-bold">{unit}</span> : null}
      </p>
      <p className="mt-1 text-[9px] font-semibold leading-tight text-slate-600">{sub}</p>
      {typeof barValue === 'number' ? (
        <ProgressBar
          value={barValue}
          max={barMax}
          height="h-1.5"
          className="mt-2 bg-white/80"
          barClassName={barClass || 'bg-blue-500'}
          label={sub}
        />
      ) : null}
      {footer ? <p className="mt-1.5 text-[8px] font-bold uppercase tracking-wide text-slate-600">{footer}</p> : null}
    </div>
  )
}

export default function TrackModule({
  profile,
  sessions,
  essays,
  mastered,
  challenging,
  quizLog,
  activity,
  demo,
  onLoadDemo,
  onClearDemo,
  onEditProfile,
  onNavigate,
  notify,
}) {
  const [reportOpen, setReportOpen] = useState(false)
  const [clearDemoOpen, setClearDemoOpen] = useState(false)
  const { speak, speakingKey } = useSpeech()

  const stats = useMemo(() => {
    const valid = sessions.filter((session) => Number.isFinite(session.wpm))
    const avgWpm = valid.length ? Math.round(valid.reduce((sum, session) => sum + session.wpm, 0) / valid.length) : 0
    const avgAccuracy = valid.length
      ? Math.round(valid.reduce((sum, session) => sum + session.accuracy, 0) / valid.length)
      : 0
    const bestWpm = valid.length ? Math.round(Math.max(...valid.map((session) => session.wpm))) : 0
    const readingMinutes = Math.round(sessions.reduce((sum, session) => sum + (session.seconds || 0), 0) / 60)
    const essayWords = essays.reduce((sum, essay) => sum + (essay.words || 0), 0)
    const goldenWords = essays.reduce((sum, essay) => sum + (essay.golden?.length || 0), 0)
    const today = activity?.[todayKey()] || {}
    const todayWords = (today.wordsRead || 0) + (today.wordsWritten || 0)
    const weekly = lastNDays(7, profile.lang).map((day) => {
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
      essayWords,
      goldenWords,
      today,
      todayWords,
      weekly,
      streak: computeStreak(activity),
      bestStreak: bestStreak(activity),
      target: getReadingTarget(profile.grade),
      goal: getDailyGoal(profile.grade),
      masteredThisClass: mastered.filter((word) => word.grade === profile.grade && word.lang === profile.lang).length,
    }
  }, [sessions, essays, mastered, activity, profile.grade, profile.lang])

  const recent = useMemo(() => {
    const items = [
      ...sessions.map((session) => ({
        id: `read-${session.id}`,
        kind: 'read',
        date: session.date,
        title: session.passageTitle || 'Reading practice',
        detail: `${Math.round(session.wpm)} WPM · ${Math.round(session.accuracy)}% accuracy`,
        meta: formatClock(session.seconds),
        lang: session.lang,
      })),
      ...essays.map((essay) => ({
        id: `write-${essay.id}`,
        kind: 'write',
        date: essay.date,
        title: essay.title,
        detail: `${essay.words} words${essay.golden?.length ? ` · ${essay.golden.length} golden` : ''}`,
        meta: essay.lang === 'hi' ? 'हिंदी लेख' : 'English alekh',
        lang: essay.lang,
      })),
      ...quizLog.map((quiz) => ({
        id: `quiz-${quiz.id}`,
        kind: 'quiz',
        date: quiz.date,
        title: 'Word bank quiz',
        detail: `${quiz.score}/${quiz.total} words matched`,
        meta: quiz.lang === 'hi' ? 'शब्दकोश' : 'Vocabulary',
        lang: quiz.lang,
      })),
    ]
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  }, [sessions, essays, quizLog])

  const hasData = sessions.length + essays.length + mastered.length + quizLog.length > 0
  const goalPercent = Math.min(100, Math.round((stats.todayWords / stats.goal) * 100))
  const readingOnTarget = stats.avgWpm >= stats.target

  const kindStyles = {
    read: { icon: BookOpen, wrap: 'bg-blue-50 text-blue-600' },
    write: { icon: PenLine, wrap: 'bg-amber-50 text-amber-600' },
    quiz: { icon: Brain, wrap: 'bg-emerald-50 text-emerald-600' },
  }

  return (
    <div className="space-y-4 pb-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 p-4 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.9)] animate-fade-up">
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 font-display text-xl font-extrabold text-white shadow-lg shadow-amber-900/20 ring-2 ring-white/20">
              {profile.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-300">My progress</p>
              <h2 className="truncate font-display text-[21px] font-extrabold leading-tight">
                Hi, {profile.name.split(' ')[0]}!
              </h2>
              <p className="mt-0.5 text-[10px] font-semibold text-blue-200">
                Class {profile.grade} · {getBand(profile.grade).label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            aria-label="Edit student profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-blue-100 ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95"
          >
            <Settings2 size={16} />
          </button>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/10">
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-300">
              <Flame size={11} className="fill-amber-400 text-amber-400" /> Streak
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold leading-none">
              {stats.streak} <span className="text-[9px] font-bold text-blue-200">days</span>
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/10">
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-emerald-300">
              <Trophy size={11} /> Best
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold leading-none">
              {stats.bestStreak} <span className="text-[9px] font-bold text-blue-200">days</span>
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/10">
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide text-blue-300">
              <Clock size={11} /> Reading
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold leading-none">
              {stats.readingMinutes} <span className="text-[9px] font-bold text-blue-200">min</span>
            </p>
          </div>
        </div>
      </section>

      {/* Demo banner */}
      {demo ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-amber-800">Sample progress is on</p>
            <p className="mt-0.5 text-[9px] font-medium leading-relaxed text-amber-700">
              This dashboard includes demo results so you can explore. Your own sessions will add to it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setClearDemoOpen(true)}
            className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-extrabold text-amber-700 transition hover:bg-white"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Today's goal */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Ring value={stats.todayWords} max={stats.goal} size={78} stroke={8} color="#10b981" track="#d1fae5">
            <span className="font-display text-lg font-extrabold leading-none text-slate-900">{goalPercent}%</span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-500">of goal</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={12} className="text-emerald-600" />
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Today’s practice goal</p>
            </div>
            <p className="mt-1 font-display text-base font-extrabold leading-tight text-slate-900">
              {stats.todayWords >= stats.goal ? 'Daily goal complete! 🎉' : `${stats.goal - stats.todayWords} words to go`}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
              {stats.todayWords} of {stats.goal} words read & written
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-700">
                <BookOpen size={9} className="mr-0.5 inline" /> {stats.today.wordsRead || 0} read
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[8px] font-bold text-amber-700">
                <PenLine size={9} className="mr-0.5 inline" /> {stats.today.wordsWritten || 0} written
              </span>
            </div>
          </div>
        </div>
        <ProgressBar
          value={stats.todayWords}
          max={stats.goal}
          className="mt-3"
          barClassName="bg-gradient-to-r from-blue-500 to-emerald-500"
          label="Daily practice goal"
        />
      </Card>

      {/* Skill overview */}
      <div className="flex items-end justify-between px-0.5">
        <div>
          <h2 className="font-display text-base font-extrabold text-slate-900">Skill overview</h2>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">The three skills that build confident language.</p>
        </div>
        <Badge tone={readingOnTarget ? 'emerald' : 'amber'}>
          <Target size={9} /> {stats.target} WPM goal
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          icon={BookOpen}
          tone="blue"
          label="Reading"
          value={stats.avgWpm}
          unit="WPM"
          sub={`${stats.avgAccuracy}% avg accuracy`}
          barValue={stats.avgAccuracy}
          barMax={100}
          barClass="bg-blue-500"
          footer={readingOnTarget ? `On target · best ${stats.bestWpm}` : `Best ${stats.bestWpm} WPM`}
        />
        <StatCard
          icon={PenLine}
          tone="amber"
          label="Alekh"
          value={essays.length}
          unit="essays"
          sub={`${stats.essayWords} words written`}
          footer={`${stats.goldenWords} golden words`}
        />
        <StatCard
          icon={Brain}
          tone="emerald"
          label="Vocab"
          value={mastered.length}
          unit="words"
          sub={`${stats.masteredThisClass}/5 this class`}
          barValue={stats.masteredThisClass}
          barMax={5}
          barClass="bg-emerald-500"
          footer="Mastered shelf"
        />
        <StatCard
          icon={Target}
          tone="rose"
          label="Tricky"
          value={challenging.length}
          unit="words"
          sub="Saved for extra practice"
          footer={challenging[0] ? `Latest: ${challenging[0].word}` : 'No tricky words yet'}
        />
      </div>

      {/* Weekly chart */}
      <Card className="p-4">
        <WeeklyChart data={stats.weekly} lang={profile.lang} />
      </Card>

      {/* Parent report */}
      <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-100/60 blur-xl" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.8)]">
            <FileText size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-extrabold text-slate-900">Parent & teacher report</h3>
            <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-500">
              A clean scorecard with strengths, focus areas, weekly activity and reading history.
            </p>
          </div>
          <ArrowUpRight size={17} className="shrink-0 text-blue-400" />
        </div>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="press relative mt-3 flex min-h-[44px] w-full items-center justify-between rounded-xl bg-white px-3.5 text-[11px] font-extrabold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        >
          Open parent view
          <ArrowRight size={15} />
        </button>
      </Card>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="font-display text-sm font-extrabold text-slate-900">Recent activity</h3>
            <p className="mt-0.5 text-[9px] font-semibold text-slate-500">Your latest reading, writing and word work</p>
          </div>
          <TrendingUp size={16} className="text-emerald-500" />
        </div>
        {recent.length ? (
          <div className="divide-y divide-slate-100">
            {recent.map((item) => {
              const style = kindStyles[item.kind]
              const Icon = style.icon
              return (
                <div key={item.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.wrap}`}>
                    <Icon size={14} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-slate-800">{item.title}</p>
                    <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-500">{item.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-bold text-slate-500">{relativeDay(item.date, profile.lang)}</p>
                    <p className="mt-0.5 text-[8px] font-medium text-slate-500">{item.meta}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Sparkles size={20} />
            </span>
            <p className="mt-2 text-[11px] font-extrabold text-slate-700">Your activity feed is waiting</p>
            <p className="mt-0.5 max-w-[240px] text-[9px] leading-relaxed text-slate-500">
              Finish a reading test, save an essay or complete a word quiz to see it here.
            </p>
          </div>
        )}
      </Card>

      {/* Focus words */}
      {challenging.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="flex items-center gap-1.5 font-display text-sm font-extrabold text-slate-900">
                <Target size={14} className="text-rose-500" /> Focus words
              </h3>
              <p className="mt-0.5 text-[9px] font-semibold text-slate-500">Tap to hear each tricky word</p>
            </div>
            <Badge tone="rose">{challenging.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3">
            {challenging.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => speak(item.word, item.lang, `track-${item.id}`, { rate: 0.82 })}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-2.5 text-[10px] font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                lang={item.lang}
              >
                <Volume2
                  size={10}
                  className={speakingKey === `track-${item.id}` ? 'text-rose-500' : 'text-slate-500'}
                />
                {item.word}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavigate('read')}
              className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 transition hover:bg-blue-100"
            >
              Practise <ChevronRight size={11} />
            </button>
          </div>
        </Card>
      ) : null}

      {/* Empty starter */}
      {!hasData ? (
        <Card className="border-dashed border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[12px] font-extrabold text-slate-800">Your dashboard is ready</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600">
                Practise once, or load a small sample to see how progress reports look. Sample data never replaces your
                own results.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" full onClick={() => onNavigate('read')}>
              <Mic size={14} /> Start reading
            </Button>
            <Button full onClick={onLoadDemo}>
              <FlaskConical size={14} /> See sample
            </Button>
          </div>
        </Card>
      ) : null}

      <p className="pb-1 text-center text-[9px] font-semibold tracking-wide text-slate-500">
        Everything is saved privately on this device · {profile.lang === 'hi' ? 'आपकी प्रगति सुरक्षित है' : 'Your progress, your pace'}
      </p>

      <ParentReport
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        profile={profile}
        sessions={sessions}
        essays={essays}
        mastered={mastered}
        challenging={challenging}
        activity={activity}
        notify={notify}
      />

      <ConfirmDialog
        open={clearDemoOpen}
        onClose={() => setClearDemoOpen(false)}
        onConfirm={onClearDemo}
        title="Clear sample progress?"
        message="This removes the demo reading results, essays, words and streak. Any real practice you have added will be kept."
        confirmLabel="Clear sample"
      />
    </div>
  )
}
