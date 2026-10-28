import { useMemo } from 'react'
import { BookOpen, PenLine } from 'lucide-react'
import { cn } from '../lib/utils'

export default function WeeklyChart({ data = [], lang = 'en' }) {
  const width = 340
  const height = 196
  const margin = { top: 12, right: 8, bottom: 30, left: 30 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  const maxValue = useMemo(() => {
    const highest = Math.max(1, ...data.map((day) => Math.max(day.wordsRead || 0, day.wordsWritten || 0)))
    const rounded = Math.ceil(highest / 20) * 20
    return Math.max(40, rounded)
  }, [data])

  const groupWidth = chartWidth / Math.max(1, data.length)
  const barWidth = Math.min(11, groupWidth * 0.22)
  const gap = 3
  const totalRead = data.reduce((sum, day) => sum + (day.wordsRead || 0), 0)
  const totalWritten = data.reduce((sum, day) => sum + (day.wordsWritten || 0), 0)
  const hasData = totalRead + totalWritten > 0
  const gridValues = [0, 0.5, 1]

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-extrabold text-slate-900">This week</h3>
          <p className="mt-0.5 text-[9px] font-semibold text-slate-500">Words read and words written each day</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500" /> Read
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-400" /> Write
          </span>
        </div>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Weekly activity chart. ${totalRead} words read and ${totalWritten} words written in the last seven days.`}
        >
          {gridValues.map((ratio) => {
            const y = margin.top + chartHeight * (1 - ratio)
            return (
              <g key={ratio}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke={ratio === 0 ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? '0' : '3 4'}
                />
                <text x={margin.left - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8" fontWeight="600">
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            )
          })}

          {data.map((day, index) => {
            const groupX = margin.left + index * groupWidth + groupWidth / 2
            const readHeight = ((day.wordsRead || 0) / maxValue) * chartHeight
            const writeHeight = ((day.wordsWritten || 0) / maxValue) * chartHeight
            const readX = groupX - barWidth - gap / 2
            const writeX = groupX + gap / 2
            return (
              <g key={day.key}>
                <title>
                  {`${day.weekday}: ${day.wordsRead || 0} words read, ${day.wordsWritten || 0} written`}
                </title>
                <rect
                  x={readX}
                  y={margin.top + chartHeight - Math.max(readHeight, day.wordsRead ? 2 : 0)}
                  width={barWidth}
                  height={Math.max(readHeight, day.wordsRead ? 2 : 0)}
                  rx={barWidth / 2}
                  fill={day.isToday ? '#1d4ed8' : '#3b82f6'}
                  opacity={day.wordsRead ? 1 : 0.18}
                />
                <rect
                  x={writeX}
                  y={margin.top + chartHeight - Math.max(writeHeight, day.wordsWritten ? 2 : 0)}
                  width={barWidth}
                  height={Math.max(writeHeight, day.wordsWritten ? 2 : 0)}
                  rx={barWidth / 2}
                  fill={day.isToday ? '#d97706' : '#fbbf24'}
                  opacity={day.wordsWritten ? 1 : 0.18}
                />
                <text
                  x={groupX}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight={day.isToday ? '800' : '600'}
                  fill={day.isToday ? '#1d4ed8' : '#94a3b8'}
                >
                  {day.weekday}
                </text>
                {day.isToday ? (
                  <circle cx={groupX} cy={height - 3} r="1.8" fill="#1d4ed8" />
                ) : null}
              </g>
            )
          })}
        </svg>

        {!hasData ? (
          <div className="pointer-events-none absolute inset-x-8 bottom-12 top-8 flex flex-col items-center justify-center rounded-2xl bg-white/75 text-center backdrop-blur-[1px]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BookOpen size={16} />
            </span>
            <p className="mt-1.5 text-[10px] font-bold text-slate-500">Your first bar appears after a session</p>
            <p className="text-[9px] font-medium text-slate-500">Read a passage or save an essay today.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700">
          <BookOpen size={11} /> {totalRead} words read
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
          <PenLine size={11} /> {totalWritten} words written
        </span>
        <span className="ml-auto text-[9px] font-semibold text-slate-500">{lang === 'hi' ? 'पिछले 7 दिन' : 'Last 7 days'}</span>
      </div>
    </div>
  )
}
