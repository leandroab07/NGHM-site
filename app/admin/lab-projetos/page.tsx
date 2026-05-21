import AdminShell from '@/components/admin/AdminShell'
import LabProjetosAdmin from './LabProjetosAdmin'
import { getLabProjects, getUsers } from '@/lib/data'

export default async function AdminLabProjetosPage() {
  const [projetos, users] = await Promise.all([getLabProjects(), getUsers()])
  const members = users.map(u => ({ username: u.username, name: u.name }))

  return (
    <AdminShell>
      <LabProjetosAdmin initialData={projetos} members={members} />
    </AdminShell>
  )
}
