import { createClient } from '@/src/lib/supabase'

export default async function Home() {
  const supabase = createClient()
  const { data: venues, error } = await supabase.from('venues').select('*')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">SimSwing</h1>
      {error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : (
        <p className="text-green-500">Connected to Supabase! Venues found: {venues?.length ?? 0}</p>
      )}
    </div>
  )
}