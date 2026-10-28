import { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import EditProfileModal from './components/EditProfileModal.jsx'
import Header from './components/Header.jsx'
import { InstallBar, InstallPill } from './components/InstallPrompt.jsx'
import PaywallModal from './components/PaywallModal.jsx'
import ProfileSetup from './components/ProfileSetup.jsx'
import ReadingModule from './components/ReadingModule.jsx'
import TrackModule from './components/TrackModule.jsx'
import VocabModule from './components/VocabModule.jsx'
import WriteModule from './components/WriteModule.jsx'
import { Toast } from './components/ui.jsx'
import {
  FREE_READING_LIMIT,
  countReadingSessions,
  getProAccess,
  isPremiumModeEnabled,
  setProAccess,
} from './config/subscription.js'
import { stopSpeaking } from './lib/speech.js'
import {
  buildDemoState,
  loadState,
  mergeChallenging,
  rebuildActivity,
  saveDrafts,
  saveState,
} from './lib/storage.js'
import { computeStreak, todayKey, uid } from './lib/utils.js'

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [tab, setTab] = useState('read')
  const [toast, setToast] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [proAccess, setProAccessState] = useState(() => getProAccess())
  const [paywallOpen, setPaywallOpen] = useState(false)
  const toastTimerRef = useRef(null)
  const storageFailedRef = useRef(false)
  const paywallShownRef = useRef(false)

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: uid(), message, type })
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3600)
  }, [])

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current)
  }, [])

  useEffect(() => {
    const saved = saveState(state)
    if (!saved && !storageFailedRef.current) {
      storageFailedRef.current = true
      notify('Progress could not be saved. Check your browser’s storage permissions.', 'error')
    }
  }, [state, notify])

  const commit = useCallback((updater) => {
    setState((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater
      return { ...next, activity: rebuildActivity(next) }
    })
  }, [])

  const profile = state.profile
  const streak = computeStreak(state.activity)
  const today = state.activity?.[todayKey()] || {}
  const premiumEnabled = isPremiumModeEnabled()
  const readingUsed = countReadingSessions(state.sessions)
  const readingLocked = premiumEnabled && !proAccess && readingUsed >= FREE_READING_LIMIT

  useEffect(() => {
    if (premiumEnabled && !proAccess && readingUsed >= FREE_READING_LIMIT && !paywallShownRef.current) {
      paywallShownRef.current = true
      setPaywallOpen(true)
    }
    if (!premiumEnabled || proAccess || readingUsed < FREE_READING_LIMIT) {
      paywallShownRef.current = false
    }
  }, [premiumEnabled, proAccess, readingUsed])

  const handleUpgrade = () => {
    setProAccess(true)
    setProAccessState(true)
    setPaywallOpen(false)
    notify(
      profile?.lang === 'hi'
        ? 'SkillTrack Pro इस डिवाइस पर अनलॉक हो गया।'
        : 'SkillTrack Pro is unlocked on this device.',
      'reward',
    )
  }

  const handleCreateProfile = (details) => {
    setState((previous) => ({
      ...previous,
      profile: {
        ...details,
        createdAt: new Date().toISOString(),
      },
      createdAt: previous.createdAt || new Date().toISOString(),
    }))
    setTab('read')
    notify(`Welcome, ${details.name.split(' ')[0]}! Let’s build your skills.`, 'reward')
  }

  const handleSaveProfile = (details) => {
    const levelChanged = !profile || details.grade !== profile.grade || details.lang !== profile.lang
    stopSpeaking()
    setState((previous) => ({
      ...previous,
      profile: {
        ...previous.profile,
        ...details,
      },
    }))
    notify(
      levelChanged
        ? 'Profile updated. New reading and word sets are ready.'
        : 'Profile updated.',
      'success',
    )
  }

  const toggleLanguage = () => {
    if (!profile) return
    const nextLang = profile.lang === 'en' ? 'hi' : 'en'
    stopSpeaking()
    setState((previous) => ({
      ...previous,
      profile: { ...previous.profile, lang: nextLang },
    }))
    notify(nextLang === 'hi' ? 'भाषा बदलकर हिंदी हो गई।' : 'Language switched to English.', 'info')
  }

  const changeTab = (nextTab) => {
    if (nextTab === tab) return
    stopSpeaking()
    setTab(nextTab)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleSaveSession = useCallback((session, missedWords = []) => {
    commit((previous) => {
      const sessions = [session, ...previous.sessions].slice(0, 300)
      const challenging = mergeChallenging(previous.challenging, missedWords, {
        lang: session.lang,
        grade: session.grade,
        source: 'reading',
      })
      return { ...previous, sessions, challenging }
    })
  }, [commit])

  const handleSaveEssay = useCallback((essay) => {
    commit((previous) => ({
      ...previous,
      essays: [essay, ...previous.essays].slice(0, 200),
    }))
  }, [commit])

  const handleDeleteEssay = useCallback((essayId) => {
    commit((previous) => ({
      ...previous,
      essays: previous.essays.filter((essay) => essay.id !== essayId),
    }))
  }, [commit])

  const handleQuizComplete = useCallback(({ lang, grade, questions, answers, score, total }) => {
    commit((previous) => {
      const now = new Date().toISOString()
      const existing = new Set(previous.mastered.map((word) => word.wordId))
      const newlyMastered = []

      answers.forEach((answer) => {
        if (!answer.correct || existing.has(answer.wordId)) return
        existing.add(answer.wordId)
        const source = questions.find((question) => question.id === answer.wordId)
        newlyMastered.push({
          id: uid(),
          wordId: answer.wordId,
          word: answer.word,
          meaning: answer.meaning,
          lang,
          grade,
          date: now,
          pos: source?.pos || null,
        })
      })

      const missed = answers.filter((answer) => !answer.correct).map((answer) => answer.word)
      const challenging = mergeChallenging(previous.challenging, missed, {
        lang,
        grade,
        source: 'quiz',
      })

      const quizLog = [
        { id: uid(), date: now, lang, grade, score, total },
        ...previous.quizLog,
      ].slice(0, 300)

      return {
        ...previous,
        mastered: [...newlyMastered, ...previous.mastered],
        challenging,
        quizLog,
      }
    })
  }, [commit])

  const handleRemoveChallenge = useCallback((id) => {
    commit((previous) => ({
      ...previous,
      challenging: previous.challenging.filter((item) => item.id !== id),
    }))
  }, [commit])

  const handleClearChallenges = useCallback(() => {
    commit((previous) => ({ ...previous, challenging: [] }))
    notify('Tricky word list cleared.', 'info')
  }, [commit, notify])

  const handleLoadDemo = () => {
    if (!profile) return
    const demo = buildDemoState(profile)
    setState((previous) => {
      const next = {
        ...previous,
        sessions: demo.sessions,
        essays: demo.essays,
        mastered: demo.mastered,
        challenging: demo.challenging,
        quizLog: demo.quizLog,
        demo: true,
      }
      return { ...next, activity: rebuildActivity(next) }
    })
    setTab('track')
    notify('Sample progress loaded. Explore the dashboard!', 'info')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleClearDemo = () => {
    commit((previous) => {
      const sessions = previous.sessions.filter((item) => !item.demo)
      const essays = previous.essays.filter((item) => !item.demo)
      const mastered = previous.mastered.filter((item) => !item.demo)
      const challenging = previous.challenging.filter((item) => !item.demo)
      const quizLog = previous.quizLog.filter((item) => !item.demo)
      return { ...previous, sessions, essays, mastered, challenging, quizLog, demo: false }
    })
    notify('Sample data cleared. Your own practice is kept.', 'info')
  }

  const handleResetProgress = () => {
    setState((previous) => ({
      ...previous,
      sessions: [],
      essays: [],
      mastered: [],
      challenging: [],
      quizLog: [],
      activity: {},
      demo: false,
    }))
    saveDrafts({})
    notify('All learning progress has been reset.', 'info')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 shadow-xl ring-1 ring-slate-200/60">
        {profile ? (
          <>
            <Header
              profile={profile}
              streak={streak}
              onToggleLang={toggleLanguage}
              onEditProfile={() => setEditOpen(true)}
            />

            <main className="flex-1 px-4 pb-28 pt-3">
              <InstallBar
                lang={profile.lang}
                onInstalled={() => notify('SkillTrack install started. Check your home screen.', 'success')}
              />

              {tab === 'read' ? (
                <ReadingModule
                  key={`read-${profile.lang}-${profile.grade}`}
                  profile={profile}
                  activity={state.activity}
                  challenging={state.challenging}
                  onSaveSession={handleSaveSession}
                  onRemoveChallenge={handleRemoveChallenge}
                  onClearChallenges={handleClearChallenges}
                  notify={notify}
                  premiumEnabled={premiumEnabled}
                  proAccess={proAccess}
                  readingUsed={readingUsed}
                  readingLimit={FREE_READING_LIMIT}
                  readingLocked={readingLocked}
                  onRequestUpgrade={() => setPaywallOpen(true)}
                />
              ) : null}

              {tab === 'write' ? (
                <WriteModule
                  key={`write-${profile.lang}-${profile.grade}`}
                  profile={profile}
                  essays={state.essays}
                  onSaveEssay={handleSaveEssay}
                  onDeleteEssay={handleDeleteEssay}
                  notify={notify}
                />
              ) : null}

              {tab === 'vocab' ? (
                <VocabModule
                  key={`vocab-${profile.lang}-${profile.grade}`}
                  profile={profile}
                  mastered={state.mastered}
                  onQuizComplete={handleQuizComplete}
                  notify={notify}
                />
              ) : null}

              {tab === 'track' ? (
                <TrackModule
                  key={`track-${profile.lang}-${profile.grade}`}
                  profile={profile}
                  sessions={state.sessions}
                  essays={state.essays}
                  mastered={state.mastered}
                  challenging={state.challenging}
                  quizLog={state.quizLog}
                  activity={state.activity}
                  demo={state.demo}
                  onLoadDemo={handleLoadDemo}
                  onClearDemo={handleClearDemo}
                  onEditProfile={() => setEditOpen(true)}
                  onNavigate={changeTab}
                  notify={notify}
                />
              ) : null}
            </main>

            <BottomNav active={tab} onChange={changeTab} lang={profile.lang} />

            <EditProfileModal
              open={editOpen}
              profile={profile}
              counts={{
                sessions: state.sessions.length,
                essays: state.essays.length,
                mastered: state.mastered.length,
              }}
              onClose={() => setEditOpen(false)}
              onSave={handleSaveProfile}
              onReset={handleResetProgress}
            />

            <PaywallModal
              open={paywallOpen}
              onClose={() => setPaywallOpen(false)}
              onUpgrade={handleUpgrade}
              lang={profile.lang}
              used={readingUsed}
            />
          </>
        ) : (
          <>
            <InstallPill
              onInstalled={() => notify('SkillTrack install started. Check your home screen.', 'success')}
            />
            <ProfileSetup onComplete={handleCreateProfile} />
          </>
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  )
}
