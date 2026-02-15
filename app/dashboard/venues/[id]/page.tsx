import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { LogoutButton } from '@/app/dashboard/logout-button'
import { VenueInfo } from './venue-info'
import { BayManagement } from './bay-management'
import { OperatingHours } from './operating-hours'

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: venue } = await supabase
    .from('venues')
    .select(
      'id, name, address, city, state, zip, phone, website, sim_technology, timezone, image_url'
    )
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) {
    redirect('/dashboard')
  }

  const { data: bays } = await supabase
    .from('bays')
    .select('id, name, bay_number, status, image_url')
    .eq('venue_id', venue.id)
    .order('bay_number', { ascending: true })

  const { data: rules } = await supabase
    .from('availability_rules')
    .select('id, day_of_week, start_time, end_time, slot_duration_minutes, price_cents')
    .eq('venue_id', venue.id)
    .order('day_of_week', { ascending: true })

  return (
    <div className="min-h-screen bg-[#1A2E1A]">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{venue.name}</h1>
          <Link
            href={`/dashboard/venues/${venue.id}/tee-sheet`}
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors text-sm"
          >
            View Tee Sheet
          </Link>
        </div>

        <VenueInfo venue={venue} />
        <BayManagement venueId={venue.id} bays={bays ?? []} />
        <OperatingHours venueId={venue.id} rules={rules ?? []} />
      </main>
    </div>
  )
}
