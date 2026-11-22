import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import PageTransition from './page-transition'
import ScrollExperience from './scroll-experience'

const serif = Cormorant_Garamond({
  variable: '--font-studio-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})
const sans = Plus_Jakarta_Sans({
  variable: '--font-studio-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
export const metadata = {
  title: 'ALTERIA — Galeri Seni Digital',
  description: 'Temukan karya, kenali kreatornya, dan ikuti challenge seni di ALTERIA.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ScrollExperience />
        <PageTransition />
      </body>
    </html>
  )
}
