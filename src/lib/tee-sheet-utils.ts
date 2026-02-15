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
 * Extract date/time components for a given Date in a specific timezone,
 * using formatToParts to avoid local-timezone ambiguity.
 */
function getPartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

/**
 * Convert a local date + time + timezone into a UTC ISO string for DB storage.
 * Works correctly regardless of the browser/server's local timezone.
 */
export function localToUTC(dateStr: string, timeStr: string, timezone: string): string {
  // Start with the target time interpreted as UTC
  const asUTC = new Date(`${dateStr}T${timeStr}:00Z`)

  // Find what that UTC instant looks like in both UTC and the target timezone
  const utcParts = getPartsInTimezone(asUTC, 'UTC')
  const tzParts = getPartsInTimezone(asUTC, timezone)

  // Compare using Date.UTC to get timezone-neutral millisecond values
  const utcMs = Date.UTC(utcParts.year, utcParts.month - 1, utcParts.day, utcParts.hour, utcParts.minute)
  const tzMs = Date.UTC(tzParts.year, tzParts.month - 1, tzParts.day, tzParts.hour, tzParts.minute)
  const offsetMs = utcMs - tzMs

  // Shift by the offset: e.g. 9 AM Denver + 7h offset = 4 PM UTC
  return new Date(asUTC.getTime() + offsetMs).toISOString()
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
