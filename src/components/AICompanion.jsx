import { useId } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const moodStyles = {
  idle: {
    wrap: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50',
    label: 'bg-blue-100 text-blue-700',
    text: 'text-slate-600',
  },
  listening: {
    wrap: 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50',
    label: 'bg-cyan-100 text-cyan-700',
    text: 'text-cyan-900',
  },
  happy: {
    wrap: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50',
    label: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-900',
  },
  comfort: {
    wrap: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50',
    label: 'bg-amber-100 text-amber-700',
    text: 'text-amber-900',
  },
  celebrate: {
    wrap: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50',
    label: 'bg-violet-100 text-violet-700',
    text: 'text-violet-950',
  },
}

function Star({ x, y, scale = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="mitra-star" style={{ animationDelay: `${delay}ms` }}>
        <path
          d="M0 -7 L2.1 -2.1 L7 0 L2.1 2.1 L0 7 L-2.1 2.1 L-7 0 L-2.1 -2.1 Z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.8"
          transform={`scale(${scale})`}
        />
      </g>
    </g>
  )
}

export function AICompanion({ mood = 'idle', size = 92, className }) {
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const happy = mood === 'happy' || mood === 'celebrate'
  const comfort = mood === 'comfort'
  const listening = mood === 'listening'

  return (
    <div className={cn('relative shrink-0 mitra-avatar', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Mitra, your reading companion">
        <defs>
          <radialGradient id={`${id}-halo`} cx="35%" cy="25%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </radialGradient>
          <linearGradient id={`${id}-face`} x1="20%" y1="10%" x2="80%" y2="95%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="55%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
          <linearGradient id={`${id}-body`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id={`${id}-ear`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="63" r="55" fill={`url(#${id}-halo)`} />
        <circle cx="60" cy="63" r="55" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />

        <g className="mitra-float">
          <path d="M60 29 L60 21" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" />
          <g className={cn('mitra-antenna-star', happy && 'is-happy')}>
            <path
              d="M60 8 L62.3 14 L68 16.2 L62.3 18.4 L60 24.5 L57.7 18.4 L52 16.2 L57.7 14 Z"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="1.2"
            />
          </g>

          <path
            d="M32 48 Q32 22 60 22 Q88 22 88 48"
            fill="none"
            stroke={`url(#${id}-ear)`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <g className={cn('mitra-ear', listening && 'is-listening')}>
            <rect x="23" y="43" width="12" height="22" rx="6" fill={`url(#${id}-ear)`} />
            <rect x="85" y="43" width="12" height="22" rx="6" fill={`url(#${id}-ear)`} />
            <rect x="26" y="48" width="5" height="12" rx="2.5" fill="#bae6fd" opacity="0.85" />
            <rect x="89" y="48" width="5" height="12" rx="2.5" fill="#bae6fd" opacity="0.85" />
          </g>

          <path
            d="M34 87 Q34 76 60 76 Q86 76 86 87 L82 105 Q60 112 38 105 Z"
            fill={`url(#${id}-body)`}
            stroke="#3730a3"
            strokeWidth="1.2"
          />
          <path d="M47 90 L60 95 L73 90" fill="none" stroke="#a5b4fc" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="60" cy="101" r="4" fill="#22d3ee" stroke="#cffafe" strokeWidth="1.2" />

          <circle cx="60" cy="54" r="29" fill={`url(#${id}-face)`} stroke="#ea580c" strokeWidth="1.2" />
          <path d="M35 42 Q43 28 60 28 Q75 28 84 40" fill="none" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
          <path d="M38 40 Q44 34 50 34" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" opacity="0.45" />

          {happy ? (
            <>
              <path d="M43 54 Q49 48 55 54" fill="none" stroke="#7c2d12" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M65 54 Q71 48 77 54" fill="none" stroke="#7c2d12" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M48 64 Q60 77 72 64" fill="#be123c" stroke="#9f1239" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M54 69 Q60 72 66 69" fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : comfort ? (
            <>
              <path d="M45 51 Q50 48 54 51" fill="none" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M66 51 Q70 48 75 51" fill="none" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="49" cy="56" r="3.2" fill="#7c2d12" />
              <circle cx="71" cy="56" r="3.2" fill="#7c2d12" />
              <path d="M53 68 Q60 72 67 68" fill="none" stroke="#7c2d12" strokeWidth="2.6" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g className="mitra-eye">
                <circle cx="49" cy="54" r="4.4" fill="#7c2d12" />
                <circle cx="47.5" cy="52.5" r="1.4" fill="#ffffff" />
              </g>
              <g className="mitra-eye" style={{ animationDelay: '140ms' }}>
                <circle cx="71" cy="54" r="4.4" fill="#7c2d12" />
                <circle cx="69.5" cy="52.5" r="1.4" fill="#ffffff" />
              </g>
              {listening ? (
                <ellipse cx="60" cy="68" rx="4.2" ry="5.4" fill="#9f1239" className="mitra-mouth-listening" />
              ) : (
                <path d="M51 66 Q60 74 69 66" fill="none" stroke="#7c2d12" strokeWidth="2.6" strokeLinecap="round" />
              )}
            </>
          )}

          <circle cx="38" cy="62" r="5" fill="#fb7185" opacity="0.38" />
          <circle cx="82" cy="62" r="5" fill="#fb7185" opacity="0.38" />
        </g>

        {happy ? (
          <g className="mitra-stars">
            <Star x={20} y={29} scale={0.9} />
            <Star x={99} y={24} scale={0.7} delay={160} />
            <Star x={103} y={47} scale={0.55} delay={310} />
          </g>
        ) : null}
        {comfort ? (
          <path
            d="M97 31 C97 27 103 25 103 30 C103 25 109 27 109 31 C109 36 103 40 103 40 C103 40 97 36 97 31 Z"
            fill="#fb7185"
            className="mitra-heart"
          />
        ) : null}
        {listening ? (
          <g className="mitra-listen">
            <rect x="13" y="71" width="3" height="8" rx="1.5" fill="#22d3ee">
              <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="y" values="72;69;72" dur="0.8s" repeatCount="indefinite" />
            </rect>
            <rect x="19" y="68" width="3" height="14" rx="1.5" fill="#38bdf8">
              <animate attributeName="height" values="12;5;12" dur="0.65s" repeatCount="indefinite" />
              <animate attributeName="y" values="69;73;69" dur="0.65s" repeatCount="indefinite" />
            </rect>
            <rect x="25" y="72" width="3" height="7" rx="1.5" fill="#60a5fa">
              <animate attributeName="height" values="7;13;7" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="y" values="72;69;72" dur="0.9s" repeatCount="indefinite" />
            </rect>
          </g>
        ) : null}
      </svg>
    </div>
  )
}

export function MitraBubble({ mood = 'idle', message, lang = 'en', onNudge, compact = false, className }) {
  const style = moodStyles[mood] || moodStyles.idle
  const label = lang === 'hi' ? 'मित्र · AI साथी' : 'Mitra · AI companion'
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border shadow-sm', style.wrap, compact ? 'p-2.5' : 'p-3', className)}>
      <div className="pointer-events-none absolute -right-5 -top-7 h-16 w-16 rounded-full bg-white/50" />
      <div className="relative flex items-center gap-2.5">
        <button
          type="button"
          onClick={onNudge}
          className={cn(
            'shrink-0 rounded-full transition active:scale-95',
            onNudge ? 'cursor-pointer hover:brightness-105' : 'cursor-default',
          )}
          aria-label={onNudge ? (lang === 'hi' ? 'मित्र से बात करें' : 'Say hello to Mitra') : undefined}
          tabIndex={onNudge ? 0 : -1}
        >
          <AICompanion mood={mood} size={compact ? 52 : 74} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide', style.label)}>
              {label}
            </span>
            {mood === 'happy' || mood === 'celebrate' ? (
              <Sparkles size={11} className="shrink-0 text-amber-500 animate-pulse" />
            ) : null}
          </div>
          <p className={cn('mt-1 text-[11px] font-bold leading-relaxed', style.text)} aria-live="polite">
            {message}
          </p>
          {onNudge && !compact ? (
            <p className="mt-1 text-[9px] font-semibold text-slate-400">
              {lang === 'hi' ? 'मुझ पर टैप करके एक प्यारी बात सुनें' : 'Tap me for a little cheer'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
