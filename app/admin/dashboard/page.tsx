import AdminShell from '@/components/admin/AdminShell'
import { getEquipe, getPublicacoes, getEventos, getProjetos } from '@/lib/data'
import Link from 'next/link'

export default async function DashboardPage() {
  const [equipe, publicacoes, eventos, projetos] = await Promise.all([
    getEquipe(), getPublicacoes(), getEventos(), getProjetos(),
  ])

  const today = new Date().toISOString().split('T')[0]
  const eventosProximos = eventos.filter(e => e.data >= today).length

  const stats = [
    { label: 'Membros', value: equipe.length, href: '/admin/equipe', icon: '👥', light: 'bg-blue-50 text-blue-600' },
    { label: 'Publicações', value: publicacoes.length, href: '/admin/publicacoes', icon: '📄', light: 'bg-purple-50 text-purple-600' },
    { label: 'Tarefas Próximas', value: eventosProximos, href: '/admin/eventos', icon: '📅', light: 'bg-teal-50 text-teal-600' },
    { label: 'Projetos', value: projetos.length, href: '/admin/projetos', icon: '🔭', light: 'bg-amber-50 text-amber-600' },
  ]

  const quickLinks = [
    { href: '/admin/equipe', label: 'Adicionar membro', icon: '👤' },
    { href: '/admin/publicacoes', label: 'Adicionar publicação', icon: '📝' },
    { href: '/admin/eventos', label: 'Nova tarefa', icon: '📅' },
    { href: '/admin/projetos', label: 'Novo projeto', icon: '🔬' },
  ]

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vinda, deboradm 👋</h2>
          <p className="text-gray-500 text-sm">Gerencie o conteúdo do site do NGHM.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center text-xl mb-3`}>
                {s.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-gray-500 text-sm mt-0.5 group-hover:text-blue-600 transition-colors">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex flex-col items-center gap-2 p-4 border border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
              >
                <span className="text-2xl">{l.icon}</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Projetos Ativos</h3>
            {projetos.filter(p => p.status === 'em_andamento').length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum projeto ativo.</p>
            ) : (
              <ul className="space-y-2">
                {projetos.filter(p => p.status === 'em_andamento').map(p => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-gray-700 line-clamp-1">{p.titulo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Próximas Tarefas</h3>
            {eventosProximos === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma tarefa agendada.</p>
            ) : (
              <ul className="space-y-2">
                {eventos.filter(e => e.data >= today).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5).map(e => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    <span className="text-gray-700 flex-1 truncate">{e.titulo}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
