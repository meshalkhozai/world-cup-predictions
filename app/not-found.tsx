import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 animate-fade-in">
        <p className="text-8xl font-black text-gray-800">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">الصفحة غير موجودة</h1>
          <p className="text-sm text-gray-400">الرابط الذي أدخلته غير صحيح أو تم حذف الصفحة</p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold hover:bg-emerald-400 transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
