import { Flame, Globe2 } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Header({ profile, streak, onToggleLang, onEditProfile }) {
  const isHi = profile.lang === 'hi'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 surface-blur">
      <div className="flex h-[62px] items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.8)] ring-1 ring-blue-100">
            <img
              src="/logo.png"
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[19px] font-extrabold leading-none tracking-tight text-slate-900">
              Skill<span className="text-blue-600">Track</span>
            </h1>
            <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {isHi ? 'पढ़ो · लिखो · बढ़ो' : 'Read · Write · Grow'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'flex h-9 items-center gap-1 rounded-full border px-2',
              streak > 0
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500',
            )}
            title={`${streak} day practice streak`}
          >
            <Flame
              size={15}
              strokeWidth={2.6}
              className={streak > 0 ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}
            />
            <span className="text-xs font-extrabold leading-none">{streak}</span>
          </div>

          <button
            type="button"
            onClick={onToggleLang}
            aria-label={`${isHi ? 'हिं' : 'EN'} · switch to ${isHi ? 'English' : 'Hindi'}`}
            className="flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white pl-1 pr-1 transition hover:border-blue-200 hover:bg-blue-50 active:scale-95"
            title="Switch language"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
              <Globe2 size={13} strokeWidth={2.6} />
            </span>
            <span className="pr-1.5 text-[11px] font-extrabold text-slate-700">{isHi ? 'हिं' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onEditProfile}
            title="Open student profile"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-white shadow-sm ring-2 ring-white transition active:scale-95"
          >
            {profile.name.trim().charAt(0).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[8px] font-bold text-white">
              {profile.grade}
            </span>
            <span className="sr-only">Open student profile</span>
          </button>
        </div>
      </div>
    </header>
  )
}
