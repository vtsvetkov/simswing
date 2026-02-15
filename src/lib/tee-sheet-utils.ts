import type { AvailabilityRule, TimeSlot } from './types'

/**
 * Convert "HH:MM" or "HH:MM:SS" to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert total minutes since midnight to "HH:MM".
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get the day_of_week index (0=Mon..6=Sun) for a YYYY-MM-DD date string.
 * Matches the DB convention used in operating-hours.tsx.
 */
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const jsDay = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Generate time slots from an availability rule.
 */
export function generateTimeSlots(rule: AvailabilityRule): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startMinutes = timeToMinutes(rule.start_time)
  const endMinutes = timeToMinutes(rule.end_time)
  const duration = rule.slot_duration_minutes

  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    slots.push({
      startTime: minutesToTime(m),
      endTime: minutesToTime(m + duration),
      priceCents: rule.price_cents,
    })
  }

  return slots
}

/**
 * Get today's date as YYYY-MM-DD in a specific timezone.
 */
export function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
}

/**
 * Navigate to previous/next date. Returns YYYY-MM-DD.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * Format "HH:MM" (24h) to "h:MM AM/PM" for display.
 */
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr} ${suffix}`
}

/**
 * Convert a local date + time + timezone into a UTC ISO string for DB storage.
 */
export function localToUTC(dateStr: string, timeStr: string, timezone: string): string {
  // Build a reference date to compute the UTC offset for this timezone
  const naive = new Date(`${dateStr}T${timeStr}:00`)
  const utcStr = naive.toLocaleString('en-US', { timeZone: 'UTC' })
  const localStr = naive.toLocaleString('en-US', { timeZone: timezone })
  const utcDate = new Date(utcStr)
  const localDate = new Date(localStr)
  const offsetMs = utcDate.getTime() - localDate.getTime()
  const actualUTC = new Date(naive.getTime() + offsetMs)
  return actualUTC.toISOString()
}

/**
 * Get UTC range for a full day in a given timezone.
 * Returns [startUTC, endUTC] as ISO strings.
 */
export function getDayUTCRange(dateStr: string, timezone: string): [string, string] {
  const startUTC = localToUTC(dateStr, '00:00', timezone)
  const nextDayStr = addDays(dateStr, 1)
  const endUTC = localToUTC(nextDayStr, '00:00', timezone)
  return [startUTC, endUTC]
}
