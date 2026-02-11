'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase'

const SIM_TECH_OPTIONS = [
  'Trackman',
  'Full Swing',
  'X Golf',
  'Toptracer',
  'Uneekor',
  'Other',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function VenueForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: '',
    sim_technology: '',
    timezone: 'America/Denver',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const name = form.name.trim()
    if (!name) {
      setErrors({ name: 'Venue name is required' })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        router.refresh()
        return
      }

      const baseSlug = slugify(name)
      let inserted = false
      let lastError: { message: string } | null = null

      for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
        const { error } = await supabase.from('venues').insert({
          owner_id: user.id,
          name,
          slug,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          sim_technology: form.sim_technology || null,
          timezone: form.timezone || 'America/Denver',
        })
        if (!error) {
          inserted = true
        } else if (error.code !== '23505') {
          lastError = error
          break
        }
      }

      if (!inserted) {
        setErrors({
          submit: lastError
            ? lastError.message
            : 'Could not create venue. Try a different name.',
        })
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 rounded-2xl shadow-xl p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-[#1A2E1A] mb-6">New Venue</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Venue name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="e.g. Par & Bar Golf"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </label>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
              placeholder="Denver"
            />
          </div>
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              State
            </label>
            <input
              id="state"
              type="text"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
              placeholder="CO"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Zip
          </label>
          <input
            id="zip"
            type="text"
            value={form.zip}
            onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="80202"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="(303) 555-0123"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Website
          </label>
          <input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label
            htmlFor="sim_technology"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Simulator technology
          </label>
          <select
            id="sim_technology"
            value={form.sim_technology}
            onChange={(e) =>
              setForm((f) => ({ ...f, sim_technology: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition bg-white"
          >
            <option value="">Select...</option>
            {SIM_TECH_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Timezone
          </label>
          <input
            id="timezone"
            type="text"
            value={form.timezone}
            onChange={(e) =>
              setForm((f) => ({ ...f, timezone: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition"
            placeholder="America/Denver"
          />
        </div>

        {errors.submit && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {errors.submit}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-[#1A2E1A] text-white font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Venue'}
          </button>
          <Link
            href="/dashboard"
            className="py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
