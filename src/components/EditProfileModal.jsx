import { useEffect, useState } from 'react'
import { AlertTriangle, Check, ShieldCheck, UserRound } from 'lucide-react'
import { GRADES, LANGS, getBand } from '../lib/constants'
import { cn } from '../lib/utils'
import { Button, Modal } from './ui'

export default function EditProfileModal({ open, profile, counts, onClose, onSave, onReset }) {
  const [name, setName] = useState(profile?.name || '')
  const [grade, setGrade] = useState(profile?.grade || 1)
  const [lang, setLang] = useState(profile?.lang || 'en')
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(profile?.name || '')
    setGrade(profile?.grade || 1)
    setLang(profile?.lang || 'en')
    setError('')
    setConfirmReset(false)
  }, [open, profile])

  const band = getBand(grade)

  const handleSave = () => {
    if (name.trim().length < 2) {
      setError('Please enter at least 2 letters for the student’s name.')
      return
    }
    onSave({ name: name.trim(), grade, lang })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student profile"
      subtitle="Change details or manage saved progress."
      footer={
        <Button full size="lg" onClick={handleSave}>
          Save profile <Check size={17} strokeWidth={3} />
        </Button>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-sm">
          {name.trim().charAt(0).toUpperCase() || <UserRound size={20} />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-extrabold text-slate-900">{name || 'Student'}</p>
          <p className="text-[11px] font-semibold text-slate-500">
            Class {grade} · {band.label}
          </p>
        </div>
        <span className={cn('ml-auto shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold', band.chip)}>
          {band.emoji} {band.classes}
        </span>
      </div>

      <label htmlFor="edit-name" className="mt-4 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        Student name
      </label>
      <input
        id="edit-name"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setError('')
        }}
        maxLength={30}
        className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-800 transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Class</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        {GRADES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setGrade(item)}
            aria-pressed={grade === item}
            className={cn(
              'min-h-[44px] rounded-xl border text-sm font-extrabold transition active:scale-95',
              grade === item
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Language</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {Object.values(LANGS).map((language) => (
          <button
            key={language.id}
            type="button"
            onClick={() => setLang(language.id)}
            aria-pressed={lang === language.id}
            className={cn(
              'flex min-h-[48px] items-center justify-between rounded-xl border px-3 text-sm font-extrabold transition active:scale-[0.98]',
              lang === language.id
                ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100'
                : 'border-slate-200 bg-white text-slate-700',
            )}
          >
            {language.id === 'en' ? 'English' : 'हिंदी'}
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border',
                lang === language.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-transparent',
              )}
            >
              <Check size={12} strokeWidth={3.5} />
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Saved on this device</p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white py-2">
            <p className="font-display text-base font-extrabold text-slate-900">{counts.sessions}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Reads</p>
          </div>
          <div className="rounded-xl bg-white py-2">
            <p className="font-display text-base font-extrabold text-slate-900">{counts.essays}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Essays</p>
          </div>
          <div className="rounded-xl bg-white py-2">
            <p className="font-display text-base font-extrabold text-slate-900">{counts.mastered}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Words</p>
          </div>
        </div>
      </div>

      {confirmReset ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 animate-fade-in">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
            <AlertTriangle size={14} /> Delete all learning progress?
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-600">
            This removes reading results, essays, mastered words and your streak. Your profile stays. This cannot be
            undone.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" full onClick={() => setConfirmReset(false)}>
              Keep my progress
            </Button>
            <Button
              size="sm"
              full
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                onReset()
                setConfirmReset(false)
                onClose()
              }}
            >
              Delete progress
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <AlertTriangle size={13} /> Reset all learning progress
        </button>
      )}
    </Modal>
  )
}
