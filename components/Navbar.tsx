import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import NavbarClient from './NavbarClient'
import type { PublicUser } from '@/lib/types'

export default async function Navbar() {
  let user: PublicUser | null = null
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('nghm-admin-token')?.value
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        const found = (await getUsers()).find(u => u.username === payload.sub)
        if (found) {
          const { passwordHash: _, ...pub } = found
          user = pub
        }
      }
    }
  } catch {
    // sem autenticação
  }

  return <NavbarClient user={user} />
}
