import { StarIcon, ZapIcon, ListIcon, LockIcon, TrophyIcon, LightbulbIcon } from '@/components/icons'

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white">كيف تلعب؟</h1>
        <p className="text-sm text-white/50">كل اللي تحتاج تعرفه عن دوري التوقعات</p>
      </div>

      <Section icon={<StarIcon size={18} className="text-brand-gold" />} title="الفكرة الأساسية">
        <p>
          توقّع نتيجة كل مباراة في كأس العالم ٢٠٢٦ قبل انطلاقها، واجمع أكبر عدد ممكن من النقاط
          لتتصدّر الترتيب وتتفوق على بقية المتنافسين.
        </p>
      </Section>

      <Section icon={<ZapIcon size={18} className="text-blue-400" />} title="نظام النقاط">
        <div className="space-y-3">
          <ScoreRow
            badge="3 نقاط"
            badgeColor="bg-brand-green/20 text-brand-green"
            title="توقع دقيق"
            desc="تتوقع النتيجة بالضبط · مثال: البرازيل 2 - 1 ألمانيا وتنتهي فعلاً 2-1"
          />
          <ScoreRow
            badge="1 نقطة"
            badgeColor="bg-blue-500/20 text-blue-400"
            title="نتيجة صحيحة"
            desc="تتوقع الفائز أو التعادل لكن الأرقام مختلفة · مثال: توقعت 2-0 وانتهت 1-0"
          />
          <ScoreRow
            badge="0 نقاط"
            badgeColor="bg-white/10 text-white/40"
            title="توقع خاطئ"
            desc="الفائز أو النتيجة مختلفة تماماً عن توقعك"
          />
        </div>
      </Section>

      <Section icon={<ListIcon size={18} className="text-blue-400" />} title="خطوات التوقع">
        <ol className="space-y-3">
          {[
            'افتح صفحة المباريات واختر المباراة التي تريد التوقع عليها.',
            'أدخل عدد الأهداف المتوقع لكل فريق.',
            'اضغط "حفظ التوقع" قبل انطلاق المباراة.',
            'بعد انتهاء المباراة تُحسب نقاطك تلقائياً.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-green/20 text-brand-green text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-white/70 text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={<LockIcon size={18} className="text-red-400" />} title="قفل التوقعات">
        <p>
          تُغلق التوقعات فور انطلاق صافرة البداية بالضبط. لا يمكنك التعديل أو الإضافة بعدها.
          تأكد من تسجيل توقعاتك مبكراً!
        </p>
      </Section>

      <Section icon={<TrophyIcon size={18} className="text-brand-gold" />} title="الترتيب">
        <p>
          يُرتّب اللاعبون حسب مجموع نقاطهم. في حال التعادل في النقاط يُقدَّم من لديه عدد أكبر
          من التوقعات الدقيقة (٣ نقاط). تابع ترتيبك لحظة بلحظة من صفحة الترتيب.
        </p>
      </Section>

      <Section icon={<LightbulbIcon size={18} className="text-yellow-400" />} title="نصائح" light>
        <ul className="space-y-2">
          {[
            'لا تنتظر آخر لحظة — بعض المباريات تنطلق في وقت مبكر.',
            'التوقع الدقيق يساوي ٣ أضعاف التوقع العادي، ركّز على المباريات التي تثق بها.',
            'يمكنك تعديل توقعك أي عدد من المرات ما دامت المباراة لم تبدأ.',
            'توقعات المجتمع تظهر بعد انطلاق المباراة — استفد منها للمباريات القادمة.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-brand-green mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ icon, title, children, light }: { icon?: React.ReactNode; title: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 space-y-3 ${light ? 'bg-white/[0.07] border border-white/10' : 'glass'}`}>
      <h2 className="font-bold text-white flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="text-white/60 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function ScoreRow({ badge, badgeColor, title, desc }: {
  badge: string
  badgeColor: string
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
        {badge}
      </span>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-white/50 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
