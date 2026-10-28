import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Download, Share2, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../lib/pwa'
import { Button, Modal } from './ui'

function InstallHelpModal({ open, onClose, isIos }) {
  const steps = isIos
    ? [
        ['Open SkillTrack in Safari', 'SkillTrack को Safari में खोलें।'],
        ['Tap the Share button', 'नीचे Share बटन दबाएँ।'],
        ['Choose “Add to Home Screen”', '“Add to Home Screen” चुनें।'],
        ['Tap “Add” to finish', '“Add” दबाकर इंस्टॉल पूरा करें।'],
      ]
    : [
        ['Open your browser menu (⋮)', 'ब्राउज़र का मेन्यू (⋮) खोलें।'],
        ['Choose “Install app” or “Add to Home screen”', '“Install app” या “Add to Home screen” चुनें।'],
        ['Confirm the install', 'Install दबाकर पुष्टि करें।'],
      ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Install SkillTrack"
      subtitle="ऐप इंस्टॉल करें · Home screen पर असली ऐप की तरह"
      className="max-w-sm"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
        <div className="flex items-center gap-2 text-blue-800">
          <Smartphone size={17} strokeWidth={2.4} />
          <p className="text-[12px] font-extrabold">Keep learning in one tap</p>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-blue-900/75">
          एक बार इंस्टॉल करने के बाद SkillTrack बिना इंटरनेट भी खुलेगा।
        </p>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map(([english, hindi], index) => (
          <li key={english} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold leading-snug text-slate-800">{english}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-600" lang="hi">
                {hindi}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {isIos ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-600">
          <Share2 size={14} className="mt-0.5 shrink-0 text-blue-600" />
          On iPhone and iPad, installation must be done from Safari’s Share menu.
        </p>
      ) : null}

      {!isIos ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[10px] leading-relaxed text-emerald-800">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          Look for the install icon in Chrome or Edge’s address bar if the menu option is not visible.
        </p>
      ) : null}

      <Button full className="mt-4" onClick={onClose}>
        Got it · समझ गया
      </Button>
    </Modal>
  )
}

export function InstallBar({ lang = 'en', onInstalled }) {
  const { canPrompt, installed, isIos, promptInstall } = usePwaInstall()
  const [hidden, setHidden] = useState(false)
  const [busy, setBusy] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    if (installed) setHidden(true)
  }, [installed])

  if (installed || hidden) return null

  const handleInstall = async () => {
    if (!canPrompt) {
      setHelpOpen(true)
      return
    }
    setBusy(true)
    const outcome = await promptInstall()
    setBusy(false)
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setHidden(true)
      if (outcome === 'accepted') onInstalled?.()
    } else {
      setHelpOpen(true)
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-blue-200 bg-white p-2.5 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.9)]">
          <BookOpen size={17} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-extrabold leading-tight text-slate-900">Install SkillTrack</p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600">
            {lang === 'hi' ? 'ऐप इंस्टॉल करें · ऑफ़लाइन भी चलेगा' : 'ऐप इंस्टॉल करें · Works offline'}
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 px-2.5"
          onClick={handleInstall}
          loading={busy}
          aria-label="Install App / ऐप इंस्टॉल करें"
        >
          {busy ? null : <Download size={14} />} Install App
        </Button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Dismiss install prompt"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      </div>
      <InstallHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} isIos={isIos} />
    </>
  )
}

export function InstallPill({ lang = 'en', onInstalled }) {
  const { installed, isIos, promptInstall, canPrompt } = usePwaInstall()
  const [busy, setBusy] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  if (installed) return null

  const handleInstall = async () => {
    if (!canPrompt) {
      setHelpOpen(true)
      return
    }
    setBusy(true)
    const outcome = await promptInstall()
    setBusy(false)
    if (outcome === 'accepted') {
      onInstalled?.()
    } else if (outcome !== 'dismissed') {
      setHelpOpen(true)
    }
  }

  return (
    <>
      <div className="absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          title="Install App / ऐप इंस्टॉल करें"
          className="flex min-h-[42px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 text-left text-white shadow-lg backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-70"
        >
          <Download size={15} strokeWidth={2.5} className="shrink-0 text-amber-300" />
          <span className="leading-tight">
            <span className="block text-[11px] font-extrabold">{busy ? 'Installing…' : 'Install App'}</span>
            <span className="block text-[9px] font-semibold text-blue-100">
              {lang === 'hi' ? 'ऐप इंस्टॉल करें' : 'ऐप इंस्टॉल करें'}
            </span>
          </span>
        </button>
      </div>
      <InstallHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} isIos={isIos} />
    </>
  )
}
