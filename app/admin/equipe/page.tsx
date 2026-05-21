import AdminShell from '@/components/admin/AdminShell'
import EquipeAdmin from './EquipeAdmin'
import { getEquipe } from '@/lib/data'

export default async function AdminEquipePage() {
  const equipe = await getEquipe()
  return (
    <AdminShell>
      <EquipeAdmin initialData={equipe} />
    </AdminShell>
  )
}
