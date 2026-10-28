import {
  BarChart3,
  BookOpen,
  Brain,
  Check,
  Crown,
  LockKeyhole,
  Mic,
  Sparkles,
  X,
} from 'lucide-react'
import { FREE_READING_LIMIT, PRO_UPGRADE_URL } from '../config/subscription'
import { Badge, Button, Modal, ProgressBar } from './ui'

const features = [
  {
    icon: BookOpen,
    en: 'Unlimited reading stories and live tests',
    hi: 'असीमित कहानियाँ और लाइव रीडिंग टेस्ट',
  },
  {
    icon: Mic,
    en: 'AI pronunciation coach with word practice',
    hi: 'AI उच्चारण कोच और शब्द अभ्यास',
  },
  {
    icon: Brain,
    en: 'Comprehension quizzes for every story',
    hi: 'हर कहानी के साथ समझने की क्विज़',
  },
  {
    icon: BarChart3,
    en: 'Detailed WPM, accuracy and fluency reports',
    hi: 'विस्तृत WPM, शुद्धता और प्रवाह रिपोर्ट',
  },
]

export default function PaywallModal({ open, onClose, onUpgrade, lang = 'en', used = FREE_READING_LIMIT }) {
  const isHi = lang === 'hi'
  const hasCheckout = Boolean(PRO_UPGRADE_URL)

  const handleUpgrade = () => {
    if (hasCheckout) {
      window.open(PRO_UPGRADE_URL, '_blank', 'noopener,noreferrer')
      return
    }
    onUpgrade?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-sm"
      bodyClassName="p-0"
      footer={
        <div>
          <div className="grid gap-2">
            <Button
              full
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-[0_14px_30px_-12px_rgba(124,58,237,0.8)] hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700"
            >
              <Crown size={16} /> {isHi ? 'प्रो में अपग्रेड करें' : 'Upgrade to Pro'}
            </Button>
            <Button full variant="secondary" onClick={onClose}>
              {isHi ? 'अभी नहीं' : 'Maybe later'}
            </Button>
          </div>
          {!hasCheckout ? (
            <p className="mt-2 text-center text-[8px] font-semibold leading-relaxed text-slate-400">
              {isHi
                ? 'डेमो मोड: अभी भुगतान नहीं लिया जाएगा। PRO_UPGRADE_URL सेट करके असली checkout जोड़ें।'
                : 'Demo mode: no payment is taken. Set PRO_UPGRADE_URL to connect your real checkout.'}
            </p>
          ) : null}
        </div>
      }
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-5 pb-6 pt-7 text-white">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-300/15" />
        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-amber-300/80 animate-pulse" />
        <button
          type="button"
          onClick={onClose}
          aria-label={isHi ? 'बंद करें' : 'Close'}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X size={16} />
        </button>
        <div className="relative text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/15 shadow-lg backdrop-blur">
            <Crown size={30} className="text-amber-300" strokeWidth={2.2} />
          </span>
          <Badge className="mt-3 border-white/20 bg-white/15 text-white" tone="slate">
            <Sparkles size={10} /> {isHi ? 'SkillTrack प्रो' : 'SkillTrack Pro'}
          </Badge>
          <h2 className="mt-2 font-display text-[24px] font-extrabold leading-tight">
            {isHi ? 'अपनी पढ़ने की यात्रा अनलॉक करें' : 'Unlock your reading journey'}
          </h2>
          <p className="mx-auto mt-1 max-w-[250px] text-[11px] font-semibold leading-relaxed text-violet-100">
            {isHi
              ? `आपने ${FREE_READING_LIMIT} मुफ़्त रीडिंग पूरी कर ली हैं। आगे बढ़ने के लिए प्रो अनलॉक करें।`
              : `You have finished ${FREE_READING_LIMIT} free readings. Unlock Pro to keep going.`}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600">
              <LockKeyhole size={12} className="text-violet-600" />
              {isHi ? 'मुफ़्त रीडिंग का उपयोग' : 'Free readings used'}
            </p>
            <span className="text-[10px] font-extrabold text-violet-700">
              {Math.min(used, FREE_READING_LIMIT)} / {FREE_READING_LIMIT}
            </span>
          </div>
          <ProgressBar
            value={Math.min(used, FREE_READING_LIMIT)}
            max={FREE_READING_LIMIT}
            height="h-1.5"
            className="mt-2 bg-violet-100"
            barClassName="bg-gradient-to-r from-indigo-500 to-fuchsia-500"
            label={isHi ? 'मुफ़्त रीडिंग का उपयोग' : 'Free readings used'}
          />
        </div>

        <div className="mt-3 space-y-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.en} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Icon size={13} />
                </span>
                <p className="flex-1 text-[10px] font-bold leading-relaxed text-slate-700">
                  {isHi ? feature.hi : feature.en}
                </p>
                <Check size={13} className="mt-1 shrink-0 text-emerald-500" strokeWidth={3} />
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
          <p className="text-[10px] font-extrabold text-amber-900">
            {isHi ? 'एक बार अनलॉक करें, पूरे सफ़र के लिए' : 'One unlock, the whole journey'}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold text-amber-700">
            {isHi ? 'कोई स्क्रीन-फ्री प्रैक्टिस सीमा नहीं।' : 'No limits on your daily practice.'}
          </p>
        </div>

      </div>
    </Modal>
  )
}
