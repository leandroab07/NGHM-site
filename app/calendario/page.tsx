import type { Metadata } from 'next'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Calendário do Laboratório',
  description: 'Agenda de tarefas, provas, reuniões e eventos do NGHM-UFES.',
  robots: { index: false },
}
import { verifyToken } from '@/lib/auth'
import { getUsers, getEventos } from '@/lib/data'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  let currentUsername: string | undefined

  if (token) {
    const payload = verifyToken(token)
    if (payload?.sub) {
      const users = await getUsers()
      const user = users.find(u => u.username === payload.sub)
      if (user) currentUsername = user.username
    }
  }

  const eventos = await getEventos()

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Calendário do Laboratório</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Tarefas, provas, reuniões e eventos do NGHM — com feriados nacionais integrados.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <CalendarioClient eventos={eventos} currentUsername={currentUsername} />
      </div>
    </>
  )
}
