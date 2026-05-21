import AdminShell from '@/components/admin/AdminShell'
import ProjetosAdmin from './ProjetosAdmin'
import { getProjetos } from '@/lib/data'

export default async function AdminProjetosPage() {
  return (
    <AdminShell>
      <ProjetosAdmin initialData={await getProjetos()} />
    </AdminShell>
  )
}
