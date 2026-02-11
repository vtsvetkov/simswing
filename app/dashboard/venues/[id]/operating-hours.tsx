'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// day_of_week in DB: 0 = Monday ... 6 = Sunday
function buildTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 6; h <= 23; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 23) {
      times.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  return times
}

const TIME_OPTIONS = buildTimeOptions()
const DURATION_OPTIONS = [30, 60, 90, 120]

type Rule = {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  price_cents: number
}

type DayRow = {
  closed: boolean
  start_time: string
  end_time: string
  slot_duration_minutes: number
  price_dollars: string
}

function ruleToRow(rule: Rule | undefined): DayRow {
  if (!rule) {
    return {
      closed: true,
      start_time: '09:00',
      end_time: '21:00',
      slot_duration_minutes: 60,
      price_dollars: '',
    }
  }
  return {
    closed: false,
    start_time: rule.start_time.slice(0, 5),
    end_time: rule.end_time.slice(0, 5),
    slot_duration_minutes: rule.slot_duration_minutes,
    price_dollars: (rule.price_cents / 100).toFixed(2),
  }
}

export function OperatingHours({
  venueId,
  rules,
}: {
  venueId: string
  rules: Rule[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const rulesByDay = new Map<number, Rule>()
  for (const r of rules) {
    rulesByDay.set(r.day_of_week, r)
  }

  const [rows, setRows] = useState<DayRow[]>(
    DAYS.map((_, i) => ruleToRow(rulesByDay.get(i)))
  )

  function updateRow(index: number, partial: Partial<DayRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...partial } : r)))
  }

  function copyToAll() {
    const source = rows[0]
    setRows((prev) => prev.map(() => ({ ...source })))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    // Validate active rows have prices
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.closed) {
        const price = parseFloat(row.price_dollars)
        if (isNaN(price) || price < 0) {
          setError(`${DAYS[i]}: Please enter a valid price.`)
          return
        }
        if (row.start_time >= row.end_time) {
          setError(`${DAYS[i]}: End time must be after start time.`)
          return
        }
      }
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Delete existing rules for this venue
      const { error: deleteError } = await supabase
        .from('availability_rules')
        .delete()
        .eq('venue_id', venueId)

      if (deleteError) {
        setError(deleteError.message)
        setLoading(false)
        return
      }

      // Insert active rows
      const inserts = rows
        .map((row, i) => {
          if (row.closed) return null
          return {
            venue_id: venueId,
            day_of_week: i,
            start_time: row.start_time,
            end_time: row.end_time,
            slot_duration_minutes: row.slot_duration_minutes,
            price_cents: Math.round(parseFloat(row.price_dollars) * 100),
          }
        })
        .filter(Boolean)

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('availability_rules')
          .insert(inserts)

        if (insertError) {
          setError(insertError.message)
          setLoading(false)
          return
        }
      }

      setSuccess('Operating hours saved.')
      router.refresh()
    } catch {
      setError('Failed to save operating hours.')
    } finally {
      setLoading(false)
    }
  }

  const hasAnyRules = rules.length > 0 || rows.some((r) => !r.closed)

  const selectClass =
    'px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition bg-white text-sm'

  return (
    <div className="bg-white/95 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1A2E1A]">Operating Hours & Pricing</h2>
        <button
          onClick={copyToAll}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[#1A2E1A]/10 text-[#1A2E1A] hover:bg-[#1A2E1A]/20"
        >
          Copy Monday to all days
        </button>
      </div>

      {!hasAnyRules && rules.length === 0 && (
        <p className="text-gray-500 text-center py-4 mb-4">
          Set your operating hours and pricing to start accepting bookings.
        </p>
      )}

      <div className="space-y-3">
        {DAYS.map((day, i) => {
          const row = rows[i]
          return (
            <div
              key={day}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                row.closed
                  ? 'border-gray-100 bg-gray-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="w-24 shrink-0">
                <span className="text-sm font-medium text-gray-900">{day}</span>
              </div>

              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(e) => updateRow(i, { closed: e.target.checked })}
                  className="rounded border-gray-300 text-[#1A2E1A] focus:ring-[#1A2E1A]"
                />
                <span className="text-xs text-gray-600">Closed</span>
              </label>

              {!row.closed && (
                <>
                  <select
                    value={row.start_time}
                    onChange={(e) => updateRow(i, { start_time: e.target.value })}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>

                  <span className="text-gray-400 text-sm">to</span>

                  <select
                    value={row.end_time}
                    onChange={(e) => updateRow(i, { end_time: e.target.value })}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.slot_duration_minutes}
                    onChange={(e) =>
                      updateRow(i, { slot_duration_minutes: Number(e.target.value) })
                    }
                    className={selectClass}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      value={row.price_dollars}
                      onChange={(e) => updateRow(i, { price_dollars: e.target.value })}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-lg">{success}</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 w-full py-3 px-4 bg-[#1A2E1A] text-white font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Operating Hours'}
      </button>
    </div>
  )
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr} ${suffix}`
}
