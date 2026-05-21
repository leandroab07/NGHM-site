import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'NGHM — Núcleo de Genética Humana e Molecular | UFES',
  description:
    'Laboratório de pesquisa em genética humana, biologia molecular e genômica da Universidade Federal do Espírito Santo.',
  keywords: 'genética humana, biologia molecular, genômica, UFES, pesquisa, câncer, polimorfismos',
  icons: {
    icon: '/nghm.png',
    apple: '/nghm.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
