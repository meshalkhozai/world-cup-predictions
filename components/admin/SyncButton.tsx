'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshIcon, CheckCircleIcon, AlertCircleIcon } from '@/components/icons'

export function SyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    synced?: number
    finished?: number
    scoreErrors?: string[]
    error?: string
  } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      if (data.synced > 0) router.refresh()
    } catch {
      setResult({ error: 'خطأ في الشبكة. حاول مرة أخرى.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">مزامنة من Zafronix API</h2>
          <p className="text-xs text-white/40 mt-0.5">
            جلب جميع مباريات كأس العالم · تحديث النتائج · حساب النقاط تلقائيًا
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold disabled:opacity-40 hover:bg-emerald-400 transition-colors flex items-center gap-2"
        >
          <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'جارٍ المزامنة…' : 'مزامنة الآن'}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl p-3 text-sm flex items-start gap-2 ${
          result.error ? 'bg-red-500/10 text-red-400' : 'bg-brand-green/10 text-brand-green'
        }`}>
          {result.error
            ? <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
            : <CheckCircleIcon size={16} className="shrink-0 mt-0.5" />
          }
          <div>
            {result.error ? `خطأ: ${result.error}` : `تمت مزامنة ${result.synced} مباراة · ${result.finished} منتهية`}
            {result.scoreErrors && result.scoreErrors.length > 0 && (
              <ul className="text-xs text-yellow-400 list-disc list-inside mt-1">
                {result.scoreErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
