import { getEventos } from '@/lib/data'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const eventos = await getEventos()

  return (
    <>
      <section className="bg-gradient-to-br from-blue-900 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">Calendário do Laboratório</h1>
          <p className="text-blue-200 text-lg max-w-2xl">
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
