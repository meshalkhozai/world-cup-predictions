'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const is403 = error.message?.includes('403') || error.message?.includes('permission') || error.message?.includes('unauthorized')

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
      <p className="text-8xl font-black text-white/10">{is403 ? '403' : '500'}</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">
          {is403 ? 'غير مصرح لك' : 'حدث خطأ'}
        </h1>
        <p className="text-sm text-white/50">
          {is403 ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة' : 'حدث خطأ غير متوقع، نعتذر عن الإزعاج'}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          حاول مجدداً
        </button>
        <Link href="/dashboard" className="px-6 py-2.5 rounded-xl glass border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
          الرئيسية
        </Link>
      </div>
    </div>
  )
}
