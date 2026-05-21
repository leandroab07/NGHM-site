import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 })
    }

    const users = await getUsers()
    const user = users.find(u => u.username === username)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
    }

    const token = createToken(user.username)
    const response = NextResponse.json({ success: true, role: user.role, name: user.name })
    response.cookies.set('nghm-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
