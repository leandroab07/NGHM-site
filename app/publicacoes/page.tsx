import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Publicações Científicas',
  description:
    'Produção científica do NGHM-UFES: artigos em revistas internacionais, teses, dissertações e livros em genética humana, oncologia e bioinformática.',
  alternates: { canonical: 'https://nghm.vercel.app/publicacoes' },
}

export default function PublicacoesPage() {
  return (
    <>
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Publicações Científicas</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Produção científica do Núcleo de Genética Humana e Molecular.
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-600 mb-2">Em breve</p>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">Esta seção está sendo preparada e estará disponível em breve.</p>
      </div>
    </>
  )
}
