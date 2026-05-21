import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'

// GET /api/members — public user list for any authenticated user
export async function GET(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const users = await getUsers()
  return NextResponse.json(users.map(({ passwordHash: _, ...u }) => u))
}
