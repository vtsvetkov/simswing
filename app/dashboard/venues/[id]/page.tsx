import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { LogoutButton } from '@/app/dashboard/logout-button'

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
    .select('id, name')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) {
    redirect('/dashboard')
  }

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

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/95 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-[#1A2E1A] mb-2">
            {venue.name}
          </h1>
          <p className="text-gray-600">Venue detail page — coming soon.</p>
        </div>
      </main>
    </div>
  )
}
