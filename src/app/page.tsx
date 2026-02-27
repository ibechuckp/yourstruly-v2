import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // App subdomain - redirect to appropriate page
  if (user) {
    // Check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
    
    if (profile?.onboarding_completed) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  // Not logged in - redirect to login
  redirect('/login')
}
