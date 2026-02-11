import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A2E1A] px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        SimSwing
      </h1>
      <p className="text-xl text-white/80 text-center mb-12 max-w-md">
        AI-powered booking for indoor golf
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-8 py-3 bg-white text-[#1A2E1A] font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
        >
          Log In
        </Link>
      </div>
    </div>
  )
}
