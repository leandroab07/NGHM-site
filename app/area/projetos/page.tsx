import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProjectResponse } from '@/lib/types'
import AreaProjetosClient from './AreaProjetosClient'

export const metadata = {
  title: 'Projetos',
  robots: { index: false },
}

export default async function AreaProjetosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  if (!token) redirect('/admin/login')

  const payload = verifyToken(token)
  if (!payload?.sub) redirect('/admin/login')

  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  if (!user) redirect('/admin/login')

  const allProjects = await getLabProjects()

  // Respostas do usuário atual
  const { data: rawResponses } = await supabase
    .from('project_responses')
    .select('*')
    .eq('username', user.username)
  const myResponses = (rawResponses ?? []) as ProjectResponse[]
  const acceptedIds = new Set(myResponses.filter(r => r.resposta === 'aceito').map(r => r.projetoId))

  // Projetos visíveis em "Todos": visibility=all sempre, visibility=assigned só se aceitou
  const visibleProjects = allProjects.filter(p => {
    if (p.visibility === 'all') return true
    return (p.assignedTo ?? []).includes(user.username) && acceptedIds.has(p.id)
  })

  // "Meus Projetos": atribuído + aceitou (qualquer visibilidade)
  const myProjects = allProjects.filter(
    p => (p.assignedTo ?? []).includes(user.username) && acceptedIds.has(p.id)
  )

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Projetos</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Projetos internos do laboratório.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AreaProjetosClient
          allProjects={visibleProjects}
          myProjects={myProjects}
          currentUsername={user.username}
        />
      </div>
    </>
  )
}
