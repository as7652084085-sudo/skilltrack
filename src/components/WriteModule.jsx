import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lightbulb,
  PenLine,
  Plus,
  Sparkles,
  Square,
  Target,
  Trash2,
  Trophy,
  Volume2,
  Wand2,
} from 'lucide-react'
import { getPrompts } from '../data/prompts'
import { getBand, getWritingTarget } from '../lib/constants'
import { isSpeechSupported, useSpeech } from '../lib/speech'
import { loadDrafts, saveDrafts } from '../lib/storage'
import {
  cn,
  countWords,
  formatDateTime,
  keywordUsed,
  relativeDay,
  uid,
} from '../lib/utils'
import { Badge, Button, Card, EmptyState, Modal, ProgressBar } from './ui'

const MIN_WORDS = 5

export default function WriteModule({ profile, essays, onSaveEssay, onDeleteEssay, notify }) {
  const prompts = useMemo(() => getPrompts(profile.grade, profile.lang), [profile.grade, profile.lang])
  const band = getBand(profile.grade)
  const target = getWritingTarget(profile.grade)
  const [activePromptId, setActivePromptId] = useState(null)
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState(() => loadDrafts())
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const [savedModal, setSavedModal] = useState(null)
  const [viewEssay, setViewEssay] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const textareaRef = useRef(null)
  const { speak, stop, speakingKey } = useSpeech()

  const activePrompt = prompts.find((prompt) => prompt.id === activePromptId) || null
  const words = useMemo(() => countWords(text), [text])
  const usedKeywords = useMemo(
    () => (activePrompt ? activePrompt.keywords.filter((keyword) => keywordUsed(text, keyword)) : []),
    [activePrompt, text],
  )
  const progress = Math.min(100, Math.round((words / target) * 100))
  const reached = words >= target

  useEffect(() => {
    if (!activePromptId) return undefined
    const timer = setTimeout(() => {
      setDrafts((previous) => {
        const next = {
          ...previous,
          [activePromptId]: { text, updatedAt: new Date().toISOString() },
        }
        saveDrafts(next)
        return next
      })
      setDraftSavedAt(Date.now())
    }, 550)
    return () => clearTimeout(timer)
  }, [text, activePromptId])

  const openPrompt = (prompt) => {
    stop()
    setActivePromptId(prompt.id)
    setText(drafts[prompt.id]?.text || '')
    setDraftSavedAt(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditor = () => {
    stop()
    setActivePromptId(null)
    setText('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const insertKeyword = (keyword) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? text.length
    const end = textarea?.selectionEnd ?? text.length
    const before = text.slice(0, start)
    const after = text.slice(end)
    const prefix = before && !/\s$/.test(before) ? ' ' : ''
    const suffix = after && !/^\s/.test(after) ? ' ' : ''
    const next = `${before}${prefix}${keyword}${suffix}${after}`
    setText(next)
    requestAnimationFrame(() => {
      if (!textarea) return
      textarea.focus()
      const cursor = start + prefix.length + keyword.length + suffix.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const useStarter = () => {
    if (!activePrompt?.starter) return
    setText(`${activePrompt.starter} `)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const toggleReadEssay = () => {
    if (!isSpeechSupported()) {
      notify('Speech playback is not supported in this browser. Try Chrome.', 'info')
      return
    }
    speak(text, profile.lang, 'essay-edit', { rate: profile.lang === 'hi' ? 0.84 : 0.9 })
  }

  const saveEssay = () => {
    if (!activePrompt) return
    if (words < MIN_WORDS) {
      notify(`Write at least ${MIN_WORDS} words before saving.`, 'error')
      return
    }
    const essay = {
      id: uid(),
      date: new Date().toISOString(),
      promptId: activePrompt.id,
      title: activePrompt.title,
      promptTitle: activePrompt.title,
      lang: profile.lang,
      grade: profile.grade,
      text: text.trim(),
      words,
      target,
      golden: usedKeywords,
    }
    onSaveEssay(essay)
    setDrafts((previous) => {
      const next = { ...previous }
      delete next[activePrompt.id]
      saveDrafts(next)
      return next
    })
    setSavedModal(essay)
    setText('')
    setActivePromptId(null)
    stop()
    notify(`Essay saved · ${words} words`, 'reward')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEssay = () => {
    if (!deleteTarget) return
    onDeleteEssay(deleteTarget.id)
    notify('Essay deleted.', 'info')
    setDeleteTarget(null)
    setViewEssay(null)
  }

  const latestEssays = [...essays].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-4 pb-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-4 text-white shadow-[0_16px_36px_-18px_rgba(245,158,11,0.8)] animate-fade-up">
        <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 left-8 h-28 w-28 rounded-full bg-yellow-200/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-100">
              <PenLine size={12} strokeWidth={2.8} /> Alekh Studio · लेखन
            </div>
            <h2 className="mt-1 font-display text-[22px] font-extrabold leading-tight">Your words, your story.</h2>
            <p className="mt-1 max-w-[240px] text-[11px] font-medium leading-relaxed text-amber-50">
              Class {profile.grade} writer · aim for <span className="font-extrabold text-white">{target} words</span> in
              each piece.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge className="border-white/20 bg-white/15 text-white" tone="slate">
                <FileText size={10} /> {essays.length} saved
              </Badge>
              <Badge className="border-white/20 bg-white/15 text-white" tone="slate">
                {band.emoji} {band.label}
              </Badge>
            </div>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <PenLine size={23} strokeWidth={2.2} />
          </span>
        </div>
      </section>

      {activePrompt ? (
        <>
          {/* Editor header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeEditor}
              className="flex min-h-[40px] items-center gap-1 rounded-full bg-white px-3 text-[11px] font-extrabold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
            >
              <ArrowLeft size={14} /> All prompts
            </button>
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <CheckCircle2 size={11} className="text-emerald-500" />
              {draftSavedAt ? 'Draft autosaved' : drafts[activePrompt.id]?.text ? 'Draft restored' : 'Draft saves automatically'}
            </span>
          </div>

          {/* Prompt card */}
          <Card className="relative overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                {activePrompt.emoji}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="amber">{activePrompt.type}</Badge>
                  <Badge tone="slate">
                    <Target size={10} /> {activePrompt.target} words
                  </Badge>
                </div>
                <h3 className="mt-1.5 font-display text-lg font-extrabold leading-tight text-slate-900">
                  {activePrompt.title}
                </h3>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">{activePrompt.prompt}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-white/70 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-amber-800">
              <Lightbulb size={12} className="mt-0.5 shrink-0" /> {activePrompt.hint}
            </div>
          </Card>

          {/* Writing area */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                <PenLine size={12} /> My alekh
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-[10px] font-extrabold',
                  reached ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {words} / {target} words
              </span>
            </div>

            <div className="p-4">
              {!text ? (
                <button
                  type="button"
                  onClick={useStarter}
                  className="mb-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-left transition hover:bg-blue-50"
                >
                  <Wand2 size={14} className="shrink-0 text-blue-500" />
                  <span className="min-w-0 text-[10px] font-semibold text-blue-700">
                    Need a first line? <span className="underline underline-offset-2">Use “{activePrompt.starter}”</span>
                  </span>
                </button>
              ) : null}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  profile.lang === 'hi'
                    ? 'यहाँ अपना लेख लिखो… छोटे वाक्यों से शुरुआत करो।'
                    : 'Start writing here… short sentences are perfectly fine.'
                }
                rows={9}
                className="min-h-[240px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-500 transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                lang={profile.lang}
                aria-label="Essay writing area"
              />

              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className={reached ? 'text-emerald-600' : 'text-slate-500'}>
                    {reached ? '🎉 Target reached — wonderful!' : `${Math.max(0, target - words)} words to go`}
                  </span>
                  <span className="font-mono text-slate-500">{progress}%</span>
                </div>
                <ProgressBar
                  value={words}
                  max={target}
                  className="mt-1.5"
                  barClassName={reached ? 'bg-emerald-500' : 'bg-amber-500'}
                  label="Writing target progress"
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                    <Sparkles size={11} className="text-amber-500" /> Golden words
                  </p>
                  <span className="text-[9px] font-bold text-slate-500">
                    {usedKeywords.length}/{activePrompt.keywords.length} used
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {activePrompt.keywords.map((keyword) => {
                    const used = usedKeywords.includes(keyword)
                    return (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => insertKeyword(keyword)}
                        className={cn(
                          'flex min-h-[30px] items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition active:scale-95',
                          used
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700',
                        )}
                        title={used ? 'Already used — tap to add again' : 'Tap to add this golden word'}
                      >
                        {used ? <Check size={10} strokeWidth={3.5} /> : <Plus size={10} strokeWidth={3} />}
                        {keyword}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  full
                  onClick={toggleReadEssay}
                  disabled={!text.trim()}
                  className="text-[12px]"
                >
                  {speakingKey === 'essay-edit' ? (
                    <>
                      <Square size={13} className="fill-current" /> Stop
                    </>
                  ) : (
                    <>
                      <Volume2 size={15} /> Read my essay
                    </>
                  )}
                </Button>
                <Button full variant="emerald" onClick={saveEssay} className="text-[12px]">
                  <Check size={16} strokeWidth={3} /> Save essay
                </Button>
              </div>
              <p className="mt-2 text-center text-[9px] font-medium text-slate-500">
                {speakingKey === 'essay-edit'
                  ? 'Listening back helps you spot missing words and repetition.'
                  : 'Use golden words, then listen to your essay before saving.'}
              </p>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Prompt gallery */}
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900">Today’s writing prompts</h2>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                Choose one and write in {profile.lang === 'hi' ? 'Hindi' : 'English'}.
              </p>
            </div>
            <Badge tone="amber">
              <Target size={10} /> {target} word target
            </Badge>
          </div>

          <div className="space-y-3">
            {prompts.map((prompt) => {
              const draft = drafts[prompt.id]
              return (
                <Card key={prompt.id} className="overflow-hidden transition hover:border-amber-200">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-2xl">
                        {prompt.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="amber">{prompt.type}</Badge>
                          {draft?.text ? (
                            <Badge tone="blue">
                              <FileText size={9} /> Draft
                            </Badge>
                          ) : null}
                        </div>
                        <h3 className="mt-1 font-display text-[15px] font-extrabold leading-tight text-slate-900">
                          {prompt.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{prompt.prompt}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {prompt.keywords.slice(0, 5).map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => openPrompt(prompt)}
                      className="press mt-3 flex min-h-[42px] w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-[11px] font-extrabold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800"
                    >
                      {draft?.text ? 'Continue your draft' : 'Start writing'}
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Tips */}
          <Card className="border-blue-100 bg-blue-50/60 p-3.5">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
              <Lightbulb size={13} /> Three quick writing tips
            </p>
            <ul className="mt-1.5 space-y-1 text-[10px] font-medium leading-relaxed text-blue-800/80">
              <li>1. Plan three ideas before you start — beginning, middle and end.</li>
              <li>2. Use at least three golden words to make your writing shine.</li>
              <li>3. Read your essay aloud to catch repeated or missing words.</li>
            </ul>
          </Card>

          {/* Saved essays */}
          <section>
            <div className="mb-2 flex items-end justify-between px-0.5">
              <div>
                <h2 className="font-display text-base font-extrabold text-slate-900">My saved alekh</h2>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                  {essays.length ? `${essays.length} piece${essays.length === 1 ? '' : 's'} written` : 'Your saved essays will appear here.'}
                </p>
              </div>
              {essays.length ? <Badge tone="emerald">{essays.reduce((sum, essay) => sum + (essay.words || 0), 0)} words</Badge> : null}
            </div>

            {latestEssays.length ? (
              <div className="space-y-2">
                {latestEssays.slice(0, 5).map((essay) => (
                  <Card key={essay.id} className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <BookOpenCheck size={17} />
                      </span>
                      <button type="button" onClick={() => setViewEssay(essay)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[12px] font-extrabold text-slate-800">{essay.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-slate-500">
                          <Clock size={9} /> {relativeDay(essay.date, profile.lang)} · {essay.words} words
                          {essay.golden?.length ? ` · ${essay.golden.length} golden` : ''}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(essay)}
                        aria-label={`Delete ${essay.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewEssay(essay)}
                        aria-label={`Open ${essay.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={PenLine}
                  title="No essays yet"
                  message="Pick a prompt above, write a few lines and save your first alekh."
                />
              </Card>
            )}
          </section>
        </>
      )}

      {/* Saved success modal */}
      <Modal
        open={Boolean(savedModal)}
        onClose={() => {
          stop()
          setSavedModal(null)
        }}
        title="Essay saved!"
        subtitle={savedModal ? formatDateTime(savedModal.date) : ''}
      >
        {savedModal ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200">
              <Trophy size={30} className="text-amber-200" />
            </div>
            <h3 className="mt-3 font-display text-lg font-extrabold text-slate-900">{savedModal.title}</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{savedModal.lang === 'hi' ? 'हिंदी लेख' : 'English essay'}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-50 py-2">
                <p className="font-display text-lg font-extrabold text-blue-700">{savedModal.words}</p>
                <p className="text-[8px] font-bold uppercase tracking-wide text-blue-500">Words</p>
              </div>
              <div className="rounded-xl bg-amber-50 py-2">
                <p className="font-display text-lg font-extrabold text-amber-700">{savedModal.golden?.length || 0}</p>
                <p className="text-[8px] font-bold uppercase tracking-wide text-amber-600">Golden</p>
              </div>
              <div className="rounded-xl bg-emerald-50 py-2">
                <p className="font-display text-lg font-extrabold text-emerald-700">{savedModal.target}</p>
                <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-600">Target</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
              {savedModal.words >= savedModal.target
                ? 'You reached your class word target. Excellent effort!'
                : `You are ${savedModal.target - savedModal.words} words away from your class target. Keep adding one more idea next time.`}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                full
                onClick={() => speak(savedModal.text, savedModal.lang, 'saved-essay', { rate: 0.88 })}
              >
                {speakingKey === 'saved-essay' ? <Square size={13} className="fill-current" /> : <Volume2 size={15} />}
                Listen
              </Button>
              <Button full onClick={() => setSavedModal(null)}>
                Back to prompts <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Essay viewer */}
      <Modal
        open={Boolean(viewEssay)}
        onClose={() => {
          stop()
          setViewEssay(null)
        }}
        title={viewEssay?.title || 'My essay'}
        subtitle={viewEssay ? `${formatDateTime(viewEssay.date)} · ${viewEssay.words} words` : ''}
        footer={
          viewEssay ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                full
                onClick={() => {
                  if (viewEssay) speak(viewEssay.text, viewEssay.lang, `view-${viewEssay.id}`, { rate: 0.88 })
                }}
              >
                {speakingKey === `view-${viewEssay.id}` ? (
                  <>
                    <Square size={13} className="fill-current" /> Stop
                  </>
                ) : (
                  <>
                    <Volume2 size={15} /> Read aloud
                  </>
                )}
              </Button>
              <Button variant="danger" full onClick={() => setDeleteTarget(viewEssay)}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          ) : null
        }
      >
        {viewEssay ? (
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="amber">{viewEssay.lang === 'hi' ? 'हिंदी' : 'English'}</Badge>
              <Badge tone="emerald">
                <Check size={10} /> {viewEssay.words} words
              </Badge>
              {viewEssay.golden?.length ? <Badge tone="blue">{viewEssay.golden.length} golden words</Badge> : null}
            </div>
            <p
              className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700"
              lang={viewEssay.lang}
            >
              {viewEssay.text}
            </p>
            {viewEssay.golden?.length ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {viewEssay.golden.map((word) => (
                  <span key={word} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    ✓ {word}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this essay?">
        <p className="text-sm leading-relaxed text-slate-600">
          “{deleteTarget?.title}” will be removed from your saved alekh and your writing activity will be updated. This
          cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" full onClick={() => setDeleteTarget(null)}>
            Keep essay
          </Button>
          <Button
            full
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              stop()
              deleteEssay()
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
