import AdminShell from '@/components/admin/AdminShell'
import PublicacoesAdmin from './PublicacoesAdmin'
import { getPublicacoes } from '@/lib/data'

export default async function AdminPublicacoesPage() {
  return (
    <AdminShell>
      <PublicacoesAdmin initialData={await getPublicacoes()} />
    </AdminShell>
  )
}
