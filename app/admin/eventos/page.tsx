import AdminShell from '@/components/admin/AdminShell'
import EventosAdmin from './EventosAdmin'
import { getEventos, getUsers } from '@/lib/data'

export default async function AdminEventosPage() {
  const [eventos, users] = await Promise.all([getEventos(), getUsers()])
  const members = users.map(u => ({ username: u.username, name: u.name }))

  return (
    <AdminShell>
      <EventosAdmin initialData={eventos} members={members} />
    </AdminShell>
  )
}
