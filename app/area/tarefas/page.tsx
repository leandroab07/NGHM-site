import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { PersonalTask, ProjectTask } from '@/lib/types'
import TarefasClient from './TarefasClient'

export const metadata = {
  title: 'Tarefas',
  robots: { index: false },
}

export default async function AreaTarefasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  if (!token) redirect('/admin/login')

  const payload = verifyToken(token)
  if (!payload?.sub) redirect('/admin/login')

  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  if (!user) redirect('/admin/login')

  const isAdmin = user.role === 'admin'

  const members = users.map(u => ({ username: u.username, name: u.name }))

  const [personalRes, projectTasksRes, projects] = await Promise.all([
    supabase.from('personal_tasks').select('*').eq('username', user.username).order('order', { ascending: true }),
    supabase.from('project_tasks').select('*').order('order', { ascending: true }),
    getLabProjects(),
  ])

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.titulo]))

  const myProjectTasks = (projectTasksRes.data ?? [] as ProjectTask[])
    .filter((t: ProjectTask) => Array.isArray(t.assignedTo) && t.assignedTo.includes(user.username))
    .map((t: ProjectTask) => ({ ...t, projetoNome: projectMap[t.projetoId] ?? 'Projeto' }))

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Tarefas</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            {isAdmin ? 'Registro de tarefas de todos os membros.' : 'Suas tarefas de projetos e pessoais.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <TarefasClient
          isAdmin={isAdmin}
          currentUsername={user.username}
          currentName={user.name}
          members={members}
          initialPersonalTasks={(personalRes.data ?? []) as PersonalTask[]}
          initialProjectTasks={myProjectTasks}
        />
      </div>
    </>
  )
}
