import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'
import LabProjetosAdmin from './LabProjetosAdmin'
import { getLabProjects, getUsers } from '@/lib/data'

export default async function AdminLabProjetosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  const payload = token ? verifyToken(token) : null

  const [projetos, users] = await Promise.all([getLabProjects(), getUsers()])

  const currentAdminUsername = users.find(u => u.username === payload?.sub)?.username ?? ''

  // Exclude current admin from selection — they're auto-added on the server
  const members = users
    .filter(u => u.username !== currentAdminUsername)
    .map(u => ({ username: u.username, name: u.name }))

  return (
    <AdminShell>
      <LabProjetosAdmin initialData={projetos} members={members} />
    </AdminShell>
  )
}
