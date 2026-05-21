import AdminShell from '@/components/admin/AdminShell'
import EventosAdmin from './EventosAdmin'
import { getEventos } from '@/lib/data'

export default async function AdminEventosPage() {
  return (
    <AdminShell>
      <EventosAdmin initialData={await getEventos()} />
    </AdminShell>
  )
}
