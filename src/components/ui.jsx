import { useEffect } from 'react'
import { AlertTriangle, Check, Info, Sparkles, X } from 'lucide-react'
import { cn } from '../lib/utils'

const variants = {
  primary: 'bg-blue-600 text-white shadow-lift hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-white text-slate-800 border border-slate-200 shadow-sm hover:bg-slate-50',
  soft: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  emerald: 'bg-emerald-500 text-white shadow-[0_12px_30px_-14px_rgba(16,185,129,0.7)] hover:bg-emerald-600',
  amber: 'bg-amber-500 text-white shadow-[0_12px_30px_-14px_rgba(245,158,11,0.7)] hover:bg-amber-600',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
}

const sizes = {
  sm: 'min-h-[40px] px-3 text-sm rounded-xl gap-1.5',
  md: 'min-h-[48px] px-4 text-[15px] rounded-2xl gap-2',
  lg: 'min-h-[54px] px-5 text-base rounded-2xl gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  full,
  loading,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  )
}

export function Badge({ children, className, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  label,
  showTrack = true,
  height = 'h-2.5',
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full', showTrack ? 'bg-slate-100' : '', height, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out',
          barClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function Segmented({ options, value, onChange, className, size = 'md' }) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.id === value
        const Icon = option.icon
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-200',
              size === 'sm' ? 'min-h-[38px] px-2 text-xs' : 'min-h-[44px] px-3 text-[13px]',
              active
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {Icon ? <Icon size={15} strokeWidth={2.4} /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  bodyClassName,
  hideClose = false,
  labelledBy = 'modal-title',
}) {
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-white/60 bg-white shadow-2xl animate-slide-up sm:rounded-[28px] sm:animate-pop',
          className,
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4">
            <div className="min-w-0">
              <h2 id={labelledBy} className="font-display text-lg font-bold leading-tight text-slate-900">
                {title}
              </h2>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            {hideClose ? null : (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ) : null}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>
        {footer ? <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" full onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          full
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm?.()
            onClose?.()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

const toastStyles = {
  success: { icon: Check, className: 'bg-emerald-600 text-white' },
  error: { icon: AlertTriangle, className: 'bg-rose-600 text-white' },
  info: { icon: Info, className: 'bg-slate-900 text-white' },
  reward: { icon: Sparkles, className: 'bg-amber-500 text-white' },
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  const style = toastStyles[toast.type] || toastStyles.info
  const Icon = style.icon
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl animate-fade-up',
          style.className,
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon size={15} strokeWidth={3} />
        </span>
        <span className="leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-5 py-8 text-center', className)}>
      {Icon ? (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon size={24} strokeWidth={1.9} />
        </div>
      ) : null}
      <h3 className="font-display text-base font-bold text-slate-800">{title}</h3>
      {message ? <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-slate-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Ring({ value, max = 100, size = 76, stroke = 8, color = '#2563eb', track = '#dbeafe', children }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function StatPill({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2', className)}>
      <Icon size={15} className="text-blue-600" strokeWidth={2.5} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-extrabold leading-tight text-slate-800">{value}</p>
      </div>
    </div>
  )
}
