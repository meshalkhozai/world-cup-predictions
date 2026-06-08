'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
          <p style={{ fontSize: '5rem', fontWeight: 900, opacity: 0.1, margin: 0 }}>500</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>خطأ في النظام</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>حدث خطأ في تحميل التطبيق</p>
          <button
            onClick={reset}
            style={{ padding: '0.625rem 1.5rem', borderRadius: '0.75rem', background: '#00E676', color: '#0F172A', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            حاول مجدداً
          </button>
        </div>
      </body>
    </html>
  )
}
