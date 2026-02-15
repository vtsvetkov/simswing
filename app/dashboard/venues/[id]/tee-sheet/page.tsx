import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { LogoutButton } from '@/app/dashboard/logout-button'
import { TeeSheetGrid } from './tee-sheet-grid'
import {
  getTodayInTimezone,
  getDayOfWeek,
  generateTimeSlots,
  getDayUTCRange,
  timeToMinutes,
  minutesToTime,
} from '@/src/lib/tee-sheet-utils'
import type { Bay, AvailabilityRule, Booking, TimeSlot } from '@/src/lib/types'

export default async function TeeSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const { date: dateParam } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, timezone')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) {
    redirect('/dashboard')
  }

  const timezone = venue.timezone || 'America/Denver'
  const selectedDate = dateParam || getTodayInTimezone(timezone)

  // Fetch active bays
  const { data: bays } = await supabase
    .from('bays')
    .select('id, name, bay_number, status')
    .eq('venue_id', venue.id)
    .eq('status', 'active')
    .order('bay_number', { ascending: true })

  // Get availability rule for this day of week
  const dayOfWeek = getDayOfWeek(selectedDate)
  const { data: rules } = await supabase
    .from('availability_rules')
    .select(
      'id, day_of_week, start_time, end_time, slot_duration_minutes, price_cents'
    )
    .eq('venue_id', venue.id)
    .eq('day_of_week', dayOfWeek)

  const rule = (rules?.[0] as AvailabilityRule) ?? null
  const timeSlots: TimeSlot[] = rule ? generateTimeSlots(rule) : []

  // Fetch bookings for this date
  const [dayStartUTC, dayEndUTC] = getDayUTCRange(selectedDate, timezone)
  const bayIds = (bays ?? []).map((b: Bay) => b.id)

  let bookings: Booking[] = []
  if (bayIds.length > 0 && timeSlots.length > 0) {
    const { data } = await supabase
      .from('bookings')
      .select(
        'id, bay_id, user_id, start_time, end_time, status, price_cents, notes'
      )
      .in('bay_id', bayIds)
      .gte('start_time', dayStartUTC)
      .lt('start_time', dayEndUTC)
      .neq('status', 'cancelled')

    bookings = (data ?? []) as Booking[]
  }

  // Build booking lookup: "bayId|HH:MM" -> Booking
  // Handle multi-slot bookings by mapping all covered slots
  const slotDuration = rule?.slot_duration_minutes ?? 60
  const bookingMap: Record<string, Booking> = {}
  for (const booking of bookings) {
    const localStart = new Date(booking.start_time).toLocaleTimeString(
      'en-GB',
      { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }
    )
    const localEnd = new Date(booking.end_time).toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const startMins = timeToMinutes(localStart)
    const endMins = timeToMinutes(localEnd)
    for (let m = startMins; m < endMins; m += slotDuration) {
      const key = `${booking.bay_id}|${minutesToTime(m)}`
      bookingMap[key] = booking
    }
  }

  return (
    <div className="min-h-screen bg-[#1A2E1A]">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-white hover:text-white/90"
          >
            SimSwing
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/venues/${venue.id}`}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            &larr; Back to {venue.name}
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Tee Sheet</h1>
        </div>

        <TeeSheetGrid
          venueId={venue.id}
          timezone={timezone}
          selectedDate={selectedDate}
          bays={(bays ?? []) as Bay[]}
          timeSlots={timeSlots}
          bookingMap={bookingMap}
          isClosed={!rule}
          userId={user.id}
          slotDurationMinutes={slotDuration}
        />
      </main>
    </div>
  )
}
