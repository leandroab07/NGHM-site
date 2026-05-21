import AdminShell from '@/components/admin/AdminShell'
import UsuariosAdmin from './UsuariosAdmin'
import { getUsers } from '@/lib/data'

export default async function AdminUsuariosPage() {
  const users = (await getUsers()).map(({ passwordHash: _, ...u }) => u)
  return (
    <AdminShell>
      <UsuariosAdmin initialData={users} />
    </AdminShell>
  )
}
