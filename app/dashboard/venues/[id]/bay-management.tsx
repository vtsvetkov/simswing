'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase'

type Bay = {
  id: string
  name: string
  bay_number: number
  status: string
  image_url: string | null
}

export function BayManagement({ venueId, bays }: { venueId: string; bays: Bay[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', bay_number: '', image: null as File | null })
  const [editForm, setEditForm] = useState({ name: '', bay_number: '', status: 'active' })

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E1A] focus:border-[#1A2E1A] outline-none transition'

  async function uploadBayImage(file: File, bayId: string): Promise<string | null> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) return null
    if (file.size > 5 * 1024 * 1024) return null

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `bays/${bayId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('venue-images')
      .upload(path, file, { upsert: true })

    if (uploadError) return null

    const { data: { publicUrl } } = supabase.storage
      .from('venue-images')
      .getPublicUrl(path)

    return publicUrl
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Bay name is required.')
      return
    }
    if (!form.bay_number || isNaN(Number(form.bay_number))) {
      setError('Bay number is required.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: bay, error: insertError } = await supabase
        .from('bays')
        .insert({
          venue_id: venueId,
          name: form.name.trim(),
          bay_number: Number(form.bay_number),
        })
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      if (form.image && bay) {
        const imageUrl = await uploadBayImage(form.image, bay.id)
        if (imageUrl) {
          await supabase
            .from('bays')
            .update({ image_url: imageUrl })
            .eq('id', bay.id)
        }
      }

      setForm({ name: '', bay_number: '', image: null })
      setShowForm(false)
      router.refresh()
    } catch {
      setError('Failed to add bay.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(bayId: string) {
    setError('')

    if (!editForm.name.trim()) {
      setError('Bay name is required.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('bays')
        .update({
          name: editForm.name.trim(),
          bay_number: Number(editForm.bay_number),
          status: editForm.status,
        })
        .eq('id', bayId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setEditingId(null)
      router.refresh()
    } catch {
      setError('Failed to update bay.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(bayId: string) {
    if (!confirm('Delete this bay? This cannot be undone.')) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from('bays').delete().eq('id', bayId)

      if (deleteError) {
        setError(deleteError.message)
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError('Failed to delete bay.')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(bay: Bay) {
    setEditingId(bay.id)
    setEditForm({
      name: bay.name,
      bay_number: String(bay.bay_number),
      status: bay.status,
    })
    setError('')
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="bg-white/95 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1A2E1A]">Bay Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError('')
            setForm({ name: '', bay_number: '', image: null })
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[#1A2E1A] text-white hover:bg-[#243d24]"
        >
          {showForm ? 'Cancel' : '+ Add Bay'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bay name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Bay A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bay number</label>
              <input
                type="number"
                value={form.bay_number}
                onChange={(e) => setForm((f) => ({ ...f, bay_number: e.target.value }))}
                className={inputClass}
                placeholder="1"
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))}
              className="text-sm text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 bg-[#1A2E1A] text-white text-sm font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Bay'}
          </button>
        </form>
      )}

      {bays.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No bays configured yet. Add your first bay to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {bays.map((bay) => (
            <div
              key={bay.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
            >
              <div className="shrink-0">
                {bay.image_url ? (
                  <img
                    src={bay.image_url}
                    alt={bay.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-lg">&#9971;</span>
                  </div>
                )}
              </div>

              {editingId === bay.id ? (
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                      placeholder="Bay name"
                    />
                    <input
                      type="number"
                      value={editForm.bay_number}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, bay_number: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="Number"
                      min="1"
                    />
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className={`${inputClass} bg-white`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(bay.id)}
                      disabled={loading}
                      className="py-1.5 px-3 bg-[#1A2E1A] text-white text-sm font-medium rounded-lg hover:bg-[#243d24] transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="py-1.5 px-3 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{bay.name}</p>
                    <p className="text-sm text-gray-500">Bay #{bay.bay_number}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[bay.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {bay.status}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(bay)}
                      className="p-2 text-sm text-gray-500 hover:text-[#1A2E1A] transition-colors"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bay.id)}
                      className="p-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
