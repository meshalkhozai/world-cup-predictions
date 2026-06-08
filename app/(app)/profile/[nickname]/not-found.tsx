import Link from 'next/link'

export default function ProfileNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
      <p className="text-8xl font-black text-white/10">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">المستخدم غير موجود</h1>
        <p className="text-sm text-white/50">لا يوجد حساب بهذا الاسم المستعار</p>
      </div>
      <Link href="/leaderboard" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold hover:bg-emerald-400 transition-colors">
        العودة للترتيب
      </Link>
    </div>
  )
}
