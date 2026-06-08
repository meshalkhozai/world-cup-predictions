'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { HomeIcon, SwordsIcon, ClipboardIcon, TrophyIcon, SettingsIcon, LogOutIcon, ZapIcon } from '@/components/icons'
import type { Profile } from '@/types'

interface NavbarProps {
  profile: Profile
}

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'الرئيسية',  Icon: HomeIcon },
  { href: '/matches',     label: 'المباريات', Icon: SwordsIcon },
  { href: '/predictions', label: 'توقعاتي',   Icon: ClipboardIcon },
  { href: '/leaderboard', label: 'الترتيب',   Icon: TrophyIcon },
  { href: '/guide',       label: 'كيف تلعب؟', Icon: ZapIcon },
]

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top bar (desktop) */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-40 h-14 items-center px-6 glass border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2 me-8">
          <span className="font-bold text-sm text-white">كأس العالم ٢٠٢٦</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || (pathname.startsWith(href) && href !== '/dashboard')
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          {profile.is_admin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <SettingsIcon size={15} />
              الإدارة
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 ms-auto">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.nickname} width={32} height={32} className="rounded-full ring-2 ring-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold">
              {profile.nickname[0]?.toUpperCase()}
            </div>
          )}
          <div className="text-start">
            <p className="text-xs font-medium text-white">{profile.nickname}</p>
            <p className="text-xs text-brand-green">{profile.total_points} نقطة</p>
          </div>
          <button onClick={handleSignOut} className="text-white/40 hover:text-white/70 transition-colors">
            <LogOutIcon size={16} />
          </button>
        </div>
      </header>

      {/* Top bar (mobile) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-12 flex items-center justify-between px-4 glass border-b border-white/10">
        <div className="flex items-center gap-2">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.nickname} width={26} height={26} className="rounded-full ring-1 ring-white/20" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold">
              {profile.nickname[0]?.toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <p className="text-xs font-medium text-white">{profile.nickname}</p>
            <p className="text-[10px] text-brand-green">{profile.total_points} نقطة</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
        >
          <LogOutIcon size={13} />
          خروج
        </button>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center glass border-t border-white/10 px-2 pb-safe">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
                active ? 'text-brand-green' : 'text-white/40'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
