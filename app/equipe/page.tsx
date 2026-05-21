import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getEquipe, getUsers } from '@/lib/data'
import { verifyToken } from '@/lib/auth'
import EquipeClient from './EquipeClient'

export const metadata: Metadata = {
  title: 'Nossa Equipe',
  description:
    'Conheça os pesquisadores, estudantes de pós-graduação e graduação do Núcleo de Genética Humana e Molecular da UFES.',
  alternates: { canonical: 'https://nghm.vercel.app/equipe' },
}

export default async function EquipePage() {
  const equipe = await getEquipe()

  const jar = await cookies()
  const token = jar.get('nghm-admin-token')?.value
  const payload = token ? verifyToken(token) : null

  let currentUsername: string | undefined
  let isAdmin = false

  if (payload) {
    const users = await getUsers()
    const user = users.find(u => u.username === payload.sub)
    if (user) {
      currentUsername = user.username
      isAdmin = user.role === 'admin'
    }
  }

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Nossa Equipe</h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Pesquisadores, estudantes e colaboradores comprometidos com a ciência genômica de excelência.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EquipeClient
          initialEquipe={equipe}
          currentUsername={currentUsername}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}
