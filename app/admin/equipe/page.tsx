import AdminShell from '@/components/admin/AdminShell'
import EquipeAdmin from './EquipeAdmin'
import { getEquipe, getUsers } from '@/lib/data'

export default async function AdminEquipePage() {
  const [equipe, users] = await Promise.all([getEquipe(), getUsers()])
  const userOptions = users.map(u => ({ username: u.username, name: u.name }))
  return (
    <AdminShell>
      <EquipeAdmin initialData={equipe} userOptions={userOptions} />
    </AdminShell>
  )
}
