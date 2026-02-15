export interface Bay {
  id: string
  name: string
  bay_number: number
  status: 'active' | 'inactive' | 'maintenance'
}

export interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  price_cents: number
}

export interface TimeSlot {
  startTime: string
  endTime: string
  priceCents: number
}

export interface Booking {
  id: string
  bay_id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  price_cents: number | null
  notes: string | null
}
