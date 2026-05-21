import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TaskNotification from '@/components/TaskNotification'
import ProjectNotification from '@/components/ProjectNotification'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

const BASE = 'https://nghm.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'NGHM — Núcleo de Genética Humana e Molecular | UFES',
    template: '%s | NGHM — UFES',
  },
  description:
    'Laboratório de pesquisa em genética humana, biologia molecular e genômica da Universidade Federal do Espírito Santo (UFES). Oncologia translacional, bioinformática e genética do câncer.',
  keywords: [
    'genética humana', 'biologia molecular', 'genômica', 'UFES',
    'Universidade Federal do Espírito Santo', 'oncologia translacional',
    'bioinformática', 'genética do câncer', 'COVID longa', 'Espírito Santo',
    'Débora Dummer Meira', 'NGHM', 'laboratório de genética',
  ],
  authors: [{ name: 'NGHM — UFES', url: BASE }],
  creator: 'Núcleo de Genética Humana e Molecular — UFES',
  publisher: 'Universidade Federal do Espírito Santo',
  icons: {
    icon: '/nghm.png',
    apple: '/nghm.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: BASE,
    siteName: 'NGHM — Núcleo de Genética Humana e Molecular',
    title: 'NGHM — Núcleo de Genética Humana e Molecular | UFES',
    description:
      'Pesquisa de ponta em genômica, epigenética e biologia molecular para compreender e combater doenças humanas. Vinculado ao Departamento de Ciências Biológicas da UFES.',
    images: [{ url: '/nghm.png', width: 512, height: 512, alt: 'NGHM — UFES' }],
  },
  twitter: {
    card: 'summary',
    title: 'NGHM — Núcleo de Genética Humana e Molecular | UFES',
    description:
      'Pesquisa em genômica, epigenética e biologia molecular na Universidade Federal do Espírito Santo.',
    images: ['/nghm.png'],
  },
  alternates: {
    canonical: BASE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ResearchOrganization',
  name: 'Núcleo de Genética Humana e Molecular — UFES',
  alternateName: 'NGHM',
  url: BASE,
  logo: `${BASE}/nghm.png`,
  email: 'nghm@ufes.br',
  description:
    'Laboratório de pesquisa em genética humana, biologia molecular e genômica da Universidade Federal do Espírito Santo.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Departamento de Ciências Biológicas, Centro de Ciências da Saúde',
    addressLocality: 'Vitória',
    addressRegion: 'ES',
    addressCountry: 'BR',
  },
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: 'Universidade Federal do Espírito Santo',
    alternateName: 'UFES',
    url: 'https://www.ufes.br',
  },
  knowsAbout: [
    'Genética Humana', 'Biologia Molecular', 'Genômica', 'Oncologia Translacional',
    'Bioinformática', 'Genética do Câncer', 'Epigenética', 'COVID Longa',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <TaskNotification />
        <ProjectNotification />
      </body>
    </html>
  )
}
