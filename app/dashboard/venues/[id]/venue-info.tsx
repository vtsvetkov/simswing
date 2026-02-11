'use client'

import { useState } from 'react'
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

type Venue = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  website: string | null
  sim_technology: string | null
  timezone: string | null
  image_url: string | null
}

export function VenueInfo({ venue }: { venue: Venue }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: venue.name,
    address: venue.address ?? '',
    city: venue.city ?? '',
    state: venue.state ?? '',
    zip: venue.zip ?? '',
    phone: venue.phone ?? '',
    website: venue.website ?? '',
    sim_technology: venue.sim_technology ?? '',
    timezone: venue.timezone ?? 'America/Denver',
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `venues/${venue.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('venue-images')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('venue-images')
        .getPublicUrl(path)

      await supabase
        .from('venues')
        .update({ image_url: publicUrl })
        .eq('id', venue.id)

      router.refresh()
    } catch {
      setError('Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Venue name is required.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('venues')
        .update({
          name: form.name.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          sim_technology: form.sim_technology || null,
          timezone: form.timezone || 'America/Denver',
        })
        .eq('id', venue.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setEditing(false)
      router.refresh()
    } catch {
      setError('Failed to update venue.')
    } finally {
      setLoading(false)
    }
  }

  const addressParts = [venue.address, venue.city, venue.state, venue.zip].filter(Boolean)
  const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition'

  return (
    <div className="bg-white/95 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1A2E1A]">Venue Info</h2>
        <button
          onClick={() => {
            if (editing) {
              setForm({
                name: venue.name,
                address: venue.address ?? '',
                city: venue.city ?? '',
                state: venue.state ?? '',
                zip: venue.zip ?? '',
                phone: venue.phone ?? '',
                website: venue.website ?? '',
                sim_technology: venue.sim_technology ?? '',
                timezone: venue.timezone ?? 'America/Denver',
              })
              setError('')
            }
            setEditing(!editing)
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[#1A2E1A]/10 text-[#1A2E1A] hover:bg-[#1A2E1A]/20"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="shrink-0">
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-32 h-32 object-cover rounded-xl"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-gray-400 text-3xl">&#9971;</span>
            </div>
          )}
          <label className="mt-2 block">
            <span className="text-xs text-[#1A2E1A] font-medium cursor-pointer hover:underline">
              {uploading ? 'Uploading...' : 'Upload image'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {!editing && (
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900">{venue.name}</p>
            {addressLine && <p className="text-sm text-gray-600">{addressLine}</p>}
            {venue.sim_technology && (
              <p className="text-sm text-gray-500">Sim: {venue.sim_technology}</p>
            )}
            {venue.phone && <p className="text-sm text-gray-500">Phone: {venue.phone}</p>}
            {venue.website && <p className="text-sm text-gray-500">Web: {venue.website}</p>}
            {venue.timezone && <p className="text-sm text-gray-500">TZ: {venue.timezone}</p>}
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Par & Bar Golf"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputClass}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={inputClass}
                placeholder="Denver"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={inputClass}
                placeholder="CO"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
              className={inputClass}
              placeholder="80202"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
              placeholder="(303) 555-0123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Simulator technology
            </label>
            <select
              value={form.sim_technology}
              onChange={(e) => setForm((f) => ({ ...f, sim_technology: e.target.value }))}
              className={`${inputClass} bg-white`}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className={inputClass}
              placeholder="America/Denver"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1A2E1A] text-white font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {!editing && error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
    </div>
  )
}
