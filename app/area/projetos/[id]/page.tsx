import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProjectTask } from '@/lib/types'
import KanbanBoard from './KanbanBoard'
import Link from 'next/link'

export const metadata = { robots: { index: false } }

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  if (!token) redirect('/admin/login')

  const payload = verifyToken(token)
  if (!payload?.sub) redirect('/admin/login')

  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  if (!user) redirect('/admin/login')

  const allProjects = await getLabProjects()
  const projeto = allProjects.find(p => p.id === id)
  if (!projeto) notFound()

  // Check access: admin or accepted member
  const isAdmin = user.role === 'admin'
  if (!isAdmin) {
    if (!(projeto.assignedTo ?? []).includes(user.username)) redirect('/area/projetos')
    const { data: resp } = await supabase
      .from('project_responses')
      .select('resposta')
      .eq('projetoId', id)
      .eq('username', user.username)
      .single()
    if (resp?.resposta !== 'aceito') redirect('/area/projetos')
  }

  // Load accepted members for this project
  const { data: acceptedResponses } = await supabase
    .from('project_responses')
    .select('username, name')
    .eq('projetoId', id)
    .eq('resposta', 'aceito')
  const members = (acceptedResponses ?? []) as { username: string; name: string }[]

  // Load tasks
  const { data: taskData } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('projetoId', id)
    .order('order', { ascending: true })
  const tasks = (taskData ?? []) as ProjectTask[]

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/area/projetos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projetos
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{projeto.titulo}</h1>
              {projeto.descricao && (
                <p className="text-gray-500 mt-1 max-w-2xl">{projeto.descricao}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                projeto.status === 'em_andamento' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {projeto.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
              </span>
              {projeto.anoInicio && (
                <span className="text-xs text-gray-400 font-medium">{projeto.anoInicio}</span>
              )}
              <span className="text-xs text-gray-400">{members.length} membro{members.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <KanbanBoard
          projeto={projeto}
          tasks={tasks}
          members={members}
          currentUsername={user.username}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}
