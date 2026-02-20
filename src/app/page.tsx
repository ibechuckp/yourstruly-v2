import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, go to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
          YoursTruly
        </h1>
        <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-2xl">
          Document your life. Capture family stories. 
          <br />
          Stay connected across generations.
        </p>
        
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-colors border border-white/20"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">📹</div>
            <h3 className="text-white font-semibold mb-2">Video Journalist</h3>
            <p className="text-purple-200 text-sm">Send questions to grandma. Capture her stories forever.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-white font-semibold mb-2">AI Avatar</h3>
            <p className="text-purple-200 text-sm">Create a digital version of yourself for loved ones.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">💌</div>
            <h3 className="text-white font-semibold mb-2">PostScripts</h3>
            <p className="text-purple-200 text-sm">Schedule messages and gifts for the future.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
