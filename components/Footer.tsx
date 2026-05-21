import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-blue-700 shrink-0">
                <Image src="/nghm.png" alt="NGHM" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">NGHM</p>
                <p className="text-gray-500 text-xs mt-0.5">Núcleo de Genética Humana e Molecular</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              Pesquisa translacional em genômica, epigenética e biologia molecular voltada
              à compreensão e ao combate de doenças humanas complexas.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">UFES</span>
              <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">CCiS</span>
              <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">Vitória, ES</span>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Navegação</p>
            <ul className="space-y-3 text-sm">
              {[
                ['/', 'Início'],
                ['/equipe', 'Equipe'],
                ['/publicacoes', 'Publicações'],
                ['/projetos', 'Linhas de Pesquisa'],
                ['/ferramentas', 'Ferramentas'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-gray-500 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Contato</p>
            <address className="text-sm text-gray-500 not-italic space-y-1.5">
              <p>Departamento de Ciências Biológicas</p>
              <p>Centro de Ciências da Saúde — UFES</p>
              <p>Av. Marechal Campos, 1468</p>
              <p>Vitória, ES — Brasil</p>
            </address>
            <a href="mailto:nghm@ufes.br"
              className="inline-flex items-center gap-2 mt-5 text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              nghm@ufes.br
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} NGHM · Universidade Federal do Espírito Santo</p>
          <Link href="/admin/login" className="text-gray-700 hover:text-gray-500 transition-colors">
            Área Restrita
          </Link>
        </div>
      </div>
    </footer>
  )
}
