'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase'
import { addDays, formatTime12h, localToUTC } from '@/src/lib/tee-sheet-utils'
import type { Bay, TimeSlot, Booking } from '@/src/lib/types'

interface TeeSheetGridProps {
  venueId: string
  timezone: string
  selectedDate: string
  bays: Bay[]
  timeSlots: TimeSlot[]
  bookingMap: Record<string, Booking>
  isClosed: boolean
  userId: string
  slotDurationMinutes: number
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const jsDay = date.getDay()
  const idx = jsDay === 0 ? 6 : jsDay - 1
  return DAYS[idx]
}

export function TeeSheetGrid({
  venueId,
  timezone,
  selectedDate,
  bays,
  timeSlots,
  bookingMap,
  isClosed,
  userId,
  slotDurationMinutes,
}: TeeSheetGridProps) {
  const router = useRouter()
  const [bookingSlot, setBookingSlot] = useState<{
    bayId: string
    slot: TimeSlot
  } | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function goToDate(dateStr: string) {
    router.push(`/dashboard/venues/${venueId}/tee-sheet?date=${dateStr}`)
  }

  async function handleCreateBooking() {
    if (!bookingSlot) return
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const startUTC = localToUTC(
        selectedDate,
        bookingSlot.slot.startTime,
        timezone
      )
      const endUTC = localToUTC(
        selectedDate,
        bookingSlot.slot.endTime,
        timezone
      )

      const { error: insertError } = await supabase.from('bookings').insert({
        bay_id: bookingSlot.bayId,
        user_id: userId,
        start_time: startUTC,
        end_time: endUTC,
        status: 'confirmed',
        price_cents: bookingSlot.slot.priceCents,
        notes: notes.trim() || null,
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setBookingSlot(null)
      setNotes('')
      setLoading(false)
      router.refresh()
    } catch {
      setError('Failed to create booking.')
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone })

  return (
    <>
      {/* Date Navigator */}
      <div className="bg-white/95 rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToDate(addDays(selectedDate, -1))}
            className="p-2 text-gray-600 hover:text-[#1A2E1A] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-[#1A2E1A]">
              {formatDateDisplay(selectedDate)}
            </h2>
          </div>

          <button
            onClick={() => goToDate(addDays(selectedDate, 1))}
            className="p-2 text-gray-600 hover:text-[#1A2E1A] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {selectedDate !== today && (
          <div className="text-center mt-2">
            <button
              onClick={() => goToDate(today)}
              className="text-sm text-[#1A2E1A] hover:underline font-medium"
            >
              Go to Today
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="bg-white/95 rounded-2xl shadow-xl p-6">
        {isClosed ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              Venue is closed on {getDayName(selectedDate)}s
            </p>
            <Link
              href={`/dashboard/venues/${venueId}`}
              className="text-sm text-[#1A2E1A] hover:underline font-medium"
            >
              Configure operating hours
            </Link>
          </div>
        ) : bays.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              No active bays configured
            </p>
            <Link
              href={`/dashboard/venues/${venueId}`}
              className="text-sm text-[#1A2E1A] hover:underline font-medium"
            >
              Add bays in venue settings
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-sm font-semibold text-gray-500 border-b border-gray-200 min-w-[100px]">
                    Time
                  </th>
                  {bays.map((bay) => (
                    <th
                      key={bay.id}
                      className="px-4 py-3 text-center text-sm font-semibold text-[#1A2E1A] border-b border-gray-200 min-w-[140px]"
                    >
                      {bay.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.startTime} className="group">
                    <td className="sticky left-0 bg-white z-10 px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-100">
                      {formatTime12h(slot.startTime)}
                    </td>
                    {bays.map((bay) => {
                      const key = `${bay.id}|${slot.startTime}`
                      const booking = bookingMap[key]
                      return (
                        <td
                          key={bay.id}
                          className="px-2 py-1 border-b border-gray-100"
                        >
                          {booking ? (
                            <BookedCell booking={booking} />
                          ) : (
                            <AvailableCell
                              slot={slot}
                              onClick={() =>
                                setBookingSlot({ bayId: bay.id, slot })
                              }
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1A2E1A] mb-4">
              New Booking
            </h3>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Bay:</span>{' '}
                {bays.find((b) => b.id === bookingSlot.bayId)?.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span>{' '}
                {formatDateDisplay(selectedDate)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Time:</span>{' '}
                {formatTime12h(bookingSlot.slot.startTime)} &ndash;{' '}
                {formatTime12h(bookingSlot.slot.endTime)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Price:</span> $
                {(bookingSlot.slot.priceCents / 100).toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
                rows={3}
                placeholder="Customer name, group size, special requests..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-[#1A2E1A] text-white font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                onClick={() => {
                  setBookingSlot(null)
                  setNotes('')
                  setError('')
                }}
                className="py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AvailableCell({
  slot,
  onClick,
}: {
  slot: TimeSlot
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-center transition-colors cursor-pointer"
    >
      <span className="text-sm font-medium text-green-700">
        ${(slot.priceCents / 100).toFixed(0)}
      </span>
    </button>
  )
}

function BookedCell({ booking }: { booking: Booking }) {
  const statusStyles: Record<string, string> = {
    confirmed:
      'bg-[#1A2E1A]/10 border-[#1A2E1A]/20 text-[#1A2E1A]',
    completed: 'bg-gray-100 border-gray-200 text-gray-600',
    no_show: 'bg-red-50 border-red-200 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'Booked',
    completed: 'Completed',
    no_show: 'No-show',
  }

  const style = statusStyles[booking.status] ?? statusStyles.confirmed

  return (
    <div
      className={`w-full px-3 py-2 rounded-lg border ${style} text-center`}
    >
      <span className="text-sm font-medium">
        {statusLabels[booking.status] ?? 'Booked'}
      </span>
      {booking.notes && (
        <p className="text-xs mt-0.5 opacity-70 truncate">{booking.notes}</p>
      )}
    </div>
  )
}
