import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return NextResponse.json(null)

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json(null)

  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  if (!user) return NextResponse.json(null)

  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}
