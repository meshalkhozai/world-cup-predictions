import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import type { Profile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Profile | null
  if (!typedProfile || !typedProfile.onboarding_completed) redirect('/onboarding')

  return (
    <div className="min-h-screen">
      <Navbar profile={typedProfile} />
      {/* Offset for top bar on desktop, bottom nav on mobile */}
      <main className="pt-12 md:pt-14 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
