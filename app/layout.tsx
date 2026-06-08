import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const thmanyah = localFont({
  src: [
    { path: '../public/fonts/thmanyahseriftext-Light.woff2',   weight: '300', style: 'normal' },
    { path: '../public/fonts/thmanyahseriftext-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/thmanyahseriftext-Medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/thmanyahseriftext-Bold.woff2',    weight: '700', style: 'normal' },
    { path: '../public/fonts/thmanyahseriftext-Black.woff2',   weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-thmanyah',
})

export const metadata: Metadata = {
  title: 'دوري التوقعات — كأس العالم 2026',
  description: 'توقع نتائج المباريات، اجمع النقاط، وتنافس مع أصدقائك.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${thmanyah.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
