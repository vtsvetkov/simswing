import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { VenueForm } from './venue-form'

export default async function NewVenuePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90 hover:text-white"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <VenueForm />
      </main>
    </div>
  )
}
