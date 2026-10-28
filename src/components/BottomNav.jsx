import { BarChart3, BookOpen, Lightbulb, PenLine } from 'lucide-react'
import { NAV_ITEMS } from '../lib/constants'
import { cn } from '../lib/utils'

const icons = {
  book: BookOpen,
  pen: PenLine,
  bulb: Lightbulb,
  chart: BarChart3,
}

export default function BottomNav({ active, onChange, lang }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-slate-200/80 surface-blur safe-bottom">
      <div className="grid grid-cols-4 gap-1 px-2 pb-1.5 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon]
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={lang === 'hi' ? item.labelHi : item.label}
              className="group flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl transition-transform duration-150 active:scale-95"
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.9)]'
                    : 'bg-transparent text-slate-500 group-hover:bg-slate-200/60 group-hover:text-slate-600',
                )}
              >
                <Icon size={19} strokeWidth={isActive ? 2.7 : 2.1} />
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold leading-none tracking-wide transition-colors',
                  isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-600',
                )}
              >
                {lang === 'hi' ? item.labelHi : item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
