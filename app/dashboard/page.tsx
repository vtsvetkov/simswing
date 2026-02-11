import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { LogoutButton } from './logout-button'

type VenueRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  bays?: { count: number }[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, address, city, state, zip, bays(count)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const venueList = (venues ?? []) as VenueRow[]
  const bayCount = (v: VenueRow) => v.bays?.[0]?.count ?? 0

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
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your Venues</h1>
          <Link
            href="/dashboard/venues/new"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            + New Venue
          </Link>
        </div>

        {venueList.length === 0 ? (
          <div className="bg-white/95 rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-600 text-lg mb-6">
              You don&apos;t have any venues yet.
            </p>
            <Link
              href="/dashboard/venues/new"
              className="inline-block py-3 px-6 bg-[#1A2E1A] text-white font-medium rounded-lg hover:bg-[#243d24] transition-colors"
            >
              New Venue
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {venueList.map((venue) => {
              const addressParts = [venue.address, venue.city, venue.state, venue.zip].filter(Boolean)
              const addressLine = addressParts.length > 0 ? addressParts.join(', ') : 'No address'
              const bays = bayCount(venue)
              return (
                <Link
                  key={venue.id}
                  href={`/dashboard/venues/${venue.id}`}
                  className="block bg-white/95 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow border border-white/20"
                >
                  <h2 className="text-xl font-bold text-[#1A2E1A] mb-2">
                    {venue.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-2">{addressLine}</p>
                  <p className="text-gray-500 text-sm">
                    {bays} {bays === 1 ? 'bay' : 'bays'}
                  </p>
                </Link>
              )
            })}
            <Link
              href="/dashboard/venues/new"
              className="flex items-center justify-center min-h-[120px] bg-white/10 hover:bg-white/20 rounded-2xl border-2 border-dashed border-white/30 text-white font-medium transition-colors"
            >
              + New Venue
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
