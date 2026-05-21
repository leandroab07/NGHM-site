import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-700 shrink-0">
                <Image src="/nghm.png" alt="NGHM" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">NGHM</p>
                <p className="text-gray-400 text-xs">Núcleo de Genética Humana e Molecular</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Laboratório dedicado à pesquisa em genética humana, biologia molecular e genômica,
              vinculado à Universidade Federal do Espírito Santo.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['/', 'Início'],
                ['/equipe', 'Equipe'],
                ['/publicacoes', 'Publicações'],
                ['/projetos', 'Projetos'],
                ['/calendario', 'Calendário'],
                ['/ferramentas', 'Ferramentas'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-gray-400 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <address className="text-sm text-gray-400 not-italic space-y-2">
              <p>Departamento de Ciências Biológicas</p>
              <p>Centro de Ciências da Saúde</p>
              <p>Universidade Federal do Espírito Santo</p>
              <p>Vitória, ES — Brasil</p>
              <a href="mailto:nghm@ufes.br" className="text-teal-400 hover:text-teal-300 transition-colors block mt-2">
                nghm@ufes.br
              </a>
            </address>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} NGHM — Universidade Federal do Espírito Santo</p>
          <Link href="/admin/login" className="text-gray-600 hover:text-gray-400 transition-colors">
            Área Administrativa
          </Link>
        </div>
      </div>
    </footer>
  )
}
