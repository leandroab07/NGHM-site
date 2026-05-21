import { getEventos } from '@/lib/data'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const eventos = await getEventos()

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Calendário do Laboratório</h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Tarefas, provas, reuniões e eventos do NGHM — com feriados nacionais integrados.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <CalendarioClient eventos={eventos} />
      </div>
    </>
  )
}
